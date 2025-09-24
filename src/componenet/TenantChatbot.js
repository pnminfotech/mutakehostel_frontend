import React, { useMemo, useRef, useState, useEffect } from "react";
import { FaRobot, FaPaperPlane, FaTimes, FaChevronUp, FaChevronDown, FaUser } from "react-icons/fa";
import Fuse from "fuse.js";
import rawIntents from "../componenet/json/chatbotIntents.json"; // can contain .patterns OR .examples

// ---------- Utilities ----------
const toNum = (v) => {
  if (v === null || v === undefined) return 0;
  const n = Number(String(v).replace(/[,₹\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const prettyCurrency = (n) => `₹${(toNum(n) || 0).toLocaleString("en-IN")}`;

function defaultExpectFromTenant(tenant, roomsData) {
  const keys = ["baseRent","rent","rentAmount","expectedRent","defaultRent","monthlyRent","price","bedPrice"];
  for (const k of keys) { const v = toNum(tenant?.[k]); if (v) return v; }
  if (roomsData && tenant?.roomNo && tenant?.bedNo) {
    const room = roomsData.find((r) => String(r.roomNo) === String(tenant.roomNo));
    const bed  = room?.beds?.find((b) => String(b.bedNo) === String(tenant.bedNo));
    return toNum(bed?.price) || toNum(bed?.baseRent) || toNum(bed?.monthlyRent) || 0;
  }
  return 0;
}

function calculateDueThisYear(rents = [], joiningDateStr) {
  if (!joiningDateStr) return 0;
  const now = new Date();
  const y = now.getFullYear();
  const startOfYear = new Date(y, 0, 1);
  const join = new Date(joiningDateStr);
  const rentStart = new Date(join.getFullYear(), join.getMonth() + 1, 1);
  const start = rentStart > startOfYear ? rentStart : startOfYear;

  const paid = new Set((rents||[])
    .filter(r => r?.date && toNum(r.rentAmount)>0)
    .map(r => { const d=new Date(r.date); return `${d.getMonth()}-${d.getFullYear()}`; }));

  const lastPaid=(rents||[]).filter(r=>r?.date&&toNum(r.rentAmount)>0)
    .sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  const rentAmount = lastPaid ? toNum(lastPaid.rentAmount) : 0;

  let dueCount = 0; const cur = new Date(start);
  while (cur <= now && cur.getFullYear() === y) {
    const key = `${cur.getMonth()}-${cur.getFullYear()}`;
    if (!paid.has(key)) dueCount++;
    cur.setMonth(cur.getMonth()+1);
  }
  return rentAmount * dueCount;
}

function pendingMonthsFrom(joiningDateStr, rents=[]) {
  if (!joiningDateStr) return [];
  const now = new Date(); const y = now.getFullYear();
  const join = new Date(joiningDateStr);
  const start = new Date(join.getFullYear(), join.getMonth()+1, 1);
  const paid = new Set((rents||[])
    .filter(r => r?.date && toNum(r.rentAmount)>0)
    .map(r => { const d=new Date(r.date); return `${d.getMonth()}-${d.getFullYear()}`; }));
  const out=[]; const cur = new Date(start);
  while (cur <= now) {
    const key = `${cur.getMonth()}-${cur.getFullYear()}`;
    if (cur.getFullYear()===y && !paid.has(key)) {
      out.push(cur.toLocaleString("default",{month:"long",year:"numeric"}));
    }
    cur.setMonth(cur.getMonth()+1);
  }
  return out;
}
function isPaidForMonth(rents = [], monthIdx, year) {
  return (rents||[]).some(r => {
    if (!r?.date || toNum(r.rentAmount) <= 0) return false;
    const d = new Date(r.date);
    return d.getMonth() === monthIdx && d.getFullYear() === year;
  });
}
const isLeft = (tenant, leaveDates) => {
  const iso = leaveDates?.[tenant._id];
  return iso && new Date(iso) < new Date();
};

const norm = (s) => (s||"").toLowerCase().trim();
const unique = (arr) => Array.from(new Set(arr));

// ---------- Language strings ----------
function STR(lang) {
  if (lang === "mr") {
    return {
      greeting: "मराठी निवडलं. भाडे, देय, रिकामे बेड, डिपॉझिट, फोन वगैरे विचारा. ‘help’ टाईप करा.",
      placeholder: "भाडे, देय, रिकामे बेड… (help टाईप करा)",
      didntGet: "समजले नाही. ‘help’ टाईप करा किंवा वेगळे शब्द वापरा.",
      whichMonth: "कोणता महिना?",
      who: "कोण?",
      whichRoom: "कोणता रूम? उदा.: “room 101 मधे रिकामे beds”.",
      noActiveTenant: (n) => `“${n}” नावाचा सक्रिय रहिवासी सापडला नाही.`,
      roomNotFound: (r) => `रूम ${r} सापडला नाही.`,
      rentStatusTitle: (t) => `${t} चा रेंट स्टेटस`,
      labelRoomBed: (r,b) => `रूम ${r} • बेड ${b}`,
      expectedMonthly: (amt) => `— अपेक्षित मासिक: ${amt}`,
      thisYearDue: (amt, mcount) => `— या वर्षीचे देय: ${amt} (${mcount} महिने)`,
      pendingMonths: "— पेंडिंग महिने:",
      noPendingMonths: "— पेंडिंग महिने नाहीत ✅",
      vacantTitle: (room) => `रूम ${room} मधले रिकामे बेड:`,
      vacantLine: (b, cat, price) => `• बेड ${b}${cat?` (${cat})`:""}${price?` • ${price}`:""}`,
      noVacant: (room) => `रूम ${room} मध्ये कोणताही बेड रिकामा नाही.`,
      leftLastMonthNone: "गेल्या महिन्यात कोणी गेले नाही.",
      leftLastMonthTitle: "गेल्या महिन्यात गेलेले रहिवासी:",
      leftLastMonthLine: (n,r,b,date) => `• ${n} (रूम ${r} • बेड ${b}) — ${date}`,
      whoHasPendingTitle: (y) => `${y} साठी पेंडिंग असलेले रहिवासी:`,
      whoHasPendingLine: (n,amt,r,b) => `• ${n} — ${amt} (रूम ${r} • बेड ${b})`,
      totalDue: (amt) => `— एकूण देय: ${amt}`,
      count: (n) => `• संख्या: ${n}`,
      dueForYearLine: (n,amt,y) => `${n} चे या वर्षीचे देय: ${amt}`,
      phoneLine: (n, p) => `${n} चा फोन: ${p || "—"}`,
      depositLine: (n, amt) => `${n} ने ${amt} डिपॉझिट दिले आहे.`,
      pendingForMonthTitle: (mh) => `${mh} साठी पेंडिंग:`,
      pendingNone: "काहीही नाही ✅",
      paidForMonth: (n, mh) => `${n} ने ${mh} चे पैसे भरले आहेत.`,
      pendingForTenantMonth: (n, amt, mh) => `${n} चे ${mh} साठी ${amt} पेंडिंग आहे.`,
      helpTitle: "उदाहरणे:",
      helpBullets: [
        "Priya चा rent status",
        "Akash चे किती due आहे",
        "Rohan चे pending months",
        "room 101 मधे रिकामे beds",
        "कोणाचे rent pending आहे",
        "Nikhil चे deposit किती",
        "Pooja चा phone",
        "गेल्या महिन्यात कोण गेले",
        "या महिन्याचे सर्व pending",
        "March महिन्याचे सर्व pending",
        "Priya चे या महिन्याचे pending"
      ],
      sug: {
        pendingAllThis: "या महिन्याचे सर्व pending",
        pendingAllLast: "गेल्या महिन्याचे सर्व pending",
        pendingAllNext: "पुढच्या महिन्याचे सर्व pending",
        pendingAllFor: (m) => `${m} महिन्याचे सर्व pending`,
        pendingNameThis: (n) => `${n} चे या महिन्याचे pending`,
        pendingNameFor: (n,m) => `${n} चे ${m} महिन्याचे pending`,
      }
    };
  }
  if (lang === "hi") {
    return {
      greeting: "हिन्दी चुना गया है। किराया, बकाया, खाली बेड, डिपॉज़िट, फ़ोन आदि पूछें। ‘help’ टाइप करें.",
      placeholder: "किराया, बकाया, खाली बेड… (help टाइप करें)",
      didntGet: "समझ नहीं आया। ‘help’ टाइप करें या अलग तरह से पूछें.",
      whichMonth: "कौन-सा महीना?",
      who: "कौन?",
      whichRoom: "कौन-सा रूम? जैसे: “room 101 में खाली beds”.",
      noActiveTenant: (n) => `“${n}” नाम का सक्रिय किरायेदार नहीं मिला.`,
      roomNotFound: (r) => `रूम ${r} नहीं मिला.`,
      rentStatusTitle: (t) => `${t} का रेंट स्टेटस`,
      labelRoomBed: (r,b) => `रूम ${r} • बेड ${b}`,
      expectedMonthly: (amt) => `— अपेक्षित मासिक: ${amt}`,
      thisYearDue: (amt, mcount) => `— इस वर्ष का बकाया: ${amt} (${mcount} महीने)`,
      pendingMonths: "— पेंडिंग महीने:",
      noPendingMonths: "— कोई पेंडिंग महीना नहीं ✅",
      vacantTitle: (room) => `रूम ${room} में खाली बेड:`,
      vacantLine: (b, cat, price) => `• बेड ${b}${cat?` (${cat})`:""}${price?` • ${price}`:""}`,
      noVacant: (room) => `रूम ${room} में कोई बेड खाली नहीं है.`,
      leftLastMonthNone: "पिछले महीने कोई नहीं गया.",
      leftLastMonthTitle: "पिछले महीने गए किरायेदार:",
      leftLastMonthLine: (n,r,b,date) => `• ${n} (रूम ${r} • बेड ${b}) — ${date}`,
      whoHasPendingTitle: (y) => `${y} के पेंडिंग किराए:`,
      whoHasPendingLine: (n,amt,r,b) => `• ${n} — ${amt} (रूम ${r} • बेड ${b})`,
      totalDue: (amt) => `— कुल बकाया: ${amt}`,
      count: (n) => `• संख्या: ${n}`,
      dueForYearLine: (n,amt,y) => `${n} का ${y} के लिए बकाया: ${amt}`,
      phoneLine: (n, p) => `${n} का फ़ोन: ${p || "—"}`,
      depositLine: (n, amt) => `${n} ने ${amt} डिपॉज़िट दिया है.`,
      pendingForMonthTitle: (mh) => `${mh} के पेंडिंग:`,
      pendingNone: "कुछ नहीं ✅",
      paidForMonth: (n, mh) => `${n} ने ${mh} का भुगतान कर दिया है.`,
      pendingForTenantMonth: (n, amt, mh) => `${n} का ${mh} के लिए ${amt} पेंडिंग है.`,
      helpTitle: "उदाहरण:",
      helpBullets: [
        "Priya का rent status",
        "Akash का कितना due है",
        "Rohan के pending months",
        "room 101 में खाली beds",
        "किसका rent pending है",
        "Nikhil का deposit कितना",
        "Pooja का phone",
        "पिछले महीने कौन गया",
        "इस महीने के सभी pending",
        "March के सभी pending",
        "Priya का इस महीने का pending"
      ],
      sug: {
        pendingAllThis: "इस महीने के सभी pending",
        pendingAllLast: "पिछले महीने के सभी pending",
        pendingAllNext: "अगले महीने के सभी pending",
        pendingAllFor: (m) => `${m} के सभी pending`,
        pendingNameThis: (n) => `${n} का इस महीने का pending`,
        pendingNameFor: (n,m) => `${n} का ${m} का pending`,
      }
    };
  }
  return {
    greeting: "Hi! Ask me about rent, dues, vacancies, deposits, phones, etc. Type ‘help’ for examples.",
    placeholder: "Ask about rent, dues, vacancy… (try ‘help’)",
    didntGet: "I didn't get that. Type ‘help’ or try another phrasing.",
    whichMonth: "Which month?",
    who: "Who?",
    whichRoom: "Which room? Try: “vacant beds in room 101”.",
    noActiveTenant: (n) => `I couldn't find an active tenant named “${n}”.`,
    roomNotFound: (r) => `Room ${r} not found.`,
    rentStatusTitle: (t) => `Rent status for ${t}`,
    labelRoomBed: (r,b) => `Room ${r} • Bed ${b}`,
    expectedMonthly: (amt) => `— Expected monthly: ${amt}`,
    thisYearDue: (amt, mcount) => `— This year due: ${amt} (${mcount} months)`,
    pendingMonths: "— Pending months:",
    noPendingMonths: "— No pending months ✅",
    vacantTitle: (room) => `Vacant beds in room ${room}:`,
    vacantLine: (b, cat, price) => `• Bed ${b}${cat?` (${cat})`:""}${price?` • ${price}`:""}`,
    noVacant: (room) => `No vacant beds in room ${room}.`,
    leftLastMonthNone: "No one left last month.",
    leftLastMonthTitle: "Tenants who left last month:",
    leftLastMonthLine: (n,r,b,date) => `• ${n} (Room ${r} • Bed ${b}) on ${date}`,
    whoHasPendingTitle: (y) => `Tenants with pending rents (${y}):`,
    whoHasPendingLine: (n,amt,r,b) => `• ${n} — ${amt} (Room ${r} • Bed ${b})`,
    totalDue: (amt) => `— Total due: ${amt}`,
    count: (n) => `• Count: ${n}`,
    dueForYearLine: (n,amt,y) => `${n} has ${amt} due for ${y}.`,
    phoneLine: (n, p) => `${n}'s phone: ${p || "—"}`,
    depositLine: (n, amt) => `${n} deposited ${amt}.`,
    pendingForMonthTitle: (mh) => `Pending for ${mh}:`,
    pendingNone: "None ✅",
    paidForMonth: (n, mh) => `${n} has paid for ${mh}.`,
    pendingForTenantMonth: (n, amt, mh) => `${n} is pending ${amt} for ${mh}.`,
    helpTitle: "Examples:",
    helpBullets: [
      "rent status of Priya",
      "how much due for Akash",
      "pending months for Rohan",
      "vacant beds in room 101",
      "who has pending",
      "deposit of Nikhil",
      "phone of Pooja",
      "who left last month",
      "all pending this month",
      "all pending for March",
      "Priya pending this month"
    ],
    sug: {
      pendingAllThis: "all pending this month",
      pendingAllLast: "all pending last month",
      pendingAllNext: "all pending next month",
      pendingAllFor: (m) => `all pending for ${m}`,
      pendingNameThis: (n) => `${n} pending this month`,
      pendingNameFor: (n,m) => `${n} pending for ${m}`,
    }
  };
}

// ---------- Language-aware normalizer ----------
function normalizeByLanguage(q, lang) {
  let s = q.toLowerCase().trim();
  const repl = (re, to) => { s = s.replace(re, to); };
  repl(/\bstetus\b/g, "status"); repl(/\bstatuz\b/g, "status");

  if (lang === "mr" || lang === "hi") {
    repl(/\b(rikame|khali|khaali|khalli|free|mukt)\b/g, "vacant");
    repl(/\b(bha?de|bhade|kiraya|rentu?)\b/g, "rent");
    repl(/\b(deposit|deposite|diposit|jamma|jama|jamaa)\b/g, "deposit");
    repl(/\b(baki|baaki|due|udhaar|udh?aari|bacha|bache|pending)\b/g, "pending");
    repl(/\b(mahina|mahine|mahiny)\b/g, "month");
    repl(/\b(phone|mobile|contact|call)\b/g, "phone");
    repl(/\b(rum|roomm|room)\b/g, "room");
    repl(/\b(bed|bedd|bistara)\b/g, "bed");
    repl(/\b(kaun|kon|kis|kise|kisko|kun)\b/g, "who");
    repl(/\b(dikha|dikhao|show|batao|bata|sang|sanga)\b/g, "show");
    repl(/\b(ka|ke|ki)\b/g, "of");
    repl(/\b(is|ye|yah|ya|ha)\s+month\b/g, "this month");
    repl(/\b(pichle|pichhla|gela|gellya|last)\s+month\b/g, "last month");
    repl(/\b(agle|next|pudhil|pudhcha|pudhlya)\s+month\b/g, "next month");
  }
  if (lang === "mr") {
    repl(/रिकाम[ेे]/g, "vacant");
    repl(/भाड[ेे]/g, "rent");
    repl(/डिपॉझिट|डिपॉजिट|ठेव|डीपॉजिट/g, "deposit");
    repl(/बाकी|थकबाकी|उधारी|पेन्डिंग|पेंडिंग/g, "pending");
    repl(/फोन|मोबाइल/g, "phone");
    repl(/खोल[ी्या]|रूम/g, "room");
    repl(/या\s+महिन्याच[ेा]|या\s+महिन्यात[ील]?/g, "this month");
    repl(/गेल्या\s+महिन्यात/g, "last month");
    repl(/पुढच्या\s+महिन्यात|पुढील\s+महिन्यात/g, "next month");
    repl(/कोण\s+गेले|कोण\s+गेला|कोणी\s+गेल[ेा]?/g, "who left");
  }
  if (lang === "hi") {
    repl(/किराय[ाे]/g, "rent");
    repl(/डिपॉज़िट|डिपॉजिट/g, "deposit");
    repl(/बकाया|बाक[िी]|उधार|पेंडिंग/g, "pending");
    repl(/फ़ोन|फोन|मोबाइल/g, "phone");
    repl(/कमरा|रूम/g, "room");
    repl(/इस\s+महीने/g, "this month");
    repl(/पिछले\s+महीने/g, "last month");
    repl(/अगले\s+महीने/g, "next month");
    repl(/कौन\s+गया/g, "who left");
  }
  return s;
}

// ---------- Month helpers ----------
const MONTHS = [
  ["january","jan"],["february","feb"],["march","mar","मार्च"],
  ["april","apr","एप्रिल"],["may","mai","मे"],["june","jun","जून"],
  ["july","jul","जुलै"],["august","aug","ऑगस्ट","अगस्त"],
  ["september","sep","sept","सितंबर","सप्टेंबर"],
  ["october","oct","अक्टूबर","ऑक्टोबर"],
  ["november","nov","नवंबर","नोव्हेंबर"],
  ["december","dec","दिसंबर","डिसेंबर"]
];
function monthName(mIdx, lang="en") {
  const d = new Date(new Date().getFullYear(), mIdx, 1);
  const locale = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";
  return d.toLocaleString(locale, { month: "long" });
}
function humanMonth(m, y, lang="en") {
  const locale = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";
  return new Date(y, m, 1).toLocaleString(locale,{month:"long",year:"numeric"});
}
function matchMonthToken(q) {
  for (let i=0;i<MONTHS.length;i++){
    for (const token of MONTHS[i]){
      const re = new RegExp(`\\b${token}\\b`, "i");
      if (re.test(q)) return i;
    }
  }
  return null;
}
function parseTargetMonth(q) {
  const now = new Date();
  const lc = q.toLowerCase();
  if (/\bthis month\b/.test(lc)) return { month: now.getMonth(), year: now.getFullYear(), label: "this month" };
  if (/\blast month\b/.test(lc)) {
    const d = new Date(now.getFullYear(), now.getMonth()-1, 1);
    return { month: d.getMonth(), year: d.getFullYear(), label: "last month" };
  }
  if (/\bnext month\b/.test(lc)) {
    const d = new Date(now.getFullYear(), now.getMonth()+1, 1);
    return { month: d.getMonth(), year: d.getFullYear(), label: "next month" };
  }
  const mIdx = matchMonthToken(lc);
  if (mIdx !== null) return { month: mIdx, year: now.getFullYear(), label: MONTHS[mIdx][0] };
  return null;
}

// ---------- Dictionaries from live data ----------
function buildEntities(formData, roomsData) {
  const names = unique(formData.map(t => (t.name || "").trim()).filter(Boolean)).sort((a,b)=>a.localeCompare(b));
  const rooms = unique((roomsData||[]).map(r => String(r.roomNo)));
  return { names, rooms };
}

// Fuzzy name finder (active only)
function findTenantByName(formData, leaveDates, name) {
  const active = formData.filter(t => !isLeft(t, leaveDates));
  const q = norm(name);
  let t = active.find(x => norm(x.name) === q) || active.find(x => norm(x.name).includes(q));
  if (t) return t;
  const fuse = new Fuse(active, { keys: ["name"], includeScore: true, threshold: 0.4, minMatchCharLength: 2 });
  const hit = fuse.search(name)[0];
  return hit?.item || null;
}

// ---------- Pattern registry ----------
function expandPatterns(intentsJson, entities) {
  const rows = [];
  (Array.isArray(intentsJson) ? intentsJson : []).forEach(entry => {
    const pats = entry.patterns || entry.examples || [];
    pats.forEach(p => {
      rows.push({ intent: entry.intent, text: p, placeholders: true });
      if (p.includes("{name}")) {
        entities.names.slice(0, 300).forEach(nm => {
          rows.push({ intent: entry.intent, text: p.replace("{name}", nm), placeholders: false });
        });
      }
      if (p.includes("{room}")) {
        entities.rooms.forEach(rm => rows.push({ intent: entry.intent, text: p.replace("{room}", rm), placeholders: false }));
      }
    });
  });

  // Built-in patterns for month queries
  rows.push(
    { intent: "pending_this_month_all", text: "all pending this month", placeholders: false },
    { intent: "pending_specific_month_all", text: "all pending for {month}", placeholders: true },
    { intent: "pending_this_month_name", text: "pending this month for {name}", placeholders: true },
    { intent: "pending_specific_month_name", text: "pending for {name} in {month}", placeholders: true }
  );

  // NEW: update rent patterns
  rows.push(
    { intent: "open_update_rent", text: "update rent for {name} for {month}", placeholders: true },
    { intent: "open_update_rent", text: "update rent for {name} in {month}", placeholders: true },
    { intent: "open_update_rent", text: "update rent {name} {month}", placeholders: true }
  );

  return rows;
}

function extractEntities(q, entities, currentTenantName) {
  const room = (q.match(/room\s+(\w+)/i)?.[1]) || entities.rooms.find(r => q.includes(String(r))) || null;
  const lower = q.toLowerCase();
  let name = null, bestLen = 0;
  for (const n of entities.names) {
    const ln = n.toLowerCase();
    if (lower.includes(ln) && ln.length > bestLen) { name = n; bestLen = ln.length; }
  }
  if (!name && currentTenantName) name = currentTenantName;
  return { name, room };
}

// ---------- Intent handlers ----------
function handleIntent({ intent, q, formData, roomsData, leaveDates, helpers, entities, lang, currentTenantName }) {
  const S = STR(lang);

  const H = {
    // NEW: return a link payload for opening the Edit modal in parent
    open_update_rent: () => {
      const { name } = extractEntities(q, entities, currentTenantName);
      if (!name) return STR(lang).who;

      const tm = parseTargetMonth(q);
      if (!tm) return STR(lang).whichMonth;

      const t = findTenantByName(formData, leaveDates, name);
      if (!t) return STR(lang).noActiveTenant(name);

      const label = `Update ${t.name}'s rent for ${humanMonth(tm.month, tm.year, lang)}`;
      return {
        kind: "open-edit-link",
        tenantId: t._id,
        month: tm.month,
        year: tm.year,
        label,
      };
    },

    rent_status: () => {
      const { name } = extractEntities(q, entities, currentTenantName);
      if (!name) return lang === "mr"
        ? "कोणाचा स्टेटस? उदा.: “Priya चा rent status”."
        : lang === "hi"
          ? "किसका स्टेटस? जैसे: “Priya का rent status”."
          : "Whose rent status? Try: “rent status of Priya”.";
      const t = findTenantByName(formData, leaveDates, name);
      if (!t) return S.noActiveTenant(name);
      const expect = (helpers?.expectFromTenant || defaultExpectFromTenant)(t, roomsData);
      const due = (helpers?.calculateDue || calculateDueThisYear)(t.rents, t.joiningDate);
      const months = pendingMonthsFrom(t.joiningDate, t.rents);

      return [
        `${S.rentStatusTitle(t.name)} (${S.labelRoomBed(t.roomNo, t.bedNo)})`,
        S.expectedMonthly(prettyCurrency(expect)),
        S.thisYearDue(prettyCurrency(due), months.length),
        months.length ? `${S.pendingMonths}\n${months.map(m=>`• ${m}`).join("\n")}` : S.noPendingMonths,
      ].join("\n");
    },

    due_amount: () => {
      const { name } = extractEntities(q, entities, currentTenantName);
      if (!name) return lang === "mr"
        ? "कोणाचे बकाया? उदा.: “Akash चे किती due आहे”."
        : lang === "hi"
          ? "किसका बकाया? जैसे: “Akash का कितना due है”."
          : "Whose due? e.g., “how much due for Akash”.";
      const t = findTenantByName(formData, leaveDates, name);
      if (!t) return S.noActiveTenant(name);
      const due = calculateDueThisYear(t.rents, t.joiningDate);
      return S.dueForYearLine(t.name, prettyCurrency(due), new Date().getFullYear());
    },

    pending_months: () => {
      const { name } = extractEntities(q, entities, currentTenantName);
      if (!name) return lang === "mr"
        ? "कोणाचे pending months? उदा.: “Rohan चे pending months”."
        : lang === "hi"
          ? "किसके pending months? जैसे: “Rohan के pending months”."
          : "Whose pending months? e.g., “pending months for Rohan”.";
      const t = findTenantByName(formData, leaveDates, name);
      if (!t) return S.noActiveTenant(name);
      const months = pendingMonthsFrom(t.joiningDate, t.rents);
      return months.length ? `${t.name} — ${S.pendingMonths}\n${months.map(m=>`• ${m}`).join("\n")}` : S.noPendingMonths;
    },

    vacant_beds_in_room: () => {
      const { room } = extractEntities(q, entities, currentTenantName);
      if (!room) return S.whichRoom;
      const active = new Set(formData.filter(t => !isLeft(t, leaveDates)).map(t => `${t.roomNo}-${t.bedNo}`));
      const roomObj = roomsData.find(r => String(r.roomNo) === String(room));
      if (!roomObj) return S.roomNotFound(room);
      const vacant = (roomObj.beds||[]).filter(b => !active.has(`${room}-${b.bedNo}`));
      if (!vacant.length) return S.noVacant(room);
      return `${S.vacantTitle(room)}\n${vacant.map(b => S.vacantLine(b.bedNo, b.category, b.price?prettyCurrency(b.price):"")).join("\n")}`;
    },

    who_has_pending: () => {
      const y = new Date().getFullYear();
      const pending = formData
        .filter(t => !isLeft(t, leaveDates))
        .map(t => ({ t, due: calculateDueThisYear(t.rents, t.joiningDate) }))
        .filter(x => x.due > 0)
        .sort((a,b)=>b.due-a.due)
        .slice(0,100);
      if (!pending.length) return `${S.whoHasPendingTitle(y)}\n${S.pendingNone}`;
      const total = pending.reduce((s,x)=>s+toNum(x.due),0);
      const lines = pending.map(({t,due}) => S.whoHasPendingLine(t.name, prettyCurrency(due), t.roomNo, t.bedNo)).join("\n");
      return `${S.whoHasPendingTitle(y)}\n${lines}\n${S.totalDue(prettyCurrency(total))}`;
    },

    phone_of: () => {
      const { name } = extractEntities(q, entities, currentTenantName);
      if (!name) return lang === "mr" ? "कोणाचा फोन? उदा.: “Pooja चा phone”." :
                         lang === "hi" ? "किसका फ़ोन? जैसे: “Pooja का phone”." :
                         "Whose phone? e.g., “phone of Pooja”.";
      const t = findTenantByName(formData, leaveDates, name);
      if (!t) return S.noActiveTenant(name);
      return S.phoneLine(t.name, t.phoneNo);
    },

    deposit_of: () => {
      const { name } = extractEntities(q, entities, currentTenantName);
      if (!name) return lang === "mr" ? "कोणाचा डिपॉझिट? उदा.: “Nikhil चे deposit”." :
                         lang === "hi" ? "किसका डिपॉज़िट? जैसे: “Nikhil का deposit”." :
                         "Whose deposit? e.g., “deposit of Nikhil”.";
      const t = findTenantByName(formData, leaveDates, name);
      if (!t) return S.noActiveTenant(name);
      return S.depositLine(t.name, prettyCurrency(t.depositAmount));
    },

    left_last_month: () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth()-1, 1);
      const out = (formData||[]).filter(t => {
        if (!t.leaveDate) return false;
        const d = new Date(t.leaveDate);
        return d.getFullYear()===lastMonth.getFullYear() && d.getMonth()===lastMonth.getMonth();
      });
      if (!out.length) return S.leftLastMonthNone;
      const title = S.leftLastMonthTitle;
      const lines = out.map(t => S.leftLastMonthLine(t.name, t.roomNo, t.bedNo, new Date(t.leaveDate).toLocaleDateString())).join("\n");
      return `${title}\n${lines}`;
    },

    // Month-aware
    pending_this_month_all: () => {
      const tm = parseTargetMonth(q) || parseTargetMonth("this month");
      return listAllPendingForMonth(formData, roomsData, leaveDates, tm.month, tm.year, lang);
    },
    pending_specific_month_all: () => {
      const tm = parseTargetMonth(q);
      if (!tm) return STR(lang).whichMonth;
      return listAllPendingForMonth(formData, roomsData, leaveDates, tm.month, tm.year, lang);
    },
    pending_this_month_name: () => {
      const { name } = extractEntities(q, entities, currentTenantName);
      const tm = parseTargetMonth("this month");
      return oneTenantPendingForMonth(name, formData, roomsData, leaveDates, tm.month, tm.year, lang);
    },
    pending_specific_month_name: () => {
      const { name } = extractEntities(q, entities, currentTenantName);
      const tm = parseTargetMonth(q);
      if (!tm) return STR(lang).whichMonth;
      return oneTenantPendingForMonth(name, formData, roomsData, leaveDates, tm.month, tm.year, lang);
    },

    help: () => {
      const s = STR(lang);
      return `${s.helpTitle}\n${s.helpBullets.map(b => `• ${b}`).join("\n")}`;
    }
  };

  const fn = H[intent];
  return fn ? fn() : (lang === "mr" ? "क्षमस्व, या प्रश्नाचे उत्तर अजून नाही." : lang === "hi" ? "माफ़ कीजिए, इसका उत्तर अभी उपलब्ध नहीं है." : "Sorry, I don't know how to answer that yet.");
}

// Helpers for month summaries (localized)
function listAllPendingForMonth(formData, roomsData, leaveDates, monthIdx, year, lang="en") {
  const S = STR(lang);
  const active = formData.filter(t => !isLeft(t, leaveDates));
  const rows = [];
  let total = 0;
  for (const t of active) {
    const paid = isPaidForMonth(t.rents, monthIdx, year);
    if (!paid) {
      const expect = defaultExpectFromTenant(t, roomsData);
      total += expect;
      rows.push(S.whoHasPendingLine(t.name, prettyCurrency(expect), t.roomNo, t.bedNo));
    }
  }
  const title = S.pendingForMonthTitle(humanMonth(monthIdx, year, lang));
  return rows.length ? `${title}\n${rows.join("\n")}\n${S.totalDue(prettyCurrency(total))}\n${S.count(rows.length)}` : `${title}\n${S.pendingNone}`;
}
function oneTenantPendingForMonth(name, formData, roomsData, leaveDates, monthIdx, year, lang="en") {
  const S = STR(lang);
  if (!name) return S.who;
  const t = findTenantByName(formData, leaveDates, name);
  if (!t) return S.noActiveTenant(name);
  const mh = humanMonth(monthIdx, year, lang);
  const paid = isPaidForMonth(t.rents, monthIdx, year);
  if (paid) return S.paidForMonth(t.name, mh);
  const expect = defaultExpectFromTenant(t, roomsData);
  return S.pendingForTenantMonth(t.name, prettyCurrency(expect), mh);
}

// ---------- Fuzzy router ----------
function makeRouter(patternRows) {
  const fuse = new Fuse(patternRows, {
    includeScore: true,
    minMatchCharLength: 2,
    threshold: 0.45,
    keys: ["text"]
  });
  return (q) => {
    const hits = fuse.search(q).slice(0, 5);
    if (!hits.length) return null;
    hits.sort((a,b) => (a.item.placeholders === b.item.placeholders)
      ? (a.score - b.score)
      : (a.item.placeholders ? 1 : -1));
    return hits[0].item.intent;
  };
}
function ruleIntent(q, entities) {
  const hasPendingWord = /\b(pending|due|baki|baaki|बकाया|बाकी|थकबाकी|उधार|उधारी|पेंडिंग|पेन्डिंग)\b/.test(q);
  const month = parseTargetMonth(q);
  if (month && hasPendingWord) {
    const lower = q.toLowerCase();
    const anyName = entities.names.find(n => lower.includes(n.toLowerCase()));
    if (/\bthis month\b/.test(lower)) {
      return anyName ? "pending_this_month_name" : "pending_this_month_all";
    }
    return anyName ? "pending_specific_month_name" : "pending_specific_month_all";
  }
  if (/\bthis month\b/.test(q) && /\bpending\b/.test(q)) return "pending_this_month_all";

  // NEW: quick rule for "update rent ..." forms
  if (/\bupdate\s+rent\b/i.test(q) && matchMonthToken(q)) return "open_update_rent";

  if (/\bwho left\b/.test(q) && /\blast month\b/.test(q)) return "left_last_month";
  return null;
}

// ---------- Suggestions (dropdown) ----------
function buildPendingSuggestions({ lang, currentTenantName }) {
  const S = STR(lang).sug;
  const now = new Date();
  const items = [];

  items.push(S.pendingAllThis);
  items.push(S.pendingAllLast);
  items.push(S.pendingAllNext);

  for (let k=1; k<=6; k++) {
    const d = new Date(now.getFullYear(), now.getMonth()-k, 1);
    const mName = monthName(d.getMonth(), lang);
    items.push(S.pendingAllFor(mName));
  }

  if (currentTenantName) {
    items.unshift(S.pendingNameThis(currentTenantName));
    for (let k=1; k<=2; k++) {
      const d = new Date(now.getFullYear(), now.getMonth()-k, 1);
      const mName = monthName(d.getMonth(), lang);
      items.push(S.pendingNameFor(currentTenantName, mName));
    }
  }
  return items;
}

// ---------- UI ----------
export default function TenantChatbot({
  formData = [],
  roomsData = [],
  leaveDates = {},
  helpers,
  lang = "en", // 'en' | 'mr' | 'hi'
  onOpenEdit,  // (tenantId, monthIdx, year) => void
}) {
  const strings = STR(lang);

  const [open, setOpen] = useState(true);
  const [log, setLog] = useState([{ role: "assistant", message: strings.greeting }]); // allow string or object
  const [input, setInput] = useState("");
  const [currentTenantName, setCurrentTenantName] = useState(null);

  // suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [activeSug, setActiveSug] = useState(0);

  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const entities = useMemo(() => buildEntities(formData, roomsData), [formData, roomsData]);

  const route = useMemo(() => {
    const rows = expandPatterns(rawIntents, entities);
    return makeRouter(rows);
  }, [entities]);

  // produce suggestions while typing
  useEffect(() => {
    const raw = input;
    const q = normalizeByLanguage(raw, lang);

    const hasPending =
      /\b(pending|due|baki|baaki|बकाया|बाकी|थकबाकी|उधार|उधारी|पेंडिंग|पेन्डिंग)\b/.test(q) ||
      /\bpending\b/.test(raw.toLowerCase());

    if (raw.trim().length === 0) {
      setShowSug(false);
      return;
    }

    if (hasPending) {
      const items = buildPendingSuggestions({ lang, currentTenantName });
      const fuse = new Fuse(items, { includeScore: true, threshold: 0.45 });
      const filtered = raw.trim().toLowerCase() === "pending" || /pending\s*$/i.test(q)
        ? items
        : fuse.search(raw).map(r => r.item);
      setSuggestions(filtered.slice(0, 10));
      setShowSug(true);
      setActiveSug(0);
    } else {
      setShowSug(false);
    }
  }, [input, lang, currentTenantName]);

  const insertSuggestion = (text) => {
    setInput(text);
    setShowSug(false);
    // You can auto-send by calling: send(text);
  };

  const send = (forcedText) => {
    const raw = (forcedText ?? input).trim();
    if (!raw) return;

    const q = normalizeByLanguage(raw, lang);

    let intent = route(q);
    if (!intent) intent = ruleIntent(q, entities);

    const answer = intent
      ? handleIntent({ intent, q, formData, roomsData, leaveDates, helpers, entities, lang, currentTenantName })
      : strings.didntGet;

    const { name } = extractEntities(q, entities, currentTenantName);
    if (name) setCurrentTenantName(name);

    setLog((prev) => [
      ...prev,
      { role: "user", message: raw },
      { role: "assistant", message: answer }
    ]);
    setInput("");
    setShowSug(false);
    setActiveSug(0);
    setTimeout(() => {
      boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
    }, 0);
  };

  const onKeyDown = (e) => {
    if (showSug && suggestions.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSug((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSug((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        insertSuggestion(suggestions[0]);
        return;
      }
      if (e.key === "Enter") {
        if (activeSug >= 0 && activeSug < suggestions.length) {
          e.preventDefault();
          insertSuggestion(suggestions[activeSug]);
          return;
        }
      }
      if (e.key === "Escape") {
        setShowSug(false);
        return;
      }
    }
    if (e.key === "Enter") {
      send();
    }
  };

  // --- Simple styling objects for chat bubbles ---
  const chatBodyStyle = { height: 360, overflowY: "auto", background: "#f7f9fb" };
  const bubbleBase = {
    maxWidth: "78%",
    padding: "10px 12px",
    borderRadius: 14,
    fontSize: 14,
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
  };
  const assistantBubble = {
    ...bubbleBase,
    background: "#eef2f7",
    color: "#111",
    borderTopLeftRadius: 6,
  };
  const userBubble = {
    ...bubbleBase,
    background: "#0d6efd",
    color: "#fff",
    borderTopRightRadius: 6,
  };
  const avatar = {
    width: 28, height: 28, borderRadius: "50%",
    display: "grid", placeItems: "center",
    background: "#e6edf6", color: "#3b82f6"
  };
  const userAvatar = {
    ...avatar, background: "#e9f0ff", color: "#0d6efd"
  };

  return (
    <div
  style={{
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 2000,
    width: "100%",
    maxWidth: open ? 480 : 203,         // ⬅️ collapses to 203px when closed
    transition: "max-width .25s ease, width .25s ease"
  }}
>
  <div className="card shadow" style={{ overflow: "hidden", borderRadius: 16 }}>
    <div
      className="card-header d-flex align-items-center justify-content-between"
      style={{ cursor: "pointer", background: "#ffffff" }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="d-flex align-items-center gap-2">
        <FaRobot /> <strong>Hostel Assistant</strong>
      </div>
      {open ? <FaChevronDown /> : <FaChevronUp />}
    </div>

    {open && (
      <>
        <div ref={boxRef} className="card-body" style={chatBodyStyle}>
          {log.map((m, i) => {
            const isUser = m.role === "user";
            const content = m.message; // can be string or object
            return (
              <div
                key={i}
                className={`d-flex mb-3 ${isUser ? "justify-content-end" : "justify-content-start"}`}
              >
                {!isUser && (
                  <div style={{ ...avatar, marginRight: 8 }}>
                    <FaRobot size={14} />
                  </div>
                )}
                <div style={isUser ? userBubble : assistantBubble}>
                  {typeof content === "string" ? (
                    <pre className="m-0" style={{ whiteSpace: "pre-wrap" }}>{content}</pre>
                  ) : content?.kind === "open-edit-link" ? (
                    <div>
                      <div className="mb-2">{content.label}</div>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenEdit?.(content.tenantId, content.month, content.year);
                        }}
                      >
                        Open edit modal
                      </a>
                    </div>
                  ) : (
                    <pre className="m-0" style={{ whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(content, null, 2)}
                    </pre>
                  )}
                </div>
                {isUser && (
                  <div style={{ ...userAvatar, marginLeft: 8 }}>
                    <FaUser size={12} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="card-footer position-relative" style={{ background: "#fff" }}>
          <div className="input-group">
            <input
              ref={inputRef}
              className="form-control"
              placeholder={strings.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button className="btn btn-primary" onClick={() => send()} title="Send">
              <FaPaperPlane />
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                setLog([{ role: "assistant", message: strings.greeting }]);
                setCurrentTenantName(null);
                setInput("");
                setShowSug(false);
              }}
              title="Clear"
            >
              <FaTimes />
            </button>
          </div>

          {/* Suggestion dropdown */}
          {showSug && suggestions.length > 0 && (
            <div
              className="shadow"
              style={{
                position: "absolute",
                left: 12,
                right: 84,
                bottom: 58,
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e6e6e6",
                maxHeight: 220,
                overflowY: "auto",
                zIndex: 10
              }}
            >
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onMouseDown={(e) => { e.preventDefault(); insertSuggestion(sug); }}
                  onMouseEnter={() => setActiveSug(idx)}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    background: idx === activeSug ? "#eef5ff" : "white"
                  }}
                >
                  {sug}
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    )}
  </div>
</div>

  );
}
