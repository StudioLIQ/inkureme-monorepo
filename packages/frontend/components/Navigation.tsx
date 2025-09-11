'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletButton } from './WalletButton'

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/create', label: 'Create Insurance' },
    { href: '/policies', label: 'Available Policies' },
    { href: '/my-policies', label: 'My Policies' },
  ]

  return (
    <header className="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-[--color-border] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-semibold text-foreground">
              🛡️ Inkureme
            </Link>
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <WalletButton />
        </div>
        <nav className="md:hidden flex space-x-4 pb-3 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium whitespace-nowrap px-2 py-1 rounded transition-colors ${
                pathname === item.href
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
