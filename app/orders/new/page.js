"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { useLang } from "@/lib/i18n";

const today = () => new Date().toISOString().split("T")[0];
const ORDER_STATUSES_EN = ["Ordered", "Goods Receipt", "Goods Issue", "Customer Confirms"];
const PROVIDERS = ["Amazon", "DM", "Rossmann", "Other"];
const EMPTY_NEW_CUSTOMER = { name: "", wechat_id: "", phone_number: "", shipping_address: "" };

const inputCls = "border-2 border-gray-800 rounded-lg px-3 py-2 text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-black w-full";
const selectCls = "border-2 border-gray-800 rounded-lg px-3 py-2 text-base text-black bg-white focus:outline-none focus:ring-2 focus:ring-black w-full";

export default function NewOrderPage() {
  const router = useRouter();
  const { t } = useLang();
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_NEW_CUSTOMER);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState(null);

  const [form, setForm] = useState({
    customer_id: "", brand: "", product_name: "", provider: "",
    price_per_qty_eur: "", quantity: "1", cost_eur: "", cost_rmb: "",
    exchange_rate: "", purchase_date: today(), delivery_date: "",
    order_status: "Ordered", payment_status: "Unpaid", notes: "",
  });

  const qty = parseFloat(form.quantity) || 0;
  const pricePerQty = parseFloat(form.price_per_qty_eur) || 0;
  const costEur = parseFloat(form.cost_eur) || 0;
  const costRmb = parseFloat(form.cost_rmb) || 0;
  const rate = parseFloat(form.exchange_rate) || 0;
  const totalPriceEur = pricePerQty * qty;
  const amountPaidRmb = totalPriceEur * rate;
  const marginEur = totalPriceEur - costEur;
  const marginRmb = amountPaidRmb - costRmb;

  async function loadCustomers() {
    const { data } = await getSupabase().from("customers").select("id, name").order("name");
    setCustomers(data ?? []);
  }

  useEffect(() => { loadCustomers(); }, []);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function setNC(field, value) { setNewCustomer((f) => ({ ...f, [field]: value })); }

  async function handleSaveNewCustomer() {
    if (!newCustomer.name.trim()) { setCustomerError(t.err_name_required); return; }
    setSavingCustomer(true);
    setCustomerError(null);
    const { data, error: err } = await getSupabase().from("customers").insert({
      name: newCustomer.name.trim(),
      wechat_id: newCustomer.wechat_id.trim() || null,
      phone_number: newCustomer.phone_number.trim() || null,
      shipping_address: newCustomer.shipping_address.trim() || null,
    }).select().single();
    setSavingCustomer(false);
    if (err) { setCustomerError(err.message); return; }
    await loadCustomers();
    set("customer_id", data.id);
    setShowNewCustomer(false);
    setNewCustomer(EMPTY_NEW_CUSTOMER);
    setCustomerError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.customer_id) { setError(t.err_select_customer); return; }
    if (!form.product_name) { setError(t.err_product_name); return; }
    setSaving(true);
    setError(null);
    const { error: err } = await getSupabase().from("order_items").insert({
      customer_id: form.customer_id,
      brand: form.brand,
      product_name: form.product_name,
      provider: form.provider,
      price_per_qty_eur: pricePerQty,
      quantity: qty,
      cost_eur: costEur,
      cost_rmb: costRmb,
      exchange_rate: rate,
      purchase_date: form.purchase_date,
      delivery_date: form.delivery_date || null,
      order_status: form.order_status,
      payment_status: form.payment_status,
      notes: form.notes,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    router.push("/orders");
  }

  const fmtCalc = (val) =>
    val === 0 ? "0.00" : val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const ORDER_STATUSES = [
    t.status_ordered, t.status_goods_receipt, t.status_goods_issue, t.status_customer_confirms,
  ];

  return (
    <main className="min-h-screen bg-white p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="text-base text-gray-500 hover:text-black transition">{t.home}</Link>
        <h1 className="text-3xl font-bold text-black">{t.new_order_title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Section title={t.section_customer}>
          <Field label={t.field_customer}>
            <div className="flex gap-2">
              <select value={form.customer_id} onChange={(e) => set("customer_id", e.target.value)} className={selectCls + " flex-1"}>
                <option value="">{t.select_customer}</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => { setShowNewCustomer((v) => !v); setCustomerError(null); }}
                className="border-2 border-gray-800 text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition whitespace-nowrap text-sm">
                {showNewCustomer ? t.btn_cancel : t.btn_new_customer}
              </button>
            </div>
          </Field>
          {showNewCustomer && (
            <div className="border-2 border-gray-800 rounded-xl p-4 bg-gray-50 flex flex-col gap-3">
              <p className="text-sm font-bold uppercase tracking-wide text-black">{t.new_customer_title}</p>
              <Field label={t.field_name}><input type="text" value={newCustomer.name} onChange={(e) => setNC("name", e.target.value)} className={inputCls} /></Field>
              <Field label={t.field_wechat}><input type="text" value={newCustomer.wechat_id} onChange={(e) => setNC("wechat_id", e.target.value)} className={inputCls} /></Field>
              <Field label={t.field_phone}><input type="text" value={newCustomer.phone_number} onChange={(e) => setNC("phone_number", e.target.value)} className={inputCls} /></Field>
              <Field label={t.field_address}><textarea rows={2} value={newCustomer.shipping_address} onChange={(e) => setNC("shipping_address", e.target.value)} className={inputCls} /></Field>
              {customerError && <p className="text-red-600 text-sm font-medium">{customerError}</p>}
              <button type="button" onClick={handleSaveNewCustomer} disabled={savingCustomer}
                className="bg-black text-white py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50">
                {savingCustomer ? t.saving : t.btn_save_customer}
              </button>
            </div>
          )}
        </Section>

        <Section title={t.section_product}>
          <Field label={t.field_brand}><input type="text" value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} /></Field>
          <Field label={t.field_product_name}><input type="text" value={form.product_name} onChange={(e) => set("product_name", e.target.value)} className={inputCls} /></Field>
          <Field label={t.field_provider}>
            <select value={form.provider} onChange={(e) => set("provider", e.target.value)} className={selectCls}>
              <option value="">{t.select_provider}</option>
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </Section>

        <Section title={t.section_pricing}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.field_price_unit}><input type="number" step="0.01" min="0" value={form.price_per_qty_eur} onChange={(e) => set("price_per_qty_eur", e.target.value)} className={inputCls} placeholder="0.00" /></Field>
            <Field label={t.field_quantity}><input type="number" step="1" min="1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className={inputCls} /></Field>
            <Field label={t.field_cost_eur}><input type="number" step="0.01" min="0" value={form.cost_eur} onChange={(e) => set("cost_eur", e.target.value)} className={inputCls} placeholder="0.00" /></Field>
            <Field label={t.field_cost_rmb}><input type="number" step="0.01" min="0" value={form.cost_rmb} onChange={(e) => set("cost_rmb", e.target.value)} className={inputCls} placeholder="0.00" /></Field>
            <Field label={t.field_exchange_rate}><input type="number" step="0.0001" min="0" value={form.exchange_rate} onChange={(e) => set("exchange_rate", e.target.value)} className={inputCls} placeholder="e.g. 7.85" /></Field>
          </div>
          <div className="mt-4 border-2 border-gray-800 rounded-xl p-4 bg-gray-50">
            <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">{t.auto_calculated}</p>
            <div className="grid grid-cols-2 gap-3">
              <CalcRow label={t.field_total_eur} value={`€ ${fmtCalc(totalPriceEur)}`} />
              <CalcRow label={t.field_amount_rmb} value={`¥ ${fmtCalc(amountPaidRmb)}`} />
              <CalcRow label={t.field_margin_eur} value={`€ ${fmtCalc(marginEur)}`} negative={marginEur < 0} />
              <CalcRow label={t.field_margin_rmb} value={`¥ ${fmtCalc(marginRmb)}`} negative={marginRmb < 0} />
            </div>
          </div>
        </Section>

        <Section title={t.section_dates}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.field_purchase_date}><input type="date" value={form.purchase_date} onChange={(e) => set("purchase_date", e.target.value)} className={inputCls} /></Field>
            <Field label={t.field_delivery_date}><input type="date" value={form.delivery_date} onChange={(e) => set("delivery_date", e.target.value)} className={inputCls} /></Field>
          </div>
        </Section>

        <Section title={t.section_status}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t.field_order_status}>
              <select value={form.order_status} onChange={(e) => set("order_status", e.target.value)} className={selectCls}>
                {ORDER_STATUSES_EN.map((s, i) => <option key={s} value={s}>{ORDER_STATUSES[i]}</option>)}
              </select>
            </Field>
            <Field label={t.field_payment_status}>
              <select value={form.payment_status} onChange={(e) => set("payment_status", e.target.value)} className={selectCls}>
                <option value="Unpaid">{t.status_unpaid}</option>
                <option value="Paid">{t.status_paid}</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title={t.section_notes}>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className={inputCls} placeholder={t.notes_placeholder} />
        </Section>

        {error && <p className="text-red-600 font-medium">{error}</p>}

        <div className="flex gap-4">
          <button type="submit" disabled={saving}
            className="flex-1 bg-black text-white py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50">
            {saving ? t.saving : t.btn_save_order}
          </button>
          <Link href="/orders" className="flex-1 border-2 border-gray-800 text-black py-4 rounded-xl text-lg font-semibold text-center hover:bg-gray-100 transition">
            {t.btn_cancel}
          </Link>
        </div>
      </form>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-2 border-gray-800 rounded-xl p-5">
      <h2 className="text-base font-bold text-black uppercase tracking-wide mb-4">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
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

function CalcRow({ label, value, negative }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold tabular-nums ${negative ? "text-red-600" : "text-black"}`}>{value}</p>
    </div>
  );
}
