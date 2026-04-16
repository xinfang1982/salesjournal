"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import { buildSummaryData } from "@/lib/summary";

const MONTH_KEYS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

function fmt(value) {
  if (value === 0) return "-";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function fmtPct(value) {
  if (value === null || value === undefined) return "-";
  return (value >= 0 ? "+" : "") + value.toFixed(0) + "%";
}

export default function SummaryTable({ orderItems, additionalCosts }) {
  const { t } = useLang();
  const [paymentFilter, setPaymentFilter] = useState("All");

  const summary = useMemo(() => {
    const filtered = paymentFilter === "All"
      ? orderItems
      : orderItems.filter((o) => o.payment_status === paymentFilter);
    return buildSummaryData(filtered, additionalCosts);
  }, [orderItems, additionalCosts, paymentFilter]);

  const { years, months, totals, annualised, yoy } = summary;

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-base text-gray-500 hover:text-black transition">{t.home}</Link>
        <h1 className="text-3xl font-bold text-black">{t.summary_title}</h1>
        <div className="ml-auto flex items-center gap-3">
          <label className="text-base font-semibold text-black">{t.col_payment}</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="border-2 border-gray-800 rounded-xl px-4 py-2 text-base bg-white text-black focus:outline-none"
          >
            <option value="All">{t.orders_all}</option>
            <option value="Paid">{t.status_paid}</option>
            <option value="Unpaid">{t.status_unpaid}</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse w-full min-w-max text-base">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 border-2 border-gray-800 bg-black text-white font-semibold w-20">
                {t.summary_month}
              </th>
              {years.map((y) => (
                <th key={y} className="text-right px-4 py-3 border-2 border-gray-800 bg-black text-white font-semibold min-w-[130px]">
                  <div className="text-xs font-normal text-gray-400">{t.summary_year} {y}</div>
                  <div>{t.summary_gain}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((month, i) => (
              <tr key={month.label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-3 border-2 border-gray-800 font-semibold text-black">
                  {t[MONTH_KEYS[i]]}
                </td>
                {years.map((y) => (
                  <td key={y} className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums text-black">
                    {fmt(month.byYear[y])}
                  </td>
                ))}
              </tr>
            ))}

            <tr className="bg-gray-100">
              <td className="px-4 py-3 border-2 border-gray-800 font-bold text-black">{t.summary_total}</td>
              {years.map((y) => (
                <td key={y} className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums font-bold text-black">
                  {fmt(totals.grossGain[y])}
                </td>
              ))}
            </tr>

            <tr className="bg-gray-100">
              <td className="px-4 py-3 border-2 border-gray-800 font-semibold text-black">{t.summary_add_costs}</td>
              {years.map((y) => (
                <td key={y} className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums text-black">
                  {totals.additionalCosts[y] > 0 ? `- ${fmt(totals.additionalCosts[y])}` : "-"}
                </td>
              ))}
            </tr>

            <tr className="bg-black text-white">
              <td className="px-4 py-3 border-2 border-gray-800 font-bold">{t.summary_net_gain}</td>
              {years.map((y) => (
                <td key={y} className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums font-bold">
                  {fmt(totals.netGain[y])}
                </td>
              ))}
            </tr>

            <tr className="bg-gray-50">
              <td className="px-4 py-3 border-2 border-gray-800 font-semibold text-black">{t.summary_annualised}</td>
              {years.map((y) => (
                <td key={y} className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums text-black">
                  {fmt(annualised[y])}
                </td>
              ))}
            </tr>

            <tr className="bg-gray-50">
              <td className="px-4 py-3 border-2 border-gray-800 font-semibold text-black">{t.summary_yoy}</td>
              {years.map((y) => (
                <td key={y} className="px-4 py-3 border-2 border-gray-800 text-right tabular-nums font-bold text-black">
                  {fmtPct(yoy[y])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-gray-400">{t.summary_note}</p>
    </main>
  );
}
