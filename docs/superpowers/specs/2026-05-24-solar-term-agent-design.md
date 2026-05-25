# Solar Term Expert Agent — Design Spec

**Date**: 2026-05-24
**Status**: approved (v3)

## Overview

A single-file Python Agent (zero dependencies, stdlib only) that answers user questions about the 24 solar terms. Designed for web backend integration — receives a query string, returns a formatted Chinese response.

Two subsystems:
- **Agent core** — 6 tools + weighted-keyword intent classifier
- **Knowledge base** — in-code term data with `knowledge_snippets[]` for direct lookup

## Architecture

Single file: `solar_term_agent.py`. One class `SolarTermAgent` with `process(query: str) -> str`.

### Pipeline

```
query → extract_term → classify_intent → dispatch_tool → format_response
```

Direct sequential calls within `process()`. No state graph or orchestration layer — each step is a method that receives explicit arguments and returns a value.

```
def process(self, query: str) -> str:
    term = self._extract_term(query)
    intent = self._classify_intent(query)
    result = self._dispatch_tool(term, intent, query)
    return self._format_response(term, intent, result)
```

### 6 tools + 6 intents

| # | Tool | Intent | Trigger keywords | Function |
|---|------|--------|-----------------|----------|
| 1 | `_query_basic_profile` | `basic_info` | 是什么/介绍/特点/习俗/物候 | 节气时序、物候特征、起源民俗 |
| 2 | `_health_regimen_suggest` | `health` | 养生/吃什么/作息/进补/饮食 | 时令膳食、作息调养建议 |
| 3 | `_generate_classical_poem` | `poem` | 诗/吟/赋/词/韵/作诗 | 生成古典短诗 |
| 4 | `_document_retrieval` | `knowledge` | 为什么/典故/古籍/由来/详细/深入 | 从 `knowledge_snippets[]` 直接取典故延伸 |
| 5 | `_meteorological_analysis` | `weather` | 气候/天气/冷/热/雨/雪/温度/降水 | 节气气候特点与变化规律 |
| 6 | `_farming_calendar_guide` | `farming` | 农事/种/收/耕/播种/农谚/庄稼 | 传统农耕劳作参考 |

Each intent has a `dict[str, int]` keyword→weight map. `_classify_intent` iterates query chars, sums per-intent scores, returns argmax. `basic_info` has base weight 1 as safe fallback; all others start at 0.

### Data flow

```
query (str)
  → _extract_term: term_id found via substring match on 24 term names
  → _classify_intent: intent selected via weighted keyword scoring
  → _dispatch_tool: route to 1 of 6 tool functions, passing (term, query)
  → _format_response: wrap tool output in cultural Chinese template
  → return formatted response string
```

### Knowledge retrieval (`_document_retrieval`)

Simplified direct lookup — no retrieval pipeline:

1. Receive `term` (term_id) from the pipeline
2. Index into `SOLAR_TERMS[term].knowledge_snippets[]` — a list of pre-curated cultural/historical snippets for that term
3. Format: join snippets and wrap in template — "关于{term}的典故与文化背景：{snippets}。若需深入了解，可进一步询问具体方面。"

No Jaccard similarity, no document tokenization, no top-k selection. The snippets are already term-scoped, so matching is deterministic.

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
