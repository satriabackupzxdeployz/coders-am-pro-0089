"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dbProxy } from "@/lib/api";

interface Account { username: string; type: string; key: string; }
type Tab = "send" | "verify" | "inbox";
interface EmailItem { id: string; to: string; verifyLink?: string; status: string; time: string; timestamp: number; }

function Toast({ msg, type, onClose }: { msg: string; type: "success"|"error"|"info"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const colors = { success:"#0d2419", error:"#200d0d", info:"#0d1424" };
  const borders = { success:"#10b981", error:"#ef4444", info:"#3b82f6" };
  const texts = { success:"#34d399", error:"#f87171", info:"#60a5fa" };
  const icons = { success:"✓", error:"✕", info:"ℹ" };
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, padding:"14px 20px", borderRadius:12,
      background:colors[type], border:`1px solid ${borders[type]}`, color:texts[type],
      fontSize:14, fontWeight:500, display:"flex", alignItems:"center", gap:10,
      animation:"slideInRight 0.3s ease", boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
      {icons[type]} {msg}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [tab, setTab] = useState<Tab>("send");
  const [toast, setToast] = useState<{msg:string;type:"success"|"error"|"info"}|null>(null);
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sentLink, setSentLink] = useState("");
  const [verEmail, setVerEmail] = useState("");
  const [verLink, setVerLink] = useState("");
  const [verDone, setVerDone] = useState(false);
  const [inbox, setInbox] = useState<EmailItem[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [filterEmail, setFilterEmail] = useState("");

  const showToast = (msg: string, type: "success"|"error"|"info" = "info") => setToast({ msg, type });

  useEffect(() => {
    const s = sessionStorage.getItem("account");
    if (!s) { router.push("/"); return; }
    setAccount(JSON.parse(s));
  }, [router]);

  const fetchInbox = useCallback(async () => {
    if (!account) return;
    setInboxLoading(true);
    const data = await dbProxy("get_inbox", { accountKey: account.key, email: filterEmail });
    if (data.ok) setInbox(data.emails || []);
    else showToast("Gagal memuat inbox", "error");
    setInboxLoading(false);
  }, [account, filterEmail]);

  useEffect(() => { if (tab === "inbox" && account) fetchInbox(); }, [tab, account, fetchInbox]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;
    setLoading(true);
    const data = await dbProxy("send_email", { email: sendEmail, accountKey: account.key });
    if (data.ok) { setSentLink(data.verifyLink); showToast("Email berhasil dikirim!", "success"); }
    else showToast(data.msg || "Gagal kirim", "error");
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;
    setLoading(true);
    const data = await dbProxy("verify_email", { email: verEmail, link: verLink, accountKey: account.key });
    if (data.ok) { setVerDone(true); showToast("Email berhasil diverifikasi!", "success"); }
    else showToast(data.msg || "Gagal verifikasi", "error");
    setLoading(false);
  }

  function copy(text: string) { navigator.clipboard.writeText(text).then(() => showToast("Disalin!", "success")); }
  function logout() { sessionStorage.clear(); router.push("/"); }

  if (!account) return null;

  const isS = account.type === "satria";
  const tColor = isS ? "#60a5fa" : "#a78bfa";
  const tBg = isS ? "rgba(59,130,246,0.12)" : "rgba(139,92,246,0.12)";
  const tBorder = isS ? "rgba(59,130,246,0.3)" : "rgba(139,92,246,0.3)";

  return (
    <div style={{ minHeight:"100vh", padding:"24px 16px", position:"relative", zIndex:1 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ maxWidth:680, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }} className="animate-fade">
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg, #3b82f6, #8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(59,130,246,0.3)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7" r="4" stroke="white" strokeWidth="2"/></svg>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>{account.username}</div>
              <span style={{ background:tBg, color:tColor, border:`1px solid ${tBorder}`, borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                {isS ? "⚡ Satriakey" : "🌟 Moliikey"}
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2"/><polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/></svg>
            Keluar
          </button>
        </div>

        {/* Key display */}
        <div className="card animate-fade" style={{ marginBottom:20, animationDelay:"0.05s" }}>
          <label className="label">Access Key Aktif</label>
          <div className="copy-box">
            <code style={{ fontSize:12 }}>{account.key}</code>
            <button className="btn btn-secondary btn-sm" onClick={() => copy(account.key)} style={{ flexShrink:0 }}>Salin</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs animate-fade" style={{ marginBottom:20, animationDelay:"0.1s" }}>
          {[
            { id:"send", label:"Kirim Email" },
            { id:"verify", label:"Verifikasi" },
            { id:"inbox", label:"Inbox" },
          ].map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id as Tab)}>{t.label}</button>
          ))}
        </div>

        {/* ── SEND ── */}
        {tab === "send" && (
          <div className="card animate-fade">
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Kirim Email</h3>
            <p style={{ color:"#8888aa", fontSize:13, marginBottom:20 }}>Masukkan email tujuan untuk dikirim link verifikasi.</p>
            <form onSubmit={handleSend}>
              <div style={{ marginBottom:16 }}>
                <label className="label">Alamat Email</label>
                <input className="input" type="email" placeholder="contoh@email.com" value={sendEmail} onChange={e => setSendEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading || !sendEmail}>
                {loading ? <span className="spinner" /> : "Kirim Email"}
              </button>
            </form>
            {sentLink && (
              <div style={{ marginTop:20 }}>
                <div className="divider" />
                <label className="label" style={{ color:"#34d399" }}>✓ Email Terkirim — Link Verifikasi</label>
                <div className="copy-box">
                  <code style={{ fontSize:11, color:"#06b6d4" }}>{sentLink}</code>
                  <button className="btn btn-secondary btn-sm" onClick={() => copy(sentLink)} style={{ flexShrink:0 }}>Salin</button>
                </div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop:10 }}
                  onClick={() => { setVerEmail(sendEmail); setVerLink(sentLink); setTab("verify"); }}>
                  Lanjut ke Verifikasi →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── VERIFY ── */}
        {tab === "verify" && (
          <div className="card animate-fade">
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Verifikasi Email</h3>
            <p style={{ color:"#8888aa", fontSize:13, marginBottom:20 }}>Masukkan email dan link yang diterima.</p>
            {verDone ? (
              <div style={{ textAlign:"center", padding:"32px 20px", background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:12 }}>
                <div style={{ width:56, height:56, margin:"0 auto 16px", background:"rgba(16,185,129,0.15)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontSize:18, fontWeight:700, color:"#34d399", marginBottom:8 }}>Verifikasi Berhasil!</div>
                <div style={{ color:"#8888aa", fontSize:14, marginBottom:20 }}>Email <strong style={{ color:"#f0f0ff" }}>{verEmail}</strong> telah diverifikasi.</div>
                <button className="btn btn-success btn-sm" onClick={() => { setVerDone(false); setVerEmail(""); setVerLink(""); }}>Selesai</button>
              </div>
            ) : (
              <form onSubmit={handleVerify}>
                <div style={{ marginBottom:16 }}>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={verEmail} onChange={e => setVerEmail(e.target.value)} required />
                </div>
                <div style={{ marginBottom:20 }}>
                  <label className="label">Link Verifikasi</label>
                  <input className="input mono" type="text" placeholder="https://..." value={verLink} onChange={e => setVerLink(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading || !verEmail || !verLink}>
                  {loading ? <span className="spinner" /> : "Verifikasi Sekarang"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── INBOX ── */}
        {tab === "inbox" && (
          <div className="animate-fade">
            <div className="card" style={{ marginBottom:16 }}>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>Temp Mail Inbox</h3>
              <div style={{ display:"flex", gap:10 }}>
                <input className="input" type="email" placeholder="Filter by email..." value={filterEmail} onChange={e => setFilterEmail(e.target.value)} style={{ flex:1 }} />
                <button className="btn btn-secondary btn-sm" onClick={fetchInbox} disabled={inboxLoading} style={{ flexShrink:0 }}>
                  {inboxLoading ? <span className="spinner" style={{ width:14, height:14 }} /> : "↻ Refresh"}
                </button>
              </div>
            </div>
            {inboxLoading ? (
              <div style={{ textAlign:"center", padding:40, color:"#8888aa" }}>
                <span className="spinner" style={{ margin:"0 auto 12px", display:"block", width:24, height:24, borderTopColor:"#3b82f6" }} />
                Memuat inbox...
              </div>
            ) : inbox.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#8888aa", background:"#0d0d1a", border:"1px solid #1e1e35", borderRadius:16 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
                <div style={{ fontSize:14 }}>Inbox kosong</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {inbox.map(em => (
                  <div key={em.id} className="card" style={{ padding:"14px 18px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontWeight:600, fontSize:14 }}>Email Masuk</span>
                      <span style={{ background:"rgba(16,185,129,0.12)", color:"#34d399", border:"1px solid rgba(16,185,129,0.3)", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700 }}>✓ {em.status}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#8888aa", marginBottom:8 }}>To: {em.to}</div>
                    {em.verifyLink && (
                      <div className="copy-box" style={{ marginBottom:8 }}>
                        <code style={{ fontSize:11 }}>{em.verifyLink}</code>
                        <button className="btn btn-secondary btn-sm" onClick={() => copy(em.verifyLink!)} style={{ flexShrink:0 }}>Salin</button>
                      </div>
                    )}
                    <div style={{ fontSize:11, color:"#44446a" }}>{em.time}</div>
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
