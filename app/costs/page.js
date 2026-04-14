"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { useLang } from "@/lib/i18n";

const inputCls = "border-2 border-gray-800 rounded-lg px-3 py-2 text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-black w-full";

const fmt = (v) =>
  v == null ? "-" : Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CostsPage() {
  const { t } = useLang();
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({ description: "", amount_rmb: "", date: new Date().toISOString().split("T")[0] });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchCosts(); }, []);

  async function fetchCosts() {
    setLoading(true);
    const { data } = await getSupabase().from("additional_costs").select("*").order("date", { ascending: false });
    setCosts(data ?? []);
    setLoading(false);
  }

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function openAdd() { setForm({ description: "", amount_rmb: "", date: new Date().toISOString().split("T")[0] }); setEditingId(null); setError(null); setMode("add"); }
  function openEdit(cost) { setForm({ description: cost.description ?? "", amount_rmb: cost.amount_rmb ?? "", date: cost.date ?? "" }); setEditingId(cost.id); setError(null); setMode("edit"); }
  function cancel() { setMode(null); setEditingId(null); setError(null); }

  async function handleSave() {
    if (!form.description.trim()) { setError(t.err_description); return; }
    if (!form.amount_rmb || isNaN(Number(form.amount_rmb))) { setError(t.err_amount); return; }
    setSaving(true); setError(null);
    const payload = { description: form.description.trim(), amount_rmb: Number(form.amount_rmb), date: form.date };
    const { error: err } = mode === "add"
      ? await getSupabase().from("additional_costs").insert(payload)
      : await getSupabase().from("additional_costs").update(payload).eq("id", editingId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    cancel(); fetchCosts();
  }

  async function handleDelete(id, description) {
    if (!confirm(t.confirm_delete_cost(description))) return;
    await getSupabase().from("additional_costs").delete().eq("id", id);
    fetchCosts();
  }

  const totalsByYear = costs.reduce((acc, c) => {
    const y = c.date ? new Date(c.date).getFullYear() : "?";
    acc[y] = (acc[y] || 0) + Number(c.amount_rmb || 0);
    return acc;
  }, {});

  const grandTotal = costs.reduce((s, c) => s + Number(c.amount_rmb || 0), 0);

  return (
    <main className="min-h-screen bg-white p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-base text-gray-500 hover:text-black transition">{t.home}</Link>
        <h1 className="text-3xl font-bold text-black">{t.costs_title}</h1>
        <button onClick={openAdd} className="ml-auto border-2 border-gray-800 text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition text-base">
          {t.btn_add_cost}
        </button>
      </div>

      {mode && (
        <div className="border-2 border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-5">{mode === "add" ? t.new_cost_title : t.edit_cost_title}</h2>
          <div className="flex flex-col gap-4">
            <Field label={t.field_description}><input type="text" value={form.description} onChange={(e) => set("description", e.target.value)} className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t.field_amount_rmb}><input type="number" step="0.01" min="0" value={form.amount_rmb} onChange={(e) => set("amount_rmb", e.target.value)} className={inputCls} placeholder="0.00" /></Field>
              <Field label={t.field_date}><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className={inputCls} /></Field>
            </div>
          </div>
          {error && <p className="text-red-600 font-medium mt-3">{error}</p>}
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-black text-white py-3 rounded-xl text-base font-semibold hover:bg-gray-800 transition disabled:opacity-50">
              {saving ? t.saving : t.btn_save}
            </button>
            <button onClick={cancel} className="flex-1 border-2 border-gray-800 text-black py-3 rounded-xl text-base font-semibold hover:bg-gray-100 transition">
              {t.btn_cancel}
            </button>
          </div>
        </div>
      )}

      {!loading && costs.length > 0 && (
        <div className="border-2 border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-base font-bold uppercase tracking-wide text-black mb-3">{t.totals_by_year}</h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(totalsByYear).sort(([a], [b]) => Number(a) - Number(b)).map(([year, total]) => (
              <div key={year} className="text-center">
                <p className="text-sm text-gray-500">{year}</p>
                <p className="text-lg font-bold tabular-nums text-black">¥ {fmt(total)}</p>
              </div>
            ))}
            <div className="text-center border-l-2 border-gray-800 pl-4">
              <p className="text-sm text-gray-500">{t.all_time}</p>
              <p className="text-lg font-bold tabular-nums text-black">¥ {fmt(grandTotal)}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-base">{t.costs_loading}</p>
      ) : costs.length === 0 ? (
        <p className="text-gray-400 text-base">{t.costs_empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {costs.map((c) => (
            <div key={c.id} className="border-2 border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-black">{c.description}</p>
                <p className="text-sm text-gray-500 mt-0.5">{c.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-lg font-bold tabular-nums text-black">¥ {fmt(c.amount_rmb)}</p>
                <button onClick={() => openEdit(c)} className="border-2 border-gray-800 text-black px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition">{t.btn_edit}</button>
                <button onClick={() => handleDelete(c.id, c.description)} className="border-2 border-gray-300 text-gray-400 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition">{t.btn_delete}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  );
}
