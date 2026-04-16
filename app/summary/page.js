import Link from "next/link";
import { createServerClient } from "@/lib/supabase-server";
import SummaryTable from "./SummaryTable";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const supabase = createServerClient();

  const [{ data: orderItems }, { data: additionalCosts }] = await Promise.all([
    supabase.from("order_items").select("purchase_date, margin_rmb, payment_status"),
    supabase.from("additional_costs").select("date, amount_rmb"),
  ]);

  return <SummaryTable orderItems={orderItems ?? []} additionalCosts={additionalCosts ?? []} />;
}
