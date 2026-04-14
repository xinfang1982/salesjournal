import Link from "next/link";

const NAV_ITEMS = [
  {
    href: "/summary",
    label: "Summary Overview",
    description: "Monthly & yearly gain matrix with net profit in RMB",
  },
  {
    href: "/orders/new",
    label: "Create New Order",
    description: "Log a new product order for a customer",
  },
  {
    href: "/orders",
    label: "Order List",
    description: "View and edit all orders, filter by customer",
  },
  {
    href: "/customers",
    label: "Customer Management",
    description: "Add, edit, and view orders per customer",
  },
  {
    href: "/costs",
    label: "Additional Costs",
    description: "Log packaging and overhead costs in RMB",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black">SalesJournal</h1>
          <p className="text-gray-400 mt-2 text-sm">Your personal sales tracker</p>
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
