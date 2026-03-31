import ApplicationForm from './ApplicationForm';
import './ApplicationForm.css';

export default function ApplicationSection() {
  return (
    <section className="form-sec" id="apply">
      <div className="sec-inner">
        <div className="tag rev">Apply Now</div>
        <h2 className="sh2 rev">Your next chapter<br />starts <em>here.</em></h2>
        <div className="form-layout">
          <div className="rev">
            <h3 className="form-sb-title">Fill once.<br /><em>Reach many.</em></h3>
            <p className="form-sb-body">Every application is reviewed by partner incubators and investors. Every founder receives structured feedback within 14 days. No ghosting — that's the NoCap promise.</p>
            <div className="promises">
              <div className="promise">Free to apply. Always.</div>
              <div className="promise">Sent to 2 incubators + 5 angel investors & VCs.</div>
              <div className="promise">Structured feedback within 14 days.</div>
              <div className="promise">No ghosting. That's the NoCap promise.</div>
              <div className="promise">Founders with video links get 3× more responses.</div>
            </div>
          </div>
          <div className="rev d2">
            <ApplicationForm />
          </div>
        </div>
      </div>
    </section>
  );
}
