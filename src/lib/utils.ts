export function generateKey(prefix: "Satriakey" | "moliikey"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let random = "";
  for (let i = 0; i < 18; i++) random += chars[Math.floor(Math.random() * chars.length)];
  const arr = random.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return `${prefix}-${arr.join("")}`;
}

export function generateUsername(): string {
  const adj = ["Dark","Shadow","Neon","Cyber","Ultra","Prime","Void","Ghost","Iron","Storm"];
  const noun = ["Wolf","Hawk","Rex","Blade","Pulse","Core","Nexus","Knight","Viper","Titan"];
  return `${adj[Math.floor(Math.random()*adj.length)]}${noun[Math.floor(Math.random()*noun.length)]}${Math.floor(Math.random()*9000)+1000}`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("id-ID", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit", second:"2-digit",
  });
}
