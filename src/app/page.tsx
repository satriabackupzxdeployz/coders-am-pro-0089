"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { dbProxy } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true); setError("");
    const data = await dbProxy("check_key", { key: key.trim() });
    if (data.ok) {
      sessionStorage.setItem("account", JSON.stringify(data.account));
      router.push("/dashboard");
    } else {
      setError(data.msg || "Key tidak valid");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative", zIndex:1 }}>
      <div style={{ position:"fixed", top:"20%", left:"10%", width:400, height:400, background:"radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"20%", right:"10%", width:300, height:300, background:"radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", borderRadius:"50%", pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:40 }} className="animate-fade">
          <div style={{ width:72, height:72, margin:"0 auto 20px", background:"linear-gradient(135deg, #3b82f6, #8b5cf6)", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 40px rgba(59,130,246,0.35)" }} className="animate-float">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="white" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <h1 style={{ fontSize:28, fontWeight:700, marginBottom:8 }}><span className="gradient-text">Premium Portal</span></h1>
          <p style={{ color:"#8888aa", fontSize:14 }}>Masukkan access key untuk melanjutkan</p>
        </div>

        <div className="card card-glow animate-fade" style={{ animationDelay:"0.1s" }}>
          <div style={{ position:"absolute", inset:0, overflow:"hidden", borderRadius:16, pointerEvents:"none" }}>
            <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)", animation:"scanline 3s linear infinite" }} />
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:20 }}>
              <label className="label">Access Key</label>
              <div style={{ position:"relative" }}>
                <input className="input mono" type="text" placeholder="Satriakey-XXXX atau moliikey-XXXX"
                  value={key} onChange={e => setKey(e.target.value)} autoComplete="off" spellCheck={false}
                  style={{ paddingRight:44 }} />
                <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"#4444aa" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
              {error && (
                <div style={{ marginTop:8, color:"#f87171", fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/></svg>
                  {error}
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || !key.trim()}>
              {loading ? <span className="spinner" /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" stroke="currentColor" strokeWidth="2"/><polyline points="10,17 15,12 10,7" stroke="currentColor" strokeWidth="2"/><line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2"/></svg>}
              {loading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>

          <div className="divider" style={{ marginTop:24 }} />
          <div style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"#8888aa", lineHeight:1.6 }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginTop:2, flexShrink:0, color:"#3b82f6" }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              <span>Key hanya bisa diperoleh dari admin. Hubungi administrator untuk mendapatkan akses.</span>
            </div>
          </div>
        </div>
        <p style={{ textAlign:"center", marginTop:24, fontSize:12, color:"#44446a" }}>Premium Portal © 2024 · Secured & Encrypted</p>
      </div>
      <style>{`@keyframes scanline{0%{top:0}100%{top:100%}}`}</style>
    </div>
  );
}
