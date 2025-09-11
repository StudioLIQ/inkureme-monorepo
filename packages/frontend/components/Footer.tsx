'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[--color-border] bg-white/60 dark:bg-background/60 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Desktop / Tablet Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 items-start">
          <div>
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary">🛡️</span>
              <span>Inkureme</span>
            </div>
            <p className="text-sm text-muted mt-3 max-w-sm">
              Decentralized flight delay insurance on Kaia. Transparent coverage and automated payouts.
            </p>
          </div>

          <div className="text-sm">
            <div className="font-semibold mb-3">Product</div>
            <ul className="space-y-2 text-muted">
              <li><Link href="/policies" className="hover:text-foreground">Available Policies</Link></li>
              <li><Link href="/create" className="hover:text-foreground">Create Policy</Link></li>
              <li><Link href="/my-policies" className="hover:text-foreground">My Policies</Link></li>
            </ul>
          </div>

          <div className="text-sm">
            <div className="font-semibold mb-3">Resources</div>
            <ul className="space-y-2 text-muted">
              <li><a href="https://baobab.kaiascan.io" target="_blank" rel="noreferrer" className="hover:text-foreground">KaiaScan</a></li>
              <li><a href="https://docs.kaia.io/" target="_blank" rel="noreferrer" className="hover:text-foreground">Kaia Docs</a></li>
              <li><a href="https://github.com/" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a></li>
            </ul>
          </div>
        </div>

        {/* Mobile Compact Footer */}
        <div className="md:hidden text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary">🛡️</span>
              <span>Inkureme</span>
            </div>
            <div className="flex items-center gap-3 text-muted">
              <Link href="/policies" className="hover:text-foreground">Policies</Link>
              <Link href="/create" className="hover:text-foreground">Create</Link>
              <Link href="/my-policies" className="hover:text-foreground">Mine</Link>
            </div>
          </div>
          <p className="text-xs text-muted mt-3">
            Decentralized flight delay insurance on Kaia.
          </p>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-[--color-border] pt-6 text-xs text-muted">
          <div>© {new Date().getFullYear()} Inkureme. All rights reserved.</div>
          <div className="hidden md:flex items-center gap-4">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
