import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

/* ═══════════════════════════════════════════════════════════
   DESIGN SYSTEM — Deep Civic / Mission Control aesthetic
   Palette: Near-black base, electric teal, amber alerts, crimson critical
═══════════════════════════════════════════════════════════ */
const C = {
  bg0: "#070b12",
  bg1: "#0d1321",
  bg2: "#111c2e",
  bg3: "#162033",
  card: "#0f1928",
  border: "#1a2d47",
  borderHi: "#1e3a5a",
  teal: "#00c8b8",
  tealDim: "#00c8b833",
  tealGlow: "#00c8b822",
  blue: "#1a7cff",
  blueDim: "#1a7cff22",
  amber: "#f59e0b",
  amberDim: "#f59e0b22",
  red: "#ef4444",
  redDim: "#ef444422",
  green: "#22c55e",
  greenDim: "#22c55e22",
  purple: "#8b5cf6",
  purpleDim: "#8b5cf622",
  text: "#dde6f0",
  textSub: "#8ba0b8",
  textDim: "#4a6080",
  white: "#ffffff",
};

const FONT = "'IBM Plex Mono', 'Courier New', monospace";
const FONT_DISPLAY = "'IBM Plex Sans Condensed', 'Arial Narrow', sans-serif";

/* ═══════════════════════════════════════════════════════════
   MULTI-AGENT SYSTEM ARCHITECTURE (Simulated)
═══════════════════════════════════════════════════════════ */
const SocialScraperAgent = {
  name: "SocialPulse-V4",
  scan: (keyword, geo) => ({
    mentions: Math.floor(Math.random() * 150) + 20,
    hashtags: [`#${keyword}`, "#BengaluruCivic", "#UrgentFix"],
    sentiment_score: Math.random() * 0.8 - 0.4, // -0.4 to 0.4
    bot_activity_index: Math.random() * 0.15
  })
};

const NLPProcessorAgent = {
  name: "CivicNLP-Transformer",
  extractEntities: (text) => ["BBMP", "Whitefield", "Water Pipe"],
  inferSeverity: (text) => text.includes("blood") || text.includes("fire") ? 9.5 : 6.0,
  generateTags: (text) => ["infrastructure", "public_safety", "urgent"]
};

const MediaIntelligenceAgent = {
  name: "VisionGuard-AI",
  analyze: (mediaUrl) => ({
    scene_classification: "Street/Urban",
    object_detection: ["pothole", "vehicle", "pedestrian"],
    severity_score: 0.8 + Math.random() * 0.2,
    is_deepfake: Math.random() < 0.02, // 2% chance of fake
    fingerprint: Math.random().toString(36).substring(7)
  })
};

const GeoMappingAgent = {
  name: "GeoSpatial-Cluster",
  triangulate: (metadata, text) => ({
    lat: 12.97 + (Math.random() * 0.01),
    lng: 77.59 + (Math.random() * 0.01),
    precision: "High (GPS)"
  })
};

const MOCK_EVIDENCE_POOL = [
  { type: "image", source: "Citizen Uploads", url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7", confidence: 0.98, tags: ["pothole", "hazard"], severity: 7.5, isFake: false, botProb: 0.01, timestamp: "2 mins ago" },
  { type: "image", source: "Social Media", url: "https://images.unsplash.com/photo-1566041510639-8d95a2490bfb", confidence: 0.85, tags: ["traffic", "congestion"], severity: 6.2, isFake: false, botProb: 0.12, timestamp: "15 mins ago" },
  { type: "video", source: "CCTV", url: "https://media.istockphoto.com/id/1182602838/video/cctv-camera-recording-traffic-on-the-road.mp4?s=mp4-640x640-is&k=20&c=J-jJ_y_y_y_y", confidence: 0.99, tags: ["vehicle", "motion"], severity: 9.0, isFake: false, botProb: 0.0, timestamp: "Live Stream" },
  { type: "image", source: "Drone", url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f", confidence: 0.92, tags: ["aerial", "flood"], severity: 8.8, isFake: false, botProb: 0.0, timestamp: "1 hour ago" },
  { type: "image", source: "Social Media", url: "https://images.unsplash.com/photo-1599939571322-792a326991f2", confidence: 0.65, tags: ["fire", "smoke"], severity: 9.5, isFake: true, botProb: 0.95, timestamp: "Just now" }, // Fake/Bot example
];

const GENERATE_EVIDENCE = (count) => Array.from({ length: count }, () => MOCK_EVIDENCE_POOL[Math.floor(Math.random() * MOCK_EVIDENCE_POOL.length)]);

/* ═══════════════════════════════════════════════════════════
   PROGRESS LOGIC — Weighted Completion Score
═══════════════════════════════════════════════════════════ */
const calculateProgress = (issue) => {
  if (!issue) return { score: 0, breakdown: [] };
  let score = 0;
  const breakdown = [];

  // 1. Lifecycle Stages (Base Layer)
  const stages = [
    { key: 'verified', label: 'Verified', weight: 10 },
    { key: 'assigned', label: 'Assigned', weight: 15 },
    { key: 'dispatched', label: 'Team Dispatched', weight: 15 },
    { key: 'work_started', label: 'Work Started', weight: 20 },
  ];

  stages.forEach(stage => {
    if (issue[stage.key]) {
      score += stage.weight;
      breakdown.push({ label: stage.label, done: true });
    } else {
      breakdown.push({ label: stage.label, done: false });
    }
  });

  // 2. Real-World Signals
  const signals = [
    { key: 'engineer_evidence', label: 'Evidence Uploaded', weight: 10 },
    { key: 'geo_verified', label: 'Geo-Verified', weight: 10 },
    { condition: (i) => i.ai_validation_score > 80, label: 'AI Validated', weight: 10 },
  ];

  signals.forEach(signal => {
    const isDone = signal.condition ? signal.condition(issue) : issue[signal.key];
    if (isDone) score += signal.weight;
    breakdown.push({ label: signal.label, done: !!isDone });
  });

  // 3. Completion Override
  if (issue.citizen_confirmed) {
    score = 100;
    // Mark all as done if confirmed
    breakdown.forEach(b => b.done = true);
    // Ensure citizen confirmed is added if not present (it's implicit in 100%)
    if (!breakdown.find(b => b.label === "Citizen Confirmed")) {
        breakdown.push({ label: "Citizen Confirmed", done: true });
    }
  } else {
      breakdown.push({ label: "Citizen Confirmed", done: false });
  }

  return { score: Math.min(score, 100), breakdown };
};

/* ═══════════════════════════════════════════════════════════ MOCK DATA */
const ISSUES_RAW = [
  { id: 1, title: "Pipeline burst — road flooding + traffic chaos", cat: "Water", loc: "Whitefield Main Rd", ward: "Whitefield", votes: 1847, severity: 9.8, status: "Critical", reports: 412, social: 8621, hashtag: "#WhitefieldFlood", authority: "BWSSB", sla: 2, slaDone: 0.4, timeMs: Date.now() - 1800000, recurrence: 3, lat: 12.9698, lng: 77.7500, aiInsight: "CRITICAL: Infrastructure failure. Emergency team required immediately.", trend: 892, manpower: 8, estHours: 6, evidence: GENERATE_EVIDENCE(4),
    verified: true, assigned: true, dispatched: true, work_started: true, engineer_evidence: true, geo_verified: true, ai_validation_score: 92, citizen_confirmed: false },
  { id: 2, title: "Massive pothole cluster causing daily accidents", cat: "Road", loc: "MG Road near Trinity Circle", ward: "Shivajinagar", votes: 1204, severity: 9.2, status: "In Progress", reports: 287, social: 5341, hashtag: "#MGRoadPothole", authority: "BBMP Roads", sla: 24, slaDone: 18, timeMs: Date.now() - 7200000, recurrence: 7, lat: 12.9762, lng: 77.6033, aiInsight: "High accident probability. Road closure + patching crew needed.", trend: 234, manpower: 6, estHours: 8, evidence: GENERATE_EVIDENCE(3),
    verified: true, assigned: true, dispatched: true, work_started: true, engineer_evidence: true, geo_verified: true, ai_validation_score: 85, citizen_confirmed: false },
  { id: 3, title: "Garbage overflow — 4 days uncollected, health risk", cat: "Sanitation", loc: "Koramangala 5th Block", ward: "Koramangala", votes: 912, severity: 8.7, status: "Assigned", reports: 198, social: 3876, hashtag: "#KoraGarbage", authority: "BBMP SWM", sla: 12, slaDone: 9, timeMs: Date.now() - 18000000, recurrence: 12, lat: 12.9352, lng: 77.6245, aiInsight: "Disease vector risk elevated. Dual vehicle dispatch needed.", trend: 67, manpower: 4, estHours: 3, evidence: GENERATE_EVIDENCE(2),
    verified: true, assigned: true, dispatched: true, work_started: false, engineer_evidence: false, geo_verified: false, ai_validation_score: 0, citizen_confirmed: false },
  { id: 4, title: "Street lights out on entire 80ft stretch — crime risk", cat: "Electricity", loc: "80 Feet Rd, Indiranagar", ward: "Indiranagar", votes: 623, severity: 7.4, status: "Pending", reports: 111, social: 1934, hashtag: "#IndiSafety", authority: "BESCOM", sla: 8, slaDone: 1, timeMs: Date.now() - 86400000, recurrence: 2, lat: 12.9784, lng: 77.6408, aiInsight: "Crime index +40% after dark without lighting. Priority deployment.", trend: 31, manpower: 3, estHours: 4, evidence: GENERATE_EVIDENCE(1),
    verified: true, assigned: true, dispatched: false, work_started: false, engineer_evidence: false, geo_verified: false, ai_validation_score: 0, citizen_confirmed: false },
  { id: 5, title: "Storm drain blocked — flooding risk in 2 localities", cat: "Infrastructure", loc: "JP Nagar 7th Phase", ward: "JP Nagar", votes: 534, severity: 7.1, status: "Pending", reports: 89, social: 1234, hashtag: "#JPNagarFlood", authority: "BBMP Engineering", sla: 16, slaDone: 2, timeMs: Date.now() - 43200000, recurrence: 4, lat: 12.9082, lng: 77.5946, aiInsight: "Pre-monsoon clearance critical. Multi-locality impact.", trend: 44, manpower: 5, estHours: 5, evidence: GENERATE_EVIDENCE(2),
    verified: true, assigned: true, dispatched: false, work_started: false, engineer_evidence: false, geo_verified: false, ai_validation_score: 0, citizen_confirmed: false },
  { id: 6, title: "Fallen tree blocking ambulance access route", cat: "Infrastructure", loc: "Jayanagar 4th Block", ward: "Jayanagar", votes: 389, severity: 8.1, status: "Pending", reports: 67, social: 987, hashtag: "#JayanagaEmergency", authority: "BBMP Parks", sla: 4, slaDone: 3, timeMs: Date.now() - 5400000, recurrence: 1, lat: 12.9299, lng: 77.5912, aiInsight: "Emergency access risk! Rapid response tree removal needed.", trend: 189, manpower: 4, estHours: 2, evidence: GENERATE_EVIDENCE(3),
    verified: true, assigned: true, dispatched: false, work_started: false, engineer_evidence: false, geo_verified: false, ai_validation_score: 0, citizen_confirmed: false },
  { id: 7, title: "Open manhole near school — child safety emergency", cat: "Sanitation", loc: "Hebbal Ring Road", ward: "Hebbal", votes: 1102, severity: 9.5, status: "Escalated", reports: 234, social: 6120, hashtag: "#HebbalManholeRisk", authority: "BBMP Engineering", sla: 3, slaDone: 1, timeMs: Date.now() - 3600000, recurrence: 0, lat: 13.0358, lng: 77.5970, aiInsight: "Child safety critical. Temporary cover + permanent fix needed.", trend: 445, manpower: 3, estHours: 1, evidence: GENERATE_EVIDENCE(5),
    verified: true, assigned: true, dispatched: true, work_started: true, engineer_evidence: false, geo_verified: true, ai_validation_score: 0, citizen_confirmed: false },
  { id: 8, title: "Transformer fire risk — sparking wires after rain", cat: "Electricity", loc: "Banashankari 2nd Stage", ward: "Banashankari", votes: 445, severity: 8.9, status: "In Progress", reports: 78, social: 2341, hashtag: "#BanashankariFire", authority: "BESCOM", sla: 2, slaDone: 1.5, timeMs: Date.now() - 900000, recurrence: 0, lat: 12.9387, lng: 77.5456, aiInsight: "Fire hazard. Disconnect and repair within 2 hours.", trend: 298, manpower: 4, estHours: 3, evidence: GENERATE_EVIDENCE(2),
    verified: true, assigned: true, dispatched: true, work_started: true, engineer_evidence: true, geo_verified: true, ai_validation_score: 75, citizen_confirmed: false },
];

const CIVICSCORE = (issue) => {
  const catWeight = { Water: 1.4, Road: 1.2, Sanitation: 1.3, Electricity: 1.35, Infrastructure: 1.25 }[issue.cat] || 1.0;
  const engBoost = Math.min(1 + (issue.votes / 500) * 0.3, 1.8);
  const dupBoost = Math.min(1 + (issue.reports / 100) * 0.2, 1.5);
  const sentRisk = Math.min(1 + (issue.social / 2000) * 0.25, 1.6);
  const recurScore = Math.min(1 + issue.recurrence * 0.05, 1.3);
  const raw = issue.severity * catWeight * engBoost * dupBoost * sentRisk * recurScore;
  return Math.min(Math.round(raw * 2.8), 100);
};

const ISSUES = ISSUES_RAW.map(i => {
  const { score } = calculateProgress(i);
  return { ...i, civicScore: CIVICSCORE(i), progress: score };
}).sort((a, b) => b.civicScore - a.civicScore);

const STATUS_META = {
  Critical: { color: C.red, icon: "⚠" },
  Escalated: { color: "#ff6b35", icon: "🔺" },
  "In Progress": { color: C.teal, icon: "⚙" },
  Assigned: { color: C.purple, icon: "👤" },
  Pending: { color: C.amber, icon: "⏳" },
  Resolved: { color: C.green, icon: "✓" },
};

const CAT_ICON = { Road: "🛣", Sanitation: "🗑", Electricity: "⚡", Water: "💧", Infrastructure: "🏗", Fire: "🔥", Other: "📋" };
const CAT_COLOR = { Road: "#f97316", Sanitation: "#a3e635", Electricity: "#facc15", Water: "#38bdf8", Infrastructure: "#c084fc", Fire: "#ef4444" };

/* ═══════════════════════════════════════════════════════════ HELPERS */
const fmt = n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n;
const timeAgo = ms => { const d = Date.now() - ms; if (d < 3600000) return `${Math.floor(d/60000)}m ago`; if (d < 86400000) return `${Math.floor(d/3600000)}h ago`; return `${Math.floor(d/86400000)}d ago`; };
const slaColor = (done, total) => { const p = done / total; if (p >= 0.9) return C.red; if (p >= 0.7) return C.amber; return C.green; };

/* ═══════════════════════════════════════════════════════════ MICRO COMPONENTS */
function Pill({ children, color, dim }) {
  return <span style={{ background: dim || `${color}22`, color, border: `1px solid ${color}55`, borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 1.2, display: "inline-flex", alignItems: "center", gap: 4 }}>{children}</span>;
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, fontSize: 64, opacity: 0.04 }}>{icon}</div>
      <div style={{ fontSize: 11, color: C.textDim, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || C.text, fontFamily: FONT_DISPLAY }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SeverityArc({ score, size = 52 }) {
  const r = size / 2 - 5; const c = 2 * Math.PI * r;
  const fill = (score / 10) * c;
  const col = score >= 9 ? C.red : score >= 8 ? "#ff6b35" : score >= 6 ? C.amber : C.green;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={4.5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={4.5} strokeDasharray={c} strokeDashoffset={c - fill} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${col}88)` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: col, fontFamily: FONT }}>{score.toFixed(1)}</div>
    </div>
  );
}

function CivicScoreBadge({ score }) {
  const col = score >= 80 ? C.red : score >= 60 ? "#ff6b35" : score >= 40 ? C.amber : C.teal;
  return (
    <div style={{ background: `${col}22`, border: `1px solid ${col}55`, borderRadius: 10, padding: "4px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: col, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 9, color: col, letterSpacing: 1, opacity: 0.8 }}>CIVIC SCORE</div>
    </div>
  );
}

function ProgressBar({ value, color, thin }) {
  return (
    <div style={{ background: C.border, borderRadius: 8, height: thin ? 4 : 6, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, borderRadius: 8, transition: "width 1.2s cubic-bezier(.4,0,.2,1)", boxShadow: `0 0 6px ${color}66` }} />
    </div>
  );
}

function SLATimer({ sla, done, label }) {
  const pct = (done / sla) * 100;
  const col = slaColor(done, sla);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: C.textDim, letterSpacing: 1 }}>{label}</span>
        <span style={{ fontSize: 10, color: col, fontWeight: 700 }}>{done}h / {sla}h SLA</span>
      </div>
      <ProgressBar value={pct} color={col} thin />
    </div>
  );
}

function PulsingAlert({ color }) {
  return (
    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 0 0 ${color}`, animation: "pulse-ring 1.4s ease infinite" }} />
  );
}

function EvidencePanel({ evidence }) {
  const [filter, setFilter] = useState("All");
  const [hideBots, setHideBots] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const safeEvidence = Array.isArray(evidence) ? evidence : [];
  const filtered = safeEvidence.filter(e => {
    if (filter !== "All" && e.source !== filter) return false;
    if (hideBots && e.botProb > 0.5) return false;
    return true;
  });

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: C.bg2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 8px", fontSize: 11 }}>
            <option value="All">All Sources</option>
            <option value="Citizen Uploads">Citizen Uploads</option>
            <option value="Social Media">Social Media</option>
            <option value="CCTV">CCTV</option>
            <option value="Drone">Drone</option>
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textDim, cursor: "pointer" }}>
            <input type="checkbox" checked={hideBots} onChange={e => setHideBots(e.target.checked)} /> Hide Bot Content
          </label>
        </div>
        <div style={{ fontSize: 10, color: C.teal }}>{filtered.length} items found</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
        {filtered.map((item, i) => (
          <div key={i} onClick={() => setExpanded(item)} style={{ background: C.bg2, borderRadius: 8, overflow: "hidden", border: `1px solid ${item.isFake ? C.red : C.border}`, cursor: "pointer", position: "relative" }}>
            <div style={{ height: 90, background: `url(${item.url}) center/cover`, position: "relative" }}>
              {item.type === "video" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>▶</div>}
              {item.isFake && <div style={{ position: "absolute", top: 4, right: 4, background: C.red, color: "#fff", fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: "bold" }}>FAKE DETECTED</div>}
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: C.textSub }}>{item.source}</span>
                <span style={{ fontSize: 10, color: item.confidence > 0.9 ? C.green : C.amber }}>{(item.confidence * 100).toFixed(0)}% Conf</span>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {item.tags.slice(0, 2).map(t => <span key={t} style={{ fontSize: 9, background: `${C.blue}22`, color: C.blue, padding: "1px 4px", borderRadius: 4 }}>#{t}</span>)}
              </div>
            </div>
          </div>
        ))}
        {safeEvidence.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: 32, textAlign: "center", border: `1px dashed ${C.border}`, borderRadius: 12, color: C.textDim }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
            <div style={{ fontSize: 13, color: C.text }}>No evidence uploaded yet.</div>
            <div style={{ fontSize: 11 }}>Be the first to add proof of this issue.</div>
          </div>
        ) : (
          filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: 32, textAlign: "center", color: C.textDim }}>
              No matching items found.
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ToastContainer({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 3000, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} className="fadeUp" style={{
          background: C.bg1, border: `1px solid ${t.type === 'critical' ? C.red : C.teal}`, borderLeft: `4px solid ${t.type === 'critical' ? C.red : C.teal}`,
          borderRadius: 8, padding: "12px 16px", boxShadow: "0 10px 30px rgba(0,0,0,0.6)", minWidth: 300, maxWidth: 360, pointerEvents: "auto"
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.type === 'critical' ? C.red : C.teal, marginBottom: 2, fontFamily: FONT_DISPLAY, letterSpacing: 1 }}>{t.title.toUpperCase()}</div>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{t.msg}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CITIZEN PORTAL
═══════════════════════════════════════════════════════════ */
function CitizenPortal({ issues, onReport }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [sortBy, setSortBy] = useState("civic");
  const [selected, setSelected] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [votedIds, setVotedIds] = useState(new Set());
  const [localVotes, setLocalVotes] = useState({});

  const cats = ["All", "Road", "Sanitation", "Electricity", "Water", "Infrastructure"];
  const filtered = issues
    .filter(i => catFilter === "All" || i.cat === catFilter)
    .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || (i.loc && i.loc.toLowerCase().includes(search.toLowerCase())) || (i.hashtag && i.hashtag.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => ({ civic: b.civicScore - a.civicScore, votes: (b.votes + (localVotes[b.id] || 0)) - (a.votes + (localVotes[a.id] || 0)), recent: b.timeMs - a.timeMs, severity: b.severity - a.severity })[sortBy] || 0);

  const handleVote = (id) => {
    if (!votedIds.has(id)) {
      setVotedIds(prev => new Set([...prev, id]));
      setLocalVotes(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    }
  };

  return (
    <div style={{ padding: "0 0 32px" }}>
      {/* Hero strip */}
      <div style={{ background: `linear-gradient(135deg, ${C.tealDim}, ${C.blueDim})`, border: `1px solid ${C.teal}33`, borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: C.teal, letterSpacing: 3, fontWeight: 700 }}>CITIZEN GRIEVANCE PORTAL</div>
          <h2 style={{ margin: "6px 0 4px", fontSize: 22, fontWeight: 900, color: C.white, fontFamily: FONT_DISPLAY }}>Your City. Your Voice. Your Votes.</h2>
          <div style={{ fontSize: 13, color: C.textSub }}>Report issues, upvote community problems, track resolution in real time</div>
        </div>
        <button onClick={() => setShowReport(true)} style={{
          background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`, border: "none", borderRadius: 12,
          padding: "12px 24px", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer",
          fontFamily: FONT_DISPLAY, letterSpacing: 1, boxShadow: `0 4px 20px ${C.teal}44`, transition: "transform 0.15s"
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          + REPORT ISSUE
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
        <StatCard icon="📋" label="ACTIVE ISSUES" value={issues.length} sub="Across Bengaluru" color={C.teal} />
        <StatCard icon="▲" label="TOTAL UPVOTES" value={fmt(issues.reduce((s, i) => s + i.votes, 0))} sub="Community signals" color={C.blue} />
        <StatCard icon="📱" label="SOCIAL MENTIONS" value={fmt(issues.reduce((s, i) => s + i.social, 0))} sub="Hashtag reach" color={C.purple} />
        <StatCard icon="⚠" label="CRITICAL ISSUES" value={issues.filter(i => i.status === "Critical" || i.status === "Escalated").length} sub="Needs urgent action" color={C.red} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.textDim }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues, locations, #hashtags..."
            style={{ width: "100%", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px 9px 36px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: FONT }}
            onFocus={e => e.target.style.borderColor = C.teal} onBlur={e => e.target.style.borderColor = C.border}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              background: catFilter === c ? `${CAT_COLOR[c] || C.teal}22` : C.bg2,
              border: `1px solid ${catFilter === c ? (CAT_COLOR[c] || C.teal) : C.border}`,
              borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: catFilter === c ? 700 : 400,
              color: catFilter === c ? (CAT_COLOR[c] || C.teal) : C.textSub, cursor: "pointer", fontFamily: FONT,
              transition: "all 0.15s"
            }}>
              {CAT_ICON[c] || "🌐"} {c}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
          background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px",
          color: C.textSub, fontSize: 11, outline: "none", fontFamily: FONT, cursor: "pointer"
        }}>
          <option value="civic">Sort: Civic Score ↓</option>
          <option value="votes">Sort: Most Votes</option>
          <option value="severity">Sort: Severity</option>
          <option value="recent">Sort: Recent</option>
        </select>
      </div>

      {/* Issue list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((issue, idx) => {
          const sm = STATUS_META[issue.status] || STATUS_META.Pending;
          const votes = issue.votes + (localVotes[issue.id] || 0);
          const voted = votedIds.has(issue.id);
          return (
            <div key={issue.id} onClick={() => setSelected(issue)} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px",
              cursor: "pointer", position: "relative", overflow: "hidden", transition: "all 0.18s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = sm.color + "99"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 6px 24px ${sm.color}18`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: sm.color, borderRadius: "14px 0 0 14px" }} />
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                {/* Left: vote button */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 44 }}>
                  <button onClick={e => { e.stopPropagation(); handleVote(issue.id); }} style={{
                    background: voted ? `${C.teal}22` : C.bg2, border: `1px solid ${voted ? C.teal : C.border}`,
                    borderRadius: 10, padding: "6px 10px", cursor: voted ? "default" : "pointer", color: voted ? C.teal : C.textDim,
                    fontSize: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, transition: "all 0.15s"
                  }}>
                    <span>{voted ? "▲" : "△"}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: FONT }}>{fmt(votes)}</span>
                  </button>
                  <div style={{ fontSize: 9, color: C.textDim, textAlign: "center" }}>{issue.reports} dups</div>
                </div>

                {/* Center: content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                    <Pill color={CAT_COLOR[issue.cat] || C.teal}>{CAT_ICON[issue.cat] || "⏳"} {issue.cat.toUpperCase()}</Pill>
                    <Pill color={sm.color}><PulsingAlert color={sm.color} /> {issue.status.toUpperCase()}</Pill>
                    <span style={{ fontSize: 11, color: C.teal, opacity: 0.7 }}>{issue.hashtag}</span>
                    <span style={{ fontSize: 10, color: C.textDim, marginLeft: "auto" }}>{timeAgo(issue.timeMs)}</span>
                  </div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4, fontFamily: FONT_DISPLAY }}>{issue.title}</h3>
                  <div style={{ fontSize: 11, color: C.textDim, marginBottom: 8 }}>📍 {issue.loc} · {issue.authority}</div>
                  <div style={{ background: `${C.teal}0d`, border: `1px solid ${C.teal}22`, borderRadius: 7, padding: "5px 10px", marginBottom: 8, fontSize: 11, color: C.teal }}>
                    🤖 {issue.aiInsight}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ flex: 1 }}><ProgressBar value={issue.progress} color={sm.color} thin /></div>
                    <span style={{ fontSize: 10, color: C.textDim, whiteSpace: "nowrap" }}>{issue.progress}% resolved</span>
                  </div>
                </div>

                {/* Right: scores */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", minWidth: 52 }}>
                  <SeverityArc score={issue.severity} />
                  <CivicScoreBadge score={issue.civicScore} />
                  <div style={{ fontSize: 10, color: C.green, textAlign: "center" }}>+{fmt(issue.trend)}/day</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showReport && <ReportModal issues={issues} onClose={() => setShowReport(false)} onSubmit={onReport} />}
      {selected && <IssueDetailModal issue={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTHORITY DASHBOARD
═══════════════════════════════════════════════════════════ */
function AuthorityDashboard({ issues }) {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const chatEndRef = useRef(null);

  const sorted = [...issues].sort((a, b) => b.civicScore - a.civicScore);
  const depts = [...new Set(issues.map(i => i.authority))];

  // Reset chat when issue changes
  useEffect(() => {
    if (selectedIssue) {
      setChatHistory([{ 
        id: "init", 
        role: "ai", 
        text: `**AI COMMAND ASSISTANT**\nConnected to ${selectedIssue.authority} database.\n\nIssue: ${selectedIssue.title}\nSeverity: ${selectedIssue.severity}/10\n\nI can generate response plans, draft alerts, or analyze trends. How can I help?` 
      }]);
      setChatInput("");
      setIsTyping(false);
    }
  }, [selectedIssue]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userText = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { id: Date.now(), role: "user", text: userText }]);
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 1200));

    let response = "";
    const lower = userText.toLowerCase();
    
    if (lower.includes("plan") || lower.includes("action")) {
        response = `**🤖 AI TACTICAL RESPONSE PLAN**\n\n` +
        `**ISSUE:** ${selectedIssue.title}\n` +
        `**SEVERITY:** ${selectedIssue.severity}/10 (${selectedIssue.status.toUpperCase()})\n\n` +
        `**1. IMMEDIATE ACTIONS (0-2 Hours):**\n` +
        `• Dispatch ${selectedIssue.manpower} member ${selectedIssue.cat} response crew to ${selectedIssue.loc}.\n` +
        `• Alert traffic control for potential congestion in ${selectedIssue.ward}.\n` +
        `• Send push notification to ${selectedIssue.reports} affected citizens.\n\n` +
        `**2. RESOLUTION STRATEGY:**\n` +
        `• Deploy heavy machinery for ${selectedIssue.cat} infrastructure repair.\n` +
        `• Estimated resolution time: ${selectedIssue.estHours} hours.\n` +
        `• Coordinate with ${selectedIssue.authority} for resource allocation.\n\n` +
        `**3. PREVENTIVE MEASURES:**\n` +
        `• Conduct root cause analysis on ${selectedIssue.cat} grid in ${selectedIssue.ward}.\n` +
        `• Install IoT sensors for early warning of recurrence.\n\n` +
        `**RISK ASSESSMENT:**\n` +
        `Delay > 4 hours increases civic dissatisfaction by 15%. Act now.`;
    } else if (lower.includes("alert") || lower.includes("notify")) {
        response = `**📢 CITIZEN ALERT DRAFT**\n\n"Attention ${selectedIssue.ward}: ${selectedIssue.cat} service disruption detected at ${selectedIssue.loc}. Crews dispatched. ETA ${selectedIssue.estHours}h. - ${selectedIssue.authority}"`;
    } else {
        response = `I have logged that. I am monitoring the situation at ${selectedIssue.loc}. \n\nTry asking for an **"action plan"** or **"citizen alert"**.`;
    }

    setChatHistory(prev => [...prev, { id: Date.now()+1, role: "ai", text: response }]);
    setIsTyping(false);
  };

  const simulateResolution = (topN) => {
    const top = sorted.slice(0, topN);
    const currentRisk = Math.round(sorted.reduce((s, i) => s + i.civicScore, 0) / sorted.length);
    const afterRisk = Math.round(sorted.slice(topN).reduce((s, i) => s + i.civicScore, 0) / Math.max(sorted.length - topN, 1));
    const reduction = Math.round(((currentRisk - afterRisk) / currentRisk) * 100);
    setSimResult({ topN, currentRisk, afterRisk, reduction, issues: top.map(i => i.title) });
  };

  return (
    <div style={{ padding: "0 0 32px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
        <div style={{ background: `linear-gradient(135deg, ${C.redDim}, ${C.amberDim})`, border: `1px solid ${C.red}44`, borderRadius: 16, padding: "20px 22px" }}>
          <div style={{ fontSize: 11, color: C.red, letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>AUTHORITY COMMAND CENTER</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: C.white, fontFamily: FONT_DISPLAY }}>Impact-Ranked Civic Queue</div>
          <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>AI-prioritized by Civic Impact Score — not time of filing</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <StatCard icon="🔥" label="CITY RISK INDEX" value={`${Math.round(issues.reduce((s,i) => s+i.civicScore, 0)/issues.length)}/100`} color={C.red} />
          <StatCard icon="⏱" label="SLA BREACHED" value={issues.filter(i => i.slaDone/i.sla >= 0.9).length} color={C.amber} />
        </div>
      </div>

      {/* Simulation Tool */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: C.purple, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>⚡ RESOLUTION IMPACT SIMULATOR</div>
        <div style={{ fontSize: 12, color: C.textSub, marginBottom: 12 }}>Select top N issues to resolve — see predicted city risk reduction</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[1, 2, 3, 5].map(n => (
            <button key={n} onClick={() => simulateResolution(n)} style={{
              background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 16px",
              color: C.textSub, fontSize: 12, cursor: "pointer", fontFamily: FONT,
              transition: "all 0.15s"
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.purple; e.currentTarget.style.color = C.purple; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; }}
            >
              Top {n} Issues
            </button>
          ))}
          {simResult && (
            <div style={{ background: `${C.green}11`, border: `1px solid ${C.green}44`, borderRadius: 8, padding: "7px 16px", fontSize: 12, color: C.green }}>
              Resolving top {simResult.topN}: Risk {simResult.currentRisk} → {simResult.afterRisk} ({simResult.reduction}% ↓)
            </div>
          )}
        </div>
      </div>

      {/* Main ranked table */}
      <div style={{ display: "grid", gridTemplateColumns: selectedIssue ? "1fr 380px" : "1fr", gap: 16 }}>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: 0, background: C.bg2, borderRadius: "12px 12px 0 0", padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
            {["RANK", "ISSUE / LOCATION", "SCORES", "SLA STATUS", "ACTION"].map(h => (
              <div key={h} style={{ fontSize: 9, color: C.textDim, letterSpacing: 2, fontWeight: 700, padding: "0 8px" }}>{h}</div>
            ))}
          </div>
          {sorted.map((issue, idx) => {
            const sm = STATUS_META[issue.status] || STATUS_META.Pending;
            const slaOver = issue.slaDone / issue.sla >= 0.9;
            return (
              <div key={issue.id} onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)} style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto auto auto",
                background: selectedIssue?.id === issue.id ? C.bg3 : C.card,
                borderBottom: `1px solid ${C.border}`, padding: "13px 16px", cursor: "pointer",
                borderLeft: `3px solid ${sm.color}`, transition: "all 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.bg3}
                onMouseLeave={e => e.currentTarget.style.background = selectedIssue?.id === issue.id ? C.bg3 : C.card}
              >
                <div style={{ padding: "0 8px", display: "flex", alignItems: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: idx < 3 ? `${C.red}33` : C.bg2, border: `1px solid ${idx < 3 ? C.red : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: idx < 3 ? C.red : C.textDim }}>
                    {idx + 1}
                  </div>
                </div>
                <div style={{ padding: "0 8px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3, fontFamily: FONT_DISPLAY }}>{issue.title}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Pill color={CAT_COLOR[issue.cat] || C.teal}>{CAT_ICON[issue.cat]} {issue.cat}</Pill>
                    <span style={{ fontSize: 10, color: C.textDim }}>📍 {issue.loc}</span>
                    <span style={{ fontSize: 10, color: C.textDim }}>🏛 {issue.authority}</span>
                  </div>
                </div>
                <div style={{ padding: "0 8px", display: "flex", gap: 8, alignItems: "center" }}>
                  <SeverityArc score={issue.severity} size={44} />
                  <CivicScoreBadge score={issue.civicScore} />
                </div>
                <div style={{ padding: "0 8px", minWidth: 140 }}>
                  <SLATimer sla={issue.sla} done={issue.slaDone} label={slaOver ? "⚠ SLA AT RISK" : "SLA ELAPSED"} />
                  <div style={{ marginTop: 6 }}>
                    <Pill color={sm.color}>{sm.icon} {issue.status}</Pill>
                  </div>
                </div>
                <div style={{ padding: "0 8px", display: "flex", gap: 6, alignItems: "center" }}>
                  <button onClick={e => { e.stopPropagation(); setSelectedIssue(issue); getAiActions(issue); }} style={{
                    background: `${C.teal}22`, border: `1px solid ${C.teal}`, borderRadius: 8,
                    padding: "5px 12px", color: C.teal, fontSize: 11, cursor: "pointer", fontFamily: FONT, fontWeight: 700,
                    whiteSpace: "nowrap"
                  }}>
                    🤖 AI Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Side panel: AI recommended actions */}
        {selectedIssue && (
          <div style={{ background: C.card, border: `1px solid ${C.teal}44`, borderRadius: 14, padding: 18, alignSelf: "start", position: "sticky", top: 80 }}>
            <div style={{ fontSize: 10, color: C.teal, letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>🤖 AI COMMAND ASSISTANT</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: FONT_DISPLAY }}>{selectedIssue.title}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginBottom: 12 }}>📍 {selectedIssue.loc} · Civic Score: {selectedIssue.civicScore}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Manpower", val: `${selectedIssue.manpower} crew`, col: C.blue },
                { label: "Est. Time", val: `${selectedIssue.estHours}h`, col: C.teal },
                { label: "Recurrences", val: selectedIssue.recurrence, col: selectedIssue.recurrence > 3 ? C.red : C.amber },
                { label: "Social Buzz", val: fmt(selectedIssue.social), col: C.purple },
              ].map(m => (
                <div key={m.label} style={{ background: C.bg2, borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>{m.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: m.col }}>{m.val}</div>
                </div>
              ))}
            </div>
            
            {/* Chat Interface */}
            <div style={{ display: "flex", flexDirection: "column", height: 400, background: C.bg2, borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {chatHistory.map(msg => (
                  <div key={msg.id} style={{ 
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    background: msg.role === "user" ? `${C.teal}22` : C.bg1,
                    border: `1px solid ${msg.role === "user" ? C.teal : C.border}`,
                    borderRadius: 8, padding: "8px 12px", maxWidth: "90%", fontSize: 12, color: C.textSub, whiteSpace: "pre-wrap"
                  }}>
                    {msg.role === "ai" && <span style={{ marginRight: 6 }}>🤖</span>}
                    {msg.text}
                  </div>
                ))}
                {isTyping && <div style={{ fontSize: 10, color: C.textDim, padding: "0 12px" }}>AI is typing...</div>}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} style={{ display: "flex", borderTop: `1px solid ${C.border}`, padding: 8, gap: 8 }}>
                <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  placeholder="Ask AI assistant..." 
                  style={{ flex: 1, background: C.bg0, border: "none", borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 12, outline: "none" }}
                />
                <button type="submit" style={{ background: C.teal, border: "none", borderRadius: 6, padding: "0 12px", cursor: "pointer", color: "#000", fontWeight: "bold" }}>→</button>
              </form>
            </div>

            {selectedIssue.recurrence > 3 && (
              <div style={{ marginTop: 12, background: `${C.amber}11`, border: `1px solid ${C.amber}44`, borderRadius: 8, padding: "8px 10px", fontSize: 11, color: C.amber }}>
                ⚠ RECURRING ISSUE: Reported {selectedIssue.recurrence}× in past 90 days. Recommend preventive infrastructure audit.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANALYTICS CENTER
═══════════════════════════════════════════════════════════ */
function AnalyticsCenter({ issues, liveStats = [], cityStats }) {
  // Chart data
  const catData = Object.entries(
    issues.reduce((acc, i) => { acc[i.cat] = (acc[i.cat] || 0) + 1; return acc; }, {})
  ).map(([cat, count]) => ({ cat, count, color: CAT_COLOR[cat] || C.teal }));

  const severityDist = [
    { name: "Low (1-4)", value: issues.filter(i => i.severity < 5).length, color: C.green },
    { name: "Medium (5-7)", value: issues.filter(i => i.severity >= 5 && i.severity < 8).length, color: C.amber },
    { name: "High (8-9)", value: issues.filter(i => i.severity >= 8 && i.severity < 9.5).length, color: "#ff6b35" },
    { name: "Critical (9.5+)", value: issues.filter(i => i.severity >= 9.5).length, color: C.red },
  ];

  const trendData = [
    { day: "Day 1", score: 42, resolved: 3, new: 5 },
    { day: "Day 2", score: 51, resolved: 4, new: 7 },
    { day: "Day 3", score: 63, resolved: 2, new: 9 },
    { day: "Day 4", score: 58, resolved: 6, new: 4 },
    { day: "Day 5", score: 71, resolved: 3, new: 8 },
    { day: "Day 6", score: 65, resolved: 7, new: 5 },
    { day: "Today", score: 74, resolved: 2, new: 10 },
  ];

  const sentimentData = [
    { day: "Mon", pos: 20, neu: 45, neg: 35 },
    { day: "Tue", pos: 22, neu: 40, neg: 38 },
    { day: "Wed", pos: 15, neu: 38, neg: 47 },
    { day: "Thu", pos: 25, neu: 42, neg: 33 },
    { day: "Fri", pos: 18, neu: 35, neg: 47 },
    { day: "Sat", pos: 30, neu: 40, neg: 30 },
    { day: "Sun", pos: 28, neu: 44, neg: 28 },
  ];

  const authorityPerf = [
    { name: "BWSSB", response: 3.2, closure: 78, satisfaction: 62 },
    { name: "BESCOM", response: 5.8, closure: 71, satisfaction: 68 },
    { name: "BBMP Roads", response: 18.4, closure: 45, satisfaction: 41 },
    { name: "BBMP SWM", response: 9.1, closure: 58, satisfaction: 55 },
    { name: "BBMP Parks", response: 22.3, closure: 38, satisfaction: 45 },
    { name: "BBMP Eng", response: 11.5, closure: 63, satisfaction: 59 },
  ];

  const resolutionTime = [
    { range: "0-4h", count: 8 },
    { range: "4-12h", count: 14 },
    { range: "12-24h", count: 21 },
    { range: "1-3d", count: 18 },
    { range: "3-7d", count: 11 },
    { range: "7d+", count: 6 },
  ];

  // Use real-time stats from backend or fallback
  const currentStats = liveStats.length > 0 ? liveStats[liveStats.length - 1] : (cityStats || { health: 85, risk: 15, hotspots: [] });
  const cityHealth = currentStats.health;
  const riskIndex = currentStats.risk;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 11, fontFamily: FONT }}>
        <div style={{ color: C.textDim, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
      </div>
    );
  };

  return (
    <div style={{ padding: "0 0 32px" }}>
      {/* City Health Banner */}
      <div style={{ background: `linear-gradient(135deg, ${C.bg2}, ${C.bg3})`, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, letterSpacing: 2, fontWeight: 700 }}>CIVIC INTELLIGENCE CENTER</div>
          <h2 style={{ margin: "6px 0 4px", fontSize: 22, fontWeight: 900, color: C.white, fontFamily: FONT_DISPLAY }}>City Health Dashboard</h2>
          <div style={{ fontSize: 13, color: C.textSub }}>Real-time analytics driving evidence-based governance</div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: cityHealth >= 60 ? C.green : cityHealth >= 40 ? C.amber : C.red, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{cityHealth}</div>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2 }}>CITY HEALTH SCORE</div>
          </div>
          <div style={{ width: 1, height: 60, background: C.border }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: riskIndex >= 70 ? C.red : riskIndex >= 50 ? C.amber : C.teal, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>{riskIndex}</div>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2 }}>RISK INDEX</div>
          </div>
        </div>
      </div>

      {/* Civic Score Formula */}
      <div style={{ background: C.card, border: `1px solid ${C.purple}44`, borderRadius: 14, padding: "14px 18px", marginBottom: 22 }}>
        <div style={{ fontSize: 10, color: C.purple, letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>🧠 CIVIC IMPACT SCORE — EXPLAINABLE AI FORMULA</div>
        <div style={{ fontSize: 11, color: C.textSub, fontFamily: FONT, lineHeight: 2 }}>
          <span style={{ color: C.white, fontWeight: 700 }}>CivicScore</span> = <span style={{ color: C.amber }}>Severity</span> × <span style={{ color: C.teal }}>CategoryWeight</span> × <span style={{ color: C.blue }}>EngagementBoost</span> × <span style={{ color: C.purple }}>DuplicateBoost</span> × <span style={{ color: "#ff6b35" }}>SentimentRisk</span> × <span style={{ color: C.green }}>RecurrenceScore</span> → <span style={{ color: C.white }}>scaled 0–100</span>
          <div style={{ marginTop: 6, color: C.textDim }}>
            CategoryWeight: Water 1.4 · Electricity 1.35 · Sanitation 1.3 · Road 1.2 · Infrastructure 1.25 &nbsp;|&nbsp;
            Boosts capped: Engagement ≤1.8 · Duplicate ≤1.5 · Sentiment ≤1.6 · Recurrence ≤1.3
          </div>
          {currentStats.aiExplanation && (
            <div style={{ marginTop: 12, background: `${C.teal}11`, border: `1px solid ${C.teal}33`, borderRadius: 8, padding: 10 }}>
              <div style={{ fontSize: 10, color: C.teal, fontWeight: 700, marginBottom: 4 }}>🤖 AI INSIGHT</div>
              <div style={{ fontSize: 11, color: C.text }}>{currentStats.aiExplanation.risk_summary}</div>
              <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>Top Factor: {currentStats.aiExplanation.top_factor}</div>
              <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>Action: {currentStats.aiExplanation.recommended_action}</div>
            </div>
          )}
        </div>
      </div>

      {/* Row 1: Category bar + Severity pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, color: C.teal, letterSpacing: 2, fontWeight: 700, marginBottom: 14 }}>📊 ISSUE CATEGORY DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="cat" tick={{ fill: C.textDim, fontSize: 10, fontFamily: FONT }} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: FONT }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {catData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, color: C.amber, letterSpacing: 2, fontWeight: 700, marginBottom: 14 }}>🔴 SEVERITY DISTRIBUTION</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityDist} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {severityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 130 }}>
              {severityDist.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 11, color: C.textSub }}>{s.name}: <span style={{ color: s.color, fontWeight: 700 }}>{s.value}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Trend + Sentiment */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, color: C.blue, letterSpacing: 2, fontWeight: 700, marginBottom: 14 }}>📈 CIVIC RISK TREND — 7 DAYS</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.red} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.red} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" tick={{ fill: C.textDim, fontSize: 10, fontFamily: FONT }} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: FONT }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: FONT, color: C.textDim }} />
              <Area type="monotone" dataKey="score" stroke={C.red} fill="url(#riskGrad)" name="Risk Score" dot={{ fill: C.red, r: 3 }} />
              <Area type="monotone" dataKey="resolved" stroke={C.green} fill="url(#resolvedGrad)" name="Resolved" dot={{ fill: C.green, r: 3 }} />
              <Line type="monotone" dataKey="new" stroke={C.amber} strokeDasharray="5 5" name="New Issues" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, color: C.purple, letterSpacing: 2, fontWeight: 700, marginBottom: 14 }}>📱 SOCIAL MEDIA SENTIMENT TREND</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={sentimentData} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.green} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.red} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={C.red} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" tick={{ fill: C.textDim, fontSize: 10, fontFamily: FONT }} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: FONT }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: FONT, color: C.textDim }} />
              <Area type="monotone" dataKey="pos" stroke={C.green} fill="url(#posGrad)" name="Positive %" stackId="1" />
              <Area type="monotone" dataKey="neu" stroke={C.amber} fill={`${C.amber}22`} name="Neutral %" stackId="1" />
              <Area type="monotone" dataKey="neg" stroke={C.red} fill="url(#negGrad)" name="Negative %" stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Resolution histogram + Authority performance */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, color: C.amber, letterSpacing: 2, fontWeight: 700, marginBottom: 14 }}>⏱ RESOLUTION TIME HISTOGRAM</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={resolutionTime} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="range" tick={{ fill: C.textDim, fontSize: 10, fontFamily: FONT }} />
              <YAxis tick={{ fill: C.textDim, fontSize: 10, fontFamily: FONT }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Issues" radius={[4, 4, 0, 0]}>
                {resolutionTime.map((entry, i) => (
                  <Cell key={i} fill={i < 2 ? C.green : i < 4 ? C.amber : C.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 10, color: C.textDim }}>
            <span style={{ color: C.green }}>■</span> Fast (&lt;12h)
            <span style={{ color: C.amber }}>■</span> Acceptable
            <span style={{ color: C.red }}>■</span> SLA Breach
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, color: C.red, letterSpacing: 2, fontWeight: 700, marginBottom: 14 }}>🏛 AUTHORITY PERFORMANCE SCORECARD</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {authorityPerf.sort((a, b) => b.satisfaction - a.satisfaction).map((auth, i) => (
              <div key={auth.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{auth.name}</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 10, color: C.textDim }}>⏱ {auth.response}h avg</span>
                    <span style={{ fontSize: 10, color: auth.satisfaction >= 65 ? C.green : auth.satisfaction >= 50 ? C.amber : C.red }}>★ {auth.satisfaction}%</span>
                  </div>
                </div>
                <ProgressBar value={auth.satisfaction} color={auth.satisfaction >= 65 ? C.green : auth.satisfaction >= 50 ? C.amber : C.red} thin />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive hotspot */}
      <div style={{ background: C.card, border: `1px solid ${C.amber}44`, borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ fontSize: 10, color: C.amber, letterSpacing: 2, fontWeight: 700, marginBottom: 14 }}>🔮 PREDICTIVE HOTSPOT FORECAST — NEXT 7 DAYS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {(currentStats.hotspots || []).map((h, i) => (
            <div key={h.ward || i} style={{ background: C.bg2, borderRadius: 10, padding: 14, border: `1px solid ${C.amber}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FONT_DISPLAY }}>{h.ward}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: h.risk >= 85 ? C.red : C.amber }}>{h.risk}</div>
              </div>
              <div style={{ fontSize: 11, color: C.textSub, marginBottom: 8 }}>{h.reason}</div>
              <Pill color={C.amber}>{h.trend} predicted risk</Pill>
            </div>
          ))}
          {(!currentStats.hotspots || currentStats.hotspots.length === 0) && <div style={{ color: C.textDim, fontSize: 12 }}>Gathering data...</div>}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REPORT MODAL — Smart Submission with Live Duplicate Detection
═══════════════════════════════════════════════════════════ */
function ReportModal({ issues, onClose, onSubmit }) {
  const [form, setForm] = useState({ title: "", cat: "", loc: "", ward: "", desc: "", imageBase64: null });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const similarIssues = useMemo(() => {
    if (!form.title || form.title.length < 6) return [];
    return issues.filter(i =>
      i.cat === form.cat ||
      (form.loc && i.loc.toLowerCase().includes(form.loc.split(",")[0].toLowerCase()))
    ).slice(0, 2);
  }, [form.title, form.cat, form.loc, issues]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, imageBase64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocation = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm(p => ({ ...p, loc: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }));
          setLocating(false);
        },
        () => {
          setForm(p => ({ ...p, loc: "Location access denied" }));
          setLocating(false);
        }
      );
    } else {
      setForm(p => ({ ...p, loc: "Geolocation not supported" }));
      setLocating(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit(form);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.bg1, border: `1px solid ${C.teal}44`, borderRadius: 20, width: "100%", maxWidth: 600,
        maxHeight: "92vh", overflowY: "auto", boxShadow: `0 0 80px ${C.teal}22`
      }}>
        {submitted ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.green, fontFamily: FONT_DISPLAY }}>Issue Submitted</div>
            <div style={{ fontSize: 13, color: C.textSub, marginTop: 8 }}>AI is analyzing your report. It will appear on the dashboard shortly.</div>
            <button onClick={onClose} style={{ marginTop: 20, background: C.teal, border: "none", borderRadius: 10, padding: "10px 24px", color: "#000", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: FONT_DISPLAY }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: C.teal, letterSpacing: 2, fontWeight: 700 }}>SMART REPORT</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.white, fontFamily: FONT_DISPLAY }}>Describe the Issue</div>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: 22 }}>
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                        <label style={{ display: "block", fontSize: 10, color: C.textDim, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>EVIDENCE (IMAGE)</label>
                        <div style={{ 
                            border: `1px dashed ${C.border}`, borderRadius: 10, height: 120, display: "flex", alignItems: "center", justifyContent: "center",
                            background: imagePreview ? `url(${imagePreview}) center/cover` : C.bg2, position: "relative", overflow: "hidden"
                        }}>
                            {!imagePreview && <div style={{ textAlign: "center", color: C.textDim, fontSize: 11 }}>Drag & Drop or Click<br/>to Upload</div>}
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: 10, color: C.textDim, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>LOCATION (AUTO-DETECT)</label>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input value={form.loc} onChange={e => setForm(p => ({ ...p, loc: e.target.value }))} placeholder="Coordinates or Address" 
                                style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", color: C.text, fontSize: 12, outline: "none", fontFamily: FONT }} 
                            />
                            <button onClick={handleLocation} disabled={locating} style={{ background: C.bg2, border: `1px solid ${C.teal}`, borderRadius: 10, width: 40, color: C.teal, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {locating ? "..." : "📍"}
                            </button>
                        </div>
                        <div style={{ fontSize: 10, color: C.textDim, marginTop: 6 }}>
                            {locating ? "Triangulating..." : "Use GPS for higher accuracy"}
                        </div>
                    </div>
                  </div>

                  {[
                    { label: "ISSUE TITLE", key: "title", placeholder: "e.g. Large pothole causing accidents" },
                    { label: "WARD / AREA", key: "ward", placeholder: "e.g. Indiranagar" },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: 14 }}>
                      <label style={{ display: "block", fontSize: 10, color: C.textDim, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>{f.label}</label>
                      <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{ width: "100%", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: FONT }}
                        onFocus={e => e.target.style.borderColor = C.teal} onBlur={e => e.target.style.borderColor = C.border}
                      />
                    </div>
                  ))}

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 10, color: C.textDim, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>DESCRIPTION</label>
                    <textarea value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))}
                      placeholder="Additional context helps AI assess severity..."
                      style={{ width: "100%", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13, outline: "none", minHeight: 72, resize: "none", boxSizing: "border-box", fontFamily: FONT }}
                      onFocus={e => e.target.style.borderColor = C.teal} onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>

                  {/* Live duplicate detection */}
                  {similarIssues.length > 0 && (
                    <div style={{ background: `${C.amber}0d`, border: `1px solid ${C.amber}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: C.amber, fontWeight: 700, marginBottom: 6 }}>⚠ Similar Issues Already Reported:</div>
                      {similarIssues.map(si => (
                        <div key={si.id} style={{ fontSize: 11, color: C.textSub, marginBottom: 4 }}>
                          • {si.title} — <span style={{ color: C.amber }}>{si.votes} votes · {si.reports} reports</span>
                        </div>
                      ))}
                      <div style={{ fontSize: 10, color: C.textDim, marginTop: 6 }}>Consider upvoting instead to boost impact!</div>
                    </div>
                  )}

                  <button onClick={handleSubmit} disabled={!form.title} style={{
                    width: "100%", padding: "12px", background: !form.title ? C.border : `linear-gradient(135deg, ${C.teal}, ${C.blue})`,
                    border: "none", borderRadius: 12, color: "#000", fontSize: 14, fontWeight: 900,
                    cursor: !form.title ? "not-allowed" : "pointer", fontFamily: FONT_DISPLAY, letterSpacing: 1
                  }}>
                    SUBMIT REPORT
                  </button>
                </>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ISSUE DETAIL MODAL — Citizen full transparency view
═══════════════════════════════════════════════════════════ */
function IssueDetailModal({ issue, onClose }) {
  const [tab, setTab] = useState("overview");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const sm = STATUS_META[issue.status] || STATUS_META.Pending;
  
  const { score, breakdown } = calculateProgress(issue);
  const slaUtilization = Math.min((issue.slaDone / issue.sla) * 100, 100);

  const timeline = [
    { label: "Complaint Filed", done: true, time: timeAgo(issue.timeMs) },
    { label: "AI Severity Assessment", done: true, time: "Instant (automated)" },
    { label: "Authority Notified", done: issue.progress > 0, time: issue.progress > 0 ? "Within 1h" : "Pending" },
    { label: "Field Team Assigned", done: issue.progress > 25, time: issue.progress > 25 ? "Team deployed" : "Awaiting assignment" },
    { label: "Work In Progress", done: issue.progress > 55, time: issue.progress > 55 ? "Active now" : "Scheduled" },
    { label: "Resolved & Citizen Verified", done: issue.progress >= 100, time: issue.progress >= 100 ? "Complete" : `Est. ${issue.estHours}h remaining` },
  ];

  const askAI = async (prompt) => {
    setAiLoading(true); setAiText("");
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    let response = "";
    if (prompt.includes("Predict")) {
      response = `**📉 PREDICTION:** Based on historical data for ${issue.ward}, similar ${issue.cat} issues take avg ${issue.estHours}h to resolve. \n\n**BOTTLENECKS:**\n• Peak hour traffic on ${issue.loc}\n• Material availability for ${issue.authority}`;
    } else if (prompt.includes("similar")) {
      response = `**📚 PRECEDENT SEARCH:**\nFound 3 similar cases in past 90 days:\n1. Case #4921 (Resolved in 6h)\n2. Case #3321 (Resolved in 18h)\n3. Case #1102 (Resolved in 4h)\n\n**INSIGHT:** Faster resolution correlated with early morning dispatch.`;
    } else if (prompt.includes("notice")) {
      response = `**📢 DRAFT NOTICE:**\n"Attention Residents of ${issue.ward}: We are aware of the ${issue.cat} issue at ${issue.loc}. Crews have been dispatched. Expected resolution: ${issue.estHours} hours. Thank you for your patience."`;
    } else {
      response = `**💰 IMPACT ANALYSIS:**\n• Affected Population: ~2,500 households\n• Est. Economic Loss: ₹1.2 Lakhs/hour\n• Social Sentiment: Negative trending (-12%)\n\nRecommendation: Prioritize to prevent escalation.`;
    }

    setAiText(response);
    setAiLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.bg1, border: `1px solid ${sm.color}55`, borderRadius: 20, width: "100%", maxWidth: 680,
        maxHeight: "92vh", overflowY: "auto", boxShadow: `0 0 80px ${sm.color}18`
      }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, background: `linear-gradient(135deg, ${sm.color}11, transparent)` }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <Pill color={CAT_COLOR[issue.cat] || C.teal}>{CAT_ICON[issue.cat]} {issue.cat}</Pill>
                <Pill color={sm.color}><PulsingAlert color={sm.color} /> {issue.status}</Pill>
                <span style={{ fontSize: 11, color: C.teal }}>{issue.hashtag}</span>
              </div>
              <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 900, color: C.white, fontFamily: FONT_DISPLAY }}>{issue.title}</h2>
              <div style={{ fontSize: 12, color: C.textDim }}>📍 {issue.loc} · {issue.authority} · Civic Score: <span style={{ color: sm.color }}>{issue.civicScore}</span></div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, fontSize: 20, cursor: "pointer", alignSelf: "flex-start" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
            {["overview", "timeline", "ai-intel", "evidence"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab === t ? `${sm.color}22` : "transparent", border: `1px solid ${tab === t ? sm.color : C.border}`,
                borderRadius: 20, padding: "5px 14px", fontSize: 11, color: tab === t ? sm.color : C.textSub,
                cursor: "pointer", fontWeight: tab === t ? 700 : 400, fontFamily: FONT
              }}>
                {t === "ai-intel" ? "🤖 AI Intel" : t === "timeline" ? "📅 Timeline" : "📊 Overview"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 22px" }}>
          {tab === "overview" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { l: "Upvotes", v: fmt(issue.votes), c: C.teal },
                  { l: "Duplicates", v: issue.reports, c: C.purple },
                  { l: "Social Reach", v: fmt(issue.social), c: C.blue },
                  { l: "Daily Trend", v: `+${fmt(issue.trend)}`, c: C.green },
                ].map(m => (
                  <div key={m.l} style={{ background: C.bg2, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>{m.l}</div>
                  </div>
                ))}
              </div>
              
              {/* Weighted Progress Bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.textDim, fontWeight: 700, letterSpacing: 1 }}>RESOLUTION PROGRESS</span>
                  <span style={{ fontSize: 14, color: sm.color, fontWeight: 700 }}>{score}%</span>
                </div>
                <ProgressBar value={score} color={sm.color} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                  {breakdown.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: step.done ? C.text : C.textDim }}>
                      <span style={{ color: step.done ? C.green : C.border }}>{step.done ? "✔" : "○"}</span>
                      {step.label}
                    </div>
                  ))}
                </div>
              </div>

              <SLATimer sla={issue.sla} done={issue.slaDone} label="SLA HEALTH (TIME PRESSURE)" />
              
              <div style={{ marginTop: 14, background: `${C.teal}0a`, border: `1px solid ${C.teal}22`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, color: C.teal, letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>AI INSIGHT</div>
                <div style={{ fontSize: 13, color: C.textSub }}>{issue.aiInsight}</div>
              </div>
            </div>
          )}

          {tab === "timeline" && (
            <div>
              <div style={{ fontSize: 12, color: C.textSub, marginBottom: 16 }}>Live resolution steps — visible to all citizens 🔍</div>
              {timeline.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: item.done ? C.green : C.bg2, border: `2px solid ${item.done ? C.green : C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                      boxShadow: item.done ? `0 0 12px ${C.green}44` : "none", color: item.done ? "#000" : C.textDim
                    }}>
                      {item.done ? "✓" : i + 1}
                    </div>
                    {i < timeline.length - 1 && <div style={{ width: 2, flex: 1, background: item.done ? `${C.green}44` : C.border, minHeight: 24, margin: "4px 0" }} />}
                  </div>
                  <div style={{ paddingBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: item.done ? C.text : C.textDim, fontFamily: FONT_DISPLAY }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: item.done ? C.green : C.textDim, marginTop: 2 }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "ai-intel" && (
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {["Predict resolution time and bottlenecks", "List similar resolved cases for precedent", "Draft public notice for nearby residents", "Estimate total community impact and losses"].map(q => (
                  <button key={q} onClick={() => askAI(q)} style={{
                    background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 12px",
                    fontSize: 11, color: C.textSub, cursor: "pointer", fontFamily: FONT, transition: "all 0.15s"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.color = C.teal; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSub; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
              {aiLoading && <div style={{ textAlign: "center", padding: 32, color: C.teal }}><div style={{ fontSize: 22, animation: "spin 1s linear infinite", display: "inline-block" }}>⚙</div><div style={{ fontSize: 12, marginTop: 8 }}>Analyzing...</div></div>}
              {aiText && !aiLoading && <div style={{ background: `${C.teal}0a`, border: `1px solid ${C.teal}22`, borderRadius: 10, padding: 14, fontSize: 13, color: C.textSub, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiText}</div>}
              {!aiText && !aiLoading && <div style={{ textAlign: "center", padding: 32, color: C.textDim, fontSize: 13 }}>Select a question above to get AI-powered analysis</div>}
            </div>
          )}

          {tab === "evidence" && (
            <EvidencePanel evidence={issue.evidence || []} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REAL-TIME SIMULATION ENGINE
═══════════════════════════════════════════════════════════ */
const SIM_TITLES = ["Streetlight flickering", "Garbage pileup", "Water leakage", "Illegal parking", "Broken footpath", "Traffic signal dead", "Open drain danger"];
const SIM_LOCS = ["HSR Layout", "BTM Layout", "Electronic City", "Marathahalli", "Bellandur", "Malleshwaram", "Rajajinagar"];

const useSocialIntelligencePipeline = (enabled, setIssues, addToast) => {
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      // Simulate Multi-Agent Processing
      setIssues(prev => prev.map(issue => {
        if (Math.random() > 0.1) return issue; // Only update 10% of issues per tick
        
        // 1. Scraper Agent finds new mentions
        const socialData = SocialScraperAgent.scan(issue.cat, issue.ward);
        
        // 2. NLP Agent updates severity based on text sentiment
        const newSeverity = Math.min(10, issue.severity + (socialData.sentiment_score > 0.2 ? -0.1 : 0.1));
        
        // 3. Media Agent finds new evidence (simulated)
        const newEvidence = Math.random() > 0.8 ? [...(issue.evidence || []), ...GENERATE_EVIDENCE(1)] : issue.evidence;

        return { 
          ...issue, 
          social: issue.social + socialData.mentions,
          severity: parseFloat(newSeverity.toFixed(1)),
          evidence: newEvidence,
          aiInsight: `Social Intelligence: Spike in ${socialData.hashtags[0]} mentions. Bot activity ${socialData.bot_activity_index > 0.1 ? "detected" : "low"}.`
        };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, [enabled, setIssues]);
};

const useCivicSimulation = (enabled, setIssues, addToast) => {
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const r = Math.random();
      
      // 1. Live Engagement (Frequent)
      if (r < 0.4) {
        setIssues(prev => {
          const idx = Math.floor(Math.random() * prev.length);
          const item = prev[idx];
          if (!item || item.status === "Resolved") return prev;
          
          const newVotes = item.votes + Math.floor(Math.random() * 5);
          const newSocial = item.social + Math.floor(Math.random() * 20);
          const newScore = CIVICSCORE({ ...item, votes: newVotes, social: newSocial });
          
          const updated = [...prev];
          updated[idx] = { ...item, votes: newVotes, social: newSocial, civicScore: newScore, trend: item.trend + 1 };
          return updated;
        });
      }

      // 2. New Incident Report (Occasional)
      else if (r > 0.94) {
        const title = SIM_TITLES[Math.floor(Math.random() * SIM_TITLES.length)];
        const loc = SIM_LOCS[Math.floor(Math.random() * SIM_LOCS.length)];
        const cats = ["Road", "Water", "Electricity", "Sanitation"];
        const cat = cats[Math.floor(Math.random() * cats.length)];
        
        const newIssue = {
          id: Date.now(), title: `${title} near ${loc}`, cat, loc, ward: loc,
          votes: 1, severity: 5 + Math.random() * 4, status: "Pending", progress: 0,
          reports: 1, social: 0, hashtag: `#${loc.replace(/\s/g,"")}${cat}`, authority: "BBMP",
          sla: 24, slaDone: 0, timeMs: Date.now(), recurrence: 0, lat: 12.9, lng: 77.6,
          aiInsight: "Analyzing incoming report...", trend: 100, manpower: 2, estHours: 24,
          civicScore: 50
        };
        newIssue.civicScore = CIVICSCORE(newIssue);
        
        setIssues(prev => [newIssue, ...prev]);
        addToast("New Incident Reported", `${title} in ${loc}`, "info");
      }
    }, 1500); // Run every 1.5s
    return () => clearInterval(interval);
  }, [enabled, setIssues, addToast]);
};

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [section, setSection] = useState("citizen");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [issues, setIssues] = useState(ISSUES);
  const [simEnabled, setSimEnabled] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((title, msg, type="info") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, title, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  }, []);

  useCivicSimulation(simEnabled, setIssues, addToast);
  useSocialIntelligencePipeline(simEnabled, setIssues, addToast);

  const handleReport = (form, aiScore) => {
    const newIssue = {
      id: Date.now(), title: form.title, cat: aiScore?.category || form.cat,
      loc: form.loc, ward: form.ward || "Bengaluru", votes: 1,
      severity: aiScore?.severity || 5, status: "Pending", progress: 0, reports: 1,
      social: 0, hashtag: aiScore?.hashtag || "#CivicIssue", authority: aiScore?.authority || "BBMP",
      sla: 24, slaDone: 0, timeMs: Date.now(), recurrence: 0, lat: 12.97, lng: 77.59,
      aiInsight: aiScore?.insight || "Pending AI review", trend: 1, manpower: aiScore?.manpower || 2, estHours: 24,
      civicScore: aiScore?.civicScore || 30
    };
    setIssues(prev => [newIssue, ...prev]);
    addToast("Report Submitted", "Issue added to the public ledger.", "info");
  };

  const navItems = [
    { id: "citizen", label: "CITIZEN PORTAL", icon: "🏙" },
    { id: "authority", label: "AUTHORITY DASHBOARD", icon: "🏛" },
    { id: "analytics", label: "ANALYTICS CENTER", icon: "📊" },
  ];

  return (
    <div style={{ 
      background: C.bg0, 
      height: "100vh", 
      width: "100vw", 
      display: "flex", 
      flexDirection: "column", 
      fontFamily: FONT, 
      color: C.text,
      overflow: "hidden" 
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=IBM+Plex+Sans+Condensed:wght@700;900&display=swap');
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 currentColor} 70%{box-shadow:0 0 0 6px transparent} 100%{box-shadow:0 0 0 0 transparent} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        
        html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; background: ${C.bg0}; }
        * { box-sizing: border-box; outline: none; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg0}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.borderHi}; }
        
        input, textarea, select, button { font-family: inherit; }
        .fadeUp { animation: fadeUp 0.4s ease both; }
        
        .nav-item {
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        .nav-item:hover {
          background: ${C.bg2};
        }
        .nav-item.active {
          background: ${C.bg2};
          border-left-color: ${C.teal};
          color: ${C.teal};
        }
      `}</style>

      {/* Top Nav */}
      <header style={{
        height: 60,
        background: C.bg1,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
        zIndex: 50
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18, padding: 4 }}>
            ☰
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.teal}, ${C.blue})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#000", fontWeight: 900, flexShrink: 0
            }}>⚡</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.white, fontFamily: FONT_DISPLAY, lineHeight: 1 }}>CIVICA</div>
              <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 2 }}>INTELLIGENCE OS</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setSimEnabled(!simEnabled)} style={{
            background: simEnabled ? `${C.green}22` : C.bg2, border: `1px solid ${simEnabled ? C.green : C.border}`,
            borderRadius: 20, padding: "6px 12px", fontSize: 10, fontWeight: 700, color: simEnabled ? C.green : C.textDim,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6
          }}>
            <span style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: simEnabled ? C.green : C.textDim, boxShadow: simEnabled ? `0 0 8px ${C.green}` : "none" }} />
            {simEnabled ? "LIVE FEED ON" : "FEED PAUSED"}
          </button>
          <div style={{ width: 1, height: 24, background: C.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: C.textDim }}>
            <PulsingAlert color={C.green} />
            <span style={{ color: C.green }}>LIVE</span>
            <span>Bengaluru</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Sidebar */}
        <aside style={{
          width: sidebarOpen ? 240 : 64,
          background: C.bg1,
          borderRight: `1px solid ${C.border}`,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0
        }}>
          <div style={{ flex: 1, padding: "16px 0" }}>
            {navItems.map(n => (
              <button key={n.id} onClick={() => setSection(n.id)} 
                className={`nav-item ${section === n.id ? "active" : ""}`}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  background: "none",
                  border: "none",
                  borderLeft: `3px solid ${section === n.id ? C.teal : "transparent"}`,
                  color: section === n.id ? C.teal : C.textSub,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                  height: 48
                }}
              >
                <span style={{ fontSize: 18, minWidth: 24, textAlign: "center" }}>{n.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.2s", fontFamily: FONT_DISPLAY, letterSpacing: 1 }}>
                  {n.label}
                </span>
              </button>
            ))}
          </div>
          
          <div style={{ padding: 16, borderTop: `1px solid ${C.border}` }}>
             <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: sidebarOpen ? 1 : 0, transition: "opacity 0.2s" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.bg3, border: `1px solid ${C.border}` }} />
                <div style={{ overflow: "hidden" }}>
                   <div style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>Admin User</div>
                   <div style={{ fontSize: 10, color: C.textDim, whiteSpace: "nowrap" }}>Level 4 Access</div>
                </div>
             </div>
          </div>
        </aside>

        {/* Content Area */}
        <main style={{ 
          flex: 1, 
          overflowY: "auto", 
          position: "relative",
          background: `
            radial-gradient(circle at 50% 0%, ${C.blueDim} 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, ${C.purpleDim} 0%, transparent 30%)
          `
        }}>
          {/* Grid Overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: `linear-gradient(${C.border}22 1px, transparent 1px), linear-gradient(90deg, ${C.border}22 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)"
          }} />

          <div style={{ position: "relative", zIndex: 1, padding: "32px", minHeight: "100%" }}>
             {section === "citizen" && <CitizenPortal issues={issues} onReport={handleReport} />}
             {section === "authority" && <AuthorityDashboard issues={issues} />}
             {section === "analytics" && <AnalyticsCenter issues={issues} />}
          </div>
        </main>
      </div>
      
      <ToastContainer toasts={toasts} />
    </div>
  );
}
