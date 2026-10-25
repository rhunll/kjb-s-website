(() => {
  "use strict";

  const STORAGE_KEY = "ielts-command-center:v1";
  const EXAM_DATE = new Date(2027, 1, 6);
  const SUBJECTS = ["listening", "reading", "writing", "speaking"];

  const defaultState = {
    tasks: [],
    scores: {
      listening: { target: "", current: "" },
      reading: { target: "", current: "" },
      writing: { target: "", current: "" },
      speaking: { target: "", current: "" },
    },
    mocks: [],
    notes: [],
    noteDraft: "",
  };

  let state = loadState();

  const elements = {
    currentDate: document.querySelector("#current-date"),
    countdownDays: document.querySelector("#countdown-days"),
    countdownNote: document.querySelector("#countdown-note"),
    ringProgress: document.querySelector("#ring-progress"),
    footerYear: document.querySelector("#footer-year"),
    summaryTasks: document.querySelector("#summary-tasks"),
    summaryMock: document.querySelector("#summary-mock"),
    taskForm: document.querySelector("#task-form"),
    taskInput: document.querySelector("#task-input"),
    taskList: document.querySelector("#task-list"),
    taskEmpty: document.querySelector("#task-empty"),
    taskTemplate: document.querySelector("#task-template"),
    taskProgressPill: document.querySelector("#task-progress-pill"),
    taskEncouragement: document.querySelector("#task-encouragement"),
    clearCompleted: document.querySelector("#clear-completed"),
    scoreCards: [...document.querySelectorAll(".score-card")],
    mockForm: document.querySelector("#mock-form"),
    mockName: document.querySelector("#mock-name"),
    mockListening: document.querySelector("#mock-listening"),
    mockReading: document.querySelector("#mock-reading"),
    listeningPreview: document.querySelector("#listening-preview"),
    readingPreview: document.querySelector("#reading-preview"),
    mockList: document.querySelector("#mock-list"),
    mockEmpty: document.querySelector("#mock-empty"),
    mockCount: document.querySelector("#mock-count"),
    mockAverage: document.querySelector("#mock-average"),
    noteForm: document.querySelector("#note-form"),
    noteInput: document.querySelector("#note-input"),
    noteChars: document.querySelector("#note-chars"),
    noteCount: document.querySelector("#note-count"),
    notesList: document.querySelector("#notes-list"),
    notesEmpty: document.querySelector("#notes-empty"),
    toastRegion: document.querySelector("#toast-region"),
  };

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(defaultState));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return cloneDefaultState();

      const fresh = cloneDefaultState();
      const loadedScores = saved.scores || {};

      return {
        tasks: Array.isArray(saved.tasks) ? saved.tasks : fresh.tasks,
        scores: SUBJECTS.reduce((result, subject) => {
          result[subject] = {
            target: stringValue(loadedScores[subject]?.target),
            current: stringValue(loadedScores[subject]?.current),
          };
          return result;
        }, {}),
        mocks: Array.isArray(saved.mocks) ? saved.mocks : fresh.mocks,
        notes: Array.isArray(saved.notes) ? saved.notes : fresh.notes,
        noteDraft: stringValue(saved.noteDraft),
      };
    } catch {
      return cloneDefaultState();
    }
  }

  function stringValue(value) {
    return value === undefined || value === null ? "" : String(value);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      showToast("本地存储空间不足，本次修改未能保存");
    }
  }

  function uid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function startOfDay(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function daysUntilExam() {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((EXAM_DATE - startOfDay()) / millisecondsPerDay));
  }

  function formatDate(dateInput, withTime = false) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
    }).format(date);
  }

  function formatToday() {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).format(new Date());
  }

  function updateCountdown() {
    const days = daysUntilExam();
    const totalWindow = 365;
    const progress = Math.min(1, Math.max(0.04, 1 - days / totalWindow));
    const circumference = 2 * Math.PI * 79;

    elements.countdownDays.textContent = String(days);
    elements.ringProgress.style.strokeDasharray = String(circumference);
    elements.ringProgress.style.strokeDashoffset = String(circumference * (1 - progress));
    elements.currentDate.textContent = formatToday();
    elements.footerYear.textContent = String(new Date().getFullYear());

    if (days === 0) {
      elements.countdownNote.textContent = "今天就是考试日。沉着，专注。";
    } else if (days <= 14) {
      elements.countdownNote.textContent = "进入最后冲刺，稳住状态。";
    } else if (days <= 60) {
      elements.countdownNote.textContent = "节奏比速度更重要。";
    } else {
      elements.countdownNote.textContent = "保持专注，按自己的节奏前进。";
    }
  }

  function renderTasks() {
    elements.taskList.replaceChildren();

    state.tasks.forEach((task) => {
      const fragment = elements.taskTemplate.content.cloneNode(true);
      const item = fragment.querySelector(".task-item");
      const checkButton = fragment.querySelector(".task-check");
      const deleteButton = fragment.querySelector(".task-delete");
      const text = fragment.querySelector(".task-text");

      item.dataset.id = task.id;
      item.classList.toggle("completed", Boolean(task.completed));
      text.textContent = task.text;
      checkButton.setAttribute(
        "aria-label",
        task.completed ? `取消完成：${task.text}` : `完成：${task.text}`,
      );
      checkButton.setAttribute("aria-pressed", String(Boolean(task.completed)));

      checkButton.addEventListener("click", () => toggleTask(task.id));
      deleteButton.addEventListener("click", () => deleteTask(task.id));
      elements.taskList.append(fragment);
    });

    const total = state.tasks.length;
    const completed = state.tasks.filter((task) => task.completed).length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;

    elements.taskEmpty.classList.toggle("hidden", total > 0);
    elements.taskProgressPill.textContent = `${percentage}%`;
    elements.summaryTasks.textContent = `${completed} / ${total}`;
    elements.clearCompleted.classList.toggle("hidden", completed === 0);

    if (total === 0) {
      elements.taskEncouragement.textContent = "从一项小任务开始。";
    } else if (completed === total) {
      elements.taskEncouragement.textContent = "今日清单已完成，留一点时间复盘。";
    } else if (completed === 0) {
      elements.taskEncouragement.textContent = `还有 ${total} 项，先完成最重要的一项。`;
    } else {
      elements.taskEncouragement.textContent = `已完成 ${completed} 项，保持这个节奏。`;
    }
  }

  function addTask(text) {
    state.tasks.unshift({
      id: uid(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    saveState();
    renderTasks();
    showToast("任务已加入今日清单");
  }

  function toggleTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;
    task.completed = !task.completed;
    saveState();
    renderTasks();
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((task) => task.id !== id);
    saveState();
    renderTasks();
    showToast("任务已删除");
  }

  function clearCompletedTasks() {
    state.tasks = state.tasks.filter((task) => !task.completed);
    saveState();
    renderTasks();
    showToast("已清除完成的任务");
  }

  function renderScores() {
    elements.scoreCards.forEach((card) => {
      const subject = card.dataset.subject;
      const inputs = card.querySelectorAll(".score-input");
      const track = card.querySelector(".mini-track span");
      const saved = state.scores[subject];

      inputs.forEach((input) => {
        input.value = saved[input.dataset.field] || "";
      });

      const target = Number(saved.target);
      const current = Number(saved.current);
      const progress =
        target > 0 && current > 0 ? Math.max(4, Math.min(100, (current / target) * 100)) : 0;
      track.style.width = `${progress}%`;
    });
  }

  function updateScore(event) {
    const input = event.target.closest(".score-input");
    if (!input) return;

    const card = input.closest(".score-card");
    const subject = card.dataset.subject;
    const field = input.dataset.field;
    let value = input.value;

    if (value !== "") {
      const numeric = Math.min(9, Math.max(1, Number(value)));
      value = Number.isFinite(numeric) ? String(numeric) : "";
      if (event.type === "change") input.value = value;
    }

    state.scores[subject][field] = value;
    saveState();

    const target = Number(state.scores[subject].target);
    const current = Number(state.scores[subject].current);
    const progress =
      target > 0 && current > 0 ? Math.max(4, Math.min(100, (current / target) * 100)) : 0;
    card.querySelector(".mini-track span").style.width = `${progress}%`;
  }

  const listeningBands = [
    [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6],
    [18, 5.5], [16, 5], [13, 4.5], [10, 4], [6, 3.5], [4, 3], [3, 2.5],
    [2, 2], [1, 1], [0, 0],
  ];

  const readingBands = [
    [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6],
    [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5],
    [3, 2], [2, 1.5], [1, 1], [0, 0],
  ];

  function rawToBand(raw, table) {
    const score = Number(raw);
    if (!Number.isFinite(score) || raw === "") return null;
    const normalized = Math.min(40, Math.max(0, Math.round(score)));
    return table.find(([minimum]) => normalized >= minimum)?.[1] ?? null;
  }

  function formatBand(band) {
    return band === null ? "--" : band.toFixed(1);
  }

  function updateMockPreview() {
    const listeningBand = rawToBand(elements.mockListening.value, listeningBands);
    const readingBand = rawToBand(elements.mockReading.value, readingBands);

    elements.listeningPreview.textContent = formatBand(listeningBand);
    elements.readingPreview.textContent = formatBand(readingBand);
    elements.listeningPreview.classList.toggle("ready", listeningBand !== null);
    elements.readingPreview.classList.toggle("ready", readingBand !== null);
  }

  function addMock(event) {
    event.preventDefault();

    const name = elements.mockName.value.trim();
    const listeningRaw = Number(elements.mockListening.value);
    const readingRaw = Number(elements.mockReading.value);

    if (!name) {
      elements.mockName.focus();
      return;
    }
    if (
      !Number.isInteger(listeningRaw) ||
      listeningRaw < 0 ||
      listeningRaw > 40 ||
      !Number.isInteger(readingRaw) ||
      readingRaw < 0 ||
      readingRaw > 40
    ) {
      showToast("原始分需要填写 0–40 之间的整数");
      return;
    }

    const listeningBand = rawToBand(listeningRaw, listeningBands);
    const readingBand = rawToBand(readingRaw, readingBands);
    state.mocks.unshift({
      id: uid(),
      name,
      listeningRaw,
      readingRaw,
      listeningBand,
      readingBand,
      average: (listeningBand + readingBand) / 2,
      createdAt: new Date().toISOString(),
    });

    saveState();
    renderMocks();
    elements.mockForm.reset();
    updateMockPreview();
    elements.mockName.focus();
    showToast("模考记录已保存");
  }

  function deleteMock(id) {
    state.mocks = state.mocks.filter((mock) => mock.id !== id);
    saveState();
    renderMocks();
    showToast("模考记录已删除");
  }

  function renderMocks() {
    elements.mockList.replaceChildren();

    state.mocks.forEach((mock) => {
      const row = document.createElement("tr");
      row.dataset.id = mock.id;
      row.innerHTML = `
        <td>
          <span class="mock-title" title=""></span>
          <span class="mock-date"></span>
        </td>
        <td><span class="raw-score">${mock.listeningRaw} / 40</span></td>
        <td><span class="band-score">${formatBand(mock.listeningBand)}</span></td>
        <td><span class="raw-score">${mock.readingRaw} / 40</span></td>
        <td><span class="band-score">${formatBand(mock.readingBand)}</span></td>
        <td><span class="average-score">${Number(mock.average).toFixed(1)}</span></td>
        <td>
          <button class="icon-button mock-delete" type="button" aria-label="删除此模考记录">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10M9 9v4M11 9v4"></path>
            </svg>
          </button>
        </td>
      `;

      const title = row.querySelector(".mock-title");
      title.textContent = mock.name;
      title.title = mock.name;
      row.querySelector(".mock-date").textContent = formatDate(mock.createdAt);
      row.querySelector(".mock-delete").addEventListener("click", () => deleteMock(mock.id));
      elements.mockList.append(row);
    });

    elements.mockEmpty.classList.toggle("hidden", state.mocks.length > 0);
    elements.mockCount.textContent = String(state.mocks.length);

    if (state.mocks.length === 0) {
      elements.mockAverage.textContent = "--";
      elements.summaryMock.textContent = "尚未记录";
    } else {
      const average =
        state.mocks.reduce((total, mock) => total + Number(mock.average), 0) / state.mocks.length;
      const averageLabel = average.toFixed(1);
      elements.mockAverage.textContent = averageLabel;
      elements.summaryMock.textContent = `${averageLabel} 平均`;
    }
  }

  function syncNoteDraft() {
    elements.noteChars.textContent = String(elements.noteInput.value.length);
    state.noteDraft = elements.noteInput.value;
    saveState();
  }

  function addNote(event) {
    event.preventDefault();
    const content = elements.noteInput.value.trim();
    if (!content) {
      elements.noteInput.focus();
      return;
    }

    state.notes.unshift({
      id: uid(),
      content,
      createdAt: new Date().toISOString(),
    });
    state.noteDraft = "";
    elements.noteInput.value = "";
    elements.noteChars.textContent = "0";
    saveState();
    renderNotes();
    showToast("灵感已收藏");
  }

  function deleteNote(id) {
    state.notes = state.notes.filter((note) => note.id !== id);
    saveState();
    renderNotes();
    showToast("记录已删除");
  }

  function renderNotes() {
    elements.notesList.replaceChildren();

    state.notes.forEach((note) => {
      const article = document.createElement("article");
      article.className = "note-item";
      article.dataset.id = note.id;

      const content = document.createElement("p");
      content.className = "note-content";
      content.textContent = note.content;

      const time = document.createElement("time");
      time.className = "note-time";
      time.dateTime = note.createdAt;
      time.textContent = formatDate(note.createdAt, true);

      const deleteButton = document.createElement("button");
      deleteButton.className = "icon-button note-delete";
      deleteButton.type = "button";
      deleteButton.setAttribute("aria-label", "删除这条记录");
      deleteButton.innerHTML = `
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10M9 9v4M11 9v4"></path>
        </svg>
      `;
      deleteButton.addEventListener("click", () => deleteNote(note.id));

      article.append(content, time, deleteButton);
      elements.notesList.append(article);
    });

    elements.notesEmpty.classList.toggle("hidden", state.notes.length > 0);
    elements.noteCount.textContent = `${state.notes.length} 条记录`;
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    elements.toastRegion.append(toast);

    window.setTimeout(() => {
      toast.classList.add("leaving");
      window.setTimeout(() => toast.remove(), 230);
    }, 2300);
  }

  elements.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = elements.taskInput.value.trim();
    if (!text) {
      elements.taskInput.focus();
      return;
    }
    addTask(text);
    elements.taskForm.reset();
    elements.taskInput.focus();
  });

  elements.clearCompleted.addEventListener("click", clearCompletedTasks);

  elements.scoreCards.forEach((card) => {
    card.querySelectorAll(".score-input").forEach((input) => {
      input.addEventListener("input", updateScore);
      input.addEventListener("change", updateScore);
    });
  });

  elements.mockForm.addEventListener("submit", addMock);
  elements.mockListening.addEventListener("input", updateMockPreview);
  elements.mockReading.addEventListener("input", updateMockPreview);
  elements.noteForm.addEventListener("submit", addNote);
  elements.noteInput.addEventListener("input", syncNoteDraft);

  elements.noteInput.value = state.noteDraft;
  elements.noteChars.textContent = String(state.noteDraft.length);

  updateCountdown();
  renderTasks();
  renderScores();
  renderMocks();
  renderNotes();
  updateMockPreview();

  window.setInterval(updateCountdown, 60 * 1000);
})();
