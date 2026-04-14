import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { buildSummaryData } from "@/lib/summary";

export const dynamic = "force-dynamic";

function fmt(value) {
  if (value === 0) return "-";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function fmtPct(value) {
  if (value === null || value === undefined) return "-";
  return (value >= 0 ? "+" : "") + value.toFixed(0) + "%";
}

export default async function SummaryPage() {
  const supabase = createServerClient();

  const [{ data: orderItems }, { data: additionalCosts }] = await Promise.all([
    supabase
      .from("order_items")
      .select("purchase_date, margin_rmb")
      .eq("payment_status", "Paid"),
    supabase.from("additional_costs").select("date, amount_rmb"),
  ]);

  const summary = buildSummaryData(orderItems ?? [], additionalCosts ?? []);
  const { years, months, totals, annualised, yoy } = summary;

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-base text-gray-500 hover:text-black transition">
          ← Home
        </Link>
        <h1 className="text-3xl font-bold text-black">Summary Overview</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse w-full min-w-max text-base">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 border-2 border-gray-800 bg-black text-white font-semibold w-20">
                Month
              </th>
              {years.map((y) => (
                <th
                  key={y}
                  className="text-right px-4 py-3 border-2 border-gray-800 bg-black text-white font-semibold min-w-[130px]"
                >
                  <div className="text-xs font-normal text-gray-400">Year {y}</div>
                  <div>Gain (RMB)</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((month, i) => (
              <tr key={month.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 border-2 border-gray-800 font-semibold text-black">
                  {month.label}
                </td>
                {years.map((y) => (
                  <td
                    key={y}
                    className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums text-black"
                  >
                    {fmt(month.byYear[y])}
                  </td>
                ))}
              </tr>
            ))}

            {/* Total row */}
            <tr className="bg-gray-100">
              <td className="px-4 py-3 border-2 border-gray-800 font-bold text-black">
                Total
              </td>
              {years.map((y) => (
                <td
                  key={y}
                  className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums font-bold text-black"
                >
                  {fmt(totals.grossGain[y])}
                </td>
              ))}
            </tr>

            {/* Additional Costs row */}
            <tr className="bg-gray-100">
              <td className="px-4 py-3 border-2 border-gray-800 font-semibold text-black">
                Add. Costs
              </td>
              {years.map((y) => (
                <td
                  key={y}
                  className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums text-black"
                >
                  {totals.additionalCosts[y] > 0
                    ? `- ${fmt(totals.additionalCosts[y])}`
                    : "-"}
                </td>
              ))}
            </tr>

            {/* Net Gain row */}
            <tr className="bg-black text-white">
              <td className="px-4 py-3 border-2 border-gray-800 font-bold">
                Net Gain
              </td>
              {years.map((y) => (
                <td
                  key={y}
                  className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums font-bold"
                >
                  {fmt(totals.netGain[y])}
                </td>
              ))}
            </tr>

            {/* Annualised Gain row */}
            <tr className="bg-gray-50">
              <td className="px-4 py-3 border-2 border-gray-800 font-semibold text-black">
                Annualised
              </td>
              {years.map((y) => (
                <td
                  key={y}
                  className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums text-black"
                >
                  {fmt(annualised[y])}
                </td>
              ))}
            </tr>

            {/* YoY % row */}
            <tr className="bg-gray-50">
              <td className="px-4 py-3 border-2 border-gray-800 font-semibold text-black">
                YoY %
              </td>
              {years.map((y) => (
                <td
                  key={y}
                  className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums font-bold text-black"
                >
                  {fmtPct(yoy[y])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-gray-400">
        Gain = margin RMB from paid orders only. Annualised extrapolates partial years to 12 months.
      </p>
    </main>
  );
}
