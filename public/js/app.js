(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const numberFormat = new Intl.NumberFormat("en-US");
  let familyStats = null;
  let counterBase = 0;
  let counterStartedAt = 0;

  const iconMap = {
    user: "#icon-user",
    heart: "#icon-heart",
    sun: "#icon-sun",
    users: "#icon-users",
    clock: "#icon-clock",
    star: "#icon-star",
    sparkle: "#icon-sparkle",
    cake: "#icon-cake"
  };

  function icon(name) {
    const href = iconMap[name] || "#icon-star";
    return `<svg class="icon" aria-hidden="true"><use href="${href}"/></svg>`;
  }

  function formatAge(parts) {
    const y = `${numberFormat.format(parts.years)} <small>${parts.years === 1 ? "year" : "years"}</small>`;
    const m = `${numberFormat.format(parts.months)} <small>${parts.months === 1 ? "month" : "months"}</small>`;
    const d = `${numberFormat.format(parts.days)} <small>${parts.days === 1 ? "day" : "days"}</small>`;
    return `${y} ${m} ${d}`;
  }

  function renderMembers(members) {
    $("#memberGrid").innerHTML = members.map((member, index) => `
      <article class="member-card ${member.accent}">
        <div class="member-card-top">
          <span class="member-symbol">${icon(member.icon)}</span>
          <span class="member-number">0${index + 1}</span>
        </div>
        <p class="member-role">${member.role}</p>
        <h3>${member.name}</h3>
        <div class="member-age">${formatAge(member.age)}</div>
        <div class="member-divider"></div>
        <div class="member-meta"><span>AGE</span><strong>Updated daily</strong></div>
      </article>
    `).join("");
  }

  function renderTimeline() {
    const events = [
      { title: "A new family chapter", description: "The beginning of a lifelong journey together", icon: "heart" },
      { title: "Our family grew", description: "A new little blessing joined the family", icon: "sun" },
      { title: "A lifetime of memories", description: "Every day brings another reason to be grateful", icon: "star" }
    ];

    $("#timelineList").innerHTML = events.map((event) => `
      <article class="timeline-item">
        <div class="timeline-marker">${icon(event.icon)}</div>
        <div class="timeline-content">
          <h3>${event.title}</h3>
          <p>${event.description}</p>
        </div>
      </article>
    `).join("");
  }

  function renderCounters() {
    if (!familyStats) return;
    $("#togetherDays").textContent = numberFormat.format(familyStats.daysTogether);
    $("#liveDays").textContent = numberFormat.format(familyStats.daysTogether);
    $("#anniversaryDays").textContent = numberFormat.format(familyStats.anniversaryDays);
    $("#memberCount").textContent = familyStats.members.length;

    const isToday = familyStats.anniversaryDays === 0;
    const unit = $("#anniversaryUnit");
    if (unit) unit.textContent = isToday ? "Today!" : (familyStats.anniversaryDays === 1 ? "day to go" : "days to go");
    const annDate = $("#anniversaryDate");
    if (annDate) {
      annDate.textContent = familyStats.anniversaryLabel
        ? `Next anniversary ${familyStats.anniversaryLabel}`
        : "A milestone worth celebrating";
    }

    if (familyStats.yearsTogether) {
      $("#journeyYears").textContent = `We have been together for ${familyStats.yearsTogether} beautiful ${familyStats.yearsTogether === 1 ? "year" : "years"} — and counting.`;
      $("#journeyLabel").textContent = `${numberFormat.format(familyStats.daysTogether)} days together`;
    } else {
      $("#journeyLabel").textContent = `${numberFormat.format(familyStats.daysTogether)} days together`;
    }

    const elapsed = counterBase + Math.floor((Date.now() - counterStartedAt) / 1000);
    $("#liveHours").textContent = String(Math.floor((elapsed / 3600) % 24)).padStart(2, "0");
    $("#liveMinutes").textContent = String(Math.floor((elapsed / 60) % 60)).padStart(2, "0");
    $("#liveSeconds").textContent = String(Math.floor((elapsed % 60))).padStart(2, "0");
  }

  async function loadFamilyStats() {
    const response = await fetch("/api/family-stats", {
      method: "GET",
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Unable to load family information (${response.status}).`);
    familyStats = await response.json();
    counterBase = familyStats.secondsTogether;
    counterStartedAt = Date.now();
    renderMembers(familyStats.members);
    renderCounters();
  }

  function setupTheme() {
    const button = $("#themeToggle");
    if (!button) return;
    const savedTheme = localStorage.getItem("mondol-theme");
    if (savedTheme === "light") document.body.classList.add("light-theme");

    button.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      const theme = document.body.classList.contains("light-theme") ? "light" : "dark";
      localStorage.setItem("mondol-theme", theme);
    });
  }

  function toBanglaNum(n) {
    const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return String(n).split("").map((c) => (c >= "0" && c <= "9" ? map[Number(c)] : c)).join("");
  }

  function banglaDateString(date) {
    // Gregorian -> Bangla (Bongabdo) calendar
    const gy = date.getFullYear();
    const gm = date.getMonth() + 1;
    const gd = date.getDate();
    // Bangla new year: 14 April (15 April in leap year)
    const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
    const newYearDay = isLeap ? 15 : 14;
    let banglaYear;
    if (gm > 4 || (gm === 4 && gd >= newYearDay)) banglaYear = gy - 593;
    else banglaYear = gy - 594;

    const months = [
      { name: "বৈশাখ",    days: 31, start: [4, newYearDay] },
      { name: "জ্যৈষ্ঠ",    days: 31, start: [5, 15] },
      { name: "আষাঢ়",     days: 31, start: [6, 15] },
      { name: "শ্রাবণ",    days: 31, start: [7, 16] },
      { name: "ভাদ্র",     days: 31, start: [8, 16] },
      { name: "আশ্বিন",    days: 30, start: [9, 16] },
      { name: "কার্তিক",   days: 30, start: [10, 17] },
      { name: "অগ্রহায়ণ", days: 30, start: [11, 16] },
      { name: "পৌষ",      days: 30, start: [12, 16] },
      { name: "মাঘ",      days: 30, start: [1, 15] },
      { name: "ফাল্গুন",   days: 30, start: [2, 14] },
      { name: "চৈত্র",     days: 30, start: [3, 15] }
    ];
    // Fixed starts for year after leap change (simple approach: compute days since Boishakh 1)
    let boishakh1;
    if (gm > 4 || (gm === 4 && gd >= newYearDay)) boishakh1 = new Date(gy, 3, newYearDay);
    else boishakh1 = new Date(gy - 1, 3, newYearDay);
    const diffDays = Math.floor((date - boishakh1) / 86400000);
    // Month lengths (Falgun 29 in leap for Chaitra 31 loop)
    const lengths = [31,31,31,31,31,30,30,30,30,30,30,30];
    let remaining = diffDays;
    let idx = 0;
    while (idx < 12 && remaining >= lengths[idx]) { remaining -= lengths[idx]; idx++; }
    const mName = months[idx] ? months[idx].name : months[0].name;
    const mDay = remaining + 1;
    return `${toBanglaNum(mDay)} ${mName}, ${toBanglaNum(banglaYear)} বঙ্গাব্দ`;
  }

  async function init() {
    renderTimeline();
    setupTheme();
    $("#year").textContent = new Date().getFullYear();
    const el = $("#banglaDate");
    if (el) el.textContent = banglaDateString(new Date());

    try {
      await loadFamilyStats();
      window.setInterval(renderCounters, 1000);
    } catch (error) {
      console.error(error);
      $("#memberGrid").innerHTML = '<p class="data-error">Family information is temporarily unavailable. Please try again later.</p>';
    }
  }

  init();
})();
