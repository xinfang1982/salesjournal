/**
 * Builds the summary matrix data from raw order_items and additional_costs rows.
 *
 * Returns:
 * {
 *   years: number[],
 *   months: { label: string, grossGain: { [year]: number } }[],
 *   totals: { grossGain: { [year]: number }, additionalCosts: { [year]: number }, netGain: { [year]: number } },
 *   annualised: { [year]: number },
 *   yoy: { [year]: number | null },
 * }
 */
export function buildSummaryData(orderItems, additionalCosts) {
  const MONTH_LABELS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // Collect all years present in the data
  const yearSet = new Set();
  for (const item of orderItems) {
    if (item.purchase_date) {
      yearSet.add(new Date(item.purchase_date).getFullYear());
    }
  }
  for (const cost of additionalCosts) {
    if (cost.date) {
      yearSet.add(new Date(cost.date).getFullYear());
    }
  }

  // Always show from 2021 to current year
  const currentYear = new Date().getFullYear();
  for (let y = 2021; y <= currentYear; y++) yearSet.add(y);

  const years = Array.from(yearSet).sort((a, b) => a - b);

  // Build monthly gross gain matrix: grossGainByYearMonth[year][month0] = sum of margin_rmb
  const grossGain = {}; // [year][month0-indexed]
  for (const y of years) {
    grossGain[y] = Array(12).fill(0);
  }

  for (const item of orderItems) {
    if (!item.purchase_date || item.margin_rmb == null) continue;
    const d = new Date(item.purchase_date);
    const y = d.getFullYear();
    const m = d.getMonth(); // 0-indexed
    if (grossGain[y]) {
      grossGain[y][m] += Number(item.margin_rmb) || 0;
    }
  }

  // Additional costs per year
  const additionalCostsByYear = {};
  for (const y of years) additionalCostsByYear[y] = 0;
  for (const cost of additionalCosts) {
    if (!cost.date) continue;
    const y = new Date(cost.date).getFullYear();
    if (additionalCostsByYear[y] !== undefined) {
      additionalCostsByYear[y] += Number(cost.amount_rmb) || 0;
    }
  }

  // Totals (gross) per year
  const grossTotals = {};
  for (const y of years) {
    grossTotals[y] = grossGain[y].reduce((s, v) => s + v, 0);
  }

  // Net gain per year
  const netGain = {};
  for (const y of years) {
    netGain[y] = grossTotals[y] - additionalCostsByYear[y];
  }

  // Annualised gain: extrapolate for partial current year
  const now = new Date();
  const annualised = {};
  for (const y of years) {
    if (y < currentYear) {
      annualised[y] = grossTotals[y];
    } else {
      // months elapsed so far this year (1-indexed count of months with any data, min 1)
      const monthsElapsed = now.getMonth() + 1; // e.g. April = 4
      annualised[y] = monthsElapsed > 0
        ? (grossTotals[y] / monthsElapsed) * 12
        : grossTotals[y];
    }
  }

  // YoY % growth vs previous year total
  const yoy = {};
  for (let i = 0; i < years.length; i++) {
    const y = years[i];
    if (i === 0) {
      yoy[y] = null;
    } else {
      const prev = grossTotals[years[i - 1]];
      if (prev === 0) {
        yoy[y] = null;
      } else {
        yoy[y] = ((grossTotals[y] - prev) / Math.abs(prev)) * 100;
      }
    }
  }

  // Build months array for rendering
  const months = MONTH_LABELS.map((label, m) => {
    const byYear = {};
    for (const y of years) byYear[y] = grossGain[y][m];
    return { label, byYear };
  });

  return {
    years,
    months,
    totals: {
      grossGain: grossTotals,
      additionalCosts: additionalCostsByYear,
      netGain,
    },
    annualised,
    yoy,
  };
}
