"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

const ORDER_STATUSES = ["Ordered", "Goods Receipt", "Goods Issue", "Customer Confirms"];
const PROVIDERS = ["Amazon", "DM", "Rossmann", "Other"];

const fmt = (v) =>
  v == null ? "-" : Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function OrdersPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white p-6"><p className="text-gray-400">Loading orders...</p></main>}>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filterCustomer, setFilterCustomer] = useState(searchParams.get("customer") ?? "");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async (customerId) => {
    setLoading(true);
    let query = getSupabase()
      .from("order_items")
      .select("*, customers(name)")
      .order("purchase_date", { ascending: false });
    if (customerId) query = query.eq("customer_id", customerId);
    const { data } = await query;
    setOrders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    getSupabase().from("customers").select("id, name").order("name").then(({ data }) => {
      setCustomers(data ?? []);
    });
    fetchOrders(searchParams.get("customer") ?? "");
  }, [fetchOrders, searchParams]);

  function handleFilterChange(e) {
    const val = e.target.value;
    setFilterCustomer(val);
    fetchOrders(val);
  }

  function startEdit(order) {
    setEditingId(order.id);
    setEditValues({
      customer_id: order.customer_id ?? "",
      brand: order.brand ?? "",
      product_name: order.product_name ?? "",
      provider: order.provider ?? "",
      price_per_qty_eur: order.price_per_qty_eur ?? "",
      quantity: order.quantity ?? 1,
      cost_eur: order.cost_eur ?? "",
      cost_rmb: order.cost_rmb ?? "",
      exchange_rate: order.exchange_rate ?? "",
      purchase_date: order.purchase_date ?? "",
      delivery_date: order.delivery_date ?? "",
      order_status: order.order_status ?? "Ordered",
      payment_status: order.payment_status ?? "Unpaid",
      notes: order.notes ?? "",
    });
  }

  function setVal(field, value) {
    setEditValues((v) => ({ ...v, [field]: value }));
  }

  // Derived values for the row being edited
  const qty = parseFloat(editValues.quantity) || 0;
  const price = parseFloat(editValues.price_per_qty_eur) || 0;
  const costEur = parseFloat(editValues.cost_eur) || 0;
  const costRmb = parseFloat(editValues.cost_rmb) || 0;
  const rate = parseFloat(editValues.exchange_rate) || 0;
  const totalEur = price * qty;
  const amountRmb = totalEur * rate;
  const marginEur = totalEur - costEur;
  const marginRmb = amountRmb - costRmb;

  async function saveEdit(id) {
    setSaving(true);
    const { error } = await getSupabase().from("order_items").update({
      customer_id: editValues.customer_id,
      brand: editValues.brand,
      product_name: editValues.product_name,
      provider: editValues.provider,
      price_per_qty_eur: price,
      quantity: qty,
      cost_eur: costEur,
      cost_rmb: costRmb,
      exchange_rate: rate,
      purchase_date: editValues.purchase_date,
      delivery_date: editValues.delivery_date,
      order_status: editValues.order_status,
      payment_status: editValues.payment_status,
      notes: editValues.notes,
    }).eq("id", id);
    setSaving(false);
    if (!error) {
      setEditingId(null);
      fetchOrders(filterCustomer);
    }
  }

  async function deleteOrder(id) {
    if (!confirm("Delete this order?")) return;
    await getSupabase().from("order_items").delete().eq("id", id);
    fetchOrders(filterCustomer);
  }

  const inputCls = "border border-gray-400 rounded px-2 py-1 text-sm w-full bg-white focus:outline-none focus:border-black";
  const selectCls = "border border-gray-400 rounded px-2 py-1 text-sm w-full bg-white focus:outline-none focus:border-black";

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-base text-gray-500 hover:text-black transition">
          ← Home
        </Link>
        <h1 className="text-3xl font-bold text-black">Order List</h1>
        <Link
          href="/orders/new"
          className="ml-auto border-2 border-gray-800 text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition text-base"
        >
          + New Order
        </Link>
      </div>

      {/* Filter */}
      <div className="mb-6 flex items-center gap-3">
        <label className="text-base font-semibold text-black">Filter by customer:</label>
        <select
          value={filterCustomer}
          onChange={handleFilterChange}
          className="border-2 border-gray-800 rounded-xl px-4 py-2 text-base bg-white text-black focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">All customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400 text-base">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400 text-base">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse w-full min-w-max text-sm">
            <thead>
              <tr className="bg-black text-white">
                {["Customer","Brand","Product","Provider","Price/Unit (€)","Qty","Total (€)","Cost (€)","Cost (¥)","Rate","Paid (¥)","Margin (€)","Margin (¥)","Purchase Date","Delivery Date","Order Status","Payment","Notes",""].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-semibold border border-gray-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const isEditing = editingId === order.id;
                const rowCls = i % 2 === 0 ? "bg-white" : "bg-gray-50";

                if (isEditing) {
                  return (
                    <tr key={order.id} className="bg-yellow-50">
                      <td className="px-2 py-1 border-2 border-black">
                        <select value={editValues.customer_id} onChange={(e) => setVal("customer_id", e.target.value)} className={selectCls}>
                          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 border-2 border-black"><input value={editValues.brand} onChange={(e) => setVal("brand", e.target.value)} className={inputCls} /></td>
                      <td className="px-2 py-1 border-2 border-black"><input value={editValues.product_name} onChange={(e) => setVal("product_name", e.target.value)} className={inputCls} /></td>
                      <td className="px-2 py-1 border-2 border-black">
                        <select value={editValues.provider} onChange={(e) => setVal("provider", e.target.value)} className={selectCls}>
                          <option value="">-</option>
                          {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 border-2 border-black"><input type="number" step="0.01" value={editValues.price_per_qty_eur} onChange={(e) => setVal("price_per_qty_eur", e.target.value)} className={inputCls} /></td>
                      <td className="px-2 py-1 border-2 border-black"><input type="number" step="1" value={editValues.quantity} onChange={(e) => setVal("quantity", e.target.value)} className={inputCls} /></td>
                      <td className="px-2 py-1 border-2 border-black text-right tabular-nums font-semibold">{fmt(totalEur)}</td>
                      <td className="px-2 py-1 border-2 border-black"><input type="number" step="0.01" value={editValues.cost_eur} onChange={(e) => setVal("cost_eur", e.target.value)} className={inputCls} /></td>
                      <td className="px-2 py-1 border-2 border-black"><input type="number" step="0.01" value={editValues.cost_rmb} onChange={(e) => setVal("cost_rmb", e.target.value)} className={inputCls} /></td>
                      <td className="px-2 py-1 border-2 border-black"><input type="number" step="0.0001" value={editValues.exchange_rate} onChange={(e) => setVal("exchange_rate", e.target.value)} className={inputCls} /></td>
                      <td className="px-2 py-1 border-2 border-black text-right tabular-nums font-semibold">{fmt(amountRmb)}</td>
                      <td className="px-2 py-1 border-2 border-black text-right tabular-nums font-semibold">{fmt(marginEur)}</td>
                      <td className="px-2 py-1 border-2 border-black text-right tabular-nums font-semibold">{fmt(marginRmb)}</td>
                      <td className="px-2 py-1 border-2 border-black"><input type="date" value={editValues.purchase_date} onChange={(e) => setVal("purchase_date", e.target.value)} className={inputCls} /></td>
                      <td className="px-2 py-1 border-2 border-black"><input type="date" value={editValues.delivery_date} onChange={(e) => setVal("delivery_date", e.target.value)} className={inputCls} /></td>
                      <td className="px-2 py-1 border-2 border-black">
                        <select value={editValues.order_status} onChange={(e) => setVal("order_status", e.target.value)} className={selectCls}>
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1 border-2 border-black">
                        <select value={editValues.payment_status} onChange={(e) => setVal("payment_status", e.target.value)} className={selectCls}>
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </td>
                      <td className="px-2 py-1 border-2 border-black"><input value={editValues.notes} onChange={(e) => setVal("notes", e.target.value)} className={inputCls} /></td>
                      <td className="px-2 py-1 border-2 border-black whitespace-nowrap">
                        <button onClick={() => saveEdit(order.id)} disabled={saving} className="bg-black text-white px-3 py-1 rounded font-semibold mr-1 hover:bg-gray-800 disabled:opacity-50">
                          {saving ? "..." : "Save"}
                        </button>
                        <button onClick={() => setEditingId(null)} className="border border-gray-400 px-3 py-1 rounded hover:bg-gray-100">
                          Cancel
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={order.id} className={`${rowCls} hover:bg-gray-100`}>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">{order.customers?.name ?? "-"}</td>
                    <td className="px-3 py-2 border border-gray-300">{order.brand ?? "-"}</td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">{order.product_name}</td>
                    <td className="px-3 py-2 border border-gray-300">{order.provider ?? "-"}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right tabular-nums">{fmt(order.price_per_qty_eur)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right tabular-nums">{order.quantity}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right tabular-nums">{fmt(order.total_price_eur)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right tabular-nums">{fmt(order.cost_eur)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right tabular-nums">{fmt(order.cost_rmb)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right tabular-nums">{fmt(order.exchange_rate)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right tabular-nums">{fmt(order.amount_paid_rmb)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right tabular-nums">{fmt(order.margin_eur)}</td>
                    <td className="px-3 py-2 border border-gray-300 text-right tabular-nums">{fmt(order.margin_rmb)}</td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">{order.purchase_date}</td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">{order.delivery_date}</td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">
                      <span className="border border-gray-400 rounded px-2 py-0.5 text-xs font-medium">{order.order_status}</span>
                    </td>
                    <td className="px-3 py-2 border border-gray-300">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${order.payment_status === "Paid" ? "bg-black text-white" : "border border-gray-400 text-gray-600"}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-3 py-2 border border-gray-300 max-w-[150px] truncate">{order.notes ?? "-"}</td>
                    <td className="px-3 py-2 border border-gray-300 whitespace-nowrap">
                      <button onClick={() => startEdit(order)} className="border border-gray-800 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 mr-1">Edit</button>
                      <button onClick={() => deleteOrder(order.id)} className="border border-gray-400 px-3 py-1 rounded text-sm text-gray-500 hover:bg-red-50 hover:border-red-400 hover:text-red-600">Del</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
