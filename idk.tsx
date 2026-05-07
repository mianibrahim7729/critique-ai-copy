import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#0A0A0F;color:#F0F0F5;font-family:'Figtree',sans-serif;-webkit-font-smoothing:antialiased}
button{cursor:pointer;font-family:'Figtree',sans-serif;border:none;background:none}
input,textarea,select{font-family:'Figtree',sans-serif;outline:none}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#2A2A3A;border-radius:99px}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes scaleIn{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
@keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(168,85,247,0)}50%{box-shadow:0 0 28px 6px rgba(168,85,247,.3)}}
@keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes ring{0%{transform:scale(1);opacity:1}100%{transform:scale(2.4);opacity:0}}
.fade-up{animation:fadeUp .42s cubic-bezier(.22,1,.36,1) both}
.fade-in{animation:fadeIn .28s ease both}
.scale-in{animation:scaleIn .36s cubic-bezier(.22,1,.36,1) both}
`;

const T = {
  bg:"#0A0A0F",surface:"#13131A",surface2:"#1C1C26",
  border:"#2A2A3A",purple:"#A855F7",blue:"#3B82F6",
  green:"#22C55E",orange:"#F97316",red:"#EF4444",yellow:"#EAB308",
  pink:"#EC4899",teal:"#14B8A6",text:"#F0F0F5",muted:"#6B7280",dim:"#9CA3AF",
};

const clamp = (n, a, b) => Math.min(Math.max(n, a), b);

function usePersist(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : (typeof init === "function" ? init() : init);
    } catch { return typeof init === "function" ? init() : init; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

let _toast = null;
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  _toast = useCallback((msg, type = "success", xp = 0) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type, xp }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  const cols = { success: T.green, xp: T.yellow, info: T.blue, warning: T.orange, achievement: T.purple };
  const icons = { success: "✅", xp: "⚡", info: "💡", warning: "⚠️", achievement: "🏆" };
  return (
    <div>
      {children}
      <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:10, pointerEvents:"none" }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background:T.surface, border:`1px solid ${(cols[t.type]||T.green)}44`, borderRadius:14, padding:"12px 18px", display:"flex", alignItems:"center", gap:10, animation:"toastIn .3s ease both", minWidth:220 }}>
            <span style={{ fontSize:18 }}>{icons[t.type]||"✅"}</span>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:cols[t.type]||T.green }}>{t.msg}</div>
              {t.xp > 0 && <div style={{ fontSize:11, color:T.muted }}>+{t.xp} XP earned</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
const toast = (msg, type = "success", xp = 0) => _toast && _toast(msg, type, xp);

function Spinner({ size = 20, color = T.purple }) {
  return <div style={{ width:size, height:size, border:`2px solid ${T.border}`, borderTop:`2px solid ${color}`, borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block", flexShrink:0 }} />;
}

function Avatar({ name = "U", size = 36, color = T.purple }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${color},${T.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size * .38, fontWeight:700, flexShrink:0, color:"#fff" }}>
      {(name || "U")[0].toUpperCase()}
    </div>
  );
}

function Badge({ label, color = T.purple }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700, background:`${color}22`, color, border:`1px solid ${color}44` }}>
      {label}
    </span>
  );
}

function Card({ children, style = {}, onClick, accent = null, className = "" }) {
  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 10px 40px ${T.purple}18`; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      style={{ background: accent ? `linear-gradient(135deg,${accent}0E,${T.surface})` : T.surface, border:`1px solid ${accent ? accent + "33" : T.border}`, borderRadius:20, padding:20, position:"relative", overflow:"hidden", cursor: onClick ? "pointer" : "default", transition:"transform .2s,box-shadow .2s", ...style }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value = 0, max = 100, color = T.purple, height = 8, label = "" }) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div>
      {label && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:13 }}>
          <span style={{ color:T.dim }}>{label}</span>
          <span style={{ color, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div style={{ height, background:T.border, borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}bb)`, borderRadius:99, transition:"width .9s cubic-bezier(.22,1,.36,1)" }} />
      </div>
    </div>
  );
}

function Ring({ score = 0, max = 100, size = 120, color = T.purple, label = "", sub = "" }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * clamp(score / max, 0, 1);
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={10} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition:"stroke-dasharray .9s cubic-bezier(.22,1,.36,1)" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1 }}>
        <div style={{ fontSize:size * .22, fontWeight:900, color, fontFamily:"'DM Mono',monospace", lineHeight:1 }}>{score}</div>
        {label && <div style={{ fontSize:size * .1, color:T.muted, textAlign:"center", lineHeight:1.2 }}>{label}</div>}
        {sub && <div style={{ fontSize:size * .085, color, textAlign:"center" }}>{sub}</div>}
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, style = {} }) {
  const V = {
    primary: { background:`linear-gradient(135deg,${T.purple},${T.blue})`, color:"#fff", border:"none" },
    ghost:   { background:"transparent", color:T.dim, border:`1px solid ${T.border}` },
    outline: { background:"transparent", color:T.purple, border:`1px solid ${T.purple}55` },
    danger:  { background:`${T.red}18`, color:T.red, border:`1px solid ${T.red}44` },
    success: { background:`${T.green}18`, color:T.green, border:`1px solid ${T.green}44` },
    orange:  { background:`${T.orange}18`, color:T.orange, border:`1px solid ${T.orange}44` },
  };
  const S = { sm:{ padding:"7px 14px", fontSize:13 }, md:{ padding:"11px 22px", fontSize:15 }, lg:{ padding:"15px 32px", fontSize:16 } };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "scale(1.035)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
      style={{ ...V[variant], ...S[size], borderRadius:12, fontWeight:700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1, transition:"all .18s", whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:7, ...style }}
    >
      {children}
    </button>
  );
}

function Inp({ label, value, onChange, placeholder = "", type = "text", onEnter, rows = 0, style = {} }) {
  const baseStyle = { width:"100%", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:12, padding:"11px 15px", color:T.text, fontSize:14, transition:"border-color .2s", ...style };
  const onFocus = e => { e.target.style.borderColor = T.purple; };
  const onBlur  = e => { e.target.style.borderColor = T.border; };
  return (
    <div>
      {label && <div style={{ fontSize:12, color:T.muted, fontWeight:700, letterSpacing:.04, textTransform:"uppercase", marginBottom:7 }}>{label}</div>}
      {rows > 1
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} onFocus={onFocus} onBlur={onBlur} style={{ ...baseStyle, resize:"vertical", lineHeight:1.6 }} />
        : <input value={value} onChange={onChange} placeholder={placeholder} type={type} onFocus={onFocus} onBlur={onBlur} onKeyDown={e => e.key === "Enter" && onEnter && onEnter()} style={baseStyle} />
      }
    </div>
  );
}

function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div className="scale-in" onClick={e => e.stopPropagation()} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:24, padding:28, width:"100%", maxWidth:width, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontWeight:800, fontSize:18 }}>{title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:T.surface2, color:T.muted, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>x</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SectionHead({ icon, title, sub, action }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:22 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {icon && <div style={{ width:40, height:40, borderRadius:12, background:`${T.purple}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{icon}</div>}
        <div>
          <div style={{ fontSize:22, fontWeight:800, lineHeight:1 }}>{title}</div>
          {sub && <div style={{ color:T.muted, fontSize:13, marginTop:4 }}>{sub}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

function NotifToggle({ label, sub, defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:T.surface2, borderRadius:12 }}>
      <div>
        <div style={{ fontWeight:600, fontSize:14 }}>{label}</div>
        <div style={{ fontSize:12, color:T.muted }}>{sub}</div>
      </div>
      <div onClick={() => setOn(v => !v)} style={{ width:44, height:24, borderRadius:12, cursor:"pointer", transition:"all .2s", background: on ? T.purple : T.border, padding:"2px", display:"flex", alignItems:"center", justifyContent: on ? "flex-end" : "flex-start" }}>
        <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", transition:"all .2s" }} />
      </div>
    </div>
  );
}

const NAV = [
  { id:"dashboard", icon:"🏠", label:"Dashboard" },
  { id:"glowup",    icon:"🌟", label:"Glow Up Score" },
  { id:"habits",    icon:"✅", label:"Habits" },
  { id:"scans",     icon:"💪", label:"AI Scans" },
  { id:"nutrition", icon:"🥗", label:"Nutrition" },
  { id:"workouts",  icon:"🏋️", label:"Workouts" },
  { id:"body",      icon:"📏", label:"Body Metrics" },
  { id:"streak",    icon:"🔥", label:"Streak Calendar" },
  { id:"sleep",     icon:"😴", label:"Sleep" },
  { id:"journal",   icon:"📓", label:"Journal" },
  { id:"mindset",   icon:"🧠", label:"Mindset" },
  { id:"voice",     icon:"🎙️", label:"Voice Coach" },
  { id:"breathing", icon:"🌬️", label:"Breathing" },
  { id:"focus",     icon:"🎯", label:"Focus Mode" },
  { id:"coach",     icon:"🤖", label:"AI Coach" },
  { id:"social",    icon:"👥", label:"Social" },
  { id:"progress",  icon:"📈", label:"Progress" },
  { id:"settings",  icon:"⚙️", label:"Settings" },
];

// ─── AI helper ────────────────────────────────────────────────────────────────
async function callClaude(prompt, maxTokens = 800) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens, messages:[{ role:"user", content:prompt }] }),
  });
  const d = await res.json();
  return d.content?.map(b => b.text || "").join("") || "";
}

async function callClaudeWithSystem(system, messages, maxTokens = 800) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:maxTokens, system, messages }),
  });
  const d = await res.json();
  return d.content?.map(b => b.text || "").join("") || "";
}

async function callClaudeVision(b64, mimeType, prompt, maxTokens = 900) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: maxTokens,
      messages: [{ role:"user", content:[{ type:"image", source:{ type:"base64", media_type:mimeType, data:b64 } }, { type:"text", text:prompt }] }],
    }),
  });
  const d = await res.json();
  return d.content?.map(b => b.text || "").join("") || "";
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, setTab }) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });

  const [tasks, setTasks] = usePersist("cai_tasks", [
    { id:1, label:"Morning workout",        icon:"🏋️", xp:50, done:false },
    { id:2, label:"Log your meals",         icon:"🥗", xp:30, done:false },
    { id:3, label:"Posture check",          icon:"🧍", xp:40, done:false },
    { id:4, label:"10-min breathing",       icon:"🌬️", xp:20, done:false },
    { id:5, label:"Read 20 mins",           icon:"📖", xp:25, done:false },
    { id:6, label:"Cold shower",            icon:"🚿", xp:35, done:false },
    { id:7, label:"No junk food",           icon:"🥦", xp:40, done:false },
    { id:8, label:"Voice practice 5 mins",  icon:"🎙️", xp:30, done:false },
  ]);
  const [water, setWater] = usePersist("cai_water", 5);

  const toggle = id => {
    const t = tasks.find(x => x.id === id);
    if (t && !t.done) toast(t.label + " done!", "success", t.xp);
    setTasks(ts => ts.map(x => x.id === id ? { ...x, done:!x.done } : x));
  };

  const done      = tasks.filter(t => t.done).length;
  const dayScore  = Math.round((done / tasks.length) * 100);
  const todayXP   = tasks.filter(t => t.done).reduce((s, t) => s + t.xp, 0);

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:12, color:T.muted, marginBottom:4 }}>{today}</div>
          <div style={{ fontSize:26, fontWeight:900 }}>{greet}, {user.name} 👋</div>
          <div style={{ fontSize:13, color:T.dim, marginTop:4 }}>Keep showing up. Legends are built daily.</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {[{ icon:"🔥", val:user.streak, lbl:"Streak", c:T.orange }, { icon:"⚡", val:user.xp, lbl:"XP", c:T.yellow }, { icon:"🏅", val:`Lv${user.level}`, lbl:"Level", c:T.purple }].map(s => (
            <div key={s.lbl} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"10px 16px", textAlign:"center", minWidth:70 }}>
              <div style={{ fontSize:18 }}>{s.icon}</div>
              <div style={{ fontWeight:800, fontSize:15, color:s.c, fontFamily:"'DM Mono',monospace" }}>{s.val}</div>
              <div style={{ fontSize:10, color:T.muted }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:16 }}>
        <Card accent={T.purple} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, padding:28 }}>
          <Ring score={dayScore} color={T.purple} size={130} label="Today" sub={`${done}/${tasks.length}`} />
          <div style={{ textAlign:"center", width:"100%" }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>Daily Score</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:12 }}>+{todayXP} XP earned today</div>
            <ProgressBar value={user.xp % 1000} max={1000} color={T.purple} height={5} label={`Level ${user.level} Progress`} />
          </div>
        </Card>

        <Card style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontWeight:700, fontSize:15 }}>Tasks</div>
            <Badge label={`${done}/${tasks.length} done`} color={done === tasks.length ? T.green : T.purple} />
          </div>
          <div style={{ maxHeight:310, overflowY:"auto", padding:12 }}>
            {tasks.map(t => (
              <div key={t.id} onClick={() => toggle(t.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, cursor:"pointer", background: t.done ? `${T.purple}10` : T.surface2, marginBottom:6, border:`1px solid ${t.done ? T.purple + "44" : T.border}`, transition:"all .18s" }}>
                <div style={{ width:22, height:22, borderRadius:7, border:`2px solid ${t.done ? T.purple : T.border}`, background: t.done ? T.purple : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0, color: t.done ? "#fff" : "transparent", transition:"all .18s" }}>✓</div>
                <span style={{ fontSize:16 }}>{t.icon}</span>
                <span style={{ flex:1, fontSize:13, fontWeight:500, textDecoration: t.done ? "line-through" : "none", color: t.done ? T.muted : T.text }}>{t.label}</span>
                <Badge label={`+${t.xp}`} color={T.purple} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { icon:"💧", label:"Water",    val:`${water}/8`,  unit:"glasses", color:T.blue,   pct:water/8*100 },
          { icon:"😴", label:"Sleep",    val:"7.5",          unit:"hrs",     color:T.purple, pct:85 },
          { icon:"👣", label:"Steps",    val:"8,420",        unit:"/ 10k",   color:T.green,  pct:84 },
          { icon:"🔥", label:"Calories", val:"1,840",        unit:"/ 2200",  color:T.orange, pct:84 },
        ].map(s => (
          <Card key={s.label} style={{ padding:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <Badge label={s.unit} color={s.color} />
            </div>
            <div style={{ fontSize:22, fontWeight:800, fontFamily:"'DM Mono',monospace", color:s.color, marginBottom:3 }}>{s.val}</div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:10 }}>{s.label}</div>
            <ProgressBar value={s.pct} color={s.color} height={5} />
          </Card>
        ))}
      </div>

      <Card style={{ padding:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>💧 Water Tracker</div>
          <Badge label={`${water}/8 glasses`} color={T.blue} />
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {Array.from({ length:8 }, (_, i) => (
            <div key={i} onClick={() => setWater(i < water ? i : i + 1)} style={{ flex:1, height:44, borderRadius:10, cursor:"pointer", transition:"all .2s", background: i < water ? `${T.blue}44` : T.border, border:`2px solid ${i < water ? T.blue : T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
              {i < water ? "💧" : ""}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>⚡ Quick Actions</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {[
            { icon:"💪", label:"AI Physique Scan", tab:"scans",     c:T.purple },
            { icon:"🤖", label:"Ask AI Coach",      tab:"coach",     c:T.blue },
            { icon:"🥗", label:"Log a Meal",        tab:"nutrition", c:T.green },
            { icon:"🌬️", label:"Breathing Session", tab:"breathing", c:T.teal },
          ].map(a => (
            <button key={a.tab} onClick={() => setTab(a.tab)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.c; e.currentTarget.style.background = `${a.c}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface2; }}
              style={{ padding:16, borderRadius:14, background:T.surface2, border:`1px solid ${T.border}`, textAlign:"center", cursor:"pointer", transition:"all .2s" }}>
              <div style={{ fontSize:26, marginBottom:6 }}>{a.icon}</div>
              <div style={{ fontSize:12, fontWeight:600, color:T.dim }}>{a.label}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── HABITS ───────────────────────────────────────────────────────────────────
function Habits() {
  const [habits, setHabits] = usePersist("cai_habits", [
    { id:1, name:"Cold shower",     icon:"🚿", streak:12, color:T.blue,   history:[1,1,1,1,1,0,1], cat:"fitness" },
    { id:2, name:"Workout",         icon:"🏋️", streak:18, color:T.purple, history:[1,1,1,1,1,1,1], cat:"fitness" },
    { id:3, name:"Read 20 mins",    icon:"📖", streak:7,  color:T.yellow, history:[1,1,0,1,1,1,0], cat:"mental" },
    { id:4, name:"Meditate",        icon:"🧘", streak:5,  color:T.green,  history:[0,1,1,1,0,1,1], cat:"mental" },
    { id:5, name:"No social media", icon:"📵", streak:3,  color:T.orange, history:[1,0,1,1,0,0,1], cat:"digital" },
    { id:6, name:"Drink 2L water",  icon:"💧", streak:22, color:T.blue,   history:[1,1,1,1,1,1,1], cat:"health" },
    { id:7, name:"Journal",         icon:"📓", streak:9,  color:T.pink,   history:[1,1,0,1,0,1,1], cat:"mental" },
    { id:8, name:"Sunlight",        icon:"☀️", streak:14, color:T.yellow, history:[1,1,1,0,1,1,1], cat:"health" },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("⭐");
  const [filter,  setFilter]  = useState("all");

  const days   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const emojis = ["⭐","💪","🚿","📖","🧘","💧","🥗","🏃","📵","☀️","📓","🎸","🎨","🧠","🛌","🤸","🎯","🌿"];
  const cats   = ["all","fitness","mental","health","digital","general"];

  const toggle  = (hId, i) => setHabits(hs => hs.map(h => h.id === hId ? { ...h, history:h.history.map((v, j) => j === i ? 1 - v : v) } : h));
  const remove  = id => { setHabits(hs => hs.filter(h => h.id !== id)); toast("Habit removed", "info"); };
  const addHabit = () => {
    if (!newName.trim()) return;
    setHabits(h => [...h, { id:Date.now(), name:newName, icon:newIcon, streak:0, color:T.purple, history:[0,0,0,0,0,0,0], cat:"general" }]);
    toast(`"${newName}" added!`, "success", 10);
    setNewName(""); setShowAdd(false);
  };

  const list  = filter === "all" ? habits : habits.filter(h => h.cat === filter);
  const total = habits.reduce((s, h) => s + h.history.filter(Boolean).length, 0);
  const pct   = Math.round(total / (habits.length * 7) * 100);

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="✅" title="Habit Tracker" sub="Build routines that actually stick" action={<Btn onClick={() => setShowAdd(true)} size="sm">+ New Habit</Btn>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { l:"Active",      v:habits.length,                                  i:"📋", c:T.purple },
          { l:"Best Streak", v:`${Math.max(...habits.map(h => h.streak))}🔥`,  i:"🏆", c:T.orange },
          { l:"This Week",   v:`${pct}%`,                                      i:"📅", c:T.green },
          { l:"Total Checks",v:total,                                          i:"✅", c:T.blue },
        ].map(s => (
          <Card key={s.l} style={{ padding:16, textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{s.i}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.c, fontFamily:"'DM Mono',monospace" }}>{s.v}</div>
            <div style={{ fontSize:12, color:T.muted }}>{s.l}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{ padding:"6px 14px", borderRadius:10, fontSize:12, fontWeight:700, textTransform:"capitalize", background: filter === c ? `${T.purple}22` : T.surface2, border:`1px solid ${filter === c ? T.purple : T.border}`, color: filter === c ? T.purple : T.dim, transition:"all .18s" }}>{c}</button>
        ))}
      </div>

      <Card style={{ padding:0, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:560 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                <th style={{ padding:"12px 16px", textAlign:"left", color:T.muted, fontSize:11, fontWeight:700 }}>HABIT</th>
                {days.map(d => <th key={d} style={{ padding:"12px 8px", color:T.muted, fontSize:11, fontWeight:700, textAlign:"center" }}>{d}</th>)}
                <th style={{ padding:"12px 16px", color:T.muted, fontSize:11, fontWeight:700, textAlign:"right" }}>STREAK</th>
                <th style={{ padding:"12px 10px" }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map(h => (
                <tr key={h.id} style={{ borderTop:`1px solid ${T.border}22` }}>
                  <td style={{ padding:"13px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:`${h.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{h.icon}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{h.name}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{Math.round(h.history.filter(Boolean).length / 7 * 100)}% this week</div>
                      </div>
                    </div>
                  </td>
                  {h.history.map((done, i) => (
                    <td key={i} style={{ padding:"13px 8px", textAlign:"center" }}>
                      <div onClick={() => toggle(h.id, i)} style={{ width:28, height:28, borderRadius:8, margin:"0 auto", cursor:"pointer", background: done ? `${h.color}33` : T.border, border:`2px solid ${done ? h.color : T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, transition:"all .18s", color: done ? h.color : "transparent" }}>✓</div>
                    </td>
                  ))}
                  <td style={{ padding:"13px 16px", textAlign:"right" }}>
                    <span style={{ fontWeight:800, color:h.color, fontFamily:"'DM Mono',monospace" }}>{h.streak}🔥</span>
                  </td>
                  <td style={{ padding:"13px 10px" }}>
                    <button onClick={() => remove(h.id)} onMouseEnter={e => { e.target.style.color = T.red; }} onMouseLeave={e => { e.target.style.color = T.muted; }} style={{ color:T.muted, fontSize:14, padding:4, borderRadius:6 }}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Habit">
        <Inp label="Habit Name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Cold shower, No phone after 9pm..." onEnter={addHabit} />
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:12, color:T.muted, fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Icon</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {emojis.map(ic => <button key={ic} onClick={() => setNewIcon(ic)} style={{ width:40, height:40, borderRadius:10, fontSize:20, border:`2px solid ${newIcon === ic ? T.purple : T.border}`, background: newIcon === ic ? `${T.purple}22` : T.surface2, transition:"all .18s" }}>{ic}</button>)}
          </div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <Btn onClick={addHabit} disabled={!newName.trim()} style={{ flex:1, justifyContent:"center" }}>Add Habit</Btn>
          <Btn onClick={() => setShowAdd(false)} variant="ghost">Cancel</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ─── AI SCANS ─────────────────────────────────────────────────────────────────
function AIScans() {
  const [mode,     setMode]    = useState("physique");
  const [imgB64,   setImgB64]  = useState(null);
  const [imgType,  setImgType] = useState("image/jpeg");
  const [scanning, setScan]    = useState(false);
  const [result,   setResult]  = useState(null);
  const [history,  setHistory] = usePersist("cai_scan_hist", []);
  const fileRef = useRef();

  const modes = [
    { id:"physique", icon:"💪", label:"Physique Scan",  desc:"Body composition analysis" },
    { id:"posture",  icon:"🧍", label:"Posture Check",  desc:"Alignment correction plan" },
    { id:"outfit",   icon:"👔", label:"Outfit Rating",  desc:"Style score and advice" },
    { id:"face",     icon:"🪞", label:"Face Analysis",  desc:"Features and grooming tips" },
  ];

  const PROMPTS = {
    physique: "You are an expert fitness coach. Analyze this body photo and provide:\n📊 OVERALL SCORE: [X]/100\nBODY FAT ESTIMATE: [range]%\nMUSCLE DEFINITION: [X]/10\nPROPORTIONS: [X]/10\nPOSTURE: [X]/10\n\n💪 STRENGTHS:\n[3 specific positives]\n\n🎯 IMPROVEMENTS:\n[3 actionable areas]\n\n📅 12-WEEK PLAN:\n[Week 1-4, 5-8, 9-12 focus]\n\n⭐ HONEST ASSESSMENT:\n[2-3 sentences of direct motivation]",
    posture:  "You are a posture specialist. Analyze this photo and provide:\n📊 POSTURE SCORE: [X]/100\n\nASSESSMENT:\nHead/Neck: [Good/Fair/Poor] - [note]\nShoulders: [Good/Fair/Poor] - [note]\nSpine: [Good/Fair/Poor] - [note]\nHips: [Good/Fair/Poor] - [note]\n\n🔴 ISSUES DETECTED:\n[Specific problems]\n\n🏋️ CORRECTIVE EXERCISES:\n[4 specific exercises]\n\n💡 DAILY HABITS:\n[5 specific actions]",
    outfit:   "You are a personal stylist. Analyze this outfit and provide:\n⭐ OUTFIT SCORE: [X]/100\n\nBREAKDOWN:\nFit and Tailoring: [X]/10 - [note]\nColor Coordination: [X]/10 - [note]\nStyle Coherence: [X]/10 - [note]\nOccasion Match: [X]/10 - [note]\n\n✅ WHAT WORKS:\n[3 specific positives]\n\n🔧 IMPROVEMENTS:\n[3 specific changes]\n\n🛍️ SHOPPING LIST:\n[5 pieces to elevate this look]",
    face:     "You are an aesthetic consultant. Analyze this photo and provide:\n📊 AESTHETIC SCORE: [X]/100\n\nFace Shape: [shape] - [styling implications]\nJawline: [X]/10 - [note]\nSkin Quality: [X]/10 - [note]\nGrooming: [X]/10 - [note]\n\n💇 HAIRSTYLE RECOMMENDATIONS:\n[3 specific styles]\n\n🧴 SKINCARE PRIORITIES:\n[3-4 specific steps]\n\n⭐ TOP 5 GLOW-UP MOVES:\n[Ranked by impact]",
  };

  const pick = e => {
    const f = e.target.files[0];
    if (!f) return;
    setImgType(f.type);
    setResult(null);
    const r = new FileReader();
    r.onload = ev => setImgB64(ev.target.result.split(",")[1]);
    r.readAsDataURL(f);
  };

  const run = async () => {
    if (!imgB64) { toast("Upload a photo first", "warning"); return; }
    setScan(true); setResult(null);
    try {
      const txt = await callClaudeVision(imgB64, imgType, PROMPTS[mode]);
      setResult(txt);
      setHistory(h => [{ id:Date.now(), mode, date:new Date().toLocaleDateString(), txt }, ...h.slice(0, 7)]);
      toast(modes.find(m => m.id === mode)?.label + " complete!", "achievement", 60);
    } catch { setResult("Analysis failed. Please try again."); }
    setScan(false);
  };

  const currentMode = modes.find(m => m.id === mode);

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="💪" title="AI Scans" sub="Upload a photo for instant AI analysis" />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {modes.map(m => (
          <Card key={m.id} onClick={() => { setMode(m.id); setResult(null); }} accent={mode === m.id ? T.purple : null} style={{ textAlign:"center", padding:18, borderColor: mode === m.id ? `${T.purple}66` : T.border, cursor:"pointer" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{m.icon}</div>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:11, color:T.muted, lineHeight:1.4 }}>{m.desc}</div>
            {mode === m.id && <div style={{ position:"absolute", top:10, right:10, width:8, height:8, borderRadius:"50%", background:T.purple }} />}
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>{currentMode?.icon} {currentMode?.label}</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={pick} />
          {imgB64 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ position:"relative", borderRadius:16, overflow:"hidden" }}>
                <img src={`data:${imgType};base64,${imgB64}`} alt="scan" style={{ width:"100%", height:220, objectFit:"cover", display:"block" }} />
                <button onClick={() => { setImgB64(null); setResult(null); }} style={{ position:"absolute", top:10, right:10, width:28, height:28, borderRadius:"50%", background:"rgba(0,0,0,.7)", color:"#fff", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>x</button>
                <div style={{ position:"absolute", bottom:10, left:10 }}><Badge label="Photo ready" color={T.green} /></div>
              </div>
              <Btn onClick={run} disabled={scanning} style={{ justifyContent:"center", width:"100%" }}>
                {scanning ? <><Spinner size={16} color="#fff" />Analyzing...</> : `Run ${currentMode?.label}`}
              </Btn>
              <Btn onClick={() => fileRef.current.click()} variant="ghost" size="sm" style={{ justifyContent:"center" }}>Change Photo</Btn>
            </div>
          ) : (
            <div onClick={() => fileRef.current.click()}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.purple; e.currentTarget.style.background = `${T.purple}08`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "transparent"; }}
              style={{ border:`2px dashed ${T.border}`, borderRadius:16, padding:40, textAlign:"center", cursor:"pointer", transition:"all .2s" }}>
              <div style={{ fontSize:44, marginBottom:12 }}>📸</div>
              <div style={{ fontWeight:700, marginBottom:6 }}>Upload Your Photo</div>
              <div style={{ color:T.muted, fontSize:13 }}>Tap to choose from gallery</div>
              <div style={{ fontSize:11, color:T.border, marginTop:8 }}>Photos are never stored</div>
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Scan History</div>
          {history.length === 0 ? (
            <div style={{ textAlign:"center", padding:30, color:T.muted }}><div style={{ fontSize:32, marginBottom:8 }}>📷</div><div style={{ fontSize:13 }}>No scans yet</div></div>
          ) : (
            <div style={{ display:"grid", gap:10 }}>
              {history.slice(0, 5).map(h => (
                <div key={h.id} style={{ padding:"12px 14px", background:T.surface2, borderRadius:12, border:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <Badge label={modes.find(m => m.id === h.mode)?.label || h.mode} color={T.purple} />
                    <span style={{ fontSize:11, color:T.muted }}>{h.date}</span>
                  </div>
                  <div style={{ fontSize:12, color:T.dim, lineHeight:1.5 }}>{(h.txt || "").slice(0, 100)}...</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {result && (
        <Card className="scale-in" accent={T.purple}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${T.purple}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>◈</div>
              <div><div style={{ fontWeight:700 }}>Analysis Complete</div><div style={{ fontSize:12, color:T.purple }}>Claude Vision AI</div></div>
            </div>
            <Btn onClick={() => setResult(null)} variant="ghost" size="sm">Dismiss</Btn>
          </div>
          <pre style={{ whiteSpace:"pre-wrap", lineHeight:1.8, fontSize:14, color:T.text, fontFamily:"inherit" }}>{result}</pre>
        </Card>
      )}
    </div>
  );
}

// ─── NUTRITION ────────────────────────────────────────────────────────────────
function Nutrition() {
  const [meals,   setMeals]  = usePersist("cai_meals", [
    { id:1, name:"Overnight oats + banana",   time:"8:00 AM",  kcal:420, protein:18, carbs:65, fat:8 },
    { id:2, name:"Chicken + rice + broccoli", time:"12:30 PM", kcal:580, protein:45, carbs:58, fat:11 },
    { id:3, name:"Greek yogurt + berries",    time:"3:30 PM",  kcal:180, protein:15, carbs:22, fat:3 },
  ]);
  const [water,   setWater]   = usePersist("cai_water2", 6);
  const [input,   setInput]   = useState("");
  const [adding,  setAdding]  = useState(false);
  const [scanning,setScan]    = useState(false);
  const [imgB64,  setImg]     = useState(null);
  const [imgType, setImgT]    = useState("image/jpeg");
  const [scanTxt, setScanTxt] = useState("");
  const fileRef = useRef();
  const goals   = { kcal:2200, protein:160, carbs:220, fat:65 };
  const totals  = useMemo(() => meals.reduce((a, m) => ({ kcal:a.kcal+m.kcal, protein:a.protein+m.protein, carbs:a.carbs+m.carbs, fat:a.fat+m.fat }), { kcal:0, protein:0, carbs:0, fat:0 }), [meals]);

  const pick = e => {
    const f = e.target.files[0];
    if (!f) return;
    setImgT(f.type);
    const r = new FileReader();
    r.onload = ev => setImg(ev.target.result.split(",")[1]);
    r.readAsDataURL(f);
  };

  const scanFood = async () => {
    if (!imgB64) return;
    setScan(true); setScanTxt("");
    try {
      const txt = await callClaudeVision(imgB64, imgType, "Analyze this food photo. Reply:\nFOOD: [name]   SERVING: [estimate]\nCalories: [n] kcal  Protein: [n]g  Carbs: [n]g  Fat: [n]g  Fiber: [n]g\nHEALTH RATING: [n]/10\nNOTES: [2 sentences on quality and tips]");
      setScanTxt(txt);
      toast("Food scanned!", "success", 15);
    } catch { setScanTxt("Scan failed."); }
    setScan(false);
  };

  const logMeal = async () => {
    if (!input.trim()) return;
    setAdding(true);
    try {
      const txt = await callClaude(`Estimate nutrition for: "${input}". Reply ONLY with JSON no markdown: {"kcal":N,"protein":N,"carbs":N,"fat":N}`, 100);
      const nu = JSON.parse(txt.replace(/```json|```/g, "").trim());
      setMeals(m => [...m, { id:Date.now(), name:input, time:new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }), ...nu }]);
      toast(input + " logged!", "success", 20);
      setInput("");
    } catch {
      setMeals(m => [...m, { id:Date.now(), name:input, time:"Now", kcal:300, protein:20, carbs:35, fat:10 }]);
      setInput("");
    }
    setAdding(false);
  };

  const macros = [
    { label:"Calories", unit:"kcal", val:totals.kcal,    goal:goals.kcal,    color:T.orange },
    { label:"Protein",  unit:"g",    val:totals.protein,  goal:goals.protein, color:T.blue },
    { label:"Carbs",    unit:"g",    val:totals.carbs,    goal:goals.carbs,   color:T.yellow },
    { label:"Fat",      unit:"g",    val:totals.fat,      goal:goals.fat,     color:T.purple },
  ];

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="🥗" title="Nutrition" sub="Track calories and macros with AI food scanning" />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {macros.map(m => (
          <Card key={m.label} style={{ padding:18, textAlign:"center" }}>
            <Ring score={Math.min(Math.round(m.val / m.goal * 100), 100)} size={80} color={m.color} />
            <div style={{ fontWeight:800, color:m.color, fontFamily:"'DM Mono',monospace", fontSize:18, marginTop:8 }}>{m.val}</div>
            <div style={{ fontSize:12, color:T.dim }}>{m.label}</div>
            <div style={{ fontSize:11, color:T.border }}>/ {m.goal}{m.unit}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>💧 Water Intake</div>
          <Badge label={`${water}/8 glasses`} color={T.blue} />
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          {Array.from({ length:8 }, (_, i) => (
            <div key={i} onClick={() => setWater(i < water ? i : i + 1)} style={{ flex:1, height:38, borderRadius:10, cursor:"pointer", transition:"all .2s", background: i < water ? `${T.blue}44` : T.border, border:`2px solid ${i < water ? T.blue : T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
              {i < water ? "💧" : ""}
            </div>
          ))}
        </div>
        <ProgressBar value={water} max={8} color={T.blue} height={5} />
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Log Meal</div>
          <Inp value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. 2 scrambled eggs with toast..." onEnter={logMeal} />
          <div style={{ marginTop:10 }}>
            <Btn onClick={logMeal} disabled={adding || !input.trim()} style={{ width:"100%", justifyContent:"center" }}>
              {adding ? <><Spinner size={14} color="#fff" />Calculating...</> : "+ Log with AI Macros"}
            </Btn>
          </div>
          <div style={{ marginTop:12, display:"flex", flexWrap:"wrap", gap:6 }}>
            {["Chicken breast 150g","Oatmeal","Protein shake","Rice 100g","Avocado on toast"].map(q => (
              <button key={q} onClick={() => setInput(q)}
                onMouseEnter={e => { e.target.style.borderColor = T.green; e.target.style.color = T.green; }}
                onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.dim; }}
                style={{ padding:"5px 10px", borderRadius:8, fontSize:11, background:T.surface2, border:`1px solid ${T.border}`, color:T.dim, transition:"all .18s" }}>
                {q}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Food Scanner</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={pick} />
          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            <Btn onClick={() => fileRef.current.click()} variant="outline" size="sm">📷 Photo</Btn>
            {imgB64 && <Btn onClick={scanFood} disabled={scanning} size="sm">{scanning ? <><Spinner size={13} color="#fff" />Scanning...</> : "Scan"}</Btn>}
            {imgB64 && <button onClick={() => { setImg(null); setScanTxt(""); }} style={{ fontSize:13, color:T.muted }}>Clear</button>}
          </div>
          {imgB64 && <img src={`data:${imgType};base64,${imgB64}`} alt="food" style={{ width:"100%", height:100, objectFit:"cover", borderRadius:10, marginBottom:10 }} />}
          {scanTxt && <div style={{ padding:12, background:T.surface2, borderRadius:10, fontSize:13, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{scanTxt}</div>}
          {!imgB64 && !scanTxt && <div style={{ padding:20, textAlign:"center", color:T.muted, fontSize:13 }}><div style={{ fontSize:28, marginBottom:6 }}>📸</div>Upload food photo for instant nutrition info</div>}
        </Card>
      </div>

      <Card style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontWeight:700, fontSize:15 }}>Meals Today</div>
          <Badge label={`${totals.kcal}/${goals.kcal} kcal`} color={totals.kcal > goals.kcal ? T.red : T.green} />
        </div>
        {meals.map((m, i) => (
          <div key={m.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom: i < meals.length - 1 ? `1px solid ${T.border}22` : "none", gap:12, flexWrap:"wrap" }}>
            <div><div style={{ fontWeight:600, fontSize:14 }}>{m.name}</div><div style={{ fontSize:12, color:T.muted }}>{m.time}</div></div>
            <div style={{ display:"flex", gap:14, fontFamily:"'DM Mono',monospace", fontSize:13 }}>
              <span style={{ color:T.orange }}>{m.kcal} kcal</span>
              <span style={{ color:T.blue }}>P {m.protein}g</span>
              <span style={{ color:T.yellow }}>C {m.carbs}g</span>
              <span style={{ color:T.purple }}>F {m.fat}g</span>
            </div>
            <button onClick={() => setMeals(ms => ms.filter(x => x.id !== m.id))} style={{ color:T.muted, fontSize:14 }}>x</button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── WORKOUTS ─────────────────────────────────────────────────────────────────
function Workouts() {
  const [log,    setLog]   = usePersist("cai_wlog", []);
  const [exName, setEx]    = useState("");
  const [sets,   setSets]  = useState("3");
  const [reps,   setReps]  = useState("10");
  const [wt,     setWt]    = useState("");
  const [goal,   setGoal]  = useState("muscle");
  const [plan,   setPlan]  = useState("");
  const [genning,setGen]   = useState(false);
  const [view,   setView]  = useState("log");
  const [prs,    setPRs]   = usePersist("cai_prs", {});
  const [sec,    setSec]   = useState(0);
  const [tOn,    setTOn]   = useState(false);
  const tRef = useRef();
  const presets = ["Bench Press","Squat","Deadlift","Pull-ups","OHP","Barbell Row","Incline Press","Leg Press","RDL","Dips"];

  useEffect(() => {
    if (tOn) tRef.current = setInterval(() => setSec(s => s + 1), 1000);
    else clearInterval(tRef.current);
    return () => clearInterval(tRef.current);
  }, [tOn]);

  const ft = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const addSet = () => {
    if (!exName.trim()) return;
    const w = parseFloat(wt) || 0;
    setLog(l => [...l, { id:Date.now(), exercise:exName, sets:parseInt(sets)||3, reps:parseInt(reps)||10, weight:w, time:new Date().toLocaleTimeString() }]);
    if (w > 0 && (prs[exName] === undefined || w > prs[exName])) {
      setPRs(p => ({ ...p, [exName]:w }));
      toast(`New PR! ${exName}: ${w}kg`, "achievement", 100);
    } else { toast(exName + " logged", "success", 15); }
    setWt("");
  };

  const genPlan = async () => {
    setGen(true); setPlan("");
    const g = { muscle:"muscle building and hypertrophy", strength:"powerlifting and raw strength", fat:"fat loss and conditioning", athletic:"athletic performance", beginner:"beginner full-body training" };
    try {
      const txt = await callClaude(`Create a detailed 5-day weekly training program for ${g[goal]}. Include day-by-day breakdown, exact sets x reps x rest, progressive overload notes, form cues. Be specific and practical.`, 900);
      setPlan(txt);
      toast("Training plan ready!", "achievement", 50);
    } catch { setPlan("Failed to generate plan."); }
    setGen(false);
  };

  const vol = log.reduce((s, l) => s + (l.sets * l.reps * (l.weight || 1)), 0);

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="🏋️" title="Workouts" sub="Log exercises, track PRs, get AI training plans" />

      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        {[["log","Log"],["plan","AI Plan"],["prs","PRs"]].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:700, background: view === v ? `${T.purple}22` : T.surface2, border:`1px solid ${view === v ? T.purple : T.border}`, color: view === v ? T.purple : T.dim, transition:"all .18s" }}>{l}</button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10, background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:"6px 14px" }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:15, fontWeight:700, color: tOn ? T.green : T.muted }}>{ft(sec)}</span>
          <button onClick={() => setTOn(t => !t)} style={{ fontSize:12, fontWeight:700, color: tOn ? T.orange : T.green, background: tOn ? `${T.orange}22` : `${T.green}22`, border:`1px solid ${tOn ? T.orange + "44" : T.green + "44"}`, borderRadius:7, padding:"3px 8px" }}>{tOn ? "Pause" : "Start"}</button>
          <button onClick={() => { setSec(0); setTOn(false); }} style={{ fontSize:12, color:T.muted }}>Reset</button>
        </div>
      </div>

      {view === "log" && (
        <div style={{ display:"grid", gap:16 }}>
          <Card>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Quick Select</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
              {presets.map(p => <button key={p} onClick={() => setEx(p)} style={{ padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, background: exName === p ? `${T.purple}22` : T.surface2, border:`1px solid ${exName === p ? T.purple : T.border}`, color: exName === p ? T.purple : T.dim, transition:"all .18s" }}>{p}</button>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr auto", gap:10, alignItems:"end" }}>
              <Inp label="Exercise" value={exName} onChange={e => setEx(e.target.value)} placeholder="Exercise name..." />
              <Inp label="Sets" value={sets} onChange={e => setSets(e.target.value)} type="number" />
              <Inp label="Reps" value={reps} onChange={e => setReps(e.target.value)} type="number" />
              <Inp label="Weight (kg)" value={wt} onChange={e => setWt(e.target.value)} type="number" />
              <div style={{ paddingTop:26 }}><Btn onClick={addSet} size="sm">+ Log</Btn></div>
            </div>
          </Card>
          {log.length > 0 && (
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontWeight:700, fontSize:15 }}>Session Log</div>
                <div style={{ display:"flex", gap:10 }}>
                  <Badge label={`${log.length} exercises`} color={T.purple} />
                  <Badge label={`${Math.round(vol).toLocaleString()} vol`} color={T.blue} />
                  <button onClick={() => setLog([])} style={{ fontSize:12, color:T.red, fontWeight:700 }}>Clear</button>
                </div>
              </div>
              <div style={{ display:"grid", gap:8 }}>
                {log.map((l, i) => (
                  <div key={l.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:T.surface2, borderRadius:12 }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:`${T.purple}22`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:T.purple }}>{i + 1}</div>
                    <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:14 }}>{l.exercise}</div><div style={{ fontSize:11, color:T.muted }}>{l.time}</div></div>
                    <div style={{ display:"flex", gap:10, fontFamily:"'DM Mono',monospace", fontSize:13 }}>
                      <span style={{ color:T.purple }}>{l.sets}x{l.reps}</span>
                      {l.weight > 0 && <span style={{ color:T.blue }}>{l.weight}kg</span>}
                      <span style={{ color:T.green }}>{(l.sets * l.reps * (l.weight || 1)).toFixed(0)} vol</span>
                    </div>
                    <button onClick={() => setLog(ls => ls.filter(x => x.id !== l.id))} style={{ color:T.muted, fontSize:14 }}>x</button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {view === "plan" && (
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>AI Training Plan Generator</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
            {[["muscle","Muscle"],["strength","Strength"],["fat","Fat Loss"],["athletic","Athletic"],["beginner","Beginner"]].map(([v, l]) => (
              <button key={v} onClick={() => setGoal(v)} style={{ padding:"8px 16px", borderRadius:10, fontSize:13, fontWeight:600, background: goal === v ? `${T.blue}22` : T.surface2, border:`1px solid ${goal === v ? T.blue : T.border}`, color: goal === v ? T.blue : T.dim, transition:"all .18s" }}>{l}</button>
            ))}
          </div>
          <Btn onClick={genPlan} disabled={genning}>{genning ? <><Spinner size={16} color="#fff" />Generating...</> : "Generate My Plan"}</Btn>
          {plan && <div className="fade-in" style={{ marginTop:18, padding:18, background:T.surface2, borderRadius:14, whiteSpace:"pre-wrap", fontSize:13, lineHeight:1.8 }}>{plan}</div>}
        </Card>
      )}

      {view === "prs" && (
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Personal Records</div>
          {Object.keys(prs).length === 0
            ? <div style={{ textAlign:"center", padding:30, color:T.muted }}>Log workouts to track PRs automatically!</div>
            : (
              <div style={{ display:"grid", gap:10 }}>
                {Object.entries(prs).map(([ex, w]) => (
                  <div key={ex} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:T.surface2, borderRadius:12, border:`1px solid ${T.border}` }}>
                    <div style={{ fontWeight:600, fontSize:15 }}>{ex}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontWeight:800, fontSize:18, color:T.yellow, fontFamily:"'DM Mono',monospace" }}>{w} kg</span>
                      <Badge label="PR" color={T.yellow} />
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      )}
    </div>
  );
}

// ─── SLEEP ────────────────────────────────────────────────────────────────────
function SleepTracker() {
  const [logs,    setLogs]   = usePersist("cai_sleep", [
    { id:1, date:"Mon", hours:7.5, quality:8, bedtime:"23:00", wake:"06:30" },
    { id:2, date:"Tue", hours:6.0, quality:5, bedtime:"00:30", wake:"06:30" },
    { id:3, date:"Wed", hours:8.0, quality:9, bedtime:"22:30", wake:"06:30" },
    { id:4, date:"Thu", hours:7.0, quality:7, bedtime:"23:30", wake:"06:30" },
    { id:5, date:"Fri", hours:6.5, quality:6, bedtime:"00:00", wake:"06:30" },
    { id:6, date:"Sat", hours:9.0, quality:9, bedtime:"22:00", wake:"07:00" },
    { id:7, date:"Sun", hours:8.5, quality:8, bedtime:"22:30", wake:"07:00" },
  ]);
  const [bedtime, setBedtime] = useState("23:00");
  const [wake,    setWake]    = useState("07:00");
  const [quality, setQuality] = useState(7);
  const [aiTips,  setAiTips]  = useState("");
  const [loading, setLoading] = useState(false);
  const [view,    setView]    = useState("log");

  const calcHours = (bed, wk) => {
    const [bh, bm] = bed.split(":").map(Number);
    const [wh, wm] = wk.split(":").map(Number);
    let diff = (wh * 60 + wm) - (bh * 60 + bm);
    if (diff < 0) diff += 24 * 60;
    return Math.round(diff / 6) / 10;
  };

  const addLog = () => {
    const hours = calcHours(bedtime, wake);
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    setLogs(l => [...l.slice(-6), { id:Date.now(), date:days[new Date().getDay()], hours, quality, bedtime, wake }]);
    toast(`Sleep logged: ${hours}hrs`, "success", 20);
  };

  const avgHours   = logs.length ? (logs.reduce((s, l) => s + l.hours, 0) / logs.length).toFixed(1) : 0;
  const avgQuality = logs.length ? (logs.reduce((s, l) => s + l.quality, 0) / logs.length).toFixed(1) : 0;
  const sleepDebt  = Math.max(0, (8 - parseFloat(avgHours)) * 7).toFixed(1);
  const qClr = q => q >= 8 ? T.green : q >= 6 ? T.yellow : T.red;
  const hClr = h => h >= 8 ? T.green : h >= 7 ? T.yellow : T.red;
  const maxH = Math.max(...logs.map(l => l.hours), 9);

  const getAI = async () => {
    setLoading(true); setAiTips("");
    const summary = logs.map(l => `${l.date}: ${l.hours}hrs quality ${l.quality}/10 bed@${l.bedtime} wake@${l.wake}`).join(", ");
    try {
      const txt = await callClaude(`You are a sleep specialist. Analyze this week: ${summary}. Average: ${avgHours}hrs quality ${avgQuality}/10. Provide:\nSLEEP ASSESSMENT: [verdict]\nPATTERN ANALYSIS: [what patterns]\nKEY ISSUES: [top 2-3 problems]\nFIXES: [5 specific steps]\nTARGET SCHEDULE: [exact bedtime and wake]`, 600);
      setAiTips(txt);
      toast("Sleep analysis ready!", "achievement", 30);
    } catch { setAiTips("Analysis failed."); }
    setLoading(false);
  };

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="😴" title="Sleep Tracker" sub="Optimize your rest for peak performance" />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { label:"Avg Sleep",   val:`${avgHours}h`,    icon:"⏱️", color:hClr(parseFloat(avgHours)) },
          { label:"Avg Quality", val:`${avgQuality}/10`, icon:"⭐", color:qClr(parseFloat(avgQuality)) },
          { label:"Sleep Debt",  val:`${sleepDebt}h`,   icon:"💳", color: parseFloat(sleepDebt) > 0 ? T.red : T.green },
          { label:"Consistency", val:"85%",              icon:"📅", color:T.purple },
        ].map(s => (
          <Card key={s.label} style={{ padding:18, textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.color, fontFamily:"'DM Mono',monospace" }}>{s.val}</div>
            <div style={{ fontSize:12, color:T.muted }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"flex", gap:8 }}>
        {[["log","Sleep Log"],["chart","Chart"],["tips","AI Tips"]].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:700, background: view === v ? `${T.purple}22` : T.surface2, border:`1px solid ${view === v ? T.purple : T.border}`, color: view === v ? T.purple : T.dim, transition:"all .18s" }}>{l}</button>
        ))}
      </div>

      {view === "log" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Log Sleep</div>
            <div style={{ display:"grid", gap:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Inp label="Bedtime" value={bedtime} onChange={e => setBedtime(e.target.value)} type="time" />
                <Inp label="Wake Time" value={wake} onChange={e => setWake(e.target.value)} type="time" />
              </div>
              <div>
                <div style={{ fontSize:12, color:T.muted, fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Quality — {quality}/10</div>
                <div style={{ display:"flex", gap:6 }}>
                  {Array.from({ length:10 }, (_, i) => (
                    <div key={i} onClick={() => setQuality(i + 1)} style={{ flex:1, height:32, borderRadius:7, cursor:"pointer", transition:"all .2s", background: i < quality ? qClr(quality) + "55" : T.border, border:`2px solid ${i < quality ? qClr(quality) : T.border}` }} />
                  ))}
                </div>
              </div>
              <div style={{ padding:14, background:T.surface2, borderRadius:12, textAlign:"center" }}>
                <div style={{ fontSize:12, color:T.muted, marginBottom:4 }}>Calculated Duration</div>
                <div style={{ fontSize:28, fontWeight:900, color:hClr(calcHours(bedtime, wake)), fontFamily:"'DM Mono',monospace" }}>{calcHours(bedtime, wake)} hrs</div>
              </div>
              <Btn onClick={addLog} style={{ justifyContent:"center", width:"100%" }}>Log Sleep</Btn>
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>This Week</div>
            <div style={{ display:"grid", gap:10 }}>
              {[...logs].reverse().slice(0, 7).map(l => (
                <div key={l.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", background:T.surface2, borderRadius:12, border:`1px solid ${T.border}` }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${hClr(l.hours)}22`, border:`1px solid ${hClr(l.hours)}44`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:12, color:hClr(l.hours), flexShrink:0, fontFamily:"'DM Mono',monospace" }}>{l.date}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontWeight:700, fontSize:14, color:hClr(l.hours) }}>{l.hours}h</span>
                      <span style={{ fontSize:11, color:T.muted }}>{l.quality}/10</span>
                    </div>
                    <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{l.bedtime} to {l.wake}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {view === "chart" && (
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:20 }}>Sleep Duration This Week</div>
          <div style={{ display:"flex", gap:12, alignItems:"flex-end", height:180, padding:"0 8px" }}>
            {logs.slice(-7).map(l => {
              const pct = (l.hours / maxH) * 100;
              const clr = hClr(l.hours);
              return (
                <div key={l.id} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  <div style={{ fontSize:11, color:clr, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>{l.hours}h</div>
                  <div style={{ width:"100%", background:T.border, borderRadius:8, overflow:"hidden", height:140, display:"flex", alignItems:"flex-end" }}>
                    <div style={{ width:"100%", height:`${pct}%`, background:`linear-gradient(180deg,${clr},${clr}88)`, borderRadius:8, transition:"height .8s cubic-bezier(.22,1,.36,1)" }} />
                  </div>
                  <div style={{ fontSize:11, color:T.muted, fontWeight:600 }}>{l.date}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view === "tips" && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>AI Sleep Analysis</div>
            <Btn onClick={getAI} disabled={loading} size="sm">{loading ? <><Spinner size={13} color="#fff" />Analyzing...</> : "Get Tips"}</Btn>
          </div>
          {aiTips
            ? <pre style={{ whiteSpace:"pre-wrap", fontSize:13, lineHeight:1.8, fontFamily:"inherit" }}>{aiTips}</pre>
            : (
              <div style={{ textAlign:"center", padding:"20px 0", color:T.muted }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🌙</div>
                <div style={{ fontWeight:600, marginBottom:6 }}>AI Sleep Coaching</div>
                <div style={{ fontSize:13 }}>Click Get Tips for personalized analysis of your sleep patterns</div>
              </div>
            )
          }
        </Card>
      )}
    </div>
  );
}

// ─── JOURNAL ──────────────────────────────────────────────────────────────────
function Journal() {
  const [entries, setEntries] = usePersist("cai_journal", []);
  const [mood,    setMood]    = useState(7);
  const [energy,  setEnergy]  = useState(7);
  const [text,    setText]    = useState("");
  const [title,   setTitle]   = useState("");
  const [tag,     setTag]     = useState("gratitude");
  const [view,    setView]    = useState("write");
  const [reflect, setReflect] = useState("");
  const [loadRef, setLoadRef] = useState(false);
  const [selId,   setSelId]   = useState(null);

  const TAGS = ["gratitude","wins","reflection","goals","venting","mindset","learning"];
  const MOODS = [1,2,3,4,5,6,7,8,9,10];
  const MOOD_EMOJI = ["😭","😢","😞","😕","😐","🙂","😊","😄","😁","🤩"];
  const PROMPTS = [
    "What are 3 things you are genuinely grateful for today?",
    "What is one win, big or small, you had today?",
    "What would make tomorrow even better than today?",
    "Describe your ideal self 1 year from now.",
    "What fear is holding you back and how can you face it?",
  ];
  const tagColor = { gratitude:T.yellow, wins:T.green, reflection:T.purple, goals:T.blue, venting:T.red, mindset:T.teal, learning:T.orange };

  const save = () => {
    if (!text.trim()) return;
    const now = new Date();
    setEntries(es => [{ id:Date.now(), date:now.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }), time:now.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }), title:title || "Journal Entry", content:text, mood, energy, tag }, ...es]);
    toast("Journal entry saved!", "success", 25);
    setText(""); setTitle("");
  };

  const getReflection = async () => {
    if (!text.trim()) { toast("Write something first", "warning"); return; }
    setLoadRef(true); setReflect("");
    try {
      const txt = await callClaude(`You are an empathetic life coach. The user wrote this journal entry: "${text}". Mood: ${mood}/10, Energy: ${energy}/10, Tag: ${tag}.\n\nProvide:\nREFLECTION: [2-3 sentences mirroring key themes with empathy]\nINSIGHT: [One powerful observation]\nACTION: [One specific small action they could take today]\nAFFIRMATION: [A personalized affirmation based on what they wrote]`, 500);
      setReflect(txt);
    } catch { setReflect("Reflection unavailable."); }
    setLoadRef(false);
  };

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="📓" title="Journal" sub="Reflect, grow, and track your mental wellbeing" />

      <div style={{ display:"flex", gap:8 }}>
        {[["write","Write"],["entries","Entries"],["insights","Insights"]].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:700, background: view === v ? `${T.purple}22` : T.surface2, border:`1px solid ${view === v ? T.purple : T.border}`, color: view === v ? T.purple : T.dim, transition:"all .18s" }}>{l}</button>
        ))}
      </div>

      {view === "write" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Entry</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
              <div>
                <div style={{ fontSize:12, color:T.muted, fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Mood {MOOD_EMOJI[mood - 1]}</div>
                <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                  {MOODS.map(m => <button key={m} onClick={() => setMood(m)} style={{ fontSize:16, padding:3, borderRadius:8, border:`2px solid ${mood === m ? T.purple : "transparent"}`, background: mood === m ? `${T.purple}22` : "transparent", transition:"all .18s" }}>{MOOD_EMOJI[m - 1]}</button>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize:12, color:T.muted, fontWeight:700, textTransform:"uppercase", marginBottom:10 }}>Energy {energy}/10</div>
                <div style={{ display:"flex", gap:3 }}>
                  {Array.from({ length:10 }, (_, i) => (
                    <div key={i} onClick={() => setEnergy(i + 1)} style={{ flex:1, height:28, borderRadius:5, cursor:"pointer", background: i < energy ? T.yellow + "55" : T.border, border:`2px solid ${i < energy ? T.yellow : T.border}`, transition:"all .18s" }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {TAGS.map(t => <button key={t} onClick={() => setTag(t)} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:700, textTransform:"capitalize", background: tag === t ? `${tagColor[t] || T.purple}22` : T.surface2, border:`1px solid ${tag === t ? tagColor[t] || T.purple : T.border}`, color: tag === t ? tagColor[t] || T.purple : T.dim, transition:"all .18s" }}>{t}</button>)}
            </div>

            <Inp label="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Big day at work..." />
            <div style={{ marginTop:12, marginBottom:12 }}>
              <Inp label="Entry" value={text} onChange={e => setText(e.target.value)} placeholder="Write anything on your mind..." rows={6} />
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, color:T.muted, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Prompts</div>
              {PROMPTS.slice(0, 3).map((p, i) => (
                <button key={i} onClick={() => setText(tx => tx + (tx ? "\n\n" : "") + p + "\n")}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.purple; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 12px", borderRadius:10, marginBottom:6, background:T.surface2, border:`1px solid ${T.border}`, color:T.dim, fontSize:12, transition:"all .18s" }}>
                  {p}
                </button>
              ))}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <Btn onClick={save} disabled={!text.trim()} style={{ flex:1, justifyContent:"center" }}>Save Entry</Btn>
              <Btn onClick={getReflection} disabled={loadRef || !text.trim()} variant="outline">{loadRef ? <><Spinner size={14} />...</> : "Reflect"}</Btn>
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>AI Reflection</div>
            {reflect
              ? <pre style={{ whiteSpace:"pre-wrap", fontSize:13, lineHeight:1.8, fontFamily:"inherit", color:T.text }}>{reflect}</pre>
              : (
                <div style={{ textAlign:"center", padding:"40px 20px", color:T.muted }}>
                  <div style={{ fontSize:44, marginBottom:12 }}>🪞</div>
                  <div style={{ fontWeight:600, marginBottom:8 }}>Write an entry, then click Reflect</div>
                  <div style={{ fontSize:13, lineHeight:1.6 }}>Claude AI will provide thoughtful coaching and affirmations based on your journal entry.</div>
                </div>
              )
            }
          </Card>
        </div>
      )}

      {view === "entries" && (
        <div style={{ display:"grid", gap:12 }}>
          {entries.length === 0
            ? (
              <Card style={{ textAlign:"center", padding:40 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📓</div>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>No entries yet</div>
                <Btn onClick={() => setView("write")}>Write First Entry</Btn>
              </Card>
            )
            : entries.map(e => (
              <Card key={e.id} onClick={() => setSelId(selId === e.id ? null : e.id)} style={{ cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ fontSize:28 }}>{MOOD_EMOJI[e.mood - 1] || "😊"}</div>
                    <div><div style={{ fontWeight:700, fontSize:14 }}>{e.title}</div><div style={{ fontSize:11, color:T.muted }}>{e.date} at {e.time}</div></div>
                  </div>
                  <Badge label={e.tag} color={tagColor[e.tag] || T.purple} />
                </div>
                <div style={{ fontSize:13, color:T.dim, lineHeight:1.6, overflow: selId === e.id ? "visible" : "hidden", display: selId === e.id ? "block" : "-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{e.content}</div>
                {selId === e.id && (
                  <button onClick={ev => { ev.stopPropagation(); setEntries(es => es.filter(x => x.id !== e.id)); setSelId(null); }} style={{ marginTop:10, fontSize:12, color:T.red, fontWeight:700 }}>Delete Entry</button>
                )}
              </Card>
            ))
          }
        </div>
      )}

      {view === "insights" && (
        <div style={{ display:"grid", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            <Card style={{ textAlign:"center", padding:18 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>{entries.length > 0 ? MOOD_EMOJI[Math.round(entries.slice(0, 7).reduce((s, e) => s + e.mood, 0) / Math.max(entries.slice(0, 7).length, 1)) - 1] : "📊"}</div>
              <div style={{ fontSize:18, fontWeight:800, color:T.yellow }}>{entries.length > 0 ? (entries.slice(0, 7).reduce((s, e) => s + e.mood, 0) / entries.slice(0, 7).length).toFixed(1) : "-"}/10</div>
              <div style={{ fontSize:12, color:T.muted }}>Avg Mood (7 days)</div>
            </Card>
            <Card style={{ textAlign:"center", padding:18 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📝</div>
              <div style={{ fontSize:18, fontWeight:800, color:T.purple }}>{entries.length}</div>
              <div style={{ fontSize:12, color:T.muted }}>Total Entries</div>
            </Card>
            <Card style={{ textAlign:"center", padding:18 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🔥</div>
              <div style={{ fontSize:18, fontWeight:800, color:T.orange }}>7</div>
              <div style={{ fontSize:12, color:T.muted }}>Day Streak</div>
            </Card>
          </div>
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Entry Categories</div>
            {TAGS.map(t => {
              const count = entries.filter(e => e.tag === t).length;
              const maxCount = Math.max(...TAGS.map(tt => entries.filter(e => e.tag === tt).length), 1);
              return (
                <div key={t} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:90, fontSize:13, fontWeight:600, textTransform:"capitalize", color:tagColor[t] || T.purple }}>{t}</div>
                  <div style={{ flex:1 }}><ProgressBar value={count} max={maxCount} color={tagColor[t] || T.purple} height={8} /></div>
                  <div style={{ width:24, textAlign:"right", fontSize:13, fontWeight:700, color:T.dim }}>{count}</div>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── MINDSET ──────────────────────────────────────────────────────────────────
function Mindset() {
  const [affirm,   setAffirm]  = useState("");
  const [loading,  setLoading] = useState(false);
  const [obstacle, setObs]     = useState("");
  const [goal,     setGoal]    = useState("");
  const [reframe,  setReframe] = useState("");
  const [rLoad,    setRLoad]   = useState(false);
  const [view,     setView]    = useState("affirmations");
  const [accepted, setAccepted]= useState(false);

  const CHALLENGES = [
    { icon:"👁️", title:"Eye Contact Challenge",  desc:"Make deliberate eye contact with every person you speak to today. Hold it 1 second longer than feels comfortable.", xp:40 },
    { icon:"🤝", title:"Compliment 3 People",     desc:"Give genuine, specific compliments to 3 people today. Notice how it changes your energy and theirs.", xp:50 },
    { icon:"🪞", title:"Power Pose 5 Mins",        desc:"Stand with hands on hips, chest out for 5 minutes before any important interaction today.", xp:30 },
    { icon:"📵", title:"Phone-Free Hour",          desc:"One full hour with zero phone. No checking. Be fully present and notice what thoughts arise.", xp:60 },
    { icon:"🙅", title:"Say No Once",              desc:"Say no to something you would normally say yes to just to please someone. Practice your boundary.", xp:70 },
    { icon:"😊", title:"Smile First",              desc:"For the entire day, smile first in every interaction. Lead with warmth and positive energy.", xp:35 },
    { icon:"📞", title:"Call Instead of Text",     desc:"Make an actual phone call instead of texting for every important conversation today.", xp:45 },
    { icon:"🎯", title:"Speak Up Once",            desc:"Say something in a group setting today, even just one sentence. Practice using your voice.", xp:80 },
  ];

  const todayChallenge = CHALLENGES[new Date().getDay() % CHALLENGES.length];

  const QUOTES = [
    { q:"The pain you feel today is the strength you will feel tomorrow.", a:"Arnold Schwarzenegger" },
    { q:"You have to expect things of yourself before you can do them.", a:"Michael Jordan" },
    { q:"Success is the sum of small efforts repeated day in and day out.", a:"Robert Collier" },
    { q:"Push yourself, because no one else is going to do it for you.", a:"Unknown" },
    { q:"The secret of getting ahead is getting started.", a:"Mark Twain" },
    { q:"Do not watch the clock; do what it does. Keep going.", a:"Sam Levenson" },
    { q:"What is not started today is never finished tomorrow.", a:"Goethe" },
    { q:"The harder you work for something, the greater you will feel when you achieve it.", a:"Unknown" },
  ];

  const genAffirmations = async () => {
    setLoading(true); setAffirm("");
    try {
      const txt = await callClaude("Generate 10 powerful, specific daily affirmations for someone focused on self-improvement, fitness, and becoming their best self. Make them present tense (I am, I have), specific and visceral, not generic. Cover confidence, body, discipline, relationships, success. Format as a numbered list.", 500);
      setAffirm(txt);
    } catch { setAffirm("Failed to generate."); }
    setLoading(false);
  };

  const reframeThought = async () => {
    if (!obstacle.trim()) { toast("Describe your obstacle first", "warning"); return; }
    setRLoad(true); setReframe("");
    try {
      const txt = await callClaude(`You are a CBT therapist and mindset coach. Help reframe this limiting belief: "${obstacle}". ${goal ? "Goal: " + goal : ""}.\n\nProvide:\nLIMITING BELIEF: [identify the core belief]\nTHE REFRAME: [powerful reframe of this thought]\nEVIDENCE AGAINST IT: [3 reasons this belief is not objectively true]\nEMPOWERING ALTERNATIVE: [a new belief to replace it]\nACTION STEP: [one small action to prove the new belief true]`, 450);
      setReframe(txt);
    } catch { setReframe("Failed."); }
    setRLoad(false);
  };

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="🧠" title="Mindset" sub="Rewire your mind for peak performance" />

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[["affirmations","Affirmations"],["reframe","Reframe"],["challenge","Challenge"],["quotes","Quotes"]].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:700, background: view === v ? `${T.purple}22` : T.surface2, border:`1px solid ${view === v ? T.purple : T.border}`, color: view === v ? T.purple : T.dim, transition:"all .18s" }}>{l}</button>
        ))}
      </div>

      {view === "affirmations" && (
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>AI Affirmation Generator</div>
          <div style={{ color:T.muted, fontSize:13, marginBottom:16, lineHeight:1.6 }}>Generate 10 powerful, personalized affirmations to reprogram your subconscious mind. Read them every morning.</div>
          <Btn onClick={genAffirmations} disabled={loading} style={{ width:"100%", justifyContent:"center", marginBottom:16 }}>
            {loading ? <><Spinner size={16} color="#fff" />Generating...</> : "Generate Affirmations"}
          </Btn>
          {affirm
            ? <pre style={{ whiteSpace:"pre-wrap", fontSize:13, lineHeight:2, fontFamily:"inherit" }}>{affirm}</pre>
            : !loading && <div style={{ textAlign:"center", padding:"20px 0", color:T.muted }}><div style={{ fontSize:40, marginBottom:10 }}>🧠</div><div style={{ fontSize:13 }}>Click to generate your personalized affirmations</div></div>
          }
        </Card>
      )}

      {view === "reframe" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Thought Reframing Tool</div>
            <div style={{ display:"grid", gap:14 }}>
              <Inp label="Your Goal (optional)" value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Build a great physique" />
              <Inp label="Limiting Belief / Obstacle" value={obstacle} onChange={e => setObs(e.target.value)} placeholder="e.g. I am not disciplined enough..." rows={4} />
              <Btn onClick={reframeThought} disabled={rLoad || !obstacle.trim()} style={{ justifyContent:"center", width:"100%" }}>
                {rLoad ? <><Spinner size={16} color="#fff" />Reframing...</> : "Reframe My Belief"}
              </Btn>
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Reframe Result</div>
            {reframe
              ? <pre style={{ whiteSpace:"pre-wrap", fontSize:13, lineHeight:1.8, fontFamily:"inherit" }}>{reframe}</pre>
              : <div style={{ textAlign:"center", padding:"40px 20px", color:T.muted }}><div style={{ fontSize:40, marginBottom:12 }}>🔄</div><div style={{ fontWeight:600, marginBottom:6 }}>Enter a limiting belief</div><div style={{ fontSize:13 }}>AI will transform it into an empowering perspective</div></div>
            }
          </Card>
        </div>
      )}

      {view === "challenge" && (
        <div style={{ display:"grid", gap:16 }}>
          <Card accent={T.purple} style={{ padding:28 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:20, flexWrap:"wrap" }}>
              <div style={{ width:80, height:80, borderRadius:20, background:`${T.purple}22`, border:`2px solid ${T.purple}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, flexShrink:0 }}>{todayChallenge.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <Badge label="TODAY" color={T.purple} />
                  <Badge label={`+${todayChallenge.xp} XP`} color={T.yellow} />
                </div>
                <div style={{ fontSize:20, fontWeight:800, marginBottom:8 }}>{todayChallenge.title}</div>
                <div style={{ fontSize:14, color:T.dim, lineHeight:1.7, marginBottom:16 }}>{todayChallenge.desc}</div>
                <Btn onClick={() => { setAccepted(true); toast(todayChallenge.title + " accepted!", "achievement", todayChallenge.xp); }} disabled={accepted} variant={accepted ? "success" : "primary"}>
                  {accepted ? "Challenge Accepted!" : "Accept Challenge"}
                </Btn>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>All Challenges</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {CHALLENGES.map((c, i) => (
                <div key={i} style={{ padding:"14px 16px", background:T.surface2, borderRadius:14, border:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <span style={{ fontSize:24 }}>{c.icon}</span>
                    <Badge label={`+${c.xp} XP`} color={T.yellow} />
                  </div>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{c.title}</div>
                  <div style={{ fontSize:11, color:T.muted, lineHeight:1.5 }}>{c.desc.slice(0, 80)}...</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {view === "quotes" && (
        <div style={{ display:"grid", gap:14 }}>
          {QUOTES.map((q, i) => (
            <Card key={i} style={{ padding:24 }}>
              <div style={{ fontSize:18, fontWeight:600, lineHeight:1.6, color:T.text, fontStyle:"italic", marginBottom:12 }}>{q.q}</div>
              <div style={{ fontSize:13, color:T.purple, fontWeight:700 }}>— {q.a}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── VOICE COACH ──────────────────────────────────────────────────────────────
function VoiceCoach() {
  const [recording, setRec]     = useState(false);
  const [transcript,setTrans]   = useState("");
  const [feedback,  setFeedback]= useState("");
  const [analyzing, setAnal]    = useState(false);
  const [typed,     setTyped]   = useState("");
  const [mode,      setMode]    = useState("record");
  const rRef = useRef();

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast("Speech recognition not supported here", "warning"); return; }
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = "en-US";
    r.onresult = e => { let t = ""; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript; setTrans(p => p + " " + t); };
    r.onend = () => setRec(false);
    r.start(); rRef.current = r; setRec(true); setTrans(""); setFeedback("");
  };
  const stop = () => { rRef.current && rRef.current.stop(); setRec(false); };

  const analyze = async () => {
    const text = (mode === "record" ? transcript : typed).trim();
    if (!text) { toast("No text to analyze", "warning"); return; }
    setAnal(true); setFeedback("");
    try {
      const txt = await callClaude(`You are a professional speaking coach. Analyze this spoken text: "${text}"\n\nProvide:\nVOICE SCORE: [X]/100\nClarity: [X]/10 - [note]\nConfidence: [X]/10 - [note]\nVocabulary: [X]/10 - [note]\nStructure: [X]/10 - [note]\nFiller Words: [X]/10 - [note]\n\nSTRENGTHS:\n[2-3 specific positives]\n\nIMPROVE:\n[2-3 specific areas]\n\nDAILY EXERCISES:\n[3 specific voice drills]\n\nKEY TIP:\n[One impactful insight]`, 700);
      setFeedback(txt);
      toast("Voice analysis done!", "achievement", 40);
    } catch { setFeedback("Analysis failed."); }
    setAnal(false);
  };

  const PROMPTS = [
    "Tell me about a goal you are working towards.",
    "Describe your perfect day in detail.",
    "Explain why fitness is important to you.",
    "Talk about a challenge you overcame recently.",
  ];

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="🎙️" title="Voice Coach" sub="Analyze and improve your speaking with AI" />

      <div style={{ display:"flex", gap:8 }}>
        {[["record","Record"],["prompt","Prompts"],["type","Type"]].map(([v, l]) => (
          <button key={v} onClick={() => setMode(v)} style={{ padding:"8px 16px", borderRadius:10, fontSize:13, fontWeight:700, background: mode === v ? `${T.purple}22` : T.surface2, border:`1px solid ${mode === v ? T.purple : T.border}`, color: mode === v ? T.purple : T.dim, transition:"all .18s" }}>{l}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <Card>
          {mode === "record" && (
            <div>
              <div style={{ textAlign:"center", padding:"24px 0 20px" }}>
                <div style={{ position:"relative", display:"inline-block", marginBottom:20 }}>
                  <div onClick={recording ? stop : start} style={{ width:100, height:100, borderRadius:"50%", background: recording ? `${T.red}22` : `${T.purple}22`, border:`3px solid ${recording ? T.red : T.purple}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, cursor:"pointer", transition:"all .3s", animation: recording ? "glow 1.2s ease infinite" : "none" }}>🎤</div>
                  {recording && <div style={{ position:"absolute", inset:-8, borderRadius:"50%", border:`2px solid ${T.red}44`, animation:"ring 1.5s ease infinite" }} />}
                </div>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>{recording ? "Recording..." : "Tap to Record"}</div>
                <div style={{ fontSize:13, color:T.muted }}>{recording ? "Speak clearly, tap again to stop" : "Start speaking for AI feedback"}</div>
              </div>
              {transcript && <div style={{ padding:14, background:T.surface2, borderRadius:12, fontSize:13, lineHeight:1.7, color:T.dim, maxHeight:100, overflowY:"auto" }}>{transcript}</div>}
            </div>
          )}
          {mode === "prompt" && (
            <div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Speaking Prompts</div>
              {PROMPTS.map((p, i) => (
                <button key={i} onClick={() => { setTrans("Answer: " + p + " — "); setMode("record"); }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.purple; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"11px 14px", borderRadius:10, marginBottom:8, background:T.surface2, border:`1px solid ${T.border}`, color:T.dim, fontSize:13, transition:"all .18s" }}>
                  {p}
                </button>
              ))}
            </div>
          )}
          {mode === "type" && (
            <div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Type a Speech Sample</div>
              <Inp value={typed} onChange={e => setTyped(e.target.value)} placeholder="Paste or type a speech sample to analyze..." rows={8} />
            </div>
          )}
          <div style={{ marginTop:16 }}>
            <Btn onClick={analyze} disabled={analyzing || (!transcript && !typed)} style={{ width:"100%", justifyContent:"center" }}>
              {analyzing ? <><Spinner size={15} color="#fff" />Analyzing...</> : "Analyze My Speaking"}
            </Btn>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>AI Feedback</div>
          {feedback
            ? <pre style={{ whiteSpace:"pre-wrap", fontSize:13, lineHeight:1.75, color:T.text, fontFamily:"inherit" }}>{feedback}</pre>
            : <div style={{ textAlign:"center", padding:"40px 20px", color:T.muted }}><div style={{ fontSize:44, marginBottom:12 }}>🎙️</div><div style={{ fontWeight:600, marginBottom:6 }}>Ready to analyze</div><div style={{ fontSize:13 }}>Record or type, then click Analyze</div></div>
          }
        </Card>
      </div>
    </div>
  );
}

// ─── BREATHING ────────────────────────────────────────────────────────────────
function Breathing() {
  const EX = [
    { id:"478", name:"4-7-8",         desc:"Calm anxiety, aid sleep",       inhale:4, hold:7, exhale:8, color:T.teal,   rounds:4 },
    { id:"box", name:"Box Breathing", desc:"Focus and clarity",              inhale:4, hold:4, exhale:4, color:T.blue,   rounds:4 },
    { id:"wim", name:"Wim Hof",       desc:"Energy and immune boost",        inhale:2, hold:0, exhale:2, color:T.orange, rounds:3 },
    { id:"rel", name:"2:1 Relax",     desc:"Parasympathetic activation",     inhale:4, hold:0, exhale:8, color:T.purple, rounds:6 },
    { id:"dph", name:"Diaphragmatic", desc:"Stress reduction",               inhale:5, hold:2, exhale:6, color:T.green,  rounds:5 },
  ];

  const [sel,   setSel]  = useState(EX[0]);
  const [phase, setPhase]= useState("ready");
  const [count, setCount]= useState(0);
  const [round, setRound]= useState(0);
  const [active,setAct]  = useState(false);
  const [sessions,setSes]= usePersist("cai_breath", 0);
  const tRef = useRef();

  useEffect(() => {
    if (!active) return;
    const phases = [{ name:"inhale", dur:sel.inhale }, ...(sel.hold > 0 ? [{ name:"hold", dur:sel.hold }] : []), { name:"exhale", dur:sel.exhale }];
    let pi = 0, ci = 0;
    setPhase(phases[0].name); setCount(phases[0].dur);
    tRef.current = setInterval(() => {
      ci++;
      if (ci >= phases[pi].dur) {
        pi = (pi + 1) % phases.length;
        if (pi === 0) {
          setRound(r => {
            const nr = r + 1;
            if (nr >= sel.rounds) { clearInterval(tRef.current); setAct(false); setPhase("done"); setSes(s => s + 1); toast("Session complete!", "achievement", 30); }
            return nr;
          });
        }
        ci = 0; setPhase(phases[pi].name); setCount(phases[pi].dur);
      } else { setCount(phases[pi].dur - ci); }
    }, 1000);
    return () => clearInterval(tRef.current);
  }, [active]);

  const stop = () => { clearInterval(tRef.current); setAct(false); setPhase("ready"); setRound(0); setCount(0); };

  const PC = { ready:{ label:"Ready", color:T.muted, scale:1 }, inhale:{ label:"Inhale", color:T.teal, scale:1.25 }, hold:{ label:"Hold", color:T.yellow, scale:1.25 }, exhale:{ label:"Exhale", color:T.blue, scale:.85 }, done:{ label:"Done", color:T.green, scale:1 } };
  const pc = PC[phase] || PC.ready;
  const phaseEmoji = { ready:"🧘", inhale:"🌬️", hold:"😤", exhale:"💨", done:"✨" };

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="🌬️" title="Breathing Exercises" sub="Reduce stress, sharpen focus, improve recovery" />

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:16 }}>
        <div style={{ display:"grid", gap:10 }}>
          {EX.map(ex => (
            <Card key={ex.id} onClick={() => { if (!active) { setSel(ex); setPhase("ready"); setRound(0); } }} accent={sel.id === ex.id ? ex.color : null} style={{ padding:14, cursor:"pointer", borderColor: sel.id === ex.id ? `${ex.color}66` : T.border }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{ex.name}</div>
                  <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>{ex.desc}</div>
                  <div style={{ fontSize:11, color:ex.color, marginTop:5, fontFamily:"'DM Mono',monospace" }}>{ex.inhale}s in {ex.hold ? `· ${ex.hold}s hold ` : ""}· {ex.exhale}s out x {ex.rounds}</div>
                </div>
                {sel.id === ex.id && <div style={{ width:8, height:8, borderRadius:"50%", background:ex.color }} />}
              </div>
            </Card>
          ))}
        </div>

        <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, padding:36, minHeight:400 }}>
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {active && <div style={{ position:"absolute", width:180, height:180, borderRadius:"50%", border:`2px solid ${sel.color}33`, animation:"ring 2.5s ease infinite" }} />}
            <div style={{ width:160, height:160, borderRadius:"50%", background:`radial-gradient(circle,${sel.color}44,${sel.color}11)`, border:`3px solid ${pc.color}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, transform:`scale(${pc.scale})`, transition:"transform 1s ease,border-color .5s ease" }}>
              <div style={{ fontSize:40, lineHeight:1 }}>{phaseEmoji[phase] || "🧘"}</div>
              {active && count > 0 && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:28, fontWeight:900, color:pc.color }}>{count}</div>}
              <div style={{ fontSize:14, fontWeight:700, color:pc.color }}>{pc.label}</div>
            </div>
          </div>

          {active && (
            <div style={{ width:"100%", textAlign:"center" }}>
              <div style={{ fontSize:13, color:T.muted, marginBottom:8 }}>Round {round + 1} of {sel.rounds}</div>
              <ProgressBar value={round} max={sel.rounds} color={sel.color} height={5} />
            </div>
          )}

          <div style={{ display:"flex", gap:10 }}>
            {!active && phase !== "done" && <Btn onClick={() => { setAct(true); setRound(0); }} style={{ background:`linear-gradient(135deg,${sel.color},${sel.color}99)`, border:"none" }}>Start Session</Btn>}
            {active && <Btn onClick={stop} variant="danger">Stop</Btn>}
            {phase === "done" && <Btn onClick={() => setPhase("ready")} variant="success">Again</Btn>}
          </div>

          <div style={{ textAlign:"center", fontSize:13, color:T.muted }}>
            <span style={{ color:T.green, fontWeight:700 }}>{sessions}</span> sessions completed
          </div>
        </Card>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {[{ icon:"😌", title:"Reduces Cortisol", desc:"Lowers stress hormones within minutes", color:T.teal }, { icon:"🎯", title:"Sharpens Focus", desc:"Increases oxygen to prefrontal cortex", color:T.blue }, { icon:"💪", title:"Boosts Recovery", desc:"Activates parasympathetic healing mode", color:T.green }].map(b => (
          <Card key={b.title} accent={b.color} style={{ padding:18, textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{b.icon}</div>
            <div style={{ fontWeight:700, fontSize:13, color:b.color, marginBottom:4 }}>{b.title}</div>
            <div style={{ fontSize:12, color:T.muted, lineHeight:1.5 }}>{b.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── FOCUS MODE ───────────────────────────────────────────────────────────────
function FocusMode() {
  const TIMERS = { pomodoro:{ label:"Pomodoro", mins:25, color:T.red }, short:{ label:"Short Break", mins:5, color:T.green }, long:{ label:"Long Break", mins:15, color:T.blue }, deep:{ label:"Deep Work", mins:90, color:T.purple }, custom:{ label:"Custom", mins:45, color:T.orange } };
  const [type,  setType]  = useState("pomodoro");
  const [left,  setLeft]  = useState(25 * 60);
  const [run,   setRun]   = useState(false);
  const [sess,  setSess]  = useState(1);
  const [total, setTotal] = usePersist("cai_focus", 0);
  const [goals, setGoals] = usePersist("cai_fgoals", []);
  const [ng,    setNg]    = useState("");
  const iRef = useRef();

  useEffect(() => {
    if (run) iRef.current = setInterval(() => {
      setLeft(t => {
        if (t <= 1) { clearInterval(iRef.current); setRun(false); setTotal(s => s + 1); setSess(s => s + 1); toast("Focus session done!", "achievement", 50); return TIMERS[type].mins * 60; }
        return t - 1;
      });
    }, 1000);
    else clearInterval(iRef.current);
    return () => clearInterval(iRef.current);
  }, [run, type]);

  const reset = () => { clearInterval(iRef.current); setRun(false); setLeft(TIMERS[type].mins * 60); };
  const sw    = t  => { reset(); setType(t); setLeft(TIMERS[t].mins * 60); };
  const mins  = Math.floor(left / 60);
  const secs  = left % 60;
  const prog  = 1 - left / (TIMERS[type].mins * 60);
  const c     = TIMERS[type].color;
  const R     = 90;
  const circ  = 2 * Math.PI * R;

  const addGoal = () => { if (ng.trim()) { setGoals(g => [...g, { id:Date.now(), text:ng, done:false }]); setNg(""); } };

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="🎯" title="Focus Mode" sub="Deep work sessions with Pomodoro timer" />

      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:16 }}>
        <Card style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, padding:36, minHeight:420 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"center" }}>
            {Object.entries(TIMERS).map(([k, v]) => (
              <button key={k} onClick={() => sw(k)} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:700, background: type === k ? `${v.color}22` : T.surface2, border:`1px solid ${type === k ? v.color : T.border}`, color: type === k ? v.color : T.dim, transition:"all .18s" }}>{v.label}</button>
            ))}
          </div>

          <div style={{ position:"relative" }}>
            <svg width={220} height={220} style={{ transform:"rotate(-90deg)" }}>
              <circle cx={110} cy={110} r={R} fill="none" stroke={T.border} strokeWidth={12} />
              <circle cx={110} cy={110} r={R} fill="none" stroke={c} strokeWidth={12} strokeDasharray={`${circ * prog} ${circ}`} strokeLinecap="round" style={{ transition:"stroke-dasharray .5s ease" }} />
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:42, fontWeight:900, color:c }}>{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</div>
              <div style={{ fontSize:13, color:T.muted }}>Session {sess}</div>
            </div>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={() => setRun(r => !r)} style={{ background:`linear-gradient(135deg,${c},${c}99)`, border:"none", minWidth:100, justifyContent:"center" }}>{run ? "Pause" : "Start"}</Btn>
            <Btn onClick={reset} variant="ghost">Reset</Btn>
          </div>
          <div style={{ fontSize:13, color:T.muted }}>Total: <span style={{ color:T.green, fontWeight:700 }}>{total}</span> sessions</div>
        </Card>

        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Session Goals</div>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            <input value={ng} onChange={e => setNg(e.target.value)} onKeyDown={e => e.key === "Enter" && addGoal()} placeholder="What will you accomplish?" style={{ flex:1, background:T.surface2, border:`1px solid ${T.border}`, borderRadius:10, padding:"9px 13px", color:T.text, fontSize:13 }} />
            <Btn onClick={addGoal} size="sm" disabled={!ng.trim()}>+</Btn>
          </div>
          <div style={{ display:"grid", gap:8, maxHeight:280, overflowY:"auto" }}>
            {goals.map(g => (
              <div key={g.id} onClick={() => setGoals(gs => gs.map(x => x.id === g.id ? { ...x, done:!x.done } : x))} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, cursor:"pointer", background: g.done ? `${T.green}12` : T.surface2, border:`1px solid ${g.done ? T.green + "44" : T.border}`, transition:"all .18s" }}>
                <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${g.done ? T.green : T.border}`, background: g.done ? T.green : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0, color:"#fff" }}>{g.done ? "✓" : ""}</div>
                <span style={{ flex:1, fontSize:13, fontWeight:500, textDecoration: g.done ? "line-through" : "none", color: g.done ? T.muted : T.text }}>{g.text}</span>
                <button onClick={e => { e.stopPropagation(); setGoals(gs => gs.filter(x => x.id !== g.id)); }} style={{ color:T.muted, fontSize:12 }}>x</button>
              </div>
            ))}
            {goals.length === 0 && <div style={{ textAlign:"center", color:T.muted, fontSize:13, padding:20 }}>Add goals for this session</div>}
          </div>
          <div style={{ marginTop:16, padding:14, background:`${T.purple}12`, borderRadius:12, border:`1px solid ${T.purple}33` }}>
            <div style={{ fontWeight:700, fontSize:13, color:T.purple, marginBottom:8 }}>Focus Tips</div>
            {["Put your phone in another room","Close all unnecessary tabs","Set a clear intention first","Take breaks seriously - step away completely"].map((t, i) => (
              <div key={i} style={{ fontSize:12, color:T.dim, padding:"4px 0", borderBottom: i < 3 ? `1px solid ${T.border}22` : "none" }}>• {t}</div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── AI COACH ─────────────────────────────────────────────────────────────────
function AICoach({ user }) {
  const [msgs,  setMsgs] = useState([{ role:"assistant", content:`Hey ${user.name}! I am your personal AI coach. Fitness, nutrition, mindset, style, confidence — I have got you. What are we working on today? 💪` }]);
  const [input, setInput]= useState("");
  const [load,  setLoad] = useState(false);
  const [mode,  setMode] = useState("general");
  const endRef = useRef();
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const MODES = [
    { id:"general",   icon:"🤖", label:"Coach",     sys:`You are an elite personal development coach for ${user.name}. Be direct, motivating, give specific actionable advice. Keep under 200 words.` },
    { id:"fitness",   icon:"💪", label:"Fitness",   sys:`You are an expert personal trainer for ${user.name}. Give science-based specific training advice. Keep under 200 words.` },
    { id:"nutrition", icon:"🥗", label:"Nutrition", sys:`You are a certified sports nutritionist for ${user.name}. Give specific macro targets and meal advice. Keep under 200 words.` },
    { id:"mindset",   icon:"🧠", label:"Mindset",   sys:`You are a performance psychologist coaching ${user.name}. Help overcome mental blocks. Keep under 200 words.` },
    { id:"style",     icon:"👔", label:"Style",     sys:`You are a top personal stylist for ${user.name}. Give specific fashion and grooming advice. Keep under 200 words.` },
    { id:"social",    icon:"⭐", label:"Social",    sys:`You are a social confidence coach for ${user.name}. Give practical advice for confidence and presence. Keep under 200 words.` },
  ];

  const send = async () => {
    if (!input.trim() || load) return;
    const msg = input.trim(); setInput("");
    setMsgs(m => [...m, { role:"user", content:msg }]); setLoad(true);
    const history = [...msgs, { role:"user", content:msg }].slice(-14);
    try {
      const sys = MODES.find(m => m.id === mode)?.sys || MODES[0].sys;
      const txt = await callClaudeWithSystem(sys, history);
      setMsgs(m => [...m, { role:"assistant", content:txt || "Try again." }]);
    } catch { setMsgs(m => [...m, { role:"assistant", content:"Connection issue. Try again." }]); }
    setLoad(false);
  };

  const SUGGS = ["What should I eat to build muscle?","Give me a morning routine","How to improve confidence?","Best supplements that work?","How to fix bad posture?","I am feeling unmotivated, help"];

  return (
    <div className="fade-up" style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 120px)", gap:14 }}>
      <SectionHead icon="🤖" title="AI Coach" sub="Your personal coach, available 24/7" />
      <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{ padding:"7px 14px", borderRadius:10, fontSize:13, fontWeight:600, whiteSpace:"nowrap", background: mode === m.id ? `${T.purple}22` : T.surface2, border:`1px solid ${mode === m.id ? T.purple : T.border}`, color: mode === m.id ? T.purple : T.dim, transition:"all .18s" }}>{m.icon} {m.label}</button>
        ))}
      </div>
      <div style={{ flex:1, background:T.surface, border:`1px solid ${T.border}`, borderRadius:20, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>
        <div style={{ flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:14 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display:"flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation:"fadeUp .3s ease both" }}>
              {m.role === "assistant" && <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${T.purple},${T.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, marginRight:10, flexShrink:0, alignSelf:"flex-end" }}>🤖</div>}
              <div style={{ maxWidth:"76%", padding:"12px 16px", fontSize:14, lineHeight:1.65, whiteSpace:"pre-wrap", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? `linear-gradient(135deg,${T.purple},${T.blue})` : T.surface2, border:`1px solid ${m.role === "user" ? "transparent" : T.border}` }}>{m.content}</div>
            </div>
          ))}
          {load && (
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${T.purple},${T.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🤖</div>
              <div style={{ padding:"12px 16px", background:T.surface2, borderRadius:"18px 18px 18px 4px", border:`1px solid ${T.border}`, display:"flex", gap:5, alignItems:"center" }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:T.purple, animation:`pulse 1s ease ${i * .15}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        {msgs.length <= 1 && (
          <div style={{ padding:"0 16px 10px", display:"flex", gap:7, flexWrap:"wrap" }}>
            {SUGGS.map(s => (
              <button key={s} onClick={() => setInput(s)}
                onMouseEnter={e => { e.target.style.borderColor = T.purple; e.target.style.color = T.purple; }}
                onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.dim; }}
                style={{ padding:"6px 12px", borderRadius:10, fontSize:12, fontWeight:600, background:T.surface2, border:`1px solid ${T.border}`, color:T.dim, transition:"all .18s" }}>{s}</button>
            ))}
          </div>
        )}
        <div style={{ padding:16, borderTop:`1px solid ${T.border}`, display:"flex", gap:10 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder={`Ask your ${MODES.find(m => m.id === mode)?.label} coach...`} style={{ flex:1, background:T.surface2, border:`1px solid ${T.border}`, borderRadius:12, padding:"11px 16px", color:T.text, fontSize:14 }} />
          <Btn onClick={send} disabled={load || !input.trim()}>Send</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── SOCIAL ───────────────────────────────────────────────────────────────────
function Social({ user }) {
  const friends = [
    { name:"Aisha K.",  streak:31, level:15, score:95, avatar:"A", color:T.purple, status:"online" },
    { name:"Marcus J.", streak:24, level:12, score:89, avatar:"M", color:T.orange, status:"online" },
    { name:"Sophie L.", streak:18, level:10, score:78, avatar:"S", color:T.green,  status:"away" },
    { name:"Carlos R.", streak:8,  level:7,  score:62, avatar:"C", color:T.blue,   status:"offline" },
    { name:"Tyler B.",  streak:3,  level:4,  score:45, avatar:"T", color:T.yellow, status:"offline" },
  ];
  const me  = { name:user.name, streak:user.streak, level:user.level, score:74, avatar:user.name[0], color:T.purple, isMe:true, status:"online" };
  const all = [me, ...friends].sort((a, b) => b.score - a.score);
  const myRank = all.findIndex(u => u.isMe) + 1;
  const MEDALS = ["🥇","🥈","🥉"];

  const challenges = [
    { title:"30-Day Consistency", icon:"🔥", progress:14, total:30, color:T.purple, reward:"500 XP", participants:142 },
    { title:"1000 Push-Ups Month",icon:"💪", progress:420,total:1000,color:T.blue,  reward:"300 XP", participants:87 },
    { title:"7-Day Meal Prep",    icon:"🥗", progress:5,  total:7,  color:T.green,  reward:"200 XP", participants:203 },
    { title:"Cold Shower Streak", icon:"🚿", progress:8,  total:21, color:T.teal,   reward:"400 XP", participants:56 },
  ];

  const feed = [
    { user:"Aisha K.",  action:"hit a new squat PR of 85kg",             time:"1h ago", color:T.purple },
    { user:"Marcus J.", action:"completed the 30-day consistency badge",  time:"3h ago", color:T.orange },
    { user:"Sophie L.", action:"logged 7 meals in a row",                 time:"5h ago", color:T.green },
    { user:"Carlos R.", action:"started the Cold Shower challenge",        time:"8h ago", color:T.blue },
  ];

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="👥" title="Social and Rankings" sub="Compete with friends, stay accountable" />

      <Card accent={T.purple} style={{ display:"flex", alignItems:"center", gap:20, padding:22, flexWrap:"wrap" }}>
        <Ring score={myRank} max={all.length} size={80} color={T.purple} label="Rank" />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:22, fontWeight:900 }}>#{myRank} on Leaderboard</div>
          <div style={{ color:T.muted, fontSize:13, marginTop:4 }}>Ahead of {all.length - myRank} people — keep pushing!</div>
        </div>
        <div style={{ display:"flex", gap:14 }}>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:20, fontWeight:800, color:T.yellow }}>{user.xp}</div><div style={{ fontSize:11, color:T.muted }}>XP</div></div>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:20, fontWeight:800, color:T.orange }}>{user.streak}🔥</div><div style={{ fontSize:11, color:T.muted }}>Streak</div></div>
        </div>
      </Card>

      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:16 }}>
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Weekly Leaderboard</div>
          <div style={{ display:"grid", gap:8 }}>
            {all.map((u, i) => (
              <div key={u.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:14, background: u.isMe ? `${T.purple}15` : T.surface2, border:`1px solid ${u.isMe ? T.purple + "44" : T.border}`, transition:"all .18s" }}>
                <div style={{ width:26, fontWeight:900, fontSize:15, color: i < 3 ? [T.yellow, T.dim, "#CD7F32"][i] : T.muted, fontFamily:"'DM Mono',monospace", textAlign:"center", flexShrink:0 }}>{i < 3 ? MEDALS[i] : i + 1}</div>
                <div style={{ position:"relative" }}>
                  <Avatar name={u.avatar} size={36} color={u.color} />
                  <div style={{ position:"absolute", bottom:0, right:0, width:10, height:10, borderRadius:"50%", background: u.status === "online" ? T.green : u.status === "away" ? T.yellow : T.border, border:`2px solid ${T.surface2}` }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{u.name}{u.isMe ? " (You)" : ""}</div>
                  <div style={{ fontSize:11, color:T.muted }}>Lv.{u.level} · {u.streak}🔥</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:800, color:u.color, fontFamily:"'DM Mono',monospace", fontSize:16 }}>{u.score}</div>
                  <div style={{ fontSize:10, color:T.muted }}>score</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Activity Feed</div>
          <div style={{ display:"grid", gap:10 }}>
            {feed.map((a, i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 0", borderBottom: i < feed.length - 1 ? `1px solid ${T.border}22` : "none" }}>
                <Avatar name={a.user[0]} size={30} color={a.color} />
                <div style={{ flex:1 }}>
                  <span style={{ fontWeight:600, fontSize:12 }}>{a.user} </span>
                  <span style={{ fontSize:12, color:T.dim }}>{a.action}</span>
                  <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Active Challenges</div>
        <div style={{ display:"grid", gap:10 }}>
          {challenges.map(c => (
            <div key={c.title} style={{ padding:16, background:T.surface2, borderRadius:14, border:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:22 }}>{c.icon}</span>
                  <div><div style={{ fontWeight:700, fontSize:14 }}>{c.title}</div><div style={{ fontSize:12, color:T.muted }}>{c.participants} participants</div></div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <Badge label={c.reward} color={c.color} />
                  <Btn size="sm" variant="outline" style={{ fontSize:11 }}>Join</Btn>
                </div>
              </div>
              <ProgressBar value={c.progress} max={c.total} color={c.color} label={`${c.progress}/${c.total}`} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
function ProgressMiniChart({ data, color, label, unit, w = 280, h = 70 }) {
  const mn = Math.min(...data) - 2;
  const mx = Math.max(...data) + 2;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 10) + 5;
    const y = h - 5 - ((v - mn) / (mx - mn)) * (h - 10);
    return `${x},${y}`;
  }).join(" ");
  const gid = `gc${color.replace("#", "")}`;
  const WL = ["W1","W2","W3","W4","W5","W6","W7","W8"];
  return (
    <div>
      {label && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:13, color:T.dim }}>{label}</span>
          <span style={{ fontWeight:800, color, fontFamily:"'DM Mono',monospace", fontSize:14 }}>{data[data.length - 1]}{unit}</span>
        </div>
      )}
      <svg width={w} height={h} style={{ overflow:"visible", display:"block" }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`5,${h} ${pts} ${w - 5},${h}`} fill={`url(#${gid})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((v, i) => {
          const x = (i / (data.length - 1)) * (w - 10) + 5;
          const y = h - 5 - ((v - mn) / (mx - mn)) * (h - 10);
          return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />;
        })}
      </svg>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
        {WL.map(w2 => <span key={w2} style={{ fontSize:9, color:T.muted }}>{w2}</span>)}
      </div>
    </div>
  );
}

function Progress({ user }) {
  const scoreD  = [54,61,59,68,67,72,71,77];
  const weightD = [83,82.5,82,81,80.5,80,79.5,79];
  const bfD     = [22,21.5,21,20.5,20,19.5,19.2,18.8];

  const areas = [
    { area:"Physical Fitness",   score:82, icon:"💪", color:T.purple,  change:+5 },
    { area:"Nutrition",          score:71, icon:"🥗", color:T.green,   change:+8 },
    { area:"Mental Health",      score:68, icon:"🧠", color:T.blue,    change:+3 },
    { area:"Social Skills",      score:55, icon:"👥", color:T.orange,  change:+12 },
    { area:"Style and Grooming", score:78, icon:"👔", color:T.yellow,  change:+2 },
    { area:"Sleep Quality",      score:85, icon:"😴", color:T.teal,    change:-1 },
    { area:"Voice and Speaking", score:61, icon:"🎙️", color:T.pink,    change:+7 },
    { area:"Focus Discipline",   score:74, icon:"🎯", color:T.red,     change:+10 },
  ];

  const achievements = [
    { icon:"🔥", label:"7-Day Streak",    color:T.orange, earned:true },
    { icon:"💪", label:"First PR",         color:T.purple, earned:true },
    { icon:"🥗", label:"Clean Week",       color:T.green,  earned:true },
    { icon:"🏆", label:"Top 10 Rank",      color:T.yellow, earned:true },
    { icon:"🎯", label:"30-Day Challenge", color:T.blue,   earned:false },
    { icon:"🚀", label:"Level 10",         color:T.purple, earned:false },
    { icon:"💎", label:"Perfect Month",    color:T.blue,   earned:false },
    { icon:"👑", label:"Elite Performer",  color:T.yellow, earned:false },
    { icon:"🌟", label:"100 Sessions",     color:T.teal,   earned:false },
    { icon:"⚡", label:"1000 XP Day",      color:T.orange, earned:false },
    { icon:"🎙️", label:"Voice Master",    color:T.pink,   earned:false },
    { icon:"🧘", label:"Breath Guru",      color:T.teal,   earned:false },
  ];

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="📈" title="Progress Tracker" sub="Your 8-week transformation at a glance" />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {[{ data:scoreD, color:T.purple, label:"Overall Score", unit:" pts" }, { data:weightD, color:T.blue, label:"Body Weight", unit:" kg" }, { data:bfD, color:T.green, label:"Body Fat Est.", unit:"%" }].map(c => (
          <Card key={c.label} style={{ padding:18 }}>
            <ProgressMiniChart {...c} />
            <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", fontSize:12, color:T.muted }}>
              <span>Start: {c.data[0]}{c.unit}</span>
              <span style={{ color:T.green }}>Change: {Math.abs(c.data[c.data.length - 1] - c.data[0]).toFixed(1)}{c.unit}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Focus Area Breakdown</div>
        <div style={{ display:"grid", gap:13 }}>
          {areas.map(a => (
            <div key={a.area} style={{ display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ fontSize:20, width:26, textAlign:"center" }}>{a.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:14, fontWeight:500 }}>{a.area}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, color: a.change >= 0 ? T.green : T.red, fontWeight:700 }}>{a.change >= 0 ? "+" : ""}{a.change}</span>
                    <span style={{ fontWeight:800, color:a.color, fontFamily:"'DM Mono',monospace", fontSize:14 }}>{a.score}</span>
                  </div>
                </div>
                <ProgressBar value={a.score} color={a.color} height={6} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Achievements</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10 }}>
          {achievements.map(a => (
            <div key={a.label} title={a.label} style={{ textAlign:"center", padding:"14px 6px", borderRadius:14, background: a.earned ? `${a.color}15` : T.surface2, border:`1px solid ${a.earned ? a.color + "55" : T.border}`, opacity: a.earned ? 1 : .45, transition:"all .2s" }}>
              <div style={{ fontSize:26, marginBottom:6, filter: a.earned ? "none" : "grayscale(1)" }}>{a.icon}</div>
              <div style={{ fontSize:10, fontWeight:700, color: a.earned ? a.color : T.muted, lineHeight:1.3 }}>{a.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card accent={T.green}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>Progress Photos</div>
        <div style={{ color:T.muted, fontSize:13, marginBottom:14 }}>Take weekly photos in consistent lighting to track your transformation.</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {["Week 1","Week 2","Week 4","Week 8"].map(w => (
            <div key={w}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.green; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
              style={{ aspectRatio:"3/4", background:T.surface2, borderRadius:12, border:`2px dashed ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, cursor:"pointer", transition:"all .2s" }}>
              <div style={{ fontSize:24 }}>📷</div>
              <div style={{ fontSize:11, color:T.muted, fontWeight:600 }}>{w}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── GLOW UP SCORE ────────────────────────────────────────────────────────────
function GlowUpScore({ user }) {
  const [habits]  = usePersist("cai_habits",  []);
  const [meals]   = usePersist("cai_meals",   []);
  const [sleep]   = usePersist("cai_sleep",   []);
  const [wlog]    = usePersist("cai_wlog",    []);
  const [breath]  = usePersist("cai_breath",  0);
  const [focs]    = usePersist("cai_focus",   0);
  const [journal] = usePersist("cai_journal", []);
  const [aiScore, setAiScore] = useState("");
  const [loading, setLoading] = useState(false);

  const habitScore   = Math.round((habits.reduce((s, h) => s + h.history.filter(Boolean).length, 0) / ((habits.length * 7) || 1)) * 100);
  const nutritionScore = Math.min(meals.length * 10, 100);
  const sleepScore   = sleep.length > 0 ? Math.round((sleep.reduce((s, l) => s + l.quality, 0) / sleep.length) * 10) : 50;
  const fitnessScore = Math.min(wlog.length * 5, 100);
  const breathScore  = Math.min(breath * 20, 100);
  const focusScore   = Math.min(focs * 10, 100);
  const journalScore = Math.min(journal.length * 15, 100);
  const xpScore      = Math.min(user.xp / 10, 100);

  const areas = [
    { label:"Habits",       score:habitScore,    weight:.18, icon:"✅", color:T.purple },
    { label:"Fitness",      score:fitnessScore,  weight:.18, icon:"🏋️", color:T.blue },
    { label:"Nutrition",    score:nutritionScore,weight:.15, icon:"🥗", color:T.green },
    { label:"Sleep",        score:sleepScore,    weight:.15, icon:"😴", color:T.teal },
    { label:"Mindset",      score:journalScore,  weight:.12, icon:"🧠", color:T.yellow },
    { label:"Breathing",    score:breathScore,   weight:.08, icon:"🌬️", color:T.orange },
    { label:"Focus",        score:focusScore,    weight:.08, icon:"🎯", color:T.red },
    { label:"XP and Streak",score:xpScore,       weight:.06, icon:"⚡", color:T.pink },
  ];

  const totalScore = Math.round(areas.reduce((s, a) => s + (a.score * a.weight), 0));
  const grade = totalScore >= 90 ? { g:"S", c:T.yellow, l:"Elite" } : totalScore >= 80 ? { g:"A", c:T.green, l:"Advanced" } : totalScore >= 70 ? { g:"B", c:T.blue, l:"Intermediate" } : totalScore >= 60 ? { g:"C", c:T.orange, l:"Developing" } : { g:"D", c:T.red, l:"Beginner" };

  const getAI = async () => {
    setLoading(true); setAiScore("");
    const breakdown = areas.map(a => `${a.label}: ${a.score}/100`).join(", ");
    try {
      const txt = await callClaude(`You are an elite life performance coach. Analyze this Glow Up Score: Total ${totalScore}/100 (Grade ${grade.g} - ${grade.l}). Breakdown: ${breakdown}. User: Level ${user.level}, ${user.streak}-day streak, ${user.xp} XP.\n\nProvide:\nGLOW UP ASSESSMENT: [honest overall verdict]\nBIGGEST WINS: [top 2-3 things they are crushing]\nCRITICAL GAPS: [2-3 lowest scores and why they matter]\nTHIS WEEK PRIORITY: [single most impactful focus]\n30-DAY PLAN: [specific actions to raise score by 10 points]\nMOTIVATIONAL MESSAGE: [personalized send-off]`, 700);
      setAiScore(txt);
    } catch { setAiScore("Analysis failed."); }
    setLoading(false);
  };

  const GRADES = [{ g:"S", range:"90-100", c:T.yellow, l:"Elite" }, { g:"A", range:"80-89", c:T.green, l:"Advanced" }, { g:"B", range:"70-79", c:T.blue, l:"Intermediate" }, { g:"C", range:"60-69", c:T.orange, l:"Developing" }, { g:"D", range:"0-59", c:T.red, l:"Beginner" }];

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="🌟" title="Glow Up Score" sub="Your complete self-improvement performance rating" />

      <Card accent={grade.c} style={{ padding:32 }}>
        <div style={{ display:"flex", alignItems:"center", gap:32, flexWrap:"wrap" }}>
          <Ring score={totalScore} max={100} size={160} color={grade.c} label={grade.l} />
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
              <div style={{ width:64, height:64, borderRadius:16, background:`${grade.c}22`, border:`3px solid ${grade.c}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:900, color:grade.c, fontFamily:"'DM Mono',monospace" }}>{grade.g}</div>
              <div><div style={{ fontSize:28, fontWeight:900 }}>{grade.l} Level</div><div style={{ color:T.muted, fontSize:14 }}>Overall Glow Up Score</div></div>
            </div>
            <div style={{ fontSize:13, color:T.dim, lineHeight:1.7, marginBottom:16 }}>Your score is calculated from habits, fitness, nutrition, sleep, mindset, breathing, focus, and consistency.</div>
            <Btn onClick={getAI} disabled={loading}>{loading ? <><Spinner size={16} color="#fff" />Analyzing...</> : "Get Full AI Analysis"}</Btn>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Score Breakdown</div>
        <div style={{ display:"grid", gap:14 }}>
          {areas.sort((a, b) => b.score - a.score).map(a => (
            <div key={a.label} style={{ display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ fontSize:20, width:26, textAlign:"center" }}>{a.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:14, fontWeight:600 }}>{a.label}</span>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontSize:11, color:T.muted }}>weight: {Math.round(a.weight * 100)}%</span>
                    <span style={{ fontWeight:800, color:a.color, fontFamily:"'DM Mono',monospace", fontSize:14 }}>{a.score}</span>
                  </div>
                </div>
                <ProgressBar value={a.score} color={a.color} height={8} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Grade Scale</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
          {GRADES.map(gr => (
            <div key={gr.g} style={{ textAlign:"center", padding:"16px 8px", borderRadius:14, background: grade.g === gr.g ? `${gr.c}20` : T.surface2, border:`2px solid ${grade.g === gr.g ? gr.c : T.border}`, transition:"all .2s" }}>
              <div style={{ fontSize:28, fontWeight:900, color:gr.c, fontFamily:"'DM Mono',monospace" }}>{gr.g}</div>
              <div style={{ fontSize:12, fontWeight:700, color:gr.c, marginTop:4 }}>{gr.l}</div>
              <div style={{ fontSize:10, color:T.muted }}>{gr.range}</div>
            </div>
          ))}
        </div>
      </Card>

      {aiScore && (
        <Card className="scale-in" accent={grade.c}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${grade.c}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🌟</div>
            <div><div style={{ fontWeight:700 }}>Glow Up Report</div><div style={{ fontSize:12, color:grade.c }}>Powered by Claude AI</div></div>
          </div>
          <pre style={{ whiteSpace:"pre-wrap", lineHeight:1.8, fontSize:14, color:T.text, fontFamily:"inherit" }}>{aiScore}</pre>
        </Card>
      )}
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({ user, setUser }) {
  const [name,  setName]  = useState(user.name);
  const [age,   setAge]   = useState(user.age || 22);
  const [wt,    setWt]    = useState(user.weight || 75);
  const [ht,    setHt]    = useState(user.height || 178);
  const [goal,  setGoal]  = useState(user.goal || "allround");
  const [sec,   setSec]   = useState("profile");
  const [saved, setSaved] = useState(false);

  const save = () => { setUser(u => ({ ...u, name, age:parseInt(age), weight:parseFloat(wt), height:parseFloat(ht), goal })); setSaved(true); toast("Profile saved!", "success"); setTimeout(() => setSaved(false), 2000); };

  const SECS = [{ id:"profile", icon:"👤", label:"Profile" }, { id:"goals", icon:"🎯", label:"Goals" }, { id:"notifs", icon:"🔔", label:"Notifications" }, { id:"privacy", icon:"🔒", label:"Privacy" }, { id:"about", icon:"ℹ️", label:"About" }];
  const GOALS = [{ id:"physique", icon:"💪", label:"Build Physique" }, { id:"confidence", icon:"⭐", label:"Build Confidence" }, { id:"habits", icon:"✅", label:"Better Habits" }, { id:"allround", icon:"🚀", label:"Full Glow Up" }, { id:"performance", icon:"⚡", label:"Athletic Peak" }, { id:"weight", icon:"🔥", label:"Lose Weight" }];
  const NOTIFS = [{ l:"Daily habit reminders", s:"Reminders to complete your habits", d:true }, { l:"Workout reminder", s:"At your scheduled workout time", d:true }, { l:"Streak alerts", s:"Alert when your streak is at risk", d:true }, { l:"Friend activity", s:"When friends hit milestones", d:false }, { l:"Weekly report", s:"Sunday summary of your week", d:true }, { l:"New challenges", s:"When new challenges are available", d:false }];

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="⚙️" title="Settings" sub="Manage your profile and preferences" />
      <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:16 }}>
        <div style={{ display:"grid", gap:4, alignContent:"start" }}>
          {SECS.map(s => (
            <button key={s.id} onClick={() => setSec(s.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderRadius:12, width:"100%", background: sec === s.id ? `${T.purple}18` : "transparent", border:`1px solid ${sec === s.id ? T.purple + "44" : "transparent"}`, color: sec === s.id ? T.purple : T.dim, fontWeight: sec === s.id ? 700 : 500, fontSize:14, transition:"all .18s" }}>
              <span style={{ fontSize:18 }}>{s.icon}</span>{s.label}
            </button>
          ))}
        </div>

        <div>
          {sec === "profile" && (
            <Card>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:20 }}>Profile</div>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, padding:16, background:T.surface2, borderRadius:14 }}>
                <Avatar name={name || "U"} size={64} color={T.purple} />
                <div><div style={{ fontWeight:700, fontSize:16 }}>{name || "Your Name"}</div><div style={{ fontSize:13, color:T.muted }}>Level {user.level} · {user.xp} XP</div></div>
              </div>
              <div style={{ display:"grid", gap:14 }}>
                <Inp label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <Inp label="Age" value={age} onChange={e => setAge(e.target.value)} type="number" />
                  <Inp label="Weight (kg)" value={wt} onChange={e => setWt(e.target.value)} type="number" />
                  <Inp label="Height (cm)" value={ht} onChange={e => setHt(e.target.value)} type="number" />
                </div>
              </div>
              <div style={{ marginTop:20 }}><Btn onClick={save}>{saved ? "Saved!" : "Save Changes"}</Btn></div>
            </Card>
          )}

          {sec === "goals" && (
            <Card>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:20 }}>Primary Goal</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                {GOALS.map(g => (
                  <div key={g.id} onClick={() => setGoal(g.id)} style={{ padding:16, borderRadius:14, cursor:"pointer", display:"flex", alignItems:"center", gap:12, background: goal === g.id ? `${T.purple}18` : T.surface2, border:`2px solid ${goal === g.id ? T.purple : T.border}`, transition:"all .18s" }}>
                    <span style={{ fontSize:24 }}>{g.icon}</span>
                    <span style={{ fontWeight:600, fontSize:14, color: goal === g.id ? T.purple : T.text }}>{g.label}</span>
                  </div>
                ))}
              </div>
              <Btn onClick={save}>Save Goal</Btn>
            </Card>
          )}

          {sec === "notifs" && (
            <Card>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Notifications</div>
              <div style={{ display:"grid", gap:12 }}>
                {NOTIFS.map(n => <NotifToggle key={n.l} label={n.l} sub={n.s} defaultOn={n.d} />)}
              </div>
            </Card>
          )}

          {sec === "privacy" && (
            <Card>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Privacy and Data</div>
              <div style={{ display:"grid", gap:12 }}>
                {[{ icon:"📸", t:"Photo Processing", d:"Photos processed in-memory only, never stored on any server." }, { icon:"💬", t:"AI Conversations", d:"Chat history stored locally in your browser only." }, { icon:"📊", t:"Progress Data", d:"All data stays in your browser localStorage." }, { icon:"🌐", t:"Analytics", d:"No usage analytics or tracking of any kind." }].map(p => (
                  <div key={p.t} style={{ padding:16, background:T.surface2, borderRadius:12, display:"flex", gap:12 }}>
                    <span style={{ fontSize:22 }}>{p.icon}</span>
                    <div><div style={{ fontWeight:600, fontSize:14 }}>{p.t}</div><div style={{ fontSize:13, color:T.muted, lineHeight:1.5 }}>{p.d}</div></div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16 }}>
                <Btn onClick={() => { localStorage.clear(); toast("All data cleared", "info"); }} variant="danger" size="sm">Clear All Data</Btn>
              </div>
            </Card>
          )}

          {sec === "about" && (
            <Card>
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(135deg,${T.purple},${T.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto 16px" }}>◈</div>
                <div style={{ fontSize:26, fontWeight:900, marginBottom:6 }}>Critique AI</div>
                <div style={{ color:T.purple, fontSize:13, fontWeight:700, marginBottom:16 }}>YOUR GLOW UP COACH</div>
                <div style={{ color:T.muted, fontSize:14, lineHeight:1.7, maxWidth:400, margin:"0 auto 20px" }}>An AI-powered self-improvement platform for fitness, nutrition, mindset, and style.</div>
                <div style={{ display:"flex", justifyContent:"center", gap:10, flexWrap:"wrap" }}>
                  <Badge label="Powered by Claude AI" color={T.purple} />
                  <Badge label="Built with React" color={T.blue} />
                  <Badge label="v3.0" color={T.green} />
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BODY METRICS ─────────────────────────────────────────────────────────────
function BodyMetrics() {
  const FIELDS = [
    { key:"weight",  label:"Weight",    unit:"kg", icon:"⚖️", color:T.blue   },
    { key:"bodyFat", label:"Body Fat",  unit:"%",  icon:"🔥", color:T.orange },
    { key:"chest",   label:"Chest",     unit:"cm", icon:"💪", color:T.purple },
    { key:"waist",   label:"Waist",     unit:"cm", icon:"📏", color:T.green  },
    { key:"hips",    label:"Hips",      unit:"cm", icon:"📐", color:T.teal   },
    { key:"bicep",   label:"Bicep",     unit:"cm", icon:"💪", color:T.yellow },
    { key:"neck",    label:"Neck",      unit:"cm", icon:"🦒", color:T.pink   },
  ];

  const [metrics, setMetrics] = usePersist("cai_metrics", [
    { id:1, date:"Week 1", weight:83,   bodyFat:22,   chest:100, waist:88, hips:96, bicep:33,  neck:38   },
    { id:2, date:"Week 2", weight:82.2, bodyFat:21.5, chest:100, waist:87, hips:95, bicep:33.5,neck:38   },
    { id:3, date:"Week 3", weight:81.5, bodyFat:21,   chest:101, waist:86, hips:95, bicep:34,  neck:38   },
    { id:4, date:"Week 4", weight:80.8, bodyFat:20.5, chest:102, waist:85, hips:94, bicep:34.5,neck:38.5 },
  ]);
  const [form,    setForm]    = useState({ weight:"", bodyFat:"", chest:"", waist:"", hips:"", bicep:"", neck:"" });
  const [view,    setView]    = useState("overview");
  const [ai,      setAi]      = useState("");
  const [loading, setLoading] = useState(false);

  const latest = metrics[metrics.length - 1];
  const first  = metrics[0];

  const logMetrics = () => {
    const entry = { id:Date.now(), date:`Week ${metrics.length + 1}` };
    FIELDS.forEach(f => { entry[f.key] = parseFloat(form[f.key]) || (latest ? latest[f.key] : 0); });
    setMetrics(m => [...m, entry]);
    setForm({ weight:"", bodyFat:"", chest:"", waist:"", hips:"", bicep:"", neck:"" });
    toast("Measurements logged!", "success", 30);
  };

  const getAI = async () => {
    setLoading(true); setAi("");
    const data = metrics.map(m => `${m.date}: weight ${m.weight}kg bodyFat ${m.bodyFat}% chest ${m.chest}cm waist ${m.waist}cm`).join(", ");
    try {
      const txt = await callClaude(`You are an expert body composition coach. Analyze these measurements over time: ${data}.\n\nProvide:\nPROGRESS ASSESSMENT: [overall verdict]\nIMPROVING: [specific metrics and rate of change]\nCONCERNS: [any stagnation or issues]\nGOAL TIMELINE: [estimated timeline to ideal metrics]\nOPTIMIZATION TIPS: [3-5 specific tactics]\nNEXT 4 WEEKS: [specific targets]`, 600);
      setAi(txt);
    } catch { setAi("Analysis failed."); }
    setLoading(false);
  };

  const diff = key => {
    if (!latest || !first) return 0;
    return (latest[key] - first[key]).toFixed(1);
  };

  const isBetter = key => {
    const d = parseFloat(diff(key));
    if (key === "weight" || key === "bodyFat" || key === "waist") return d <= 0;
    return d >= 0;
  };

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="📏" title="Body Metrics" sub="Track measurements and body composition over time" />

      <div style={{ display:"flex", gap:8 }}>
        {[["overview","Overview"],["log","Log"],["ai","AI Analysis"]].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)} style={{ padding:"8px 18px", borderRadius:10, fontSize:13, fontWeight:700, background: view === v ? `${T.purple}22` : T.surface2, border:`1px solid ${view === v ? T.purple : T.border}`, color: view === v ? T.purple : T.dim, transition:"all .18s" }}>{l}</button>
        ))}
      </div>

      {view === "overview" && (
        <div style={{ display:"grid", gap:16 }}>
          {/* Top cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {FIELDS.slice(0, 4).map(f => {
              const d = parseFloat(diff(f.key));
              const better = isBetter(f.key);
              return (
                <Card key={f.key} style={{ padding:16, textAlign:"center" }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{f.icon}</div>
                  <div style={{ fontSize:22, fontWeight:900, color:f.color, fontFamily:"'DM Mono',monospace" }}>{latest ? latest[f.key] : "-"}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{f.label} ({f.unit})</div>
                  {d !== 0 && <div style={{ fontSize:11, color: better ? T.green : T.red, marginTop:4, fontWeight:700 }}>{d > 0 ? "+" : ""}{d} {f.unit}</div>}
                </Card>
              );
            })}
          </div>

          {/* Progress bars */}
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Progress Since Start</div>
            <div style={{ display:"grid", gap:12 }}>
              {FIELDS.map(f => {
                const d = parseFloat(diff(f.key));
                const better = isBetter(f.key);
                return (
                  <div key={f.key} style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <span style={{ fontSize:18, width:24, textAlign:"center" }}>{f.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:14, fontWeight:500 }}>{f.label}</span>
                        <div style={{ display:"flex", gap:10, fontFamily:"'DM Mono',monospace", fontSize:13 }}>
                          <span style={{ color:T.muted }}>{first ? first[f.key] : "-"}{f.unit}</span>
                          <span style={{ color:T.dim }}>to</span>
                          <span style={{ color:f.color, fontWeight:700 }}>{latest ? latest[f.key] : "-"}{f.unit}</span>
                          {d !== 0 && <span style={{ color: better ? T.green : T.red, fontWeight:700 }}>({d > 0 ? "+" : ""}{d})</span>}
                        </div>
                      </div>
                      <ProgressBar value={Math.min(Math.abs(d) * 5, 100)} color={better ? T.green : T.red} height={5} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* History table */}
          <Card>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Measurement History</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:500 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                    <th style={{ padding:"10px 12px", textAlign:"left", color:T.muted, fontSize:11, fontWeight:700 }}>DATE</th>
                    {FIELDS.map(f => <th key={f.key} style={{ padding:"10px 12px", textAlign:"right", color:T.muted, fontSize:11, fontWeight:700 }}>{f.label.toUpperCase()}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...metrics].reverse().map((m, i) => (
                    <tr key={m.id} style={{ borderTop:`1px solid ${T.border}22` }}>
                      <td style={{ padding:"12px", fontWeight:600, fontSize:13 }}>{m.date}</td>
                      {FIELDS.map(f => (
                        <td key={f.key} style={{ padding:"12px", textAlign:"right", fontFamily:"'DM Mono',monospace", fontSize:13, color: i === 0 ? f.color : T.dim }}>
                          {m[f.key]}{f.unit}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {view === "log" && (
        <Card>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Log New Measurements</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 }}>
            {FIELDS.map(f => (
              <div key={f.key}>
                <div style={{ fontSize:12, color:T.muted, fontWeight:700, textTransform:"uppercase", marginBottom:7 }}>{f.icon} {f.label} ({f.unit})</div>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(fm => ({ ...fm, [f.key]:e.target.value }))}
                  type="number"
                  placeholder={latest ? latest[f.key].toString() : "0"}
                  onFocus={e => { e.target.style.borderColor = f.color; }}
                  onBlur={e => { e.target.style.borderColor = T.border; }}
                  style={{ width:"100%", background:T.surface2, border:`1px solid ${T.border}`, borderRadius:12, padding:"10px 14px", color:T.text, fontSize:14, transition:"border-color .2s" }}
                />
              </div>
            ))}
          </div>
          <Btn onClick={logMetrics} style={{ justifyContent:"center" }}>Save Measurements</Btn>
          <div style={{ marginTop:16, padding:14, background:T.surface2, borderRadius:12 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Tips for Accurate Measurements</div>
            {["Measure first thing in the morning before eating","Use the same tape measure every time","Take 3 readings and use the average","Track at least every 2 weeks for meaningful trends"].map((t, i) => (
              <div key={i} style={{ fontSize:12, color:T.muted, padding:"4px 0", borderBottom: i < 3 ? `1px solid ${T.border}22` : "none" }}>• {t}</div>
            ))}
          </div>
        </Card>
      )}

      {view === "ai" && (
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>AI Body Composition Analysis</div>
            <Btn onClick={getAI} disabled={loading} size="sm">{loading ? <><Spinner size={13} color="#fff" />Analyzing...</> : "Analyze My Progress"}</Btn>
          </div>
          {ai
            ? <pre style={{ whiteSpace:"pre-wrap", fontSize:13, lineHeight:1.8, fontFamily:"inherit" }}>{ai}</pre>
            : <div style={{ textAlign:"center", padding:"40px 20px", color:T.muted }}><div style={{ fontSize:40, marginBottom:12 }}>📏</div><div style={{ fontWeight:600, marginBottom:6 }}>AI Body Analysis</div><div style={{ fontSize:13 }}>Click the button to get a full analysis of your body composition progress and personalized optimization advice.</div></div>
          }
        </Card>
      )}
    </div>
  );
}

// ─── STREAK CALENDAR ──────────────────────────────────────────────────────────
function StreakCalendar() {
  const [habits]  = usePersist("cai_habits",  []);
  const [tasks]   = usePersist("cai_tasks",   []);
  const [sleep]   = usePersist("cai_sleep",   []);
  const [journal] = usePersist("cai_journal", []);
  const [wlog]    = usePersist("cai_wlog",    []);
  const [selDay,  setSelDay]  = useState(null);
  const [aiMsg,   setAiMsg]   = useState("");
  const [loading, setLoading] = useState(false);

  // Generate 90 days of activity data
  const today = new Date();
  const days = Array.from({ length:91 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (90 - i));
    // Simulate activity — recent days more active
    const recency = i / 90;
    const rand = Math.random();
    let intensity = 0;
    if (rand < recency * 0.8) intensity = Math.floor(Math.random() * 3) + 1;
    return {
      date: d.toLocaleDateString("en-US", { month:"short", day:"numeric" }),
      full: d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" }),
      intensity,
      idx: i,
    };
  });

  // Current streak calculation
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].intensity > 0) streak++;
    else break;
  }

  // Longest streak
  let longest = 0, cur = 0;
  days.forEach(d => { if (d.intensity > 0) { cur++; longest = Math.max(longest, cur); } else cur = 0; });

  const totalActive = days.filter(d => d.intensity > 0).length;
  const intensityColors = ["#1C1C26", `${T.purple}44`, `${T.purple}77`, T.purple];

  const getMotivation = async () => {
    setLoading(true); setAiMsg("");
    try {
      const txt = await callClaude(`You are an elite performance coach. Give a powerful, personalized motivational message for someone with: ${streak}-day current streak, ${longest}-day best streak, ${totalActive}/90 active days. Keep it under 60 words, direct, and fire them up.`, 150);
      setAiMsg(txt);
    } catch { setAiMsg("Keep going. Every day counts."); }
    setLoading(false);
  };

  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="fade-up" style={{ display:"grid", gap:20 }}>
      <SectionHead icon="🔥" title="Streak Calendar" sub="Your activity heatmap and consistency tracker" />

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
        {[
          { label:"Current Streak", val:`${streak}`, unit:"days", icon:"🔥", color:T.orange },
          { label:"Longest Streak", val:`${longest}`, unit:"days", icon:"🏆", color:T.yellow },
          { label:"Active Days",    val:`${totalActive}`, unit:"/ 90",  icon:"📅", color:T.green },
          { label:"Consistency",    val:`${Math.round(totalActive / 90 * 100)}`, unit:"%", icon:"⚡", color:T.purple },
        ].map(s => (
          <Card key={s.label} style={{ padding:16, textAlign:"center" }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:26, fontWeight:900, color:s.color, fontFamily:"'DM Mono',monospace" }}>{s.val}<span style={{ fontSize:14, color:T.muted, fontWeight:500 }}> {s.unit}</span></div>
            <div style={{ fontSize:12, color:T.muted }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Heatmap */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>90-Day Activity Heatmap</div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ fontSize:11, color:T.muted }}>Less</span>
            {intensityColors.map((c, i) => <div key={i} style={{ width:14, height:14, borderRadius:4, background:c, border:`1px solid ${T.border}` }} />)}
            <span style={{ fontSize:11, color:T.muted }}>More</span>
          </div>
        </div>
        <div style={{ overflowX:"auto", paddingBottom:8 }}>
          <div style={{ display:"flex", gap:4, minWidth:520 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {week.map(day => (
                  <div
                    key={day.idx}
                    title={`${day.full} — ${day.intensity === 0 ? "No activity" : day.intensity === 1 ? "Light" : day.intensity === 2 ? "Moderate" : "High"} activity`}
                    onClick={() => setSelDay(selDay?.idx === day.idx ? null : day)}
                    style={{ width:14, height:14, borderRadius:4, background:intensityColors[day.intensity], border:`1px solid ${selDay?.idx === day.idx ? T.purple : T.border}`, cursor:"pointer", transition:"all .15s" }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {selDay && (
          <div className="fade-in" style={{ marginTop:14, padding:"12px 16px", background:T.surface2, borderRadius:12, border:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>{selDay.full}</div>
              <div style={{ fontSize:12, color:T.muted }}>Activity level: {["None","Light","Moderate","High"][selDay.intensity]}</div>
            </div>
            <div style={{ width:32, height:32, borderRadius:8, background:intensityColors[selDay.intensity], border:`1px solid ${T.purple}44` }} />
          </div>
        )}
      </Card>

      {/* Weekly breakdown */}
      <Card>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Weekly Activity Breakdown</div>
        <div style={{ display:"grid", gap:10 }}>
          {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day, di) => {
            const dayDays = days.filter((_, i) => i % 7 === di);
            const activeDays = dayDays.filter(d => d.intensity > 0).length;
            const pct = Math.round(activeDays / dayDays.length * 100);
            const clr = pct >= 70 ? T.green : pct >= 40 ? T.yellow : T.red;
            return (
              <div key={day} style={{ display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ width:90, fontSize:13, fontWeight:500, color:T.dim }}>{day}</span>
                <div style={{ flex:1 }}><ProgressBar value={pct} color={clr} height={8} /></div>
                <span style={{ width:40, textAlign:"right", fontSize:13, fontWeight:700, color:clr, fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Habit streaks */}
      <Card>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Individual Habit Streaks</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
          {habits.map(h => (
            <div key={h.id} style={{ padding:"14px 16px", background:T.surface2, borderRadius:14, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:`${h.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{h.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{h.name}</div>
                <div style={{ marginTop:4 }}>
                  <ProgressBar value={h.streak} max={30} color={h.color} height={5} />
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:900, fontSize:18, color:h.color, fontFamily:"'DM Mono',monospace" }}>{h.streak}</div>
                <div style={{ fontSize:10, color:T.muted }}>days</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI motivation */}
      <Card accent={T.orange}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:aiMsg ? 14 : 0 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>AI Motivation</div>
          <Btn onClick={getMotivation} disabled={loading} variant="orange" size="sm">{loading ? <><Spinner size={13} color={T.orange} />Generating...</> : "Fire Me Up"}</Btn>
        </div>
        {aiMsg && (
          <div className="fade-in" style={{ fontSize:16, lineHeight:1.7, fontWeight:500, color:T.text, fontStyle:"italic", borderTop:`1px solid ${T.border}`, paddingTop:14 }}>
            {aiMsg}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ tab, setTab, user }) {
  return (
    <aside style={{ width:230, background:T.surface, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:50, padding:"20px 14px", gap:4, overflowY:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, padding:"4px 6px" }}>
        <div style={{ width:38, height:38, borderRadius:12, background:`linear-gradient(135deg,${T.purple},${T.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, flexShrink:0 }}>◈</div>
        <div><div style={{ fontSize:17, fontWeight:900, letterSpacing:-.4 }}>Critique AI</div><div style={{ fontSize:10, color:T.purple, fontWeight:700, letterSpacing:.06 }}>YOUR GLOW UP</div></div>
      </div>

      <div style={{ flex:1 }}>
        <div style={{ fontSize:10, color:T.muted, fontWeight:700, letterSpacing:.1, padding:"4px 10px 8px", textTransform:"uppercase" }}>Menu</div>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, width:"100%", background: tab === item.id ? `${T.purple}18` : "transparent", border:`1px solid ${tab === item.id ? T.purple + "44" : "transparent"}`, color: tab === item.id ? T.purple : T.dim, fontWeight: tab === item.id ? 700 : 500, fontSize:14, textAlign:"left", transition:"all .16s", marginBottom:2 }}>
            <span style={{ fontSize:16, width:22, textAlign:"center", flexShrink:0 }}>{item.icon}</span>
            <span>{item.label}</span>
            {tab === item.id && <span style={{ marginLeft:"auto", width:5, height:5, borderRadius:"50%", background:T.purple, flexShrink:0 }} />}
          </button>
        ))}
      </div>

      <div style={{ padding:14, background:T.surface2, borderRadius:16, border:`1px solid ${T.border}`, marginTop:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:11 }}>
          <Avatar name={user.name} size={36} color={T.purple} />
          <div style={{ overflow:"hidden" }}>
            <div style={{ fontWeight:700, fontSize:14, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div>
            <div style={{ fontSize:11, color:T.purple }}>Level {user.level}</div>
          </div>
        </div>
        <ProgressBar value={user.xp % 1000} max={1000} color={T.purple} height={4} />
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:T.muted }}>
          <span>{user.xp % 1000}/1000 XP</span>
          <span style={{ color:T.orange }}>{user.streak}🔥</span>
        </div>
      </div>
    </aside>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [focus, setFocus] = useState([]);
  const [age, setAge] = useState("");

  const GOALS = [
    { id:"physique",    icon:"💪", title:"Better Physique",   desc:"Lose fat, build muscle" },
    { id:"confidence",  icon:"⭐", title:"Build Confidence",  desc:"Social skills and mindset" },
    { id:"habits",      icon:"✅", title:"Better Habits",     desc:"Routines that stick" },
    { id:"allround",    icon:"🚀", title:"Full Glow Up",      desc:"Transform every area" },
    { id:"performance", icon:"⚡", title:"Athletic Peak",     desc:"Performance and endurance" },
    { id:"weight",      icon:"🔥", title:"Lose Weight",       desc:"Sustainable fat loss" },
  ];
  const FOCUS = ["Fitness","Nutrition","Mindset","Style","Social Skills","Sleep","Productivity","Confidence"];
  const tog = f => setFocus(fs => fs.includes(f) ? fs.filter(x => x !== f) : [...fs, f]);

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:T.bg, padding:24 }}>
      {step > 0 && (
        <div style={{ display:"flex", gap:8, marginBottom:32 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: i === step ? 24 : 8, height:8, borderRadius:99, background: i <= step ? T.purple : T.border, transition:"all .3s" }} />)}
        </div>
      )}

      {step === 0 && (
        <div className="scale-in" style={{ textAlign:"center", maxWidth:440 }}>
          <div style={{ width:80, height:80, borderRadius:24, background:`linear-gradient(135deg,${T.purple},${T.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, margin:"0 auto 24px" }}>◈</div>
          <div style={{ fontSize:34, fontWeight:900, marginBottom:10, lineHeight:1.1 }}>Welcome to Critique AI</div>
          <div style={{ color:T.muted, fontSize:15, lineHeight:1.7, marginBottom:32 }}>Your AI-powered personal coach for fitness, nutrition, mindset, and style. Start your glow up today.</div>
          <div style={{ marginBottom:20, textAlign:"left" }}>
            <Inp label="What is your name?" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name..." onEnter={() => name.trim() && setStep(1)} />
          </div>
          <Btn onClick={() => name.trim() && setStep(1)} disabled={!name.trim()} style={{ width:"100%", justifyContent:"center", fontSize:16, padding:"14px" }}>Get Started</Btn>
        </div>
      )}

      {step === 1 && (
        <div className="scale-in" style={{ maxWidth:560, width:"100%" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:26, fontWeight:900, marginBottom:8 }}>Hey {name}!</div>
            <div style={{ color:T.muted, fontSize:15 }}>What is your number one goal right now?</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
            {GOALS.map(g => (
              <div key={g.id} onClick={() => setGoal(g.id)} style={{ padding:18, borderRadius:16, cursor:"pointer", textAlign:"center", background: goal === g.id ? `${T.purple}18` : T.surface, border:`2px solid ${goal === g.id ? T.purple : T.border}`, transition:"all .18s" }}>
                <div style={{ fontSize:30, marginBottom:8 }}>{g.icon}</div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{g.title}</div>
                <div style={{ fontSize:12, color:T.muted }}>{g.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={() => setStep(0)} variant="ghost">Back</Btn>
            <Btn onClick={() => goal && setStep(2)} disabled={!goal} style={{ flex:1, justifyContent:"center" }}>Continue</Btn>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="scale-in" style={{ maxWidth:500, width:"100%" }}>
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:24, fontWeight:900, marginBottom:8 }}>What will you focus on?</div>
            <div style={{ color:T.muted, fontSize:14 }}>Pick all that apply</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:24 }}>
            {FOCUS.map(f => (
              <div key={f} onClick={() => tog(f)} style={{ padding:"12px 8px", borderRadius:12, textAlign:"center", cursor:"pointer", background: focus.includes(f) ? `${T.purple}22` : T.surface, border:`2px solid ${focus.includes(f) ? T.purple : T.border}`, transition:"all .18s", fontSize:13, fontWeight:600, color: focus.includes(f) ? T.purple : T.dim }}>{f}</div>
            ))}
          </div>
          <div style={{ marginBottom:16 }}>
            <Inp label="Age (optional)" value={age} onChange={e => setAge(e.target.value)} type="number" placeholder="e.g. 22" />
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={() => setStep(1)} variant="ghost">Back</Btn>
            <Btn onClick={() => onComplete({ name, goal, focus, age:parseInt(age) || 20 })} style={{ flex:1, justifyContent:"center", fontSize:16, padding:"13px" }}>Start My Journey</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,  setTab]  = useState("dashboard");
  const [user, setUser] = usePersist("cai_user", null);

  const done = data => setUser({ name:data.name, goal:data.goal, focus:data.focus || [], age:data.age || 20, xp:0, level:1, streak:1, weight:75, height:178 });

  if (!user) {
    return (
      <ToastProvider>
        <style>{STYLES}</style>
        <Onboarding onComplete={done} />
      </ToastProvider>
    );
  }

  const U = user;
  const TABS = {
    dashboard: <Dashboard user={U} setTab={setTab} />,
    glowup:    <GlowUpScore user={U} />,
    habits:    <Habits />,
    scans:     <AIScans />,
    nutrition: <Nutrition />,
    workouts:  <Workouts />,
    body:      <BodyMetrics />,
    streak:    <StreakCalendar />,
    sleep:     <SleepTracker />,
    journal:   <Journal />,
    mindset:   <Mindset />,
    voice:     <VoiceCoach />,
    breathing: <Breathing />,
    focus:     <FocusMode />,
    coach:     <AICoach user={U} />,
    social:    <Social user={U} />,
    progress:  <Progress user={U} />,
    settings:  <Settings user={U} setUser={setUser} />,
  };

  return (
    <ToastProvider>
      <style>{STYLES}</style>
      <div style={{ display:"flex", minHeight:"100vh" }}>
        <Sidebar tab={tab} setTab={setTab} user={U} />
        <main style={{ marginLeft:230, flex:1, padding:"32px 28px", minHeight:"100vh", background:T.bg }}>
          <div style={{ maxWidth:1000, margin:"0 auto" }}>
            {TABS[tab]}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
