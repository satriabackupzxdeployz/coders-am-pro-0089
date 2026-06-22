// Semua request ke Firebase lewat /api/db (proxy)
// URL Firebase tidak pernah muncul di browser network tab

export async function dbProxy(op: string, payload: Record<string, string> = {}) {
  const res = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ op, payload }),
  });
  return res.json();
}
