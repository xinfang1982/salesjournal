"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

export default function Home() {
  const { t, toggleLang } = useLang();

  const NAV_ITEMS = [
    { href: "/summary", label: t.nav_summary, description: t.nav_summary_desc },
    { href: "/orders/new", label: t.nav_new_order, description: t.nav_new_order_desc },
    { href: "/orders", label: t.nav_orders, description: t.nav_orders_desc },
    { href: "/customers", label: t.nav_customers, description: t.nav_customers_desc },
    { href: "/costs", label: t.nav_costs, description: t.nav_costs_desc },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-black">{t.appTitle}</h1>
            <button
              onClick={toggleLang}
              className="border-2 border-gray-800 text-black px-3 py-1 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
            >
              {t.lang_toggle}
            </button>
          </div>
          <p className="text-gray-400 text-sm">{t.appSubtitle}</p>
        </div>

        <div className="flex flex-col gap-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 border-2 border-gray-800 bg-white hover:bg-gray-100 text-black py-6 px-6 rounded-xl transition"
            >
              <div className="text-left flex-1">
                <div className="font-semibold text-xl">{item.label}</div>
                <div className="text-base text-gray-600 mt-1">{item.description}</div>
              </div>
              <span className="text-gray-800 text-2xl">›</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
