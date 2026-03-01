import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import './globals.css';
import { AppearanceProvider } from '@/components/AppearanceProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MusicHub - 经典华语音乐',
  description: '发现经典华语音乐，重温80-90年代的美好旋律',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const scheme = cookieStore.get('music-color-scheme')?.value ?? 'system';
  // system 时不加 class，让 CSS media query 兜底；dark 时加 dark class
  const htmlClass = scheme === 'dark' ? 'dark' : '';

  return (
    <html lang="zh-CN" className={htmlClass} suppressHydrationWarning>
      <body className={inter.className}>
        <AppearanceProvider>
          {children}
        </AppearanceProvider>
      </body>
    </html>
  );
}
