"use client"

import Reveal from "@/components/Reveal"
import CountUp from "@/components/CountUp"

export default function StatsSection() {
  return (
    <section className="py-16 sm:py-24 lg:py-28 bg-gradient-to-b from-white to-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          <Reveal durationMs={500}>
            <div>
              <CountUp to={100} suffix="%" className="text-2xl sm:text-3xl font-bold text-primary tabular-nums" />
              <div className="text-xs sm:text-sm text-muted mt-1">Automated Claims</div>
            </div>
          </Reveal>
          <Reveal delayMs={80} durationMs={500}>
            <div>
              <CountUp
                from={0}
                to={59}
                durationMs={1200}
                className="text-2xl sm:text-3xl font-bold text-primary tabular-nums"
                format={(v) => (v >= 59 ? '< 1 min' : `${Math.max(1, Math.round(v))} sec`)}
              />
              <div className="text-xs sm:text-sm text-muted mt-1">Purchase Time</div>
            </div>
          </Reveal>
          <Reveal delayMs={160} durationMs={500}>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                <CountUp to={24} durationMs={1200} className="tabular-nums" />/7
              </div>
              <div className="text-xs sm:text-sm text-muted mt-1">Platform Availability</div>
            </div>
          </Reveal>
          <Reveal delayMs={240} durationMs={500}>
            <div>
              <CountUp to={0} className="text-2xl sm:text-3xl font-bold text-primary tabular-nums" />
              <div className="text-xs sm:text-sm text-muted mt-1">Hidden Fees</div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

