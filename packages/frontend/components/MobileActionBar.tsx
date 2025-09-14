"use client"

import React from 'react'

export function MobileActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="pointer-events-none px-3 pb-[calc(env(safe-area-inset-bottom)+8px)]">
        <div className="pointer-events-auto bg-white border border-[--color-border] rounded-2xl shadow-lg p-3">
          {children}
        </div>
      </div>
    </div>
  )
}

