import './HowItWorks.css';

const steps = [
  {
    n: 'STEP 01', icon: '📝',
    title: 'Fill One Intelligent Form',
    body: 'Answer questions designed to surface your real conviction — not just pitch deck bullets. Takes 5–7 minutes. Designed to filter intent, not exhaust effort.',
  },
  {
    n: 'STEP 02', icon: '🎯',
    title: 'We Route You to the Right Doors',
    body: 'Your application is matched and sent to partner incubators and angels based on sector, stage, and fit. Curated and deliberate — not spray and pray.',
    delay: 'd1',
  },
  {
    n: 'STEP 03', icon: '💬',
    title: 'You Get Structured Feedback',
    body: 'Within 14 days, every founder receives a structured response — the red flag, one actionable fix, and whether they had revisit. Not silence. Real feedback.',
    delay: 'd2',
  },
];

export default function HowItWorks() {
  return (
    <section className="how-sec" id="how">
      <div className="sec-inner">
        <div className="tag rev">How It Works</div>
        <h2 className="sh2 rev">Three steps.<em>One system.</em></h2>
        <div className="steps">
          {steps.map((s) => (
            <div className={`step rev ${s.delay || ''}`} key={s.n}>
              <span className="step-n">{s.n}</span>
              <span className="step-ico">{s.icon}</span>
              <div className="step-t">{s.title}</div>
              <p className="step-b">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
