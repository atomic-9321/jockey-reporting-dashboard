# Ad Naming Convention Parser

> This document defines how the AI agent extracts structured metadata from ad names, even when naming is inconsistent, out of order, typo-prone, or partially missing.
> The parser always returns a final structured output. It may **parse**, **infer**, or **default** a field, but it never leaves a field unresolved.

---

## 1. Purpose

For each ad, the agent extracts:

- **Product**
- **Awareness Level**
- **Funnel Stage**
- **Creative Format**
- **Creative Angle**

The parser must work when:

- fields appear in any order
- separators vary
- casing varies
- some fields are missing
- some keywords contain typos
- multiple valid angle labels appear in one name
- no naming convention exists at all

---

## 2. Core Parsing Principles

### 2.1 Order does not matter
Fields may appear in any position in the ad name.

### 2.2 Separators are flexible
Treat these as separators:

- `_`
- `-`
- `|`
- `/`
- whitespace

The parser should also support merged naming styles such as `ProblemAwareUGC` by using normalized phrase detection after preprocessing.

### 2.3 Matching is case-insensitive
All keyword matching must ignore casing.

### 2.4 Phrase-first matching
Always attempt to match the **longest valid phrase first** before matching shorter phrases or single tokens.

Examples:
- `"testimonial video"` should match before `"testimonial"`
- `"problem aware"` should match before `"problem"`
- `"top of funnel"` should match before `"top"`
- `"dynamic product"` should match before `"dynamic"`

### 2.5 Exact-token matching for short keywords
Keywords shorter than 5 characters must use **exact-token match only**.

Examples:
- `tof`
- `mof`
- `bof`
- `dpa`
- `ugc`

These should **not** be matched by fuzzy logic or loose substring search.

### 2.6 Fuzzy matching is limited
Fuzzy matching is allowed **only** for keywords with length **5 or more**.

Rule:
- use fuzzy matching only when Levenshtein distance ≤ 2
- apply it only after exact and phrase-first matching fails
- never fuzzy-match short control keywords such as `tof`, `mof`, `bof`, `dpa`, `ugc`, `bra`, `car`

Examples allowed:
- `testimonal` → `testimonial`
- `benifits` → `benefits`

### 2.7 No unrestricted substring matching
The parser must **not** treat arbitrary substrings as valid matches.

Bad:
- matching `bra` inside `brand`
- matching `car` inside `cart`
- matching `aware` inside unrelated text

Good:
- token match
- normalized phrase match
- approved fuzzy match under the rules above

### 2.8 Consumed-token rule
Once a token or phrase is matched to a field, it is **consumed** and cannot trigger another field.

Example:
- `"ProblemAware_Benefits"`
- `"problem aware"` is consumed by **Awareness**
- `"problem"` is no longer available to trigger **Angle**
- final angle = `Benefits Call-Out`

### 2.9 Exception override rule
Some phrases must override the default parse order because they are more specific than their component words.

Examples:
- `"customer story"` must map to **Angle**, not Awareness
- `"testimonial video"` must map to **Format = Video** and **Angle = Testimonial / Social Proof**
- `"real customer"` must map to **Angle**, not Awareness
- `"dynamic product"` must map to **Format = DPA**, not treated as a loose adjective

**Override phrases are resolved before normal field parsing begins.**

**Reversed word order:** Override phrases must also match when their component words appear in reversed order. Map both `"testimonial video"` and `"video testimonial"` to the same override. Apply this to all multi-word overrides to prevent word-order fragility.

### 2.10 Final-decision rule
The agent must always produce a final output object.
However, each field must still be labeled correctly as one of:

- **parsed** = directly extracted from the ad name
- **inferred** = determined from explicit logic based on another field or performance data
- **defaulted** = assigned by a fixed fallback rule when no direct signal exists

The parser must never pretend a defaulted field was explicitly parsed.

---

## 3. Normalization Pipeline

Before parsing, preprocess the ad name as follows:

1. Store original string as `ad_name_raw`
2. Convert to lowercase
3. Strip emojis
4. Replace separators (`_`, `-`, `|`, `/`, `:`, `+`, `.`, `,`) with spaces
5. Split camelCase / PascalCase boundaries into tokens
   Examples:
   - `ProblemAwareUGC` → `problem aware ugc`
   - `BrandAwareStaticTestimonial` → `brand aware static testimonial`
   - `HookCodeTest` → `hook code test`
6. Collapse repeated spaces
7. Preserve original token order for phrase detection
8. Generate normalized tokens and n-grams for phrase-first matching

If the ad name is null, empty, or only whitespace:
- store `ad_name_raw` as provided (null, empty string, etc.)
- set `product = "unidentified"`
- set `awareness_level = "unidentified"`
- set `format = "unidentified"` (attempt Meta API fallback)
- set `angle` to default: `["Problem / Pain Point"]`
- trigger funnel fallback logic for `funnel_stage`

---

## 4. Parse Order

After override phrases are checked, parse in this order:

1. **Awareness Level**
2. **Funnel Stage**
3. **Creative Format**
4. **Creative Angle**
5. **Product**

Why:
- awareness often contains phrases like `"problem aware"` that would otherwise collide with angle words
- funnel should be resolved before angle defaults
- format should be resolved before fallback logic uses it
- product is parsed last to reduce accidental collisions

---

## 5. Field: Awareness Level

Identify which stage of customer awareness the ad targets.

| Awareness Level | Trigger Keywords |
|---|---|
| **Unaware** | `unaware`, `mass market`, `broad awareness`, `top cold` |
| **Problem Aware** | `problem aware`, `problem-aware`, `prob aware`, `prob-aware`, `pain aware`, `problem id`, `problem identification`, `symptom` |
| **Solution Aware** | `solution aware`, `solution-aware`, `sol aware`, `sol-aware`, `category aware`, `knows solution`, `looking for fix` |
| **Product Aware** | `product aware`, `product-aware`, `prod aware`, `prod-aware`, `brand aware`, `brand-aware`, `knows us`, `brand consideration`, `brand intro` |
| **Most Aware** | `most aware`, `most-aware`, `loyalist`, `past buyer`, `existing customer`, `repurchase` |

### 5.1 Awareness override phrases
The following phrases must **not** trigger awareness:

| Phrase | Resolution |
|---|---|
| `customer story` | Angle = Testimonial / Social Proof |
| `real customer` | Angle = Testimonial / Social Proof |
| `customer review` | Angle = Testimonial / Social Proof |
| `honest review` | Angle = Calm Testimonial |
| `testimonial video` | Format = Video; Angle = Testimonial / Social Proof |
| `symptom highlight` | Angle = Problem / Pain Point (not awareness) |

### 5.2 Awareness shorthand
- `"aware"` alone → **Product Aware**

Reason: in naming convention shorthand, `"aware"` usually implies brand/product familiarity unless otherwise specified.

### 5.3 Awareness conflict resolution
If multiple awareness levels appear in the same name, select the **most specific** one.

Specificity order:
**Most Aware > Product Aware > Solution Aware > Problem Aware > Unaware**

Example:
- `"Unaware_ProductAware_Static"` → `Product Aware`

Add flag:
- `awareness_conflict_auto_resolved`

### 5.4 Missing awareness
If no awareness keyword is found:
- `awareness_level = "unidentified"`

Do not invent awareness.

---

## 6. Field: Funnel Stage

| Funnel Stage | Trigger Keywords |
|---|---|
| **TOF** | `tof`, `top of funnel`, `top-of-funnel`, `prospecting`, `cold traffic`, `acquisition`, `reach`, `awareness campaign`, `new audience` |
| **MOF** | `mof`, `middle of funnel`, `middle-of-funnel`, `consideration`, `retargeting warm`, `engaged`, `nurture`, `mid funnel`, `mid-funnel` |
| **BOF** | `bof`, `bottom of funnel`, `bottom-of-funnel`, `conversion`, `retargeting hot`, `cart abandoner`, `checkout`, `purchase campaign` |

### 6.1 Removed ambiguous funnel keywords
These do **not** trigger funnel stage:

| Keyword | Reason |
|---|---|
| `broad` | Too often used as audience/targeting language |
| `dpa` | Format descriptor, not funnel stage |
| `catalog` | Format descriptor, not funnel stage |
| `collection` | Product-line language, not funnel stage |
| `warm` (standalone) | Too ambiguous — could describe tone, color, creative style. Only `retargeting warm` triggers MOF. |
| `hot` (standalone) | Too ambiguous — could describe product color, style, trend language (e.g., `"Hot Pink Bralette"`). Only `retargeting hot` triggers BOF. |

### 6.2 Funnel inference from awareness
If there is **no explicit funnel keyword**, but awareness is identified, infer funnel stage as follows:

| Awareness Level | Inferred Funnel Stage |
|---|---|
| **Unaware** | **TOF** |
| **Problem Aware** | **TOF** |
| **Solution Aware** | **MOF** |
| **Product Aware** | **BOF** |
| **Most Aware** | **BOF** |

Add:
- `inferred_fields += ["funnel_stage"]`
- `inference_method = "awareness_to_funnel_mapping"`

### 6.3 Explicit funnel wins
If both explicit funnel and awareness are present:
- use the **explicit funnel**
- still keep awareness in its own field

### 6.4 Funnel conflict resolution
If multiple explicit funnel stages appear, choose the **highest funnel stage**:

**TOF > MOF > BOF**

Reason: safer to over-classify as broader/earlier-stage than incorrectly lock an ad into lower-funnel analysis.

Example:
- `"TOF_BOF_Static"` → `TOF`

Add flag:
- `funnel_conflict_auto_resolved`

### 6.5 Missing funnel stage
If no explicit funnel stage is found and awareness is also unidentified:
- trigger **Fallback Logic** in Section 10 for funnel stage only

---

## 7. Field: Creative Format

| Format | Trigger Keywords |
|---|---|
| **Static** | `static`, `image`, `single image`, `photo`, `graphic`, `still`, `banner` |
| **Video** | `video`, `vid`, `ugc`, `talking head`, `demo`, `testimonial video`, `reel`, `motion`, `animated`, `gif` |
| **Carousel** | `carousel`, `slider`, `multi-image`, `swipe` |
| **DPA** | `dpa`, `dynamic product`, `dynamic ad`, `catalog`, `product feed` |

### 7.1 Format resolution rules

| Scenario | Resolution |
|---|---|
| `testimonial video` | Format = **Video** |
| `testimonial` alone | Format is **not** set by this word alone |
| `ugc` | Format = **Video** |
| `gif` | Format = **Video** |
| `animated` | Format = **Video** |
| `catalog` or `dpa` | Format = **DPA** |
| `dynamic product` or `dynamic ad` | Format = **DPA** |
| `dynamic` alone | Does **not** trigger any format. Too ambiguous — could describe creative energy, hook style, or editing pace (e.g., `"Dynamic Hook"`, `"Dynamic Creative"`). Only `dynamic product` or `dynamic ad` trigger DPA. |
| `collection` | Does **not** trigger any format |

### 7.2 Important change
`"testimonial"` alone should **not** force any format.

Reason:
- testimonial is primarily an **angle**
- testimonial can exist as static, video, or carousel
- format should not be guessed from a message angle unless explicitly labeled

### 7.3 Format fallback from Meta API
If format cannot be determined from the ad name:
- use Meta API creative metadata if available
- recommended source: `creative.object_type` or equivalent asset type field

Mapping:
- image-like → `Static`
- video-like → `Video`

If still unavailable:
- `format = "unidentified"`

### 7.4 Format conflict resolution
If multiple format labels appear:
Use this precedence:

**DPA > Carousel > Video > Static**

Reason:
- DPA is structurally distinct
- Carousel is more specific than generic image/video naming
- Video is more specific than Static

Add flag:
- `format_conflict_auto_resolved`

---

## 8. Field: Creative Angle

Only parse angle from tokens that remain after override resolution and token consumption from Awareness, Funnel, and Format.

| Angle Category | Trigger Keywords |
|---|---|
| **Benefits Call-Out** | `benefits`, `benefit`, `benefits call out`, `benefits-callout`, `benefit highlight`, `key benefit`, `value prop` |
| **Testimonial / Social Proof** | `testimonial`, `testimonials`, `review`, `social proof`, `customer story`, `real customer`, `customer review`, `ugc review`, `star rating`, `trust signal`, `trust badge` |
| **Problem / Pain Point** | `pain`, `pain point`, `frustration`, `struggle`, `call out problem`, `problem callout`, `symptom highlight` |
| **Before / After** | `before after`, `before-after`, `b/a`, `transformation`, `result`, `results` |
| **Us vs Them / Comparison** | `us vs them`, `comparison`, `compare`, `competitor`, `alternative`, `why us`, `why not them`, `vs` |
| **Objection Handling** | `objection`, `objection callout`, `myth`, `myth bust`, `misconception`, `you might think`, `but actually` |
| **Feature Isolation** | `feature`, `feature isolation`, `single feature`, `zoom in`, `close up`, `detail`, `construction`, `build quality` |
| **Lifestyle / Day-in-the-Life** | `lifestyle`, `day in the life`, `ditl`, `real life`, `everyday`, `routine`, `morning routine` |
| **Urgency / Scarcity** | `urgency`, `limited`, `last chance`, `running out`, `final`, `ends soon`, `countdown`, `flash` |
| **Offer / Promo** | `offer`, `promo`, `discount`, `sale`, `deal`, `bundle`, `free shipping`, `bogo`, `% off`, `promo code`, `discount code`, `offer code` |
| **Education / How-To** | `education`, `how to`, `how-to`, `explainer`, `tutorial`, `guide`, `did you know`, `learn` |
| **Unboxing / Reveal** | `unboxing`, `reveal`, `first look`, `unbox`, `haul`, `try on`, `try-on` |
| **Blame Shift** | `blame shift`, `blame-shift`, `not your fault`, `blame` |
| **Expectation vs Reality** | `expectation`, `expectation vs reality`, `expect vs real`, `what you expect` |
| **Risk Reversal** | `risk reversal`, `risk-reversal`, `guarantee`, `money back`, `no risk`, `free trial`, `free return` |
| **Buying Clarity** | `buying clarity`, `buying-clarity`, `which one`, `size guide`, `decision`, `help choose`, `quiz` |
| **Touch & Feel** | `touch`, `feel`, `touch and feel`, `touch-and-feel`, `fabric`, `texture`, `hands on`, `material` |
| **Calm Testimonial** | `calm testimonial`, `calm-testimonial`, `honest review`, `no hype`, `real talk` |

### 8.1 Important angle rules
- `"problem"` alone is **not** an angle trigger
- `"testimonial"` is primarily an **angle**
- `"customer story"` and `"real customer"` are **angle phrases**, not awareness
- `"symptom highlight"` is an angle trigger (Problem / Pain Point), not awareness. Note: `"symptom"` alone IS an awareness trigger (Problem Aware) — the override rule in Section 5.1 ensures `"symptom highlight"` is consumed by angle first via phrase-first matching.
- `"trust"` alone is **not** an angle trigger. Too ambiguous — could describe brand values, creative tone, or even product naming (e.g., `"Trust The Process"`). Only `"trust signal"` and `"trust badge"` trigger Testimonial / Social Proof.

### 8.2 Multiple angles are valid
Examples:
- `"testimonial_benefits"` → `["Testimonial / Social Proof", "Benefits Call-Out"]`
- `"offer_urgency_benefits"` → three valid angle matches

### 8.3 Missing angle
If no angle keyword is found:
- default to `["Problem / Pain Point"]`

Reason:
- this gives more analytical value than `"unidentified"`
- most unlabeled direct-response creatives are problem-led or pain-led by nature

Add:
- `defaulted_fields += ["angle"]`

---

## 9. Field: Product Name

Match product references against the product catalog.

| Product Keyword(s) | Mapped Product Name |
|---|---|
| `boxer`, `boxer trunk`, `boxer brief`, `cotton stretch` | Cotton Stretch Boxer Trunk 3-Pack |
| `y-front`, `yfront`, `y front`, `classic brief`, `full rise` | Classic Full-Rise Y-Front Brief |
| `light lift`, `light-lift`, `lift bra` | Light Lift Bra |
| `bralette`, `back smoothing`, `smoothing bra` | Back Smoothing Bralette |
| `skimmies`, `slip short` | Skimmies |
| `worry free`, `worry-free`, `leak proof` | Worry Free Brief |

### 9.1 Removed overly broad product triggers
These should **not** be used as standalone product triggers because they are too ambiguous:

- `bra`
- `period`
- `skim`
- `car`

### 9.2 Product matching rule
Use:
- exact token match
- normalized phrase match
- approved fuzzy match only for keywords with 5+ characters

### 9.3 Missing product
If no product keyword is recognized:
- `product = "unidentified"`

If the system separately detects an unknown likely product alias through business logic, it may store:
- `product = "{raw_text} (unmatched)"`

But only when a meaningful unmatched alias is actually present.

---

## 10. Funnel Fallback Logic

### 10.1 When fallback is allowed
Fallback is used **only for funnel stage**, and only when:

- no explicit funnel keyword is found
- awareness level is unidentified

Fallback does **not** require all other fields to be missing.

Example:
- `"LightLift_Static_Testimonial"`
  product, format, and angle may still parse normally
  funnel stage can still be inferred by fallback if awareness and explicit funnel are missing

### 10.2 Inputs required
Fallback uses:

1. **Format**
2. **Frequency**

### 10.3 Format source priority for fallback
Use format in this order:

1. parsed from ad name
2. Meta API creative type
3. if still unavailable → `format = "unidentified"`

If format remains unidentified, fallback funnel stage becomes:

- `funnel_stage = "MOF"`

Reason:
- MOF is the safest middle classification when neither creative structure nor naming signals clarify stage

Add:
- `defaulted_fields += ["funnel_stage"]`
- `flags += ["fallback_used_without_format"]`

### 10.4 Frequency source
Use:
- 7-day frequency from Meta Ads API

If 7-day frequency is unavailable:
- use lifetime frequency

If **no frequency data is available at all**:
- use the **≤ 2.0 row** for the detected format (conservative / higher-funnel assumption)
- add flag: `fallback_used_without_frequency`

Reason: when we have no frequency signal, it is safer to assume lower frequency (broader reach / earlier funnel) than to assume high frequency retargeting.

### 10.5 Fallback table

| Format | Frequency | Fallback Funnel Stage |
|---|---|---|
| **Static** | > 2.0 | **BOF** |
| **Static** | ≤ 2.0 | **MOF** |
| **Video** | > 2.0 | **MOF** |
| **Video** | ≤ 2.0 | **TOF** |
| **Carousel** | > 2.0 | **BOF** |
| **Carousel** | ≤ 2.0 | **MOF** |
| **DPA** | > 2.0 | **BOF** |
| **DPA** | ≤ 2.0 | **BOF** |

### 10.6 Rationale
- **Static high frequency** usually indicates retargeting or reminder-style delivery
- **Video low frequency** usually indicates prospecting or awareness delivery
- **Carousel** behaves closer to static than video for stage estimation
- **DPA** is overwhelmingly product-led and commercial, so it defaults to BOF in fallback mode regardless of frequency

### 10.7 Labeling rules

Funnel fallback has two distinct paths. Label each correctly:

**Path A — Format is known, frequency logic is used:**
- `inferred_fields += ["funnel_stage"]`
- `inference_method = "frequency_plus_format_fallback"`
- `flags += ["naming_convention_missing_for_funnel"]`

**Path B — Format is unidentified, MOF is forced (Section 10.3):**
- `defaulted_fields += ["funnel_stage"]`
- `inference_method = null`
- `flags += ["naming_convention_missing_for_funnel", "fallback_used_without_format"]`

These are mutually exclusive. `funnel_stage` must appear in either `inferred_fields` or `defaulted_fields`, never both.

---

## 11. Priority Hierarchy Summary

The agent resolves funnel stage in this order:

1. **Explicit funnel keyword**
2. **Awareness → funnel mapping**
3. **Frequency + format fallback**

The agent must always produce one final funnel stage.

---

## 12. Confidence Scoring

Confidence is assigned at the overall record level.

### 12.1 High confidence
Use `high` when:
- funnel stage is explicit, or clearly inferred from awareness
- no conflicts were auto-resolved
- no fuzzy match was needed
- fallback was not used
- format is explicit or confirmed from API

### 12.2 Medium confidence
Use `medium` when:
- one field required fuzzy matching, or
- one field was inferred from another field, or
- one conflict was auto-resolved, or
- format came from API instead of the ad name

### 12.3 Low confidence
Use `low` when:
- funnel stage used fallback logic, or
- multiple conflicts were auto-resolved, or
- format remained unidentified, or
- the ad name was empty / null / numeric-only

### 12.4 Precedence rule
If an ad meets conditions for multiple confidence tiers, the **lowest applicable confidence score wins**. Example: an ad that requires fuzzy matching (medium trigger) and also uses fallback logic for funnel stage (low trigger) receives `confidence: "low"`.

---

## 13. Output Schema

For every ad processed, return:

> The `"extracted"` object contains all final resolved values. The companion arrays `inferred_fields` and `defaulted_fields` describe how each value was derived. A field that appears in neither array was directly parsed from the ad name.

```json
{
  "ad_id": "123456789",
  "ad_name_raw": "CottonStretch_ProblemAware_TOF_UGC_Benefits",
  "extracted": {
    "product": "Cotton Stretch Boxer Trunk 3-Pack",
    "awareness_level": "Problem Aware",
    "funnel_stage": "TOF",
    "format": "Video",
    "angle": ["Benefits Call-Out"],
    "confidence": "high"
  },
  "inferred_fields": [],
  "defaulted_fields": [],
  "inference_method": null,
  "flags": []
}
```

### 13.1 Example: funnel inferred from awareness

```json
{
  "ad_id": "555555555",
  "ad_name_raw": "BrandAware_Static_Testimonial",
  "extracted": {
    "product": "unidentified",
    "awareness_level": "Product Aware",
    "funnel_stage": "BOF",
    "format": "Static",
    "angle": ["Testimonial / Social Proof"],
    "confidence": "medium"
  },
  "inferred_fields": ["funnel_stage"],
  "defaulted_fields": [],
  "inference_method": "awareness_to_funnel_mapping",
  "flags": []
}
```

### 13.2 Example: partial parse + fallback funnel

```json
{
  "ad_id": "222222222",
  "ad_name_raw": "LightLift_Static_Testimonial",
  "extracted": {
    "product": "Light Lift Bra",
    "awareness_level": "unidentified",
    "funnel_stage": "MOF",
    "format": "Static",
    "angle": ["Testimonial / Social Proof"],
    "confidence": "low"
  },
  "inferred_fields": ["funnel_stage"],
  "defaulted_fields": [],
  "inference_method": "frequency_plus_format_fallback",
  "flags": ["naming_convention_missing_for_funnel"]
}
```

### 13.3 Example: no naming convention

```json
{
  "ad_id": "987654321",
  "ad_name_raw": "Batch#1",
  "extracted": {
    "product": "unidentified",
    "awareness_level": "unidentified",
    "funnel_stage": "BOF",
    "format": "Static",
    "angle": ["Problem / Pain Point"],
    "confidence": "low"
  },
  "inferred_fields": ["funnel_stage"],
  "defaulted_fields": ["angle"],
  "inference_method": "frequency_plus_format_fallback",
  "flags": ["naming_convention_missing_for_funnel"]
}
```

### 13.4 Example: conflict auto-resolved

```json
{
  "ad_id": "111111111",
  "ad_name_raw": "TOF_BOF_ProblemAware_Static_Benefits",
  "extracted": {
    "product": "unidentified",
    "awareness_level": "Problem Aware",
    "funnel_stage": "TOF",
    "format": "Static",
    "angle": ["Benefits Call-Out"],
    "confidence": "medium"
  },
  "inferred_fields": [],
  "defaulted_fields": [],
  "inference_method": null,
  "flags": ["funnel_conflict_auto_resolved"]
}
```

### 13.5 Example: no frequency data available

```json
{
  "ad_id": "333333333",
  "ad_name_raw": "Creative_Test_A",
  "extracted": {
    "product": "unidentified",
    "awareness_level": "unidentified",
    "funnel_stage": "MOF",
    "format": "Static",
    "angle": ["Problem / Pain Point"],
    "confidence": "low"
  },
  "inferred_fields": ["funnel_stage"],
  "defaulted_fields": ["angle"],
  "inference_method": "frequency_plus_format_fallback",
  "flags": ["naming_convention_missing_for_funnel", "fallback_used_without_frequency"]
}
```

### 13.6 Example: format unknown — funnel defaulted to MOF

```json
{
  "ad_id": "444444444",
  "ad_name_raw": "Test_V2",
  "extracted": {
    "product": "unidentified",
    "awareness_level": "unidentified",
    "funnel_stage": "MOF",
    "format": "unidentified",
    "angle": ["Problem / Pain Point"],
    "confidence": "low"
  },
  "inferred_fields": [],
  "defaulted_fields": ["funnel_stage", "angle"],
  "inference_method": null,
  "flags": ["naming_convention_missing_for_funnel", "fallback_used_without_format"]
}
```

---

## 14. Edge Cases

| Scenario | Handling |
|---|---|
| Ad name is null / empty | `product = "unidentified"`, `awareness_level = "unidentified"`, `format = "unidentified"`, `funnel_stage` via fallback (defaulted to MOF if format unknown), `angle` defaults to `Problem / Pain Point`; confidence = low; add flag `empty_ad_name` |
| Ad name contains only numbers (e.g., `"001"`) | `product = "unidentified"`, `awareness_level = "unidentified"`, `format = "unidentified"`, `funnel_stage` via fallback (defaulted to MOF if format unknown), `angle` defaults to `Problem / Pain Point`; confidence = low; add flag `numeric_only_ad_name` |
| Two explicit funnel stages (e.g., `"TOF_BOF"`) | Auto-resolve to highest funnel: TOF > MOF > BOF; add flag `funnel_conflict_auto_resolved` |
| Two awareness levels | Auto-resolve to most specific; add flag `awareness_conflict_auto_resolved` |
| Multiple angle labels | Keep all valid angle matches |
| `testimonial` alone | Angle = Testimonial / Social Proof; format remains unresolved unless another signal exists |
| `testimonial video` | Format = Video; Angle = Testimonial / Social Proof |
| `customer story` | Angle only; do not treat as awareness |
| `real customer` | Angle only; do not treat as awareness |
| `symptom` alone | Awareness = Problem Aware |
| `symptom highlight` | Angle = Problem / Pain Point (override phrase — consumed before awareness parsing) |
| `broad` | Ignore for funnel stage |
| `collection` | Ignore for format |
| `warm` alone | Ignore for funnel stage — only `retargeting warm` triggers MOF |
| `hot` alone | Ignore for funnel stage — only `retargeting hot` triggers BOF |
| `dynamic` alone | Ignore for format — only `dynamic product` or `dynamic ad` trigger DPA |
| `trust` alone | Ignore for angle — only `trust signal` or `trust badge` trigger Testimonial |
| DPA or catalog ad with no funnel and no awareness | Use fallback table; result is BOF regardless of frequency |
| Frequency data unavailable | Use ≤ 2.0 row (conservative / higher-funnel); add flag `fallback_used_without_frequency` |
| Format unidentified during fallback | Default funnel to MOF; add flag `fallback_used_without_format` |
| Unknown language tokens | Ignore silently unless they break parsing integrity |
| Emojis in name | Strip before parsing; keep original in `ad_name_raw` |

---

## 15. Maintenance Rules

- When a new creative angle appears, add it to the angle table with likely keyword variations.
- When a new product launches, add known product aliases to the product table.
- When a strategist introduces a new naming shorthand, add it explicitly instead of relying on loose matching.
- Review flags quarterly, especially:
  - `awareness_conflict_auto_resolved`
  - `funnel_conflict_auto_resolved`
  - `format_conflict_auto_resolved`
  - `naming_convention_missing_for_funnel`
  - `fallback_used_without_format`
  - `fallback_used_without_frequency`
- Review fuzzy-match logs quarterly to add new official aliases and reduce future ambiguity.

---

## 16. Implementation Notes

The parser should be designed to be:
- deterministic
- auditable
- transparent
- conservative with ambiguous matches

When in doubt:
- prefer exact match over fuzzy
- prefer phrase over token
- prefer explicit parse over inference
- prefer inference over default
- never fabricate explicit certainty where none exists
