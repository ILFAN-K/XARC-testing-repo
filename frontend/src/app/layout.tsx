import './globals.css';

export const metadata = {
  title: 'XARC Nexus Hub',
  description: 'Centralized XR management hub for XARC Nexus'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
