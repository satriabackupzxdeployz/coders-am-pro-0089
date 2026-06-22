"use client";
import { useState, useEffect, useCallback } from "react";
import { dbProxy } from "@/lib/api";

interface Log { id:string; action:string; detail:string; by:string; timestamp:number; time:string; }
interface Acc { id:string; key:string; username:string; type:string; createdTime:string; isActive:boolean; usedCount:number; lastLogin?:string; }
interface GenResult { key:string; username:string; type:string; }

function Toast({ msg, type, onClose }: { msg:string; type:"success"|"error"|"info"; onClose:()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const s = { success:["#0d2419","#10b981","#34d399"], error:["#200d0d","#ef4444","#f87171"], info:["#0d1424","#3b82f6","#60a5fa"] }[type];
  return <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, padding:"14px 20px", borderRadius:12, background:s[0], border:`1px solid ${s[1]}`, color:s[2], fontSize:14, fontWeight:500, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", animation:"slideInRight 0.3s ease" }}>{msg}</div>;
}

const ACTION_COLOR: Record<string,string> = {
  KEY_GENERATED:"#34d399", LOGIN_SUCCESS:"#60a5fa", LOGIN_FAILED:"#f87171",
  EMAIL_SENT:"#a78bfa", EMAIL_VERIFIED:"#34d399", ACCOUNT_DELETED:"#f97316",
  ADMIN_LOGIN:"#fbbf24", ACCOUNT_TOGGLED:"#06b6d4",
};

export default function SecretPanel() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [tab, setTab] = useState<"generate"|"accounts"|"logs">("generate");
  const [logs, setLogs] = useState<Log[]>([]);
  const [accounts, setAccounts] = useState<Acc[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [genLoading, setGenLoading] = useState<"satria"|"moliw"|null>(null);
  const [result, setResult] = useState<GenResult|null>(null);
  const [toast, setToast] = useState<{msg:string;type:"success"|"error"|"info"}|null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string|null>(null);
  const [toggleLoading, setToggleLoading] = useState<string|null>(null);
  const [copied, setCopied] = useState(false);

  const T = (msg:string, type:"success"|"error"|"info"="info") => setToast({ msg, type });

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true); setAuthErr("");
    const data = await dbProxy("admin_auth", { password: pw });
    if (data.ok) { setAuthed(true); }
    else { setAuthErr(data.msg || "Password salah"); }
    setAuthLoading(false);
  }

  const fetchLogs = useCallback(async () => {
    setDataLoading(true);
    const data = await dbProxy("get_logs", { password: pw });
    if (data.ok) setLogs(data.logs || []);
    else T("Gagal memuat logs","error");
    setDataLoading(false);
  }, [pw]);

  const fetchAccounts = useCallback(async () => {
    setDataLoading(true);
    const data = await dbProxy("get_accounts", { password: pw });
    if (data.ok) setAccounts(data.accounts || []);
    else T("Gagal memuat akun","error");
    setDataLoading(false);
  }, [pw]);

  useEffect(() => {
    if (!authed) return;
    if (tab === "logs") fetchLogs();
    if (tab === "accounts") fetchAccounts();
  }, [tab, authed, fetchLogs, fetchAccounts]);

  async function generate(type: "satria"|"moliw") {
    setGenLoading(type); setResult(null);
    const data = await dbProxy("generate_key", { password: pw, type });
    if (data.ok) { setResult({ key:data.key, username:data.username, type:data.type }); T(`Key berhasil digenerate!`,"success"); }
    else T(data.msg || "Gagal generate","error");
    setGenLoading(null);
  }

  async function deleteAcc(id: string, username: string) {
    if (!confirm(`Hapus akun "${username}"?`)) return;
    setDeleteLoading(id);
    const data = await dbProxy("delete_account", { password: pw, accountId: id });
    if (data.ok) { setAccounts(prev => prev.filter(a => a.id !== id)); T("Akun dihapus","success"); }
    else T(data.msg || "Gagal hapus","error");
    setDeleteLoading(null);
  }

  async function toggleActive(id: string, current: boolean) {
    setToggleLoading(id);
    const data = await dbProxy("toggle_active", { password: pw, accountId: id, isActive: String(!current) });
    if (data.ok) {
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: !current } : a));
      T(`Akun ${!current ? "diaktifkan" : "dinonaktifkan"}`,"success");
    } else T(data.msg || "Gagal","error");
    setToggleLoading(null);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); T("Disalin!","success"); setTimeout(() => setCopied(false), 2000); });
  }

  // ── AUTH SCREEN ──────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative", zIndex:1 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ position:"fixed", top:"30%", left:"50%", transform:"translate(-50%,-50%)", width:500, height:500, background:"radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ width:"100%", maxWidth:420 }} className="animate-fade">
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:64, height:64, margin:"0 auto 16px", background:"linear-gradient(135deg, #ef4444, #dc2626)", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 40px rgba(239,68,68,0.3)" }} className="animate-float">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize:22, fontWeight:800, marginBottom:6 }}>
            <span style={{ background:"linear-gradient(135deg, #f87171, #fbbf24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Admin Secret Panel</span>
          </h1>
          <p style={{ color:"#8888aa", fontSize:13 }}>Akses terbatas — masukkan password admin</p>
        </div>
        <div className="card card-glow" style={{ borderColor:"rgba(239,68,68,0.2)" }}>
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom:16 }}>
              <label className="label">Admin Password</label>
              <input className="input mono" type="password" placeholder="••••••••••••••" value={pw} onChange={e => setPw(e.target.value)} required style={{ letterSpacing:"0.12em" }} />
              {authErr && <div style={{ marginTop:8, color:"#f87171", fontSize:13 }}>⚠ {authErr}</div>}
            </div>
            <button type="submit" className="btn btn-full" disabled={authLoading || !pw}
              style={{ background:"linear-gradient(135deg, #ef4444, #dc2626)", color:"white", border:"none", boxShadow:"0 4px 20px rgba(239,68,68,0.3)" }}>
              {authLoading ? <span className="spinner" /> : "🔐 Masuk ke Admin Panel"}
            </button>
          </form>
        </div>
        <p style={{ textAlign:"center", marginTop:16, fontSize:12, color:"#44446a" }}>⚠ Halaman ini terproteksi penuh</p>
      </div>
    </div>
  );

  // ── ADMIN PANEL ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", padding:"24px 16px", position:"relative", zIndex:1 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ maxWidth:780, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }} className="animate-fade">
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg, #ef4444, #dc2626)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(239,68,68,0.3)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="white" strokeWidth="2"/></svg>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:16 }}>Admin Control Panel</div>
              <div style={{ color:"#8888aa", fontSize:12 }}>Secret Management Dashboard</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { setAuthed(false); setPw(""); }}>🚪 Logout</button>
        </div>

        {/* Tabs */}
        <div className="tabs animate-fade" style={{ marginBottom:24, animationDelay:"0.05s" }}>
          {[{id:"generate",label:"🔑 Generate Key"},{id:"accounts",label:"👥 Akun"},{id:"logs",label:"📋 Activity Logs"}].map(t => (
            <button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={() => setTab(t.id as typeof tab)}>{t.label}</button>
          ))}
        </div>

        {/* ── GENERATE ── */}
        {tab === "generate" && (
          <div className="animate-fade">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
              {/* Satria */}
              <div className="card" style={{ borderColor:"rgba(59,130,246,0.3)", textAlign:"center", padding:28 }}>
                <div style={{ width:52, height:52, margin:"0 auto 14px", background:"rgba(59,130,246,0.12)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>⚡</div>
                <h3 style={{ fontWeight:700, marginBottom:6 }}>Satriakey</h3>
                <p style={{ color:"#8888aa", fontSize:12, marginBottom:18, lineHeight:1.6 }}>Prefix: <code style={{ color:"#60a5fa" }}>Satriakey-xxxx</code></p>
                <button className="btn btn-primary btn-full btn-sm" onClick={() => generate("satria")} disabled={genLoading !== null}>
                  {genLoading === "satria" ? <span className="spinner" /> : "Generate Satriakey"}
                </button>
              </div>
              {/* Moliw */}
              <div className="card" style={{ borderColor:"rgba(139,92,246,0.3)", textAlign:"center", padding:28 }}>
                <div style={{ width:52, height:52, margin:"0 auto 14px", background:"rgba(139,92,246,0.12)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🌟</div>
                <h3 style={{ fontWeight:700, marginBottom:6 }}>Moliikey</h3>
                <p style={{ color:"#8888aa", fontSize:12, marginBottom:18, lineHeight:1.6 }}>Prefix: <code style={{ color:"#a78bfa" }}>moliikey-xxxx</code></p>
                <button className="btn btn-full btn-sm" onClick={() => generate("moliw")} disabled={genLoading !== null}
                  style={{ background:"linear-gradient(135deg, #8b5cf6, #7c3aed)", color:"white", border:"none", boxShadow:"0 4px 20px rgba(139,92,246,0.3)" }}>
                  {genLoading === "moliw" ? <span className="spinner" /> : "Generate Moliikey"}
                </button>
              </div>
            </div>

            {result && (
              <div className="card card-glow animate-fade" style={{ borderColor: result.type==="satria" ? "rgba(59,130,246,0.4)" : "rgba(139,92,246,0.4)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                  <span style={{ background:"rgba(16,185,129,0.15)", color:"#34d399", border:"1px solid rgba(16,185,129,0.3)", borderRadius:8, padding:"4px 12px", fontSize:12, fontWeight:700 }}>✓ KEY GENERATED</span>
                  <span style={{ color:"#8888aa", fontSize:12 }}>{result.type === "satria" ? "⚡ Satriakey" : "🌟 Moliikey"}</span>
                </div>
                <div style={{ marginBottom:12 }}>
                  <label className="label">Username</label>
                  <div style={{ fontWeight:700, fontSize:15 }}>{result.username}</div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label className="label">Access Key</label>
                  <div className="copy-box">
                    <code style={{ color: result.type==="satria" ? "#60a5fa" : "#a78bfa", fontSize:13 }}>{result.key}</code>
                    <button className="btn btn-secondary btn-sm" onClick={() => copy(result.key)} style={{ flexShrink:0 }}>{copied ? "✓" : "Salin"}</button>
                  </div>
                </div>
                <div style={{ padding:"10px 14px", background:"rgba(251,191,36,0.07)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:8, fontSize:12, color:"#fbbf24" }}>
                  ⚠ Simpan key ini dengan aman. Bagikan hanya ke pengguna yang bersangkutan.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ACCOUNTS ── */}
        {tab === "accounts" && (
          <div className="animate-fade">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontWeight:600 }}>Total: {accounts.length} akun</div>
              <button className="btn btn-secondary btn-sm" onClick={fetchAccounts} disabled={dataLoading}>
                {dataLoading ? <span className="spinner" style={{ width:14, height:14 }} /> : "↻ Refresh"}
              </button>
            </div>
            {dataLoading ? (
              <div style={{ textAlign:"center", padding:40, color:"#8888aa" }}>
                <span className="spinner" style={{ margin:"0 auto 12px", display:"block", width:24, height:24, borderTopColor:"#3b82f6" }} />Memuat...
              </div>
            ) : accounts.length === 0 ? (
              <div style={{ textAlign:"center", padding:40, color:"#8888aa", background:"#0d0d1a", border:"1px solid #1e1e35", borderRadius:16 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📂</div>Belum ada akun
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {accounts.map(acc => (
                  <div key={acc.id} className="card" style={{ padding:"14px 18px", opacity: acc.isActive ? 1 : 0.6 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                          <span style={{ fontWeight:700 }}>{acc.username}</span>
                          <span style={{ background: acc.type==="satria" ? "rgba(59,130,246,0.12)" : "rgba(139,92,246,0.12)", color: acc.type==="satria" ? "#60a5fa" : "#a78bfa", border:`1px solid ${acc.type==="satria"?"rgba(59,130,246,0.3)":"rgba(139,92,246,0.3)"}`, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700 }}>
                            {acc.type === "satria" ? "⚡ satria" : "🌟 moliw"}
                          </span>
                          <span style={{ background: acc.isActive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: acc.isActive ? "#34d399" : "#f87171", border:`1px solid ${acc.isActive?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700 }}>
                            {acc.isActive ? "● Aktif" : "○ Nonaktif"}
                          </span>
                        </div>
                        <div className="mono" style={{ fontSize:11, color:"#8888aa", marginBottom:3 }}>{acc.key.slice(0,20)}•••</div>
                        <div style={{ fontSize:11, color:"#44446a" }}>
                          Dibuat: {acc.createdTime} · Login: {acc.usedCount}x
                          {acc.lastLogin && ` · Terakhir: ${acc.lastLogin}`}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => copy(acc.key)}>Salin Key</button>
                        <button className="btn btn-sm" onClick={() => toggleActive(acc.id, acc.isActive)} disabled={toggleLoading === acc.id}
                          style={{ background: acc.isActive ? "rgba(249,115,22,0.15)" : "rgba(16,185,129,0.15)", color: acc.isActive ? "#fb923c" : "#34d399", border:`1px solid ${acc.isActive?"rgba(249,115,22,0.3)":"rgba(16,185,129,0.3)"}` }}>
                          {toggleLoading === acc.id ? <span className="spinner" style={{ width:12, height:12 }} /> : (acc.isActive ? "Nonaktifkan" : "Aktifkan")}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteAcc(acc.id, acc.username)} disabled={deleteLoading === acc.id}>
                          {deleteLoading === acc.id ? <span className="spinner" style={{ width:12, height:12 }} /> : "Hapus"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === "logs" && (
          <div className="animate-fade">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontWeight:600 }}>Activity Logs ({logs.length} entri)</div>
              <button className="btn btn-secondary btn-sm" onClick={fetchLogs} disabled={dataLoading}>
                {dataLoading ? <span className="spinner" style={{ width:14, height:14 }} /> : "↻ Refresh"}
              </button>
            </div>
            {dataLoading ? (
              <div style={{ textAlign:"center", padding:40, color:"#8888aa" }}>
                <span className="spinner" style={{ margin:"0 auto 12px", display:"block", width:24, height:24, borderTopColor:"#3b82f6" }} />Memuat...
              </div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign:"center", padding:40, color:"#8888aa", background:"#0d0d1a", border:"1px solid #1e1e35", borderRadius:16 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📋</div>Belum ada aktivitas
              </div>
            ) : (
              <div style={{ background:"#0a0a10", border:"1px solid #1e1e35", borderRadius:12, overflow:"hidden", fontFamily:"JetBrains Mono, monospace" }}>
                <div style={{ display:"grid", gridTemplateColumns:"160px 1fr 140px", padding:"10px 16px", background:"#0d0d1a", borderBottom:"1px solid #1e1e35", fontSize:11, color:"#44446a", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  <span>Action</span><span>Detail</span><span>Waktu</span>
                </div>
                {logs.map(log => (
                  <div key={log.id} style={{ display:"grid", gridTemplateColumns:"160px 1fr 140px", padding:"9px 16px", borderBottom:"1px solid #13131f", fontSize:11, alignItems:"center" }}
                    onMouseEnter={e => (e.currentTarget.style.background="#0f0f1e")}
                    onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                    <span style={{ color:ACTION_COLOR[log.action]||"#8888aa", fontWeight:700 }}>{log.action}</span>
                    <span style={{ color:"#8888aa", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", paddingRight:12 }}>{log.detail}</span>
                    <span style={{ color:"#44446a" }}>{log.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
