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
    vocab: {
      daily: {},
      total: 0,
      records: [],
      words: [],
      testHistory: [],
      wordStats: {},
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
    vocabForm: document.querySelector("#vocab-form"),
    vocabInput: document.querySelector("#vocab-input"),
    vocabPages: document.querySelector("#vocab-pages"),
    vocabToday: document.querySelector("#vocab-today"),
    vocabTotal: document.querySelector("#vocab-total"),
    vocabRecentList: document.querySelector("#vocab-recent-list"),
    wordCount: document.querySelector("#word-count"),
    wordImportForm: document.querySelector("#word-import-form"),
    wordImportInput: document.querySelector("#word-import-input"),
    wordImportMode: document.querySelector("#word-import-mode"),
    wordImportButton: document.querySelector("#word-import-button"),
    wordImportMessage: document.querySelector("#word-import-message"),
    wordLibraryList: document.querySelector("#word-library-list"),
    testStart: document.querySelector("#test-start"),
    testStop: document.querySelector("#test-stop"),
    testAnswered: document.querySelector("#test-answered"),
    testCorrect: document.querySelector("#test-correct"),
    testWrong: document.querySelector("#test-wrong"),
    testAccuracy: document.querySelector("#test-accuracy"),
    testIdle: document.querySelector("#test-idle"),
    testIdleTitle: document.querySelector("#test-idle-title"),
    testIdleDescription: document.querySelector("#test-idle-description"),
    testQuestion: document.querySelector("#test-question"),
    testQuestionNumber: document.querySelector("#test-question-number"),
    testQuestionType: document.querySelector("#test-question-type"),
    testPrompt: document.querySelector("#test-prompt"),
    spellingForm: document.querySelector("#spelling-form"),
    spellingInput: document.querySelector("#spelling-input"),
    testChoices: document.querySelector("#test-choices"),
    testFeedback: document.querySelector("#test-feedback"),
    testHistoryList: document.querySelector("#test-history-list"),
    wordStatsList: document.querySelector("#word-stats-list"),
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

  let vocabTest = {
    active: false,
    remainingIds: [],
    currentWord: null,
    questionType: "",
    answered: 0,
    correct: 0,
    wrong: 0,
    locked: false,
    timer: null,
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
      const loadedVocab = saved.vocab && typeof saved.vocab === "object" ? saved.vocab : {};
      const vocabDaily =
        loadedVocab.daily && typeof loadedVocab.daily === "object" ? loadedVocab.daily : {};
      const cleanDaily = Object.entries(vocabDaily).reduce((result, [date, value]) => {
        const pages = Number(value);
        if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isInteger(pages) && pages > 0) {
          result[date] = pages;
        }
        return result;
      }, {});
      const savedTotal = Number(loadedVocab.total);
      const derivedTotal = Object.values(cleanDaily).reduce((sum, pages) => sum + pages, 0);
      const cleanRecords = (Array.isArray(loadedVocab.records) ? loadedVocab.records : [])
        .map((record) => {
          if (!record || typeof record !== "object") return null;
          const date = stringValue(record.date);
          const pages = Number(record.pages);
          if (
            !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            !Number.isInteger(pages) ||
            pages <= 0
          ) {
            return null;
          }
          const createdAt = Number.isNaN(Date.parse(record.createdAt))
            ? `${date}T00:00:00`
            : new Date(record.createdAt).toISOString();
          return {
            id: stringValue(record.id) || uid(),
            date,
            pages,
            pageNumbers: stringValue(record.pageNumbers).trim().slice(0, 60),
            createdAt,
          };
        })
        .filter(Boolean);
      const wordMap = new Map();
      (Array.isArray(loadedVocab.words) ? loadedVocab.words : []).forEach((word) => {
        if (!word || typeof word !== "object") return;
        const english = stringValue(word.english).trim().slice(0, 80);
        const pos = stringValue(word.pos).trim().slice(0, 20);
        const meaning = stringValue(word.meaning).trim().slice(0, 120);
        const key = english.toLocaleLowerCase();
        if (!key || !pos || !meaning || wordMap.has(key)) return;
        wordMap.set(key, {
          id: stringValue(word.id) || uid(),
          english,
          pos,
          meaning,
          createdAt: Number.isNaN(Date.parse(word.createdAt))
            ? new Date().toISOString()
            : new Date(word.createdAt).toISOString(),
        });
      });
      const cleanWords = [...wordMap.values()];
      const cleanTestHistory = (
        Array.isArray(loadedVocab.testHistory) ? loadedVocab.testHistory : []
      )
        .map((record) => {
          if (!record || typeof record !== "object") return null;
          const total = Number(record.total);
          const correct = Number(record.correct);
          const wrong = Number(record.wrong);
          if (
            !Number.isInteger(total) ||
            total < 0 ||
            !Number.isInteger(correct) ||
            correct < 0 ||
            !Number.isInteger(wrong) ||
            wrong < 0 ||
            correct + wrong !== total
          ) {
            return null;
          }
          return {
            id: stringValue(record.id) || uid(),
            createdAt: Number.isNaN(Date.parse(record.createdAt))
              ? new Date().toISOString()
              : new Date(record.createdAt).toISOString(),
            total,
            correct,
            wrong,
            accuracy: total ? Math.round((correct / total) * 100) : 0,
          };
        })
        .filter(Boolean);
      const cleanWordStats = Object.entries(
        loadedVocab.wordStats && typeof loadedVocab.wordStats === "object"
          ? loadedVocab.wordStats
          : {},
      ).reduce((result, [key, value]) => {
        const testCount = Number(value?.testCount);
        const errorCount = Number(value?.errorCount);
        if (
          key &&
          Number.isInteger(testCount) &&
          testCount >= 0 &&
          Number.isInteger(errorCount) &&
          errorCount >= 0 &&
          errorCount <= testCount
        ) {
          result[key] = { testCount, errorCount };
        }
        return result;
      }, {});

      return {
        tasks: Array.isArray(saved.tasks) ? saved.tasks : fresh.tasks,
        scores: SUBJECTS.reduce((result, subject) => {
          result[subject] = {
            target: stringValue(loadedScores[subject]?.target),
            current: stringValue(loadedScores[subject]?.current),
          };
          return result;
        }, {}),
        vocab: {
          daily: cleanDaily,
          total: Number.isInteger(savedTotal) && savedTotal >= derivedTotal ? savedTotal : derivedTotal,
          records: cleanRecords,
          words: cleanWords,
          testHistory: cleanTestHistory,
          wordStats: cleanWordStats,
        },
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

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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

    renderVocab();
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

  function renderVocab() {
    const todayPages = state.vocab.daily[localDateKey()] || 0;
    elements.vocabToday.textContent = String(todayPages);
    elements.vocabTotal.textContent = String(state.vocab.total);
    renderVocabRecords();
  }

  function formatVocabDate(dateKey) {
    const [, month, day] = dateKey.split("-");
    return `${month}月${day}日`;
  }

  function renderVocabRecords() {
    const today = startOfDay();
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffKey = localDateKey(cutoff);
    const todayKey = localDateKey(today);
    const recentRecords = state.vocab.records
      .filter((record) => record.date >= cutoffKey && record.date <= todayKey)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));

    elements.vocabRecentList.replaceChildren();

    if (recentRecords.length === 0) {
      const empty = document.createElement("p");
      empty.className = "vocab-recent-empty";
      empty.textContent = "暂无打卡记录";
      elements.vocabRecentList.append(empty);
      return;
    }

    recentRecords.forEach((record) => {
      const row = document.createElement("div");
      row.className = "vocab-record";

      const date = document.createElement("time");
      date.className = "vocab-record-date";
      date.dateTime = record.date;
      date.textContent = formatVocabDate(record.date);

      const pages = document.createElement("span");
      pages.className = "vocab-record-pages";
      pages.textContent = `背诵 ${record.pages} 页`;

      const pageNumbers = document.createElement("span");
      pageNumbers.className = "vocab-record-pages-numbers";
      pageNumbers.textContent = `页码: ${record.pageNumbers || "暂无"}`;

      const firstDivider = document.createElement("span");
      firstDivider.className = "vocab-record-divider";
      firstDivider.textContent = "|";

      const secondDivider = document.createElement("span");
      secondDivider.className = "vocab-record-divider";
      secondDivider.textContent = "|";

      const deleteButton = document.createElement("button");
      deleteButton.className = "vocab-record-delete";
      deleteButton.type = "button";
      deleteButton.textContent = "删除";
      deleteButton.setAttribute(
        "aria-label",
        `删除 ${formatVocabDate(record.date)} 背诵 ${record.pages} 页的记录`,
      );
      deleteButton.addEventListener("click", () => deleteVocabRecord(record.id));

      row.append(date, firstDivider, pages, secondDivider, pageNumbers, deleteButton);
      elements.vocabRecentList.append(row);
    });
  }

  function deleteVocabRecord(id) {
    const record = state.vocab.records.find((item) => item.id === id);
    if (!record) return;
    if (!window.confirm("确定删除这条词汇背诵记录吗？")) return;

    state.vocab.records = state.vocab.records.filter((item) => item.id !== id);
    const remainingPages = (state.vocab.daily[record.date] || 0) - record.pages;
    if (remainingPages > 0) {
      state.vocab.daily[record.date] = remainingPages;
    } else {
      delete state.vocab.daily[record.date];
    }
    state.vocab.total = Object.values(state.vocab.daily).reduce(
      (sum, pages) => sum + pages,
      0,
    );

    saveState();
    renderVocab();
    showToast("词汇背诵记录已删除");
  }

  function addVocabRecord(event) {
    event.preventDefault();
    const pages = Number(elements.vocabInput.value);
    const pageNumbers = elements.vocabPages.value.trim();

    if (!Number.isInteger(pages) || pages <= 0) {
      showToast("请输入大于 0 的整数页数");
      elements.vocabInput.focus();
      return;
    }

    const today = localDateKey();
    state.vocab.daily[today] = (state.vocab.daily[today] || 0) + pages;
    state.vocab.total += pages;
    state.vocab.records.push({
      id: uid(),
      date: today,
      pages,
      pageNumbers,
      createdAt: new Date().toISOString(),
    });
    saveState();
    renderVocab();
    elements.vocabForm.reset();
    elements.vocabInput.focus();

    elements.vocabToday.closest(".vocab-stat").classList.remove("is-updated");
    requestAnimationFrame(() => {
      elements.vocabToday.closest(".vocab-stat").classList.add("is-updated");
    });
    showToast(`已记录 ${pages} 页词汇背诵`);
  }

  function normalizeWordKey(english) {
    return english.trim().toLocaleLowerCase();
  }

  function setWordImportMessage(message, type = "") {
    elements.wordImportMessage.textContent = message;
    elements.wordImportMessage.dataset.type = type;
  }

  function renderWordLibrary() {
    const words = [...state.vocab.words].sort((first, second) =>
      first.english.localeCompare(second.english, "en", { sensitivity: "base" }),
    );
    elements.wordCount.textContent = String(words.length);
    elements.wordLibraryList.replaceChildren();

    if (words.length === 0) {
      const empty = document.createElement("p");
      empty.className = "word-library-empty";
      empty.textContent = "暂无单词，先导入一份自己的词库。";
      elements.wordLibraryList.append(empty);
      return;
    }

    words.forEach((word) => {
      const row = document.createElement("div");
      row.className = "word-entry";

      const wordInfo = document.createElement("div");
      wordInfo.className = "word-entry-info";
      const english = document.createElement("strong");
      english.textContent = word.english;
      const pos = document.createElement("span");
      pos.className = "word-entry-pos";
      pos.textContent = word.pos;
      wordInfo.append(english, pos);

      const meaning = document.createElement("span");
      meaning.className = "word-entry-meaning";
      meaning.textContent = word.meaning;

      const deleteButton = document.createElement("button");
      deleteButton.className = "word-entry-delete";
      deleteButton.type = "button";
      deleteButton.textContent = "×";
      deleteButton.setAttribute("aria-label", `删除单词 ${word.english}`);
      deleteButton.disabled = vocabTest.active;
      deleteButton.addEventListener("click", () => deleteVocabWord(word.id));

      row.append(wordInfo, meaning, deleteButton);
      elements.wordLibraryList.append(row);
    });
  }

  function importVocabulary(event) {
    event.preventDefault();
    if (vocabTest.active) {
      showToast("请先结束当前测试");
      return;
    }

    const lines = elements.wordImportInput.value
      .split(/\r?\n/)
      .map((line) => line.replace(/^\uFEFF/, "").trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setWordImportMessage("请至少粘贴一行词库内容。", "error");
      elements.wordImportInput.focus();
      return;
    }

    const parsedWords = [];
    for (let index = 0; index < lines.length; index += 1) {
      const parts = lines[index].split(",").map((part) => part.trim());
      if (parts.length !== 3 || parts.some((part) => !part)) {
        setWordImportMessage(
          `第 ${index + 1} 行格式错误，请使用：英文,词性,中文`,
          "error",
        );
        return;
      }
      parsedWords.push({
        english: parts[0].slice(0, 80),
        pos: parts[1].slice(0, 20),
        meaning: parts[2].slice(0, 120),
      });
    }

    const replaceMode = elements.wordImportMode.value === "replace";
    const wordMap = new Map();
    if (!replaceMode) {
      state.vocab.words.forEach((word) => {
        wordMap.set(normalizeWordKey(word.english), word);
      });
    }

    const now = new Date().toISOString();
    let addedCount = 0;
    let updatedCount = 0;
    parsedWords.forEach((word) => {
      const key = normalizeWordKey(word.english);
      const existing = wordMap.get(key);
      if (existing) {
        updatedCount += 1;
        wordMap.set(key, { ...existing, pos: word.pos, meaning: word.meaning });
      } else {
        addedCount += 1;
        wordMap.set(key, {
          id: uid(),
          english: word.english,
          pos: word.pos,
          meaning: word.meaning,
          createdAt: now,
        });
      }
    });

    state.vocab.words = [...wordMap.values()];
    if (replaceMode) {
      const currentKeys = new Set(state.vocab.words.map((word) => normalizeWordKey(word.english)));
      Object.keys(state.vocab.wordStats).forEach((key) => {
        if (!currentKeys.has(key)) delete state.vocab.wordStats[key];
      });
    }

    saveState();
    renderWordLibrary();
    renderWordStats();
    elements.wordImportForm.reset();
    setWordImportMessage(
      `导入完成：新增 ${addedCount} 个，更新 ${updatedCount} 个，当前共 ${state.vocab.words.length} 个单词。`,
      "success",
    );
    showToast("词库已保存到本地");
  }

  function deleteVocabWord(id) {
    if (vocabTest.active) {
      showToast("请先结束当前测试");
      return;
    }
    const word = state.vocab.words.find((item) => item.id === id);
    if (!word) return;
    if (!window.confirm(`确定删除单词“${word.english}”吗？`)) return;

    state.vocab.words = state.vocab.words.filter((item) => item.id !== id);
    delete state.vocab.wordStats[normalizeWordKey(word.english)];
    saveState();
    renderWordLibrary();
    renderWordStats();
    showToast("单词已从词库删除");
  }

  function updateTestDashboard() {
    const answered = vocabTest.correct + vocabTest.wrong;
    const accuracy = answered ? Math.round((vocabTest.correct / answered) * 100) : 0;
    elements.testAnswered.textContent = String(answered);
    elements.testCorrect.textContent = String(vocabTest.correct);
    elements.testWrong.textContent = String(vocabTest.wrong);
    elements.testAccuracy.textContent = String(accuracy);
  }

  function syncTestControls() {
    elements.testStart.disabled = vocabTest.active;
    elements.testStop.disabled = !vocabTest.active;
    elements.wordImportButton.disabled = vocabTest.active;
    elements.wordImportInput.disabled = vocabTest.active;
    elements.wordImportMode.disabled = vocabTest.active;
    elements.wordLibraryList.querySelectorAll(".word-entry-delete").forEach((button) => {
      button.disabled = vocabTest.active;
    });
  }

  function showTestIdle(title, description) {
    elements.testIdleTitle.textContent = title;
    elements.testIdleDescription.textContent = description;
    elements.testIdle.hidden = false;
    elements.testQuestion.hidden = true;
    elements.testQuestionType.textContent = "";
    elements.testFeedback.textContent = "";
    elements.testFeedback.className = "test-feedback";
  }

  function startVocabTest() {
    if (vocabTest.active) return;
    if (state.vocab.words.length < 4) {
      showTestIdle(
        "词库至少需要 4 个单词",
        "英译中选择题需要 3 个干扰项，请先在词库管理中添加更多单词。",
      );
      showToast("请先导入至少 4 个单词");
      return;
    }

    window.clearTimeout(vocabTest.timer);
    vocabTest = {
      active: true,
      remainingIds: state.vocab.words.map((word) => word.id),
      currentWord: null,
      questionType: "",
      answered: 0,
      correct: 0,
      wrong: 0,
      locked: false,
      timer: null,
    };
    elements.testIdle.hidden = true;
    elements.testQuestion.hidden = false;
    updateTestDashboard();
    syncTestControls();
    renderWordLibrary();
    nextVocabQuestion();
  }

  function nextVocabQuestion() {
    if (!vocabTest.active) return;
    if (vocabTest.remainingIds.length === 0) {
      finishVocabTest("complete");
      return;
    }

    const randomIndex = Math.floor(Math.random() * vocabTest.remainingIds.length);
    const [wordId] = vocabTest.remainingIds.splice(randomIndex, 1);
    const word = state.vocab.words.find((item) => item.id === wordId);
    if (!word) {
      nextVocabQuestion();
      return;
    }

    vocabTest.currentWord = word;
    vocabTest.questionType = Math.random() < 0.5 ? "spelling" : "choice";
    vocabTest.locked = false;
    updateTestDashboard();
    elements.testQuestionNumber.textContent = `QUESTION ${String(
      vocabTest.correct + vocabTest.wrong + 1,
    ).padStart(2, "0")}`;
    elements.testFeedback.textContent = "";
    elements.testFeedback.className = "test-feedback";

    if (vocabTest.questionType === "spelling") {
      renderSpellingQuestion(word);
    } else {
      renderChoiceQuestion(word);
    }
  }

  function renderSpellingQuestion(word) {
    elements.testQuestionType.textContent = "中译英 · 拼写";
    elements.testPrompt.textContent = `${word.pos}  ${word.meaning}`;
    elements.spellingForm.hidden = false;
    elements.testChoices.hidden = true;
    elements.spellingForm.reset();
    elements.spellingInput.disabled = false;
    elements.spellingForm.querySelector("button").disabled = false;
    elements.spellingInput.focus();
  }

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  function renderChoiceQuestion(word) {
    elements.testQuestionType.textContent = "英译中 · 选择";
    elements.testPrompt.textContent = word.english;
    elements.spellingForm.hidden = true;
    elements.testChoices.hidden = false;
    elements.testChoices.replaceChildren();

    const distractors = shuffle(
      state.vocab.words.filter((item) => item.id !== word.id),
    ).slice(0, 3);
    const choices = shuffle([word, ...distractors]);

    choices.forEach((choice) => {
      const button = document.createElement("button");
      button.className = "test-choice";
      button.type = "button";
      button.dataset.wordId = choice.id;
      button.textContent = `${choice.pos}  ${choice.meaning}`;
      button.addEventListener("click", () => {
        if (vocabTest.locked) return;
        vocabTest.locked = true;
        const isCorrect = choice.id === word.id;
        elements.testChoices.querySelectorAll("button").forEach((option) => {
          option.disabled = true;
          if (option.dataset.wordId === word.id) option.classList.add("is-correct");
        });
        if (!isCorrect) button.classList.add("is-wrong");
        resolveVocabAnswer(word, isCorrect);
      });
      elements.testChoices.append(button);
    });
  }

  function submitSpellingAnswer(event) {
    event.preventDefault();
    if (!vocabTest.active || vocabTest.locked || !vocabTest.currentWord) return;
    const answer = elements.spellingInput.value.trim();
    if (!answer) return;

    vocabTest.locked = true;
    elements.spellingInput.disabled = true;
    elements.spellingForm.querySelector("button").disabled = true;
    const isCorrect =
      answer.toLocaleLowerCase() === vocabTest.currentWord.english.toLocaleLowerCase();
    resolveVocabAnswer(vocabTest.currentWord, isCorrect);
  }

  function resolveVocabAnswer(word, isCorrect) {
    if (isCorrect) {
      vocabTest.correct += 1;
      elements.testFeedback.textContent = "回答正确";
      elements.testFeedback.className = "test-feedback is-correct";
    } else {
      vocabTest.wrong += 1;
      elements.testFeedback.textContent = `回答错误，正确答案是 ${word.english}`;
      elements.testFeedback.className = "test-feedback is-wrong";
    }

    const key = normalizeWordKey(word.english);
    const stats = state.vocab.wordStats[key] || { testCount: 0, errorCount: 0 };
    stats.testCount += 1;
    if (!isCorrect) stats.errorCount += 1;
    state.vocab.wordStats[key] = stats;
    saveState();
    updateTestDashboard();
    renderWordStats();

    vocabTest.timer = window.setTimeout(() => {
      vocabTest.timer = null;
      nextVocabQuestion();
    }, isCorrect ? 900 : 2000);
  }

  function finishVocabTest(reason = "manual") {
    if (!vocabTest.active) return;
    window.clearTimeout(vocabTest.timer);
    vocabTest.timer = null;
    vocabTest.active = false;
    vocabTest.locked = true;

    const total = vocabTest.correct + vocabTest.wrong;
    state.vocab.testHistory.push({
      id: uid(),
      createdAt: new Date().toISOString(),
      total,
      correct: vocabTest.correct,
      wrong: vocabTest.wrong,
      accuracy: total ? Math.round((vocabTest.correct / total) * 100) : 0,
    });
    saveState();
    renderTestHistory();
    renderWordStats();
    syncTestControls();
    renderWordLibrary();
    showTestIdle(
      reason === "complete" ? "本次词库已全部抽完" : "本次测试已结束",
      `共答 ${total} 题，正确 ${vocabTest.correct} 题，错误 ${vocabTest.wrong} 题。`,
    );
  }

  function formatReviewDate(dateInput) {
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "--";
    const day = formatVocabDate(localDateKey(date));
    const time = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    return `${day} ${time}`;
  }

  function renderTestHistory() {
    const history = [...state.vocab.testHistory].sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    );
    elements.testHistoryList.replaceChildren();

    if (history.length === 0) {
      const empty = document.createElement("p");
      empty.className = "review-empty";
      empty.textContent = "暂无测试记录";
      elements.testHistoryList.append(empty);
      return;
    }

    history.forEach((record) => {
      const row = document.createElement("div");
      row.className = "test-history-row";

      const date = document.createElement("span");
      date.className = "review-date";
      date.textContent = formatReviewDate(record.createdAt);

      const summary = document.createElement("span");
      summary.className = "review-summary";
      summary.textContent = `${record.total} 题 · 对 ${record.correct} · 错 ${record.wrong}`;

      const accuracy = document.createElement("strong");
      accuracy.className = "review-accuracy";
      accuracy.textContent = `${record.accuracy}%`;

      row.append(date, summary, accuracy);
      elements.testHistoryList.append(row);
    });
  }

  function renderWordStats() {
    const rows = state.vocab.words
      .map((word) => ({
        word,
        stats: state.vocab.wordStats[normalizeWordKey(word.english)] || {
          testCount: 0,
          errorCount: 0,
        },
      }))
      .filter((item) => item.stats.testCount > 0)
      .sort(
        (first, second) =>
          second.stats.errorCount - first.stats.errorCount ||
          second.stats.testCount - first.stats.testCount ||
          first.word.english.localeCompare(second.word.english),
      );

    elements.wordStatsList.replaceChildren();

    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "review-empty";
      empty.textContent = "完成答题后，这里会显示需要重点复习的单词。";
      elements.wordStatsList.append(empty);
      return;
    }

    rows.forEach(({ word, stats }) => {
      const row = document.createElement("div");
      row.className = "word-stats-row";

      const wordInfo = document.createElement("div");
      wordInfo.className = "word-stats-word";
      const english = document.createElement("strong");
      english.textContent = word.english;
      const meaning = document.createElement("span");
      meaning.textContent = `${word.pos} ${word.meaning}`;
      wordInfo.append(english, meaning);

      const counts = document.createElement("span");
      counts.className = "word-stats-counts";
      counts.textContent = `考察 ${stats.testCount} 次 · 错误 ${stats.errorCount} 次`;

      row.append(wordInfo, counts);
      elements.wordStatsList.append(row);
    });
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

  elements.vocabForm.addEventListener("submit", addVocabRecord);
  elements.wordImportForm.addEventListener("submit", importVocabulary);
  elements.testStart.addEventListener("click", startVocabTest);
  elements.testStop.addEventListener("click", () => finishVocabTest("manual"));
  elements.spellingForm.addEventListener("submit", submitSpellingAnswer);
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
  renderVocab();
  renderWordLibrary();
  renderTestHistory();
  renderWordStats();
  updateTestDashboard();
  syncTestControls();
  renderMocks();
  renderNotes();
  updateMockPreview();

  window.setInterval(updateCountdown, 60 * 1000);
})();
