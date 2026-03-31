import { useState, useEffect, useRef } from 'react';
import './AIInterview.css';

const APPS_SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL;
const GEMINI_KEY = process.env.REACT_APP_GEMINI_KEY;
const TOTAL_QUESTIONS = 8;

const SYSTEM_PROMPT = `You are NoCap AI, a sharp investment analyst conducting first-meeting founder interviews for NoCap VC — India's founder-first funding platform. Your energy is that of a seasoned YC partner: direct, intellectually curious, deeply prepared, no fluff.

You have been given the founder's full application. Read it carefully. Design exactly 8 questions tailored specifically to this founder and this startup — not a generic checklist.

QUESTION ORDER (roughly):
1. Founder background — why are YOU specifically the right person to solve this?
2. Problem depth — how deeply do you understand the pain? Have you lived it?
3. Market — what is the real size, and how did you calculate it bottom-up?
4. Traction / evidence — what have you actually built or validated so far?
5. Business model — how do you make money, and what do the unit economics look like?
6. Why now — what changed in the world that makes this the right moment?
7. Competition — who else is solving this, and why do you win?
8. Biggest risk — what is the single thing most likely to kill this company?

INTERVIEW RULES:
- Ask ONE question at a time. Never bundle multiple questions in one message.
- Reference specific details from their application in your questions — make them feel you actually read it.
- If an answer is vague or evasive, say so plainly and give them one chance to clarify before moving on.
- Use their own words back at them when probing.
- Be direct. If something doesn't add up, say so.
- After exactly 8 founder responses, write your closing and end the interview. Do not ask a 9th question.

SUBSTANCE ASSESSMENT:
Throughout the interview, assess whether this founder clears the bar on three dimensions:
(a) Real background or domain expertise relevant to the problem — not just interest
(b) Evidence of actual work done — something built, customers talked to, pilots run — not just an idea
(c) Clarity and conviction — do they speak with precision and belief, or are they vague and hedging?

A founder who is at "idea stage" with no relevant background and no traction does NOT pass the bar. Be honest about this in the report.

ENDING THE INTERVIEW:
After the 8th answer, your final message must begin with exactly: INTERVIEW_COMPLETE:
Write a brief, warm, specific closing sentence (reference something real from the conversation).
Then emit the report block between REPORT_START and REPORT_END markers.

If the founder PASSES the bar (real background + some evidence of work + clear conviction):

INTERVIEW_COMPLETE: [warm closing sentence specific to this founder]

REPORT_START
{
  "passes_bar": true,
  "overall_score": 7.5,
  "recommendation": "one-liner recommendation for partners",
  "founder_name": "...",
  "startup_name": "...",
  "memo": {
    "tldr": "2-3 sentence summary of the opportunity and founder for a partner who has 30 seconds",
    "the_founder": "paragraph on founder background, domain expertise, why they specifically can build this",
    "the_problem": "paragraph on problem clarity, how they discovered it, validation evidence",
    "the_market": "paragraph on market size, dynamics, and quality of their bottom-up reasoning",
    "the_solution": "paragraph on the solution, the non-obvious insight, and why it wins",
    "traction": "paragraph on concrete evidence of demand — users, revenue, waitlist, pilots, or momentum",
    "why_now": "paragraph on timing — what changed in the market or technology that makes this the right moment",
    "key_risks": ["primary risk that could kill this", "secondary risk", "tertiary risk"],
    "verdict": "INVEST / WATCH / PASS — followed by em dash and 2-3 sentences of detailed reasoning for the partner"
  },
  "scores": {
    "founder_market_fit": 8,
    "problem_clarity": 7,
    "market_size": 6,
    "traction": 5,
    "execution_ability": 8,
    "business_model": 6
  }
}
REPORT_END

If the founder does NOT pass the bar:

INTERVIEW_COMPLETE: [brief, respectful, specific closing sentence]

REPORT_START
{
  "passes_bar": false,
  "reason": "honest, specific 2-3 sentence explanation of why the bar was not met — what was missing"
}
REPORT_END

TONE: Sharp, warm, direct, intellectually curious. Like a brilliant friend who is also a great investor. Every question must feel written specifically for this founder after reading their application carefully. Never robotic, never generic.

OPENING: Start by naming one specific thing from their application that caught your attention — something interesting or promising. Then ask your first question. Make it feel like a real first meeting, not a form.`;

function getErrorMessage(err) {
  const msg = err?.message || '';
  if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('rate_limit')) {
    return 'The AI is experiencing high demand right now. Please wait a minute and try again.';
  }
  if (msg.includes('API key') || msg.includes('API_KEY') || msg.includes('403') || msg.includes('401') || msg.includes('authentication')) {
    return 'AI configuration error. Please contact support at contactus.nocapvc@gmail.com';
  }
  if (msg.includes('model') || msg.includes('404') || msg.includes('not_found')) {
    return 'AI model unavailable. Please try again in a few minutes.';
  }
  if (msg.includes('overloaded') || msg.includes('529')) {
    return 'The AI is overloaded right now. Please wait a moment and try again.';
  }
  if (!navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection and try again.';
  }
  return 'Could not reach NoCap AI. Please check your connection and try again.';
}

export default function AIInterview() {
  const [phase, setPhase] = useState('loading');
  const [founder, setFounder] = useState(null);
  const [token, setToken] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [startError, setStartError] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (!t) { setPhase('invalid'); return; }
    setToken(t);
    validateToken(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const validateToken = async (t) => {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?token=${encodeURIComponent(t)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.valid) {
        setFounder(data.founder);
        setPhase('intro');
      } else if (data.reason === 'completed') {
        setPhase('completed');
      } else {
        setPhase('invalid');
      }
    } catch (err) {
      if (!navigator.onLine || err?.message?.includes('fetch') || err?.message?.includes('network')) {
        setPhase('network-error');
      } else {
        setPhase('invalid');
      }
    }
  };

  const callGemini = async (conversationHistory) => {
    if (!GEMINI_KEY) throw new Error('API key not configured');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

    // Gemini requires conversation to start with a user turn
    // Inject system prompt as first user/model exchange
    const systemTurn = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Understood. I am NoCap AI, ready to conduct the founder interview.' }] }
    ];

    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [...systemTurn, ...contents],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || errData.error?.status || `HTTP ${res.status}`;
      console.error('Gemini API error:', errMsg, errData);
      throw new Error(errMsg);
    }

    const data = await res.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const errMsg = data.error?.message || JSON.stringify(data);
      console.error('Gemini empty response:', errMsg);
      throw new Error(errMsg);
    }
    return data.candidates[0].content.parts[0].text;
  };

  const startInterview = async () => {
    setStartError('');
    setPhase('interview');
    setSending(true);

    const fieldMap = {
      'Name': founder.name,
      'Startup': founder.startup,
      'Sector': founder.sector,
      'Stage': founder.stage,
      'One-liner': founder.one_liner,
      'Problem they are solving': founder.problem,
      'Why this idea': founder.why_this,
      'Target customer': founder.target_customer,
      'Product description': founder.product_description,
      'Domain expertise / why you': founder.domain_expertise,
      'Competitors': founder.competitors,
      'Revenue model': founder.revenue_model,
      'Biggest challenge': founder.biggest_challenge,
      'Success vision in 2 years': founder.success_vision,
      'Why not just get a job': founder.why_not_job,
      'What they need from NoCap': founder.needs,
      'LinkedIn': founder.linkedin_url,
      'Website / prototype': founder.website,
    };

    const contextLines = Object.entries(fieldMap)
      .filter(([, v]) => v && v.toString().trim() !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    const context = `FOUNDER APPLICATION CONTEXT:\n${contextLines}\n\nConduct the interview now. Open by acknowledging something specific from their application, then ask your first question.`;

    try {
      const aiMessage = await callGemini([{ role: 'user', content: context }]);
      setMessages([{ role: 'ai', content: aiMessage, ts: Date.now() }]);
      setQuestionCount(1);
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      setSending(false);
      setPhase('intro');
      setStartError(getErrorMessage(err));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setError('');
    setSending(true);

    const newMessages = [...messages, { role: 'user', content: userMessage, ts: Date.now() }];
    setMessages(newMessages);

    try {
      const aiResponse = await callGemini(newMessages);

      if (aiResponse.startsWith('INTERVIEW_COMPLETE:')) {
        const reportMatch = aiResponse.match(/REPORT_START\s*([\s\S]*?)\s*REPORT_END/);
        if (reportMatch) {
          try {
            const raw = reportMatch[1].trim()
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/```\s*$/i, '');
            const parsedReport = JSON.parse(raw);
            const closingMessage = aiResponse
              .split('REPORT_START')[0]
              .replace('INTERVIEW_COMPLETE:', '')
              .trim();
            setMessages(prev => [...prev, { role: 'ai', content: closingMessage, ts: Date.now() }]);
            setPhase('generating');
            await saveReport(parsedReport);
          } catch {
            setMessages(prev => [...prev, { role: 'ai', content: aiResponse, ts: Date.now() }]);
          }
        }
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: aiResponse, ts: Date.now() }]);
        setQuestionCount(prev => Math.min(prev + 1, TOTAL_QUESTIONS));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setSending(false);
  };

  const saveReport = async (parsedReport) => {
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _type: 'interview_report',
          token,
          founder_name: founder.name,
          startup_name: founder.startup,
          sector: founder.sector,
          passes_bar: parsedReport.passes_bar,
          report: parsedReport
        }),
        mode: 'no-cors'
      });
    } catch {
      // Still show done screen even if save fails
    }
    setReport(parsedReport);
    setPhase('done');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── SCREENS ── */

  if (phase === 'loading') return (
    <div className="iv-screen iv-center">
      <div className="iv-spinner" />
      <p className="iv-muted">Validating your interview link...</p>
    </div>
  );

  if (phase === 'network-error') return (
    <div className="iv-screen iv-center">
      <div className="iv-badge">NOCAP VC</div>
      <h2 className="iv-h2">Connection error</h2>
      <p className="iv-muted">Could not reach NoCap servers. Please check your internet connection and try again.</p>
      <button className="iv-btn-outline" onClick={() => { setPhase('loading'); validateToken(token); }}>
        Retry
      </button>
    </div>
  );

  if (phase === 'invalid') return (
    <div className="iv-screen iv-center">
      <div className="iv-badge">NOCAP VC</div>
      <h2 className="iv-h2">Invalid or expired link</h2>
      <p className="iv-muted">This interview link is invalid, expired, or has already been used. Check your email for the correct link or contact us.</p>
      <a href="mailto:contactus.nocapvc@gmail.com" className="iv-btn-outline">Contact Support</a>
    </div>
  );

  if (phase === 'completed') return (
    <div className="iv-screen iv-center">
      <div className="iv-badge">NOCAP VC</div>
      <div className="iv-check">&#10003;</div>
      <h2 className="iv-h2">Interview already completed</h2>
      <p className="iv-muted">You have already completed your NoCap VC interview. Your report has been sent to our partners. We will be in touch.</p>
    </div>
  );

  if (phase === 'intro') return (
    <div className="iv-screen iv-center">
      <div className="iv-badge">NOCAP VC &middot; AI INTERVIEW</div>
      <h1 className="iv-h1">Hey {founder?.name?.split(' ')[0]}.</h1>
      <p className="iv-intro-sub">Your application for <strong>{founder?.startup}</strong> passed our screening.</p>
      <p className="iv-intro-sub">This is your AI interview — a real conversation about your startup. NoCap AI will ask you 8 specific questions, just like a first VC meeting.</p>

      <div className="iv-info-grid">
        <div className="iv-info-card">
          <div className="iv-info-icon">&#9201;</div>
          <div className="iv-info-label">Duration</div>
          <div className="iv-info-val">~15 min</div>
        </div>
        <div className="iv-info-card">
          <div className="iv-info-icon">&#127919;</div>
          <div className="iv-info-label">Questions</div>
          <div className="iv-info-val">8 tailored</div>
        </div>
        <div className="iv-info-card">
          <div className="iv-info-icon">&#128203;</div>
          <div className="iv-info-label">Output</div>
          <div className="iv-info-val">Investor memo</div>
        </div>
      </div>

      <div className="iv-tips">
        <div className="iv-tips-title">Tips for a strong interview</div>
        <div className="iv-tip">Be specific. Numbers beat adjectives every time.</div>
        <div className="iv-tip">If you do not know something, say so. Honesty beats bluffing.</div>
        <div className="iv-tip">Think out loud. Show your reasoning, not just conclusions.</div>
        <div className="iv-tip">This is a conversation, not a quiz. Relax.</div>
      </div>

      {startError && (
        <div className="iv-start-error">
          <span className="iv-start-error-icon">&#9888;</span>
          {startError}
        </div>
      )}

      <button className="iv-btn-primary" onClick={startInterview}>
        {startError ? 'Try Again' : 'Start Interview'}
      </button>
      {!startError && <p className="iv-muted-sm">Your answers are saved. You can take breaks if needed.</p>}
    </div>
  );

  if (phase === 'generating') return (
    <div className="iv-screen iv-center">
      <div className="iv-spinner" />
      <h2 className="iv-h2">Writing your investor memo...</h2>
      <p className="iv-muted">NoCap AI is synthesising your interview and writing a full memo for our partners. This takes about 20 seconds.</p>
    </div>
  );

  if (phase === 'done') {
    /* ── Branch A: did not pass the bar ── */
    if (report && !report.passes_bar) return (
      <div className="iv-screen iv-center">
        <div className="iv-badge">NOCAP VC</div>
        <div className="iv-check iv-check-neutral">&#10003;</div>
        <h1 className="iv-h1">Interview complete.</h1>
        <p className="iv-intro-sub">
          Thank you for your time, {founder?.name?.split(' ')[0]}. We reviewed every answer carefully.
        </p>
        <p className="iv-intro-sub" style={{ marginTop: 8 }}>
          At this stage we are not able to move forward, but we encourage you to keep building — the best founders come back stronger.
        </p>
        {report.reason && (
          <div className="iv-next-steps" style={{ marginTop: 28 }}>
            <div className="iv-next-title">A note from NoCap AI</div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, padding: '4px 0' }}>
              {report.reason}
            </p>
          </div>
        )}
        <a href="https://instagram.com/nocapvc" target="_blank" rel="noreferrer" className="iv-btn-outline">
          Follow @nocapvc
        </a>
      </div>
    );

    /* ── Branch B: passed the bar — full investor memo ── */
    const memo = report?.memo || {};
    const scores = report?.scores || {};
    const verdictWord = memo.verdict?.split(/[\s—–]/)[0]?.toUpperCase() || 'REVIEWED';
    const verdictColor =
      verdictWord === 'INVEST' ? '#4cd980' :
      verdictWord === 'WATCH'  ? '#FFE034' : '#ff6b6b';

    return (
      <div className="iv-memo-screen">
        <div className="iv-memo-container">

          {/* Header */}
          <div className="iv-memo-header">
            <div className="iv-badge">NOCAP VC &middot; INVESTOR MEMO</div>
            <h1 className="iv-h1" style={{ marginTop: 16 }}>{report.startup_name}</h1>
            <p className="iv-memo-founder-line">{report.founder_name}</p>
            <div className="iv-memo-verdict-pill" style={{ color: verdictColor, borderColor: verdictColor + '55' }}>
              {verdictWord}
            </div>
          </div>

          {/* TL;DR */}
          {memo.tldr && (
            <div className="iv-memo-section">
              <div className="iv-memo-section-label">TL;DR</div>
              <p className="iv-memo-body">{memo.tldr}</p>
            </div>
          )}

          {/* Score strip */}
          {Object.keys(scores).length > 0 && (
            <div className="iv-score-strip">
              {Object.entries(scores).map(([key, val]) => (
                <div className="iv-score-chip" key={key}>
                  <div className="iv-score-chip-label">{key.replace(/_/g, ' ')}</div>
                  <div className="iv-score-chip-val">{val}<span>/10</span></div>
                </div>
              ))}
            </div>
          )}

          {/* Overall score */}
          <div className="iv-memo-overall">
            <span className="iv-memo-overall-label">Overall</span>
            <span className="iv-memo-overall-score">{report.overall_score}</span>
            <span className="iv-memo-overall-denom">/10</span>
            <span className="iv-memo-overall-rec">{report.recommendation}</span>
          </div>

          {/* Narrative sections */}
          {[
            { key: 'the_founder',  label: 'The Founder' },
            { key: 'the_problem',  label: 'The Problem' },
            { key: 'the_market',   label: 'The Market' },
            { key: 'the_solution', label: 'The Solution' },
            { key: 'traction',     label: 'Traction' },
            { key: 'why_now',      label: 'Why Now' },
          ].map(({ key, label }) => memo[key] && (
            <div className="iv-memo-section" key={key}>
              <div className="iv-memo-section-label">{label}</div>
              <p className="iv-memo-body">{memo[key]}</p>
            </div>
          ))}

          {/* Key risks */}
          {memo.key_risks?.length > 0 && (
            <div className="iv-memo-section">
              <div className="iv-memo-section-label">Key Risks</div>
              <ul className="iv-memo-risks">
                {memo.key_risks.map((r, i) => (
                  <li key={i} className="iv-memo-risk-item">{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Verdict */}
          {memo.verdict && (
            <div className="iv-memo-section iv-memo-verdict-block" style={{ borderColor: verdictColor + '33' }}>
              <div className="iv-memo-section-label" style={{ color: verdictColor }}>Verdict</div>
              <p className="iv-memo-body">{memo.verdict}</p>
            </div>
          )}

          {/* Footer */}
          <div className="iv-memo-footer">
            <div className="iv-next-steps">
              <div className="iv-next-title">What happens next</div>
              <div className="iv-next-item">
                <span className="iv-next-num">01</span>
                <span>Our partners review your memo within 5 business days</span>
              </div>
              <div className="iv-next-item">
                <span className="iv-next-num">02</span>
                <span>If there is a fit, you will receive a meeting invite directly</span>
              </div>
              <div className="iv-next-item">
                <span className="iv-next-num">03</span>
                <span>Either way, you will get structured feedback — no ghosting</span>
              </div>
            </div>
            <p className="iv-muted-sm" style={{ marginTop: 20 }}>This memo was generated by NoCap AI and will be reviewed by our partners.</p>
            <a href="https://instagram.com/nocapvc" target="_blank" rel="noreferrer" className="iv-btn-outline">
              Follow @nocapvc while you wait
            </a>
          </div>

        </div>
      </div>
    );
  }

  /* ── INTERVIEW CHAT ── */
  return (
    <div className="iv-chat-root">
      <div className="iv-chat-header">
        <div className="iv-chat-header-left">
          <div className="iv-chat-avatar">N</div>
          <div>
            <div className="iv-chat-name">NoCap AI</div>
            <div className="iv-chat-status">
              <span className="iv-status-dot" />
              Interview in progress
            </div>
          </div>
        </div>
        <div className="iv-chat-progress">
          Q{questionCount}<span className="iv-progress-total">/{TOTAL_QUESTIONS}</span>
        </div>
      </div>

      <div className="iv-chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`iv-msg ${msg.role === 'ai' ? 'iv-msg-ai' : 'iv-msg-user'}`}>
            {msg.role === 'ai' && <div className="iv-msg-avatar">N</div>}
            <div className="iv-msg-bubble">
              <div className="iv-msg-text">{msg.content}</div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="iv-msg iv-msg-ai">
            <div className="iv-msg-avatar">N</div>
            <div className="iv-msg-bubble">
              <div className="iv-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="iv-error">
            <span>{error}</span>
            <button className="iv-retry-btn" onClick={() => setError('')}>Dismiss &amp; retry</button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="iv-chat-input-area">
        <div className="iv-chat-input-wrap">
          <textarea
            ref={inputRef}
            className="iv-chat-input"
            placeholder="Type your answer..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending}
          />
          <button
            className="iv-send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || sending}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <p className="iv-input-hint">Press Enter to send &middot; Shift+Enter for new line</p>
      </div>
    </div>
  );
}
