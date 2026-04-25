(function () {
  var appData = window.SolarTermsAppData = window.SolarTermsAppData || {};

  appData.timelineScenes = [
    {
      id: "spring-awakening",
      title: "春启 · 雷与新芽",
      representedTermIds: ["lichun", "yushui", "jingzhe"],
      mediaType: "poster",
      posterImage: "assets/images/timeline/spring-awakening.svg",
      themeText: "嫩绿与雨丝交织，地气回升，春雷轻轻击开沉睡的土壤。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "spring-clarity",
      title: "春明 · 烟雨与花枝",
      representedTermIds: ["chunfen", "qingming", "guyu"],
      mediaType: "poster",
      posterImage: "assets/images/timeline/spring-clarity.svg",
      themeText: "纸鸢高飞，花影轻晃，烟雨把春色铺成细密而明净的层次。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "summer-bloom",
      title: "夏启 · 青叶与风",
      representedTermIds: ["lixia", "xiaoman", "mangzhong"],
      mediaType: "poster",
      posterImage: "assets/images/timeline/summer-bloom.svg",
      themeText: "荷叶、麦穗与暖风相遇，夏意刚刚建立，所有生长都变得鲜明。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "midsummer-radiance",
      title: "盛夏 · 日耀流光",
      representedTermIds: ["xiazhi", "xiaoshu", "dashu"],
      mediaType: "poster",
      posterImage: "assets/images/timeline/midsummer-radiance.svg",
      themeText: "炽烈的日光与热浪叠加，水面反光、蝉鸣与雷阵雨共同构成盛夏氛围。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "autumn-harvest",
      title: "秋成 · 金风与丰实",
      representedTermIds: ["liqiu", "chushu", "bailu"],
      mediaType: "poster",
      posterImage: "assets/images/timeline/autumn-harvest.svg",
      themeText: "金风渐起，谷穗低垂，空气从湿热转向清爽，收获感慢慢堆满视野。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "autumn-clarity",
      title: "秋深 · 霜叶与长空",
      representedTermIds: ["qiufen", "hanlu", "shuangjiang"],
      mediaType: "poster",
      posterImage: "assets/images/timeline/autumn-clarity.svg",
      themeText: "白露转寒露，红叶与霜色一层层铺开，秋天的轮廓逐渐清峻。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "winter-rest",
      title: "冬藏 · 初雪与炉火",
      representedTermIds: ["lidong", "xiaoxue", "daxue"],
      mediaType: "poster",
      posterImage: "assets/images/timeline/winter-rest.svg",
      themeText: "风更静，雪更近，炉火与厚衣成为冬季最温暖的视觉中心。",
      assetPolicy: "hide-on-missing"
    },
    {
      id: "winter-renewal",
      title: "冬极 · 长夜与回阳",
      representedTermIds: ["dongzhi", "xiaohan", "dahan"],
      mediaType: "poster",
      posterImage: "assets/images/timeline/winter-renewal.svg",
      themeText: "最寒的时节也是新旧交替的门槛，长夜中藏着回暖与新岁的光。",
      assetPolicy: "hide-on-missing"
    }
  ];

  appData.getTimelineSceneById = function (sceneId) {
    return (appData.timelineScenes || []).find(function (item) {
      return item.id === sceneId;
    }) || null;
  };
})();
