import "./globals.css";

export const metadata = {
  title: "Ely Fishing Trip",
  description: "Our family fishing trip to Ely, Minnesota",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
