# Solar Term Expert Agent — Design Spec

**Date**: 2026-05-24
**Status**: approved

## Overview

A single-file Python Agent (zero dependencies, stdlib only) that answers user questions about the 24 solar terms. Designed for web backend integration — receives a query string, returns a formatted Chinese response.

## Architecture

Single file: `solar_term_agent.py`. One class `SolarTermAgent` with one public method `process(query: str) -> str`.

### Internal modules

| Module | Responsibility |
|--------|---------------|
| `SOLAR_TERMS` (data) | Dict of 24 solar terms with name, pinyin, season, climate, customs, foods, health tips, poem |
| `_extract_term(query)` | Find which solar term the user is asking about via substring matching |
| `_classify_intent(query)` | Weighted keyword scoring across 3 intents: info / health / poem |
| `_get_info(term)` | Return structured info block for a term |
| `_get_health(term)` | Return health/lifestyle suggestions for a term |
| `_get_poem(term)` | Return a pre-written 4-line classical Chinese poem |
| `_format_response()` | Wrap raw tool output into beautiful Chinese Markdown-friendly text |

### Data flow

```
query (str)
  → _extract_term(query) → term_id
  → _classify_intent(query) → intent ∈ {info, health, poem}
  → dispatch tool(term_id) → raw result
  → _format_response(term_id, intent, result) → formatted str
```

### Intent classification (weighted scoring)

Each intent has a keyword→weight map:
- **info** (default/fallback, base score 1): "是什么", "介绍", "习俗", "气候", "含义", "特点"
- **health** (base score 0): "养生", "健康", "饮食", "吃什么", "进补", "起居", "运动", "食疗"
- **poem** (base score 0): "诗", "吟", "赋", "词句", "韵", "写首诗", "作诗"

Iterate through query characters, accumulate scores per intent, return argmax. Info wins ties (safe fallback).

### Term extraction

Iterate 24 term names, check if any appears as substring of query. Returns first match or `None`.

### Edge cases

- **Term not found** → return a response listing all 24 terms with season grouping, asking user to specify
- **Empty query** → return a welcome/usage message
- **Ambiguous intent** → info wins as default

### 24 solar terms data per entry

Each term dict: `id, name, pinyin, season, order, date_range, climate, customs[], foods[], health_tips[], poem`

Health tips are term-specific based on TCM seasonal principles. Poems are 4-line classical Chinese verses pre-written for each term.

## Delivery

- Single file: `solar_term_agent.py`
- Zero dependencies (Python stdlib only)
- Runnable via `python solar_term_agent.py` (includes a `__main__` block for quick testing)
- Primary usage: `agent = SolarTermAgent(); result = agent.process(query)`
