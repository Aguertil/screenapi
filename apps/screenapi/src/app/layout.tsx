export const metadata = {
  title: 'ScreenAPI - Screenshot API Service',
  description: 'Professional screenshot API for web pages',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
