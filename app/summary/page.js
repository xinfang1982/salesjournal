import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import { buildSummaryData } from "@/lib/summary";
import SummaryTable from "./SummaryTable";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const supabase = createServerClient();

  const [{ data: orderItems }, { data: additionalCosts }] = await Promise.all([
    supabase.from("order_items").select("purchase_date, margin_rmb").eq("payment_status", "Paid"),
    supabase.from("additional_costs").select("date, amount_rmb"),
  ]);

  const summary = buildSummaryData(orderItems ?? [], additionalCosts ?? []);

  return <SummaryTable summary={summary} />;
}
