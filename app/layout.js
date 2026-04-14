import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

export const metadata = {
  title: "SalesJournal",
  description: "Track your sales, customers, and margins",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body className="bg-white text-black antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
