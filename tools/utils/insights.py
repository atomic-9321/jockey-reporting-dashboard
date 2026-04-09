"""Generate AI-powered insights for weekly and monthly reports.

Uses the Anthropic Python SDK to call Claude directly, loading all brand
strategy context files. Falls back gracefully when the API key is missing
or the call fails.
"""

import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Context files loaded from the project root
_ROOT_CONTEXT_FILES = [
    "01-brand-bible (3).md",
    "02-product-catalog.md",
    "03-kpi-benchmarks.md",
    "04-testing-log.md",
    "05-funnel-strategy.md",
    "jockey_creative_brain_rag.md",
    "naming-conventions.md",
]

# Context files that only exist in the dashboard context directory
_DASHBOARD_CONTEXT_DIR = PROJECT_ROOT / "dashboard" / "src" / "lib" / "context"
_DASHBOARD_CONTEXT_FILES = [
    "brand-context.md",
    "positive-language.md",
]

REGION_CURRENCY = {"uk": "£", "eu": "€"}


def _load_context(filename: str, from_dashboard: bool = False) -> str:
    """Read a markdown context file. Returns empty string on failure."""
    try:
        if from_dashboard:
            filepath = _DASHBOARD_CONTEXT_DIR / filename
        else:
            filepath = PROJECT_ROOT / filename
        return filepath.read_text(encoding="utf-8")
    except Exception as e:
        logger.warning(f"Could not load context file {filename}: {e}")
        return ""


def _build_system_prompt() -> str:
    """Build the full system prompt with all brand/strategy context."""
    # Load context files — use compact brand-context instead of full brand bible
    # to keep the prompt within rate limits (~30K tokens/min)
    brand_context = _load_context("brand-context.md", from_dashboard=True)
    positive_language = _load_context("positive-language.md", from_dashboard=True)
    product_catalog = _load_context("02-product-catalog.md")
    kpi_benchmarks = _load_context("03-kpi-benchmarks.md")
    testing_log = _load_context("04-testing-log.md")
    funnel_strategy = _load_context("05-funnel-strategy.md")
    creative_brain = _load_context("jockey_creative_brain_rag.md")
    naming_conventions = _load_context("naming-conventions.md")

    return f"""You are the Jockey Reporting Agent. You analyze advertising performance data for Jockey EU and UK markets and provide strategic creative recommendations.

## Your Rules — STRICTLY FOLLOW THESE

1. **NEVER do math.** All numbers in the data are pre-calculated. Only reference the exact numbers provided.
2. **NEVER invent data.** If a metric is not in the provided data, say "data not available."
3. **ALWAYS cite specific numbers.** Every insight must reference a specific metric and its exact value.
4. **Use ONLY positive language.** Follow the positive language rules below exactly.
5. **Be concise.** Each insight should be 1-2 sentences max. Each recommendation should be specific and actionable.
6. **Reference creative angles from the Creative Brain.** Use the angle names and strategies below.
7. **Reference the Testing Log.** Never suggest a test that was already run unless results were inconclusive.
8. **Use Naming Conventions** to identify avatars, angles, and funnel stages from ad names.
9. **Output ONLY valid JSON** — no trailing commas, no markdown, no commentary outside the JSON object.

## Brand Context
{brand_context}

## Positive Language Rules
{positive_language}

## Product Catalog
{product_catalog}

## KPI Benchmarks
{kpi_benchmarks}

## Funnel Strategy
{funnel_strategy}

## Testing Log
{testing_log}

## Creative Strategy Brain (RAG)
{creative_brain}

## Naming Conventions
{naming_conventions}

## Output Format
Respond with ONLY a JSON object — no text before or after. Use this exact structure:
{{
  "overall_insights": ["insight 1", "insight 2", "insight 3"],
  "campaign_insights": {{
    "Full Campaign Name": "insight text"
  }},
  "creative_recommendations": ["rec 1", "rec 2", "rec 3"]
}}"""


def _build_data_prompt(
    region_data: Dict[str, Any],
    region: str,
    period: str,
    period_type: str,
) -> str:
    """Format campaign + store data into a structured text prompt."""
    currency = REGION_CURRENCY.get(region, "€")
    store = region_data.get("store", {})
    campaigns = region_data.get("campaigns", [])

    prompt = f"""## Analysis Request
Region: {region.upper()}
Period: {period} ({period_type})
Currency: {currency}

## Store Overview
- Total Revenue: {currency}{store.get('totalRevenue', 0):,.2f}
- Total Conversions: {store.get('totalConversions', 0):,}
- Total ROAS: {store.get('totalROAS', 0):.2f}x
- Total CPA: {currency}{store.get('totalCPA', 0):,.2f}
- Profit: {currency}{store.get('profit', 0):,.2f}
- AOV: {currency}{store.get('aov', 0):,.2f}

## Per-Campaign Breakdowns
"""

    for c in campaigns:
        prompt += f"""### {c['campaignName']} ({c.get('funnelStage', 'Unknown')})
- Investment: {currency}{c.get('spend', 0):,.2f}
- Purchases: {c.get('purchases', 0)}
- Revenue: {currency}{c.get('purchaseValue', 0):,.2f}
- ROAS: {c.get('roas', 0):.2f}x
- Cost per Purchase: {currency}{c.get('costPerPurchase', 0):,.2f}
- AOV: {currency}{c.get('avgOrderValue', 0):,.2f}
- Frequency: {c.get('frequency', 0):.2f}
- Ad Format Split: {c.get('adFormatSplit', 'N/A')}
- Top Performing Ad: {c.get('topPerformingAd', 'N/A')}

"""

    prompt += """## Instructions
1. Provide exactly 3 overall insights about the account's performance, using ALL the context documents provided (brand strategy, funnel strategy, KPI benchmarks).
2. Provide exactly 1 important insight for EACH campaign listed above, referencing specific metrics.
3. Provide exactly 3 creative recommendations using the Creative Strategy Brain angles. Reference specific angle names (e.g., "Call-Out", "Before/After", "Calm Testimonial") and tie them to specific products, avatars, and funnel stages.
4. Use the Testing Log — never suggest tests already run unless results were inconclusive.
5. Use the Naming Conventions to identify avatars, angles, and funnel stages from ad names.
6. Respond with valid JSON only. No trailing commas. Escape any double quotes inside strings with a backslash. Do not use smart quotes."""

    return prompt


def _parse_llm_json(raw: str) -> Dict:
    """Parse JSON from LLM output, handling common formatting issues.

    LLMs frequently produce JSON with trailing commas, smart quotes,
    literal newlines inside string values, and unescaped characters.
    This function applies progressively aggressive fixes.
    """
    # Step 1: Normalize common issues upfront
    cleaned = raw
    # Replace smart quotes and dashes
    cleaned = cleaned.replace("\u201c", '"').replace("\u201d", '"')
    cleaned = cleaned.replace("\u2018", "'").replace("\u2019", "'")
    cleaned = cleaned.replace("\u2013", "-").replace("\u2014", " - ")
    # Fix trailing commas before ] or }
    cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Step 2: Escape literal newlines inside string values
    # JSON strings cannot contain literal \n — they must be \\n
    # Replace newlines that appear between quotes with spaces
    cleaned = cleaned.replace("\r\n", " ").replace("\r", " ").replace("\n", " ")
    # Collapse multiple spaces
    cleaned = re.sub(r"  +", " ", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Step 3: Fix unescaped double quotes inside string values
    # Strategy: find strings between structural quotes and escape inner quotes
    # This regex finds : "value" patterns and escapes quotes within the value
    def _fix_inner_quotes(text: str) -> str:
        """Fix unescaped quotes inside JSON string values."""
        result = []
        i = 0
        in_string = False
        escape_next = False

        while i < len(text):
            ch = text[i]
            if escape_next:
                result.append(ch)
                escape_next = False
                i += 1
                continue

            if ch == '\\':
                result.append(ch)
                escape_next = True
                i += 1
                continue

            if ch == '"':
                if not in_string:
                    in_string = True
                    result.append(ch)
                else:
                    # Look ahead to see if this quote ends the string
                    rest = text[i + 1:].lstrip()
                    if rest and rest[0] in (',', '}', ']', ':'):
                        # This is a closing quote
                        in_string = False
                        result.append(ch)
                    elif not rest:
                        # End of text
                        in_string = False
                        result.append(ch)
                    else:
                        # This is an unescaped quote inside a string — escape it
                        result.append('\\"')
                        i += 1
                        continue
            else:
                result.append(ch)
            i += 1

        return ''.join(result)

    fixed = _fix_inner_quotes(cleaned)
    return json.loads(fixed)


def generate_ai_insights(
    region_data: Dict[str, Any],
    region: str,
    period: str,
    period_type: str,
) -> Optional[Dict]:
    """Generate AI insights using the Anthropic SDK.

    Returns a dict with keys: overall_insights, campaign_insights,
    creative_recommendations. Returns None on failure (API key missing,
    network error, parse error), allowing the caller to fall back to
    template-based insights.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY not set — skipping AI insights")
        return None

    try:
        import anthropic
    except ImportError:
        logger.warning("anthropic package not installed — skipping AI insights (pip install anthropic)")
        return None

    max_attempts = 2
    client = anthropic.Anthropic(api_key=api_key)
    system_prompt = _build_system_prompt()
    data_prompt = _build_data_prompt(region_data, region, period, period_type)

    for attempt in range(1, max_attempts + 1):
        try:
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=8000,
                temperature=0.3,
                system=system_prompt,
                messages=[{"role": "user", "content": data_prompt}],
            )

            response_text = message.content[0].text if message.content else ""

            if message.stop_reason == "max_tokens":
                logger.warning("AI insights response was truncated")
                continue

            # Strip markdown code fences
            response_text = re.sub(r"```json\s*", "", response_text)
            response_text = re.sub(r"```\s*", "", response_text)

            # Extract JSON from response
            json_match = re.search(r"\{[\s\S]*\}", response_text)
            if not json_match:
                logger.warning(f"Attempt {attempt}: no JSON found in response")
                continue

            raw_json = json_match.group(0)
            parsed = _parse_llm_json(raw_json)

            result = {
                "overall_insights": parsed.get("overall_insights", []),
                "campaign_insights": parsed.get("campaign_insights", {}),
                "creative_recommendations": parsed.get("creative_recommendations", []),
            }

            logger.info(
                f"AI insights generated for {region.upper()} {period}: "
                f"{len(result['campaign_insights'])} campaign insights, "
                f"{len(result['creative_recommendations'])} recommendations"
            )
            return result

        except json.JSONDecodeError as e:
            logger.warning(f"Attempt {attempt}: JSON parse failed for {region.upper()} {period}: {e}")
            if attempt < max_attempts:
                import time
                time.sleep(2)
                continue

        except Exception as e:
            logger.warning(f"AI insight generation failed for {region.upper()} {period}: {e}")
            return None

    return None
