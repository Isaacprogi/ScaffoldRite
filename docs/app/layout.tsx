import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: "Scaffoldrite",
  icons: {
    icon: "/scaffoldrite/logo.png",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        // required styles
        className="flex flex-col min-h-screen"
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}