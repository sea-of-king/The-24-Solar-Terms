package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql"
	"github.com/redis/go-redis/v9"
)

const (
	cacheKey       = "tree-hole:messages:v2"
	cacheTTL       = 30 * time.Second
	requestTimeout = 3 * time.Second
)

var errInvalidMessage = errors.New("留言内容需在 5 到 280 字之间，季节只能是春夏秋冬")

type message struct {
	ID        int64     `json:"id"`
	Nickname  string    `json:"nickname"`
	Season    string    `json:"season"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	LikeCount int       `json:"likeCount"`
	Liked     bool      `json:"liked"`
	Comments  []comment `json:"comments"`
} //数据结构体，对应数据库中的留言表

type comment struct {
	ID        int64     `json:"id"`
	MessageID int64     `json:"messageId"`
	ParentID  *int64    `json:"parentId,omitempty"`
	Nickname  string    `json:"nickname"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	Replies   []comment `json:"replies,omitempty"`
}

type createMessageRequest struct {
	Nickname string `json:"nickname"`
	Season   string `json:"season"`
	Content  string `json:"content"`
} //请求体结构体

type reactionRequest struct {
	VisitorID string `json:"visitorId"`
}
type createCommentRequest struct {
	VisitorID string `json:"visitorId"`
	Nickname  string `json:"nickname"`
	Content   string `json:"content"`
	ParentID  *int64 `json:"parentId"`
}

func main() {
	dsn := env("TREE_HOLE_DSN", "root:root@tcp(127.0.0.1:3306)/solar_terms?charset=utf8mb4&parseTime=True&loc=Local")
	port := env("TREE_HOLE_PORT", "8080")

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	configureDatabasePool(db)

	startupCtx, cancel := context.WithTimeout(context.Background(), requestTimeout)
	defer cancel()
	if err := db.PingContext(startupCtx); err != nil {
		log.Fatal(err)
	}
	cache := redis.NewClient(&redis.Options{Addr: env("TREE_HOLE_REDIS_ADDR", "127.0.0.1:6379"), Password: os.Getenv("TREE_HOLE_REDIS_PASSWORD")})
	defer cache.Close()

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), requestTimeoutMiddleware(requestTimeout))
	router.Use(treeHoleCORS())

	router.GET("/api/tree-hole/health", func(c *gin.Context) {
		ctx, cancel := cacheContext(c.Request.Context())
		defer cancel()
		databaseOK := db.PingContext(ctx) == nil
		cacheOK := cache.Ping(ctx).Err() == nil
		code := http.StatusOK
		if !databaseOK || !cacheOK {
			code = http.StatusServiceUnavailable
		}
		c.JSON(code, gin.H{"ok": databaseOK && cacheOK, "database": databaseOK, "redis": cacheOK})
	})

	router.GET("/api/tree-hole/messages", func(c *gin.Context) {
		items, err := listMessages(c.Request.Context(), db, cache, strings.TrimSpace(c.GetHeader("X-Visitor-ID")))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "读取留言失败"})
			return //gin.H 就是 Gin 里快速生成 JSON 的快捷键
		}
		c.JSON(http.StatusOK, gin.H{"data": items})
	})

	router.POST("/api/tree-hole/messages", func(c *gin.Context) {
		var req createMessageRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "请求格式错误"})
			return //gin.H 就是 Gin 里快速生成 JSON 的快捷键
		}

		item, err := createMessage(c.Request.Context(), db, cache, req)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return //gin.H 就是 Gin 里快速生成 JSON 的快捷键
		}

		c.JSON(http.StatusCreated, gin.H{"data": item})
	})

	router.POST("/api/tree-hole/messages/:id/like", func(c *gin.Context) {
		var req reactionRequest
		if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.VisitorID) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"message": "需要访客标识"})
			return
		}
		id, err := parseID(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "帖子编号错误"})
			return
		}
		liked, count, err := toggleLike(c.Request.Context(), db, cache, id, req.VisitorID)
		if err != nil {
			statusCode := http.StatusInternalServerError
			if errors.Is(err, sql.ErrNoRows) {
				statusCode = http.StatusNotFound
			}
			c.JSON(statusCode, gin.H{"message": "点赞失败"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"liked": liked, "likeCount": count})
	})

	router.POST("/api/tree-hole/messages/:id/comments", func(c *gin.Context) {
		var req createCommentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "请求格式错误"})
			return
		}
		id, err := parseID(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "帖子编号错误"})
			return
		}
		item, err := createComment(c.Request.Context(), db, cache, id, req)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"data": item})
	})

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	go func() {
		log.Printf("tree-hole server listening on :%s", port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("tree-hole graceful shutdown failed: %v", err)
	}
}

func listMessages(ctx context.Context, db *sql.DB, cache *redis.Client, visitorID string) ([]message, error) {
	cacheCtx, cancel := cacheContext(ctx)
	cached, cacheErr := cache.Get(cacheCtx, cacheKey).Result()
	cancel()
	if cacheErr == nil {
		var items []message
		if json.Unmarshal([]byte(cached), &items) == nil {
			if err := applyViewerLikes(ctx, db, items, visitorID); err != nil {
				return nil, err
			}
			return items, nil
		}
	}
	rows, err := db.QueryContext(ctx, `
		SELECT m.id, m.nickname, m.season, m.content, m.created_at,
		       (SELECT COUNT(*) FROM tree_hole_likes l WHERE l.message_id = m.id)
		FROM tree_hole_messages m
		ORDER BY m.id DESC
		LIMIT 8
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []message
	for rows.Next() {
		var item message
		if err := rows.Scan(&item.ID, &item.Nickname, &item.Season, &item.Content, &item.CreatedAt, &item.LikeCount); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := loadComments(ctx, db, items); err != nil {
		return nil, err
	}
	if encoded, err := json.Marshal(items); err == nil {
		cacheCtx, cancel := cacheContext(ctx)
		_ = cache.Set(cacheCtx, cacheKey, encoded, cacheTTL).Err()
		cancel()
	}
	if err := applyViewerLikes(ctx, db, items, visitorID); err != nil {
		return nil, err
	}
	return items, nil
}

func createMessage(ctx context.Context, db *sql.DB, cache *redis.Client, req createMessageRequest) (message, error) {
	req.Nickname = strings.TrimSpace(req.Nickname)
	req.Season = strings.TrimSpace(req.Season)
	req.Content = strings.TrimSpace(req.Content)

	if req.Nickname == "" {
		req.Nickname = "无名来信"
	}

	if !isValidSeason(req.Season) || len([]rune(req.Content)) < 5 || len([]rune(req.Content)) > 280 {
		return message{}, errInvalidMessage
	}

	result, err := db.ExecContext(ctx, `
		INSERT INTO tree_hole_messages (nickname, season, content)
		VALUES (?, ?, ?)
	`, req.Nickname, req.Season, req.Content)
	if err != nil {
		return message{}, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return message{}, err
	}
	invalidateCache(ctx, cache)

	return message{
		ID:        id,
		Nickname:  req.Nickname,
		Season:    req.Season,
		Content:   req.Content,
		CreatedAt: time.Now(),
	}, nil
}

func parseID(value string) (int64, error) {
	id, err := strconv.ParseInt(value, 10, 64)
	if err != nil || id < 1 {
		return 0, errors.New("invalid id")
	}
	return id, nil
}

func toggleLike(ctx context.Context, db *sql.DB, cache *redis.Client, messageID int64, visitorID string) (bool, int, error) {
	visitorID = strings.TrimSpace(visitorID)
	if visitorID == "" || len(visitorID) > 64 {
		return false, 0, errors.New("invalid visitor id")
	}
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return false, 0, err
	}
	defer tx.Rollback()
	var existingID int64
	if err := tx.QueryRowContext(ctx, "SELECT id FROM tree_hole_messages WHERE id = ? FOR UPDATE", messageID).Scan(&existingID); err != nil {
		return false, 0, err
	}
	result, err := tx.ExecContext(ctx, "DELETE FROM tree_hole_likes WHERE message_id = ? AND visitor_id = ?", messageID, visitorID)
	if err != nil {
		return false, 0, err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return false, 0, err
	}
	liked := false
	if affected == 0 {
		if _, err := tx.ExecContext(ctx, "INSERT INTO tree_hole_likes (message_id, visitor_id) VALUES (?, ?)", messageID, visitorID); err != nil {
			return false, 0, err
		}
		liked = true
	}
	var count int
	if err := tx.QueryRowContext(ctx, "SELECT COUNT(*) FROM tree_hole_likes WHERE message_id = ?", messageID).Scan(&count); err != nil {
		return false, 0, err
	}
	if err := tx.Commit(); err != nil {
		return false, 0, err
	}
	invalidateCache(ctx, cache)
	return liked, count, nil
}

func createComment(ctx context.Context, db *sql.DB, cache *redis.Client, messageID int64, req createCommentRequest) (comment, error) {
	req.Nickname, req.Content = strings.TrimSpace(req.Nickname), strings.TrimSpace(req.Content)
	if req.Nickname == "" {
		req.Nickname = "无名来信"
	}
	if strings.TrimSpace(req.VisitorID) == "" || len([]rune(req.Content)) < 1 || len([]rune(req.Content)) > 280 {
		return comment{}, errors.New("评论内容需在 1 到 280 字之间")
	}
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return comment{}, err
	}
	defer tx.Rollback()
	var existingID int64
	if err := tx.QueryRowContext(ctx, "SELECT id FROM tree_hole_messages WHERE id = ? FOR UPDATE", messageID).Scan(&existingID); err != nil {
		return comment{}, err
	}
	if req.ParentID != nil {
		var parentMessageID int64
		var grandparent sql.NullInt64
		if err := tx.QueryRowContext(ctx, "SELECT message_id, parent_id FROM tree_hole_comments WHERE id = ?", *req.ParentID).Scan(&parentMessageID, &grandparent); err != nil || parentMessageID != messageID || grandparent.Valid {
			return comment{}, errors.New("只能回复一级评论")
		}
	}
	result, err := tx.ExecContext(ctx, "INSERT INTO tree_hole_comments (message_id, parent_id, nickname, content) VALUES (?, ?, ?, ?)", messageID, req.ParentID, req.Nickname, req.Content)
	if err != nil {
		return comment{}, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return comment{}, err
	}
	if err := tx.Commit(); err != nil {
		return comment{}, err
	}
	item := comment{ID: id, MessageID: messageID, ParentID: req.ParentID, Nickname: req.Nickname, Content: req.Content, CreatedAt: time.Now()}
	invalidateCache(ctx, cache)
	return item, nil
}

func loadComments(ctx context.Context, db *sql.DB, items []message) error {
	if len(items) == 0 {
		return nil
	}
	placeholders := make([]string, len(items))
	args := make([]any, len(items))
	for index := range items {
		placeholders[index], args[index] = "?", items[index].ID
		items[index].Comments = make([]comment, 0)
	}
	rows, err := db.QueryContext(ctx, "SELECT id, message_id, parent_id, nickname, content, created_at FROM tree_hole_comments WHERE message_id IN ("+strings.Join(placeholders, ",")+") ORDER BY message_id ASC, id ASC", args...)
	if err != nil {
		return err
	}
	defer rows.Close()
	roots := make(map[int64][]comment, len(items))
	replies := make(map[int64][]comment)
	for rows.Next() {
		var item comment
		var parent sql.NullInt64
		if err := rows.Scan(&item.ID, &item.MessageID, &parent, &item.Nickname, &item.Content, &item.CreatedAt); err != nil {
			return err
		}
		if parent.Valid {
			item.ParentID = &parent.Int64
			replies[parent.Int64] = append(replies[parent.Int64], item)
		} else {
			roots[item.MessageID] = append(roots[item.MessageID], item)
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for index := range items {
		for rootIndex := range roots[items[index].ID] {
			root := &roots[items[index].ID][rootIndex]
			root.Replies = replies[root.ID]
		}
		items[index].Comments = roots[items[index].ID]
	}
	return nil
}

func applyViewerLikes(ctx context.Context, db *sql.DB, items []message, visitorID string) error {
	if visitorID == "" || len(items) == 0 {
		return nil
	}
	placeholders := make([]string, len(items))
	args := make([]any, 0, len(items)+1)
	args = append(args, visitorID)
	for index := range items {
		placeholders[index] = "?"
		args = append(args, items[index].ID)
	}
	rows, err := db.QueryContext(ctx, "SELECT message_id FROM tree_hole_likes WHERE visitor_id = ? AND message_id IN ("+strings.Join(placeholders, ",")+")", args...)
	if err != nil {
		return err
	}
	defer rows.Close()
	liked := make(map[int64]struct{}, len(items))
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return err
		}
		liked[id] = struct{}{}
	}
	if err := rows.Err(); err != nil {
		return err
	}
	for index := range items {
		_, items[index].Liked = liked[items[index].ID]
	}
	return nil
}

func isValidSeason(value string) bool {
	switch value {
	case "春", "夏", "秋", "冬":
		return true
	default:
		return false
	}
}

func env(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func envInt(key string, fallback int) int {
	value, err := strconv.Atoi(env(key, strconv.Itoa(fallback)))
	if err != nil || value < 1 {
		return fallback
	}
	return value
}

func configureDatabasePool(db *sql.DB) {
	maxOpen := envInt("TREE_HOLE_DB_MAX_OPEN_CONNS", 20)
	maxIdle := envInt("TREE_HOLE_DB_MAX_IDLE_CONNS", 10)
	if maxIdle > maxOpen {
		maxIdle = maxOpen
	}
	db.SetMaxOpenConns(maxOpen)
	db.SetMaxIdleConns(maxIdle)
	db.SetConnMaxLifetime(time.Duration(envInt("TREE_HOLE_DB_CONN_MAX_LIFETIME_SECONDS", 180)) * time.Second)
	db.SetConnMaxIdleTime(time.Duration(envInt("TREE_HOLE_DB_CONN_MAX_IDLE_SECONDS", 60)) * time.Second)
}

func requestTimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

func cacheContext(parent context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(parent, 250*time.Millisecond)
}

func invalidateCache(ctx context.Context, cache *redis.Client) {
	cacheCtx, cancel := cacheContext(ctx)
	defer cancel()
	if err := cache.Del(cacheCtx, cacheKey).Err(); err != nil {
		log.Printf("tree-hole cache invalidation failed: %v", err)
	}
}

func treeHoleCORS() gin.HandlerFunc {
	allowedOrigins := make(map[string]struct{})
	for _, origin := range strings.Split(env("TREE_HOLE_CORS_ORIGINS", "http://localhost,http://127.0.0.1"), ",") {
		if normalized := strings.TrimSpace(origin); normalized != "" {
			allowedOrigins[normalized] = struct{}{}
		}
	}
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if _, allowed := allowedOrigins[origin]; allowed {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, X-Visitor-ID, X-Request-ID")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
