import { useState, useEffect, useRef } from 'react';
import './AIInterview.css';

const APPS_SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL;


const SYSTEM_PROMPT = `You are NoCap AI, a sharp investment analyst conducting founder interviews for NoCap VC — India's founder-first funding platform. You have the sharpness of a YC partner and the warmth of a mentor.

YOUR MISSION:
Interview this founder adaptively. Ask one focused question at a time. Probe vague answers. Reward specificity and conviction. Keep going until you have strong signal on ALL 12 dimensions. Do not stop early.

THE 12 DIMENSIONS YOU MUST ASSESS:
1. Problem Clarity — Do they deeply understand the pain? Have they felt it personally?
2. Market Reality — Is TAM real and calculated bottom-up? Not just "India has 1.4 billion people"
3. Solution Insight — What non-obvious insight do they have? Why will this win?
4. Founder-Market Fit — Why is THIS founder uniquely suited for this problem?
5. Traction Signal — Any evidence of real demand? Users, revenue, waitlist, pilots?
6. Business Model — How do they make money? Have they thought about unit economics?
7. Competitor Awareness — Do they know ALL competitors including indirect ones? Why do they win?
8. Execution Velocity — What have they built in the last 30 days? Are they moving fast?
9. Ambition and Conviction — Is this a large, important problem? Do they believe this with conviction?
10. Distribution Insight — How will they reach Indian customers, especially Tier 2 and 3?
11. Coachability — When you push back, do they defend with logic or collapse?
12. Resilience Signal — Have they faced obstacles? How did they respond?

INTERVIEW RULES:
- Ask ONE question at a time. Never multiple questions in one message.
- When an answer is vague, probe deeper before moving on. Example: if they say "large market", ask "how did you calculate that specifically?"
- Use the founder's own words back at them to probe.
- Be direct. If an answer is weak, say so and give them a chance to clarify.
- After you feel you have strong signal on ALL 12 dimensions (usually 12-20 exchanges), end the interview.
- To end the interview, your final message must start with exactly: INTERVIEW_COMPLETE:

WHEN ENDING THE INTERVIEW:
Your message must start with INTERVIEW_COMPLETE: followed by a JSON block wrapped in REPORT_START and REPORT_END markers.

Example ending format:
INTERVIEW_COMPLETE: Thank you for a great conversation...

REPORT_START
{"problem_score":8,"market_score":7,"founder_market_fit":9,"traction_score":5,"business_model_score":6,"competitor_score":7,"execution_score":8,"ambition_score":9,"distribution_score":6,"resilience_score":8,"coachability_score":7,"overall_score":7.5,"recommendation":"Strong founder with clear problem insight. Recommend partner call.","full_report":"Detailed multi-paragraph report covering each dimension, strengths, concerns, and investment thesis. Written as a briefing for a senior partner who will decide whether to take a meeting."}
REPORT_END

TONE: Sharp, warm, direct, intellectually curious. Like a brilliant friend who also happens to be a great investor. Never robotic. Never generic. Every question should feel designed specifically for this founder.

OPENING: Start by briefly acknowledging what they have built from their application context, then ask your first question. Make it feel like a real conversation.`;

export default function AIInterview() {
  const [phase, setPhase] = useState('loading');
  const [founder, setFounder] = useState(null);
  const [token, setToken] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
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
      const res = await fetch(`${APPS_SCRIPT_URL}?token=${t}`);
      const data = await res.json();
      if (data.valid) {
        setFounder(data.founder);
        setPhase('intro');
      } else if (data.reason === 'completed') {
        setPhase('completed');
      } else {
        setPhase('invalid');
      }
    } catch {
      setPhase('invalid');
    }
  };

  const callGemini = async (conversationHistory) => {
    const key = process.env.REACT_APP_GEMINI_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`;

    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const systemTurn = [
      { role: 'user', parts: [{ text: 'You are NoCap AI. Instructions:\n\n' + SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Understood. I am NoCap AI, ready to conduct the founder interview.' }] }
    ];
    const allContents = [...systemTurn, ...contents];

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: allContents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      })
    });

    const data = await res.json();
    if (!data.candidates || !data.candidates[0]) {
      throw new Error(data.error?.message || 'Gemini error');
    }
    return data.candidates[0].content.parts[0].text;
  };

  const startInterview = async () => {
    setPhase('interview');
    setSending(true);

    const context = `FOUNDER CONTEXT from their application:
Name: ${founder.name}
Startup: ${founder.startup}
Sector: ${founder.sector}
Stage: ${founder.stage}
One liner: ${founder.one_liner}
Problem they are solving: ${founder.problem}

Start the interview now. Acknowledge their application briefly and ask your first question.`;

    try {
      const aiMessage = await callGemini([{ role: 'user', content: context }]);
      setMessages([{ role: 'ai', content: aiMessage, ts: Date.now() }]);
      setQuestionCount(1);
    } catch {
      setError('Connection issue. Please refresh and try again.');
    }
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    const newMessages = [...messages, { role: 'user', content: userMessage, ts: Date.now() }];
    setMessages(newMessages);

    try {
      const aiResponse = await callGemini(newMessages);

      if (aiResponse.startsWith('INTERVIEW_COMPLETE:')) {
        const reportMatch = aiResponse.match(/REPORT_START\s*([\s\S]*?)\s*REPORT_END/);
        if (reportMatch) {
          try {
            const parsedReport = JSON.parse(reportMatch[1].trim());
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
        setQuestionCount(prev => prev + 1);
      }
    } catch {
      setError('Connection issue. Please try again.');
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
          report: parsedReport
        })
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

  if (phase === 'loading') return (
    <div className="iv-screen iv-center">
      <div className="iv-spinner" />
      <p className="iv-muted">Validating your interview link...</p>
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
      <p className="iv-intro-sub">This is your AI interview — a real conversation about your startup. NoCap AI will ask you 12-20 adaptive questions, just like a first VC meeting.</p>

      <div className="iv-info-grid">
        <div className="iv-info-card">
          <div className="iv-info-icon">&#9201;</div>
          <div className="iv-info-label">Duration</div>
          <div className="iv-info-val">15-25 min</div>
        </div>
        <div className="iv-info-card">
          <div className="iv-info-icon">&#127919;</div>
          <div className="iv-info-label">Questions</div>
          <div className="iv-info-val">12-20 adaptive</div>
        </div>
        <div className="iv-info-card">
          <div className="iv-info-icon">&#128203;</div>
          <div className="iv-info-label">Output</div>
          <div className="iv-info-val">Partner report</div>
        </div>
      </div>

      <div className="iv-tips">
        <div className="iv-tips-title">Tips for a strong interview</div>
        <div className="iv-tip">Be specific. Numbers beat adjectives every time.</div>
        <div className="iv-tip">If you do not know something, say so. Honesty beats bluffing.</div>
        <div className="iv-tip">Think out loud. Show your reasoning, not just conclusions.</div>
        <div className="iv-tip">This is a conversation, not a quiz. Relax.</div>
      </div>

      <button className="iv-btn-primary" onClick={startInterview}>
        Start Interview
      </button>
      <p className="iv-muted-sm">Your answers are saved. You can take breaks if needed.</p>
    </div>
  );

  if (phase === 'generating') return (
    <div className="iv-screen iv-center">
      <div className="iv-spinner" />
      <h2 className="iv-h2">Generating your report...</h2>
      <p className="iv-muted">NoCap AI is analysing your interview and writing a detailed report for our partners. This takes about 30 seconds.</p>
    </div>
  );

  if (phase === 'done') return (
    <div className="iv-screen iv-center">
      <div className="iv-badge">NOCAP VC</div>
      <div className="iv-check">&#10003;</div>
      <h1 className="iv-h1">Interview complete.</h1>
      <p className="iv-intro-sub">Your report has been sent to our partners at NoCap VC.</p>

      {report && (
        <div className="iv-score-card">
          <div className="iv-score-label">Overall Score</div>
          <div className="iv-score-num">{report.overall_score}<span>/10</span></div>
          <div className="iv-score-rec">{report.recommendation}</div>
        </div>
      )}

      <div className="iv-next-steps">
        <div className="iv-next-title">What happens next</div>
        <div className="iv-next-item">
          <span className="iv-next-num">01</span>
          <span>Our partners review your report within 5 business days</span>
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

      <a href="https://instagram.com/nocapvc" target="_blank" rel="noreferrer" className="iv-btn-outline">
        Follow @nocapvc while you wait
      </a>
    </div>
  );

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
          Q{questionCount}
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

        {error && <div className="iv-error">{error}</div>}
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