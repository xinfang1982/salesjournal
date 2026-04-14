"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { useLang } from "@/lib/i18n";

const inputCls = "border-2 border-gray-800 rounded-lg px-3 py-2 text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-black w-full";
const EMPTY_FORM = { name: "", wechat_id: "", phone_number: "", shipping_address: "" };

export default function CustomersPage() {
  const { t } = useLang();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchCustomers(); }, []);

  async function fetchCustomers() {
    setLoading(true);
    const { data } = await getSupabase().from("customers").select("*").order("name");
    setCustomers(data ?? []);
    setLoading(false);
  }

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setError(null); setMode("add"); }
  function openEdit(customer) {
    setForm({ name: customer.name ?? "", wechat_id: customer.wechat_id ?? "", phone_number: customer.phone_number ?? "", shipping_address: customer.shipping_address ?? "" });
    setEditingId(customer.id); setError(null); setMode("edit");
  }
  function cancel() { setMode(null); setEditingId(null); setForm(EMPTY_FORM); setError(null); }

  async function handleSave() {
    if (!form.name.trim()) { setError(t.err_name_required); return; }
    setSaving(true); setError(null);
    const payload = { name: form.name.trim(), wechat_id: form.wechat_id.trim() || null, phone_number: form.phone_number.trim() || null, shipping_address: form.shipping_address.trim() || null };
    const { error: err } = mode === "add"
      ? await getSupabase().from("customers").insert(payload)
      : await getSupabase().from("customers").update(payload).eq("id", editingId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    cancel(); fetchCustomers();
  }

  async function handleDelete(id, name) {
    if (!confirm(t.confirm_delete_customer(name))) return;
    await getSupabase().from("customers").delete().eq("id", id);
    fetchCustomers();
  }

  return (
    <main className="min-h-screen bg-white p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-base text-gray-500 hover:text-black transition">{t.home}</Link>
        <h1 className="text-3xl font-bold text-black">{t.customers_title}</h1>
        <button onClick={openAdd} className="ml-auto border-2 border-gray-800 text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition text-base">
          {t.btn_add_customer}
        </button>
      </div>

      {mode && (
        <div className="border-2 border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-5">{mode === "add" ? t.new_customer_title : t.edit_customer_title}</h2>
          <div className="grid grid-cols-1 gap-4">
            <Field label={t.field_name}><input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field>
            <Field label={t.field_wechat}><input type="text" value={form.wechat_id} onChange={(e) => set("wechat_id", e.target.value)} className={inputCls} /></Field>
            <Field label={t.field_phone}><input type="text" value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} className={inputCls} /></Field>
            <Field label={t.field_address}><textarea rows={3} value={form.shipping_address} onChange={(e) => set("shipping_address", e.target.value)} className={inputCls} /></Field>
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

      {loading ? (
        <p className="text-gray-400 text-base">{t.customers_loading}</p>
      ) : customers.length === 0 ? (
        <p className="text-gray-400 text-base">{t.customers_empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {customers.map((c) => (
            <div key={c.id} className={`border-2 rounded-xl p-5 ${editingId === c.id ? "border-black bg-gray-50" : "border-gray-800 bg-white"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-bold text-black">{c.name}</p>
                  <div className="mt-2 flex flex-col gap-1 text-base text-gray-600">
                    {c.wechat_id && <p>{t.label_wechat}{c.wechat_id}</p>}
                    {c.phone_number && <p>{t.label_phone}{c.phone_number}</p>}
                    {c.shipping_address && <p>{t.label_address}{c.shipping_address}</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/orders?customer=${c.id}`} className="border-2 border-gray-800 text-black px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition">{t.btn_orders}</Link>
                  <button onClick={() => openEdit(c)} className="border-2 border-gray-800 text-black px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition">{t.btn_edit}</button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="border-2 border-gray-300 text-gray-400 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition">{t.btn_delete}</button>
                </div>
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
