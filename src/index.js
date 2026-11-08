const FAMILY_MEMBERS = [
  { id: "senior", name: "Sayf", role: "The first chapter", icon: "user", accent: "teal" },
  { id: "mother", name: "Shanta", role: "The heart of our home", icon: "heart", accent: "coral" },
  { id: "child", name: "Nur", role: "Our little sunshine", icon: "sun", accent: "gold" }
];

const TIME_ZONE = "Asia/Dhaka";
const DAY_MS = 86_400_000;

function dhakaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function parseISODate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`${label} is not a valid calendar date.`);
  }
  return { year, month, day, timestamp: date.getTime() };
}

function ageParts(birth, today) {
  let years = today.year - birth.year;
  let months = today.month - birth.month;
  let days = today.day - birth.day;

  if (days < 0) {
    months -= 1;
    const previousMonthDays = new Date(Date.UTC(today.year, today.month - 1, 0)).getUTCDate();
    days += previousMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

function daysBetween(start, end) {
  return Math.floor((end.timestamp - start.timestamp) / DAY_MS);
}

function nextAnnualOccurrence(date, today) {
  // Feb 29 birthdays anniversaries -> observe Feb 28 in non-leap years
  const dayForYear = (year) => {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (date.month === 2 && date.day === 29 && !isLeap) return 28;
    return date.day;
  };
  let year = today.year;
  let candidate = Date.UTC(year, date.month - 1, dayForYear(year));
  const todayTimestamp = Date.UTC(today.year, today.month - 1, today.day);
  if (candidate < todayTimestamp) {
    year += 1;
    candidate = Date.UTC(year, date.month - 1, dayForYear(year));
  }
  return { timestamp: candidate, year };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

async function familyStats(env) {
  const today = dhakaToday();
  const todayDate = { timestamp: Date.UTC(today.year, today.month - 1, today.day) };
  const birthDates = {
    senior: parseISODate(env.SENIOR_DOB, "SENIOR_DOB"),
    mother: parseISODate(env.MOTHER_DOB, "MOTHER_DOB"),
    child: parseISODate(env.CHILD_DOB, "CHILD_DOB")
  };
  const weddingDate = parseISODate(env.WEDDING_DATE, "WEDDING_DATE");
  const members = FAMILY_MEMBERS.map((member) => ({
    ...member,
    age: ageParts(birthDates[member.id], today)
  }));

  // Dhaka midnight is UTC midnight minus six hours.
  const weddingTimestamp = weddingDate.timestamp - (6 * 60 * 60 * 1000);
  const secondsTogether = Math.max(0, Math.floor((Date.now() - weddingTimestamp) / 1000));
  const weddingAsDate = { timestamp: weddingDate.timestamp };
  const anniversary = nextAnnualOccurrence(weddingDate, today);
  const daysTogether = Math.max(0, daysBetween(weddingAsDate, todayDate));
  const anniversaryDays = Math.max(0, daysBetween(todayDate, anniversary));
  // Anniversary number without exposing raw wedding date: next occurrence year - original year
  const yearsTogether = anniversary.year - weddingDate.year;

  return {
    familyName: "Mondol Family",
    members,
    daysTogether,
    anniversaryDays,
    anniversaryLabel: anniversaryDays === 0 ? "Today!" : `in ${anniversaryDays} ${anniversaryDays === 1 ? "day" : "days"}`,
    yearsTogether,
    secondsTogether,
    generatedAt: Date.now()
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/family-stats") {
      if (request.method !== "GET") {
        return json({ error: "Method not allowed." }, 405);
      }
      try {
        return json(await familyStats(env));
      } catch (error) {
        console.error("Family stats configuration error:", error.message);
        return json({ error: "Family data is not configured. Check Worker secrets or .dev.vars." }, 503);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
