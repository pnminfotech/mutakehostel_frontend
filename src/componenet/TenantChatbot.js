import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  FaRobot, FaPaperPlane, FaTimes, FaChevronUp, FaChevronDown, FaUser,
  FaGlobe, FaCog
} from "react-icons/fa";
import Fuse from "fuse.js";
import rawIntents from "../componenet/json/chatbotIntents.json";


// ===== Month-aware rent record parser (make it top-level & reusable) =====
// Accepts records of shape:
//   { month: "Sep-25", rentAmount, ... }  OR  { date: "2025-09-10", ... }
const getYMFromRecord = (r) => {
  if (!r) return null;
  if (r.month) {
    const [mon, yy] = String(r.month).split("-");
    if (mon && yy) {
      const m = new Date(`${mon} 1, 20${yy}`).getMonth(); // 0..11
      const y = Number(`20${yy}`);
      if (Number.isFinite(m) && Number.isFinite(y)) return { y, m };
    }
  }
  if (r.date) {
    const d = new Date(r.date);
    if (!isNaN(d)) return { y: d.getFullYear(), m: d.getMonth() };
  }
  return null;
};

// ========== helpers ==========
const toNum = (v) => { if (v==null) return 0; const n = Number(String(v).replace(/[,₹\s]/g,"")); return Number.isFinite(n)?n:0; };
const prettyCurrency = (n) => `₹${(toNum(n)||0).toLocaleString("en-IN")}`;
function defaultExpectFromTenant(tenant, roomsData){
  const keys=["baseRent","rent","rentAmount","expectedRent","defaultRent","monthlyRent","price","bedPrice"];
  for (const k of keys){ const v=toNum(tenant?.[k]); if(v) return v; }
  if (roomsData && tenant?.roomNo && tenant?.bedNo){
    const room=roomsData.find(r=>String(r.roomNo)===String(tenant.roomNo));
    const bed=room?.beds?.find(b=>String(b.bedNo)===String(tenant.bedNo));
    return toNum(bed?.price)||toNum(bed?.baseRent)||toNum(bed?.monthlyRent)||0;
  }
  return 0;
}
function calculateDueThisYear(rents = [], joiningDateStr) {
  if (!joiningDateStr) return 0;

  const now = new Date();
  const y = now.getFullYear();

  // Jan 1 of current year vs 1 month after joining — same rule your table uses
  const startOfYear = new Date(y, 0, 1);
  const join = new Date(joiningDateStr);
  const rentStart = new Date(join.getFullYear(), join.getMonth() + 1, 1);
  const start = rentStart > startOfYear ? rentStart : startOfYear;

  const paid = new Set(
    (rents || [])
      .filter(r => toNum(r?.rentAmount) > 0)
      .map(getYMFromRecord)
      .filter(Boolean)
      .map(({ m, y }) => `${m}-${y}`)
  );


  // Use the last paid amount as the expected base (keeps your existing behavior)
  const lastPaid = (rents || [])
    .filter(r => toNum(r?.rentAmount) > 0 && getYMFromRecord(r))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];

  const rentAmount = lastPaid ? toNum(lastPaid.rentAmount) : 0;

  let dueCount = 0;
  const cur = new Date(start);
  while (cur <= now && cur.getFullYear() === y) {
    const key = `${cur.getMonth()}-${cur.getFullYear()}`;
    if (!paid.has(key)) dueCount++;
    cur.setMonth(cur.getMonth() + 1);
  }
  return rentAmount * dueCount;
}

function pendingMonthsFrom(joiningDateStr, rents=[]){
  if(!joiningDateStr) return [];
  const now=new Date(); const y=now.getFullYear();
  const join=new Date(joiningDateStr);
  const start = new Date(join.getFullYear(), join.getMonth() + 1, 1);
  const paid = new Set(
    (rents || [])
      .filter(r => toNum(r?.rentAmount) > 0)
      .map(getYMFromRecord)
      .filter(Boolean)
      .map(({ m, y }) => `${m}-${y}`)
  );
  const out=[]; const cur=new Date(start);
  while(cur<=now){ const key=`${cur.getMonth()}-${cur.getFullYear()}`;
    if(cur.getFullYear()===y && !paid.has(key)){ out.push(cur.toLocaleString("default",{month:"long",year:"numeric"})); }
    cur.setMonth(cur.getMonth()+1);
  }
  return out;
}
function isPaidForMonth(rents = [], monthIdx, year) {
  return (rents || []).some(r => {
    const ym = getYMFromRecord(r);
    return ym && ym.m === monthIdx && ym.y === year && toNum(r.rentAmount) > 0;
  });
}
function getAllPendingMonths(rents = [], joiningDateStr) {
  if (!joiningDateStr) return [];
  const join = new Date(joiningDateStr);
  const start = new Date(join.getFullYear(), join.getMonth() + 1, 1);
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), 1);

  const paidSet = new Set(
    (Array.isArray(rents) ? rents : [])
      .filter(r => toNum(r?.rentAmount) > 0)
      .map(getYMFromRecord)
      .filter(Boolean)
      .map(({ m, y }) => `${m}-${y}`)
  );

  const out = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = `${cursor.getMonth()}-${cursor.getFullYear()}`;
    if (!paidSet.has(key)) {
      out.push(cursor.toLocaleString("default", { month: "long", year: "numeric" }));
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

const isLeft=(tenant, leaveDates)=>{ const iso=leaveDates?.[tenant._id]; return iso && new Date(iso)<new Date(); };
const norm=(s)=> (s||"").toLowerCase().trim();
const unique=(arr)=> Array.from(new Set(arr));

// ========== language strings ==========
function STR(lang){
  if(lang==="mr"){ return {
    greeting:"मराठी निवडलं. भाडे, देय, रिकामे बेड… विचारू शकता. ‘help’ टाईप करा.",
    placeholder:"भाडे, देय, रिकामे बेड… (help टाईप करा)",
    didntGet:"समजले नाही. ‘help’ टाईप करा किंवा वेगळे शब्द वापरा.",
    whichMonth:"कोणता महिना?", who:"कोण?", whichRoom:"कोणता रूम? उदा.: “room 101 मधे रिकामे beds”.",
    noActiveTenant:(n)=>`“${n}” नावाचा सक्रिय रहिवासी सापडला नाही.`,
    roomNotFound:(r)=>`रूम ${r} सापडला नाही.`,
    rentStatusTitle:(t)=>`${t} चा रेंट स्टेटस`,
    labelRoomBed:(r,b)=>`रूम ${r} • बेड ${b}`,
    expectedMonthly:(amt)=>`— अपेक्षित मासिक: ${amt}`,
    thisYearDue:(amt,mcount)=>`— या वर्षीचे देय: ${amt} (${mcount} महिने)`,
    pendingMonths:"— पेंडिंग महिने:", noPendingMonths:"— पेंडिंग महिने नाहीत ✅",
    vacantTitle:(room)=>`रूम ${room} मधले रिकामे बेड:`,
    vacantLine:(b,cat,price)=>`• बेड ${b}${cat?` (${cat})`:""}${price?` • ${price}`:""}`,
    noVacant:(room)=>`रूम ${room} मध्ये कोणताही बेड रिकामा नाही.`,
    leftLastMonthNone:"गेल्या महिन्यात कोणी गेले नाही.",
    leftLastMonthTitle:"गेल्या महिन्यात गेलेले रहिवासी:",
    leftLastMonthLine:(n,r,b,date)=>`• ${n} (रूम ${r} • बेड ${b}) — ${date}`,
    whoHasPendingTitle:(y)=>`${y} साठी पेंडिंग असलेले रहिवासी:`,
    whoHasPendingLine:(n,amt,r,b)=>`• ${n} — ${amt} (रूम ${r} • बेड ${b})`,
    totalDue:(amt)=>`— एकूण देय: ${amt}`, count:(n)=>`• संख्या: ${n}`,
    dueForYearLine:(n,amt,y)=>`${n} चे या वर्षीचे देय: ${amt}`,
    phoneLine:(n,p)=>`${n} चा फोन: ${p||"—"}`, depositLine:(n,amt)=>`${n} ने ${amt} डिपॉझिट दिले आहे.`,
    pendingForMonthTitle:(mh)=>`${mh} साठी पेंडिंग:`, pendingNone:"काहीही नाही ✅",
    paidForMonth:(n,mh)=>`${n} ने ${mh} चे पैसे भरले आहेत.`,
pendingForTenantMonth: (name, amt, mh) => `${name} का ${mh} के लिए ${amt} पेंडिंग है।`,

    helpTitle:"उदाहरणे:", helpBullets:[
      "Priya चा rent status","Akash चे किती due आहे","Rohan चे pending months",
      "room 101 मधे रिकामे beds","कोणाचे rent pending आहे","Nikhil चे deposit किती",
      "Pooja चा phone","गेल्या महिन्यात कोण गेले","या महिन्याचे सर्व pending",
      "March महिन्याचे सर्व pending","Priya चे या महिन्याचे pending"
    ],
    sug:{
      pendingAllThis:"या महिन्याचे सर्व pending",
      pendingAllLast:"गेल्या महिन्याचे सर्व pending",
      pendingAllNext:"पुढच्या महिन्याचे सर्व pending",
      pendingAllFor:(m)=>`${m} महिन्याचे सर्व pending`,
      pendingNameThis:(n)=>`${n} चे या महिन्याचे pending`,
      pendingNameFor:(n,m)=>`${n} चे ${m} महिन्याचे pending`,
      pendingForTenantMonth: (name, amt, mh) => `${name} चे ${mh} साठी ${amt} पेंडिंग आहे.`,

    }
  }; }
  if(lang==="hi"){ return {
    greeting:"हिन्दी चुना गया। किराया, बकाया, खाली बेड… पूछें। ‘help’ टाइप करें.",
    placeholder:"किराया, बकाया, खाली बेड… (help टाइप करें)",
    didntGet:"समझ नहीं आया। ‘help’ टाइप करें या अलग तरह से पूछें.",
    whichMonth:"कौन-सा महीना?", who:"कौन?", whichRoom:"कौन-सा रूम? “room 101 में खाली beds”.",
    noActiveTenant:(n)=>`“${n}” नाम का सक्रिय किरायेदार नहीं मिला.`,
    roomNotFound:(r)=>`रूम ${r} नहीं मिला.`,
    rentStatusTitle:(t)=>`${t} का रेंट स्टेटस`,
    labelRoomBed:(r,b)=>`रूम ${r} • बेड ${b}`,
    expectedMonthly:(amt)=>`— अपेक्षित मासिक: ${amt}`,
    thisYearDue:(amt,mcount)=>`— इस वर्ष का बकाया: ${amt} (${mcount} महीने)`,
    pendingMonths:"— पेंडिंग महीने:", noPendingMonths:"— कोई पेंडिंग महीना नहीं ✅",
    vacantTitle:(room)=>`रूम ${room} में खाली बेड:`,
    vacantLine:(b,cat,price)=>`• बेड ${b}${cat?` (${cat})`:""}${price?` • ${price}`:""}`,
    noVacant:(room)=>`रूम ${room} में कोई बेड खाली नहीं है.`,
    leftLastMonthNone:"पिछले महीने कोई नहीं गया.",
    leftLastMonthTitle:"पिछले महीने गए किरायेदार:",
    leftLastMonthLine:(n,r,b,date)=>`• ${n} (रूम ${r} • बेड ${b}) — ${date}`,
    whoHasPendingTitle:(y)=>`${y} के पेंडिंग किराए:`,
    whoHasPendingLine:(n,amt,r,b)=>`• ${n} — ${amt} (रूम ${r} • बेड ${b})`,
    totalDue:(amt)=>`— कुल बकाया: ${amt}`, count:(n)=>`• संख्या: ${n}`,
    dueForYearLine:(n,amt,y)=>`${n} का ${y} के लिए बकाया: ${amt}`,
    phoneLine:(n,p)=>`${n} का फ़ोन: ${p||"—"}`, depositLine:(n,amt)=>`${n} ने ${amt} डिपॉज़िट दिया है.`,
    pendingForMonthTitle:(mh)=>`${mh} के पेंडिंग:`, pendingNone:"कुछ नहीं ✅",
    paidForMonth:(n,mh)=>`${n} ने ${mh} का भुगतान कर दिया है।`,
    pendingForTenantMonth: (name, amt, mh) => `${name} का ${mh} के लिए ${amt} पेंडिंग है।`,
 helpTitle:"उदाहरण:", helpBullets:[
      "Priya का rent status","Akash का कितना due है","Rohan के pending months",
      "room 101 में खाली beds","किसका rent pending है","Nikhil का deposit कितना",
      "Pooja का phone","पिछले महीने कौन गया","इस महीने के सभी pending",
      "March के सभी pending","Priya का इस महीने का pending"
    ],
    sug:{
      pendingAllThis:"इस महीने के सभी pending",
      pendingAllLast:"पिछले महीने के सभी pending",
      pendingAllNext:"अगले महीने के सभी pending",
      pendingAllFor:(m)=>`${m} के सभी pending`,
      pendingNameThis:(n)=>`${n} का इस महीने का pending`,
      pendingNameFor:(n,m)=>`${n} का ${m} का pending`,
    }
  }; }
  return {
    greeting:"Hi! Ask about rent, dues, vacancies, deposits, phones, etc. Type ‘help’ for examples.",
    placeholder:"Ask about rent, dues, vacancy… (try ‘help’)",
    didntGet:"I didn't get that. Type ‘help’ or try another phrasing.",
    whichMonth:"Which month?", who:"Who?", whichRoom:"Which room? Try: “vacant beds in room 101”.",
    noActiveTenant:(n)=>`I couldn't find an active tenant named “${n}”.`,
    roomNotFound:(r)=>`Room ${r} not found.`,
    rentStatusTitle:(t)=>`Rent status for ${t}`,
    labelRoomBed:(r,b)=>`Room ${r} • Bed ${b}`,
    expectedMonthly:(amt)=>`— Expected monthly: ${amt}`,
    thisYearDue:(amt,mcount)=>`— This year due: ${amt} (${mcount} months)`,
    pendingMonths:"— Pending months:", noPendingMonths:"— No pending months ✅",
    vacantTitle:(room)=>`Vacant beds in room ${room}:`,
    vacantLine:(b,cat,price)=>`• Bed ${b}${cat?` (${cat})`:""}${price?` • ${price}`:""}`,
    noVacant:(room)=>`No vacant beds in room ${room}.`,
    leftLastMonthNone:"No one left last month.",
    leftLastMonthTitle:"Tenants who left last month:",
    leftLastMonthLine:(n,r,b,date)=>`• ${n} (Room ${r} • Bed ${b}) on ${date}`,
    whoHasPendingTitle:(y)=>`Tenants with pending rents (${y}):`,
    whoHasPendingLine:(n,amt,r,b)=>`• ${n} — ${amt} (Room ${r} • Bed ${b})`,
    totalDue:(amt)=>`— Total due: ${amt}`, count:(n)=>`• Count: ${n}`,
    dueForYearLine:(n,amt,y)=>`${n} has ${amt} due for ${y}.`,
    phoneLine:(n,p)=>`${n}'s phone: ${p||"—"}`, depositLine:(n,amt)=>`${n} deposited ${amt}.`,
    pendingForMonthTitle:(mh)=>`Pending for ${mh}:`, pendingNone:"None ✅",
    paidForMonth:(n,mh)=>`${n} has paid for ${mh}.`,
    pendingForTenantMonth:(n,amt,mh)=>`${n} is pending ${amt} for ${mh}.`,
    helpTitle:"Examples:", helpBullets:[
      "rent status of Priya","how much due for Akash","pending months for Rohan",
      "vacant beds in room 101","who has pending","deposit of Nikhil",
      "phone of Pooja","who left last month","all pending this month",
      "all pending for March","Priya pending this month"
    ],
    sug:{
      pendingAllThis:"all pending this month",
      pendingAllLast:"all pending last month",
      pendingAllNext:"all pending next month",
      pendingAllFor:(m)=>`all pending for ${m}`,
      pendingNameThis:(n)=>`${n} pending this month`,
      pendingNameFor:(n,m)=>`${n} pending for ${m}`,
    }
  };
}

// language-aware normalizer
function normalizeByLanguage(q, lang){
  let s=q.toLowerCase().trim();
  const repl=(re,to)=>{ s=s.replace(re,to); };
  repl(/\bstetus\b/g,"status"); repl(/\bstatuz\b/g,"status");
  if(lang==="mr"||lang==="hi"){
    repl(/\b(rikame|khali|khaali|free|mukt)\b/g,"vacant");
    repl(/\b(bha?de|bhade|kiraya|rentu?)\b/g,"rent");
    repl(/\b(deposit|deposite|diposit|jamma|jama|jamaa)\b/g,"deposit");
    repl(/\b(baki|baaki|due|udh?aari|pending)\b/g,"pending");
    repl(/\b(mahina|mahine|mahiny)\b/g,"month");
    repl(/\b(phone|mobile|contact|call)\b/g,"phone");
    repl(/\b(rum|roomm|room)\b/g,"room");
    repl(/\b(is|ye|yah|ya|ha)\s+month\b/g,"this month");
    repl(/\b(pichle|gela|last)\s+month\b/g,"last month");
    repl(/\b(agle|next|pudhil|pudhcha)\s+month\b/g,"next month");
  }
  return s;
}

// month helpers
const MONTHS=[["january","jan"],["february","feb"],["march","mar"],["april","apr"],["may"],["june","jun"],["july","jul"],["august","aug"],["september","sep","sept"],["october","oct"],["november","nov"],["december","dec"]];
function monthName(idx,lang="en"){ const d=new Date(new Date().getFullYear(), idx, 1); const loc=lang==="mr"?"mr-IN":lang==="hi"?"hi-IN":"en-IN"; return d.toLocaleString(loc,{month:"long"}); }
function humanMonth(m,y,lang="en"){ const loc=lang==="mr"?"mr-IN":lang==="hi"?"hi-IN":"en-IN"; return new Date(y,m,1).toLocaleString(loc,{month:"long",year:"numeric"}); }
function matchMonthToken(q){ for(let i=0;i<MONTHS.length;i++){ for(const t of MONTHS[i]){ const re=new RegExp(`\\b${t}\\b`,"i"); if(re.test(q)) return i; } } return null; }
function parseTargetMonth(q){
  const now=new Date(); const lc=q.toLowerCase();
  if(/\bthis month\b/.test(lc)) return {month:now.getMonth(),year:now.getFullYear(),label:"this month"};
  if(/\blast month\b/.test(lc)){ const d=new Date(now.getFullYear(),now.getMonth()-1,1); return {month:d.getMonth(),year:d.getFullYear(),label:"last month"}; }
  if(/\bnext month\b/.test(lc)){ const d=new Date(now.getFullYear(),now.getMonth()+1,1); return {month:d.getMonth(),year:d.getFullYear(),label:"next month"}; }
  const mIdx=matchMonthToken(lc); if(mIdx!==null) return {month:mIdx,year:now.getFullYear(),label:MONTHS[mIdx][0]};
  return null;
}

// entities & routing
function buildEntities(formData, roomsData){
  const names=unique(formData.map(t=>(t.name||"").trim()).filter(Boolean)).sort((a,b)=>a.localeCompare(b));
  const rooms=unique((roomsData||[]).map(r=>String(r.roomNo)));
  return {names,rooms};
}

function findTenantByName(formData, leaveDates, name){
  const active=formData.filter(t=>!isLeft(t,leaveDates));
  const q=norm(name);
  // exact or includes
  let t=active.find(x=>norm(x.name)===q)||active.find(x=>norm(x.name).includes(q));
  if(t) return t;
  // fuzzy fallback
  const fuse=new Fuse(active,{keys:["name"],includeScore:true,threshold:0.33,minMatchCharLength:2});
  const hit=fuse.search(name)[0];
  return hit?.item||null;
}

function expandPatterns(intentsJson, entities){
  const rows=[]; (Array.isArray(intentsJson)?intentsJson:[]).forEach(entry=>{
    const pats=entry.patterns||entry.examples||[];
    pats.forEach(p=>{
      rows.push({intent:entry.intent,text:p,placeholders:true});
      if(p.includes("{name}")) entities.names.slice(0,300).forEach(nm=>rows.push({intent:entry.intent,text:p.replace("{name}",nm),placeholders:false}));
      if(p.includes("{room}")) entities.rooms.forEach(rm=>rows.push({intent:entry.intent,text:p.replace("{room}",rm),placeholders:false}));
    });
  });
  rows.push(
    {intent:"pending_this_month_all",text:"all pending this month",placeholders:false},
    {intent:"pending_specific_month_all",text:"all pending for {month}",placeholders:true},
    {intent:"pending_this_month_name",text:"pending this month for {name}",placeholders:true},
    {intent:"pending_specific_month_name",text:"pending for {name} in {month}",placeholders:true},
    {intent:"open_update_rent",text:"update rent for {name} for {month}",placeholders:true},
    {intent:"open_update_rent",text:"update rent for {name} in {month}",placeholders:true},
    {intent:"open_update_rent",text:"update rent {name} {month}",placeholders:true},
  );
  return rows;
}

function makeRouter(patternRows){
  const fuse=new Fuse(patternRows,{includeScore:true,minMatchCharLength:2,threshold:0.45,keys:["text"]});
  return (q)=>{ const hits=fuse.search(q).slice(0,5); if(!hits.length) return null;
    hits.sort((a,b)=> (a.item.placeholders===b.item.placeholders) ? (a.score-b.score) : (a.item.placeholders?1:-1));
    return hits[0].item.intent; };
}

function extractEntities(q, entities, currentTenantName){
  // better room detection: word boundary around digits/letters
  const room=(q.match(/\broom\s+([A-Za-z0-9\-]+)\b/i)?.[1])||entities.rooms.find(r=>q.includes(String(r)))||null;

  // robust name detection: prefer longest token match
  const lower=q.toLowerCase();
  let name=null, best=0;
  for(const n of entities.names){
    const ln=n.toLowerCase();
    if(lower.includes(ln) && ln.length>best){ name=n; best=ln.length; }
  }
  if(!name && currentTenantName) name=currentTenantName;
  return {name,room};
}

function listAllPendingForMonth(formData, roomsData, leaveDates, monthIdx, year, lang="en"){
  const S=STR(lang); const active=formData.filter(t=>!isLeft(t,leaveDates)); const rows=[]; let total=0;
  for(const t of active){
    const paid=isPaidForMonth(t.rents,monthIdx,year);
    if(!paid){ const expect=defaultExpectFromTenant(t,roomsData); total+=expect; rows.push(S.whoHasPendingLine(t.name,prettyCurrency(expect),t.roomNo,t.bedNo)); }
  }
  const title=S.pendingForMonthTitle(humanMonth(monthIdx,year,lang));
  return rows.length?`${title}\n${rows.join("\n")}\n${S.totalDue(prettyCurrency(total))}\n${S.count(rows.length)}`:`${title}\n${S.pendingNone}`;
}

function oneTenantPendingForMonth(name, formData, roomsData, leaveDates, monthIdx, year, lang="en"){
  const S=STR(lang); if(!name) return S.who;
  const t=findTenantByName(formData,leaveDates,name); if(!t) return S.noActiveTenant(name);
  const mh=humanMonth(monthIdx,year,lang); const paid=isPaidForMonth(t.rents,monthIdx,year);
  if(paid) return S.paidForMonth(t.name,mh);
  const expect=defaultExpectFromTenant(t,roomsData);
  return S.pendingForTenantMonth(t.name, prettyCurrency(expect), mh);
}

function handleIntent({ intent, q, formData, roomsData, leaveDates, entities, lang, currentTenantName }){
  const S=STR(lang);
  const H={
    open_update_rent: ()=>{ const {name}=extractEntities(q,entities,currentTenantName); if(!name) return S.who; const tm=parseTargetMonth(q); if(!tm) return S.whichMonth;
      const t=findTenantByName(formData,leaveDates,name); if(!t) return S.noActiveTenant(name);
      return { kind:"open-edit-link", tenantId:t._id, month:tm.month, year:tm.year, label:`Update ${t.name}'s rent for ${humanMonth(tm.month, tm.year, lang)}` };
    },
    rent_status: ()=>{ const {name}=extractEntities(q,entities,currentTenantName); if(!name) return S.who; const t=findTenantByName(formData,leaveDates,name); if(!t) return S.noActiveTenant(name);
      const expect=defaultExpectFromTenant(t,roomsData); const due=calculateDueThisYear(t.rents,t.joiningDate); const months=pendingMonthsFrom(t.joiningDate,t.rents);
      return [`${S.rentStatusTitle(t.name)} (${S.labelRoomBed(t.roomNo,t.bedNo)})`, S.expectedMonthly(prettyCurrency(expect)), S.thisYearDue(prettyCurrency(due), months.length), months.length?`${S.pendingMonths}\n${months.map(m=>`• ${m}`).join("\n")}`:S.noPendingMonths].join("\n");
    },
    due_amount: ()=>{ const {name}=extractEntities(q,entities,currentTenantName); if(!name) return S.who; const t=findTenantByName(formData,leaveDates,name); if(!t) return S.noActiveTenant(name);
      const due=calculateDueThisYear(t.rents,t.joiningDate); return S.dueForYearLine(t.name, prettyCurrency(due), new Date().getFullYear()); },
    pending_months: ()=>{ const {name}=extractEntities(q,entities,currentTenantName); if(!name) return S.who; const t=findTenantByName(formData,leaveDates,name); if(!t) return S.noActiveTenant(name);
      const months=pendingMonthsFrom(t.joiningDate,t.rents); return months.length?`${t.name} — ${S.pendingMonths}\n${months.map(m=>`• ${m}`).join("\n")}`:S.noPendingMonths; },
   vacant_beds_in_room: () => {
  const { room } = extractEntities(q, entities, currentTenantName);
  if (!room) return S.whichRoom;

  const active = new Set(
    formData.filter(t => !isLeft(t, leaveDates)).map(t => `${t.roomNo}-${t.bedNo}`)
  );

  const roomObj = roomsData.find(r => String(r.roomNo) === String(room));
  if (!roomObj) return S.roomNotFound(room);

  const vacant = (roomObj?.beds || []).filter(b => !active.has(`${room}-${b.bedNo}`));
  if (!vacant.length) return S.noVacant(room);

  return `${S.vacantTitle(room)}\n${vacant
    .map(b => S.vacantLine(b.bedNo, b.category, b.price ? prettyCurrency(b.price) : ""))
    .join("\n")}`;
},

    who_has_pending: ()=>{ const y=new Date().getFullYear();
      const pending=formData.filter(t=>!isLeft(t,leaveDates)).map(t=>({t, due:calculateDueThisYear(t.rents,t.joiningDate)})).filter(x=>x.due>0).sort((a,b)=>b.due-a.due).slice(0,100);
      if(!pending.length) return `${S.whoHasPendingTitle(y)}\n${S.pendingNone}`;
      const total=pending.reduce((s,x)=>s+toNum(x.due),0);
      const lines=pending.map(({t,due})=>S.whoHasPendingLine(t.name,prettyCurrency(due),t.roomNo,t.bedNo)).join("\n");
      return `${S.whoHasPendingTitle(y)}\n${lines}\n${S.totalDue(prettyCurrency(total))}`;
    },
    phone_of: ()=>{ const {name}=extractEntities(q,entities,currentTenantName); if(!name) return S.who; const t=findTenantByName(formData,leaveDates,name); if(!t) return S.noActiveTenant(name); return S.phoneLine(t.name,t.phoneNo); },
    deposit_of: ()=>{ const {name}=extractEntities(q,entities,currentTenantName); if(!name) return S.who; const t=findTenantByName(formData,leaveDates,name); if(!t) return S.noActiveTenant(name); return S.depositLine(t.name, prettyCurrency(t.depositAmount)); },
    left_last_month: ()=>{ const now=new Date(); const last=new Date(now.getFullYear(),now.getMonth()-1,1);
      const out=(formData||[]).filter(t=> t.leaveDate && new Date(t.leaveDate).getFullYear()===last.getFullYear() && new Date(t.leaveDate).getMonth()===last.getMonth());
      if(!out.length) return S.leftLastMonthNone; const lines=out.map(t=>S.leftLastMonthLine(t.name,t.roomNo,t.bedNo,new Date(t.leaveDate).toLocaleDateString())).join("\n");
      return `${S.leftLastMonthTitle}\n${lines}`;
    },
    pending_this_month_all: ()=>{ const tm=parseTargetMonth("this month"); return listAllPendingForMonth(formData,roomsData,leaveDates,tm.month,tm.year,lang); },
    pending_specific_month_all: ()=>{ const tm=parseTargetMonth(q); if(!tm) return S.whichMonth; return listAllPendingForMonth(formData,roomsData,leaveDates,tm.month,tm.year,lang); },
    pending_this_month_name: ()=>{ const {name}=extractEntities(q,entities,currentTenantName); const tm=parseTargetMonth("this month"); return oneTenantPendingForMonth(name,formData,roomsData,leaveDates,tm.month,tm.year,lang); },
    pending_specific_month_name: ()=>{ const {name}=extractEntities(q,entities,currentTenantName); const tm=parseTargetMonth(q); if(!tm) return S.whichMonth; return oneTenantPendingForMonth(name,formData,roomsData,leaveDates,tm.month,tm.year,lang); },
    help: ()=> `${S.helpTitle}\n${S.helpBullets.map(b=>`• ${b}`).join("\n")}`,
  };
  return H[intent] ? H[intent]() : S.didntGet;
}

function ruleIntent(q, entities){
  const hasPendingWord=/\b(pending|due|baki|baaki|बकाया|बाकी|थकबाकी|उधार|उधारी|पेंडिंग|पेन्डिंग)\b/.test(q);
  const month=parseTargetMonth(q);
  if(month && hasPendingWord){
    const lower=q.toLowerCase(); const anyName=entities.names.find(n=>lower.includes(n.toLowerCase()));
    if(/\bthis month\b/.test(lower)){ return anyName ? "pending_this_month_name" : "pending_this_month_all"; }
    return anyName ? "pending_specific_month_name" : "pending_specific_month_all";
  }
  if(/\bupdate\s+rent\b/i.test(q) && matchMonthToken(q)) return "open_update_rent";
  if(/\bwho left\b/.test(q) && /\blast month\b/.test(q)) return "left_last_month";
  return null;
}

function buildPendingSuggestions({lang, currentTenantName}){
  const S=STR(lang).sug; const now=new Date(); const items=[];
  items.push(S.pendingAllThis, S.pendingAllLast, S.pendingAllNext);
  for(let k=1;k<=6;k++){ const d=new Date(now.getFullYear(), now.getMonth()-k, 1); const mName=monthName(d.getMonth(), lang); items.push(S.pendingAllFor(mName)); }
  if(currentTenantName){ items.unshift(S.pendingNameThis(currentTenantName));
    for(let k=1;k<=2;k++){ const d=new Date(now.getFullYear(), now.getMonth()-k, 1); const mName=monthName(d.getMonth(), lang); items.push(S.pendingNameFor(currentTenantName, mName)); } }
  return items;
}

// ========== RESPONSIVE CHATBOT (with internal language picker) ==========
export default function TenantChatbot({
  formData = [],
  roomsData = [],
  leaveDates = {},
  helpers,                // not used now; we use internal helpers
  onOpenEdit,            // (tenantId, monthIdx, year) => void
}) {
  // language lives only inside chatbot
  const [lang, setLang] = useState(() => (typeof window!=="undefined" && localStorage.getItem("tenantChat.lang")) || "");
  const [showLangPicker, setShowLangPicker] = useState(() => !lang);

  const strings = STR(lang || "en");

  // responsive: full-width on small screens
  const isNarrow = () => (typeof window!=="undefined" ? window.matchMedia("(max-width: 991.98px)").matches : false);
  const isPhone  = () => (typeof window!=="undefined" ? window.matchMedia("(max-width: 575.98px)").matches : false);

  const [mobileLike, setMobileLike] = useState(isNarrow());
  const [phone, setPhone] = useState(isPhone());
  const [vhHeight, setVhHeight] = useState(() => (typeof window!=="undefined" ? window.innerHeight : 800));

  useEffect(() => {
    const onResize = () => {
      setMobileLike(isNarrow());
      setPhone(isPhone());
      setVhHeight(typeof window!=="undefined" ? window.innerHeight : 800);
    };
    window.addEventListener?.("resize", onResize);
    return () => window.removeEventListener?.("resize", onResize);
  }, []);

  const [open, setOpen] = useState(true);
  const [log, setLog] = useState([{ role: "assistant", message: strings.greeting }]);
  const [input, setInput] = useState("");
  const [currentTenantName, setCurrentTenantName] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [activeSug, setActiveSug] = useState(0);

  const boxRef = useRef(null);
  const inputRef = useRef(null);

  // recompute greeting on first language pick
  useEffect(() => {
    if (!lang) return;
    setLog([{ role: "assistant", message: STR(lang).greeting }]);
  }, [lang]);

  const entities = useMemo(() => buildEntities(formData, roomsData), [formData, roomsData]);
  const router = useMemo(() => makeRouter(expandPatterns(rawIntents, entities)), [entities]);

  // suggestions on typing
  useEffect(() => {
    const raw=input;
    const q=normalizeByLanguage(raw, lang || "en");
    const hasPending=/\b(pending|due|baki|baaki|बकाया|बाकी|थकबाकी|उधार|उधारी|पेंडिंग|पेन्डिंग)\b/.test(q) || /\bpending\b/.test(raw.toLowerCase());
    if(raw.trim().length===0){ setShowSug(false); return; }
    if(hasPending){
      const items=buildPendingSuggestions({lang: lang || "en", currentTenantName});
      const fuse=new Fuse(items,{includeScore:true,threshold:0.45});
      const filtered= raw.trim().toLowerCase()==="pending" || /pending\s*$/i.test(q)
        ? items : fuse.search(raw).map(r=>r.item);
      setSuggestions(filtered.slice(0,10)); setShowSug(true); setActiveSug(0);
    } else { setShowSug(false); }
  }, [input, lang, currentTenantName]);

  const insertSuggestion=(text)=>{ setInput(text); setShowSug(false); };

  const send=(forcedText)=>{
    const raw=(forcedText??input).trim(); if(!raw) return;
    const q=normalizeByLanguage(raw, lang || "en");

    // 1) precise rule-based routing first
    let intent=ruleIntent(q, entities);
    // 2) then fuzzy fallback
    if(!intent) intent=router(q);

    const answer= intent
      ? handleIntent({ intent, q, formData, roomsData, leaveDates, entities, lang: lang || "en", currentTenantName })
      : STR(lang||"en").didntGet;

    const { name } = extractEntities(q, entities, currentTenantName);
    if(name) setCurrentTenantName(name);

    setLog(prev=>[...prev, {role:"user", message:raw}, {role:"assistant", message:answer}]);
    setInput(""); setShowSug(false); setActiveSug(0);
    setTimeout(()=>{ boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior:"smooth" }); }, 0);
  };

  const onKeyDown=(e)=>{
    if(showSug && suggestions.length){
      if(e.key==="ArrowDown"){ e.preventDefault(); setActiveSug(i=>(i+1)%suggestions.length); return; }
      if(e.key==="ArrowUp"){ e.preventDefault(); setActiveSug(i=>(i-1+suggestions.length)%suggestions.length); return; }
      if(e.key==="Tab"){ e.preventDefault(); insertSuggestion(suggestions[0]); return; }
      if(e.key==="Enter"){ if(activeSug>=0 && activeSug<suggestions.length){ e.preventDefault(); insertSuggestion(suggestions[activeSug]); return; } }
      if(e.key==="Escape"){ setShowSug(false); return; }
    }
    if(e.key==="Enter"){ send(); }
  };
// Accepts r.month like "Sep-25" or falls back to r.date


  // styles (responsive)
  // On mobile/tablet use ~60vh but clamp to avoid super tall panels; desktop stays 360px
   // Smaller heights: phones ≈ 50vh (clamp 220–380), tablets ≈ 56vh (clamp 240–420)
  const mobileBodyHeight = (() => {
    const vh = vhHeight || 800;
    if (phone) {
      return Math.max(220, Math.min(0.50 * vh, 380));
    }
    // tablet and small laptops
    return Math.max(240, Math.min(0.56 * vh, 420));
  })();


  const containerStyle = mobileLike
    ? { position:"fixed", left:0, right:0, bottom:0, zIndex:2000, padding:"8px", maxWidth:"100%" }
    : { position:"fixed", right:16, bottom:16, zIndex:2000, width:"100%", maxWidth: open? 480 : 203, transition:"max-width .25s ease, width .25s ease" };

  const chatBodyStyle = { height: mobileLike ? mobileBodyHeight : 360, overflowY:"auto", background:"#f7f9fb" };
  const bubbleBase = { maxWidth:"78%", padding:"10px 12px", borderRadius:14, fontSize:14, lineHeight:1.35, whiteSpace:"pre-wrap" };
  const assistantBubble = { ...bubbleBase, background:"#eef2f7", color:"#111", borderTopLeftRadius:6 };
  const userBubble = { ...bubbleBase, background:"#0d6efd", color:"#fff", borderTopRightRadius:6 };
  const avatar = { width:28, height:28, borderRadius:"50%", display:"grid", placeItems:"center", background:"#e6edf6", color:"#3b82f6" };
  const userAvatar = { ...avatar, background:"#e9f0ff", color:"#0d6efd" };

  const LanguagePicker = () => (
    <div style={{ padding:"14px" }}>
      <div className="d-flex align-items-center gap-2 mb-2">
        <FaGlobe /><strong>Select language</strong>
      </div>
      <div className="d-flex flex-wrap gap-2">
        <button className="btn btn-sm btn-outline-primary" onClick={()=>{ setLang("en"); localStorage.setItem("tenantChat.lang","en"); setShowLangPicker(false); }}>English</button>
        <button className="btn btn-sm btn-outline-primary" onClick={()=>{ setLang("hi"); localStorage.setItem("tenantChat.lang","hi"); setShowLangPicker(false); }}>हिन्दी</button>
        <button className="btn btn-sm btn-outline-primary" onClick={()=>{ setLang("mr"); localStorage.setItem("tenantChat.lang","mr"); setShowLangPicker(false); }}>मराठी</button>
      </div>
      <small className="text-muted d-block mt-2">You can change later from the settings icon.</small>
    </div>
  );

  return (
    <div style={containerStyle}>
      {/* Mobile closed state: tiny FAB */}
      {phone && !open && (
        <button
          className="btn btn-primary shadow"
          onClick={()=>setOpen(true)}
          style={{ position:"fixed", right:16, bottom:16, borderRadius:"999px", width:56, height:56, display:"grid", placeItems:"center", zIndex:2001 }}
          aria-label="Open chatbot"
        >
          <FaRobot />
        </button>
      )}

      {/* Chat card */}
      <div className="card shadow" style={{ overflow:"hidden", borderRadius:16, display: mobileLike && !open ? "none" : "block" }}>
        <div
          className="card-header d-flex align-items-center justify-content-between"
          style={{ cursor: mobileLike ? "default" : "pointer", background:"#ffffff" }}
          onClick={()=> setOpen(o=> mobileLike ? o : !o)}  // on desktop header toggles; on mobile it doesn't
        >
          <div className="d-flex align-items-center gap-2">
            <FaRobot /> <strong>Hostel Assistant</strong>
          </div>
          <div className="d-flex align-items-center gap-2">
            {/* quick language/settings */}
            <button
              className="btn btn-sm btn-light"
              title="Language"
              onClick={(e)=>{ e.stopPropagation(); setShowLangPicker(v=>!v); }}
            >
              <FaCog />
            </button>
            {!mobileLike && (open ? <FaChevronDown /> : <FaChevronUp />)}
            {mobileLike && (
              <button className="btn btn-sm btn-outline-secondary" onClick={()=>setOpen(false)} aria-label="Close">
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Language picker only when open */}
        {open && showLangPicker && <LanguagePicker />}

        {/* Chat UI */}
        {open && (
          <>
            <div className="card-body" ref={boxRef} style={chatBodyStyle}>
              {log.map((m, i) => {
                const isUser = m.role === "user";
                const content = m.message;
                return (
                  <div key={i} className={`d-flex mb-3 ${isUser ? "justify-content-end" : "justify-content-start"}`}>
                    {!isUser && <div style={{ ...avatar, marginRight:8 }}><FaRobot size={14}/></div>}
                    <div style={isUser ? userBubble : assistantBubble}>
                      {typeof content === "string" ? (
                        <pre className="m-0" style={{ whiteSpace:"pre-wrap" }}>{content}</pre>
                      ) : content?.kind === "open-edit-link" ? (
                        <div>
                          <div className="mb-2">{content.label}</div>
                          <a href="#" onClick={(e)=>{ e.preventDefault(); onOpenEdit?.(content.tenantId, content.month, content.year); }}>
                            Open edit modal
                          </a>
                        </div>
                      ) : (
                        <pre className="m-0" style={{ whiteSpace:"pre-wrap" }}>{JSON.stringify(content,null,2)}</pre>
                      )}
                    </div>
                    {isUser && <div style={{ ...userAvatar, marginLeft:8 }}><FaUser size={12}/></div>}
                  </div>
                );
              })}
            </div>

            <div className="card-footer position-relative" style={{ background:"#fff" }}>
              <div className="input-group">
                <input
                  ref={inputRef}
                  className="form-control"
                  placeholder={strings.placeholder}
                  value={input}
                  onChange={(e)=>setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                <button className="btn btn-primary" onClick={()=>send()} title="Send"><FaPaperPlane/></button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={()=>{ setLog([{ role:"assistant", message: STR(lang||"en").greeting }]); setCurrentTenantName(null); setInput(""); setShowSug(false); }}
                  title="Clear"
                >
                  <FaTimes/>
                </button>
              </div>

              {/* Suggestions */}
              {showSug && suggestions.length>0 && (
                <div className="shadow"
                     style={{ position:"absolute", left:12, right:84, bottom:58, background:"#fff", borderRadius:10, border:"1px solid #e6e6e6", maxHeight:220, overflowY:"auto", zIndex:10 }}>
                  {suggestions.map((sug, idx)=>(
                    <div key={idx}
                         onMouseDown={(e)=>{ e.preventDefault(); insertSuggestion(sug); }}
                         onMouseEnter={()=>setActiveSug(idx)}
                         style={{ padding:"10px 12px", cursor:"pointer", background: idx===activeSug ? "#eef5ff" : "white" }}>
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
