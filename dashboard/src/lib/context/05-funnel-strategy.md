# Funnel Strategy — Jockey

> This document defines how the AI agent understands the objective of each funnel stage, evaluates creative placement, generates insights, and makes recommendations. All benchmarks referenced here are governed by `kpi-benchmarks-jockey.md`. All creative angle labels use parser canonical categories from `ad-naming-convention-parser.md`. All product and audience references must be consistent with `brand-bible-jockey.md`.

---

## 0. How the AI Agent Uses This Document

The agent uses this document to:

- Understand the purpose, audience, and creative strategy of each funnel stage
- Validate whether an ad's parsed funnel stage matches its creative angle and format
- Generate stage-appropriate insights and recommendations
- Diagnose WHERE in the funnel performance is breaking down, not just THAT it's breaking down
- Apply the correct evaluation priority per stage (diagnostic-first at TOF, conversion-first at BOF)

### 0.1 Cross-Document Dependencies

| Document | What This Document Pulls From It |
|---|---|
| `kpi-benchmarks-jockey.md` | All numeric targets, floors, evaluation rules, spend allocation logic, diagnostic action rules |
| `ad-naming-convention-parser.md` | Canonical angle categories, format definitions, funnel stage keywords, product mappings |
| `brand-bible-jockey.md` | Avatar definitions, product catalog, hero product assignments, claim safety tags, brand voice rules |

### 0.2 Rules

- Never duplicate benchmark numbers in this document — always reference `kpi-benchmarks-jockey.md` as the single source of truth
- All creative angle labels in this document use the **parser canonical categories** from `ad-naming-convention-parser.md`, not internal strategy labels
- If a strategy label (e.g., "Call-Out", "Symptom Highlight") is used for context, it must be mapped to its parser category (see Brand Bible Section 6.4)
- All audience and product references must match the definitions in `brand-bible-jockey.md`

---

## 1. TOF — Top of Funnel (Prospecting)

### 1.1 Purpose

Acquire new potential customers who have never interacted with the brand. Drive initial awareness and website visits. Feed the retargeting pools for MOF and BOF.

### 1.2 Audience Definition

| Field | Detail |
|---|---|
| **Audience Types** | Broad / interest-based / lookalikes — no engagement retargeting |
| **Exclusions** | Exclude all website visitors, all purchasers, all engaged users |
| **Awareness Levels** | Unaware, Problem Aware |

### 1.3 Evaluation Priority

> Reference: `kpi-benchmarks-jockey.md` Section 2.1

TOF is **diagnostic-first**. The agent must not kill a TOF campaign solely on ROAS if diagnostic metrics are strong.

**Evaluation order:** CPM → CTR → Hook Rate → Add to Cart Rate → then CPA / ROAS as secondary confirmation.

| Role | KPIs |
|---|---|
| **Primary (diagnostic)** | CPM, CTR (link), Hook Rate (video) |
| **Secondary (efficiency)** | Add to Cart Rate |
| **Monitored (not primary kill signal)** | CPA, Meta ROAS |
| **Saturation control** | Frequency (7-day max: 2.0) |

### 1.4 Creative Strategy

**Objective:** Make the right person stop scrolling, feel seen, and click.

**Rules:**
- Each ad targets ONE avatar with ONE reason to care
- 3 visual variations per concept
- If the reason changes, it's a new concept
- Kill rule: if it can't answer "Who is this for? Why do they care?" — it doesn't get made
- Video: first 3 seconds must hook — problem or outcome first, product reveal by second 3–5
- UGC preferred over studio for relatable categories (comfort underwear)

**Tone:** Relatable over persuasive. Sound like a real customer naming a real frustration.

### 1.5 Creative Angles (Parser Canonical Categories)

| Parser Category | Strategy Labels (internal only) | Format | Notes |
|---|---|---|---|
| Problem / Pain Point | Call-Out, Symptom Highlight, "This Is Why", Cause → Effect | Static, UGC | Names the problem the customer already feels |
| Before / After | Before / After | Static, GIF | Must be controlled and believable |
| Benefits Call-Out | Outcome First | Static, Video | Starts with the result, not the product |
| Lifestyle / Day-in-the-Life | Day-in-the-Life, Real-Life Setting, Moment of Frustration | Timeline Video, UGC | Avoid studio polish |
| Blame Shift | Blame Shift | Static, UGC | Extremely high resonance for body-related categories — use sparingly |

### 1.6 Avatar × Hero Product at TOF

> Reference: `brand-bible-jockey.md` Section 2.6 and Section 6.5

| Avatar | Hero Product | Best TOF Angle (Parser Category) |
|---|---|---|
| UK Female 30–65+ | Light Lift Bra | Problem / Pain Point (wire pain) |
| EU/DE Female 28–60 | Light Lift Bra | Problem / Pain Point (bügellos) |
| UK Male 35–85+ | Classic Full-Rise Y-Front Brief | ___ |
| EU/DE Male 20–55 | Cotton Stretch Boxer Trunk 3-Pack | Us vs Them / Comparison (vs fashion brands) |
| Gift Buyer (Female) | Cotton Stretch Boxer Trunk 3-Pack | ___ |

---

## 2. MOF — Middle of Funnel (Warm Retargeting)

### 2.1 Purpose

Re-engage people who showed initial interest but haven't purchased. Build product consideration, handle objections, provide social proof, and move people closer to purchase.

### 2.2 Audience Definition

| Field | Detail |
|---|---|
| **Audience Types** | Website visitors (___–___ days), video viewers (___%), engaged users |
| **Exclusions** | Exclude purchasers (___ days), exclude BOF audiences |
| **Awareness Levels** | Solution Aware |

### 2.3 Evaluation Priority

> Reference: `kpi-benchmarks-jockey.md` Section 2.2

MOF is **consideration efficiency**. CPA, ROAS, and Add to Cart Rate are all primary.

| Role | KPIs |
|---|---|
| **Primary** | CTR (link), Add to Cart Rate, CPA, Meta ROAS |
| **Saturation control** | Frequency (7-day max: 4.0) |

### 2.4 Creative Strategy

**Objective:** Overcome doubt, build trust, prove the product delivers.

**Rules:**
- Address the specific objection or doubt the avatar has
- Use REAL customer language from reviews (see `brand-bible-jockey.md` Section 3, safe claims only)
- Never stack multiple reasons — one reason per ad
- Social proof must be "calm testimonial" style — no hype, no exaggeration
- Product demo / touch-and-feel videos perform strongly here

**Tone:** Matter-of-fact. Evidence over enthusiasm.

### 2.5 Creative Angles (Parser Canonical Categories)

| Parser Category | Strategy Labels (internal only) | Format | Notes |
|---|---|---|---|
| Objection Handling | Objection Call-Out, What It Is / Isn't, Myth Busting | Static, UGC | "You might think…" — mid-funnel gold |
| Expectation vs Reality | Expectation vs Reality | Static | Comparison shoppers |
| Calm Testimonial | Calm Testimonial, "I Didn't Expect…" | UGC | No hype allowed |
| Testimonial / Social Proof | Customer Story, Pattern Recognition | UGC | Must be review-backed (`[REVIEW]` tag) |
| Us vs Them / Comparison | Us vs Them | Split Static | Keep factual, not aggressive. Never name competitors (see Brand Bible Section 4) |
| Benefits Call-Out | Use-Case Outcome, Wardrobe / Lifestyle Win | UGC, Demo | Very Savannah-coded |
| Touch & Feel | Touch & Feel, Build Quality | Hands Video, Close-Up | Works when trust matters |
| Feature Isolation | Feature Isolation | Static | Never stack features — one feature, one benefit |
| Before / After | Before / After | Static, GIF | Proof-driven buyers |

### 2.6 Avatar × Hero Product at MOF

> Reference: `brand-bible-jockey.md` Section 6.5

| Avatar | Hero Product | Best MOF Angle (Parser Category) |
|---|---|---|
| UK Female 30–65+ | Light Lift Bra | Calm Testimonial / Touch & Feel |
| EU/DE Female 28–60 | Light Lift Bra | Feature Isolation / Us vs Them / Comparison |
| UK Male 35–85+ | Classic Full-Rise Y-Front Brief | Calm Testimonial (loyalty) |
| EU/DE Male 20–55 | Cotton Stretch Boxer Trunk 3-Pack | Benefits Call-Out / Feature Isolation |
| Gift Buyer (Female) | Cotton Stretch Boxer Trunk 3-Pack | ___ |

---

## 3. BOF — Bottom of Funnel (Conversion / Hot Retargeting)

### 3.1 Purpose

Convert high-intent visitors (cart abandoners, repeat visitors, engaged audiences) into purchasers. Remove final barriers to purchase.

### 3.2 Audience Definition

| Field | Detail |
|---|---|
| **Audience Types** | Add to cart (no purchase, ___ days), checkout initiated (no purchase, ___ days), product page viewers (___+ pages, ___ days), past purchasers (cross-sell, ___–___ days) |
| **Exclusions** | Exclude purchasers (___ days) to avoid post-purchase overlap |
| **Awareness Levels** | Product Aware, Most Aware |

### 3.3 Evaluation Priority

> Reference: `kpi-benchmarks-jockey.md` Section 2.3

BOF carries the **strongest direct conversion expectation**. CPA, ROAS, and AOV are all primary.

| Role | KPIs |
|---|---|
| **Primary** | Conversion Rate, CPA, Meta ROAS, Meta AOV |
| **Secondary** | CTR (link) |
| **Saturation control** | Frequency (7-day max: 6.0) |

> **Note:** BOF Conversion Rate benchmark is not yet defined. See `kpi-benchmarks-jockey.md` Section 2.3. Agent must state "benchmark not yet defined" and rely on other populated KPIs.

### 3.4 Creative Strategy

**Objective:** Make the purchase decision feel easy, safe, and obvious.

**Rules:**
- Multipack value messaging strongest here
- Risk reversal (returns, size guidance) is a conversion lever, not an afterthought
- DPA for winner products with clear product imagery
- Keep it simple — one reason, one action, one product
- Offer / promo messaging and urgency are high-performers at BOF

**Tone:** Simple. Reassuring. Obvious next step.

### 3.5 Creative Angles (Parser Canonical Categories)

| Parser Category | Strategy Labels (internal only) | Format | Notes |
|---|---|---|---|
| Buying Clarity | Buying Clarity, Reason to Switch, Decision Elimination | Static | "Who this is for" — makes the decision easy |
| Risk Reversal | Risk Reversal | Static | Simple, credible only |
| Offer / Promo | Offer, Bundle, Free Shipping, Promo Code | Static, DPA | Multipack value, seasonal promotions |
| Urgency / Scarcity | Urgency, Limited, Last Chance, Countdown | Static | Use only when offer is real — never manufacture false scarcity |
| Calm Testimonial | Peace-of-Mind, Calm Reassurance | Static | Very effective for older demos |
| Benefits Call-Out | Friction Removal | Static, Video | "No more adjusting / fixing" |

### 3.6 Avatar × Hero Product at BOF

> Reference: `brand-bible-jockey.md` Section 6.5

| Avatar | Hero Product | Best BOF Angle (Parser Category) |
|---|---|---|
| UK Female 30–65+ | Light Lift Bra | Risk Reversal / Buying Clarity |
| EU/DE Female 28–60 | Light Lift Bra | Offer / Promo (multipack value) |
| UK Male 35–85+ | Classic Full-Rise Y-Front Brief | Offer / Promo (bulk multipack) |
| EU/DE Male 20–55 | Cotton Stretch Boxer Trunk 3-Pack | Offer / Promo (Preis-Leistung) |
| Gift Buyer (Female) | Cotton Stretch Boxer Trunk 3-Pack | Offer / Promo (gift bundle) |

---

## 4. Campaign Types

### 4.1 Hero Product Campaigns

| Field | Detail |
|---|---|
| **Structure** | Dedicated creative for one product, full funnel (TOF → MOF → BOF) |
| **Products** | Cotton Stretch Boxer Trunk 3-Pack (EU/DE Male), Classic Full-Rise Y-Front Brief (UK Male), Light Lift Bra (UK/EU Female), Back Smoothing Bralette (UK/EU Female), Skimmies (UK/EU Female), Worry Free Brief (UK/EU Female) |
| **Evaluation** | Apply stage-specific benchmarks from `kpi-benchmarks-jockey.md` Sections 2.1–2.3 |

### 4.2 DPA — Winner Products

| Field | Detail |
|---|---|
| **Structure** | Dynamic Product Ads for top-performing products |
| **Funnel Stage** | BOF — retargeting viewers and cart abandoners |
| **Format** | DPA (product feed with clear imagery) |
| **Evaluation** | Apply BOF benchmarks: CPA, ROAS, AOV from `kpi-benchmarks-jockey.md` Section 2.3 |
| **Parser mapping** | Format = DPA; Funnel = BOF (explicit or via fallback table — DPA defaults to BOF regardless of frequency) |

### 4.3 DPA — Collections

| Field | Detail |
|---|---|
| **Structure** | Dynamic Product Ads for full collections |
| **Funnel Stage** | BOF — broad retargeting |
| **Format** | DPA (catalogue-driven) |
| **Evaluation** | Apply BOF benchmarks. Monitor AOV closely — catalogue DPA can pull AOV down if low-price products dominate the feed |
| **Parser mapping** | Format = DPA; Funnel = BOF |

---

## 5. Budget Split Guidelines

> Reference: `brand-bible-jockey.md` Section 7.4

| Scenario | TOF | MOF | BOF |
|---|---|---|---|
| **Growth / Prospecting phase** | 60% | 25% | 15% |
| **Stable / Optimization phase** | 50% | 30% | 20% |
| **Promotional / Sale period** | 40% | 25% | 35% |

> Adjust based on actual performance. These are starting points.

---

## 6. Creative-to-Funnel Mapping (Quick Reference)

> All angle labels use parser canonical categories from `ad-naming-convention-parser.md`.

| Parser Category (Canonical) | TOF | MOF | BOF |
|---|:---:|:---:|:---:|
| Problem / Pain Point | ✅ | | |
| Before / After | ✅ | ✅ | |
| Benefits Call-Out | ✅ | ✅ | |
| Lifestyle / Day-in-the-Life | ✅ | | |
| Blame Shift | ✅ | | |
| Objection Handling | | ✅ | |
| Expectation vs Reality | | ✅ | |
| Calm Testimonial | | ✅ | ✅ |
| Testimonial / Social Proof | | ✅ | |
| Us vs Them / Comparison | | ✅ | |
| Touch & Feel | | ✅ | |
| Feature Isolation | | ✅ | |
| Buying Clarity | | | ✅ |
| Risk Reversal | | | ✅ |
| Offer / Promo | | | ✅ |
| Urgency / Scarcity | | | ✅ |

### 6.1 Misplacement Detection Rule

The agent should flag when a parsed ad's funnel stage does not match the expected stage for its angle:

| Condition | Agent Action |
|---|---|
| Ad angle is BOF-only (Buying Clarity, Risk Reversal, Offer / Promo) but parsed funnel = TOF | Flag: "Creative angle suggests BOF placement — verify campaign setup" |
| Ad angle is TOF-only (Problem / Pain Point, Blame Shift) but parsed funnel = BOF | Flag: "Creative angle suggests TOF placement — verify campaign setup" |
| Ad angle spans multiple stages (e.g., Calm Testimonial = MOF + BOF) | No flag — valid placement in either stage |

---

## 7. Funnel Health Diagnostics

> Reference: `kpi-benchmarks-jockey.md` Section 6

The agent uses these rules to diagnose WHERE in the funnel performance is breaking down.

| Symptom | Stage | Diagnosis | Recommended Action |
|---|---|---|---|
| High TOF impressions but low MOF pool size | TOF → MOF | Creative isn't driving clicks — hooks are weak | Test new hooks, keep same message |
| Good CTR but low Add to Cart | TOF / MOF | Landing page mismatch or wrong product for audience | Review LP, check product-audience fit |
| Good Add to Cart but low Purchase | MOF → BOF | Checkout friction (shipping cost, payment methods, trust) | Investigate checkout flow |
| High Frequency + declining CTR | Any | Ad fatigue | Rotate creative, expand audience |
| Meta ROAS declining week over week but spend is stable | Any | Audience saturation or creative decay | Refresh creative, test new audiences |
| Strong MOF engagement but BOF isn't converting | MOF → BOF | BOF creative is too weak or offer isn't compelling | Test new BOF angles, review offer strategy |
| CPM suddenly spikes | TOF | Auction competition increased (seasonal, competitor entry) | Check if competitors launched campaigns, adjust bids |
| AOV dropping | BOF | Customers buying fewer items per order or cheaper products | Push multipacks, review DPA product mix |
| Meta ROAS strong but Blended MER declining | Cross-stage | Meta is cannibalizing organic/direct traffic, not generating incremental revenue | Review attribution, test incrementality, check organic channel trends |
| Blended MER strong but Meta ROAS weak | Cross-stage | Other channels (email, organic, direct) are carrying the business | Investigate Meta's contribution to top-of-funnel awareness before cutting |

---

## 8. Stage Exclusion Logic

> The agent should flag misconfigurations when audience exclusions are missing or overlapping between stages.

| Stage | Must Exclude | Reason |
|---|---|---|
| **TOF** | All website visitors, all purchasers, all engaged users | TOF must only reach cold audiences — any warm traffic inflates TOF metrics artificially |
| **MOF** | All purchasers (___ days), all BOF custom audiences | Prevents MOF from taking credit for BOF-intent users |
| **BOF** | Recent purchasers (___ days) | Prevents post-purchase ad fatigue and wasted spend on converted users |

| Misconfiguration | Agent Action |
|---|---|
| TOF campaign includes website visitors in audience | Flag: "TOF audience includes warm traffic — metrics will be inflated. Exclude site visitors." |
| MOF campaign does not exclude purchasers | Flag: "MOF audience may include existing customers — exclude purchasers to measure true consideration." |
| BOF campaign does not exclude recent purchasers | Flag: "BOF may be serving ads to recent buyers — exclude purchasers (X days) to avoid waste." |

---

## 9. Document Maintenance

| Action | Frequency | Owner |
|---|---|---|
| Review funnel audience definitions and fill `___` fields | Before launch / quarterly | ___ |
| Validate creative-to-funnel mapping against live campaigns | Monthly | ___ |
| Update avatar × product × angle tables when new products launch | As needed | ___ |
| Cross-check with `kpi-benchmarks-jockey.md` when benchmarks change | Monthly | ___ |
| Review misplacement flags from agent logs | Weekly | ___ |
