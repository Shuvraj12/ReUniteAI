// ============================================================
// TRACE — Fully Wired Frontend
// All pages connected to FastAPI backend via API hooks
// ============================================================

import { useState, useEffect } from "react";
import { authAPI, getUser, getToken, casesAPI } from "./api/client";
import {
  useCases, useCreateCase, useFaceSearch,
  useAlerts, useAnalytics
} from "./hooks/useAPI";

// ─── THEME ────────────────────────────────────────────────────────────────────
const t = {
  navy: "#0A1628", navyLight: "#112240", navyMid: "#0D1F3C",
  blue: "#1A6BCC", blueLight: "#2D8EFF",
  gold: "#F5A623", red: "#E63946", green: "#2ECC71",
  white: "#F0F4FF", gray: "#8899BB", grayLight: "#C5D0E8",
  border: "#1E3A5F",
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0A1628; color: #F0F4FF; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #1A6BCC; border-radius: 2px; }
  input, select, textarea { color-scheme: dark; }
  input::placeholder, textarea::placeholder { color: #8899BB; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:.4; } }
  @keyframes spin   { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes glow   { 0%,100% { box-shadow:0 0 20px rgba(26,107,204,.3); } 50% { box-shadow:0 0 40px rgba(26,107,204,.6); } }
`;

// ─── TINY HELPERS ─────────────────────────────────────────────────────────────
const Icon = ({ n, size = 18, color = "currentColor" }) => {
  const d = {
    home:        <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    search:      <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    users:       <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    bell:        <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    chart:       <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    shield:      <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    upload:      <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></>,
    camera:      <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
    plus:        <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    lock:        <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    logout:      <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    check:       <><polyline points="20 6 9 17 4 12"/></>,
    x:           <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    activity:    <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    file:        <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    fingerprint: <><path d="M12 10a2 2 0 00-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0118-6"/><path d="M2 17.5c3.91-2.4 6.5-7.5 6.5-7.5s.5 3.5 3.5 3.5c2.28 0 2.93-1.5 3.5-2"/><path d="M14 21.5c1.44-1.44 3.07-4.47 3-7.5"/></>,
    alert:       <><polygon points="10.29 3.86 1.82 18 22.18 18 13.71 3.86 10.29 3.86"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    refresh:     <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d[n]}
    </svg>
  );
};

const Avatar = ({ name = "?", size = 38 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#1A6BCC","#E63946","#F5A623","#2ECC71","#9B59B6","#E67E22"];
  const c = colors[name.charCodeAt(0) % colors.length];
  return <div style={{ width: size, height: size, borderRadius: "50%", background: `${c}28`, border: `2px solid ${c}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 700, color: c, fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>{initials}</div>;
};

const StatusBadge = ({ status }) => {
  const m = { active: [t.red, "Active"], matched: [t.gold, "Matched"], reunited: [t.green, "Reunited"], closed: [t.gray, "Closed"] };
  const [color, label] = m[status] || [t.gray, status];
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, background:`${color}18`, color, fontSize:11, fontWeight:600, fontFamily:"'Syne',sans-serif" }}><span style={{ width:6, height:6, borderRadius:"50%", background:color, animation: status==="active"?"pulse 1.5s infinite":"none" }}/>{label}</span>;
};

const Spinner = ({ size = 20 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${t.border}`, borderTopColor: t.blueLight, animation: "spin .8s linear infinite", flexShrink: 0 }} />
);

const ErrorBanner = ({ msg, onDismiss }) => msg ? (
  <div style={{ padding:"12px 16px", borderRadius:10, background:"rgba(230,57,70,.1)", border:`1px solid ${t.red}44`, color:t.red, fontSize:13, display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
    <span>⚠ {msg}</span>
    {onDismiss && <button onClick={onDismiss} style={{ background:"none", border:"none", color:t.red, cursor:"pointer" }}><Icon n="x" size={14}/></button>}
  </div>
) : null;

const Btn = ({ children, onClick, variant="primary", loading: ld, disabled, style: s = {} }) => {
  const base = { padding:"11px 22px", borderRadius:10, fontSize:14, fontWeight:600, cursor: disabled||ld?"not-allowed":"pointer", fontFamily:"'Syne',sans-serif", display:"inline-flex", alignItems:"center", gap:8, transition:"all .15s", opacity: disabled||ld ? 0.6 : 1, border:"none" };
  const variants = {
    primary: { background:`linear-gradient(135deg,${t.blue},${t.blueLight})`, color:"#fff" },
    secondary: { background:"transparent", border:`1px solid ${t.border}`, color:t.gray },
    ghost: { background:"none", border:"none", color:t.blueLight, padding:"8px 12px" },
    danger: { background:`rgba(230,57,70,.15)`, border:`1px solid ${t.red}44`, color:t.red },
  };
  return <button onClick={!disabled&&!ld?onClick:undefined} style={{ ...base, ...variants[variant], ...s }}>{ld && <Spinner size={14}/>}{children}</button>;
};

// ─── API-WIRED: LOGIN ─────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [role,  setRole]  = useState("police");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");
  const [ld,    setLd]    = useState(false);

  // Demo login - bypasses backend
  const handleDemoLogin = (demoRole) => {
    const demos = {
      police: { id: "demo-001", name: "Demo Officer", role: "police" },
      family: { id: "demo-002", name: "Demo Family",  role: "family" },
    };
    const u = demos[demoRole];
    localStorage.setItem("trace_token", "demo-token");
    localStorage.setItem("trace_user", JSON.stringify(u));
    onLogin({ user_id: u.id, full_name: u.name, role: u.role });
  };

  const handleLogin = async () => {
    if (!email || !pass) return setErr("Please enter email and password.");
    setLd(true); setErr("");
    try {
      const data = await authAPI.login(email, pass);
      onLogin(data);
    } catch (e) {
      setErr(e.message || "Login failed. Check your credentials.");
    } finally { setLd(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:t.navy, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${t.blue}08 1px,transparent 1px),linear-gradient(90deg,${t.blue}08 1px,transparent 1px)`, backgroundSize:"40px 40px" }}/>
      <div style={{ position:"relative", width:420, animation:"fadeUp .5s ease" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:`linear-gradient(135deg,${t.blue},${t.blueLight})`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", animation:"glow 3s ease-in-out infinite" }}>
            <Icon n="fingerprint" size={28} color="#fff"/>
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:t.white, letterSpacing:"-1px" }}>TRACE</h1>
          <p style={{ color:t.gray, fontSize:13, marginTop:4, letterSpacing:"2px" }}>FIND · MATCH · REUNITE</p>
        </div>
        <div style={{ background:t.navyLight, border:`1px solid ${t.border}`, borderRadius:20, padding:32 }}>
          <div style={{ display:"flex", gap:6, marginBottom:22, background:t.navyMid, borderRadius:10, padding:4 }}>
            {[["police","Police Authority"],["family","Family Member"]].map(([id,lbl]) => (
              <button key={id} onClick={() => setRole(id)} style={{ flex:1, padding:9, borderRadius:8, border:"none", background: role===id ? `linear-gradient(135deg,${t.blue},${t.blueLight})` : "transparent", color: role===id ? "#fff" : t.gray, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Syne',sans-serif", transition:"all .2s" }}>{lbl}</button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <ErrorBanner msg={err} onDismiss={() => setErr("")}/>
            {[["Email / Badge ID","email","text", role==="police"?"badge@police.gov.in":"your@email.com"],["Password","pass","password","••••••••"]].map(([lbl,key,type,ph]) => (
              <div key={key}>
                <label style={{ fontSize:11, color:t.gray, fontFamily:"'Syne',sans-serif", textTransform:"uppercase", letterSpacing:".5px", display:"block", marginBottom:6 }}>{lbl}</label>
                <input type={type} value={key==="email"?email:pass} onChange={e => key==="email"?setEmail(e.target.value):setPass(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} placeholder={ph} style={{ width:"100%", padding:"11px 14px", borderRadius:10, background:t.navyMid, border:`1px solid ${t.border}`, color:t.white, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none" }}/>
              </div>
            ))}
            <Btn onClick={handleLogin} loading={ld} style={{ width:"100%", justifyContent:"center", marginTop:4 }}>
              Sign In Securely
            </Btn>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:18, padding:12, borderRadius:10, background:`rgba(26,107,204,.06)`, border:`1px solid ${t.blue}22` }}>
            <Icon n="lock" size={13} color={t.blueLight}/>
            <span style={{ fontSize:11, color:t.gray }}>256-bit encrypted · Role-based access · Audit logged</span>
          </div>
        </div>
        {/* Demo login buttons */}
        <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:8 }}>
          <p style={{ textAlign:"center", fontSize:11, color:t.gray, letterSpacing:"1px", textTransform:"uppercase" }}>— Or try demo access —</p>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => handleDemoLogin("police")} style={{ flex:1, padding:"10px", borderRadius:10, border:"1px solid "+t.blue+"44", background:"rgba(26,107,204,.1)", color:t.blueLight, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
              🚔 Demo Police Login
            </button>
            <button onClick={() => handleDemoLogin("family")} style={{ flex:1, padding:"10px", borderRadius:10, border:"1px solid "+t.gold+"44", background:"rgba(245,166,35,.1)", color:t.gold, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Syne',sans-serif" }}>
              👨‍👩‍👧 Demo Family Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, role, user, onLogout, unreadCount }) {
  const nav = [
    { id:"dashboard", n:"home",        label:"Dashboard" },
    { id:"cases",     n:"users",       label:"Missing Persons" },
    { id:"search",    n:"camera",      label:"Face Search" },
    { id:"report",    n:"plus",        label:"File Report" },
    { id:"alerts",    n:"bell",        label:"Alerts", badge: unreadCount },
    ...(role==="police"||role==="admin" ? [{ id:"analytics", n:"chart", label:"Analytics" }] : []),
  ];
  return (
    <aside style={{ width:238, background:t.navyLight, borderRight:`1px solid ${t.border}`, display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0, flexShrink:0 }}>
      <div style={{ padding:"26px 22px 18px", borderBottom:`1px solid ${t.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${t.blue},${t.blueLight})`, display:"flex", alignItems:"center", justifyContent:"center", animation:"glow 3s ease-in-out infinite" }}>
            <Icon n="fingerprint" size={18} color="#fff"/>
          </div>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:14, color:t.white }}>TRACE</div>
            <div style={{ fontSize:10, color:t.gray, letterSpacing:"1.5px" }}>FIND · MATCH · REUNITE</div>
          </div>
        </div>
      </div>
      <div style={{ padding:"10px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:8, background: role==="police"||role==="admin" ? `rgba(26,107,204,.15)` : `rgba(245,166,35,.12)`, border:`1px solid ${role==="police"||role==="admin" ? t.blue+"44" : t.gold+"44"}` }}>
          <Icon n="shield" size={13} color={role==="police"||role==="admin" ? t.blueLight : t.gold}/>
          <span style={{ fontSize:10, fontWeight:600, color:role==="police"||role==="admin"?t.blueLight:t.gold, fontFamily:"'Syne',sans-serif", letterSpacing:".5px" }}>{role==="police"?"POLICE AUTHORITY":role==="admin"?"ADMINISTRATOR":"FAMILY ACCESS"}</span>
        </div>
      </div>
      <nav style={{ flex:1, padding:"6px 10px", display:"flex", flexDirection:"column", gap:2 }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{ display:"flex", alignItems:"center", gap:11, padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer", background: page===item.id ? `linear-gradient(90deg,${t.blue}22,${t.blue}11)` : "transparent", color: page===item.id ? t.blueLight : t.gray, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight: page===item.id?500:400, transition:"all .2s", textAlign:"left", borderLeft: page===item.id?`3px solid ${t.blue}`:"3px solid transparent" }}>
            <Icon n={item.n} size={15} color={page===item.id?t.blueLight:t.gray}/>
            {item.label}
            {item.badge > 0 && <span style={{ marginLeft:"auto", background:t.red, color:"#fff", fontSize:10, fontWeight:700, borderRadius:10, padding:"1px 6px" }}>{item.badge}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding:"14px 20px", borderBottom:`1px solid ${t.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Avatar name={user?.name || "User"} size={32}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:500, color:t.white, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.name}</div>
            <div style={{ fontSize:11, color:t.gray, textTransform:"capitalize" }}>{user?.role}</div>
          </div>
          <button onClick={onLogout} style={{ background:"none", border:"none", cursor:"pointer", color:t.gray, padding:4 }} title="Logout"><Icon n="logout" size={15}/></button>
        </div>
      </div>
    </aside>
  );
}

// ─── API-WIRED: DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ setPage }) {
  const { data: casesData, loading: cLd } = useCases({ size: 5 });
  const { alerts, loading: aLd }          = useAlerts();

  const cases = casesData?.cases || [];
  const total    = casesData?.total || 0;
  const active   = cases.filter(c => c.status === "active").length;
  const matched  = cases.filter(c => c.status === "matched").length;
  const reunited = cases.filter(c => c.status === "reunited").length;

  const StatCard = ({ label, value, icon, color, sub }) => (
    <div style={{ background:t.navyLight, border:`1px solid ${t.border}`, borderRadius:16, padding:"20px 22px", animation:"fadeUp .4s ease both" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
        <span style={{ fontSize:13, color:t.gray }}>{label}</span>
        <div style={{ width:34, height:34, borderRadius:10, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon n={icon} size={15} color={color}/></div>
      </div>
      {cLd ? <Spinner/> : <div style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:t.white, letterSpacing:"-1px" }}>{value}</div>}
      {sub && <div style={{ fontSize:12, color:t.gray, marginTop:4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding:"24px 30px", display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        <StatCard label="Total Cases"     value={total}    icon="users"       color={t.blueLight} sub="All reported cases"/>
        <StatCard label="Active Searches" value={active}   icon="search"      color={t.red}       sub="Under investigation"/>
        <StatCard label="AI Matches"      value={matched}  icon="activity"    color={t.gold}      sub="Detected by AI"/>
        <StatCard label="Reunited"        value={reunited} icon="check"       color={t.green}     sub="Successful reunifications"/>
        <StatCard label="Alerts Today"    value={alerts.filter(a=>!a.is_read).length} icon="bell" color={t.gold} sub="Unread notifications"/>
        <StatCard label="AI Model"        value="v3.2"     icon="fingerprint" color={t.blueLight} sub="FaceNet512 + ArcFace"/>
      </div>

      {/* Live Alerts */}
      <div style={{ background:t.navyLight, border:`1px solid ${t.border}`, borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 22px", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:t.white }}>Live Alerts</span>
          <button onClick={() => setPage("alerts")} style={{ fontSize:12, color:t.blueLight, background:"none", border:"none", cursor:"pointer" }}>View all →</button>
        </div>
        {aLd ? <div style={{ padding:24 }}><Spinner/></div> : alerts.slice(0, 3).map(a => (
          <div key={a.id} style={{ padding:"13px 22px", borderBottom:`1px solid ${t.border}22`, display:"flex", gap:12, alignItems:"flex-start", background:!a.is_read?"rgba(26,107,204,.04)":"transparent" }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background: a.type==="match"?"rgba(245,166,35,.15)":a.type==="reunited"?"rgba(46,204,113,.15)":"rgba(230,57,70,.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon n={a.type==="match"?"activity":a.type==="reunited"?"check":"bell"} size={13} color={a.type==="match"?t.gold:a.type==="reunited"?t.green:t.red}/>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, color:t.white, lineHeight:1.5 }}>{a.message}</p>
              <span style={{ fontSize:11, color:t.gray }}>{new Date(a.created_at).toLocaleString()}</span>
            </div>
            {!a.is_read && <div style={{ width:8, height:8, borderRadius:"50%", background:t.blueLight, flexShrink:0, marginTop:4 }}/>}
          </div>
        ))}
      </div>

      {/* Recent cases */}
      <div style={{ background:t.navyLight, border:`1px solid ${t.border}`, borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 22px", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:t.white }}>Recent Cases</span>
          <button onClick={() => setPage("cases")} style={{ fontSize:12, color:t.blueLight, background:"none", border:"none", cursor:"pointer" }}>View all →</button>
        </div>
        {cLd ? <div style={{ padding:24 }}><Spinner/></div> : cases.map(c => (
          <div key={c.id} style={{ padding:"13px 22px", borderBottom:`1px solid ${t.border}22`, display:"flex", gap:12, alignItems:"center" }}>
            <Avatar name={c.full_name} size={38}/>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:500, fontSize:14, color:t.white }}>{c.full_name}</div>
              <div style={{ fontSize:12, color:t.gray }}>{c.age}y • {c.gender} • {c.last_seen_location}</div>
            </div>
            <StatusBadge status={c.status}/>
            <div style={{ fontSize:11, color:t.gray, textAlign:"right" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", color:t.blueLight }}>{c.case_number}</div>
              <div>{c.date_missing}</div>
            </div>
          </div>
        ))}
        {!cLd && cases.length === 0 && <div style={{ padding:32, textAlign:"center", color:t.gray }}>No cases yet. File the first report!</div>}
      </div>
    </div>
  );
}

// ─── API-WIRED: CASES ─────────────────────────────────────────────────────────
function Cases() {
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [applied, setApplied] = useState({});
  const { data, loading, error, execute } = useCases(applied);
  const cases = data?.cases || [];

  const applyFilters = () => setApplied({ ...filters });

  return (
    <div style={{ padding:"24px 30px", display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ flex:1, minWidth:220, display:"flex", alignItems:"center", gap:8, background:t.navyLight, border:`1px solid ${t.border}`, borderRadius:10, padding:"9px 13px" }}>
          <Icon n="search" size={15} color={t.gray}/>
          <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search:e.target.value }))} onKeyDown={e => e.key==="Enter" && applyFilters()} placeholder="Search name, case ID, location…" style={{ background:"none", border:"none", outline:"none", color:t.white, fontSize:14, flex:1, fontFamily:"'DM Sans',sans-serif" }}/>
        </div>
        {["","active","matched","reunited"].map(s => (
          <button key={s} onClick={() => { setFilters(f=>({...f,status:s})); setApplied(a=>({...a,status:s})); }} style={{ padding:"9px 16px", borderRadius:10, border:`1px solid ${filters.status===s?t.blue:t.border}`, background: filters.status===s?`${t.blue}22`:"transparent", color: filters.status===s?t.blueLight:t.gray, fontSize:13, cursor:"pointer", fontFamily:"'Syne',sans-serif", textTransform:"capitalize" }}>{s||"All"}</button>
        ))}
        <Btn onClick={execute} variant="secondary"><Icon n="refresh" size={14}/>Refresh</Btn>
      </div>

      <ErrorBanner msg={error}/>

      <div style={{ background:t.navyLight, border:`1px solid ${t.border}`, borderRadius:16, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr .8fr 1.2fr .9fr .9fr", padding:"11px 22px", borderBottom:`1px solid ${t.border}`, gap:8 }}>
          {["Person","Case ID","Age/Gender","Location","Missing Since","Status"].map(h => (
            <span key={h} style={{ fontSize:10, fontWeight:600, color:t.gray, letterSpacing:".8px", fontFamily:"'Syne',sans-serif", textTransform:"uppercase" }}>{h}</span>
          ))}
        </div>
        {loading && <div style={{ padding:32, display:"flex", justifyContent:"center" }}><Spinner size={28}/></div>}
        {!loading && cases.map((c, i) => (
          <div key={c.id} style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr .8fr 1.2fr .9fr .9fr", padding:"14px 22px", borderBottom:`1px solid ${t.border}22`, gap:8, alignItems:"center", animation:`fadeUp .3s ease ${i*.04}s both`, cursor:"pointer", transition:"background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(26,107,204,.05)"}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}
          >
            <div style={{ display:"flex", alignItems:"center", gap:10 }}><Avatar name={c.full_name} size={34}/><span style={{ fontWeight:500, fontSize:14, color:t.white }}>{c.full_name}</span></div>
            <span style={{ fontSize:12, color:t.blueLight, fontFamily:"'Syne',sans-serif" }}>{c.case_number}</span>
            <span style={{ fontSize:13, color:t.grayLight }}>{c.age}y / {c.gender}</span>
            <span style={{ fontSize:13, color:t.grayLight }}>{c.last_seen_location}</span>
            <span style={{ fontSize:13, color:t.grayLight }}>{c.date_missing}</span>
            <StatusBadge status={c.status}/>
          </div>
        ))}
        {!loading && cases.length===0 && <div style={{ padding:40, textAlign:"center", color:t.gray }}>No cases match your filters.</div>}
      </div>
      {data && <div style={{ fontSize:12, color:t.gray }}>Showing {cases.length} of {data.total} total cases</div>}
    </div>
  );
}

// ─── API-WIRED: FACE SEARCH ───────────────────────────────────────────────────
function FaceSearch() {
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const { search, results, loading, error, progress, reset } = useFaceSearch();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    reset();
  };

  const handleSearch = async () => {
    if (!file) return;
    await search(file).catch(() => {});
  };

  const stage = loading ? "scanning" : results ? "results" : "upload";

  return (
    <div style={{ padding:"24px 30px", display:"flex", flexDirection:"column", gap:20 }}>
      {stage === "upload" && (
        <>
          <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}} style={{ border:`2px dashed ${dragOver?t.blueLight:t.border}`, borderRadius:20, padding:"52px 40px", textAlign:"center", background: dragOver?"rgba(26,107,204,.06)":"transparent", transition:"all .3s", cursor:"pointer" }} onClick={() => document.getElementById("face-input").click()}>
            <input id="face-input" type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])}/>
            {preview ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                <img src={preview} alt="preview" style={{ width:140, height:140, borderRadius:12, objectFit:"cover", border:`2px solid ${t.blue}` }}/>
                <p style={{ color:t.green, fontSize:14, fontWeight:500 }}>✓ {file.name} — ready to scan</p>
              </div>
            ) : (
              <>
                <div style={{ width:68, height:68, borderRadius:"50%", background:`rgba(26,107,204,.12)`, border:`2px solid ${t.blue}44`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}><Icon n="camera" size={30} color={t.blueLight}/></div>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:t.white, marginBottom:8 }}>Upload Photo for AI Face Search</h3>
                <p style={{ color:t.gray, fontSize:13, maxWidth:380, margin:"0 auto" }}>Drag & drop or click to upload. Our FaceNet512 model scans {">"}1,000 case embeddings instantly.</p>
              </>
            )}
          </div>
          {preview && <div style={{ display:"flex", gap:10 }}><Btn onClick={handleSearch}>Run Face Search</Btn><Btn variant="secondary" onClick={()=>{setFile(null);setPreview(null);}}>Clear</Btn></div>}
          <ErrorBanner msg={error}/>
          <div style={{ background:`rgba(26,107,204,.06)`, border:`1px solid ${t.blue}33`, borderRadius:12, padding:"14px 18px", display:"flex", gap:10 }}>
            <Icon n="shield" size={16} color={t.blueLight}/>
            <div><div style={{ fontSize:13, fontWeight:500, color:t.blueLight }}>FaceNet512 Deep Learning Engine</div><div style={{ fontSize:12, color:t.gray, marginTop:2 }}>512-dim embeddings · Cosine similarity · Works with partial faces, lighting variations, minor appearance changes.</div></div>
          </div>
        </>
      )}

      {stage === "scanning" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"60px 20px", gap:28 }}>
          <div style={{ position:"relative", width:150, height:150 }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`3px solid ${t.blue}22` }}/>
            <div style={{ position:"absolute", inset:8, borderRadius:"50%", border:`3px solid ${t.blue}44` }}/>
            <div style={{ position:"absolute", inset:16, borderRadius:"50%", border:`3px solid ${t.blueLight}`, borderTopColor:"transparent", animation:"spin 1s linear infinite" }}/>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <Icon n="fingerprint" size={30} color={t.blueLight}/>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:20, color:t.white, marginTop:4 }}>{Math.round(progress)}%</div>
            </div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, color:t.white }}>Scanning Face Database</div>
            <div style={{ color:t.gray, fontSize:13, marginTop:6 }}>{progress<30?"Extracting facial embeddings…":progress<60?"Computing similarity scores…":progress<85?"Cross-referencing database…":"Finalizing results…"}</div>
          </div>
          <div style={{ width:"100%", maxWidth:380, height:5, background:t.navyLight, borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${t.blue},${t.blueLight})`, borderRadius:3, transition:"width .1s linear" }}/>
          </div>
        </div>
      )}

      {stage === "results" && results && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ background:"rgba(46,204,113,.08)", border:`1px solid ${t.green}44`, borderRadius:12, padding:"14px 18px", display:"flex", gap:10, alignItems:"center" }}>
            <Icon n="check" size={18} color={t.green}/>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:t.green }}>{results.matches.length} Match{results.matches.length!==1?"es":""} Found — Scanned {results.total_scanned} records in {results.scan_time_ms}ms</div>
              <div style={{ fontSize:12, color:t.gray }}>Model: {results.model_used} · Results above 55% similarity threshold</div>
            </div>
            <Btn variant="secondary" style={{ marginLeft:"auto" }} onClick={()=>{reset();setFile(null);setPreview(null);}}>New Search</Btn>
          </div>
          {results.matches.length === 0 && <div style={{ padding:40, textAlign:"center", color:t.gray, background:t.navyLight, borderRadius:16, border:`1px solid ${t.border}` }}>No matches found above the confidence threshold. The person may not be in the database yet.</div>}
          {results.matches.map((m, i) => (
            <div key={m.case_id} style={{ background:t.navyLight, border:`1px solid ${m.confidence==="High"?t.green+"44":m.confidence==="Medium"?t.gold+"44":t.border}`, borderRadius:16, padding:"18px 22px", display:"flex", gap:14, alignItems:"center", animation:`fadeUp .4s ease ${i*.08}s both` }}>
              <Avatar name={m.full_name} size={50}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:t.white }}>{m.full_name}</span>
                  <StatusBadge status={m.status}/>
                </div>
                <div style={{ fontSize:13, color:t.gray }}>{m.age}y • {m.gender} • Missing since {m.date_missing} • {m.last_seen_location}</div>
                <div style={{ fontSize:12, color:t.blueLight, marginTop:3, fontFamily:"'Syne',sans-serif" }}>{m.case_number}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, color: m.confidence==="High"?t.green:m.confidence==="Medium"?t.gold:t.gray }}>{m.similarity}%</div>
                <div style={{ fontSize:11, color:t.gray }}>Similarity</div>
                <div style={{ marginTop:6, padding:"3px 10px", borderRadius:6, background: m.confidence==="High"?`rgba(46,204,113,.15)`:m.confidence==="Medium"?`rgba(245,166,35,.15)`:`rgba(136,153,187,.15)`, color: m.confidence==="High"?t.green:m.confidence==="Medium"?t.gold:t.gray, fontSize:11, fontWeight:600 }}>{m.confidence}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── API-WIRED: REPORT ────────────────────────────────────────────────────────
function Report() {
  const { create, loading, error } = useCreateCase();
  const [form,      setForm]      = useState({ full_name:"", age:"", gender:"Male", date_missing:"", last_seen_location:"", last_seen_state:"", circumstances:"", contact_name:"", contact_phone:"", contact_email:"" });
  const [photoFile, setPhotoFile] = useState(null);
  const [success,   setSuccess]   = useState(null);
  const [formErr,   setFormErr]   = useState("");

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.full_name || !form.age || !form.last_seen_location || !form.date_missing) {
      return setFormErr("Please fill in all required fields (name, age, last seen location, date).");
    }
    setFormErr("");
    try {
      const result = await create({ ...form, age: parseInt(form.age) }, photoFile);
      setSuccess(result);
    } catch {}
  };

  if (success) return (
    <div style={{ padding:"24px 30px", display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:60 }}>
      <div style={{ width:72, height:72, borderRadius:"50%", background:`rgba(46,204,113,.15)`, border:`2px solid ${t.green}`, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon n="check" size={32} color={t.green}/></div>
      <div style={{ textAlign:"center" }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:t.white }}>Report Filed Successfully</h2>
        <p style={{ color:t.gray, marginTop:8 }}>Case <span style={{ color:t.blueLight, fontFamily:"'Syne',sans-serif" }}>{success.case_number}</span> created and assigned to authorities.</p>
        {photoFile && <p style={{ color:t.gray, fontSize:13, marginTop:4 }}>AI facial encoding is being processed. You'll be notified of any matches.</p>}
      </div>
      <Btn onClick={() => { setSuccess(null); setForm({ full_name:"", age:"", gender:"Male", date_missing:"", last_seen_location:"", last_seen_state:"", circumstances:"", contact_name:"", contact_phone:"", contact_email:"" }); setPhotoFile(null); }}>File Another Report</Btn>
    </div>
  );

  const Field = ({ label, k, type="text", placeholder, required, options, span }) => (
    <div style={{ gridColumn: span?"span 2":"span 1", display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:11, fontWeight:600, color:t.gray, letterSpacing:".5px", fontFamily:"'Syne',sans-serif", textTransform:"uppercase" }}>{label}{required&&<span style={{ color:t.red }}> *</span>}</label>
      {options ? (
        <select value={form[k]} onChange={f(k)} style={{ padding:"10px 13px", borderRadius:10, background:t.navyMid, border:`1px solid ${t.border}`, color:t.white, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none" }}>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : type==="textarea" ? (
        <textarea value={form[k]} onChange={f(k)} placeholder={placeholder} rows={3} style={{ padding:"10px 13px", borderRadius:10, background:t.navyMid, border:`1px solid ${t.border}`, color:t.white, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"vertical" }}/>
      ) : (
        <input type={type} value={form[k]} onChange={f(k)} placeholder={placeholder} style={{ padding:"10px 13px", borderRadius:10, background:t.navyMid, border:`1px solid ${t.border}`, color:t.white, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none" }}/>
      )}
    </div>
  );

  return (
    <div style={{ padding:"24px 30px", maxWidth:820 }}>
      <div style={{ background:t.navyLight, border:`1px solid ${t.border}`, borderRadius:20, overflow:"hidden" }}>
        <div style={{ padding:"18px 26px", borderBottom:`1px solid ${t.border}`, background:`rgba(26,107,204,.05)` }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:t.white }}>File Missing Person Report</h2>
          <p style={{ color:t.gray, fontSize:13, marginTop:3 }}>Information is encrypted and shared only with authorized law enforcement.</p>
        </div>
        <div style={{ padding:"26px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <ErrorBanner msg={formErr || error} onDismiss={() => setFormErr("")}/>
          <Field label="Full Name"           k="full_name"         placeholder="As per official records" required/>
          <Field label="Age"                 k="age"               type="number" placeholder="e.g. 24" required/>
          <Field label="Gender"              k="gender"            options={["Male","Female","Other"]}/>
          <Field label="Date Last Seen"      k="date_missing"      type="date" required/>
          <Field label="Last Seen Location"  k="last_seen_location" placeholder="City, Area" required/>
          <Field label="State / Region"      k="last_seen_state"   placeholder="e.g. Maharashtra"/>
          <Field label="Circumstances"       k="circumstances"     type="textarea" placeholder="Describe the situation…" span/>
          <Field label="Contact Person"      k="contact_name"      placeholder="Reporter's name"/>
          <Field label="Contact Phone"       k="contact_phone"     type="tel" placeholder="+91 XXXXX XXXXX"/>
          <Field label="Contact Email"       k="contact_email"     type="email" placeholder="contact@email.com"/>

          {/* Photo upload */}
          <div style={{ gridColumn:"span 2", display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:11, fontWeight:600, color:t.gray, letterSpacing:".5px", fontFamily:"'Syne',sans-serif", textTransform:"uppercase" }}>Recent Photograph</label>
            <div onClick={() => document.getElementById("case-photo").click()} style={{ padding:"22px", border:`2px dashed ${photoFile?t.green:t.border}`, borderRadius:12, textAlign:"center", cursor:"pointer", background: photoFile?`rgba(46,204,113,.06)`:"transparent", transition:"all .2s" }}>
              <input id="case-photo" type="file" accept="image/*" style={{ display:"none" }} onChange={e => setPhotoFile(e.target.files[0])}/>
              {photoFile ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:t.green }}><Icon n="check" size={18} color={t.green}/><span style={{ fontWeight:500 }}>{photoFile.name} — will be AI-encoded on upload</span></div>
                : <div><Icon n="upload" size={22} color={t.gray}/><p style={{ color:t.gray, fontSize:13, marginTop:6 }}>Click to upload a clear, recent photo. Face must be visible for AI matching.</p></div>}
            </div>
          </div>
          <div style={{ gridColumn:"span 2", display:"flex", justifyContent:"flex-end", gap:10, paddingTop:6 }}>
            <Btn variant="secondary">Save Draft</Btn>
            <Btn onClick={handleSubmit} loading={loading}>Submit Report</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── API-WIRED: ALERTS ────────────────────────────────────────────────────────
function Alerts() {
  const { alerts, loading, error, markRead, markAllRead } = useAlerts();

  return (
    <div style={{ padding:"24px 30px", display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn variant="ghost" onClick={markAllRead}>Mark all as read</Btn>
      </div>
      <ErrorBanner msg={error}/>
      {loading && <div style={{ display:"flex", justifyContent:"center", padding:32 }}><Spinner size={28}/></div>}
      {alerts.map((a, i) => (
        <div key={a.id} onClick={() => !a.is_read && markRead(a.id)} style={{ background:t.navyLight, border:`1px solid ${!a.is_read?t.blue+"44":t.border}`, borderRadius:14, padding:"16px 18px", display:"flex", gap:12, alignItems:"flex-start", animation:`fadeUp .3s ease ${i*.06}s both`, cursor:!a.is_read?"pointer":"default", transition:"background .15s" }}
          onMouseEnter={e => !a.is_read && (e.currentTarget.style.background="rgba(26,107,204,.05)")}
          onMouseLeave={e => (e.currentTarget.style.background="transparent")}
        >
          <div style={{ width:38, height:38, borderRadius:"50%", background: a.type==="match"?"rgba(245,166,35,.15)":a.type==="reunited"?"rgba(46,204,113,.15)":"rgba(230,57,70,.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon n={a.type==="match"?"activity":a.type==="reunited"?"check":"bell"} size={16} color={a.type==="match"?t.gold:a.type==="reunited"?t.green:t.red}/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:14, color:t.white, lineHeight:1.5 }}>{a.message}</p>
            {a.similarity_score && <p style={{ fontSize:12, color:t.gold, marginTop:2 }}>Similarity: {a.similarity_score}%</p>}
            <span style={{ fontSize:12, color:t.gray, display:"block", marginTop:4 }}>{new Date(a.created_at).toLocaleString()}</span>
          </div>
          {!a.is_read && <div style={{ width:9, height:9, borderRadius:"50%", background:t.blueLight, flexShrink:0, marginTop:5 }}/>}
        </div>
      ))}
      {!loading && alerts.length === 0 && <div style={{ padding:40, textAlign:"center", color:t.gray, background:t.navyLight, borderRadius:16, border:`1px solid ${t.border}` }}>No alerts yet.</div>}
    </div>
  );
}

// ─── API-WIRED: ANALYTICS ─────────────────────────────────────────────────────
function Analytics() {
  const { data, loading, error } = useAnalytics();

  if (loading) return <div style={{ padding:40, display:"flex", justifyContent:"center" }}><Spinner size={32}/></div>;
  if (error)   return <div style={{ padding:24 }}><ErrorBanner msg={error}/></div>;
  if (!data)   return null;

  const maxRegion = Math.max(...(data.by_region?.map(r => r.total) || [1]));

  return (
    <div style={{ padding:"24px 30px", display:"flex", flexDirection:"column", gap:22 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {[
          ["Total Cases",      data.total_cases,                           "users",       t.blueLight],
          ["Match Rate",       `${data.match_rate_percent}%`,              "activity",    t.gold],
          ["Avg Resolution",   `${data.avg_resolution_days} days`,         "file",        t.green],
          ["Active",           data.active_cases,                          "search",      t.red],
          ["Matched",          data.matched_cases,                         "fingerprint", t.gold],
          ["Reunited",         data.reunited_cases,                        "check",       t.green],
        ].map(([label, value, icon, color]) => (
          <div key={label} style={{ background:t.navyLight, border:`1px solid ${t.border}`, borderRadius:16, padding:"18px 22px", animation:"fadeUp .4s ease both" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:13, color:t.gray }}>{label}</span>
              <div style={{ width:32, height:32, borderRadius:8, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon n={icon} size={14} color={color}/></div>
            </div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:t.white }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Region chart */}
      <div style={{ background:t.navyLight, border:`1px solid ${t.border}`, borderRadius:16, padding:"22px" }}>
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15, color:t.white, marginBottom:20 }}>Cases by Region</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {data.by_region?.slice(0,8).map((r, i) => (
            <div key={r.region} style={{ display:"flex", gap:12, alignItems:"center", animation:`fadeUp .3s ease ${i*.05}s both` }}>
              <div style={{ width:90, fontSize:13, color:t.grayLight, textAlign:"right", flexShrink:0 }}>{r.region}</div>
              <div style={{ flex:1, height:26, background:t.navyMid, borderRadius:6, overflow:"hidden", position:"relative" }}>
                <div style={{ height:"100%", width:`${(r.total/maxRegion)*100}%`, background:`linear-gradient(90deg,${t.blue},${t.blueLight})`, borderRadius:6, display:"flex", alignItems:"center", paddingLeft:10, minWidth:30 }}>
                  <span style={{ fontSize:11, color:"#fff", fontWeight:600 }}>{r.total}</span>
                </div>
                <div style={{ position:"absolute", top:0, height:"100%", width:`${(r.reunited/maxRegion)*100}%`, background:`${t.green}55`, borderRadius:6 }}/>
              </div>
              <div style={{ fontSize:12, color:t.green, width:70, flexShrink:0 }}>{r.reunited} reunited</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gender & age breakdown */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {[["By Gender", data.by_gender], ["By Age Group", data.by_age_group]].map(([title, breakdown]) => (
          <div key={title} style={{ background:t.navyLight, border:`1px solid ${t.border}`, borderRadius:16, padding:"20px 22px" }}>
            <h4 style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:t.white, marginBottom:14 }}>{title}</h4>
            {Object.entries(breakdown || {}).map(([k, v]) => {
              const max = Math.max(...Object.values(breakdown));
              return (
                <div key={k} style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10 }}>
                  <div style={{ width:70, fontSize:12, color:t.grayLight, textAlign:"right", flexShrink:0 }}>{k}</div>
                  <div style={{ flex:1, height:20, background:t.navyMid, borderRadius:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(v/max)*100}%`, background:`linear-gradient(90deg,${t.blue},${t.blueLight})`, borderRadius:4 }}/>
                  </div>
                  <span style={{ fontSize:12, color:t.gray, width:30, textAlign:"right" }}>{v}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user,    setUser]    = useState(null);
  const [page,    setPage]    = useState("dashboard");
  const [booting, setBooting] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const stored = getUser();
    const token  = getToken();
    if (stored && token) setUser(stored);
    setBooting(false);
  }, []);

  const { alerts } = useAlerts();
  const unreadCount = user ? (alerts?.filter(a => !a.is_read).length ?? 0) : 0;

  const handleLogin = (data) => {
    setUser({ id: data.user_id, name: data.full_name, role: data.role });
    setPage("dashboard");
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setPage("dashboard");
  };

  if (booting) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:t.navy }}>
      <Spinner size={36}/>
    </div>
  );

  if (!user) return (
    <>
      <style>{G}</style>
      <Login onLogin={handleLogin}/>
    </>
  );

  const pages = { dashboard: Dashboard, cases: Cases, search: FaceSearch, report: Report, alerts: Alerts, analytics: Analytics };
  const titles = { dashboard:["Dashboard","Platform overview and live alerts"], cases:["Missing Persons","All reported cases"], search:["Face Search","AI-powered facial recognition match"], report:["File a Report","Submit a new missing person case"], alerts:["Alerts","Real-time AI match notifications"], analytics:["Analytics","Regional stats and model performance"] };
  const PageComponent = pages[page] || Dashboard;
  const [title, subtitle] = titles[page] || [];

  return (
    <>
      <style>{G}</style>
      <div style={{ display:"flex", minHeight:"100vh" }}>
        <Sidebar page={page} setPage={setPage} role={user.role} user={user} onLogout={handleLogout} unreadCount={unreadCount}/>
        <main style={{ flex:1, overflowY:"auto", background:t.navy }}>
          <div style={{ padding:"22px 30px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:t.white, letterSpacing:"-.5px" }}>{title}</h1>
              {subtitle && <p style={{ color:t.gray, fontSize:13, marginTop:3 }}>{subtitle}</p>}
            </div>
            <div style={{ padding:"7px 14px", borderRadius:8, background:t.navyLight, border:`1px solid ${t.border}`, color:t.gray, fontSize:13 }}>
              {new Date().toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short", year:"numeric" })}
            </div>
          </div>
          <PageComponent setPage={setPage} role={user.role}/>
        </main>
      </div>
    </>
  );
}
