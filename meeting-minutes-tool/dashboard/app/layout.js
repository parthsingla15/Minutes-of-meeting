export const metadata = {
  title: "Meeting Minutes",
  description: "Bot-free AI meeting minutes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "-apple-system, Segoe UI, sans-serif", background: "#0e1015", color: "#e6e6e6" }}>
        {children}
      </body>
    </html>
  );
}