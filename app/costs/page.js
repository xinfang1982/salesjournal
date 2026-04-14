"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

const inputCls = "border-2 border-gray-800 rounded-lg px-3 py-2 text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-black w-full";
const EMPTY_FORM = { description: "", amount_rmb: "", date: new Date().toISOString().split("T")[0] };

const fmt = (v) =>
  v == null ? "-" : Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CostsPage() {
  const [costs, setCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // "add" | "edit" | null
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchCosts(); }, []);

  async function fetchCosts() {
    setLoading(true);
    const { data } = await getSupabase()
      .from("additional_costs")
      .select("*")
      .order("date", { ascending: false });
    setCosts(data ?? []);
    setLoading(false);
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setMode("add");
  }

  function openEdit(cost) {
    setForm({
      description: cost.description ?? "",
      amount_rmb: cost.amount_rmb ?? "",
      date: cost.date ?? "",
    });
    setEditingId(cost.id);
    setError(null);
    setMode("edit");
  }

  function cancel() {
    setMode(null);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSave() {
    if (!form.description.trim()) { setError("Description is required."); return; }
    if (!form.amount_rmb || isNaN(Number(form.amount_rmb))) { setError("Amount is required."); return; }
    setSaving(true);
    setError(null);

    const payload = {
      description: form.description.trim(),
      amount_rmb: Number(form.amount_rmb),
      date: form.date,
    };

    if (mode === "add") {
      const { error: err } = await getSupabase().from("additional_costs").insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await getSupabase().from("additional_costs").update(payload).eq("id", editingId);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    setSaving(false);
    cancel();
    fetchCosts();
  }

  async function handleDelete(id, description) {
    if (!confirm(`Delete "${description}"?`)) return;
    await getSupabase().from("additional_costs").delete().eq("id", id);
    fetchCosts();
  }

  // Group costs by year for totals
  const totalsByYear = costs.reduce((acc, c) => {
    const y = c.date ? new Date(c.date).getFullYear() : "Unknown";
    acc[y] = (acc[y] || 0) + Number(c.amount_rmb || 0);
    return acc;
  }, {});

  const grandTotal = costs.reduce((s, c) => s + Number(c.amount_rmb || 0), 0);

  return (
    <main className="min-h-screen bg-white p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-base text-gray-500 hover:text-black transition">
          ← Home
        </Link>
        <h1 className="text-3xl font-bold text-black">Additional Costs</h1>
        <button
          onClick={openAdd}
          className="ml-auto border-2 border-gray-800 text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition text-base"
        >
          + Add Cost
        </button>
      </div>

      {/* Add / Edit Form */}
      {mode && (
        <div className="border-2 border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-5">
            {mode === "add" ? "New Cost Entry" : "Edit Cost Entry"}
          </h2>
          <div className="flex flex-col gap-4">
            <Field label="Description *">
              <input
                type="text"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={inputCls}
                placeholder="e.g. 胶带, 泡泡膜, 气柱"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount (RMB) *">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount_rmb}
                  onChange={(e) => set("amount_rmb", e.target.value)}
                  className={inputCls}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
          {error && <p className="text-red-600 font-medium mt-3">{error}</p>}
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-black text-white py-3 rounded-xl text-base font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancel}
              className="flex-1 border-2 border-gray-800 text-black py-3 rounded-xl text-base font-semibold hover:bg-gray-100 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Totals by year */}
      {!loading && costs.length > 0 && (
        <div className="border-2 border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-base font-bold uppercase tracking-wide text-black mb-3">Totals by Year</h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(totalsByYear)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([year, total]) => (
                <div key={year} className="text-center">
                  <p className="text-sm text-gray-500">{year}</p>
                  <p className="text-lg font-bold tabular-nums text-black">¥ {fmt(total)}</p>
                </div>
              ))}
            <div className="text-center border-l-2 border-gray-800 pl-4">
              <p className="text-sm text-gray-500">All time</p>
              <p className="text-lg font-bold tabular-nums text-black">¥ {fmt(grandTotal)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cost list */}
      {loading ? (
        <p className="text-gray-400 text-base">Loading costs...</p>
      ) : costs.length === 0 ? (
        <p className="text-gray-400 text-base">No additional costs yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {costs.map((c) => (
            <div
              key={c.id}
              className="border-2 border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-base font-semibold text-black">{c.description}</p>
                <p className="text-sm text-gray-500 mt-0.5">{c.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-lg font-bold tabular-nums text-black">¥ {fmt(c.amount_rmb)}</p>
                <button
                  onClick={() => openEdit(c)}
                  className="border-2 border-gray-800 text-black px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.description)}
                  className="border-2 border-gray-300 text-gray-400 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition"
                >
                  Delete
                </button>
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
