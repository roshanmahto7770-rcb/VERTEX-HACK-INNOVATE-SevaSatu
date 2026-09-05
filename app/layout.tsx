import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SevaSetu - AI-Powered Grievance Redressal & Triage System',
  description: 'AI-driven citizen grievance portal and municipal triage management powered by Google Gemini 2.5 Flash and PostGIS spatial clustering.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] antialiased">
        {children}
      </body>
    </html>
  );
}
