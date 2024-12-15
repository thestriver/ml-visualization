import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ML Visualization Portfolio',
  description: 'Demonstrating experience with D3.js, visx, and WebGL for ML visualization',
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