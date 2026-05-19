import "./globals.css";

export const metadata = {
  title: "Beresin Web - Admin",
  description: "Dashboard manajemen operasional bengkel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}