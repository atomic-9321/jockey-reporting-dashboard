# Funnel Strategy — Jockey

## How the AI Agent Uses This
The agent uses this document to: understand why each campaign exists and what success looks like at each stage, evaluate whether campaigns are doing what they were designed to do, recommend moving creatives between stages based on performance, identify funnel bottlenecks, and match creative angles to the correct funnel stage.

## Funnel Architecture Overview

### Structure
- **Total Stages:** 3 (TOF → MOF → BOF)
- **Campaign Objective by Stage:**
  - TOF: ___
  - MOF: ___
  - BOF: ___
- **Campaign Structure:** ___
- **Attribution Window:** ___
- **Optimization Event:** ___

### Budget Allocation
| Stage | % of Total Budget | EU Weekly Budget | UK Weekly Budget | Rationale |
|-------|-------------------|------------------|------------------|-----------|
| TOF | ___% | €___ | £___ | Feed the funnel with new audiences |
| MOF | ___% | €___ | £___ | Re-engage warm audiences |
| BOF | ___% | €___ | £___ | Convert high-intent audiences |
| Testing | ___% | €___ | £___ | Separate — never borrowed from active campaigns |
| **Total** | 100% | €___ | £___ | |

### Budget Rules
- If BOF ROAS drops below ___ for 3+ days → reallocate to TOF to feed the funnel
- If TOF CPA exceeds target → reduce budget, investigate creative
- Never let BOF spend exceed ___% of total — diminishing returns on small retargeting pools
- Testing budget is separate and never borrowed from active campaigns

---

## TOF — Top of Funnel (Prospecting)

### Purpose
Acquire new potential customers who have never interacted with the brand. Drive initial awareness and website visits. Feed the retargeting pools for MOF and BOF.

### Creative Strategy at TOF

**Objective:** Make the right person stop scrolling, feel seen, and click.

**Best creative angles for TOF (from Creative Overview):**

| Angle | What It Does | Format | Notes |
|-------|-------------|--------|-------|
| Call-Out | Directly names the problem the customer already feels | Static, UGC | "If you're dealing with X, this is for you" |
| Symptom Highlight | Shows the result of the problem, not the cause | Static, GIF | Works well as thumbstoppers |
| "This Is Why" | Explains why the problem exists | Static diagram, short video | Mechanism > motivation |
| Cause → Effect | One clear cause, one clear outcome | Static, video | Savannah staple for trust |
| Before / After | Same person, same setup, different result | Static, GIF | Must be controlled and believable |
| Outcome First | Starts with the result, not the product | Static, video | "Here's what changes" |
| Day-in-the-Life | Product over time | Timeline video | Time-based signal |
| Real-Life Setting | Normal environment | UGC | Avoid studio polish |
| Blame Shift | Removes self-blame | Static, UGC | Extremely high resonance for body-related categories |
| Moment of Frustration | Captures pain moment | UGC | Emotion without drama |

**TOF creative rules (from Creative Overview):**
- Each ad targets ONE avatar with ONE reason to care
- 3 visual variations per concept
- If the reason changes, it's a new concept
- Kill rule: if it can't answer "Who is this for? Why do they care?" — it doesn't get made
- Video: first 3 seconds must hook — problem or outcome first, product reveal by second 3-5
- UGC preferred over studio for relatable categories (comfort underwear)

**TOF tone:** Relatable over persuasive. Sound like a real customer naming a real frustration.

### Success Metrics at TOF
| Metric | Target | Action if Below | Action if Above |
|--------|--------|----------------|-----------------|
| Hook Rate | ___% | Rework first 3 seconds | Scale, use as template |
| CTR (link) | ___% | Creative fatigue, swap | Scale |
| CPC | €/£___ | Check audience overlap | Maintain |
| CPM | €/£___ | Audience too narrow | Efficient reach |
| CPA | €/£___ | Reduce budget, test new creative | Scale 20% |
| ROAS | ___ | Expected to be low at TOF — don't panic | Scale aggressively |
| Frequency (7d) | ___ max | Above = creative fatigue | Fine |

### Graduation Rules (TOF → Scale or Kill)
- After €/£___ spend on an ad:
  - CPA below target + CTR above threshold → **Scale** (increase budget 20%)
  - CPA in range → **Maintain** (watch 3 more days)
  - CPA above max → **Pause** (creative needs iteration)
- If hook rate below threshold after 5,000 impressions → kill immediately

---

## MOF — Middle of Funnel (Warm Retargeting)

### Purpose
Re-engage people who showed initial interest but haven't purchased. Build product consideration, handle objections, provide social proof, and move people closer to purchase.

### Creative Strategy at MOF

**Objective:** Overcome doubt, build trust, prove the product delivers.

**Best creative angles for MOF (from Creative Overview):**

| Angle | What It Does | Format | Notes |
|-------|-------------|--------|-------|
| Objection Call-Out | Names the doubt explicitly | Static, UGC | "You might think…" — mid-funnel gold |
| Expectation vs Reality | What they expect vs what happens | Static | Comparison shoppers |
| What It Is / Isn't | Sets clear boundaries | Static | Reduces friction and returns |
| Calm Testimonial | Matter-of-fact user insight | UGC | No hype allowed |
| "I Didn't Expect…" | Pleasant surprise framing | UGC | Signals authenticity |
| Us vs Them | Brand vs category norm | Split static | Keep factual, not aggressive |
| Use-Case Outcome | Shows real-life benefit | UGC, demo | Very Savannah-coded |
| Wardrobe / Lifestyle Win | Shows how life improves | Try-on, mirror | Focus on function |
| Touch & Feel | Physical interaction demo | Hands video | Savannah favorite |
| Feature Isolation | One feature, one benefit | Static | Never stack features |
| Build Quality | Construction focus | Close-up | Works when trust matters |
| Myth Busting | Breaks common belief | Static text | Must be evidence-backed |

**MOF creative rules:**
- Address the specific objection or doubt the avatar has
- Use REAL customer language from reviews (see product catalog safe claims)
- Never stack multiple reasons — one reason per ad
- Social proof must be "calm testimonial" style — no hype, no exaggeration
- Product demo/touch-and-feel videos perform strongly here

**MOF tone:** Honest, evidence-backed, "the data says" not "we promise."

### Success Metrics at MOF
| Metric | Target | Action if Below | Action if Above |
|--------|--------|----------------|-----------------|
| CTR (link) | ___% | Should be higher than TOF | Scale |
| Add to Cart Rate | ___% | Key MOF metric — investigate LP if low | Scale |
| CPA | €/£___ | Lower than TOF expected | Scale |
| ROAS | ___ | Higher than TOF expected | Scale |
| Frequency (7d) | ___ max | Above 4.0 = ad fatigue risk | Fine |

---

## BOF — Bottom of Funnel (Conversion / Hot Retargeting)

### Purpose
Convert high-intent visitors (cart abandoners, repeat visitors, engaged audiences) into purchasers. Remove final barriers to purchase.

### Creative Strategy at BOF

**Objective:** Make the purchase decision feel easy, safe, and obvious.

**Best creative angles for BOF (from Creative Overview):**

| Angle | What It Does | Format | Notes |
|-------|-------------|--------|-------|
| Buying Clarity | Makes decision easy | Static | "Who this is for" |
| Risk Reversal | Removes fear | Static | Simple, credible only |
| Reason to Switch | Why change now | Static | Very strong for apparel |
| Decision Elimination | Removes daily choice | Static | "Put it on and forget it" |
| Peace-of-Mind | Calm reassurance | Static | Very effective for older demos |
| Friction Removal | Shows what user no longer does | Static, video | "No more adjusting / fixing" |
| Pattern Recognition | Repeated issue until solution | Montage video | Frustrated buyers |

**BOF creative rules:**
- Multipack value messaging strongest here
- Risk reversal (returns, size guidance) is a conversion lever, not an afterthought
- DPA for winner products with clear product imagery
- Keep it simple — one reason, one action, one product

**BOF tone:** Reassuring, clear, low-pressure. "Here's why this makes sense for you."

### Success Metrics at BOF
| Metric | Target | Action if Below | Action if Above |
|--------|--------|----------------|-----------------|
| CTR (link) | ___% | Should be highest across funnel | Scale |
| Conversion Rate | ___% | Key BOF metric | Scale |
| CPA | €/£___ | Should be lowest in funnel | Scale aggressively |
| ROAS | ___ | Should be highest in funnel | Scale aggressively |
| Frequency (7d) | ___ max | Above 6.0 = diminishing returns | Fine |

---

## Campaign Types

### Hero Product Campaigns
- Dedicated creative for one product
- Full funnel (TOF → MOF → BOF)
- Products: Cotton Stretch Boxer Trunk 3-Pack (EU/DE Male), Classic Full-Rise Y-Front Brief (UK Male), Light Lift Bra (UK Female), Back Smoothing Bralette (UK Female), Skimmies (UK Female), Worry Free Brief (UK Female)

### DPA — Winner Products
- Dynamic Product Ads for top-performing products
- BOF focus — retargeting viewers and cart abandoners
- Product feed with clear imagery

### DPA — Collections
- Dynamic Product Ads for full collections
- Broad retargeting
- Catalogue-driven

---

## Creative-to-Funnel Mapping (Quick Reference)

| Creative Angle | TOF | MOF | BOF |
|---------------|:---:|:---:|:---:|
| Call-Out / Problem Identification | ✅ | | |
| Symptom Highlight | ✅ | | |
| Before / After | ✅ | ✅ | |
| Outcome First | ✅ | ✅ | |
| Day-in-the-Life | ✅ | | |
| Blame Shift | ✅ | | |
| Objection Call-Out | | ✅ | |
| Calm Testimonial | | ✅ | ✅ |
| "I Didn't Expect…" | | ✅ | |
| Us vs Them | | ✅ | |
| What It Is / Isn't | | ✅ | |
| Touch & Feel | | ✅ | |
| Feature Isolation | | ✅ | |
| Buying Clarity | | | ✅ |
| Risk Reversal | | | ✅ |
| Reason to Switch | | | ✅ |
| Decision Elimination | | | ✅ |
| Peace-of-Mind | | | ✅ |
| Friction Removal | | ✅ | ✅ |

## Funnel Health Diagnostics (AI Agent Rules)
- If TOF impressions are high but MOF pool is small → creative isn't driving clicks, rework hooks
- If MOF engagement is high but BOF purchases are low → landing page or checkout friction, not ad problem
- If BOF frequency exceeds 6.0 → audience exhausted, need more TOF to refill
- If all stages show declining ROAS simultaneously → likely external factor (seasonality, tracking, site issue), not funnel structure
- If one product dominates spend across all stages → check if other hero products have active creative
