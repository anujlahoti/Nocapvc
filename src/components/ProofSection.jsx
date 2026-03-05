import './ProofSection.css';

const ticker = [
  'No Ghosting. Ever.', '76,000 Founders Strong', 'Built in India · For India',
  'Free for Founders · Always', 'Structured Feedback on Every Application',
  'One Form · Multiple Investors',
];

export default function ProofSection() {
  const doubled = [...ticker, ...ticker];
  return (
    <section className="sec proof-sec" id="proof">
      <div className="sec-inner">
        <div className="tag rev">By the Numbers</div>
        <h2 className="sh2 rev">The results speak.<br /><em>Loudly.</em></h2>
        <div className="proof-nums">
          {[
            { n: '76K+', l: 'Founders in NoCap community' },
            { n: '100%', l: 'Applications get a response' },
            { n: '14', l: 'Days — max feedback window' },
            { n: '3×', l: 'More responses with video' },
          ].map((p) => (
            <div className="pnum rev" key={p.n}>
              <span className="pbig">{p.n}</span>
              <span className="plbl">{p.l}</span>
            </div>
          ))}
        </div>
        <div className="ticker-w">
          <div className="ticker-t">
            {doubled.map((t, i) => (
              <span className="tick-i" key={i}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
