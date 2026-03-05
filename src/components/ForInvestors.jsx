import './ForInvestors.css';

const cards = [
  { icon: '🎯', t: 'Pre-filtered by intent', b: 'Our form makes low-intent founders self-select out. You only see startups from genuinely committed founders who are stage-appropriate for your thesis.' },
  { icon: '📊', t: '76K founder community', b: 'Deal flow from a community of 76,000+ founders who follow NoCap VC for daily insights. Organic, engaged, and growing.' },
  { icon: '⚡', t: 'Structured pipeline', b: 'Every application arrives formatted, sectored, and staged. Your team spends time evaluating, not parsing raw emails.' },
  { icon: '🤝', t: 'Brand building with founders', b: "Founders remember who gave them useful feedback. Investors in NoCap VC's framework build reputation in the community — the most valuable distribution channel in Indian startup investing." },
];

export default function ForInvestors() {
  return (
    <section className="inv-sec" id="investors">
      <div className="sec-inner">
        <div className="tag rev">For Investors &amp; Incubators</div>
        <h2 className="sh2 rev">Curated deal flow.<br /><em>Zero noise.</em></h2>
        <div className="inv-grid">
          <div className="inv-list rev">
            {cards.map((c) => (
              <div className="inv-card" key={c.t}>
                <div className="inv-ico">{c.icon}</div>
                <div>
                  <div className="inv-t">{c.t}</div>
                  <p className="inv-b">{c.b}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="inv-cta-box rev d2">
            <h3>Partner with<br /><span style={{ color: 'var(--yellow)' }}>NoCap VC</span></h3>
            <p>We're onboarding a small number of investor and incubator partners. Currently active with 2 incubators and 1 angel — next cohort opening soon.</p>
            <a href="mailto:partner@nocapvc.com" className="btn-outline">Apply to Partner →</a>
            <div className="inv-meta">
              <div className="inv-meta-lbl">Currently onboarded</div>
              <div className="inv-row"><span>Partner Incubators</span><span>2 active</span></div>
              <div className="inv-row"><span>Angel Investors</span><span>1 active</span></div>
              <div className="inv-row green"><span>Next partner slots</span><span>Open Q2 2025</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
