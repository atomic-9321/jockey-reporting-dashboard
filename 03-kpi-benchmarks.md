# KPI Benchmarks — Jockey

## How the AI Agent Uses This
The agent compares every metric against these benchmarks to determine: what's performing well (scale), what's within range (maintain), and what's below target (optimize). Without these benchmarks, the agent can't distinguish between a good and bad result.

## Account-Level Targets

### EU Account
| KPI | Target | Floor (Minimum Acceptable) | Stretch (Great Week) |
|-----|--------|---------------------------|---------------------|
| Blended ROAS | ___ | ___ | ___ |
| Ad ROAS (Meta only) | ___ | ___ | ___ |
| Total Revenue / week | €___ | €___ | €___ |
| Ad Spend / week | €___ | €___ | €___ |
| CPA | €___ | €___ (max) | €___ (best case) |
| AOV | €___ | €___ | €___ |
| Purchases / week | ___ | ___ | ___ |
| New Customer % | ___% | ___% | ___% |
| Return Customer % | ___% | ___% | ___% |
| Contribution Margin After Ads | ___% | ___% | ___% |

### UK Account
| KPI | Target | Floor (Minimum Acceptable) | Stretch (Great Week) |
|-----|--------|---------------------------|---------------------|
| Blended ROAS | ___ | ___ | ___ |
| Ad ROAS (Meta only) | ___ | ___ | ___ |
| Total Revenue / week | £___ | £___ | £___ |
| Ad Spend / week | £___ | £___ | £___ |
| CPA | £___ | £___ (max) | £___ (best case) |
| AOV | £___ | £___ | £___ |
| Purchases / week | ___ | ___ | ___ |
| New Customer % | ___% | ___% | ___% |
| Return Customer % | ___% | ___% | ___% |
| Contribution Margin After Ads | ___% | ___% | ___% |

## Funnel-Stage Benchmarks

### TOF — Prospecting
| Metric | EU Target | UK Target | Industry Avg (DTC Apparel) | Notes |
|--------|-----------|-----------|---------------------------|-------|
| CPM | €___ | £___ | €8-15 / £7-13 | Lower = more efficient reach |
| CTR (link) | ___% | ___% | 0.8-1.5% | Below 0.8% = creative fatigue or wrong audience |
| CPC (link) | €___ | £___ | €0.50-1.50 / £0.40-1.20 | |
| Hook Rate (video) | ___% | ___% | 20-35% | Below 20% = first 3 seconds need work |
| Hold Rate (video) | ___% | ___% | 15-30% | Below 15% = video too long or loses interest |
| ThruPlay Rate | ___% | ___% | 10-25% | |
| Outbound CTR | ___% | ___% | 0.5-1.2% | More accurate than link CTR for TOF |
| CPA | €___ | £___ | €20-45 / £18-40 | TOF CPA is typically highest |
| ROAS | ___ | ___ | 1.0-2.5 | TOF ROAS is typically lowest — that's expected |
| Frequency (7-day) | ___ | ___ | 1.0-1.8 | Above 2.0 = audience saturation |

### MOF — Consideration / Retargeting (Warm)
| Metric | EU Target | UK Target | Industry Avg (DTC Apparel) | Notes |
|--------|-----------|-----------|---------------------------|-------|
| CPM | €___ | £___ | €12-25 / £10-22 | Higher CPM is normal for retargeting |
| CTR (link) | ___% | ___% | 1.0-2.5% | Should be higher than TOF |
| CPC (link) | €___ | £___ | €0.30-1.00 / £0.25-0.85 | |
| Add to Cart Rate | ___% | ___% | 3-8% | Key MOF metric |
| CPA | €___ | £___ | €15-30 / £12-25 | |
| ROAS | ___ | ___ | 2.0-5.0 | |
| Frequency (7-day) | ___ | ___ | 1.5-3.0 | Above 4.0 = ad fatigue risk |

### BOF — Conversion / Retargeting (Hot)
| Metric | EU Target | UK Target | Industry Avg (DTC Apparel) | Notes |
|--------|-----------|-----------|---------------------------|-------|
| CPM | €___ | £___ | €15-40 / £12-35 | Highest CPM — small audience, high intent |
| CTR (link) | ___% | ___% | 1.5-4.0% | Should be highest across funnel |
| CPC (link) | €___ | £___ | €0.20-0.80 / £0.15-0.65 | |
| Conversion Rate | ___% | ___% | 5-15% | Key BOF metric |
| CPA | €___ | £___ | €8-20 / £7-18 | Should be lowest CPA in funnel |
| ROAS | ___ | ___ | 4.0-12.0 | Should be highest ROAS in funnel |
| Frequency (7-day) | ___ | ___ | 2.0-5.0 | Above 6.0 = diminishing returns |

## Funnel Flow Benchmarks (% Conversion Between Steps)
These are the expected percentages at each step. The AI uses deviations to identify bottlenecks.

| Funnel Step | Expected % of Previous Step | Red Flag Below | Notes |
|-------------|---------------------------|----------------|-------|
| Impressions → Clicks | ___% | ___% | This is your CTR |
| Clicks → Landing Page View | ___% | ___% | Gap = slow site, bounce, tracking gap |
| Landing Page View → Add to Cart | ___% | ___% | Gap = product page not converting |
| Add to Cart → Checkout Initiated | ___% | ___% | Gap = shipping cost shock, account creation wall |
| Checkout → Payment Info | ___% | ___% | Gap = payment method issues, trust |
| Payment Info → Purchase | ___% | ___% | Gap = payment failure, last-minute doubt |

## Creative Performance Benchmarks
| Creative Type | Avg CTR | Avg Hook Rate | Avg Hold Rate | Avg CPA | Best Funnel Stage |
|--------------|---------|---------------|---------------|---------|-------------------|
| UGC Video | ___% | ___% | ___% | €/£___ | TOF / MOF / BOF |
| Studio Video | ___% | ___% | ___% | €/£___ | TOF / MOF / BOF |
| Static — Lifestyle | ___% | N/A | N/A | €/£___ | TOF / MOF / BOF |
| Static — Product | ___% | N/A | N/A | €/£___ | TOF / MOF / BOF |
| Carousel | ___% | N/A | N/A | €/£___ | TOF / MOF / BOF |
| DPA | ___% | N/A | N/A | €/£___ | BOF |

## Spend Allocation Rules
| Condition | Action |
|-----------|--------|
| Ad ROAS > ___ after €/£___ spend | Scale: increase budget 20% |
| Ad ROAS between ___ and ___ after €/£___ spend | Maintain: keep current budget |
| Ad ROAS < ___ after €/£___ spend | Optimize: test new creative, reduce budget |
| CPA > €/£___ for 3+ consecutive days | Pause ad, investigate |
| CTR < ___% after 10,000 impressions | Creative fatigue — rotate |
| Hook rate < ___% on video | First 3 seconds need rework |
| Frequency > ___ (7-day) | Audience saturation — expand or refresh |

## Seasonal Benchmark Adjustments
| Period | ROAS Adjustment | CPA Adjustment | CPM Adjustment | Why |
|--------|----------------|----------------|----------------|-----|
| Jan (post-holiday) | ___% lower | ___% higher | ___% lower | Low intent, returns season |
| Black Friday week | ___% higher | ___% lower | ___% higher | High intent, high competition |
| Holiday gifting (Dec) | ___% higher | ___% lower | ___% higher | Gift purchases spike AOV |
| Summer (Jul-Aug) | ___ | ___ | ___ | ___ |

## AI Agent Benchmark Rules
- When comparing weekly data, always reference the benchmark from this document
- If a metric is within 10% of target → "On track"
- If a metric is 10-25% above target → "Strong performance"  
- If a metric is 25%+ above target → "Exceptional — consider scaling"
- If a metric is 10-25% below floor → "Optimization opportunity identified"
- If a metric is 25%+ below floor → "Requires immediate attention — action plan recommended"
- Never say a metric is "bad" — always frame as distance from benchmark with a recommended action
- During known seasonal periods, adjust expectations per the seasonal table above

## Creative Performance Benchmarks (From Creative Overview)

### Testing Measurement Rules
- Winners are judged by: **CPA stability + ability to scale without performance breaking**
- Winners are NOT judged by: CTR alone, likes, "feels good"
- Each concept = 1 avatar + 1 reason to care + 3 visual variations
- Minimum 6 concepts tested per month per product per market
- A variation changes format/execution — if the reason changes, it's a new concept

### Creative Health Indicators
| Signal | Meaning | Action |
|--------|---------|--------|
| Hook rate below threshold after 5K impressions | First 3 seconds aren't working | Kill immediately — don't wait for CPA data |
| High CTR but high CPA | Clickbait creative — attracts wrong audience | Rework targeting or message alignment |
| Low CTR but low CPA | Niche but effective — right people clicking | Maintain, don't judge by CTR alone |
| CPA rising after 7+ days | Creative fatigue or audience saturation | Introduce new variation, check frequency |
| ROAS scaling linearly with spend | Proven concept — safe to scale | Increase budget 20% increments |
| ROAS drops when spend increases | Concept doesn't scale — audience ceiling | Cap budget, don't force |

### Iteration Cycle (Monthly)
- Keep the strongest reason (best CPA + scale potential)
- Remove the weakest reason (highest CPA or can't scale)
- Introduce new reasons only if needed
- Never run more than 6 concepts simultaneously per product

### Product-Specific Performance Context
| Product | Expected Behaviour | Watch For |
|---------|-------------------|-----------|
| Light Lift Bra (UK) | Strong with No-Hardware Minimalist + Outfit Workhorse avatars | Cup-volume objections in comments = wrong audience targeting |
| Back Smoothing (UK) | Best with Band-Betrayal Woman + Wardrobe Gatekeeper | Heat complaints in summer = seasonal creative rotation needed |
| Skimmies (UK) | Shapewear-Weary Upgrader converts well; Tall avatar is niche but loyal | "Doesn't shape enough" comments = expectations set too high in creative |
| Worry Free (UK) | Sensitive topic — calm, non-clinical tone performs best | Avoid medical/clinical language in ads even if CTR is higher |
| Classic Y-Front (UK) | Extreme loyalty but QC crisis may affect performance | If CPA spikes, check if product reviews/ratings dropped — may be product issue, not creative |
| Cotton Stretch Trunk (EU/DE) | Competes on value vs CK/Boss — 3-pack value messaging key at BOF | If ROAS underperforms, check competitor pricing/promotions |
| Light Lift 2er-Pack (EU/DE) | Preis-Leistung (value) angle is critical in DACH market | Doppelpack messaging should always be present in BOF creative |
