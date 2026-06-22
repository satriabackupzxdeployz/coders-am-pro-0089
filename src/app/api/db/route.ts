import { NextRequest, NextResponse } from "next/server";

const DB_URL = process.env.FB_DB_URL!; // server-only, never exposed to client
const ADMIN_PASSWORD = "satriaxmoliww";

function dbUrl(path: string) {
  return `${DB_URL}/${path}.json`;
}

async function dbGet(path: string) {
  const res = await fetch(dbUrl(path), { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function dbSet(path: string, data: unknown) {
  const res = await fetch(dbUrl(path), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function dbPush(path: string, data: unknown) {
  const res = await fetch(dbUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function dbDelete(path: string) {
  await fetch(dbUrl(path), { method: "DELETE" });
}

async function dbQuery(path: string, orderBy: string, equalTo: string) {
  const url = `${DB_URL}/${path}.json?orderBy="${orderBy}"&equalTo="${equalTo}"`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function generateKey(prefix: "Satriakey" | "moliikey"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  for (let i = 0; i < 18; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${r}`;
}

function generateUsername(): string {
  const adj = ["Dark","Shadow","Neon","Cyber","Ultra","Prime","Void","Ghost","Iron","Storm"];
  const noun = ["Wolf","Hawk","Rex","Blade","Pulse","Core","Nexus","Knight","Viper","Titan"];
  return `${adj[Math.floor(Math.random()*adj.length)]}${noun[Math.floor(Math.random()*noun.length)]}${Math.floor(Math.random()*9000)+1000}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("id-ID", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit", second:"2-digit",
  });
}

async function writeLog(action: string, detail: string, by = "system") {
  await dbPush("logs", {
    action, detail, by,
    timestamp: Date.now(),
    time: formatDate(Date.now()),
  });
}

// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { op, payload } = body as { op: string; payload: Record<string, string> };

    // ── CHECK KEY (login VIP) ──────────────────
    if (op === "check_key") {
      const { key } = payload;
      if (!key) return NextResponse.json({ ok: false, msg: "Key kosong" }, { status: 400 });

      const data = await dbQuery("accounts", "key", key.trim());
      if (!data || Object.keys(data).length === 0) {
        await writeLog("LOGIN_FAILED", `Key tidak ditemukan`);
        return NextResponse.json({ ok: false, msg: "Key tidak valid atau tidak ditemukan" }, { status: 401 });
      }

      const [id, acc] = Object.entries(data)[0] as [string, Record<string,unknown>];
      if (!acc.isActive) {
        await writeLog("LOGIN_FAILED", `Key nonaktif: ${acc.type}`);
        return NextResponse.json({ ok: false, msg: "Akun tidak aktif" }, { status: 401 });
      }

      await dbSet(`accounts/${id}/usedCount`, (acc.usedCount as number || 0) + 1);
      await dbSet(`accounts/${id}/lastLogin`, formatDate(Date.now()));
      await writeLog("LOGIN_SUCCESS", `Login berhasil — type: ${acc.type}, user: ${acc.username}`);

      return NextResponse.json({ ok: true, account: { username: acc.username, type: acc.type, key: acc.key } });
    }

    // ── SEND EMAIL ────────────────────────────
    if (op === "send_email") {
      const { email, accountKey } = payload;
      const acc = await dbQuery("accounts", "key", accountKey);
      if (!acc || Object.keys(acc).length === 0)
        return NextResponse.json({ ok: false, msg: "Unauthorized" }, { status: 401 });

      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const verifyLink = `https://${req.headers.get("host")}/verify?e=${encodeURIComponent(email)}&t=${token}`;

      await dbPush("email_queue", {
        to: email, verifyLink, token,
        status: "sent",
        timestamp: Date.now(),
        time: formatDate(Date.now()),
      });
      await writeLog("EMAIL_SENT", `Email dikirim → ${email}`);

      return NextResponse.json({ ok: true, verifyLink });
    }

    // ── VERIFY EMAIL ─────────────────────────
    if (op === "verify_email") {
      const { email, link, accountKey } = payload;
      const acc = await dbQuery("accounts", "key", accountKey);
      if (!acc || Object.keys(acc).length === 0)
        return NextResponse.json({ ok: false, msg: "Unauthorized" }, { status: 401 });

      await dbPush("verifications", {
        email, link,
        status: "verified",
        timestamp: Date.now(),
        time: formatDate(Date.now()),
      });
      await writeLog("EMAIL_VERIFIED", `Email diverifikasi: ${email}`);

      return NextResponse.json({ ok: true });
    }

    // ── GET INBOX ─────────────────────────────
    if (op === "get_inbox") {
      const { accountKey, email } = payload;
      const acc = await dbQuery("accounts", "key", accountKey);
      if (!acc || Object.keys(acc).length === 0)
        return NextResponse.json({ ok: false, msg: "Unauthorized" }, { status: 401 });

      const raw = await dbGet("email_queue");
      if (!raw) return NextResponse.json({ ok: true, emails: [] });

      let emails = Object.entries(raw).map(([id, v]) => ({ id, ...(v as Record<string,unknown>) }));
      if (email) emails = emails.filter((e: Record<string,unknown>) => e.to === email);
      emails.sort((a: Record<string,unknown>, b: Record<string,unknown>) => (b.timestamp as number) - (a.timestamp as number));

      return NextResponse.json({ ok: true, emails: emails.slice(0, 30) });
    }

    // ── ADMIN: AUTH CHECK ─────────────────────
    if (op === "admin_auth") {
      const { password } = payload;
      if (password !== ADMIN_PASSWORD)
        return NextResponse.json({ ok: false, msg: "Password salah" }, { status: 401 });
      await writeLog("ADMIN_LOGIN", "Admin berhasil masuk ke panel");
      return NextResponse.json({ ok: true });
    }

    // ── ADMIN: GENERATE KEY ───────────────────
    if (op === "generate_key") {
      const { password, type } = payload;
      if (password !== ADMIN_PASSWORD)
        return NextResponse.json({ ok: false, msg: "Unauthorized" }, { status: 401 });

      const prefix = type === "satria" ? "Satriakey" : "moliikey";
      const key = generateKey(prefix as "Satriakey" | "moliikey");
      const username = generateUsername();

      await dbPush("accounts", {
        key, username, type,
        isActive: true,
        usedCount: 0,
        createdAt: Date.now(),
        createdTime: formatDate(Date.now()),
      });
      await writeLog("KEY_GENERATED", `${prefix} digenerate — user: ${username}`, "admin");

      return NextResponse.json({ ok: true, key, username, type });
    }

    // ── ADMIN: GET ACCOUNTS ───────────────────
    if (op === "get_accounts") {
      const { password } = payload;
      if (password !== ADMIN_PASSWORD)
        return NextResponse.json({ ok: false, msg: "Unauthorized" }, { status: 401 });

      const raw = await dbGet("accounts");
      if (!raw) return NextResponse.json({ ok: true, accounts: [] });

      const accounts = Object.entries(raw).map(([id, v]) => ({ id, ...(v as Record<string,unknown>) }));
      accounts.sort((a: Record<string,unknown>, b: Record<string,unknown>) => (b.createdAt as number) - (a.createdAt as number));

      return NextResponse.json({ ok: true, accounts });
    }

    // ── ADMIN: DELETE ACCOUNT ─────────────────
    if (op === "delete_account") {
      const { password, accountId } = payload;
      if (password !== ADMIN_PASSWORD)
        return NextResponse.json({ ok: false, msg: "Unauthorized" }, { status: 401 });

      const acc = await dbGet(`accounts/${accountId}`);
      if (!acc) return NextResponse.json({ ok: false, msg: "Akun tidak ditemukan" }, { status: 404 });

      await dbDelete(`accounts/${accountId}`);
      await writeLog("ACCOUNT_DELETED", `Akun dihapus — user: ${acc.username}, key: ${(acc.key as string).slice(0,16)}...`, "admin");

      return NextResponse.json({ ok: true });
    }

    // ── ADMIN: TOGGLE ACTIVE ──────────────────
    if (op === "toggle_active") {
      const { password, accountId, isActive } = payload;
      if (password !== ADMIN_PASSWORD)
        return NextResponse.json({ ok: false, msg: "Unauthorized" }, { status: 401 });

      await dbSet(`accounts/${accountId}/isActive`, isActive === "true");
      await writeLog("ACCOUNT_TOGGLED", `Akun ${accountId} → isActive: ${isActive}`, "admin");

      return NextResponse.json({ ok: true });
    }

    // ── ADMIN: GET LOGS ───────────────────────
    if (op === "get_logs") {
      const { password } = payload;
      if (password !== ADMIN_PASSWORD)
        return NextResponse.json({ ok: false, msg: "Unauthorized" }, { status: 401 });

      const raw = await dbGet("logs");
      if (!raw) return NextResponse.json({ ok: true, logs: [] });

      const logs = Object.entries(raw).map(([id, v]) => ({ id, ...(v as Record<string,unknown>) }));
      logs.sort((a: Record<string,unknown>, b: Record<string,unknown>) => (b.timestamp as number) - (a.timestamp as number));

      return NextResponse.json({ ok: true, logs: logs.slice(0, 150) });
    }

    return NextResponse.json({ ok: false, msg: "Unknown operation" }, { status: 400 });

  } catch (err) {
    console.error("[DB PROXY]", err);
    return NextResponse.json({ ok: false, msg: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ msg: "Not found" }, { status: 404 });
}
