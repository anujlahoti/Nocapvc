// ══════════════════════════════════════════════════════════════
//  HOW TO ADD A NEW BLOG POST
// ══════════════════════════════════════════════════════════════
//
//  1. Copy the template below into the `posts` array
//  2. Fill in all fields
//  3. Save the file → push to GitHub → Vercel auto-deploys (~30s)
//
//  TEMPLATE:
//  {
//    id: '004',                          // increment from last post
//    slug: 'your-post-url-slug',         // lowercase-hyphenated, no spaces
//    title: 'Your Full Post Title Here',
//    excerpt: 'One sentence shown on blog listing page.',
//    category: 'founder-playbooks',      // see CATEGORIES below for valid IDs
//    categoryLabel: 'Founder Playbooks',
//    date: 'April 5, 2026',
//    readTime: '5 min read',
//    featured: false,                    // set true to replace hero post
//    content: `
//      <p class="bp-lead">Opening paragraph (displays larger)</p>
//      <p>Normal paragraph text</p>
//      <h2>Section Heading</h2>
//      <div class="bp-pullquote">A memorable quote goes here.</div>
//      <div class="bp-data-callout">
//        <div class="bp-data-label">THE DATA</div>
//        <div class="bp-data-stat">
//          <span class="bp-data-num">73%</span>
//          <span class="bp-data-desc">short description of the stat</span>
//        </div>
//      </div>
//      <div class="bp-takeaway">
//        <div class="bp-takeaway-label">TAKEAWAY</div>
//        Your key takeaway text here.
//      </div>
//    `
//  }
//
//  CATEGORY IDs (use exactly as shown):
//  funding-intelligence | founder-playbooks | investor-lens
//  nocap-insights | india-startup-index
//
// ══════════════════════════════════════════════════════════════

export const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'funding-intelligence', label: 'Funding Intelligence', color: '#FFE034' },
  { id: 'founder-playbooks', label: 'Founder Playbooks', color: '#f2efe7' },
  { id: 'investor-lens', label: 'Investor Lens', color: '#aaaaaa' },
  { id: 'nocap-insights', label: 'NoCap Insights', color: '#FFE034', border: true },
  { id: 'india-startup-index', label: 'India Startup Index', color: '#4cd980' },
];

export const posts = [
  {
    id: '001',
    slug: 'why-indian-startup-applications-fail',
    title: 'Why 73% of Indian startup applications fail in the first 60 seconds',
    excerpt: 'We reviewed thousands of applications. The patterns of failure are almost always the same — and almost always fixable.',
    category: 'funding-intelligence',
    categoryLabel: 'Funding Intelligence',
    date: 'March 28, 2026',
    readTime: '6 min read',
    featured: true,
    content: `
<p class="bp-lead">Most founders spend weeks building their startup and 90 minutes on their application. Investors spend 60 seconds on it. That gap is why so many applications fail before a human even reads them.</p>

<p>At NoCap VC, we have processed thousands of startup applications from Indian founders. We built an AI to screen them. What we found was not surprising — but it was clarifying. The failures cluster around three patterns, and almost every rejection can be traced back to at least one of them.</p>

<div class="bp-data-callout">
  <div class="bp-data-label">THE DATA</div>
  <div class="bp-data-stat"><span class="bp-data-num">73%</span><span class="bp-data-desc">of applications fail to pass initial screening</span></div>
  <div class="bp-data-stat"><span class="bp-data-num">60s</span><span class="bp-data-desc">average time an investor spends on a cold application</span></div>
  <div class="bp-data-stat"><span class="bp-data-num">3</span><span class="bp-data-desc">failure patterns account for 90% of rejections</span></div>
</div>

<h2>Mistake 1: No problem clarity</h2>

<p>The single most common failure. Founders describe their solution beautifully and never actually articulate the problem. "We are building a platform for SMBs to manage their finances better" tells an investor nothing. What is wrong with how SMBs manage finances today? Who specifically has this problem? How bad is it? What does it cost them?</p>

<div class="bp-pullquote">
  "Investors don't fund solutions. They fund problems that are so painful that a large number of people will pay to have them solved."
</div>

<p>The test for problem clarity is simple: can you describe the problem in one sentence without mentioning your product? If you need your solution to explain the problem, the problem is not clear enough.</p>

<p>Strong problem statement: "Small kirana owners in Tier 2 cities lose 18–22% of perishable inventory monthly because they have no visibility into expiry dates across 400+ SKUs — they track it manually in notebooks."</p>

<p>Weak problem statement: "We are solving inventory management for small retailers using AI."</p>

<div class="bp-takeaway">
  <div class="bp-takeaway-label">TAKEAWAY</div>
  Write your problem statement without using the words "platform", "solution", "app", or "tool". If you can't, you don't understand the problem well enough yet.
</div>

<h2>Mistake 2: Vague TAM</h2>

<p>Every founder says their market is "large". Most cite a top-down report — "The Indian edtech market is $10 billion by 2030" — without explaining what fraction of that they can realistically reach, or how they calculated it.</p>

<p>Investors don't care about total market size reports. They care about how many people will pay you, how much, and how you know.</p>

<div class="bp-data-callout">
  <div class="bp-data-label">THE DATA</div>
  <div class="bp-data-stat"><span class="bp-data-num">61%</span><span class="bp-data-desc">of applications cite a top-down TAM with no bottom-up reasoning</span></div>
  <div class="bp-data-stat"><span class="bp-data-num">4×</span><span class="bp-data-desc">more likely to get to interview with a bottom-up TAM calculation</span></div>
</div>

<p>Bottom-up TAM for the same edtech startup: "There are 280,000 UPSC aspirants in India who spend ₹40,000–₹80,000 per year on coaching. If we capture 5% in year 3, that is ₹56–112 crore in revenue. That is our addressable market — not the entire edtech sector."</p>

<p>This tells an investor that you understand your customer, have done the math, and are not delusional about your actual opportunity.</p>

<div class="bp-takeaway">
  <div class="bp-takeaway-label">TAKEAWAY</div>
  Start from your specific customer. Count them. Multiply by what they will pay. That is your real TAM. Use the top-down number as context, not as your argument.
</div>

<h2>Mistake 3: No founder-market fit</h2>

<p>This is the hardest to fake and the most important to demonstrate. Why are you the right person to solve this problem? Not why is the problem interesting — why you, specifically?</p>

<p>The strongest founder-market fit answers involve lived experience ("I ran a logistics company for 8 years and this problem cost me ₹40 lakhs"), domain expertise ("I led supply chain at Meesho and saw this gap from the inside"), or an unfair research advantage ("I spent 6 months interviewing 200 kirana owners").</p>

<p>The weakest answers are variants of: "I am passionate about this space" or "This is a massive opportunity." Passion is not a moat. Everyone who applies to a VC is passionate.</p>

<div class="bp-pullquote">
  "The best founders are the ones who would have built this startup even if no investor existed. That shows in how they talk about the problem."
</div>

<div class="bp-takeaway">
  <div class="bp-takeaway-label">TAKEAWAY</div>
  Write down your unfair advantage in one paragraph. If you cannot articulate why you specifically — not someone else — should build this, spend more time in the problem space before applying.
</div>

<h2>What good looks like</h2>

<p>The applications that pass screening almost always share three qualities: they describe a specific, painful, validated problem; they show a realistic understanding of market size; and they demonstrate that the founder has an unusual relationship with the problem space — through experience, expertise, or obsessive research.</p>

<p>None of these require you to have revenue or a finished product. Pre-seed investors understand that you are early. What they need to believe is that you understand the problem better than anyone else, and that you will not stop until you solve it.</p>
    `
  },

  {
    id: '002',
    slug: 'how-to-calculate-tam-india-startups',
    title: 'The complete guide to calculating TAM for Indian startups',
    excerpt: 'Top-down TAM gets you ignored. Bottom-up TAM gets you funded. Here is exactly how to calculate it — with Indian examples.',
    category: 'founder-playbooks',
    categoryLabel: 'Founder Playbooks',
    date: 'March 25, 2026',
    readTime: '8 min read',
    featured: false,
    content: `
<p class="bp-lead">TAM is the first number every investor asks about and the one most founders get wrong. Not because the math is hard — because they start from the wrong place.</p>

<p>Top-down TAM is when you cite an industry report. "The Indian healthtech market is ₹485 billion." Bottom-up TAM is when you build from your actual customer. "There are 2.3 million diabetic patients in Maharashtra who spend ₹18,000 per year on monitoring and management."</p>

<p>Investors know the difference immediately. One requires a Google search. The other requires you to actually understand your market.</p>

<h2>Why bottom-up always wins</h2>

<p>A bottom-up TAM demonstrates three things simultaneously: you know who your customer is, you know how many of them exist, and you have thought about what they will pay. This is more valuable signal than the TAM number itself.</p>

<div class="bp-data-callout">
  <div class="bp-data-label">THE DATA</div>
  <div class="bp-data-stat"><span class="bp-data-num">4×</span><span class="bp-data-desc">more investor meetings from bottom-up TAM vs top-down</span></div>
  <div class="bp-data-stat"><span class="bp-data-num">₹485B</span><span class="bp-data-desc">cited industry reports — meaningless without a customer lens</span></div>
</div>

<h2>The bottom-up formula</h2>

<p><strong>TAM = Number of target customers × Annual revenue per customer</strong></p>

<p>That is it. The complexity is in the inputs — getting both numbers right requires real research.</p>

<h2>Step 1: Define your customer precisely</h2>

<p>Not "SMBs in India." Not "young professionals." Not "tier 2 cities." Those are demographics, not customers.</p>

<p>Your customer definition should be specific enough that you could walk into a room and identify them. "Female founders aged 28–38 running bootstrapped D2C brands with ₹10–50 lakh monthly revenue who cannot afford a full-time CFO." That is a customer.</p>

<div class="bp-takeaway">
  <div class="bp-takeaway-label">TAKEAWAY</div>
  If you can describe your customer with a single adjective (young, urban, digital), you are not specific enough. Add three more adjectives that actually differentiate them.
</div>

<h2>Step 2: Count them</h2>

<p>This is where most founders guess. Do not guess — build from data sources you can cite.</p>

<p>For Indian startups, useful sources include:</p>
<p>MSME Ministry data for small business counts. MCA filings for registered companies. TRAI data for telecom subscribers. RBI data for banking. Census data for population segments. LinkedIn for professional counts. Job boards for industry size proxies.</p>

<p>Example: "There are 63 million MSMEs in India per MSME Ministry data. Of these, 6 million are in manufacturing, per the same report. Our target is manufacturers with 10–50 employees and computerised billing — approximately 400,000 businesses, based on the NSSO survey on technology adoption."</p>

<h2>Step 3: Calculate revenue per customer</h2>

<p>What will they actually pay? Not what you hope to charge eventually — what will you realistically charge in the first 12 months?</p>

<p>Build from comparables. What do they spend on the problem today? What do adjacent solutions charge? What did your 10 customer interviews reveal about willingness to pay?</p>

<div class="bp-data-callout">
  <div class="bp-data-label">THE DATA</div>
  <div class="bp-data-stat"><span class="bp-data-num">₹2,400</span><span class="bp-data-desc">average annual SaaS spend by Indian SMBs — your baseline</span></div>
  <div class="bp-data-stat"><span class="bp-data-num">₹18,000</span><span class="bp-data-desc">average annual spend on outsourced accounting per SMB</span></div>
</div>

<h2>Step 4: Put it together with honest assumptions</h2>

<p>Do not present your TAM as fact. Present it as a calculation with stated assumptions. Investors respect intellectual honesty — they distrust founders who present projections as certainties.</p>

<p>Example format: "Our TAM calculation: 400,000 target manufacturers × ₹36,000 annual revenue (₹3,000/month, in line with comparable SaaS in this category) = ₹1,440 crore. We are targeting 2% market share in year 3, which represents ₹28.8 crore ARR. Our assumptions: conservative pricing, 2% penetration of a segment we have validated with 40 customer interviews."</p>

<div class="bp-pullquote">
  "A ₹500 crore TAM with real evidence beats a ₹50,000 crore TAM from a report every single time."
</div>

<h2>Common mistakes to avoid</h2>

<p><strong>Citing the total industry.</strong> If you are building for kirana stores, your TAM is not "the ₹45 lakh crore Indian retail market." It is the addressable slice you can realistically reach in your planning horizon.</p>

<p><strong>Using global numbers for an India play.</strong> The Indian market is 4–8× more price sensitive than the US. A global report number is not your Indian TAM.</p>

<p><strong>Ignoring geography.</strong> If you are starting in Mumbai and Delhi, your initial TAM is Mumbai and Delhi. Be honest about that — then show how you expand.</p>

<div class="bp-takeaway">
  <div class="bp-takeaway-label">TAKEAWAY</div>
  Present three numbers: your beachhead (who you are going after first and how big that is), your SAM (the realistic addressable market in 3 years), and your TAM (the full theoretical opportunity). Investors want to see that you can think in layers.
</div>
    `
  },

  {
    id: '003',
    slug: 'nocapvc-ai-interview-8-questions',
    title: 'What 8 questions NoCap AI asks every founder — and why',
    excerpt: 'Our AI interview is modelled on YC partner first meetings. Here are the 8 questions, what we are looking for, and what separates a strong answer from a weak one.',
    category: 'nocap-insights',
    categoryLabel: 'NoCap Insights',
    date: 'March 20, 2026',
    readTime: '7 min read',
    featured: false,
    content: `
<p class="bp-lead">The NoCap AI interview is not a screening quiz. It is a first meeting — the kind of conversation a YC partner would have with you after reading your application.</p>

<p>We designed it this way deliberately. Forms reveal what founders think investors want to hear. Conversations reveal what founders actually believe. The 8 questions are designed to surface the difference.</p>

<div class="bp-data-callout">
  <div class="bp-data-label">THE DATA</div>
  <div class="bp-data-stat"><span class="bp-data-num">8</span><span class="bp-data-desc">tailored questions per interview, based on your specific application</span></div>
  <div class="bp-data-stat"><span class="bp-data-num">~15 min</span><span class="bp-data-desc">average interview duration</span></div>
  <div class="bp-data-stat"><span class="bp-data-num">6</span><span class="bp-data-desc">dimensions scored in the final investor memo</span></div>
</div>

<h2>Question 1: Why are YOU the right person for this?</h2>

<p>This is always first. Not because we want a credentials check — but because the answer tells us how a founder thinks about founder-market fit. The best founders do not list their resume. They tell a story about why this problem chose them.</p>

<p><strong>Strong answer:</strong> "I ran a pharmaceutical distribution business for 6 years. I personally lost ₹80 lakhs to supply chain fraud in year 4. I understand this problem at a granular level that someone coming from consulting never would."</p>

<p><strong>Weak answer:</strong> "I am passionate about this space and I believe I have the skills to execute."</p>

<h2>Question 2: How deeply do you understand the pain?</h2>

<p>We are looking for evidence of customer discovery, not theoretical understanding. Have you talked to people with this problem? What did you learn that surprised you?</p>

<div class="bp-pullquote">
  "The founders who pass this question never say 'I think customers want X.' They say 'Customer 7 told me something that completely changed how I think about this.'"
</div>

<h2>Question 3: What is the real market size — and how did you calculate it?</h2>

<p>See our TAM guide. The question is not "how big is your market" — it is "show me your reasoning." We are assessing intellectual rigour, not ambition.</p>

<h2>Question 4: What have you actually built or validated?</h2>

<p>This is the traction question. We are not looking for revenue — we are looking for evidence of forward motion. A waitlist of 200 people is evidence. Three letters of intent are evidence. A prototype with 10 real users is evidence. "We are planning to build" is not evidence.</p>

<div class="bp-takeaway">
  <div class="bp-takeaway-label">TAKEAWAY</div>
  Before your interview, write down every concrete action you have taken to validate this idea. Every customer conversation. Every prototype test. Every email you sent. This is your traction evidence, even if you have no revenue.
</div>

<h2>Question 5: How do you make money, and what are the unit economics?</h2>

<p>We do not expect pre-seed founders to have perfected unit economics. We expect them to have thought about it. What will you charge? What does it cost you to deliver? Where is the margin? What happens at 1,000 customers?</p>

<h2>Question 6: Why is now the right moment?</h2>

<p>This is the most underrated question in founder interviews. What changed — in technology, regulation, behaviour, or infrastructure — that makes this startup possible or necessary today and not 3 years ago?</p>

<p>The best "why now" answers are specific. "UPI crossed 10 billion monthly transactions in 2023, which means the payment infrastructure finally exists for this to work." That is a why now. "The market is ready" is not.</p>

<h2>Question 7: Who else is solving this, and why do you win?</h2>

<p>Founders who say "we have no competition" immediately lose credibility. Every problem worth solving has competition — if not direct, then the status quo (doing nothing, using Excel, hiring someone). The question is whether you understand the competitive landscape deeply enough to know your actual edge.</p>

<div class="bp-pullquote">
  "Tell me about your competition tells us as much about a founder's self-awareness as it does about the market."
</div>

<h2>Question 8: What is most likely to kill this company?</h2>

<p>This is the question most founders dread. It should not be. Founders who can clearly articulate their primary risk are more fundable, not less — because it demonstrates that they have thought about it and have a plan.</p>

<p><strong>Strong answer:</strong> "Our biggest risk is enterprise sales cycles. If we cannot close our first 3 enterprise customers within 9 months, we run out of runway. Our plan is to start with mid-market at ₹15,000/month where the sales cycle is 4–6 weeks, and use that to build the reference customers we need for enterprise."</p>

<p><strong>Weak answer:</strong> "Our biggest risk is competition, but we are confident we can stay ahead."</p>

<div class="bp-takeaway">
  <div class="bp-takeaway-label">TAKEAWAY</div>
  Spend 20 minutes before your interview writing down the 3 things most likely to kill your startup. Then write your plan for each. That preparation alone will make your interview substantially stronger.
</div>

<h2>What the AI is actually assessing</h2>

<p>Across all 8 questions, NoCap AI is scoring six dimensions: founder-market fit, problem clarity, market size quality, traction evidence, execution ability, and business model coherence. Each dimension is scored 0–10, and a weighted overall score determines whether a full investor memo is generated.</p>

<p>The memo is not generated for every founder. We only write it when we see real substance — when a founder demonstrates that they have an unfair relationship with a real problem, and have done something about it. That selectivity is what makes the memo meaningful to investors.</p>
    `
  }
];

export function getPostBySlug(slug) {
  return posts.find(p => p.slug === slug) || null;
}

export function getFeaturedPost() {
  return posts.find(p => p.featured) || posts[0];
}

export function getPostsByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return posts;
  return posts.filter(p => p.category === categoryId);
}
