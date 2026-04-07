# Naming Conventions — Jockey Creative Assets

## How the AI Agent Uses This
The agent uses this naming convention to correctly name, categorize, search, and reference every creative asset. When generating reports, analyzing performance by angle/avatar/funnel stage, or creating new assets, the agent must follow this exact structure. Inconsistent naming breaks filtering, reporting, and automation.

## Naming Structure

Every creative asset follows this exact format, with each field separated by an underscore `_`:

**Month #Week_Joc ID_Market_Hook/Angle_Brand_Avatar_Product_Type_Format_Funnel Stage_Awareness Level_Placement**

Optional: Add `PROMOCODE: CODE` at the end when a promo code is associated with the ad.

## Field Definitions

| Position | Field | Description | Required |
|----------|-------|-------------|----------|
| 1 | Month #Week | Launch month and week number within that month (e.g., March #05) | Yes |
| 2 | Joc ID | Unique creative ID prefixed with "Joc" (e.g., Joc 165) | Yes |
| 3 | Market | Target market/account (UK or EU) | Yes |
| 4 | Hook/Angle | The main creative hook or messaging angle used in the ad | Yes |
| 5 | Brand | Always "Jockey" unless otherwise specified | Yes |
| 6 | Avatar | Target audience persona (e.g., The Active Comparer, The Pad Ditcher). Use "all" when targeting broadly | Yes |
| 7 | Product | Specific product featured (e.g., Back Smoothing Bra, Light Lift Bra). Use "all" when not product-specific | Yes |
| 8 | Type | Creative type: "New Concept" for fresh creatives, "Iteration" for variations of existing winners | Yes |
| 9 | Format | Content format: Static, Video, Carousel, GIF | Yes |
| 10 | Funnel Stage | Position in the funnel: TOFU, MOFU, or BOFU | Yes |
| 11 | Awareness Level | Audience awareness stage: Solution Aware, Product/Brand Aware, Most Aware | Yes |
| 12 | Placement | Platform placement: MP (Multi-Placement), Feed, Stories, Reels | Yes |
| Extra | Promo Code | If applicable, append "PROMOCODE: CODE" at the end | No |

## Accepted Values Per Field

### Market
- UK
- EU

### Avatar
- The Active Comparer
- The Pad Ditcher
- The Ready-to-Buy Switcher
- Avatar #1: The almost buyer
- all

### Type
- New Concept
- Iteration

### Format
- Static
- Video
- Carousel
- GIF

### Funnel Stage
- TOFU
- MOFU
- BOFU

### Awareness Level
- Solution Aware
- Product/Brand Aware
- Most Aware

### Placement
- MP (Multi-Placement)
- Feed
- Stories
- Reels

## Examples

```
March #05_Joc 165_UK_Visual proof of smoothing_Jockey_The Active Comparer_Back Smoothing Bra_Iteration_Static_TOFU_Solution Aware_MP
```

```
Feb #03_Joc 158_UK_Worry-free on red days_Jockey_The Pad Ditcher_New Concept_Static_MOFU_Product/Brand Aware_MP
```

```
March #02_Joc 162_UK_Product and conversion trigger_Jockey_Avatar #1: The almost buyer_Back smoothing bra_New Concept_Static_BOFU_Product/Brand Aware_MP
```

```
March #06_Joc 1633_UK_Buy 1 get 50% off_Jockey_The Ready-to-Buy Switcher_Light Lift Bra_New Concept_Static_MOFU_Product/Brand Aware_MP
```

```
March #03_Joc 166_EU_25% OFF Spring Cleaning_Jockey_all_all_New Concept_Static_TOFU_Product/Brand Aware_MP PROMOCODE: SPRINGCLEAN
```

## AI Agent Rules

- Always follow this exact field order when naming new creatives
- Never skip fields — use "all" when a field applies broadly
- Joc ID must be unique and never reused
- When analyzing creative performance, use these fields to filter and group (e.g., performance by Avatar, by Funnel Stage, by Type)
- When the user provides a creative name, parse each field to extract metadata for reporting
- If a field is missing or ambiguous in user input, ask for clarification before naming
