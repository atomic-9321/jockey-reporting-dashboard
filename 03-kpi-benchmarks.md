KPI Benchmarks — Jockey

> The AI agent compares every metric against these benchmarks to determine what's performing well (scale), what's within range (maintain), and what's below target (optimize). Without these benchmarks, the agent cannot distinguish between a good and bad result.

---

## 0. Metric Definitions & Source of Truth

All benchmarks in this document must be compared only against metrics from the same source and time window.

| Metric | Definition | Source of Truth |
|---|---|---|
| **Meta ROAS** | Meta-attributed purchase revenue ÷ Meta ad spend | Meta Ads Manager |
| **Meta CPA** | Meta ad spend ÷ Meta-attributed purchases | Meta Ads Manager |
| **Meta AOV** | Meta-attributed purchase revenue ÷ Meta-attributed purchases | Meta Ads Manager |
| **Total Store Revenue** | Total store revenue from all channels (organic, direct, paid, email, etc.) | Store |
| **Store Orders** | Total orders from all channels | Store |
| **Store AOV** | Total store revenue ÷ total orders | Store |
| **Blended MER** | Total store revenue ÷ Meta ad spend | Store revenue + Meta spend |
| **Frequency** | 7-day frequency unless stated otherwise | Meta Ads Manager |

### Rules

- Never compare Meta-only ROAS to Store total revenue as if they are the same metric
- Revenue, purchases, AOV, CPA, and ROAS must be internally consistent within their source
- Weekly numbers must use the same reporting window across all compared KPIs
- All monetary metrics must show the correct currency symbol (€ for EU, £ for UK) — never mix or convert

---

## 0.1 Benchmark Consistency Rule

Before a benchmark is approved, it must pass these checks:

- **Revenue ≈ Purchases × AOV** (within the same source)
- **ROAS ≈ AOV ÷ CPA** (within Meta-only metrics)
- If Total Store Revenue is used with Meta Ad Spend, label it as **Blended MER**, not Meta ROAS
- If benchmarks do not reconcile, the agent must treat them as invalid and avoid making scale / pause decisions from them

### Current Reconciliation Status

> **⚠ Store-level targets do not fully reconcile.** The purchase × AOV products do not equal the revenue targets. Review and correct one of the three values (purchases, AOV, or revenue) before the agent uses these for Store-level decisions. Meta-level targets reconcile correctly.

| Check | EU | UK | Status |
|---|---|---|---|
| Meta ROAS ≈ AOV ÷ CPA | €75 ÷ €15 = 5.0x ✓ | £55 ÷ £15 = 3.67x ✓ | ✅ Reconciled |
| Meta ROAS floor ≈ AOV ÷ CPA floor | €75 ÷ €25 = 3.0x ✓ | £55 ÷ £25 = 2.2x ✓ | ✅ Reconciled |
| Store: Purchases × AOV ≈ Revenue | 200 × €75 = €15,000 ≠ €30,000 | 300 × £55 = £16,500 ≠ £20,000 | ❌ Does not reconcile |

---

## 1. Account-Level Targets

### 1.1 EU Account

**Meta-Only Metrics (Source: Meta Ads Manager)**

| KPI | Target | Floor (Minimum Acceptable) |
|---|---|---|
| Meta ROAS | 5.0x | 3.0x |
| Meta CPA | €15 | €25 |
| Meta AOV | €75 | €50 |
| Meta Ad Spend / week | €3,000 | €1,500 |

**Store-Wide Metrics (Source: Store)**

| KPI | Target | Floor (Minimum Acceptable) | Reconciliation Note |
|---|---|---|---|
| Total Store Revenue / week | €30,000 | €20,000 | ⚠ Does not reconcile with 200 orders × €75 AOV = €15,000. Correct purchases, AOV, or revenue. |
| Store Orders / week | 200 | 100 | |
| Store AOV | €75 | €50 | |

**Blended Metrics (Source: Store + Meta)**

| KPI | Target | Floor (Minimum Acceptable) |
|---|---|---|
| Blended MER (Store Revenue ÷ Meta Spend) | 10.0x | 6.67x |

### 1.2 UK Account

**Meta-Only Metrics (Source: Meta Ads Manager)**

| KPI | Target | Floor (Minimum Acceptable) |
|---|---|---|
| Meta ROAS | 3.67x | 2.2x |
| Meta CPA | £15 | £25 |
| Meta AOV | £55 | £40 |
| Meta Ad Spend / week | £3,000 | £1,500 |

**Store-Wide Metrics (Source: Store)**

| KPI | Target | Floor (Minimum Acceptable) | Reconciliation Note |
|---|---|---|---|
| Total Store Revenue / week | £20,000 | £10,000 | ⚠ Does not reconcile with 300 orders × £55 AOV = £16,500. Correct purchases, AOV, or revenue. |
| Store Orders / week | 300 | 150 | |
| Store AOV | £55 | £40 | |

**Blended Metrics (Source: Store + Meta)**

| KPI | Target | Floor (Minimum Acceptable) |
|---|---|---|
| Blended MER (Store Revenue ÷ Meta Spend) | 6.67x | 3.33x |

---

## 2. Funnel-Stage Benchmarks

Stage-level benchmarks serve different roles by funnel stage:

- **TOF:** diagnostic-first — evaluated on traffic quality and audience-building efficiency, not direct ROAS
- **MOF:** consideration efficiency — evaluated on engagement depth and cost-efficiency
- **BOF:** conversion efficiency — carries the strongest direct conversion expectation

### Rule

The agent must not treat TOF, MOF, and BOF as equally responsible for direct efficiency. BOF carries the strongest direct conversion expectation. TOF is evaluated primarily on quality of traffic and audience-building efficiency. Killing a TOF campaign for low ROAS when its diagnostic metrics are strong is a mistake.

### 2.1 TOF — Prospecting

| KPI | EU Target | EU Floor | UK Target | UK Floor | Role |
|---|---|---|---|---|---|
| CPM | €10 | €15 | £10 | £15 | Diagnostic |
| CTR (link) | 2.5% | 1.5% | 2.5% | 1.5% | Diagnostic |
| Hook Rate (video) | 40% | 25% | 40% | 25% | Diagnostic |
| Add to Cart Rate | 15% | 10% | 15% | 10% | Secondary efficiency |
| CPA | €15 | €25 | £15 | £25 | Monitored (not primary kill signal) |
| Meta ROAS | 5.0x | 3.0x | 3.67x | 2.2x | Monitored (not primary kill signal) |
| Frequency (7-day max) | 2.0 | — | 2.0 | — | Saturation control |

**TOF evaluation priority:** CPM → CTR → Hook Rate → Add to Cart Rate → then CPA/ROAS as secondary confirmation. Do not kill a TOF ad solely on ROAS if diagnostic metrics are strong.

### 2.2 MOF — Consideration

| KPI | EU Target | EU Floor | UK Target | UK Floor | Role |
|---|---|---|---|---|---|
| CTR (link) | 2.5% | 1.5% | 2.5% | 1.5% | Diagnostic |
| Add to Cart Rate | 15% | 10% | 15% | 10% | Primary |
| CPA | €15 | €25 | £15 | £25 | Primary |
| Meta ROAS | 5.0x | 3.0x | 3.67x | 2.2x | Primary |
| Frequency (7-day max) | 4.0 | — | 4.0 | — | Saturation control |

### 2.3 BOF — Conversion

| KPI | EU Target | EU Floor | UK Target | UK Floor | Role |
|---|---|---|---|---|---|
| CTR (link) | 2.5% | 1.5% | 2.5% | 1.5% | Secondary |
| Conversion Rate | ___% | ___% | ___% | ___% | Primary |
| CPA | €15 | €25 | £15 | £25 | Primary |
| Meta ROAS | 5.0x | 3.0x | 3.67x | 2.2x | Primary |
| Meta AOV | €75 | €50 | £55 | £40 | Primary |
| Frequency (7-day max) | 6.0 | — | 6.0 | — | Saturation control |

> **Note:** BOF Conversion Rate is blank. When filling this, use the checkout conversion rate from BOF Meta traffic specifically — not the blended storewide conversion rate which includes high-intent branded search and direct traffic. Meta BOF will convert lower than blended average.

---

## 3. Spend Allocation Rules

These rules apply **only** when:
- the campaign or ad set has passed the minimum evaluation threshold (€/£75 spend, 3 days)
- the data is not during a known anomaly period (BFCM, site outage, pixel issue)
- attribution and tracking are functioning normally

| Condition | Action |
|---|---|
| Meta ROAS ≥ target and spend threshold met for 3+ consecutive days | Scale budget by 15–20% |
| Meta ROAS between floor and target for 3+ consecutive days | Maintain budget and optimize creative / audience mix |
| Meta ROAS below floor for 3+ consecutive days after minimum spend threshold | Reduce budget 15–20% and investigate |
| CPA above floor for 3+ consecutive days after minimum spend threshold | Investigate before pausing — check funnel diagnostics first |
| Frequency above stage max and CTR declining | Rotate creative or expand audience before scaling spend |

---

## 4. Creative Performance Benchmarks

> These rules define how the AI agent and media buyer evaluate individual ad performance. They prevent premature kills and fluky winners.

### 4.1 Evaluation Rules

| Rule | Value |
|---|---|
| **Minimum spend before judging** | €/£75 per ad |
| **Minimum evaluation window** | 3 days |
| **Winner ROAS threshold** | Meta ROAS ≥ account target (EU: 5.0x / UK: 3.67x) |
| **Loser ROAS threshold** | Meta ROAS < account floor (EU: 3.0x / UK: 2.2x) after min spend + min days |
| **Inconclusive** | Has not yet reached €/£75 spend OR has not run for 3 days — do not judge |

### 4.2 Creative Verdict Definitions

| Verdict | Criteria | Action |
|---|---|---|
| **Winner** | Meta ROAS ≥ target after €/£75+ spend over 3+ days | Scale: increase budget, duplicate to new audiences, keep running |
| **Strong Performer** | Meta ROAS between floor and target after €/£75+ spend over 3+ days | Maintain: keep running, monitor for improvement or decline |
| **Loser** | Meta ROAS < floor after €/£75+ spend over 3+ days | Pause: do not scale, log learning in Testing Log, move to next test |
| **Inconclusive** | Below €/£75 spend OR fewer than 3 days running | Wait: let it run until both thresholds are met before judging |

### 4.3 Creative Scaling Rules

| Condition | Action |
|---|---|
| Winner for 7+ consecutive days | Increase budget 15–20%, test in new audience segments |
| Winner that drops below floor for 3+ consecutive days after scaling | Reduce budget back to pre-scale level, do not kill |
| 3 consecutive losers on the same angle, same avatar, same product, same funnel stage | Pause that angle temporarily and review message-market fit before retesting |
| 3 consecutive losers on the same product across multiple avatars and formats | Review product-market fit, offer strength, and landing page before more creative testing |

### 4.4 Top Ads Ranking Logic

When the AI agent identifies "top performing ads," it must use this ranking method:

1. **Primary rank:** Purchases (descending)
2. **Minimum spend filter:** Only ads with ≥ €/£75 spend qualify
3. **Tiebreaker:** Meta ROAS (descending)
4. **Date window:** Ranking must use the same reporting window for all ads being compared

> This prevents low-spend flukes from appearing as top performers. An ad with 1 purchase at 10x ROAS from €5 spend is not a winner — it's noise.

---

## 5. AI Agent Benchmark Rules

### 5.1 Performance Language

| Condition | Agent Language |
|---|---|
| Within 10% of target | "On track" |
| 10–25% above target | "Strong performance" |
| 25%+ above target | "Exceptional — consider scaling" |
| 10–25% below floor | "Optimization opportunity identified" |
| 25%+ below floor | "Requires immediate attention — action plan recommended" |

### 5.2 Agent Rules

- When comparing weekly data, always reference the benchmark from this document
- Never say a metric is "bad" — always frame as distance from benchmark with a recommended action
- During known seasonal periods (BFCM, holiday), acknowledge that benchmarks may not apply and flag data as seasonal
- If a metric is missing or unavailable, state "data unavailable" — never estimate or invent a number
- All monetary metrics must show the correct currency symbol (€ for EU, £ for UK) — never mix or convert
- Always specify whether a metric is Meta-sourced or Store-sourced when presenting data

### 5.3 Blank Benchmark Rule

Any benchmark left blank (`___`) must be treated as unavailable.

Agent behavior:
- Do not estimate missing thresholds
- Do not call performance above or below target for that KPI
- State: "benchmark not yet defined"
- Rely on the other populated KPIs instead

---

## 6. Funnel Health Diagnostics

> The AI agent uses these rules to diagnose WHERE in the funnel performance is breaking down, not just THAT it's breaking down.

| Symptom | Diagnosis | Recommended Action |
|---|---|---|
| High TOF impressions but low MOF pool size | Creative isn't driving clicks — hooks are weak | Test new hooks, keep same message |
| Good CTR but low Add to Cart | Landing page mismatch or wrong product for audience | Review LP, check product-audience fit |
| Good Add to Cart but low Purchase | Checkout friction (shipping cost, payment methods, trust) | Investigate checkout flow |
| High Frequency + declining CTR | Ad fatigue | Rotate creative, expand audience |
| Meta ROAS declining week over week but spend is stable | Audience saturation or creative decay | Refresh creative, test new audiences |
| Strong MOF engagement but BOF isn't converting | BOF creative is too weak or offer isn't compelling | Test new BOF angles, review offer strategy |
| CPM suddenly spikes | Auction competition increased (seasonal, competitor entry) | Check if competitors launched campaigns, adjust bids |
| AOV dropping | Customers buying fewer items per order or cheaper products | Push multipacks, review DPA product mix |
| Meta ROAS strong but Blended MER declining | Meta is cannibalizing organic/direct traffic, not generating incremental revenue | Review attribution, test incrementality, check organic channel trends |
| Blended MER strong but Meta ROAS weak | Other channels (email, organic, direct) are carrying the business — Meta may not be efficient | Investigate Meta's contribution to top-of-funnel awareness before cutting |