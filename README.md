{% raw %}
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
          <div key={t.id} style={{ background:T.surface, border:`1px solid ${(cols[t.type]||T.green)}44`, borderRadius:14, padding:"12px 18px", display:"flex", alignItems:"center", gap:10, animation:"toastIn .3s cubic-bezier(.22,1,.36,1) both" }}>
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
    <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${color},${T.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*.4, fontWeight:900, color:"#fff", flexShrink:0 }}>
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
      style={{ background: accent ? `linear-gradient(135deg,${accent}0E,${T.surface})` : T.surface, border:`1px solid ${accent ? accent + "33" : T.border}`, borderRadius:20, padding:20, position:"relative", ...style }}
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
      style={{ ...V[variant], ...S[size], borderRadius:12, fontWeight:700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1, transition:"all .18s", whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:6, justifyContent:"center", ...style }}
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
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:10, background:T.surface2, color:T.muted, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"none" }}>✕</button>
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
      <div onClick={() => setOn(v => !v)} style={{ width:44, height:24, borderRadius:12, cursor:"pointer", transition:"all .2s", background: on ? T.purple : T.border, padding:"2px", display:"flex", alignItems:"center" }}>
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

// ─── AI helper ─────────────────────────────────────────────────────────
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

// ─── DASHBOARD ─────────────────────────────────────────────────────────
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
              <div key={t.id} onClick={() => toggle(t.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, cursor:"pointer", background: t.done ? `${T.surface2}` : "transparent", transition:"all .2s" }}>
                <div style={{ width:22, height:22, borderRadius:7, border:`2px solid ${t.done ? T.purple : T.border}`, background: t.done ? T.purple : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>✓</div>
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
            <div key={i} onClick={() => setWater(i < water ? i : i + 1)} style={{ flex:1, height:44, borderRadius:10, cursor:"pointer", transition:"all .2s", background: i < water ? `${T.blue}44` : T.border, display:"flex", alignItems:"center", justifyContent:"center" }}>
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

// Additional components would go here...

export { Dashboard, ToastProvider, toast, Badge, Card, Btn, Modal, Spinner };
{% endraw %}
