'use client';

import { type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  Home,
  Hexagon,
  Clapperboard,
  Repeat2,
  UserRound,
  Settings,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: '创作台', icon: Home },
  { href: '/sandbox', label: '灵感速绘', icon: Hexagon },
  { href: '/pipelines/standard', label: '图文成片', icon: Clapperboard },
  { href: '/pipelines/action-transfer', label: '动作复刻', icon: Repeat2 },
  { href: '/pipelines/digital-human', label: 'AI口播', icon: UserRound },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className="min-h-screen bg-(--hf-bg) text-(--hf-text)"
      style={{ '--app-sidebar-width': '0px' } as CSSProperties}
    >
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-40 border-b border-(--hf-border) bg-(--hf-bg)/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-(--hf-radius-sm) bg-(--hf-accent) text-sm font-bold text-(--hf-accent-ink)">
              梦
            </span>
            <span className="text-base font-semibold text-(--hf-text)">造梦</span>
          </Link>

          {/* 导航项 */}
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex shrink-0 items-center gap-1.5 rounded-(--hf-radius-sm) px-2 py-1 text-sm font-medium transition-colors',
                    active
                      ? 'text-(--hf-accent)'
                      : 'text-(--hf-text-muted) hover:text-(--hf-text)'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 右侧操作 */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/settings"
              className={clsx(
                'flex items-center gap-1.5 rounded-(--hf-radius-md) px-3 py-1.5 text-sm font-medium transition-colors',
                pathname.startsWith('/settings')
                  ? 'bg-(--hf-accent-soft) text-(--hf-accent)'
                  : 'text-(--hf-text-muted) hover:text-(--hf-text)'
              )}
            >
              <Settings className="h-4 w-4" />
              设置
            </Link>
            <Link
              href="/"
              className="rounded-(--hf-radius-lg) bg-(--hf-accent) px-4 py-2 text-sm font-semibold text-(--hf-accent-ink) transition-opacity hover:opacity-90"
            >
              开始创作
            </Link>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
