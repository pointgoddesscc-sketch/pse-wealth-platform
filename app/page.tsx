"use client";
import { useState, useEffect } from "react";

type View =
  | "welcome" | "register" | "verify" | "login"
  | "dashboard" | "send" | "receive" | "topup" | "history"
  | "crypto" | "giftcards" | "cards" | "more" | "linkbank"
  | "security";

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  account: string;
  routing: string;
  balance: number;
  bonus: number;
  unlocked: boolean;
  txs: any[];
  createdAt: string;
  verified: boolean;
}

function genAccount() {
  const p = () => Math.floor(1000 + Math.random() * 9000);
  return `${p()}-${p()}-${p()}-${p()}`;
}

function genId() {
  return "u_" + Math.random().toString(36).slice(2, 10);
}

export default function BankApp() {
  const [view, setView] = useState<View>("welcome");
  const [users, setUsers] = useState<User[]>([]);
  const [current, setCurrent] = useState<User | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rCountry, setRCountry] = useState("United States");
  const [rPass, setRPass] = useState("");
  const [rPass2, setRPass2] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingUser, setPendingUser] = useState<Partial<User> | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [lEmail, setLEmail] = useState("");
  const [lPass, setLPass] = useState("");
  const [to, setTo] = useState("");
  const [amt, setAmt] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [cryptoAmt, setCryptoAmt] = useState("0.025");
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [gcBrand, setGcBrand] = useState("Apple");
  const [gcRange, setGcRange] = useState(100);

  const topups = [
    { a: 50, u: "https://buy.stripe.com/test_28EeVe6Esenb1TJ0ct8N201" },
    { a: 100, u: "https://buy.stripe.com/test_fZubJ2aUI2Et7e37EV8N200" },
    { a: 250, u: "https://buy.stripe.com/test_5kQ5kE4wkcf31TJcZf8N202" },
    { a: 500, u: "https://buy.stripe.com/test_dRmeVed2Q3IxdCr1gx8N203" },
    { a: 1000, u: "https://buy.stripe.com/test_14A3cw4wk2Etcyn2kB8N204" },
  ];

  const cryptoRates: Record<string, number> = {
    BTC: 62847.52, ETH: 3102.87, SOL: 148.22, XRP: 0.62, ADA: 0.38, DOGE: 0.12,
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pse_multi_v1");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.users) setUsers(d.users);
        if (d.currentId) {
          const u = (d.users || []).find((x: User) => x.id === d.currentId);
          if (u) { setCurrent(u); setView("dashboard"); }
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("pse_multi_v1", JSON.stringify({ users, currentId: current?.id || null }));
    } catch {}
  }, [users, current]);

  function updateCurrent(patch: Partial<User>) {
    if (!current) return;
    const updated = { ...current, ...patch };
    setCurrent(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  }

  function startRegister() {
    setError("");
    if (!rName.trim() || !rEmail.trim() || !rPass || !rPhone.trim()) { setError("All fields are required"); return; }
    if (rPass.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (rPass !== rPass2) { setError("Passwords do not match"); return; }
    if (!acceptTerms) { setError("You must accept the Terms of Service"); return; }
    if (users.some(u => u.email.toLowerCase() === rEmail.toLowerCase())) { setError("An account with this email already exists. Please login."); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setPendingUser({ name: rName.trim(), email: rEmail.trim().toLowerCase(), password: rPass, phone: rPhone.trim(), country: rCountry });
    setView("verify");
    setMsg("Verification code sent (demo): " + code);
  }

  function completeVerify() {
    setError("");
    if (otp !== generatedOtp) { setError("Invalid verification code"); return; }
    if (!pendingUser) return;
    setLoading(true);
    setTimeout(() => {
      const newUser: User = {
        id: genId(), name: pendingUser.name!, email: pendingUser.email!, password: pendingUser.password!,
        phone: pendingUser.phone!, country: pendingUser.country!, account: genAccount(), routing: "021000021",
        balance: 1000, bonus: 0, unlocked: true, txs: [], createdAt: new Date().toISOString(), verified: true,
      };
      setUsers(prev => [...prev, newUser]);
      setCurrent(newUser);
      setPendingUser(null); setOtp(""); setLoading(false);
      setMsg("Account verified and created successfully");
      setView("dashboard");
      setTimeout(() => setMsg(""), 2500);
    }, 1000);
  }

  function login() {
    setError(""); setLoading(true);
    setTimeout(() => {
      const u = users.find(x => x.email.toLowerCase() === lEmail.toLowerCase() && x.password === lPass);
      if (!u) { setError("Invalid email or password"); setLoading(false); return; }
      setCurrent(u); setView("dashboard"); setLoading(false);
    }, 700);
  }

  function logout() { setCurrent(null); setView("welcome"); setLEmail(""); setLPass(""); }

  function doSend() {
    if (!current) return;
    const a = parseFloat(amt);
    if (!to || !a || a <= 0) { setMsg("Enter valid recipient and amount"); return; }
    if (a > current.balance) { setMsg("Insufficient funds"); return; }
    setLoading(true);
    setTimeout(() => {
      const recipient = users.find(u => u.account === to || u.account.replace(/-/g, "") === to.replace(/-/g, ""));
      let updatedUsers = users.map(u => {
        if (u.id === current.id) return { ...u, balance: u.balance - a, txs: [{ id: Date.now(), type: "sent", amount: a, to, date: new Date().toLocaleString() }, ...u.txs] };
        if (recipient && u.id === recipient.id) return { ...u, balance: u.balance + a, txs: [{ id: Date.now(), type: "received", amount: a, from: current.account, date: new Date().toLocaleString() }, ...u.txs] };
        return u;
      });
      setUsers(updatedUsers);
      const me = updatedUsers.find(u => u.id === current.id)!;
      setCurrent(me);
      setMsg(recipient ? "Transfer completed — recipient credited" : "Transfer completed");
      setTo(""); setAmt(""); setLoading(false);
      setTimeout(() => { setMsg(""); setView("dashboard"); }, 1500);
    }, 1000);
  }

  function buyCrypto() {
    if (!current) return;
    const amtNum = parseFloat(cryptoAmt || "0");
    if (amtNum <= 0) { setMsg("Enter a valid crypto amount"); return; }
    const usd = amtNum * cryptoRates[selectedCrypto];
    if (usd > current.balance) { setMsg("Insufficient funds for this purchase"); return; }
    setLoading(true);
    setTimeout(() => {
      updateCurrent({
        balance: current.balance - usd,
        txs: [{ id: Date.now(), type: "crypto", amount: usd, to: `${amtNum} ${selectedCrypto}`, date: new Date().toLocaleString() }, ...current.txs],
      });
      setMsg(`Successfully bought ${amtNum} ${selectedCrypto} for $${usd.toFixed(2)}`);
      setLoading(false);
      setTimeout(() => { setMsg(""); setView("history"); }, 1800);
    }, 1200);
  }

  function buyGiftcard() {
    if (!current) return;
    const cost = gcRange;
    if (cost > current.balance) { setMsg("Insufficient funds for this gift card"); return; }
    setLoading(true);
    setTimeout(() => {
      updateCurrent({
        balance: current.balance - cost,
        txs: [{ id: Date.now(), type: "giftcard", amount: cost, to: `${gcBrand} $${gcRange} Gift Card`, date: new Date().toLocaleString() }, ...current.txs],
      });
      setMsg(`Purchased ${gcBrand} $${gcRange} gift card successfully`);
      setLoading(false);
      setTimeout(() => { setMsg(""); setView("history"); }, 1800);
    }, 1200);
  }

  const card: any = { background: "#111827", borderRadius: 16, padding: 18, border: "1px solid #1e293b", marginBottom: 12 };
  const btnP: any = { background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 20px", fontWeight: 700, cursor: "pointer", width: "100%", fontSize: 15 };
  const btnG: any = { background: "transparent", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 12, padding: "12px 18px", fontWeight: 600, cursor: "pointer" };
  const inp: any = { width: "100%", padding: "13px 14px", borderRadius: 12, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", marginTop: 6, boxSizing: "border-box", fontSize: 15 };
  const lbl: any = { fontSize: 11, color: "#94a3b8", letterSpacing: "0.06em", fontWeight: 600 };

  if (view === "welcome") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg,#070b14,#0f172a 50%,#0c1220)", color: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui,-apple-system,sans-serif" }}>
        <div style={{ width: 68, height: 68, borderRadius: 20, background: "linear-gradient(135deg,#0ea5e9,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 30, fontWeight: 800, color: "#fff", boxShadow: "0 12px 40px rgba(14,165,233,0.4)" }}>P</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.03em" }}>PS&E Bank</h1>
        <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 6, textAlign: "center" }}>Private Banking & Wealth Platform</p>
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 36, textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>Open an account in minutes. Transfers, crypto, top-ups & live support.</p>
        <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
          <button style={btnP} onClick={() => { setView("register"); setError(""); }}>Create Free Account</button>
          <button style={btnG} onClick={() => { setView("login"); setError(""); }}>Sign In</button>
        </div>
        <div style={{ marginTop: 32, fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 1.7 }}>
          🔒 256-bit encrypted · Multi-user · Private banking<br />
          Support: <a href="mailto:psebank@pm.me" style={{ color: "#38bdf8" }}>psebank@pm.me</a>
        </div>
      </div>
    );
  }

  if (view === "register") {
    return (
      <div style={{ minHeight: "100vh", background: "#070b14", color: "#e2e8f0", padding: 24, fontFamily: "system-ui,sans-serif" }}>
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <button style={{ ...btnG, marginBottom: 18, width: "auto", padding: "8px 14px" }} onClick={() => setView("welcome")}>← Back</button>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Create Your Account</h2>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 22 }}>Step 1 of 2 — Personal information</p>
          {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", padding: 12, borderRadius: 12, marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div style={card}>
            <div style={{ marginBottom: 12 }}><div style={lbl}>FULL LEGAL NAME *</div><input style={inp} value={rName} onChange={e => setRName(e.target.value)} placeholder="Jane Doe" /></div>
            <div style={{ marginBottom: 12 }}><div style={lbl}>EMAIL *</div><input style={inp} type="email" value={rEmail} onChange={e => setREmail(e.target.value)} placeholder="you@example.com" /></div>
            <div style={{ marginBottom: 12 }}><div style={lbl}>PHONE *</div><input style={inp} value={rPhone} onChange={e => setRPhone(e.target.value)} placeholder="+1 555 000 0000" /></div>
            <div style={{ marginBottom: 12 }}><div style={lbl}>COUNTRY</div>
              <select style={inp} value={rCountry} onChange={e => setRCountry(e.target.value)}>
                <option>United States</option><option>United Kingdom</option><option>Canada</option><option>Nigeria</option><option>Other</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}><div style={lbl}>PASSWORD * (min 8 chars)</div><input style={inp} type="password" value={rPass} onChange={e => setRPass(e.target.value)} placeholder="••••••••" /></div>
            <div style={{ marginBottom: 16 }}><div style={lbl}>CONFIRM PASSWORD *</div><input style={inp} type="password" value={rPass2} onChange={e => setRPass2(e.target.value)} placeholder="••••••••" /></div>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "#94a3b8", marginBottom: 18, cursor: "pointer" }}>
              <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} style={{ marginTop: 3 }} />
              <span>I accept the Terms of Service and confirm I am 18+ years of age.</span>
            </label>
            <button style={btnP} onClick={startRegister}>Continue to Verification</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "verify") {
    return (
      <div style={{ minHeight: "100vh", background: "#070b14", color: "#e2e8f0", padding: 24, fontFamily: "system-ui,sans-serif" }}>
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Verify Your Identity</h2>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 22 }}>Step 2 of 2 — Enter the 6-digit code</p>
          {msg && <div style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.35)", color: "#7dd3fc", padding: 12, borderRadius: 12, marginBottom: 14, fontSize: 13 }}>{msg}</div>}
          {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", padding: 12, borderRadius: 12, marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div style={card}>
            <div style={lbl}>VERIFICATION CODE</div>
            <input style={{ ...inp, textAlign: "center", letterSpacing: "0.35em", fontSize: 24 }} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} />
            <button style={{ ...btnP, marginTop: 18 }} onClick={completeVerify} disabled={loading || otp.length < 6}>{loading ? "Creating account..." : "Verify & Open Account"}</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "login") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(165deg,#070b14,#0f172a)", color: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui,sans-serif" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#0ea5e9,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 24, fontWeight: 800, color: "#fff" }}>P</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Sign In</h1>
        <div style={{ ...card, maxWidth: 400, width: "100%", padding: 28 }}>
          {error && <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5", padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 13 }}>{error}</div>}
          <div style={{ marginBottom: 14 }}><div style={lbl}>EMAIL</div><input style={inp} type="email" value={lEmail} onChange={e => setLEmail(e.target.value)} placeholder="you@example.com" /></div>
          <div style={{ marginBottom: 22 }}><div style={lbl}>PASSWORD</div><input style={inp} type="password" value={lPass} onChange={e => setLPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && login()} /></div>
          <button style={btnP} onClick={login} disabled={loading}>{loading ? "Signing in..." : "Secure Login"}</button>
          <button style={{ ...btnG, width: "100%", marginTop: 12 }} onClick={() => setView("welcome")}>Create new account</button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#070b14", color: "#e2e8f0", fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,sans-serif", paddingBottom: 72 }}>
      <header style={{ background: "rgba(7,11,20,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #1e293b", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0ea5e9,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff" }}>P</div>
          <div><div style={{ fontWeight: 700, fontSize: 14 }}>PS&E Bank</div><div style={{ fontSize: 10, color: "#64748b" }}>Secure Banking Service</div></div>
        </div>
        <button onClick={logout} style={{ ...btnG, padding: "7px 14px", fontSize: 12, borderRadius: 999 }}>Logout</button>
      </header>

      <main style={{ padding: "18px 14px", maxWidth: 440, margin: "0 auto" }}>
        {msg && <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", color: "#6ee7b7", padding: 12, borderRadius: 12, marginBottom: 14, fontSize: 13, textAlign: "center" }}>{msg}</div>}

        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>Welcome back</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: "2px 0 8px", letterSpacing: "-0.02em" }}>{current.name}</h1>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 999, padding: "4px 12px", fontSize: 12, color: "#34d399", fontWeight: 600 }}>✓ Verified</div>
            </div>
            <div style={{ ...card, background: "linear-gradient(145deg,#0f172a,#111827)" }}>
              <div style={lbl}>ACCOUNT NUMBER</div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.06em", marginTop: 6, fontFamily: "ui-monospace,SFMono-Regular,monospace" }}>{current.account}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Routing: {current.routing}</div>
            </div>
            <div style={{ background: "linear-gradient(135deg,#059669,#10b981)", borderRadius: 18, padding: "22px 20px", color: "#fff", marginBottom: 12, boxShadow: "0 12px 32px rgba(16,185,129,0.28)" }}>
              <div style={{ fontSize: 12, opacity: 0.9, letterSpacing: "0.04em" }}>AVAILABLE BALANCE</div>
              <div style={{ fontSize: 36, fontWeight: 800, margin: "6px 0 2px", letterSpacing: "-0.02em" }}>${current.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>USD</div>
            </div>
            <div style={{ marginTop: 4, marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 10, letterSpacing: "0.04em" }}>LINKED BANKS</div>
              <div style={{ ...card, marginBottom: 8, textAlign: "center", padding: "18px 16px", color: "#94a3b8", fontSize: 13 }}>No external banks linked yet</div>
              <button onClick={() => setView("linkbank")} style={{ ...btnG, width: "100%", marginBottom: 16, fontSize: 13, borderStyle: "dashed" }}>+ Add Bank Account</button>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 10, letterSpacing: "0.04em" }}>QUICK ACTIONS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
              {[
                { id: "send" as View, label: "Send", icon: "↑", sub: "Transfer funds" },
                { id: "receive" as View, label: "Receive", icon: "↓", sub: "Get paid" },
                { id: "topup" as View, label: "Top Up", icon: "💳", sub: "Stripe checkout" },
                { id: "crypto" as View, label: "Crypto", icon: "₿", sub: "Buy & trade" },
                { id: "cards" as View, label: "Cards", icon: "✦", sub: "Virtual Visa" },
                { id: "giftcards" as View, label: "Giftcards", icon: "🎁", sub: "Rate calculator" },
              ].map(item => (
                <button key={item.id} onClick={() => setView(item.id)} style={{ ...card, textAlign: "left", cursor: "pointer", color: "inherit", marginBottom: 0, padding: "16px 14px" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                  <div style={{ fontWeight: 650, fontSize: 14 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{item.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === "send" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Send Money</h2>
            <div style={card}>
              <div style={{ marginBottom: 14 }}><div style={lbl}>RECIPIENT ACCOUNT NUMBER</div><input style={inp} value={to} onChange={e => setTo(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" /></div>
              <div style={{ marginBottom: 16 }}><div style={lbl}>AMOUNT (USD)</div><input style={inp} value={amt} onChange={e => setAmt(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" /></div>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, color: "#94a3b8" }}>Available: <strong style={{ color: "#e2e8f0" }}>${current.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ ...btnG, flex: 1 }} onClick={() => setView("dashboard")}>Cancel</button>
                <button style={{ ...btnP, flex: 1 }} onClick={doSend} disabled={loading}>{loading ? "Processing..." : "Send Now"}</button>
              </div>
            </div>
          </div>
        )}

        {view === "receive" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Receive Money</h2>
            <div style={{ ...card, textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>Your Account Number</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.06em", fontFamily: "ui-monospace,monospace", marginBottom: 6 }}>{current.account}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 22 }}>Routing: {current.routing}</div>
              <button style={btnP} onClick={() => { navigator.clipboard.writeText(current.account); setMsg("Account number copied"); setTimeout(() => setMsg(""), 2000); }}>Copy Account Number</button>
            </div>
          </div>
        )}

        {view === "topup" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Top Up</h2>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 18 }}>Fund your ledger via Stripe Checkout (test mode)</p>
            {topups.map(t => (
              <a key={t.a} href={t.u} target="_blank" rel="noreferrer" style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "#e2e8f0", padding: "16px 18px" }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>${t.a.toLocaleString()}</span>
                <span style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)", color: "#fff", padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600 }}>Pay</span>
              </a>
            ))}
          </div>
        )}

        {view === "crypto" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Rate Calculator</h2>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 18 }}>Live rates · Trade with your USD balance</p>
            <div style={card}>
              <div style={lbl}>CRYPTOCURRENCY</div>
              <select style={{ ...inp, marginBottom: 16 }} value={selectedCrypto} onChange={e => setSelectedCrypto(e.target.value)}>
                {Object.keys(cryptoRates).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={lbl}>CRYPTO VALUE</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6, marginBottom: 16 }}>
                <input style={{ ...inp, marginTop: 0, flex: 1 }} value={cryptoAmt} onChange={e => setCryptoAmt(e.target.value.replace(/[^0-9.]/g, ""))} />
                <span style={{ fontWeight: 700, color: "#38bdf8", fontSize: 15 }}>{selectedCrypto}</span>
              </div>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Rate</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>1 {selectedCrypto} = ${cryptoRates[selectedCrypto].toLocaleString("en-US", { minimumFractionDigits: 2 })} USD</div>
              </div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Total Value (USD)</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>${(parseFloat(cryptoAmt || "0") * cryptoRates[selectedCrypto]).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD</div>
              </div>
              <button style={btnP} onClick={buyCrypto} disabled={loading}>{loading ? "Processing..." : `Buy ${selectedCrypto} Now`}</button>
            </div>
          </div>
        )}

        {view === "giftcards" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Giftcard Rate Calculator</h2>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 18 }}>Calculate payout for US giftcards · Live rate</p>
            <div style={card}>
              <div style={lbl}>SELECT GIFTCARD</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 18, flexWrap: "wrap" }}>
                {["Apple", "Sephora", "Walmart"].map(b => (
                  <button key={b} onClick={() => setGcBrand(b)} style={{
                    padding: "10px 16px", borderRadius: 12, border: "none", fontWeight: 650, fontSize: 13, cursor: "pointer",
                    background: gcBrand === b ? "linear-gradient(135deg,#0ea5e9,#0284c7)" : "#1e293b", color: gcBrand === b ? "#fff" : "#94a3b8",
                  }}>{b}</button>
                ))}
              </div>
              <div style={lbl}>SELECT CARD RANGE</div>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 16, marginTop: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>${gcRange}</div>
                <input type="range" min={50} max={200} step={25} value={gcRange} onChange={e => setGcRange(Number(e.target.value))} style={{ width: "100%", accentColor: "#0ea5e9" }} />
              </div>
              <button style={btnP} onClick={buyGiftcard} disabled={loading}>{loading ? "Processing..." : `Buy ${gcBrand} $${gcRange} Gift Card`}</button>
            </div>
          </div>
        )}

        {view === "cards" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Virtual Cards</h2>
            <div style={{ ...card, background: "linear-gradient(145deg,#0c1220,#1e293b)" }}>
              <div style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)", borderRadius: 14, padding: 20, marginBottom: 18, color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>PS&E ELITE</div>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>VIRTUAL</div>
                </div>
                <div style={{ fontFamily: "ui-monospace,monospace", fontSize: 16, letterSpacing: "0.12em", marginBottom: 16 }}>•••• •••• •••• 4587</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <div><div style={{ opacity: 0.7 }}>VALID</div><div style={{ fontWeight: 600 }}>09/28</div></div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>VISA</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Available Balance</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>${current.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD</div>
              <button style={btnP} onClick={() => setMsg("Virtual card ready for online use")}>Get Virtual Card Now</button>
            </div>
          </div>
        )}

        {view === "linkbank" && (
          <div>
            <button style={{ ...btnG, marginBottom: 16, width: "auto", padding: "8px 14px" }} onClick={() => setView("dashboard")}>← Back</button>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Add Bank Account</h2>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 18 }}>Securely link your US bank account · 256-bit encrypted</p>
            <div style={card}>
              {["Chase Bank", "Bank of America", "Wells Fargo", "Citibank", "Capital One"].map(b => (
                <button key={b} onClick={() => setMsg(b + " linking is demo-only")} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 16px", marginBottom: 8,
                  color: "#e2e8f0", cursor: "pointer", fontSize: 14, fontWeight: 600,
                }}>
                  <span>{b}</span><span style={{ color: "#64748b" }}>›</span>
                </button>
              ))}
              <button style={btnP} onClick={() => { setMsg("Bank link request submitted (demo)"); setTimeout(() => setView("dashboard"), 1200); }}>Continue & Verify</button>
            </div>
          </div>
        )}

        {view === "history" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Activity</h2>
            <div style={{ ...card, background: "linear-gradient(145deg,#0f172a,#111827)", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Available Balance</div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: "4px 0" }}>${current.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Checking ···· {current.account.slice(-4)}</div>
            </div>
            {current.txs.length === 0 ? (
              <div style={{ ...card, textAlign: "center", color: "#64748b", padding: 40 }}>No transactions yet<br /><span style={{ fontSize: 12 }}>Send, receive, buy crypto or gift cards to see activity here</span></div>
            ) : current.txs.map((tx: any) => (
              <div key={tx.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.type === "received" ? `From ${tx.from}` : tx.type === "crypto" ? `Bought ${tx.to}` : tx.type === "giftcard" ? `Bought ${tx.to}` : `To ${tx.to}`}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{tx.date}</div>
                </div>
                <div style={{ fontWeight: 700, color: tx.type === "received" ? "#34d399" : "#f87171" }}>
                  {tx.type === "received" ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "more" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>More Actions</h2>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 18 }}>Access additional services & tools</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { id: "crypto" as View, label: "Crypto", sub: "Buy · Sell · Wallet", icon: "₿" },
                { id: "giftcards" as View, label: "Giftcards", sub: "Digital & Physical", icon: "🎁" },
                { id: "topup" as View, label: "Mobile Top-up", sub: "AT&T · Verizon", icon: "📱" },
                { id: "cards" as View, label: "Cards", sub: "Virtual Visa", icon: "💳" },
                { id: "linkbank" as View, label: "Link Bank", sub: "Add account", icon: "🏦" },
                { id: "history" as View, label: "Bank Statement", sub: "Download · View", icon: "📄" },
                { id: "security" as View, label: "Security", sub: "Protection layers", icon: "🛡" },
              ].map(item => (
                <button key={item.id} onClick={() => setView(item.id)} style={{ ...card, textAlign: "left", cursor: "pointer", color: "inherit", marginBottom: 0, padding: "18px 14px" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontWeight: 650, fontSize: 14 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{item.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === "security" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Security</h2>
            <div style={card}>
              {["Password-protected login", "Email verification at signup", "Unique account number per user", "Session persistence with logout", "Transfer balance checks", "TLS encryption in transit", "Biometric-ready flows", "Multi-user isolation"].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 11, fontSize: 13.5 }}><span style={{ color: "#34d399", fontWeight: 700 }}>✓</span> {item}</div>
              ))}
            </div>
            <div style={{ ...card, marginTop: 4 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6 }}>OFFICIAL SUPPORT</div>
              <a href="mailto:psebank@pm.me" style={{ color: "#38bdf8", fontWeight: 650, fontSize: 15, textDecoration: "none" }}>psebank@pm.me</a>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Account help · Transfers · Crypto & gift cards</div>
            </div>
          </div>
        )}
      </main>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(7,11,20,0.96)", backdropFilter: "blur(16px)",
        borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 40,
      }}>
        {[
          { id: "dashboard" as View, label: "Home", icon: "⌂" },
          { id: "history" as View, label: "Activity", icon: "☰" },
          { id: "crypto" as View, label: "Crypto", icon: "₿" },
          { id: "cards" as View, label: "Cards", icon: "✦" },
          { id: "more" as View, label: "More", icon: "⊞" },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            background: "none", border: "none", color: view === t.id ? "#38bdf8" : "#64748b", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 600, padding: "4px 10px",
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
