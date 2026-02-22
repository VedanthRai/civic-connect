import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// ═══════════════════════════════════════════════════════════
// IN-MEMORY DATABASE (The "Source of Truth")
// ═══════════════════════════════════════════════════════════
let ISSUES = [
  { id: 1, title: "Pipeline burst — road flooding + traffic chaos", cat: "Water", loc: "Whitefield Main Rd", ward: "Whitefield", votes: 1847, severity: 9.8, status: "Critical", progress: 20, reports: 412, social: 8621, hashtag: "#WhitefieldFlood", authority: "BWSSB", sla: 2, slaDone: 0.4, timeMs: Date.now() - 1800000, recurrence: 3, lat: 12.9698, lng: 77.7500, aiInsight: "CRITICAL: Infrastructure failure. Emergency team required immediately.", trend: 892, manpower: 8, estHours: 6 },
  { id: 2, title: "Massive pothole cluster causing daily accidents", cat: "Road", loc: "MG Road near Trinity Circle", ward: "Shivajinagar", votes: 1204, severity: 9.2, status: "In Progress", progress: 65, reports: 287, social: 5341, hashtag: "#MGRoadPothole", authority: "BBMP Roads", sla: 24, slaDone: 18, timeMs: Date.now() - 7200000, recurrence: 7, lat: 12.9762, lng: 77.6033, aiInsight: "High accident probability. Road closure + patching crew needed.", trend: 234, manpower: 6, estHours: 8 },
  { id: 3, title: "Garbage overflow — 4 days uncollected, health risk", cat: "Sanitation", loc: "Koramangala 5th Block", ward: "Koramangala", votes: 912, severity: 8.7, status: "Assigned", progress: 30, reports: 198, social: 3876, hashtag: "#KoraGarbage", authority: "BBMP SWM", sla: 12, slaDone: 9, timeMs: Date.now() - 18000000, recurrence: 12, lat: 12.9352, lng: 77.6245, aiInsight: "Disease vector risk elevated. Dual vehicle dispatch needed.", trend: 67, manpower: 4, estHours: 3 },
];
let AGENT_LOGS = [];
let SOCIAL_FEED = [];
let CITY_STATS = {
  health: 85,
  risk: 15,
  active: 0,
  resolved: 0,
  sentiment: { pos: 30, neu: 50, neg: 20 }
};

// Helper: Calculate Score
const calculateScore = (issue) => {
  const catWeight = { Water: 1.4, Road: 1.2, Sanitation: 1.3, Electricity: 1.35, Infrastructure: 1.25 }[issue.cat] || 1.0;
  const engBoost = Math.min(1 + (issue.votes / 500) * 0.3, 1.8);
  const dupBoost = Math.min(1 + (issue.reports / 100) * 0.2, 1.5);
  const sentRisk = Math.min(1 + (issue.social / 2000) * 0.25, 1.6);
  const recurScore = Math.min(1 + issue.recurrence * 0.05, 1.3);
  const raw = issue.severity * catWeight * engBoost * dupBoost * sentRisk * recurScore;
  return Math.min(Math.round(raw * 2.8), 100);
};

// Initialize scores for seed data
ISSUES = ISSUES.map(i => ({ ...i, civicScore: calculateScore(i) }));

// ═══════════════════════════════════════════════════════════
// MULTI-AGENT SYSTEM (The "Brain")
// ═══════════════════════════════════════════════════════════

class AgentSystem {
  constructor(io) {
    this.io = io;
  }

  log(agentName, action, details) {
    const logEntry = { id: Date.now(), time: new Date().toLocaleTimeString(), agent: agentName, action, details };
    AGENT_LOGS.unshift(logEntry);
    if (AGENT_LOGS.length > 50) AGENT_LOGS.pop();
    this.io.emit('agent-log', logEntry);
  }

  // AGENT 1: TRIAGE AGENT (Classifies & Scores)
  async triageIssue(issue) {
    this.log("TRIAGE_AGENT", "ANALYZING", `Processing report: "${issue.title}"`);
    
    // Simulate LLM Processing Delay
    await new Promise(r => setTimeout(r, 1500));

    // Logic: Keyword analysis (Mocking an LLM decision)
    const keywords = {
      Critical: ['fire', 'blood', 'accident', 'collapse', 'explosion', 'dead'],
      High: ['blocked', 'flood', 'spark', 'wire', 'sewage'],
      Medium: ['pothole', 'garbage', 'light', 'water'],
    };

    let severity = 3;
    let priority = "Low";
    
    const text = (issue.title + " " + issue.cat).toLowerCase();
    if (keywords.Critical.some(k => text.includes(k))) { severity = 9.5; priority = "Critical"; }
    else if (keywords.High.some(k => text.includes(k))) { severity = 7.5; priority = "High"; }
    else if (keywords.Medium.some(k => text.includes(k))) { severity = 5.5; priority = "Medium"; }

    const enrichedIssue = {
      ...issue,
      severity,
      status: priority === "Critical" ? "Escalated" : "Pending",
      civicScore: Math.min(Math.round(severity * 10 + (Math.random() * 10)), 100),
      aiInsight: `Classified as ${priority} based on keyword analysis. Assigned to ${issue.authority}.`,
      manpower: Math.ceil(severity / 2),
      estHours: Math.ceil(severity * 3)
    };

    this.log("TRIAGE_AGENT", "DECISION", `Rated Severity: ${severity}/10. Priority: ${priority}`);
    return enrichedIssue;
  }

  // AGENT 2: GOVERNANCE AGENT (Assigns & Routes)
  async routeIssue(issue) {
    await new Promise(r => setTimeout(r, 800));
    this.log("GOV_AGENT", "ROUTING", `Dispatching to ${issue.authority} work queue.`);
    return { ...issue, status: issue.severity > 8 ? "Escalated" : "Assigned", progress: 5 };
  }

  // AGENT 3: ADVISOR AGENT (Generates Action Plans)
  async generatePlan(issue) {
    this.log("ADVISOR_AGENT", "THINKING", `Drafting resolution plan for Issue #${issue.id}...`);
    
    // Simulate "Thinking" time
    await new Promise(r => setTimeout(r, 2000));

    // REAL-TIME GENERATION (Rule-based for speed/reliability without API keys)
    const urgency = issue.severity > 8 ? "IMMEDIATE MOBILIZATION" : "STANDARD RESPONSE";
    const resources = issue.severity * 2;
    
    const plan = `**ACTION PLAN: ${issue.title}**\n` +
      `1. STRATEGY: ${urgency} protocol initiated.\n` +
      `2. DEPLOYMENT: Dispatch ${issue.manpower} unit(s) with ${issue.cat} repair kit.\n` +
      `3. COMMUNITY: Notify ${issue.reports} reporting citizens via app push.\n` +
      `4. PREVENTIVE: Schedule infrastructure audit for ${issue.ward} sector 4.`;

    this.log("ADVISOR_AGENT", "COMPLETE", `Plan generated. Length: ${plan.length} chars.`);
    return { issueId: issue.id, text: plan };
  }

  // AGENT 4: ANALYST AGENT (Classifies incoming reports for the modal)
  async analyzeReport(form) {
    this.log("ANALYST_AGENT", "CLASSIFYING", `Draft report: "${form.title}"`);
    await new Promise(r => setTimeout(r, 1000)); // Simulate thinking

    // Rule-based classification (Mocking AI)
    const text = (form.title + " " + form.desc).toLowerCase();
    let cat = form.cat;
    if (text.includes("fire")) cat = "Fire";
    else if (text.includes("water") || text.includes("leak")) cat = "Water";
    
    const severity = text.includes("urgent") || text.includes("danger") ? 9 : 5;
    
    return {
      severity,
      category: cat,
      authority: cat === "Fire" ? "Fire Dept" : "BBMP " + cat,
      priority: severity > 7 ? "High" : "Medium",
      civicScore: severity * 10 + Math.floor(Math.random() * 10),
      insight: `Automated classification based on keywords. Assigned to ${cat} department.`,
      estimatedResolution: severity > 7 ? "4-6 hours" : "24-48 hours",
      manpower: Math.ceil(severity / 2),
      hashtag: `#${cat}Issue`,
      isSpam: false,
      riskIfDelayed: severity > 7 ? "Public safety risk" : "Inconvenience"
    };
  }

  async explainIssue(prompt) {
    return `**AGENT RESPONSE:**\nBased on historical data for ${prompt.cat}, this issue typically resolves in 12-18 hours. \n\nRecommendation: Monitor social sentiment.`;
  }
}

const agents = new AgentSystem(io);

// ═══════════════════════════════════════════════════════════
// REAL-TIME DATA GENERATORS
// ═══════════════════════════════════════════════════════════
const SOCIAL_TOPICS = [
  { text: "Traffic is a nightmare in Whitefield today! #BangaloreTraffic", sent: "neg" },
  { text: "Thank you BESCOM for fixing the light so fast! #GoodJob", sent: "pos" },
  { text: "Garbage piling up in Koramangala again. @BBMP please help.", sent: "neg" },
  { text: "Beautiful weather in the city today.", sent: "neu" },
  { text: "Water supply cut for 2 days? Unacceptable. #BWSSB", sent: "neg" },
  { text: "New metro line is super convenient. #NammaMetro", sent: "pos" },
  { text: "Why is the road dug up again near Indiranagar?", sent: "neg" },
];
const SIM_TITLES = ["Streetlight flickering", "Garbage pileup", "Water leakage", "Illegal parking", "Broken footpath", "Traffic signal dead", "Open drain danger"];
const SIM_LOCS = ["HSR Layout", "BTM Layout", "Electronic City", "Marathahalli", "Bellandur", "Malleshwaram", "Rajajinagar"];

setInterval(() => {
  // 1. Emit Social Tweet
  if (Math.random() > 0.6) {
    const template = SOCIAL_TOPICS[Math.floor(Math.random() * SOCIAL_TOPICS.length)];
    const tweet = {
      id: Date.now(),
      user: `@user_${Math.floor(Math.random() * 9999)}`,
      text: template.text,
      sentiment: template.sent,
      time: new Date().toLocaleTimeString()
    };
    SOCIAL_FEED.unshift(tweet);
    if (SOCIAL_FEED.length > 20) SOCIAL_FEED.pop();
    io.emit('social-stream', tweet);
    
    // Update Sentiment Stats
    if (tweet.sentiment === 'pos') CITY_STATS.sentiment.pos++;
    if (tweet.sentiment === 'neg') CITY_STATS.sentiment.neg++;
    if (tweet.sentiment === 'neu') CITY_STATS.sentiment.neu++;
  }

  // 2. Simulate New Incident (Agent Workflow)
  if (Math.random() > 0.85) {
    const title = SIM_TITLES[Math.floor(Math.random() * SIM_TITLES.length)];
    const loc = SIM_LOCS[Math.floor(Math.random() * SIM_LOCS.length)];
    const cats = ["Road", "Water", "Electricity", "Sanitation"];
    const cat = cats[Math.floor(Math.random() * cats.length)];
    
    const rawIssue = {
      id: Date.now(), title: `${title} near ${loc}`, cat, loc, ward: loc,
      votes: 1, severity: 5, status: "Pending", progress: 0,
      reports: 1, social: 0, hashtag: `#${loc.replace(/\s/g,"")}${cat}`, authority: "BBMP",
      sla: 24, slaDone: 0, timeMs: Date.now(), recurrence: 0, lat: 12.9, lng: 77.6,
      aiInsight: "Analyzing...", trend: 100, manpower: 2, estHours: 24,
      civicScore: 50
    };

    // Trigger Agents
    agents.triageIssue(rawIssue).then(processed => agents.routeIssue(processed)).then(finalIssue => {
      ISSUES.unshift(finalIssue);
      io.emit('update-issues', ISSUES);
      io.emit('new-alert', { title: "New Incident", msg: `${finalIssue.title}` });
    });
  }

  // 2. Emit Live Graph Data (Heartbeat)
  const totalIssues = ISSUES.length || 1;
  const resolved = ISSUES.filter(i => i.status === 'Resolved').length;
  
  // Dynamic fluctuation
  CITY_STATS.risk = Math.max(0, Math.min(100, CITY_STATS.risk + (Math.random() - 0.5) * 5));
  
  io.emit('stats-update', {
    time: new Date().toLocaleTimeString(),
    risk: Math.round(CITY_STATS.risk),
    active: totalIssues - resolved,
    resolved: resolved,
    sentiment: CITY_STATS.sentiment
  });

}, 2000);

// ═══════════════════════════════════════════════════════════
// SOCKET HANDLERS
// ═══════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  console.log('Citizen connected:', socket.id);
  
  // Send initial state immediately
  socket.emit('update-issues', ISSUES);
  socket.emit('agent-log-history', AGENT_LOGS);

  socket.on('vote', (id) => {
    const issue = ISSUES.find(i => i.id === id);
    if (issue) {
      issue.votes++;
      issue.civicScore = calculateScore(issue);
      io.emit('update-issues', ISSUES); // Broadcast to everyone
    }
  });

  socket.on('report-issue', async (rawIssue) => {
    // Step 1: Receive
    agents.log("GATEWAY", "RECEIVED", `New submission: ${rawIssue.title}`);
    
    // Step 2: Triage Agent
    let processedIssue = await agents.triageIssue(rawIssue);
    
    // Step 3: Routing Agent
    processedIssue = await agents.routeIssue(processedIssue);

    // Step 4: Commit to DB
    ISSUES.unshift(processedIssue);
    io.emit('update-issues', ISSUES);
    io.emit('new-alert', { title: "New Issue Logged", msg: `${processedIssue.title} (${processedIssue.status})` });
  });

  socket.on('ask-ai-plan', async (issue) => {
    const plan = await agents.generatePlan(issue);
    socket.emit('ai-plan-response', plan);
  });

  socket.on('analyze-report', async (form) => {
    const result = await agents.analyzeReport(form);
    socket.emit('report-analysis-result', result);
  });

  socket.on('ask-issue-insight', async (data) => {
    const text = await agents.explainIssue(data);
    socket.emit('issue-insight-response', text);
  });
});

httpServer.listen(3001, () => {
  console.log('Civica Real-Time Server running on port 3001');
});