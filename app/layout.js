import "./globals.css";

export const metadata = {
  title: "SalesJournal",
  description: "Track your sales, customers, and margins",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
