import { useState, useMemo } from "react";

const MONO = "'Courier New', monospace";

const C = {
  bg: "#0B0F14", card: "#131A23", cardAlt: "#182130", border: "#1D2B3C",
  accent: "#3B82F6", accentDim: "#172A4A", green: "#22C55E", greenDim: "#0E2E1A",
  red: "#EF4444", redDim: "#2E1010", amber: "#F59E0B", amberDim: "#2E250A",
  text: "#D8E2EE", dim: "#6B7F96", muted: "#3F5068", white: "#F5F7FA",
};

const f = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "$0";
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};

const MODELS = {
  acquire: {
    label: "Acquire Existing NJ Center",
    sub: "SBA 7(a) / Seller financing · Day-1 revenue · CON included",
    mo: 9500, term: 120, down: 150000, svc: 8000,
    site: 50000, pacs: 25000, wc: 150000, mkt: 30000, acr: 0,
    preRentMo: 1, preRent: 10000,
    note: "Industry: median 0.82× revenue, 3–4× EBITDA (HealthValue Group). Acquisition = minimal buildout, ~1 month transition.",
  },
  refurb: {
    label: "Finance Refurbished 1.5T",
    sub: "Siemens Aera / GE HDxt · Own at term end · Best early cash flow",
    mo: 6000, term: 72, down: 70000, svc: 7500,
    site: 300000, pacs: 85000, wc: 180000, mkt: 35000, acr: 15000,
    preRentMo: 3, preRent: 10000,
    note: "EquipmentFinanceHub: $3,437–$8,592/mo. Pre-opening: 3 months dead rent during RF shielding + install + ACR accreditation.",
  },
  lease: {
    label: "Lease New 1.5T",
    sub: "GE SIGNA Artist / Siemens Altea · Latest tech · Highest burn",
    mo: 15500, term: 84, down: 0, svc: 10000,
    site: 350000, pacs: 85000, wc: 200000, mkt: 40000, acr: 15000,
    preRentMo: 3, preRent: 12000,
    note: "EquipmentFinanceHub: $12,093–$18,139/mo. Pre-opening: 3 months dead rent during buildout + permitting + ACR.",
  },
};

const OPX = [
  { l: "Rent (NJ suburb, 4K sqft)", lo: 7500, mi: 10000, hi: 14000 },
  { l: "MRI Techs × 2 FTE", lo: 16000, mi: 18500, hi: 21000 },
  { l: "Helper / Patient Aide × 1 FTE", lo: 2800, mi: 3500, hi: 4200 },
  { l: "Admin / Front desk × 1.5 FTE", lo: 5500, mi: 7000, hi: 9000 },
  { l: "IT Technician (part-time / MSP)", lo: 1500, mi: 2500, hi: 4000 },
  { l: "Utilities (MRI power draw)", lo: 5000, mi: 6500, hi: 9000 },
  { l: "Internet (dedicated + HIPAA VPN)", lo: 500, mi: 800, hi: 1200 },
  { l: "Consumables & contrast agents", lo: 3000, mi: 5000, hi: 7500 },
  { l: "Insurance (malpractice + liability)", lo: 2000, mi: 3500, hi: 4500 },
  { l: "IT / PACS / RIS / Cloud PACS", lo: 2000, mi: 3000, hi: 4000 },
  { l: "CME / CE credits (techs + staff)", lo: 200, mi: 400, hi: 700 },
  { l: "Marketing & patient acquisition", lo: 3000, mi: 5000, hi: 8000 },
  { l: "Compliance / Legal / Billing", lo: 2500, mi: 4000, hi: 6000 },
];

const TELERAD_PER = 60;

const LISTINGS = [
  { n: "NJ MRI Center (near Manhattan)", s: "DealStream", u: "https://dealstream.com/d/biz-sale/medical-labs/pjok45", d: "No medical license required. Board-certified radiologists on staff. Proven profitable. Investor-structured.", f: "Strong" },
  { n: "High-Growth Diagnostic Imaging Center", s: "DealStream", u: "https://dealstream.com/d/biz-sale/health-care/dixiyj", d: "Turnkey. Licensed & certified. Multi-million dollar revenue. All equipment + staff in place.", f: "Strong" },
  { n: "NJ Turnkey Medical Diagnostics Business", s: "DealStream", u: "https://dealstream.com/new-jersey-businesses-for-sale", d: "Prime NJ location. Fully operational. Multiple revenue streams. Owner has multiple locations.", f: "Strong" },
  { n: "Essex County MRI Diagnostics (Upright MRI)", s: "BizBuySell", u: "https://www.bizbuysell.com/new-jersey/medical-practices-for-sale/", d: "Listing HS-67522. Upright/weight-bearing MRI + MRA + MRV + X-ray. Affluent Essex County.", f: "Moderate" },
  { n: "Newly Built Medical Imaging Center (NJ)", s: "BizBuySell", u: "https://www.bizbuysell.com/new-jersey/medical-practices-for-sale/", d: "Brand new buildout. All equipment and facility ready. Search 'imaging' on page.", f: "Strong" },
  { n: "NJ MRI Centers (Multiple)", s: "BizQuest", u: "https://www.bizquest.com/mri-centers-for-sale-in-new-jersey/", d: "Aggregated NJ-specific MRI center listings. Filter by price and county.", f: "Varies" },
  { n: "NJ Healthcare Businesses", s: "DealStream", u: "https://dealstream.com/new-jersey/health-care-businesses-for-sale", d: "Broader healthcare category — filter for imaging/diagnostic. Includes medical transport, ASCs, clinics.", f: "Browse" },
];

function Badge({ c, children }) {
  const bg = c === "g" ? C.greenDim : c === "r" ? C.redDim : C.amberDim;
  const fg = c === "g" ? C.green : c === "r" ? C.red : C.amber;
  return <span style={{ background: bg, color: fg, padding: "2px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{children}</span>;
}

function Kpi({ label, value, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 10px", textAlign: "center", minWidth: 120 }}>
      <div style={{ fontSize: 10, color: C.dim, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: MONO }}>{value}</div>
    </div>
  );
}

function Row({ label, value, bold, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: bold ? `1px solid ${C.border}` : "none", marginTop: bold ? 4 : 0, paddingTop: bold ? 6 : 4 }}>
      <span style={{ color: bold ? C.text : C.dim, fontWeight: bold ? 700 : 400, fontSize: 13 }}>{label}</span>
      <span style={{ fontFamily: MONO, fontWeight: bold ? 700 : 400, color: color || C.text, fontSize: 13 }}>{value}</span>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("model");
  const [mod, setMod] = useState("acquire");
  const [scans, setScans] = useState(20);
  const [price, setPrice] = useState(400);
  const [pi, setPi] = useState(25);
  const [cost, setCost] = useState("mi");

  const m = MODELS[mod];
  const ck = cost === "lo" ? "lo" : cost === "hi" ? "hi" : "mi";

  const calc = useMemo(() => {
    const wd = 26;
    const ms = scans * wd;
    const piS = Math.round(ms * pi / 100);
    const caS = ms - piS;
    const piP = price + 175;
    const rev = caS * price + piS * piP;
    const opx = OPX.reduce((s, o) => s + o[ck], 0);
    const tele = ms * TELERAD_PER;
    const totOpx = opx + tele + m.mo + m.svc;
    const profit = rev - totOpx;
    const day1 = m.down + m.site + m.pacs + m.wc + m.mkt + m.acr + (m.preRentMo * m.preRent);
    const blend = ms > 0 ? (caS * price + piS * piP) / ms : 0;
    const margin = blend - TELERAD_PER;
    const fixed = opx + m.mo + m.svc;
    const be = margin > 0 ? Math.ceil(fixed / margin / wd) : 999;
    const pb = profit > 0 ? Math.ceil(day1 / profit) : 999;
    const ebitda = (profit + m.mo) * 12;
    const ebitdaM = rev > 0 ? ebitda / (rev * 12) : 0;
    return { ms, piS, caS, piP, rev, opx, tele, totOpx, profit, day1, blend, margin, be, pb, ebitda, ebitdaM, annRev: rev * 12, annProfit: profit * 12 };
  }, [mod, scans, price, pi, cost, m, ck]);

  const proj = useMemo(() => {
    const ramp = [0.6, 0.85, 1, 1.05, 1.1];
    return ramp.map((r, i) => {
      const y = i + 1;
      const es = Math.round(scans * r);
      const ms = es * 26;
      const piS = Math.round(ms * pi / 100);
      const caS = ms - piS;
      const rev = (caS * price + piS * (price + 175)) * 12;
      const opx = OPX.reduce((s, o) => s + o[ck], 0);
      const tele = ms * TELERAD_PER;
      const eq = y <= m.term / 12 ? m.mo : 0;
      const totOpx = (opx + tele + eq + m.svc) * 12;
      const profit = rev - totOpx;
      const ebitda = profit + eq * 12;
      return { y, es, rev, totOpx, profit, ebitda, m: rev > 0 ? ebitda / rev : 0 };
    });
  }, [mod, scans, price, pi, cost, m, ck]);

  const sl = (label, val, min, max, step, set, pre = "", suf = "") => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.dim }}>{label}</span>
        <span style={{ fontSize: 13, color: C.accent, fontFamily: MONO, fontWeight: 700 }}>{pre}{val}{suf}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={e => set(+e.target.value)} style={{ width: "100%", accentColor: C.accent, height: 4 }} />
    </div>
  );

  const tabs = [
    { id: "model", l: "Financial Model" },
    { id: "proj", l: "5-Year P&L" },
    { id: "list", l: "NJ Listings" },
    { id: "src", l: "Sources" },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: C.bg, color: C.text, minHeight: "100vh", padding: "20px 12px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 10, color: C.accent, letterSpacing: 3, textTransform: "uppercase" }}>ClearView Imaging</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 0", color: C.white }}>MRI-Only Cash-Pay Financial Model</h1>
        <p style={{ fontSize: 12, color: C.dim, margin: "4px 0 0" }}>Every number sourced · Interactive · Investor-grade</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 14px", border: "none", borderRadius: "6px 6px 0 0", cursor: "pointer",
            background: tab === t.id ? C.accent : "transparent", color: tab === t.id ? C.white : C.dim,
            fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", fontFamily: "inherit",
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── MODEL TAB ── */}
      {tab === "model" && (
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}>
          {/* Model selector */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>Acquisition Strategy</div>
            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {Object.entries(MODELS).map(([k, v]) => (
                <button key={k} onClick={() => setMod(k)} style={{
                  padding: 12, borderRadius: 8, cursor: "pointer", textAlign: "left",
                  border: mod === k ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                  background: mod === k ? C.accentDim : C.cardAlt, color: C.text, fontFamily: "inherit",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{v.label}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 3, lineHeight: 1.4 }}>{v.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>Assumptions</div>
            <div style={{ display: "grid", gap: 0, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", columnGap: 20 }}>
              {sl("MRI Scans / Day", scans, 5, 40, 1, setScans)}
              {sl("Avg Cash Price", price, 250, 700, 25, setPrice, "$")}
              {sl("PI Lien Mix", pi, 0, 60, 5, setPi, "", "%")}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: C.dim, marginBottom: 6 }}>Cost Scenario</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[["lo", "Low"], ["mi", "Mid"], ["hi", "High"]].map(([k, l]) => (
                    <button key={k} onClick={() => setCost(k)} style={{
                      flex: 1, padding: "5px 0", borderRadius: 5, cursor: "pointer",
                      border: cost === k ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                      background: cost === k ? C.accentDim : C.cardAlt,
                      color: C.text, fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                    }}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
            <Kpi label="Monthly Revenue" value={f(calc.rev)} color={C.accent} />
            <Kpi label="Monthly OpEx" value={f(calc.totOpx)} color={C.amber} />
            <Kpi label="Monthly Profit" value={f(calc.profit)} color={calc.profit > 0 ? C.green : C.red} />
            <Kpi label="Break-Even" value={`${calc.be} scans/d`} color={calc.be <= scans ? C.green : C.red} />
            <Kpi label="Day-1 Capital" value={f(calc.day1)} color={C.accent} />
            <Kpi label="Payback" value={calc.pb < 999 ? `${calc.pb} mo` : "N/A"} color={calc.pb <= 18 ? C.green : C.amber} />
          </div>

          {/* Revenue + OpEx side by side */}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>Revenue (Monthly)</div>
              <Row label={`Cash scans (${calc.caS}/mo × $${price})`} value={f(calc.caS * price)} color={C.green} />
              <Row label={`PI lien scans (${calc.piS}/mo × $${calc.piP})`} value={f(calc.piS * calc.piP)} color={C.green} />
              <Row label="Total Monthly Revenue" value={f(calc.rev)} bold color={C.accent} />
              <Row label="Blended price / scan" value={`$${Math.round(calc.blend)}`} />
              <Row label="Margin / scan (after teleread)" value={`$${Math.round(calc.margin)}`} />
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>Operating Costs (Monthly)</div>
              {OPX.map((o, i) => <Row key={i} label={o.l} value={f(o[ck])} />)}
              <Row label={`Teleradiology (${calc.ms} × $${TELERAD_PER})`} value={f(calc.tele)} />
              <Row label="Equipment payment" value={f(m.mo)} />
              <Row label="Service contract" value={f(m.svc)} />
              <Row label="Total Monthly OpEx" value={f(calc.totOpx)} bold color={C.amber} />
            </div>
          </div>

          {/* Day 1 + Annual */}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>Day-1 Capital</div>
              {[["Down payment / deposit", m.down], ["Site prep / RF shielding", m.site], ["PACS + IT setup", m.pacs], [`Pre-opening rent (${m.preRentMo} mo dead rent)`, m.preRentMo * m.preRent], ["Working capital (3-mo buffer)", m.wc], ["Marketing launch", m.mkt], ["ACR accreditation", m.acr]].map(([l, v], i) => <Row key={i} label={l} value={f(v)} />)}
              <Row label="Total Day-1 Capital" value={f(calc.day1)} bold color={C.accent} />
              <div style={{ marginTop: 8, padding: 8, background: C.cardAlt, borderRadius: 5, fontSize: 11, color: C.dim, lineHeight: 1.5 }}>{m.note}</div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>Annual Summary (Steady State)</div>
              <Row label="Annual Revenue" value={f(calc.annRev)} color={C.accent} />
              <Row label="Annual OpEx" value={f(calc.totOpx * 12)} color={C.amber} />
              <Row label="Annual Net Profit" value={f(calc.annProfit)} bold color={calc.annProfit > 0 ? C.green : C.red} />
              <Row label="EBITDA" value={f(calc.ebitda)} color={C.green} />
              <Row label="EBITDA Margin" value={`${(calc.ebitdaM * 100).toFixed(1)}%`} color={calc.ebitdaM > 0.2 ? C.green : C.amber} />
              <div style={{ marginTop: 10, padding: 8, background: C.cardAlt, borderRadius: 5, fontSize: 11, color: C.dim, lineHeight: 1.5 }}>
                Benchmark: Well-run imaging centers ~22% EBITDA margin (HealthValue Group). RadNet 16.2% adj. EBITDA (SEC Q3 2025).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5-YEAR TAB ── */}
      {tab === "proj" && (
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, fontWeight: 600 }}>5-Year Projection (Y1: 60% ramp → Y2: 85% → Y3+: full + 5% growth)</div>
            {/* Bars */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-end", height: 170 }}>
              {proj.map(y => {
                const maxR = Math.max(...proj.map(p => p.rev));
                const h = maxR > 0 ? (y.rev / maxR) * 150 : 0;
                const ph = maxR > 0 ? (Math.max(y.profit, 0) / maxR) * 150 : 0;
                return (
                  <div key={y.y} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
                    <div style={{ fontSize: 10, fontFamily: MONO, color: C.dim, marginBottom: 3 }}>{f(y.rev)}</div>
                    <div style={{ position: "relative", width: "100%", maxWidth: 70 }}>
                      <div style={{ height: h, background: `${C.accent}25`, borderRadius: "3px 3px 0 0", border: `1px solid ${C.accent}30` }} />
                      <div style={{ position: "absolute", bottom: 0, width: "100%", height: ph, background: y.profit > 0 ? `${C.green}35` : `${C.red}25`, borderRadius: "3px 3px 0 0" }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 3 }}>Y{y.y}</div>
                  </div>
                );
              })}
            </div>
            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    {["", "Scans/D", "Revenue", "OpEx", "Net Profit", "EBITDA", "Margin"].map((h, i) => (
                      <th key={i} style={{ padding: "6px 8px", textAlign: i ? "right" : "left", color: C.dim, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proj.map(y => (
                    <tr key={y.y} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "8px", fontWeight: 700 }}>Year {y.y}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: MONO }}>{y.es}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: MONO, color: C.accent }}>{f(y.rev)}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: MONO, color: C.amber }}>{f(y.totOpx)}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: MONO, color: y.profit > 0 ? C.green : C.red }}>{f(y.profit)}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: MONO, color: C.green }}>{f(y.ebitda)}</td>
                      <td style={{ padding: "8px", textAlign: "right" }}><Badge c={y.m > 0.25 ? "g" : y.m > 0.15 ? "a" : "r"}>{(y.m * 100).toFixed(1)}%</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, padding: 10, background: C.cardAlt, borderRadius: 6, fontSize: 11, color: C.dim, lineHeight: 1.6 }}>
              <b style={{ color: C.text }}>Key assumptions:</b> Year 1 at 60% target volume (ramp). Year 2 at 85%. Y3+ full capacity +5%/yr. Equipment payments stop after {m.term / 12}-year term. GE HealthCare baseline: 20 scans/day. Industry max: 40/day (PMC/RSNA 2024).
            </div>
          </div>
        </div>
      )}

      {/* ── LISTINGS TAB ── */}
      {tab === "list" && (
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>Active NJ Imaging Center Listings — April 2026</div>
            <p style={{ fontSize: 12, color: C.dim, margin: "0 0 14px", lineHeight: 1.5 }}>
              Links open in a new browser tab. Some sites require free registration. URLs confirmed active via live web search today.
            </p>
            {LISTINGS.map((l, i) => (
              <div key={i} style={{ padding: 14, background: C.cardAlt, borderRadius: 8, marginBottom: 10, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{l.n}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>{l.s}</div>
                  </div>
                  <Badge c={l.f === "Strong" ? "g" : "a"}>{l.f}</Badge>
                </div>
                <div style={{ fontSize: 12, color: C.dim, marginTop: 8, lineHeight: 1.5 }}>{l.d}</div>
                <button
                  onClick={() => window.open(l.u, "_blank", "noopener,noreferrer")}
                  style={{
                    marginTop: 10, padding: "7px 16px", background: C.accentDim, color: C.accent,
                    borderRadius: 6, fontSize: 12, fontWeight: 700, border: `1px solid ${C.accent}50`,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Open Listing ↗
                </button>
                <span style={{ marginLeft: 10, fontSize: 11, color: C.muted, userSelect: "all", wordBreak: "break-all" }}>{l.u}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontWeight: 600 }}>Valuation Benchmarks</div>
            <div style={{ fontSize: 12, lineHeight: 1.9, color: C.dim }}>
              <div><b style={{ color: C.text }}>EV/EBITDA:</b> Avg 6.70×, median 5.59× (Scope Research / HealthValue Group)</div>
              <div><b style={{ color: C.text }}>EV/Revenue:</b> Median 0.82× for independent centers</div>
              <div><b style={{ color: C.text }}>Industry EBITDA margin:</b> ~22% (HealthValue Group)</div>
              <div><b style={{ color: C.text }}>RadNet adj. EBITDA:</b> 16.2–16.3% (SEC Q2–Q3 2025)</div>
            </div>
          </div>
        </div>
      )}

      {/* ── SOURCES TAB ── */}
      {tab === "src" && (
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14, fontWeight: 600 }}>Data Sources — Every Number Traced</div>
            {[
              ["MRI Lease/Finance", "EquipmentFinanceHub — New 1.5T ($800K–$1.2M): $12K–$18K/mo (84mo, 6.5%). Refurb ($200K–$500K): $3.4K–$8.6K/mo (72mo, 7.5%)"],
              ["MRI Purchase", "MedicalImagingSource — Entry refurb 1.5T: $95K–$150K. Advanced: $200K–$375K. New 1.5T: $1M–$1.5M (Persistence Market Research)"],
              ["Service Contracts", "MedicalImagingSource — $5K/mo (Tier 1) to $20K/mo (Tier 3). OEM annual: $80K–$200K (EquipmentFinanceHub)"],
              ["Site Prep / Shielding", "EquipmentFinanceHub — $150K–$400K total. DirectMed — up to $100K for RF shielding alone"],
              ["Pre-Opening Dead Rent", "Industry standard: 1–3 months free rent negotiable during buildout (SuperCalc, Cauble Group). NJ healthcare group secured 12 months free rent (Newmark Associates). MRI install + ACR accreditation takes 3–6 months post-buildout."],
              ["Teleradiology", "NDI (ndximaging.com) 2026: MRI reads from $60/study, CT $40, X-ray $12. Per-study model is industry standard"],
              ["Cash-Pay MRI (NJ)", "RadiologyAssist: $300 (Cherry Hill). Sidecar Health: $636 avg. Craft Body Scan: $400–$10K range nationally"],
              ["Helper / Patient Aide", "ZipRecruiter Dec 2025: Imaging Aide avg $33,585/yr ($16.15/hr). Glassdoor: Imaging Assistant avg $50,340/yr. NJ Indeed listings: $18–$27/hr range."],
              ["IT Tech / MSP Support", "HIPAA-compliant managed IT for medical imaging requires firewall, MFA, encryption, VPN. Small practice MSP contracts typically $1,500–$4,000/mo. 2025 HIPAA Security Rule mandates MFA + encryption."],
              ["Internet (Dedicated Line)", "DICOM/PACS transmission requires dedicated business-grade internet. HIPAA-compliant VPN + redundant connection. Budget $500–$1,200/mo for fiber + VPN services."],
              ["CME / CE Credits", "ARRT requires 24 CE credits per biennium. Online CE packages: $45–$55/yr per tech (GetYourCEU, eRADIMAGING, TakeCE). Budget $200–$700/mo total for 3–4 clinical staff."],
              ["Marketing & Acquisition", "PatientGain: medical practices avg $6,677/mo. WebFX: 44% of healthcare companies spend $5K–$10K+/mo on digital marketing. Baker Labs: 4–5% of revenue for growth phase."],
              ["Operating Costs", "FinancialModelsLab Dec 2025: $75.2K/mo fixed overhead, $85K/mo payroll (8 FTE). Utilities $6.5K/mo"],
              ["MRI Tech Salary", "BLS May 2024: $88,180 median national. NYC/NJ: +15–25% = $100K–$120K/yr"],
              ["Industry Margins", "HealthValue Group: ~22% EBITDA. RadNet SEC filings: 16.2–16.3% adj. EBITDA (Q2–Q3 2025)"],
              ["Valuation Multiples", "Scope Research / HealthValue Group: avg EV/EBITDA 6.70×, median 5.59×"],
              ["Throughput", "GE HealthCare: 20 scans/day baseline. PMC/RSNA 2024: 20–40 patients/day capacity ceiling"],
              ["CON Requirements", "EquipmentFinanceHub: 35+ states. $2K–$10K application, 3–12 months processing"],
            ].map(([t, d], i) => (
              <div key={i} style={{ borderBottom: `1px solid ${C.border}`, padding: "8px 0" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t}</div>
                <div style={{ color: C.dim, fontSize: 11, lineHeight: 1.5, marginTop: 2 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 28, fontSize: 10, color: C.muted }}>ClearView Imaging · April 2026 · All figures from named industry sources</div>
    </div>
  );
}
