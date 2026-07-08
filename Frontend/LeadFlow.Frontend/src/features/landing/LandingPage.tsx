import { Navbar }           from './components/Navbar'
import { HeroSection }      from './components/HeroSection'
import { HowItWorksSection } from './components/HowItWorksSection'
import { FeaturesSection }  from './components/FeaturesSection'
import { AISection }        from './components/AISection'
import { QuotesSection }    from './components/QuotesSection'
import { ReportsSection }   from './components/ReportsSection'
import { CTASection }       from './components/CTASection'
import { Footer }           from './components/Footer'

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5fbf8] text-slate-950">
      {/* Fixed background grid + glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(15,23,42,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.028)_1px,transparent_1px)] bg-size-[40px_40px]"
      />

      <Navbar />

      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <AISection />
        <QuotesSection />
        <ReportsSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  )
}
