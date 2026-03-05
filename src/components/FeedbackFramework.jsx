import './FeedbackFramework.css';

const points = [
  { n: '01', t: 'Stage Fit Check', b: "Does your startup match what this investor actually funds? Know instantly if you're pitching the wrong room." },
  { n: '02', t: 'The Red Flag', b: 'The single biggest concern that made them pause or pass. Specific. Honest. The thing nobody usually tells you.' },
  { n: '03', t: 'One Thing to Fix', b: "One actionable improvement before your next raise. Not a list of 10 things. One. So you know exactly where to focus." },
  { n: '04', t: 'Revisit Potential', b: "Would they look again in 6 months if you fix X? This single signal tells you whether to pivot, persist, or move on." },
  { n: '05', t: 'Warm Intro (Optional)', b: "If there's a better-fit investor in their network, they flag it. One warm intro beats 100 cold emails." },
];

export default function FeedbackFramework() {
  return (
    <section className="sec" id="feedback">
      <div className="sec-inner">
        <div className="tag rev">The NoCap Framework</div>
        <h2 className="sh2 rev">Feedback that actually<br /><em>moves you forward.</em></h2>
        <div className="fb-grid">
          <div className="fp-list rev">
            {points.map((p) => (
              <div className="fp" key={p.n}>
                <div className="fp-n">{p.n}</div>
                <div>
                  <div className="fp-t">{p.t}</div>
                  <p className="fp-b">{p.b}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mockup rev d2">
            <div className="mockup-hd">
              <div className="m-dot" style={{ background: '#ff5f57' }} />
              <div className="m-dot" style={{ background: '#febc2e' }} />
              <div className="m-dot" style={{ background: '#28c840' }} />
              <span className="mockup-tt">NoCap VC · Feedback Report</span>
            </div>
            <div className="mockup-bd">
              <div className="m-from">FROM PARTNER INCUBATOR · 8 days after application</div>
              <div className="m-st">EduReach — EdTech, Pre-revenue</div>
              <div className="m-item red">
                <div className="m-lbl">🚩 Biggest Red Flag</div>
                <div className="m-txt">No evidence of talking to even 10 teachers before building. Talk to 50 teachers before your next raise.</div>
              </div>
              <div className="m-item yel">
                <div className="m-lbl">⚡ One Thing to Fix</div>
                <div className="m-txt">Run a 30-day pilot with 3 schools for free. Come back with retention data. That's the only thing that changes our decision.</div>
              </div>
              <div className="m-item grn">
                <div className="m-lbl">✅ Personal Suggestion</div>
                <div className="m-txt">Your storytelling is strong and founder-market fit is clear. The conviction is there — the evidence isn't yet.</div>
              </div>
              <div className="m-rev">
                <span className="m-rev-l">Would revisit in 6 months?</span>
                <span className="m-rev-v">YES — if pilot data exists</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
