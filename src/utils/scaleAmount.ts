// Scales a free-form ingredient amount string by a factor, so the servings
// stepper on a recipe actually changes the quantities. Only the leading numeric
// quantity is scaled — the unit and any trailing notes are preserved. Amounts
// with no number ("a pinch", "to taste", "dad üçün") are returned unchanged.

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 0.125,
};

/** Round to at most 2 decimals and drop trailing zeros ("1.50" → "1.5"). */
function formatQty(n: number): string {
  if (!isFinite(n) || n <= 0) return '0';
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

interface LeadingQty { value: number; rest: string; }

/** Pull the leading quantity off an amount string, whatever its notation. */
function parseLeadingQuantity(s: string): LeadingQty | null {
  // mixed number: "1 1/2 cups"
  let m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)\s*(.*)$/);
  if (m) return { value: +m[1] + +m[2] / +m[3], rest: m[4] };
  // simple fraction: "1/2 tsp"
  m = s.match(/^(\d+)\s*\/\s*(\d+)\s*(.*)$/);
  if (m) return { value: +m[1] / +m[2], rest: m[3] };
  // unicode fraction: "½ cup"
  m = s.match(/^([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛])\s*(.*)$/);
  if (m) return { value: UNICODE_FRACTIONS[m[1]] ?? NaN, rest: m[2] };
  // decimal or integer: "200 g", "1.5 kg"
  m = s.match(/^(\d*\.?\d+)\s*(.*)$/);
  if (m) return { value: parseFloat(m[1]), rest: m[2] };
  return null;
}

export function scaleIngredientAmount(amount: string | undefined | null, factor: number): string {
  if (!amount) return amount ?? '';
  if (!isFinite(factor) || factor <= 0 || factor === 1) return amount;

  const s = amount.trim();

  // Range like "2-3 cloves" — scale both ends.
  const range = s.match(/^(\d*\.?\d+)\s*[-–—]\s*(\d*\.?\d+)\s*(.*)$/);
  if (range) {
    const rest = range[3] ? ` ${range[3]}` : '';
    return `${formatQty(+range[1] * factor)}–${formatQty(+range[2] * factor)}${rest}`;
  }

  const parsed = parseLeadingQuantity(s);
  if (!parsed || !isFinite(parsed.value)) return amount; // "to taste" etc.

  const scaled = formatQty(parsed.value * factor);
  return parsed.rest ? `${scaled} ${parsed.rest}` : scaled;
}
