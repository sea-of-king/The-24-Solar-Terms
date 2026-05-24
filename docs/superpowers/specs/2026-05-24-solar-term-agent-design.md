# Solar Term Expert Agent — Design Spec

**Date**: 2026-05-24
**Status**: approved (v2)

## Overview

A single-file Python Agent (zero dependencies, stdlib only) that answers user questions about the 24 solar terms. Designed for web backend integration — receives a query string, returns a formatted Chinese response.

Three subsystems:
- **LangGraph engine** — lightweight state graph orchestrating the pipeline
- **Agent core** — 6 tools + weighted-keyword intent classifier
- **RAG module** — in-code knowledge base + Jaccard retrieval + template generation

## Architecture

Single file: `solar_term_agent.py`. One class `SolarTermAgent` with `process(query: str) -> str`.

### LangGraph state graph

```
extract_term → classify_intent → dispatch_tool → format_response
                    │                │
                    ▼                ▼
              6-intent scoring   route to 1 of 6 tools
```

State dict flows along edges: `{query, term?, intent?, tool_result?, response?}`. Each node reads state, writes new keys, passes to next node.

`SimpleStateGraph` (~20 lines): `add_node(name, fn)` + `add_edge(from, to)` + `run(state)`. Runs nodes in topological order. No cycles needed — the pipeline is strictly linear.

### 6 tools + 6 intents

| # | Tool | Intent | Trigger keywords | Function |
|---|------|--------|-----------------|----------|
| 1 | `_query_basic_profile` | `basic_info` | 是什么/介绍/特点/习俗/物候 | 节气时序、物候特征、起源民俗 |
| 2 | `_health_regimen_suggest` | `health` | 养生/吃什么/作息/进补/饮食 | 时令膳食、作息调养建议 |
| 3 | `_generate_classical_poem` | `poem` | 诗/吟/赋/词/韵/作诗 | 生成古典短诗 |
| 4 | `_document_retrieval` | `knowledge` | 为什么/典故/古籍/由来/详细/深入 | 本地知识库检索典故延伸 |
| 5 | `_meteorological_analysis` | `weather` | 气候/天气/冷/热/雨/雪/温度/降水 | 节气气候特点与变化规律 |
| 6 | `_farming_calendar_guide` | `farming` | 农事/种/收/耕/播种/农谚/庄稼 | 传统农耕劳作参考 |

Each intent has a `dict[str, int]` keyword→weight map. `_classify_intent` iterates query chars, sums per-intent scores, returns argmax. `basic_info` has base weight 1 as safe fallback; all others start at 0.

### Data flow

```
query (str)
  → SimpleStateGraph.run({query})
    → node_extract: term_id found via substring match on 24 term names
    → node_classify: intent selected via weighted keyword scoring
    → node_dispatch: route to 1 of 6 tool functions
    → node_format: wrap tool output in cultural Chinese template
  → return state["response"]
```

### RAG module (`_document_retrieval`)

Three-step minimal RAG:
1. **Knowledge base** — 15-20 short documents in-code, covering: solar term astronomy, historical origins, TCM theory, farming principles, climate patterns, cultural anecdotes
2. **Retrieval** — tokenize query (simple char bigram split), compute Jaccard similarity against each doc, return top-2
3. **Generation** — template merge: "关于{term}的{aspect}，古籍与农书有载：{retrieved}。结合现代理解：{summary}"

### SOLAR_TERMS data per entry

Each of the 24 terms: `id, name, pinyin, season, order, date_range, climate, customs[], foods[], health_tips[], poem, meteorology, farming_guide, knowledge_snippets[]`

### Edge cases

- **Term not found** → "未能识别节气，请提及具体节气名称（如立春、冬至），或描述你想了解的方向。"
- **Empty query** → brief usage guide listing all 6 capabilities
- **Ambiguous intent** → `basic_info` wins (base score 1)

## Delivery

- Single file: `solar_term_agent.py`
- Zero dependencies (Python stdlib only)
- Direct test: `python solar_term_agent.py` (includes `__main__` block)
- Web usage: `agent = SolarTermAgent(); result = agent.process(query)`
