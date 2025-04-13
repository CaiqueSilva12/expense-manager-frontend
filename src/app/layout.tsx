import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gerenciador de Despesas',
  description: 'Gerencie suas despesas e receitas de forma simples e eficiente',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Script id="remove-extension-attributes">
          {`
            document.body.removeAttribute('data-new-gr-c-s-check-loaded');
            document.body.removeAttribute('data-gr-ext-installed');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
