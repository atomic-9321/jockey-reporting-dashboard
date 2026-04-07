# Brand Bible — Jockey

> This document is the single source of truth for the Jockey brand. Every ad, report, recommendation, and AI agent output must be consistent with what is written here. If it's not in this document, it's not a safe claim.

---

## 0. Claim Safety System

Every statement in this document has a truth status. The AI agent must check the truth status before using any claim in external-facing output.

### 0.1 Truth Status Definitions

| Status | Tag | Meaning | Agent May Use In |
|---|---|---|---|
| **Verified Spec** | `[SPEC]` | Confirmed product specification from manufacturer or product page | Ad copy, reports, agent insights, landing pages |
| **Review-Backed Claim** | `[REVIEW]` | Directly supported by real customer reviews with traceable source | Ad copy, testimonial-style content, reports |
| **Internal Positioning** | `[INTERNAL]` | Strategic framing language for internal planning. May be directionally accurate but not externally verified. | Internal reports, creative briefs, strategy docs. **Never in ad copy or client-facing claims.** |
| **Internal-Only Strategy** | `[STRATEGY]` | Competitive intelligence, pricing strategy, or tactical planning language | Internal planning only. **Never in any external output.** |
| **Unfilled / Unknown** | `[TBD]` | Field is blank or unverified. No data exists yet. | **Never used anywhere.** Agent must state "claim not yet verified" and skip. |

### 0.2 Agent Rules

- Before using any claim externally, check its tag
- If a claim has no tag, treat it as `[TBD]` — do not use
- `[INTERNAL]` and `[STRATEGY]` content must never appear in ad copy, client reports, or any public-facing output
- `[SPEC]` and `[REVIEW]` are the only tags safe for ad copy
- When the agent references a `[REVIEW]` claim, it should be traceable to a specific review or review theme — not invented
- Competitor-related language is always `[STRATEGY]` unless explicitly tagged otherwise

---

## 1. Brand Identity & Positioning

### 1.1 Core Brand

| Field | Value |
|---|---|
| **Brand Name** | Jockey |
| **Brand Promise** | Everyday comfort you can trust — underwear that works so well you forget you're wearing it `[INTERNAL]` |
| **Brand Archetype** | The Caregiver — comfort, trust, reliability, decades of proven quality |
| **Price Tier** | Mid-Market to Premium (above fast-fashion basics, below luxury fashion underwear) |
| **Category** | Innerwear (underwear, bras, bralettes, shapewear-adjacent briefs) |

### 1.2 Markets

| Market | Currency | Language | Store URL |
|---|---|---|---|
| EU (primarily DE) | EUR (€) | German | ___ |
| UK | GBP (£) | English | ___ |

### 1.3 Brand Positioning Statement

> `[INTERNAL]` Jockey makes underwear that solves real problems — seamfree construction that eliminates dig, wire-free support that doesn't compromise, and cotton quality that lasts years, not months. We don't chase trends. We perfect basics.

---

## 2. Target Audiences

### 2.1 UK Female (Primary)

| Field | Detail |
|---|---|
| **Age Range** | 30–65+ |
| **Psychographics** | Comfort-first, tired of bras/underwear that don't deliver, values reliability over trends, buys when current underwear fails or frustrates, loyal once fit is right |
| **Purchase Triggers** | Worn-out underwear, frustration with current fit (digging, riding up, back bulges), recommendation/review discovery, saw an ad that named her exact problem |
| **Purchase Frequency** | Repeat buyer once fit confirmed — multiple colours, multipacks |
| **Typical First Purchase** | Single bralette or brief to test fit |
| **Typical Repeat Purchase** | Multipacks, additional colours, cross-category (bra + briefs) |
| **Primary Products** | Light Lift Bra, Back Smoothing Bralette, Skimmies, Worry Free Brief |

### 2.2 EU/DE Female (Primary)

| Field | Detail |
|---|---|
| **Age Range** | 28–60 |
| **Psychographics** | Preis-Leistung (value-for-money) conscious, prefers Doppelpack/3er-Pack, searches explicitly for "bügellos" and "ohne Seitennähte", brand-trust matters |
| **Purchase Triggers** | Active search for wire-free alternatives, multipack value, OTTO/Amazon discovery |
| **Typical First Purchase** | 2er-Pack bralette or 3-Pack briefs |
| **Typical Repeat Purchase** | Additional packs, new colours, cross-category |
| **Primary Products** | Light Lift Bra, Back Smoothing Bralette, Skimmies, Worry Free Brief |

### 2.3 UK Male (Primary)

| Field | Detail |
|---|---|
| **Age Range** | 35–85+ |
| **Psychographics** | Extreme brand loyalty (20-40+ year relationships common), values 100% cotton, traditional Y-Front preference, buys in bulk (3, 6, 12-packs) |
| **Purchase Triggers** | Replacement cycle, partner purchasing, "always coming back to Jockey" after trying alternatives |
| **Typical First Purchase** | 3-pack classic brief |
| **Typical Repeat Purchase** | 6-12 pack bulk buy, same style, same size |
| **Primary Products** | Classic Full-Rise Y-Front Brief, Cotton Stretch Boxer Trunk 3-Pack |

### 2.4 EU/DE Male (Primary)

| Field | Detail |
|---|---|
| **Age Range** | 20–55 |
| **Psychographics** | Modern trunk preference, values cotton-dominant fabric, compares against Calvin Klein/Tommy Hilfiger/Boss, practical everyday buyer |
| **Purchase Triggers** | Multipack value vs fashion brands, comfort search, slim-fit trouser compatibility |
| **Typical First Purchase** | Cotton Stretch Boxer Trunk 3-Pack |
| **Typical Repeat Purchase** | Additional packs, different colours |
| **Primary Products** | Cotton Stretch Boxer Trunk 3-Pack |

### 2.5 Secondary Buyer — Gift Purchaser

| Field | Detail |
|---|---|
| **Gender** | Female (buying for male partner) |
| **Relationship to Wearer** | Partner, spouse, parent |
| **Purchase Triggers** | Holiday, birthday, Valentine's Day, Father's Day |
| **Typical Purchase** | Multipacks, repeat of known style/size |
| **Primary Products** | Cotton Stretch Boxer Trunk 3-Pack, Classic Full-Rise Y-Front Brief |

### 2.6 Avatar-to-Product Mapping

| Product | UK Female | EU/DE Female | UK Male | EU/DE Male | Gift Buyer |
|---|---|---|---|---|---|
| Cotton Stretch Boxer Trunk 3-Pack | | | ✅ | ✅ (hero) | ✅ |
| Classic Full-Rise Y-Front Brief | | | ✅ (hero) | | ✅ |
| Light Lift Bra | ✅ (hero) | ✅ (hero) | | | |
| Back Smoothing Bralette | ✅ | ✅ | | | |
| Skimmies | ✅ | ✅ | | | |
| Worry Free Brief | ✅ | ✅ | | | |

> **Hero product** = the lead product for that avatar in prospecting campaigns. Other products are cross-sell or follow-up.

---

## 3. Product Catalog

> Every claim in this section is tagged with a truth status from Section 0. The AI agent must check the tag before using any claim externally. Fields marked `[TBD]` must be filled with verified data before the agent can reference them.

### 3.1 Women's Products

#### Light Lift Bra

| Field | Detail | Status |
|---|---|---|
| **Markets** | EU, UK | `[SPEC]` |
| **Price** | ___ | `[TBD]` |
| **Key Features** | Wire-free, light lift through fabric engineering, seamfree construction, no side seams | `[SPEC]` |
| **Safe Claims (review-backed)** | ___ | `[TBD]` |
| **Claims to NEVER make** | ___ | `[TBD]` |
| **Best Funnel Stage** | TOF: problem identification (wire discomfort) / MOF: feature proof / BOF: buying clarity | `[STRATEGY]` |
| **Best Angles** | Problem Call-Out, Touch & Feel, Feature Isolation, Calm Testimonial | `[STRATEGY]` |
| **DE-specific notes** | Translate as "bügellos" — never "ohne Draht" | `[SPEC]` |

#### Back Smoothing Bralette

| Field | Detail | Status |
|---|---|---|
| **Markets** | EU, UK | `[SPEC]` |
| **Price** | ___ | `[TBD]` |
| **Key Features** | Smooths back lines under clothing, seamfree, wire-free, wide band design | `[SPEC]` |
| **Safe Claims (review-backed)** | ___ | `[TBD]` |
| **Claims to NEVER make** | ___ | `[TBD]` |
| **Best Funnel Stage** | TOF: problem identification (back bulge/VBL) / MOF: before/after proof | `[STRATEGY]` |
| **Best Angles** | Before/After, Problem Call-Out, Lifestyle, Us vs Them | `[STRATEGY]` |
| **DE-specific notes** | ___ | `[TBD]` |

#### Skimmies

| Field | Detail | Status |
|---|---|---|
| **Markets** | EU, UK | `[SPEC]` |
| **Price** | ___ | `[TBD]` |
| **Key Features** | Slip short / anti-chafe, seamfree, lightweight smoothing without compression | `[SPEC]` |
| **Safe Claims (review-backed)** | ___ | `[TBD]` |
| **Claims to NEVER make** | Never position as shapewear or claim "slimming" — it smooths, it doesn't compress | `[SPEC]` |
| **Best Funnel Stage** | TOF: problem identification (thigh chafe, dress discomfort) / MOF: use-case outcome | `[STRATEGY]` |
| **Best Angles** | Day-in-the-Life, Problem Call-Out, Lifestyle, Expectation vs Reality | `[STRATEGY]` |
| **DE-specific notes** | ___ | `[TBD]` |

#### Worry Free Brief

| Field | Detail | Status |
|---|---|---|
| **Markets** | EU, UK | `[SPEC]` |
| **Price** | ___ | `[TBD]` |
| **Key Features** | Leak-proof lining, period protection, seamfree, discreet under clothing | `[SPEC]` |
| **Safe Claims (review-backed)** | ___ | `[TBD]` |
| **Claims to NEVER make** | Never claim "replaces pads/tampons entirely" unless review-backed; never position as medical device | `[SPEC]` |
| **Best Funnel Stage** | TOF: problem identification (leak anxiety) / MOF: testimonial proof / BOF: risk reversal | `[STRATEGY]` |
| **Best Angles** | Problem Call-Out, Calm Testimonial, Risk Reversal, Peace-of-Mind | `[STRATEGY]` |
| **DE-specific notes** | ___ | `[TBD]` |

### 3.2 Men's Products

#### Cotton Stretch Boxer Trunk 3-Pack

| Field | Detail | Status |
|---|---|---|
| **Markets** | EU, UK | `[SPEC]` |
| **Price** | ___ | `[TBD]` |
| **Key Features** | Cotton-stretch blend, 3-pack value, modern trunk fit, tagless waistband | `[SPEC]` |
| **Safe Claims (review-backed)** | ___ | `[TBD]` |
| **Claims to NEVER make** | ___ | `[TBD]` |
| **Best Funnel Stage** | TOF: comparison with fashion brands / MOF: value proposition / BOF: multipack offer | `[STRATEGY]` |
| **Best Angles** | Us vs Them (vs CK/Tommy/Boss), Benefits Call-Out, Feature Isolation | `[STRATEGY]` |
| **DE-specific notes** | Lead with Preis-Leistung angle against CK/Tommy | `[STRATEGY]` |

#### Classic Full-Rise Y-Front Brief

| Field | Detail | Status |
|---|---|---|
| **Markets** | EU, UK | `[SPEC]` |
| **Price** | ___ | `[TBD]` |
| **Key Features** | 100% cotton, traditional Y-Front design, full-rise cut | `[SPEC]` |
| **Unverified Feature** | 5-10 year lifespan (needs review source before use in ads) | `[TBD]` |
| **Safe Claims (review-backed)** | ___ | `[TBD]` |
| **Claims to NEVER make** | ___ | `[TBD]` |
| **Best Funnel Stage** | MOF: loyalty / durability proof / BOF: bulk multipack offer | `[STRATEGY]` |
| **Best Angles** | Calm Testimonial ("20 years and still going"), Feature Isolation (cotton quality), Benefits Call-Out | `[STRATEGY]` |
| **DE-specific notes** | ___ | `[TBD]` |

---

## 4. Competitive Landscape `[STRATEGY]`

> **⚠ This entire section is `[STRATEGY]` — internal-only.** No language from this table may appear in ad copy, client-facing reports, or any external output unless explicitly rewritten and approved as `[REVIEW]` or `[SPEC]` elsewhere in this document. The agent must never reference competitor names, competitor weaknesses, or competitive positioning language in any external context.

| Competitor | Market | Segment | Their Positioning | Their Weakness | Internal Positioning Strategy |
|---|---|---|---|---|---|
| Calvin Klein | EU/DE | Men's trunks | Brand prestige, fashion | Premium price, less cotton, brand tax | Preis-Leistung angle — position as "everyday comfort vs logo tax". Never mention CK by name. Use "fashion brands" or "the logo tax". |
| Tommy Hilfiger | EU/DE | Men's trunks | Fashion-forward design | Less comfort-focused, synthetic-heavy | "Cotton-first, not logo-first" internal framing |
| Hugo Boss | EU/DE | Men's trunks | Luxury association | Over-priced for everyday basics | "Everyday underwear shouldn't cost luxury prices" internal framing |
| SCHIESSER | EU/DE | Women's seamfree | Laser-cut edges, flock anti-slip | Less lift/shape, more technical | We offer lift + seamfree in one. Internal positioning only. |
| UNIQLO | EU/DE | Women's seamfree briefs | Low price (~€9.90/pair) | Basic only, no specialist features | Internal durability angle |
| Marks & Spencer | UK | Bras & briefs | Trusted high-street, wide range | Less specialist, no seamfree innovation | Internal specialist positioning |
| Spanx/Shapewear brands | UK/EU | Women's smoothing | Strong compression/shaping | Uncomfortable, expensive | Internal "lighter alternative" positioning |
| Primark/Budget brands | UK | Men's & women's basics | Rock-bottom price | Short lifespan | Internal long-term value positioning |

> **Ad copy rule:** Never name competitors directly. Use category language only: "fashion brands", "budget underwear", "those wire bras", "your old pair".

---

## 5. Unique Selling Propositions

Ranked by strength in ads, with funnel-stage alignment:

| # | USP | Status | Best Stage | Why It Works | Proof Source |
|---|---|---|---|---|---|
| 1 | **Seamfree construction** — no side seams, no dig, no VBL | `[SPEC]` | TOF + MOF | Names the problem immediately; visual proof works in static and video | Product specs + Customer reviews: ___ |
| 2 | **Wire-free comfort** — support through fabric, not metal | `[SPEC]` | TOF + MOF | Massive pain point for 30-65+ women; instant relatability | Product specs + Customer reviews: ___ |
| 3 | **Honest product positioning** — safe claims only, review-backed | `[STRATEGY]` | MOF + BOF | Builds trust; "calm testimonial" tone differentiates from hype brands | Internal methodology |
| 4 | **Multipack value** — 2er/3er-Packs at fair price | `[SPEC]` | BOF | Rational purchase justification; works in DPA and offer-driven BOF | Pricing / product page |
| 5 | **Long-term durability** — men's Y-Front lasts 5-10 years | `[TBD]` | MOF + BOF | Reframes price as investment; powerful for repeat buyers | Customer reviews: ___ (needs verified source) |
| 6 | **Avatar-specific messaging** — each ad speaks to ONE person about ONE reason | `[STRATEGY]` | All stages | Strategic differentiator in execution, not copy | Internal methodology |

---

## 6. Creative Strategy Framework

### 6.1 Core Testing Philosophy

> "We do not test random ads. We test: Who the product is for. Why they care. Everything else (format, hook, visual style) supports that."

### 6.2 Monthly Testing Structure

- **6 concepts per month** — each targets 1 avatar, tests 1 reason to care
- **3 visual variations per concept** — format/execution changes, NOT message changes
- **If the reason changes, it's a new concept** — never mix reasons in one ad
- **Winners are judged by:** ROAS
- **Winners are NOT judged by:** CTR alone, likes, "feels good"

### 6.3 The Kill Rule

> "If a creative cannot clearly answer: Who is this for? Why do they care? — It does not get made."

### 6.4 Creative Angles by Funnel Stage

> The "Strategy Label" column is internal planning language. The "Parser Category" column is the canonical category used by the naming convention parser (`ad-naming-convention-parser.md`). All reporting, tagging, and agent outputs must use the Parser Category. Strategy labels are for creative briefs only.

| Strategy Label | Parser Category (canonical) | When to Use |
|---|---|---|
| Call-Out, Symptom Highlight, "This Is Why", Cause → Effect | **Problem / Pain Point** | TOF — problem-aware audiences |
| Before/After, Old vs New | **Before / After** | MOF — proof-driven buyers |
| Us vs Them | **Us vs Them / Comparison** | MOF — proof-driven buyers |
| Outcome First, Use-Case Outcome, Wardrobe/Lifestyle Win | **Benefits Call-Out** | TOF/MOF — solution-aware |
| Objection Call-Out, Expectation vs Reality, What It Is/Isn't | **Objection Handling** | MOF — hesitant buyers |
| Calm Testimonial, "I Didn't Expect…", Pattern Recognition | **Calm Testimonial** or **Testimonial / Social Proof** | MOF/BOF — trust building |
| Touch & Feel, Build Quality | **Touch & Feel** | MOF — skeptical buyers |
| Feature Isolation, Myth Busting | **Feature Isolation** | MOF — skeptical buyers |
| Friction Removal, Decision Elimination, Peace-of-Mind | **Buying Clarity** | BOF — fatigued buyers |
| Day-in-the-Life, Real-Life Setting, Moment of Frustration | **Lifestyle / Day-in-the-Life** | TOF — relatable scenarios |
| Buying Clarity, Reason to Switch | **Buying Clarity** | BOF — final push |
| Risk Reversal | **Risk Reversal** | BOF — final push |
| Blame Shift, "Stop Doing This" | **Blame Shift** | TOF — pattern break (use sparingly) |

### 6.5 Avatar × Product × Angle Quick Reference

> Angle labels in this table use parser canonical categories.

| Avatar | Hero Product | Best TOF Angle | Best MOF Angle | Best BOF Angle |
|---|---|---|---|---|
| UK Female 30-65+ | Light Lift Bra | Problem / Pain Point (wire pain) | Calm Testimonial / Touch & Feel | Risk Reversal / Buying Clarity |
| EU/DE Female 28-60 | Light Lift Bra | Problem / Pain Point (bügellos) | Feature Isolation / Us vs Them / Comparison | Offer / Promo (multipack value) |
| UK Male 35-85+ | Y-Front Brief | ___ | Calm Testimonial (loyalty) | Offer / Promo (bulk multipack) |
| EU/DE Male 20-55 | Boxer Trunk 3-Pack | Us vs Them / Comparison (vs fashion brands) | Benefits Call-Out / Feature Isolation | Offer / Promo (Preis-Leistung) |
| Gift Buyer (Female) | Boxer Trunk 3-Pack | ___ | ___ | Offer / Promo (gift bundle) |

---

## 7. Funnel Strategy

### 7.1 TOF — Top of Funnel (Prospecting)

| Field | Detail |
|---|---|
| **Purpose** | Reach new audiences who don't know Jockey. Introduce the problem, earn the click. |
| **Campaign Objective** | ___ |
| **Budget Split** | ___% of total ad spend |
| **Daily Budget EU** | €___ |
| **Daily Budget UK** | £___ |
| **Audiences** | Broad / interest-based / lookalikes — no engagement retargeting |
| **Exclusions** | Exclude all website visitors, all purchasers, all engaged users |
| **Creative Strategy** | Problem identification, relatable scenarios, symptom highlight. Hook must name the problem in <3 seconds. |
| **Primary Format** | Video ___% / Static ___% |
| **Awareness Levels** | Unaware, Problem Aware |
| **Key Metrics** | CPM, CTR (link), Hook Rate (video), ThruPlay Rate (video) |
| **Target Frequency (7-day)** | < 2.0 |

### 7.2 MOF — Middle of Funnel (Consideration)

| Field | Detail |
|---|---|
| **Purpose** | Build product consideration, handle objections, provide social proof, move people closer to purchase |
| **Campaign Objective** | ___ |
| **Budget Split** | ___% of total ad spend |
| **Daily Budget EU** | €___ |
| **Daily Budget UK** | £___ |
| **Audiences** | Website visitors (___-___ days), video viewers (___%), engaged users |
| **Exclusions** | Exclude purchasers (___ days), exclude BOF audiences |
| **Creative Strategy** | Testimonials, feature proof, objection handling. Build trust, not urgency. |
| **Primary Format** | Static ___% / Video ___% / Carousel ___% |
| **Awareness Levels** | Solution Aware |
| **Key Metrics** | CTR (link), Add to Cart Rate, CPA |
| **Target Frequency (7-day)** | < 4.0 |

### 7.3 BOF — Bottom of Funnel (Conversion)

| Field | Detail |
|---|---|
| **Purpose** | Convert high-intent visitors into purchasers. Remove final barriers. |
| **Campaign Objective** | ___ |
| **Budget Split** | ___% of total ad spend |
| **Daily Budget EU** | €___ |
| **Daily Budget UK** | £___ |
| **Audiences** | Add to cart (no purchase, ___ days), checkout initiated (no purchase, ___ days), product page viewers (___+ pages, ___ days), past purchasers (cross-sell, ___-___ days) |
| **Exclusions** | Exclude purchasers (___ days) to avoid post-purchase overlap |
| **Creative Strategy** | Risk reversal, buying clarity, offer-driven, DPA. Make the decision feel easy and safe. |
| **Primary Format** | Static ___% / DPA ___% / Video ___% |
| **Awareness Levels** | Product Aware, Most Aware |
| **Key Metrics** | Conversion Rate, CPA, ROAS, AOV |
| **Target Frequency (7-day)** | < 6.0 |

### 7.4 Budget Split Guidelines

| Scenario | TOF | MOF | BOF |
|---|---|---|---|
| **Growth / Prospecting phase** | 60% | 25% | 15% |
| **Stable / Optimization phase** | 50% | 30% | 20% |
| **Promotional / Sale period** | 40% | 25% | 35% |

> Adjust based on actual performance. These are starting points.

---

## 8. KPI Benchmarks

> Full KPI document with metric definitions, source-of-truth rules, diagnostics, creative evaluation, and scaling logic: see `kpi-benchmarks-jockey.md`. This section contains the core reference numbers.

### 8.1 Account-Level Targets — Meta Only

| KPI | EU Target | EU Floor | UK Target | UK Floor |
|---|---|---|---|---|
| Meta ROAS | 5.0x | 3.0x | 3.67x | 2.2x |
| Meta CPA | €15 | €25 | £15 | £25 |
| Meta AOV | €75 | €50 | £55 | £40 |
| Meta Ad Spend / week | €3,000 | €1,500 | £3,000 | £1,500 |

### 8.2 Account-Level Targets — Store (All Channels)

| KPI | EU Target | EU Floor | UK Target | UK Floor |
|---|---|---|---|---|
| Total Store Revenue / week | €30,000 | €20,000 | £20,000 | £10,000 |
| Store Orders / week | 200 | 100 | 300 | 150 |
| Blended MER | 10.0x | 6.67x | 6.67x | 3.33x |

> ⚠ Store purchases × AOV does not equal revenue target. Review and correct before using for Store-level decisions.

### 8.3 Funnel-Stage Roles

- **TOF:** diagnostic-first (CPM, CTR, Hook Rate). Do not kill TOF solely on ROAS if diagnostics are strong.
- **MOF:** consideration efficiency (Add to Cart, CPA, ROAS)
- **BOF:** conversion efficiency — carries strongest direct ROAS/CPA expectation

| KPI | TOF | MOF | BOF |
|---|---|---|---|
| CPM (EU / UK) | €10 / £10 | — | — |
| Hook Rate (video) | 40% (floor 25%) | — | — |
| Add to Cart Rate | 15% (floor 10%) | 15% (floor 10%) | — |
| Conversion Rate | — | — | ___% |
| Frequency (7-day max) | 2.0 | 4.0 | 6.0 |

### 8.4 Creative Evaluation Rules

| Rule | Value |
|---|---|
| Minimum spend before judging | €/£75 |
| Minimum evaluation window | 3 days |
| Winner threshold (EU) | Meta ROAS ≥ 5.0x |
| Winner threshold (UK) | Meta ROAS ≥ 3.67x |
| Loser threshold (EU) | Meta ROAS < 3.0x after min spend + min days |
| Loser threshold (UK) | Meta ROAS < 2.2x after min spend + min days |
| Top ads ranking | By purchases (desc), min €/£75 spend, tiebreaker = ROAS, same date window |

### 8.5 Spend Allocation Rules

All rules require: minimum spend threshold met, 3+ consecutive days of data, no anomaly period, tracking functioning normally.

| Condition | Action |
|---|---|
| Meta ROAS ≥ target for 3+ consecutive days | Scale budget 15–20% |
| Meta ROAS between floor and target | Maintain budget, optimize creative / audience |
| Meta ROAS below floor for 3+ consecutive days | Reduce budget 15–20%, investigate |
| CPA above floor for 3+ consecutive days | Investigate before pausing — check funnel diagnostics first |
| CPA > €/£50 for 3+ consecutive days | Emergency brake — pause ad, investigate immediately |
| Winner for 7+ consecutive days | Scale budget 15–20%, test in new audiences |
| 3 consecutive losers on same angle, avatar, product, and stage | Pause angle temporarily, review message-market fit |

### 8.6 Diagnostic Action Rules

| Condition | Action |
|---|---|
| CTR below 1.5% (floor) | Creative fatigue or weak hook — rotate creative, test new hooks |
| CPA above €/£25 (floor) | Check audience freshness, reduce overlap, test new angles |
| Meta ROAS below floor | Check audience pool size, review attribution window |
| Add to Cart above target but Conversion below | Checkout friction — investigate checkout, payment methods, shipping |
| Frequency above 7-day max | Ad fatigue — rotate creative or expand audience |
| Hook Rate below 25% (floor) | First 3 seconds aren't working — new hook, same message |

---

## 9. Offer Strategy

### 9.1 Always-On Offers

| Offer | Markets | Notes |
|---|---|---|
| ___ | EU + UK | e.g., "Free shipping over €50/£40" |
| ___ | EU + UK | e.g., "Bundle & save with multipacks" |

### 9.2 Seasonal / Promotional Calendar

| Period | Offer | Discount Depth | Target Avatar | Best Creative Angle | Notes |
|---|---|---|---|---|---|
| Jan — New Year | ___ | ___% | ___ | Fresh Start / New Year Resolution angle | ___ |
| Feb — Valentine's | ___ | ___% | Gift Buyer | Gift bundle / "treat him" | Men's multipacks for partners |
| Mar-Apr — Spring | ___ | ___% | ___ | ___ | ___ |
| May — Mother's Day | ___ | ___% | UK/EU Female | Gift / self-care angle | Women's bralettes/briefs |
| Jun — Father's Day | ___ | ___% | Gift Buyer | "He won't buy it himself" | Men's multipacks |
| Jul-Aug — Summer | ___ | ___% | UK/EU Female | Anti-chafe / Skimmies seasonal push | Caution: avoid "cooling" claims on bralettes |
| Sep — Back to Routine | ___ | ___% | All | Everyday replenishment angle | ___ |
| Oct — Pre-Holiday | ___ | ___% | ___ | ___ | Build retargeting pools for BFCM |
| Nov — BFCM | ___ | ___% | All | Urgency / Offer / Multipack value | All benchmarks are anomalies this week |
| Dec — Holiday / Gifting | ___ | ___% | Gift Buyer | Gift bundle / stocking stuffer | ___ |

---

## 10. Testing Log

> Record every creative test here. The AI agent uses this log to understand what has been tested, what worked, what didn't, and why — so it never recommends retesting something that already has a clear answer.

### 10.1 Test Log Template

| CW | Test Name | Avatar | Product | Hypothesis | Angle | Format | Funnel Stage | Spend | Result (ROAS) | Verdict | Learning | Next Action |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ___ | ___ | ___ | ___ | ___ | ___ | ___ | ___ | €/£___ | ___ | Winner / Loser / Inconclusive | ___ | ___ |

### 10.2 Test Log Rules

- **Every test must have a hypothesis** — "We believe [this angle] will resonate with [this avatar] because [this reason]"
- **Minimum spend threshold before judging:** €/£75
- **Minimum evaluation window:** 3 days
- **Winner definition:** Meta ROAS ≥ account target (EU: 5.0x / UK: 3.67x) after minimum spend + minimum days
- **Loser definition:** Meta ROAS < account floor (EU: 3.0x / UK: 2.2x) after minimum spend + minimum days
- **Inconclusive:** Didn't reach €/£75 spend or 3 days — do not judge, let it run
- **Never retest the exact same hypothesis** — if it failed, change the angle, avatar, or format, not just the visual

### 10.3 Verdicts Over Time

| Quarter | Tests Run | Winners | Losers | Inconclusive | Top Learning |
|---|---|---|---|---|---|
| ___ | ___ | ___ | ___ | ___ | ___ |

---

## 11. Brand Voice

### 11.1 Reporting Voice — Mandatory Positive Framing

| Never Say | Always Say |
|---|---|
| Failed | Learning |
| Wasted budget | Investment in testing |
| Underperforming | Optimization opportunity |
| Lost money | Below target — action plan identified |
| Bad results | Room for improvement |
| Drop / Decline | Shift / Adjustment |
| Problem | Challenge to address |
| Killed the ad | Paused for optimization |
| Worst performing | Lowest priority for scale |
| Burn rate | Investment velocity |
| The creative didn't work | The data suggests a different direction |

### 11.2 Reporting Tone Rules

- Confident but not arrogant
- Data-driven, never emotional
- Forward-looking: always end with next steps
- Never blame creative team — frame as "the data suggests" not "the creative didn't work"
- Client-facing language: assume the reader is a brand marketing director, not a media buyer

### 11.3 Creative Tone (Ad Copy & Insights)

- Relatable over persuasive — sound like a real customer, not a marketer
- Mechanism over motivation — explain WHY something works, not just that it does
- No hype allowed — "no-fuss", "calm", "matter-of-fact" language preferred
- Must be respectful, never preachy — especially for body-related products
- Age-inclusive — explicitly include 50+, 60+, post-baby bodies in messaging
- Evidence-backed only — every claim must be traceable to real customer reviews in the Product Catalog (Section 3)

---

## 12. Website & Conversion Context

| Field | Detail |
|---|---|
| **Platform** | Shopify |
| **Checkout Type** | ___ (Shopify native / Shopify Plus one-page / custom) |
| **Shipping — EU** | ___ (free threshold, standard cost, delivery time) |
| **Shipping — UK** | ___ (free threshold, standard cost, delivery time) |
| **Returns Policy** | ___ |
| **Key Landing Pages** | ___ |
| **Known Conversion Friction** | ___ (e.g., size confusion, shipping cost surprise, no guest checkout) |
| **Post-Purchase Flow** | ___ (email sequences, cross-sell, review request timing) |
| **Pixel Setup** | ___ (Meta Pixel ID, CAPI status, events tracked) |
| **Attribution Window** | ___ (7-day click, 1-day view — or custom) |
| **Known Attribution Discrepancy** | ___ (Meta vs Store gap %, direction) |
| **Google Analytics** | ___ (GA4 property ID, UTM conventions) |

---

## 13. Key Dates & Events That Affect Data

> Log any date that causes a data anomaly so the AI agent and reporting never misinterpret a spike or dip.

| Date | Event | Impact on Data | Account(s) Affected |
|---|---|---|---|
| ___ | ___ | ___ | EU / UK / Both |

---

## 14. Document Maintenance

| Action | Frequency | Owner |
|---|---|---|
| Update Product Catalog safe claims | When new reviews come in or claims change | ___ |
| Update KPI Benchmarks | Monthly (after full month data) | ___ |
| Update Testing Log | Weekly (after each CW analysis) | ___ |
| Update Offer Calendar | Quarterly planning + ad hoc | ___ |
| Update Competitive Landscape | Quarterly or when new competitor emerges | ___ |
| Add Key Dates & Events | As they happen | ___ |
| Full Brand Bible review | Quarterly | ___ |
