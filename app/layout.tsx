import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppearanceProvider } from '@/components/AppearanceProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MusicHub - 经典华语音乐',
  description: '发现经典华语音乐，重温80-90年代的美好旋律',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('music-color-scheme') || 'system';
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (theme === 'dark' || (theme === 'system' && prefersDark)) {
                document.documentElement.classList.add('dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className={inter.className}>
        <AppearanceProvider>
          {children}
        </AppearanceProvider>
      </body>
    </html>
  );
}
