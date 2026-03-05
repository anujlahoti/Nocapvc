import './Problem.css';

export default function Problem() {
  return (
    <section className="sec" id="problem">
      <div className="sec-inner">
        <div className="tag rev">The Problem</div>
        <h2 className="sh2 rev">
          The Indian startup funding<br />system is <em>broken.</em>
        </h2>
        <div className="prob-grid">
          <div className="prob-card rev">
            <span className="prob-n">01</span>
            <div className="prob-t">The Application Grind</div>
            <p className="prob-b">
              Founders spend <strong>weeks filling duplicate forms</strong> — name, idea, stage, market size — typed out 10, 15, 20 times for different incubators. The process filters out great founders who run out of energy, not ideas.
            </p>
          </div>
          <div className="prob-card rev d1">
            <span className="prob-n">02</span>
            <div className="prob-t">The Silence After</div>
            <p className="prob-b">
              Most founders apply and hear <strong>absolutely nothing.</strong> No rejection. No feedback. No reason. Without knowing why they failed, they repeat the same mistakes in every next application.
            </p>
          </div>
        </div>
        <div className="quote rev">
          <p className="quote-t">
            I applied to 11 incubators last year. Heard back from 2. Got zero feedback from any of them. I still don't know what I was doing wrong.
          </p>
          <div className="quote-a">— Early stage founder, Mumbai · 2024</div>
        </div>
      </div>
    </section>
  );
}
