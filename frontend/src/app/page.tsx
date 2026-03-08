import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Mesh background */}
        <div className="absolute inset-0 bg-mesh-cyan pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan/5 blur-[120px]" />
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-green-accent/4 blur-[100px]" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan/30 bg-cyan/5 text-cyan text-sm font-body mb-8 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-green-accent animate-pulse" />
              Built on Flow Blockchain
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 animate-slide-up">
              <span className="text-text-primary">Build, compete,</span>
              <br />
              <span className="bg-gradient-to-r from-cyan via-cyan to-green-accent bg-clip-text text-transparent">
                get paid on-chain.
              </span>
            </h1>

            <p className="font-body text-lg text-text-secondary max-w-xl leading-relaxed mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Coorda connects builders with hosts through transparent, AI-verified buildathons.
              Prize funds locked in on-chain escrow. No middlemen. Just code.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Link href="/buildathons" className="btn btn-primary text-base px-6 py-3 glow-cyan">
                Browse buildathons →
              </Link>
              <Link href="/signup" className="btn btn-secondary text-base px-6 py-3">
                Start hosting
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 flex flex-wrap gap-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {[
                { label: 'Active buildathons', value: 'Live' },
                { label: 'AI verification', value: '3 models' },
                { label: 'On-chain escrow', value: 'Flow' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="font-display font-bold text-2xl text-text-primary">{value}</div>
                  <div className="font-body text-sm text-text-muted mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-text-primary mb-4">
              How Coorda works
            </h2>
            <p className="font-body text-text-secondary max-w-xl mx-auto">
              A trustless buildathon platform where every action is verifiable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '⚡',
                title: 'Hosts create buildathons',
                desc: 'Set prize pools, define waves with specific requirements, lock funds in Flow escrow.',
                color: 'from-cyan/20 to-transparent',
                border: 'border-cyan/20',
              },
              {
                icon: '🔨',
                title: 'Builders submit work',
                desc: 'Join waves, build your project, submit via GitHub repo + IPFS file upload.',
                color: 'from-green-accent/15 to-transparent',
                border: 'border-green-accent/20',
              },
              {
                icon: '🤖',
                title: 'AI verifies, chain pays',
                desc: 'Gemini, Claude, or GPT-4o verifies submissions. Host releases funds on-chain.',
                color: 'from-purple-500/10 to-transparent',
                border: 'border-purple-500/20',
              },
            ].map(({ icon, title, desc, color, border }) => (
              <div
                key={title}
                className={`rounded-2xl border ${border} bg-gradient-to-b ${color} p-8 glass-hover relative overflow-hidden`}
              >
                <div className="text-4xl mb-5">{icon}</div>
                <h3 className="font-display font-bold text-xl text-text-primary mb-3">{title}</h3>
                <p className="font-body text-text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Models */}
      <section className="py-24 bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <h2 className="font-display text-4xl font-bold text-text-primary mb-5">
                AI-powered verification
              </h2>
              <p className="font-body text-text-secondary leading-relaxed mb-8">
                Every submission gets analyzed against buildathon requirements.
                Choose your verification model based on depth and credit cost.
              </p>
              <div className="space-y-3">
                {[
                  { model: 'Gemini 1.5 Flash', cost: '0.5 cr', speed: 'Fast', desc: 'Quick analysis, great for initial screening' },
                  { model: 'Claude 3 Haiku', cost: '1.0 cr', speed: 'Balanced', desc: 'Detailed analysis with nuanced reasoning' },
                  { model: 'GPT-4o Mini', cost: '1.5 cr', speed: 'Deep', desc: 'Comprehensive analysis + improvement suggestions' },
                ].map(({ model, cost, speed, desc }) => (
                  <div key={model} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-elevated/50 glass-hover">
                    <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-cyan text-xs font-bold font-mono">{speed[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body font-medium text-text-primary">{model}</span>
                        <span className="text-xs text-cyan font-mono border border-cyan/30 px-1.5 py-0.5 rounded">{cost}</span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative w-72 h-72">
                <div className="absolute inset-0 rounded-full border border-cyan/10 animate-pulse-slow" />
                <div className="absolute inset-8 rounded-full border border-green-accent/10 animate-pulse-slow" style={{ animationDelay: '1s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="font-display text-6xl font-black text-transparent bg-gradient-to-b from-cyan to-green-accent bg-clip-text">87</div>
                    <div className="font-body text-text-muted text-sm mt-1">Verification score</div>
                    <div className="mt-4 flex flex-col gap-1.5 text-xs font-body">
                      {['Flow integration ✓', 'Open source ✓', 'Commits valid ✓'].map((item) => (
                        <div key={item} className="text-green-accent">{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan/5 via-transparent to-green-accent/5" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-black text-text-primary mb-6">
            Ready to build?
          </h2>
          <p className="font-body text-text-secondary text-lg mb-10">
            Join the next generation of blockchain buildathons. Create your profile and start earning.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="btn btn-primary text-base px-8 py-3 glow-cyan">
              Create account
            </Link>
            <Link href="/buildathons" className="btn btn-secondary text-base px-8 py-3">
              View buildathons
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
