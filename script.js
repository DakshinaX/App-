const STORAGE_KEY = "sleep-tracker-entries";
const tips = {
  Great: "Great sleep often follows a cool, dark room and a steady routine.",
  Good: "Good progress—try keeping your bedtime within the same 30-minute window.",
  Okay: "An earlier wind-down routine can help turn okay sleep into great sleep.",
  Poor: "Poor sleep happens—reduce caffeine late in the day and dim screens before bed.",
};

const form = document.getElementById("sleep-form");
const dateInput = document.getElementById("sleep-date");
const bedtimeInput = document.getElementById("bedtime");
const wakeTimeInput = document.getElementById("wake-time");
const qualityInput = document.getElementById("sleep-quality");
const notesInput = document.getElementById("sleep-notes");
const entriesList = document.getElementById("entries-list");
const emptyState = document.getElementById("empty-state");
const avgSleep = document.getElementById("avg-sleep");
const bestStreak = document.getElementById("best-streak");
const lastNight = document.getElementById("last-night");
const sleepTip = document.getElementById("sleep-tip");
const clearEntriesButton = document.getElementById("clear-entries");
const template = document.getElementById("entry-template");

const formatHours = (hours) => `${hours.toFixed(1)} hrs`;

const getEntries = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveEntries = (entries) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const calculateDuration = (date, bedtime, wakeTime) => {
  const bedtimeDate = new Date(`${date}T${bedtime}`);
  let wakeDate = new Date(`${date}T${wakeTime}`);

  if (wakeDate <= bedtimeDate) {
    wakeDate.setDate(wakeDate.getDate() + 1);
  }

  return (wakeDate - bedtimeDate) / (1000 * 60 * 60);
};

const getBestStreak = (entries) => {
  const sorted = [...entries]
    .map((entry) => new Date(entry.date))
    .sort((a, b) => a - b);

  let longest = 0;
  let current = 0;

  sorted.forEach((date, index) => {
    if (index === 0) {
      current = 1;
      longest = 1;
      return;
    }

    const previous = sorted[index - 1];
    const diffDays = (date - previous) / (1000 * 60 * 60 * 24);
    current = diffDays === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  });

  return longest;
};

const renderStats = (entries) => {
  if (!entries.length) {
    avgSleep.textContent = "0 hrs";
    bestStreak.textContent = "0 nights";
    lastNight.textContent = "—";
    sleepTip.textContent =
      "Consistency matters: try going to bed and waking up at the same time each day.";
    return;
  }

  const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const latest = entries[0];

  avgSleep.textContent = formatHours(totalHours / entries.length);
  bestStreak.textContent = `${getBestStreak(entries)} nights`;
  lastNight.textContent = formatHours(latest.duration);
  sleepTip.textContent = tips[latest.quality] ?? tips.Good;
};

const renderEntries = () => {
  const entries = getEntries().sort((a, b) => new Date(b.date) - new Date(a.date));
  entriesList.innerHTML = "";
  emptyState.classList.toggle("hidden", entries.length > 0);

  entries.forEach((entry) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".entry-date").textContent = new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    node.querySelector(
      ".entry-duration"
    ).textContent = `${formatHours(entry.duration)} • ${entry.bedtime} → ${entry.wakeTime}`;
    node.querySelector(".entry-quality").textContent = entry.quality;
    node.querySelector(".entry-notes").textContent = entry.notes || "No notes added.";
    entriesList.appendChild(node);
  });

  renderStats(entries);
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = dateInput.value;
  const bedtime = bedtimeInput.value;
  const wakeTime = wakeTimeInput.value;
  const quality = qualityInput.value;
  const notes = notesInput.value.trim();

  const duration = calculateDuration(date, bedtime, wakeTime);
  const entries = getEntries();

  entries.push({ date, bedtime, wakeTime, quality, notes, duration });
  saveEntries(entries);
  renderEntries();
  form.reset();
  dateInput.valueAsDate = new Date();
});

clearEntriesButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderEntries();
});

dateInput.valueAsDate = new Date();
renderEntries();
