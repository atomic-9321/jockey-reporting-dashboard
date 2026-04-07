# Testing Log — Jockey

## How the AI Agent Uses This
The agent reads this log before generating any "next steps" recommendation. It will: never suggest a test you already ran (unless results were inconclusive), reference past learnings when analyzing current performance, identify patterns across tests, and build on previous conclusions instead of starting from scratch each week.

## Testing Philosophy (From Creative Overview)

### The Core Rule
> "We do not test random ads. We test: Who the product is for (avatar). Why they care (reason). Everything else (format, hook, visual style) supports that."

### What We Test
- **Avatars** — Which person this product is for
- **Reasons to care** — Why that specific person would buy
- We are testing REASONS, not formats

### What We Do NOT Test in Isolation
- Headlines only
- Hooks only
- Multiple reasons mixed in one ad
- Ads "just in case"
- Performance judged by CTR alone

### Monthly Structure
Each month per product per market:
- **6 concepts** — each targets 1 avatar, tests 1 reason to care
- **3 visual variations per concept** — changes format/execution, NOT the avatar or reason
- If the reason changes → it is a new concept, not a variation

### What a Variation Is
Variations change:
- Format (static, GIF, video)
- Visual execution (UGC, studio, flat lay)

Variations do NOT change:
- The avatar
- The reason
- The core message

### How We Measure Success
We look at:
- Which reasons convert best
- CPA stability
- Ability to scale spend without performance breaking

We do NOT pick winners based on:
- Clicks alone
- Likes
- "This feels good"

### How We Iterate (Monthly Cycle)
Each month:
- Keep the strongest reason
- Remove the weakest reason
- Introduce new reasons only if needed
- This turns testing into a learning loop, not guesswork

---

## Testing Framework (Mechanics)
- **One variable at a time** (unless explicitly stated as multivariate)
- **Minimum spend before judging:** €___/£___ per ad variant
- **Minimum duration:** ___ days
- **Statistical confidence:** We don't declare a winner until one variant has significantly more purchases or lower CPA with sufficient conversions per variant
- **Attribution window for test evaluation:** ___

## Test Categories
- `avatar_test` — Different avatars for same product/reason
- `reason_test` — Different reasons to care for same avatar
- `creative_format` — Video vs static vs carousel (same avatar + reason)
- `creative_style` — UGC vs studio vs motion graphics
- `hook_test` — Different first 3 seconds of video
- `audience_test` — Broad vs interest vs lookalike
- `offer_test` — Different discounts, bundles, free shipping thresholds
- `funnel_test` — Moving creatives between TOF/MOF/BOF
- `copy_test` — Different ad copy, same creative
- `product_test` — Different hero products in same format

---

## Concept Templates by Product

### UK Light Lift Bra — Testable Reasons to Care
Based on avatar research and customer voice, these are validated reasons to test:

| # | Avatar | Reason to Care | Angle Category |
|---|--------|---------------|----------------|
| 1 | No-Hardware Minimalist | "Pull on, no hooks, no wires — just comfort" | Relief & Ease |
| 2 | Outfit Workhorse Hunter | "Convertible straps that work under strappy tops and tanks" | Use-Case Outcome |
| 3 | Shape-But-Comfort Seeker | "Light lift without the squeeze — shape without compression" | Outcome First |
| 4 | Recovery & Sensitivity Seeker | "Soft, wire-free, no compression — gentle enough for sensitive days" | Peace-of-Mind |
| 5 | Age 60+ Buyer | "Lifted my 60+ girls better than most standard molded bras" | Calm Testimonial |
| 6 | Bralette Upgrader | "More shape than a bralette, more comfort than a structured bra" | Us vs Them |

### UK Back Smoothing Bralette — Testable Reasons to Care
| # | Avatar | Reason to Care | Angle Category |
|---|--------|---------------|----------------|
| 1 | Band-Betrayal Woman | "No more digging, no more back bulges — the bra that smooths, not squeezes" | Friction Removal |
| 2 | Wardrobe Gatekeeper | "Smooth under T-shirts and work tops — no bumpy back" | Use-Case Outcome |
| 3 | No-Hardware Minimalist | "Slip on, no hooks, no wires — the bra that feels like loungewear" | Relief & Ease |
| 4 | Low-Risk Loyalist | "Once it fits, it becomes your everyday bra — most women come back for more colours" | Social Proof |
| 5 | Size-Anxious Returner | "Clear sizing, easy returns — find your fit without the risk" | Risk Reversal |

### UK Skimmies — Testable Reasons to Care
| # | Avatar | Reason to Care | Angle Category |
|---|--------|---------------|----------------|
| 1 | Shapewear-Weary Upgrader | "Smoothing without suffocation — your daily middle ground" | Blame Shift |
| 2 | Post-Baby Tummy Hugger | "Gently keeps things together without feeling like traditional shapewear" | Peace-of-Mind |
| 3 | Comfort-First Professional | "Smooth under fitted work clothes without counting down to take it off" | Friction Removal |
| 4 | Tall High-Rise Lover | "High-rise that actually reaches your waist — even on taller women" | Objection Call-Out |

### UK Worry Free Brief — Testable Reasons to Care
| # | Avatar | Reason to Care | Angle Category |
|---|--------|---------------|----------------|
| 1 | Liner-Quitter | "Built-in protection that replaces daily liners — looks like normal underwear" | Decision Elimination |
| 2 | VPL Hater | "Seamfree leak protection that works under fitted clothes" | Use-Case Outcome |
| 3 | Eco-Switcher | "Reusable protection — better for you and the planet" | Reason to Switch |
| 4 | Leaker Who Won't Talk About It | "Invisible confidence — no one knows, including you" | Peace-of-Mind |

### UK Classic Y-Front Brief — Testable Reasons to Care
| # | Avatar | Reason to Care | Angle Category |
|---|--------|---------------|----------------|
| 1 | Multi-Decade Traditionalist | "The same softness, the same fit — Jockey hasn't changed what works" | Calm Testimonial |
| 2 | 100% Cotton Purist | "100% combed cotton — because it's nearly impossible to find anywhere else" | Feature Isolation |
| 3 | Active Support-Seeker | "Y-Front support that gently hugs without wrinkling or sagging" | Outcome First |
| 4 | Partner Buyer (wife) | "The ones he always asks for — same style, same brand, same result" | Buying Clarity |

### EU/DE Cotton Stretch Boxer Trunk — Testable Reasons to Care
| # | Avatar | Reason to Care | Angle Category |
|---|--------|---------------|----------------|
| 1 | No-Fuss Commuter | "Anlegen, vergessen — Baumwolle, die mitmacht" | Relief & Ease |
| 2 | Slim-Fit Jeans Guy | "Sitzt sauber unter Slim-Fit — kein Verrutschen, kein Knautschen" | Use-Case Outcome |
| 3 | Value-Oriented Multipack Shopper | "3er-Pack Markenqualität — besser als Einzelkauf bei CK oder Boss" | Buying Clarity |
| 4 | Sensitive Skin Shopper | "95% Baumwolle, kein Kratzen, kein Synthetik-Gefühl" | Feature Isolation |
| 5 | Brand-Trust Believer | "Jockey seit 1876 — Qualität, die nicht nach 3 Wäschen aufgibt" | Build Quality |

---

## Active Tests (Currently Running)
_No active tests logged yet — add as testing begins._

## Completed Tests
_No completed tests logged yet — add as results come in._

## Key Learnings Summary (Quick Reference for AI Agent)
_To be populated from completed tests._

## What We Haven't Tested Yet (AI Agent Can Suggest These)
Based on the Creative Overview framework, the following have NOT been tested:
- Avatar-specific creative for each product (starting from zero)
- Reason-to-care isolation (which single reason converts best per avatar)
- Format performance by avatar (does UGC outperform static for Band-Betrayal Woman?)
- DE vs EN creative angle performance (do the same reasons work in both markets?)
- Objection-handling angles at MOF (naming doubts explicitly)
- Age-inclusive creative featuring 50+/60+ models
- Partner-buyer (wife) creative for UK men's products
- Multipack value messaging at BOF
- "What It Is / Isn't" boundary-setting creative to reduce returns
