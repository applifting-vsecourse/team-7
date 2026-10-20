// Project dashboard: reads issues from the public GitHub API and renders
// progress charts. Configuration lives in config.js.
(() => {
  const cfg = window.DASHBOARD_CONFIG;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const CACHE_KEY = `project-dashboard:${cfg.repo}`;
  const UNIT_KEY = "project-dashboard:unit";
  const CACHE_TTL_MS = 10 * 60 * 1000;
  const PRIORITIES = [
    { key: "mvp", label: "MVP" },
    { key: "should", label: "Should" },
    { key: "nice to have", label: "Nice to have" },
    { key: "none", label: "Bez priority" },
  ];

  const $ = (id) => document.getElementById(id);
  const charts = {};
  let model = null;
  let loadedAt = null;
  let unit = storageGet(UNIT_KEY) === "points" ? "points" : "issues";

  // ---------- helpers ----------

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (private window, blocked site data) — ignore.
    }
  }

  function parseDay(value) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function dayKey(date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${m}-${d}`;
  }

  function daysBetween(a, b) {
    return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
  }

  const numberFormat = new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: 1,
  });
  const fmt = (n) => numberFormat.format(n);
  const fmtDate = (date, withYear = false) =>
    `${date.getDate()}. ${date.getMonth() + 1}.` +
    (withYear ? ` ${date.getFullYear()}` : "");
  // "Sprint 5" -> "sprintu 5" for "do konce sprintu 5".
  const genitive = (name) => name.replace(/^Sprint\b/, "sprintu");
  const sprintWord = (n) =>
    n === 1 ? "sprint" : n >= 2 && n <= 4 ? "sprinty" : "sprintů";
  const fmtTime = (date) =>
    date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  // Weight of an issue in the selected unit. Unestimated issues weigh 0 SP.
  const weight = (item) => (unit === "points" ? (item.points ?? 0) : 1);
  const sum = (items) => items.reduce((acc, item) => acc + weight(item), 0);
  const unitLabel = () => (unit === "points" ? "SP" : "issues");

  // ---------- data ----------

  async function fetchAllIssues() {
    const all = [];
    for (let page = 1; ; page++) {
      const url = `https://api.github.com/repos/${cfg.repo}/issues?state=all&per_page=100&page=${page}`;
      const res = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) {
        if (res.headers.get("x-ratelimit-remaining") === "0") {
          const reset = new Date(
            Number(res.headers.get("x-ratelimit-reset")) * 1000,
          );
          throw new Error(
            `Vyčerpaný limit GitHub API (60 požadavků za hodinu). Zkus to znovu po ${fmtTime(reset)}.`,
          );
        }
        throw new Error(`GitHub API vrátilo chybu ${res.status}.`);
      }
      const batch = await res.json();
      all.push(...batch);
      if (batch.length < 100) return all;
    }
  }

  async function loadIssues({ useCache }) {
    if (useCache) {
      try {
        const cached = JSON.parse(storageGet(CACHE_KEY) ?? "null");
        if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
          return { raw: cached.raw, at: new Date(cached.at) };
        }
      } catch {
        // Corrupt cache — fall through to a fresh fetch.
      }
    }
    const raw = await fetchAllIssues();
    const at = new Date();
    storageSet(CACHE_KEY, JSON.stringify({ at: at.getTime(), raw }));
    return { raw, at };
  }

  function buildModel(raw) {
    const excluded = new Set(cfg.excludeLabels);
    const bundleOf = new Map();
    for (const bundle of cfg.bundles) {
      for (const number of bundle.issues) bundleOf.set(number, bundle);
    }

    const items = raw
      .filter((issue) => !issue.pull_request)
      .map((issue) => {
        const labels = issue.labels.map((label) => label.name);
        if (labels.some((label) => excluded.has(label))) return null;
        if (issue.state === "closed" && issue.state_reason === "not_planned") {
          return null;
        }

        const priority =
          PRIORITIES.find((p) => labels.includes(p.key))?.key ?? "none";
        const epicLabel = labels.find((label) => label.startsWith("epic "));
        const epic = epicLabel
          ? epicLabel[5].toUpperCase() + epicLabel.slice(6)
          : "Bez epiku";

        let points = null;
        let pointsLabel = "–";
        const bundle = bundleOf.get(issue.number);
        if (bundle) {
          points = bundle.points / bundle.issues.length;
          pointsLabel = `${fmt(points)}`;
        } else if (Object.hasOwn(cfg.points, issue.number)) {
          const value = cfg.points[issue.number];
          points = typeof value === "number" ? value : null;
          pointsLabel = points === null ? "?" : fmt(points);
        }

        return {
          number: issue.number,
          title: issue.title.replace(/^\[F-\d+\]\s*/, ""),
          feature: issue.title.match(/^\[(F-\d+)\]/)?.[1] ?? null,
          url: issue.html_url,
          priority,
          epic,
          bundle: bundle?.name ?? null,
          done: issue.state === "closed",
          created: new Date(issue.created_at),
          closed: issue.closed_at ? new Date(issue.closed_at) : null,
          points,
          pointsLabel,
        };
      })
      .filter(Boolean);

    const mergedPrs = raw
      .filter((issue) => issue.pull_request?.merged_at)
      .map((issue) => new Date(issue.pull_request.merged_at));

    return { items, mergedPrs };
  }

  // ---------- timeline ----------

  function timeline() {
    const sprints = cfg.sprints.map((sprint) => ({
      ...sprint,
      startDate: parseDay(sprint.start),
      endDate: parseDay(sprint.end),
    }));
    const deadline = parseDay(cfg.deadline);
    const earliestCreated = model.items.reduce(
      (min, item) => (item.created < min ? item.created : min),
      sprints[0].startDate,
    );
    const start = startOfDay(
      earliestCreated < sprints[0].startDate
        ? earliestCreated
        : sprints[0].startDate,
    );
    const today = startOfDay(new Date());

    const days = [];
    // Step by calendar days, not DAY_MS — a DST switch makes a day 23/25 h.
    for (
      let d = start;
      d <= deadline;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    ) {
      days.push(d);
    }

    const sprintAt = (date) =>
      sprints.find(
        (s) => startOfDay(date) >= s.startDate && startOfDay(date) <= s.endDate,
      ) ?? null;

    return { sprints, deadline, start, today, days, sprintAt };
  }

  // ---------- rendering ----------

  function render() {
    const tl = timeline();
    const { items } = model;
    const mvp = items.filter((item) => item.priority === "mvp");
    const done = items.filter((item) => item.done);
    const mvpDone = mvp.filter((item) => item.done);

    renderMeta();
    renderStats(tl, items, done, mvp, mvpDone);
    renderEstimateNote(items);
    renderBurnup(tl, items, mvp);
    renderPriority(items);
    renderVelocity(tl);
    renderEpics(items);
    renderTables(items);
  }

  function renderMeta() {
    $("meta").innerHTML =
      `<a href="https://github.com/${escapeHtml(cfg.repo)}/issues">${escapeHtml(cfg.repo)}</a>` +
      ` · data z ${fmtTime(loadedAt)}` +
      ` · deadline ${fmtDate(parseDay(cfg.deadline), true)}`;
  }

  function stat(value, label, progress) {
    const bar =
      progress === undefined
        ? ""
        : `<div class="bar" role="img" aria-label="${Math.round(progress * 100)} %"><span style="width:${Math.min(100, progress * 100)}%"></span></div>`;
    return `<div class="stat"><div class="value">${value}</div><div class="label">${label}</div>${bar}</div>`;
  }

  function ratio(part, whole) {
    return whole === 0 ? 0 : part / whole;
  }

  function renderStats(tl, items, done, mvp, mvpDone) {
    const u = unitLabel();
    const mvpTotal = sum(mvp);
    const mvpDoneSum = sum(mvpDone);
    const total = sum(items);
    const doneSum = sum(done);

    const daysLeft = Math.max(0, daysBetween(tl.today, tl.deadline));
    const current = tl.sprintAt(tl.today);
    const plannedLeft = tl.sprints.filter(
      (s) => !s.optional && s.endDate >= tl.today,
    ).length;
    const optionalLeft = tl.sprints.filter(
      (s) => s.optional && s.endDate >= tl.today,
    ).length;

    // Pace: what's been done per sprint so far vs. what MVP still needs.
    const sprintLength =
      tl.sprints.reduce(
        (acc, s) => acc + daysBetween(s.startDate, s.endDate) + 1,
        0,
      ) / tl.sprints.length;
    const elapsedDays = Math.max(1, daysBetween(tl.start, tl.today) + 1);
    // MVP only, so it compares like with like against `needed`.
    const pace = (mvpDoneSum / elapsedDays) * sprintLength;
    const mvpLeft = mvpTotal - mvpDoneSum;
    const needed = plannedLeft > 0 ? mvpLeft / plannedLeft : mvpLeft;

    // When MVP gets done if the average daily MVP pace holds.
    const lastPlanned = [...tl.sprints].reverse().find((s) => !s.optional);
    const dailyRate = mvpDoneSum / elapsedDays;
    let finishValue = "—";
    let finishLabel = "MVP odhadem hotové · zatím není z čeho odhadnout";
    if (mvpLeft <= 0) {
      finishValue = "Hotovo";
      finishLabel = "MVP je kompletní";
    } else if (dailyRate > 0) {
      const finish = new Date(
        tl.today.getFullYear(),
        tl.today.getMonth(),
        tl.today.getDate() + Math.ceil(mvpLeft / dailyRate),
      );
      const late = daysBetween(lastPlanned.endDate, finish);
      finishValue = fmtDate(finish, true);
      finishLabel =
        `MVP odhadem hotové při dosavadním tempu · ` +
        (late <= 0
          ? `${-late} d před koncem ${genitive(lastPlanned.name)}`
          : finish <= tl.deadline
            ? `${late} d po konci ${genitive(lastPlanned.name)}, ještě před deadlinem`
            : `až po deadlinu`);
    }

    const sprintText = current ? `${escapeHtml(current.name)}` : "Mimo sprint";
    const sprintLabel = current
      ? `končí ${fmtDate(current.endDate)} (za ${daysBetween(tl.today, current.endDate)} d)${current.optional ? " · zkouškové" : ""}`
      : "dnes neběží žádný sprint";

    $("stats").innerHTML = [
      stat(
        `${fmt(mvpDoneSum)} / ${fmt(mvpTotal)}`,
        `MVP hotovo (${u}) · ${Math.round(ratio(mvpDoneSum, mvpTotal) * 100)} %`,
        ratio(mvpDoneSum, mvpTotal),
      ),
      stat(
        `${fmt(doneSum)} / ${fmt(total)}`,
        `Celkem hotovo (${u}) · ${Math.round(ratio(doneSum, total) * 100)} %`,
        ratio(doneSum, total),
      ),
      stat(
        `${daysLeft} dní`,
        `do deadlinu · zbývá ${plannedLeft} ${sprintWord(plannedLeft)}${optionalLeft ? ` + ${optionalLeft} ve zkouškovém` : ""}`,
      ),
      stat(sprintText, sprintLabel),
      stat(
        `${fmt(needed)} / sprint`,
        `potřebné tempo na dokončení MVP v plánovaných sprintech · zatím ${fmt(pace)} / sprint`,
      ),
      stat(finishValue, finishLabel),
    ].join("");
  }

  function renderEstimateNote(items) {
    const note = $("estimate-note");
    if (unit !== "points") {
      note.hidden = true;
      return;
    }
    const missing = items.filter((item) => item.points === null);
    note.hidden = missing.length === 0;
    note.textContent =
      `${missing.length} z ${items.length} issues nemá story pointy, takže se v SP nepočítají. ` +
      `Doplňte je v tools/dashboard/config.js.`;
  }

  function baseOptions() {
    const muted = cssVar("--muted");
    const border = cssVar("--border");
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      color: muted,
      font: { family: "Inter, ui-sans-serif, system-ui, sans-serif" },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: muted,
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
          },
        },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: { ticks: { color: muted }, grid: { color: border } },
        y: {
          ticks: { color: muted },
          grid: { color: border },
          beginAtZero: true,
        },
      },
    };
  }

  function draw(id, config) {
    charts[id]?.destroy();
    Chart.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";
    charts[id] = new Chart($(id), config);
  }

  // Sprint bands, today line and deadline line behind the burnup chart.
  function timelinePlugin(tl) {
    return {
      id: "timeline",
      beforeDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const x = scales.x;
        const step = x.getPixelForValue(1) - x.getPixelForValue(0);
        const indexOf = (date) => daysBetween(tl.start, date);
        const band = cssVar("--sprint-band");
        const muted = cssVar("--muted");
        const border = cssVar("--border");

        ctx.save();
        ctx.font = "12px Inter, ui-sans-serif, system-ui, sans-serif";
        ctx.textBaseline = "top";
        tl.sprints.forEach((sprint, i) => {
          const left = x.getPixelForValue(indexOf(sprint.startDate)) - step / 2;
          const right = x.getPixelForValue(indexOf(sprint.endDate)) + step / 2;
          if (i % 2 === 0 || sprint.optional) {
            ctx.fillStyle = band;
            ctx.fillRect(left, chartArea.top, right - left, chartArea.height);
          }
          ctx.strokeStyle = border;
          ctx.beginPath();
          ctx.moveTo(left, chartArea.top);
          ctx.lineTo(left, chartArea.bottom);
          ctx.stroke();
          ctx.fillStyle = muted;
          const label =
            sprint.name.replace("Sprint ", "S") + (sprint.optional ? "*" : "");
          ctx.fillText(label, left + 4, chartArea.top + 4);
        });

        const vline = (date, color, label) => {
          const px = x.getPixelForValue(indexOf(date));
          ctx.strokeStyle = color;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(px, chartArea.top);
          ctx.lineTo(px, chartArea.bottom);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = color;
          ctx.textAlign = "right";
          ctx.fillText(label, px - 4, chartArea.top + 20);
          ctx.textAlign = "left";
        };
        if (tl.today <= tl.deadline) vline(tl.today, cssVar("--fg"), "dnes");
        vline(tl.deadline, cssVar("--danger"), "deadline");
        ctx.restore();
      },
    };
  }

  function renderBurnup(tl, items, mvp) {
    const endOfDay = (d) => new Date(d.getTime() + DAY_MS - 1);
    const doneBy = (list, d) =>
      sum(list.filter((item) => item.closed && item.closed <= endOfDay(d)));
    const scopeBy = (list, d) =>
      sum(list.filter((item) => item.created <= endOfDay(d)));

    const todayIndex = daysBetween(tl.start, tl.today);
    const doneSeries = tl.days.map((d, i) =>
      i <= todayIndex ? doneBy(items, d) : null,
    );
    const mvpDoneSeries = tl.days.map((d, i) =>
      i <= todayIndex ? doneBy(mvp, d) : null,
    );
    const scopeSeries = tl.days.map((d, i) =>
      scopeBy(items, i <= todayIndex ? d : tl.today),
    );
    const mvpScopeSeries = tl.days.map((d, i) =>
      scopeBy(mvp, i <= todayIndex ? d : tl.today),
    );

    // Forecast: continue the average daily MVP pace from today to the deadline.
    const doneToday = doneBy(mvp, tl.today);
    const rate = doneToday / Math.max(1, todayIndex + 1);
    const forecast = tl.days.map((d, i) =>
      i >= todayIndex && todayIndex >= 0
        ? Math.min(sum(mvp), doneToday + rate * (i - todayIndex))
        : null,
    );

    // Plan: MVP finished by the end of the last planned (non-optional) sprint.
    const lastPlanned = [...tl.sprints].reverse().find((s) => !s.optional);
    const planEnd = daysBetween(tl.start, lastPlanned.endDate);
    const mvpScope = sum(mvp);
    const plan = tl.days.map((d, i) =>
      i <= planEnd ? (mvpScope * i) / planEnd : null,
    );

    const options = baseOptions();
    options.scales.x.ticks = {
      color: cssVar("--muted"),
      autoSkip: true,
      maxTicksLimit: 14,
      maxRotation: 0,
      callback: (value) => fmtDate(tl.days[value]),
    };
    options.scales.x.grid = { display: false };
    options.scales.y.title = {
      display: true,
      text: unitLabel(),
      color: cssVar("--muted"),
    };
    options.interaction = { mode: "index", intersect: false };
    options.plugins.tooltip.filter = (ctx) => ctx.parsed.y !== null;
    options.plugins.tooltip.callbacks = {
      title: (ctx) => fmtDate(tl.days[ctx[0].dataIndex], true),
      label: (ctx) => `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`,
    };

    const line = (label, data, color, extra = {}) => ({
      label,
      data,
      borderColor: color,
      backgroundColor: color,
      pointRadius: 0,
      borderWidth: 2,
      tension: 0,
      spanGaps: false,
      ...extra,
    });

    draw("burnup", {
      type: "line",
      data: {
        labels: tl.days.map(dayKey),
        datasets: [
          // MVP is what the deadline is about; totals (incl. nice to have)
          // start hidden and can be shown from the legend.
          line("Hotovo MVP", mvpDoneSeries, cssVar("--done"), {
            fill: "origin",
            backgroundColor: cssVar("--done") + "26",
            stepped: true,
          }),
          line("Rozsah MVP", mvpScopeSeries, cssVar("--mvp"), {
            borderWidth: 1.5,
          }),
          line(
            `Plán MVP (do konce ${genitive(lastPlanned.name)})`,
            plan,
            cssVar("--scope"),
            {
              borderWidth: 1,
              borderDash: [6, 4],
            },
          ),
          line("Odhad MVP podle tempa", forecast, cssVar("--forecast"), {
            borderDash: [6, 4],
          }),
          line("Hotovo celkem", doneSeries, cssVar("--done"), {
            borderWidth: 1.5,
            borderDash: [2, 3],
            stepped: true,
            hidden: true,
          }),
          line("Rozsah celkem", scopeSeries, cssVar("--scope"), {
            borderWidth: 1.5,
            hidden: true,
          }),
        ],
      },
      options,
      plugins: [timelinePlugin(tl)],
    });
  }

  function stackedBars(id, labels, doneData, todoData, horizontal) {
    const options = baseOptions();
    options.indexAxis = horizontal ? "y" : "x";
    options.scales.x.stacked = true;
    options.scales.y.stacked = true;
    const valueAxis = horizontal ? options.scales.x : options.scales.y;
    valueAxis.title = {
      display: true,
      text: unitLabel(),
      color: cssVar("--muted"),
    };
    (horizontal ? options.scales.y : options.scales.x).grid = {
      display: false,
    };
    options.plugins.tooltip.callbacks = {
      footer: (ctx) => {
        const i = ctx[0].dataIndex;
        const total = doneData[i] + todoData[i];
        return `Hotovo ${Math.round(ratio(doneData[i], total) * 100)} %`;
      },
    };

    draw(id, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Hotovo",
            data: doneData,
            backgroundColor: cssVar("--done"),
            borderRadius: 4,
            maxBarThickness: 28,
          },
          {
            label: "Zbývá",
            data: todoData,
            backgroundColor: cssVar("--todo"),
            borderRadius: 4,
            maxBarThickness: 28,
          },
        ],
      },
      options,
    });
  }

  function renderPriority(items) {
    const groups = PRIORITIES.map((p) => ({
      label: p.label,
      items: items.filter((item) => item.priority === p.key),
    })).filter((g) => g.items.length > 0);
    stackedBars(
      "priority",
      groups.map((g) => g.label),
      groups.map((g) => sum(g.items.filter((item) => item.done))),
      groups.map((g) => sum(g.items.filter((item) => !item.done))),
      true,
    );
  }

  function renderEpics(items) {
    const byEpic = new Map();
    for (const item of items) {
      if (!byEpic.has(item.epic)) byEpic.set(item.epic, []);
      byEpic.get(item.epic).push(item);
    }
    const groups = [...byEpic.entries()]
      .map(([label, list]) => ({ label, items: list }))
      .sort((a, b) => b.items.length - a.items.length);
    $("epic-wrap").style.height = `${groups.length * 38 + 70}px`;
    stackedBars(
      "epic",
      groups.map((g) => g.label),
      groups.map((g) => sum(g.items.filter((item) => item.done))),
      groups.map((g) => sum(g.items.filter((item) => !item.done))),
      true,
    );
  }

  function renderVelocity(tl) {
    // Work closed before the first sprint counts towards Sprint 1;
    // work closed between sprints (e.g. holidays) towards the previous one.
    const bucketOf = (date) => {
      const day = startOfDay(date);
      let index = 0;
      tl.sprints.forEach((s, i) => {
        if (day >= s.startDate) index = i;
      });
      return index;
    };
    const started = tl.sprints.filter((s) => s.startDate <= tl.today);
    const shown = started.length > 0 ? started : tl.sprints.slice(0, 1);
    const closed = shown.map(() => 0);
    const prs = shown.map(() => 0);
    for (const item of model.items) {
      if (!item.closed) continue;
      const i = bucketOf(item.closed);
      if (i < closed.length) closed[i] += weight(item);
    }
    for (const merged of model.mergedPrs) {
      const i = bucketOf(merged);
      if (i < prs.length) prs[i] += 1;
    }

    const options = baseOptions();
    options.scales.x.grid = { display: false };
    draw("velocity", {
      type: "bar",
      data: {
        labels: shown.map((s) => s.name + (s.optional ? "*" : "")),
        datasets: [
          {
            label: `Uzavřená issues (${unitLabel()})`,
            data: closed,
            backgroundColor: cssVar("--done"),
            borderRadius: 4,
            maxBarThickness: 36,
          },
          {
            label: "Mergnuté PR",
            data: prs,
            backgroundColor: cssVar("--scope"),
            borderRadius: 4,
            maxBarThickness: 36,
          },
        ],
      },
      options,
    });
  }

  function priorityPill(key) {
    const p = PRIORITIES.find((x) => x.key === key);
    return `<span class="pill ${key === "mvp" ? "mvp" : ""}">${p.label}</span>`;
  }

  function issueCell(item) {
    const feature = item.feature
      ? `<span class="muted">${item.feature}</span> `
      : "";
    const bundle = item.bundle
      ? `<div class="muted small">Balíček: ${escapeHtml(item.bundle)}</div>`
      : "";
    return `<a href="${escapeHtml(item.url)}">#${item.number}</a> ${feature}${escapeHtml(item.title)}${bundle}`;
  }

  function renderTables(items) {
    const order = (key) => PRIORITIES.findIndex((p) => p.key === key);
    const remaining = items
      .filter((item) => !item.done)
      .sort(
        (a, b) => order(a.priority) - order(b.priority) || a.number - b.number,
      );
    const done = items
      .filter((item) => item.done)
      .sort((a, b) => b.closed - a.closed);

    const mvpLeft = remaining.filter((item) => item.priority === "mvp");
    $("remaining-summary").textContent =
      `${remaining.length} otevřených issues, z toho ${mvpLeft.length} MVP` +
      (unit === "points" ? ` (${fmt(sum(mvpLeft))} SP MVP).` : ".");

    $("remaining").innerHTML =
      remaining
        .map(
          (item) =>
            `<tr><td>${issueCell(item)}</td><td>${priorityPill(item.priority)}</td><td>${escapeHtml(item.epic)}</td><td class="num">${item.pointsLabel}</td></tr>`,
        )
        .join("") ||
      `<tr><td colspan="4" class="muted">Všechno je hotovo.</td></tr>`;

    $("done-summary").textContent = `Hotovo (${done.length})`;
    $("done").innerHTML =
      done
        .map(
          (item) =>
            `<tr><td>${issueCell(item)}</td><td>${priorityPill(item.priority)}</td><td>${fmtDate(item.closed, true)}</td><td class="num">${item.pointsLabel}</td></tr>`,
        )
        .join("") ||
      `<tr><td colspan="4" class="muted">Zatím není uzavřené žádné issue.</td></tr>`;
  }

  // ---------- states & wiring ----------

  function showState(message, isError) {
    const state = $("state");
    state.hidden = false;
    state.className = isError ? "state error" : "state";
    state.innerHTML = escapeHtml(message);
    if (isError) {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "retry";
      retry.textContent = "Zkusit znovu";
      retry.addEventListener("click", () => load({ useCache: false }));
      state.append(document.createElement("br"), retry);
    }
  }

  async function load({ useCache }) {
    if (!model) showState("Načítám issues z GitHubu…", false);
    try {
      const { raw, at } = await loadIssues({ useCache });
      model = buildModel(raw);
      loadedAt = at;
      $("state").hidden = true;
      $("content").hidden = false;
      render();
    } catch (error) {
      if (model) return; // Keep showing the last good data.
      $("content").hidden = true;
      $("meta").textContent = cfg.repo;
      showState(
        error instanceof Error ? error.message : "Načtení se nepovedlo.",
        true,
      );
    }
  }

  function setUnit(next) {
    unit = next;
    storageSet(UNIT_KEY, next);
    for (const button of document.querySelectorAll("[data-unit]")) {
      button.setAttribute("aria-pressed", String(button.dataset.unit === unit));
    }
    if (model) render();
  }

  for (const button of document.querySelectorAll("[data-unit]")) {
    button.addEventListener("click", () => setUnit(button.dataset.unit));
  }
  setUnit(unit);

  // Refresh when the tab regains focus and the data is stale.
  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      loadedAt &&
      Date.now() - loadedAt.getTime() > CACHE_TTL_MS
    ) {
      load({ useCache: true });
    }
  });
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => model && render());

  load({ useCache: true });
})();
