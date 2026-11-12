(() => {
  "use strict";

  const STORAGE_KEY = "ielts-command-center:v1";
  const VOCAB_STORAGE_KEY = "myVocab";
  const STATS_STORAGE_KEY = "myStats";
  const TEST_HISTORY_STORAGE_KEY = "myTestHistory";
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
      libraries: [],
      testHistory: [],
      wordStats: [],
      manageLibraryId: "",
      testLibraryId: "",
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
    wordImportButton: document.querySelector("#word-import-button"),
    wordImportMessage: document.querySelector("#word-import-message"),
    wordLibraryList: document.querySelector("#word-library-list"),
    wordLibraryName: document.querySelector("#word-library-name"),
    wordManageSelect: document.querySelector("#word-manage-select"),
    wordLibraryDelete: document.querySelector("#word-library-delete"),
    testLibrarySelect: document.querySelector("#test-library-select"),
    testModeInputs: [...document.querySelectorAll('input[name="test-mode"]')],
    testModeStatus: document.querySelector("#test-mode-status"),
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
    wordStatsClear: document.querySelector("#clear-all-word-stats"),
    historyModal: document.querySelector("#history-modal"),
    historyModalTitle: document.querySelector("#history-modal-title"),
    historyModalMeta: document.querySelector("#history-modal-meta"),
    historyModalBody: document.querySelector("#history-modal-body"),
    historyModalClose: document.querySelector("#history-modal-close"),
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

  const vocabTabButtons = [...document.querySelectorAll("[data-vocab-tab]")];
  const vocabTabPanels = [...document.querySelectorAll("[data-vocab-panel]")];

  let vocabTest = {
    active: false,
    libraryId: "",
    libraryName: "",
    mode: "mixed",
    remainingIds: [],
    currentWord: null,
    questionType: "",
    answered: 0,
    correct: 0,
    wrong: 0,
    wrongWords: [],
    wordResults: [],
    locked: false,
    timer: null,
  };
  let lastHistoryTrigger = null;

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(defaultState));
  }

  function readStoredState(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function loadState() {
    try {
      const saved = readStoredState(STORAGE_KEY);
      const storedVocabulary = readStoredState(VOCAB_STORAGE_KEY);
      const storedStats = readStoredState(STATS_STORAGE_KEY);
      const storedHistory = readStoredState(TEST_HISTORY_STORAGE_KEY);
      if (
        !saved &&
        !storedVocabulary &&
        !storedStats &&
        !storedHistory
      ) {
        return cloneDefaultState();
      }

      const baseState = saved && typeof saved === "object" ? saved : {};
      const fresh = cloneDefaultState();
      const loadedScores = baseState.scores || {};
      const legacyVocab =
        baseState.vocab && typeof baseState.vocab === "object" ? baseState.vocab : {};
      const historySource =
        storedHistory && Array.isArray(storedHistory.testHistory)
          ? storedHistory.testHistory
          : storedStats && Array.isArray(storedStats.testHistory)
            ? storedStats.testHistory
            : legacyVocab.testHistory;
      const loadedVocab = {
        ...legacyVocab,
        ...(storedVocabulary &&
        typeof storedVocabulary === "object" &&
        Array.isArray(storedVocabulary.libraries)
          ? { libraries: storedVocabulary.libraries }
          : {}),
        ...(storedVocabulary &&
        typeof storedVocabulary === "object" &&
        "manageLibraryId" in storedVocabulary
          ? { manageLibraryId: storedVocabulary.manageLibraryId }
          : {}),
        ...(storedVocabulary &&
        typeof storedVocabulary === "object" &&
        "testLibraryId" in storedVocabulary
          ? { testLibraryId: storedVocabulary.testLibraryId }
          : {}),
        ...(storedStats &&
        typeof storedStats === "object" &&
        storedStats.wordStats &&
        typeof storedStats.wordStats === "object"
          ? { wordStats: storedStats.wordStats }
          : {}),
        ...(Array.isArray(historySource) ? { testHistory: historySource } : {}),
      };
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
      const hadLibraries = Array.isArray(loadedVocab.libraries);
      const cleanLibraries = sanitizeLibraries(loadedVocab);
      const fallbackLibraryId = cleanLibraries[0]?.id || "";
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
          const storedLibraryId = stringValue(record.libraryId);
          const library = cleanLibraries.find(
            (item) => item.id === storedLibraryId || item.name === record.libraryName,
          );
          const mode = ["spelling", "choice", "mixed"].includes(record.mode)
            ? record.mode
            : "mixed";
          const storedAccuracy = Number(record.accuracy);
          const accuracy =
            Number.isFinite(storedAccuracy) &&
            storedAccuracy >= 0 &&
            storedAccuracy <= 100
              ? storedAccuracy
              : total
                ? Number(((correct / total) * 100).toFixed(2))
                : 0;
          const wrongWords = (Array.isArray(record.wrongWords) ? record.wrongWords : [])
            .map((word) => {
              if (!word || typeof word !== "object") return null;
              const english = stringValue(word.english).trim();
              const pos = stringValue(word.pos).trim();
              const meaning = stringValue(word.meaning).trim();
              return english && pos && meaning
                ? { english, pos, meaning }
                : null;
            })
            .filter(Boolean);
          const wordResults = (Array.isArray(record.wordResults) ? record.wordResults : [])
            .map((word) => {
              if (!word || typeof word !== "object") return null;
              const english = stringValue(word.english).trim();
              const pos = stringValue(word.pos).trim();
              const meaning = stringValue(word.meaning).trim();
              if (!english || !pos || !meaning) return null;
              const storedErrorCount = Number(word.errorCount);
              const errorCount = Number.isInteger(storedErrorCount)
                ? Math.min(1, Math.max(0, storedErrorCount))
                : word.isCorrect === false
                  ? 1
                  : 0;
              return {
                wordKey: normalizeWordKey(english),
                english,
                pos,
                meaning,
                errorCount,
              };
            })
            .filter(Boolean);
          return {
            id: stringValue(record.id) || uid(),
            libraryId: library?.id || storedLibraryId || fallbackLibraryId,
            libraryName:
              stringValue(record.libraryName).trim() || library?.name || "默认词库",
            mode,
            wrongWords,
            wordResults,
            createdAt: Number.isNaN(Date.parse(record.createdAt))
              ? new Date().toISOString()
              : new Date(record.createdAt).toISOString(),
            total,
            correct,
            wrong,
            accuracy,
          };
        })
        .filter(Boolean);
      let cleanWordStats = sanitizeWordStats(
        loadedVocab.wordStats,
        hadLibraries ? "" : fallbackLibraryId,
      );
      cleanWordStats = repairMissingLibraryStats(
        cleanTestHistory,
        cleanLibraries,
        cleanWordStats,
      );
      const libraryIds = new Set(cleanLibraries.map((library) => library.id));
      const requestedManageId = stringValue(loadedVocab.manageLibraryId);
      const requestedTestId = stringValue(loadedVocab.testLibraryId);

      return {
        tasks: Array.isArray(baseState.tasks) ? baseState.tasks : fresh.tasks,
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
          libraries: cleanLibraries,
          testHistory: cleanTestHistory,
          wordStats: cleanWordStats,
          manageLibraryId: libraryIds.has(requestedManageId)
            ? requestedManageId
            : fallbackLibraryId,
          testLibraryId: libraryIds.has(requestedTestId) ? requestedTestId : fallbackLibraryId,
        },
        mocks: Array.isArray(baseState.mocks) ? baseState.mocks : fresh.mocks,
        notes: Array.isArray(baseState.notes) ? baseState.notes : fresh.notes,
        noteDraft: stringValue(baseState.noteDraft),
      };
    } catch {
      return cloneDefaultState();
    }
  }

  function parseWordAliases(value) {
    const parts = stringValue(value)
      .split("/")
      .map((part) => part.trim().replace(/\s+/g, " "))
      .filter(Boolean);
    return {
      english: parts[0] || "",
      synonyms: [...new Set(parts.slice(1))],
    };
  }

  function sanitizeWord(word) {
    if (!word || typeof word !== "object") return null;
    const aliasSource =
      word.englishAliases ??
      (Array.isArray(word.synonyms) && word.synonyms.length
        ? [word.english, ...word.synonyms].join("/")
        : word.english);
    const { english, synonyms } = parseWordAliases(aliasSource);
    const pos = stringValue(word.pos).trim().slice(0, 20);
    const meaning = stringValue(word.meaning).trim().slice(0, 120);
    if (!english || !pos || !meaning) return null;
    return {
      id: stringValue(word.id) || uid(),
      english: english.slice(0, 80),
      synonyms: synonyms.map((item) => item.slice(0, 80)),
      pos,
      meaning,
      createdAt: Number.isNaN(Date.parse(word.createdAt))
        ? new Date().toISOString()
        : new Date(word.createdAt).toISOString(),
    };
  }

  function sanitizeLibraryWords(rawWords) {
    const wordMap = new Map();
    (Array.isArray(rawWords) ? rawWords : []).forEach((rawWord) => {
      const word = sanitizeWord(rawWord);
      if (!word) return;
      wordMap.set(normalizeWordKey(word.english), word);
    });
    return [...wordMap.values()];
  }

  function sanitizeLibraries(loadedVocab) {
    let rawLibraries = Array.isArray(loadedVocab.libraries) ? loadedVocab.libraries : [];
    if (rawLibraries.length === 0 && Array.isArray(loadedVocab.words) && loadedVocab.words.length) {
      rawLibraries = [
        {
          id: uid(),
          name: "默认词库",
          createdAt: new Date().toISOString(),
          words: loadedVocab.words,
        },
      ];
    }

    const libraryMap = new Map();
    rawLibraries.forEach((library) => {
      if (!library || typeof library !== "object") return;
      const name = stringValue(library.name).trim().slice(0, 40);
      if (!name) return;
      const key = name.toLocaleLowerCase();
      const words = sanitizeLibraryWords(library.words);
      const existing = libraryMap.get(key);
      if (existing) {
        existing.words = sanitizeLibraryWords([...existing.words, ...words]);
      } else {
        libraryMap.set(key, {
          id: stringValue(library.id) || uid(),
          name,
          createdAt: Number.isNaN(Date.parse(library.createdAt))
            ? new Date().toISOString()
            : new Date(library.createdAt).toISOString(),
          words,
        });
      }
    });
    return [...libraryMap.values()];
  }

  function sanitizeProficiencyRecord(record, fallbackLibraryId = "") {
    if (!record || typeof record !== "object") return null;
    const libraryId = stringValue(record.libraryId || fallbackLibraryId);
    const english = stringValue(record.english).trim();
    const wordKey = normalizeWordKey(record.wordKey || english);
    const testCount = Number(record.testCount);
    const errorCount = Number(record.errorCount);
    if (
      !libraryId ||
      !wordKey ||
      !Number.isInteger(testCount) ||
      testCount <= 0 ||
      !Number.isInteger(errorCount) ||
      errorCount < 0 ||
      errorCount > testCount
    ) {
      return null;
    }
    return {
      libraryId,
      wordKey,
      english: english || wordKey,
      pos: stringValue(record.pos).trim(),
      meaning: stringValue(record.meaning).trim(),
      testCount,
      errorCount,
    };
  }

  function sanitizeWordStats(rawStats, legacyLibraryId = "") {
    if (Array.isArray(rawStats)) {
      return rawStats
        .map((record) => sanitizeProficiencyRecord(record, legacyLibraryId))
        .filter(Boolean);
    }
    if (!rawStats || typeof rawStats !== "object") return [];

    const values = Object.values(rawStats);
    const isLegacy = values.some(
      (value) => value && typeof value === "object" && "testCount" in value,
    );
    const records = [];

    if (isLegacy) {
      Object.entries(rawStats).forEach(([wordKey, value]) => {
        const record = sanitizeProficiencyRecord(
          {
            libraryId: legacyLibraryId,
            wordKey,
            english: wordKey,
            testCount: value?.testCount,
            errorCount: value?.errorCount,
          },
          legacyLibraryId,
        );
        if (record) records.push(record);
      });
      return records;
    }

    Object.entries(rawStats).forEach(([libraryId, bucket]) => {
      if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) return;
      Object.entries(bucket).forEach(([wordKey, value]) => {
        const record = sanitizeProficiencyRecord(
          {
            libraryId,
            wordKey,
            english: wordKey,
            testCount: value?.testCount,
            errorCount: value?.errorCount,
          },
          libraryId,
        );
        if (record) records.push(record);
      });
    });
    return records;
  }

  function rebuildWordStatsFromHistory(testHistory, libraries) {
    const libraryIds = new Set(libraries.map((library) => library.id));
    const proficiency = [];

    testHistory.forEach((record) => {
      if (!libraryIds.has(record.libraryId) || !Array.isArray(record.wordResults)) return;
      record.wordResults.forEach((wordResult) => {
        const key = wordResult.wordKey || normalizeWordKey(wordResult.english || "");
        if (!key) return;
        let entry = proficiency.find(
          (item) => item.libraryId === record.libraryId && item.wordKey === key,
        );
        if (!entry) {
          entry = {
            libraryId: record.libraryId,
            wordKey: key,
            english: wordResult.english || key,
            pos: wordResult.pos || "",
            meaning: wordResult.meaning || "",
            testCount: 0,
            errorCount: 0,
          };
          proficiency.push(entry);
        }
        entry.testCount += 1;
        entry.errorCount += Math.min(
          1,
          Math.max(0, Number(wordResult.errorCount) || 0),
        );
      });
    });
    return proficiency;
  }

  function repairMissingLibraryStats(testHistory, libraries, existingStats) {
    const repaired = Array.isArray(existingStats)
      ? existingStats.map((item) => ({ ...item }))
      : [];
    const existingLibraryIds = new Set(repaired.map((item) => item.libraryId));

    libraries.forEach((library) => {
      if (existingLibraryIds.has(library.id)) return;
      const libraryHistory = testHistory.filter(
        (record) => record.libraryId === library.id && Array.isArray(record.wordResults),
      );
      if (libraryHistory.length === 0) return;
      repaired.push(...rebuildWordStatsFromHistory(libraryHistory, [library]));
    });
    return repaired;
  }

  function stringValue(value) {
    return value === undefined || value === null ? "" : String(value);
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tasks: state.tasks,
          scores: state.scores,
          vocab: {
            daily: state.vocab.daily,
            total: state.vocab.total,
            records: state.vocab.records,
          },
          mocks: state.mocks,
          notes: state.notes,
          noteDraft: state.noteDraft,
        }),
      );
    } catch {
      showToast("本地存储空间不足，本次修改未能保存");
    }
  }

  function saveVocabularyState() {
    try {
      localStorage.setItem(
        VOCAB_STORAGE_KEY,
        JSON.stringify({
          libraries: state.vocab.libraries,
          manageLibraryId: state.vocab.manageLibraryId,
          testLibraryId: state.vocab.testLibraryId,
        }),
      );
    } catch {
      showToast("词库数据未能保存");
    }
  }

  function saveStatsState() {
    try {
      const rawStats = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || "null");
      const existingStats = Array.isArray(rawStats)
        ? rawStats
        : rawStats?.wordStats || [];
      const mergedMap = new Map();

      existingStats.forEach((item) => {
        if (item && item.libraryId && item.wordKey) {
          mergedMap.set(`${item.libraryId}_${item.wordKey}`, item);
        }
      });

      const currentStats = Array.isArray(state.vocab.wordStats)
        ? state.vocab.wordStats
        : [];
      currentStats.forEach((item) => {
        if (!item || !item.libraryId || !item.wordKey) return;
        const key = `${item.libraryId}_${item.wordKey}`;
        if (mergedMap.has(key)) {
          const old = mergedMap.get(key);
          old.testCount = Math.max(old.testCount || 0, item.testCount || 0);
          old.errorCount = Math.max(old.errorCount || 0, item.errorCount || 0);
        } else {
          mergedMap.set(key, item);
        }
      });

      const finalArray = Array.from(mergedMap.values());
      state.vocab.wordStats = finalArray;
      localStorage.setItem(
        STATS_STORAGE_KEY,
        JSON.stringify({ wordStats: finalArray }),
      );
    } catch {
      showToast("熟练度数据未能保存");
    }
  }

  function saveHistoryState() {
    try {
      localStorage.setItem(
        TEST_HISTORY_STORAGE_KEY,
        JSON.stringify({
          testHistory: state.vocab.testHistory,
        }),
      );
    } catch {
      showToast("测试历史未能保存");
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

  function parseVocabularyImportText(text) {
    const lines = stringValue(text)
      .split(/\r?\n/)
      .map((line) => line.replace(/^\uFEFF/, "").trim())
      .filter(Boolean);
    const words = [];
    let skippedCount = 0;

    lines.forEach((line) => {
      const firstComma = line.indexOf(",");
      const secondComma = firstComma >= 0 ? line.indexOf(",", firstComma + 1) : -1;
      if (firstComma < 0 || secondComma < 0) {
        skippedCount += 1;
        return;
      }

      const aliases = parseWordAliases(line.slice(0, firstComma));
      const pos = line
        .slice(firstComma + 1, secondComma)
        .trim()
        .replace(/\s+/g, "");
      const meaning = line
        .slice(secondComma + 1)
        .split(/[,，]/)
        .map((part) => part.trim().replace(/\s+/g, " "))
        .filter(Boolean)
        .join("/");

      if (!aliases.english || !pos || !meaning) {
        skippedCount += 1;
        return;
      }

      words.push({
        english: aliases.english.slice(0, 80),
        synonyms: aliases.synonyms.map((item) => item.slice(0, 80)),
        pos: pos.slice(0, 20),
        meaning: meaning.slice(0, 120),
      });
    });

    return { words, skippedCount };
  }

  function getLibraryById(id) {
    return state.vocab.libraries.find((library) => library.id === id) || null;
  }

  function getManageLibrary() {
    return getLibraryById(state.vocab.manageLibraryId) || state.vocab.libraries[0] || null;
  }

  function getTestLibrary() {
    return getLibraryById(state.vocab.testLibraryId) || state.vocab.libraries[0] || null;
  }

  function getLibraryStats(libraryId) {
    return state.vocab.wordStats.filter((item) => item.libraryId === libraryId);
  }

  function ensureLibrarySelections() {
    const ids = new Set(state.vocab.libraries.map((library) => library.id));
    const fallbackId = state.vocab.libraries[0]?.id || "";
    if (!ids.has(state.vocab.manageLibraryId)) state.vocab.manageLibraryId = fallbackId;
    if (!ids.has(state.vocab.testLibraryId)) state.vocab.testLibraryId = fallbackId;
  }

  function populateLibrarySelects() {
    ensureLibrarySelections();
    const options = state.vocab.libraries.map((library) => ({
      value: library.id,
      label: `${library.name} · ${library.words.length} 词`,
    }));

    [elements.wordManageSelect, elements.testLibrarySelect].forEach((select) => {
      const currentValue =
        select === elements.wordManageSelect
          ? state.vocab.manageLibraryId
          : state.vocab.testLibraryId;
      select.replaceChildren();
      if (options.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "暂无词库";
        select.append(option);
        select.disabled = true;
        return;
      }
      options.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.value;
        option.textContent = item.label;
        select.append(option);
      });
      select.value = currentValue;
      select.disabled = vocabTest.active;
    });
    elements.wordLibraryDelete.disabled = options.length === 0;
  }

  function activateVocabTab(tabName, focusTab = false) {
    vocabTabButtons.forEach((button) => {
      const active = button.dataset.vocabTab === tabName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focusTab) button.focus();
    });
    vocabTabPanels.forEach((panel) => {
      const active = panel.dataset.vocabPanel === tabName;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  }

  function renderWordLibrary() {
    const library = getManageLibrary();
    const words = library
      ? [...library.words].sort((first, second) =>
      first.english.localeCompare(second.english, "en", { sensitivity: "base" }),
        )
      : [];
    elements.wordCount.textContent = String(words.length);
    elements.wordLibraryList.replaceChildren();

    if (words.length === 0) {
      const empty = document.createElement("p");
      empty.className = "word-library-empty";
      empty.textContent = library
        ? "这个词库还没有单词，可以继续导入。"
        : "暂无词库，请先命名并导入一份词库。";
      elements.wordLibraryList.append(empty);
      return;
    }

    words.forEach((word) => {
      const row = document.createElement("div");
      row.className = "word-entry";

      const wordInfo = document.createElement("div");
      wordInfo.className = "word-entry-info";
      const english = document.createElement("strong");
      english.textContent = [word.english, ...word.synonyms].join(" / ");
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
      deleteButton.addEventListener("click", () => deleteVocabWord(library.id, word.id));

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

    const libraryName = elements.wordLibraryName.value.trim();
    if (!libraryName) {
      setWordImportMessage("请先为词库命名。", "error");
      elements.wordLibraryName.focus();
      return;
    }

    const { words: parsedWords, skippedCount } = parseVocabularyImportText(
      elements.wordImportInput.value,
    );

    if (parsedWords.length === 0 && skippedCount === 0) {
      setWordImportMessage("请至少粘贴一行词库内容。", "error");
      elements.wordImportInput.focus();
      return;
    }

    if (parsedWords.length === 0) {
      setWordImportMessage(
        `成功导入 0 个，跳过 ${skippedCount} 个格式异常行。`,
        "error",
      );
      showToast("没有可导入的有效单词");
      return;
    }

    let library = state.vocab.libraries.find(
      (item) => item.name.toLocaleLowerCase() === libraryName.toLocaleLowerCase(),
    );
    if (!library) {
      library = {
        id: uid(),
        name: libraryName.slice(0, 40),
        createdAt: new Date().toISOString(),
        words: [],
      };
      state.vocab.libraries.push(library);
    }

    const wordMap = new Map();
    library.words.forEach((word) => {
      wordMap.set(normalizeWordKey(word.english), word);
    });

    const now = new Date().toISOString();
    let addedCount = 0;
    let updatedCount = 0;
    let mergedSynonymCount = 0;
    parsedWords.forEach((word) => {
      const key = normalizeWordKey(word.english);
      const incomingKeys = new Set(
        [word.english, ...word.synonyms].map((item) => normalizeWordKey(item)),
      );
      const matchingEntries = [...wordMap.entries()].filter(([, existingWord]) => {
          const existingKeys = new Set(
            [existingWord.english, ...(existingWord.synonyms || [])].map((item) =>
              normalizeWordKey(item),
            ),
          );
        return [...incomingKeys].some((item) => existingKeys.has(item));
        });

      if (word.synonyms.length > 0) {
        matchingEntries.forEach(([existingKey]) => wordMap.delete(existingKey));
        mergedSynonymCount += matchingEntries.length;
        wordMap.set(key, {
          id: uid(),
          english: word.english,
          synonyms: word.synonyms,
          pos: word.pos,
          meaning: word.meaning,
          createdAt: now,
        });
        addedCount += 1;
        return;
      }

      const existing = wordMap.get(key);
      if (existing) {
        matchingEntries.forEach(([existingKey]) => {
          if (existingKey !== key) wordMap.delete(existingKey);
        });
        updatedCount += 1;
        wordMap.set(key, {
          ...existing,
          english: word.english,
          synonyms: [],
          pos: word.pos,
          meaning: word.meaning,
        });
      } else if (matchingEntries.length > 0) {
        matchingEntries.forEach(([existingKey]) => wordMap.delete(existingKey));
        updatedCount += 1;
        wordMap.set(key, {
          id: uid(),
          english: word.english,
          synonyms: [],
          pos: word.pos,
          meaning: word.meaning,
          createdAt: now,
        });
      } else {
        addedCount += 1;
        wordMap.set(key, {
          id: uid(),
          english: word.english,
          synonyms: word.synonyms,
          pos: word.pos,
          meaning: word.meaning,
          createdAt: now,
        });
      }
    });

    library.words = [...wordMap.values()];

    state.vocab.manageLibraryId = library.id;
    state.vocab.testLibraryId = library.id;
    saveVocabularyState();
    populateLibrarySelects();
    renderWordLibrary();
    renderWordStats();
    elements.wordImportForm.reset();
    setWordImportMessage(
      `导入完成：新增 ${addedCount} 个，更新替换 ${updatedCount} 个，合并 ${mergedSynonymCount} 个；跳过 ${skippedCount} 个格式异常行。`,
      "success",
    );
    showToast(`词库“${library.name}”已保存`);
  }

  function deleteVocabWord(libraryId, id) {
    if (vocabTest.active) {
      showToast("请先结束当前测试");
      return;
    }
    const library = getLibraryById(libraryId);
    const word = library?.words.find((item) => item.id === id);
    if (!word) return;
    if (!window.confirm(`确定删除单词“${word.english}”吗？`)) return;

    library.words = library.words.filter((item) => item.id !== id);
    const wordKey = normalizeWordKey(word.english);
    state.vocab.wordStats = state.vocab.wordStats.filter(
      (item) => !(item.libraryId === library.id && item.wordKey === wordKey),
    );
    saveVocabularyState();
    saveStatsState();
    saveHistoryState();
    populateLibrarySelects();
    renderWordLibrary();
    renderWordStats();
    showToast("单词已从词库删除");
  }

  function deleteCurrentLibrary() {
    const library = getManageLibrary();
    if (!library) {
      showToast("当前没有可删除的词库");
      return;
    }
    if (!window.confirm(`确定要删除词库 [${library.name}] 吗？该操作不可逆！`)) return;

    const deletingActiveLibrary =
      vocabTest.active && vocabTest.libraryId === library.id;
    if (deletingActiveLibrary) {
      window.clearTimeout(vocabTest.timer);
      vocabTest = {
        active: false,
        libraryId: "",
        libraryName: "",
        mode: "mixed",
        remainingIds: [],
        currentWord: null,
        questionType: "",
        answered: 0,
        correct: 0,
        wrong: 0,
        wrongWords: [],
        wordResults: [],
        locked: false,
        timer: null,
      };
    }

    state.vocab.libraries = state.vocab.libraries.filter((item) => item.id !== library.id);
    state.vocab.wordStats = state.vocab.wordStats.filter(
      (item) => item.libraryId !== library.id,
    );
    state.vocab.testHistory = state.vocab.testHistory.filter(
      (record) => record.libraryId !== library.id && record.libraryName !== library.name,
    );

    if (state.vocab.manageLibraryId === library.id) state.vocab.manageLibraryId = "";
    if (state.vocab.testLibraryId === library.id) state.vocab.testLibraryId = "";

    saveVocabularyState();
    saveStatsState();
    populateLibrarySelects();
    renderWordLibrary();
    renderWordStats();
    renderTestHistory();
    updateTestDashboard();
    syncTestControls();

    const remainingLibrary = getTestLibrary();
    if (remainingLibrary) {
      if (!vocabTest.active) {
        showTestIdle(
          `已选择「${remainingLibrary.name}」`,
          `该词库共有 ${remainingLibrary.words.length} 个单词，点击“开始测试”随机抽题。`,
        );
      }
      showToast(`词库“${library.name}”已删除`);
    } else {
      showTestIdle("暂无可用词库", "请回到“词库管理”重新命名并导入词库。");
      showToast("全部词库已删除，请重新导入");
    }
  }

  function getTestModeLabel(mode) {
    return {
      spelling: "仅拼写",
      choice: "仅选择",
      mixed: "两题型混合",
    }[mode] || "两题型混合";
  }

  function getSelectedTestMode() {
    return elements.testModeInputs.find((input) => input.checked)?.value || "mixed";
  }

  function syncTestModeUI() {
    const mode = vocabTest.active ? vocabTest.mode : getSelectedTestMode();
    elements.testModeInputs.forEach((input) => {
      input.disabled = vocabTest.active;
    });
    elements.testModeStatus.textContent = getTestModeLabel(mode);
  }

  function updateTestDashboard() {
    const answered = vocabTest.correct + vocabTest.wrong;
    const accuracy = answered
      ? Number(((vocabTest.correct / answered) * 100).toFixed(2))
      : 0;
    elements.testAnswered.textContent = String(answered);
    elements.testCorrect.textContent = String(vocabTest.correct);
    elements.testWrong.textContent = String(vocabTest.wrong);
    elements.testAccuracy.textContent = accuracy.toFixed(2);
  }

  function syncTestControls() {
    elements.testStart.disabled = vocabTest.active;
    elements.testStop.disabled = !vocabTest.active;
    elements.wordLibraryName.disabled = vocabTest.active;
    elements.wordImportButton.disabled = vocabTest.active;
    elements.wordImportInput.disabled = vocabTest.active;
    elements.wordManageSelect.disabled = vocabTest.active || state.vocab.libraries.length === 0;
    elements.testLibrarySelect.disabled = vocabTest.active || state.vocab.libraries.length === 0;
    syncTestModeUI();
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
    const mode = getSelectedTestMode();
    const library = getTestLibrary();
    if (!library) {
      showTestIdle("还没有可用词库", "请先在“词库管理”中创建并导入词库。");
      showToast("请先创建词库");
      return;
    }
    if (mode !== "spelling" && library.words.length < 4) {
      showTestIdle(
        "词库至少需要 4 个单词",
        `“${library.name}”目前只有 ${library.words.length} 个单词，选择题和混合模式需要至少 4 个单词。`,
      );
      showToast("请先导入至少 4 个单词");
      return;
    }

    window.clearTimeout(vocabTest.timer);
    vocabTest = {
      active: true,
      libraryId: library.id,
      libraryName: library.name,
      mode,
      remainingIds: library.words.map((word) => word.id),
      currentWord: null,
      questionType: "",
      answered: 0,
      correct: 0,
      wrong: 0,
      wrongWords: [],
      wordResults: [],
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
    const word = getLibraryById(vocabTest.libraryId)?.words.find((item) => item.id === wordId);
    if (!word) {
      nextVocabQuestion();
      return;
    }

    vocabTest.currentWord = word;
    vocabTest.questionType =
      vocabTest.mode === "mixed"
        ? Math.random() < 0.5
          ? "spelling"
          : "choice"
        : vocabTest.mode;
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

    const libraryWords = getLibraryById(vocabTest.libraryId)?.words || [];
    const distractors = shuffle(libraryWords.filter((item) => item.id !== word.id)).slice(0, 3);
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
    const acceptedAnswers = [
      vocabTest.currentWord.english,
      ...(vocabTest.currentWord.synonyms || []),
    ].map((item) => normalizeWordKey(item));
    const normalizedAnswer = normalizeWordKey(answer);
    const isCorrect = acceptedAnswers.includes(normalizedAnswer);
    const matchedSynonym =
      isCorrect && normalizedAnswer !== normalizeWordKey(vocabTest.currentWord.english);
    resolveVocabAnswer(vocabTest.currentWord, isCorrect, matchedSynonym);
  }

  function resolveVocabAnswer(word, isCorrect, matchedSynonym = false) {
    let nextQuestionDelay = 2000;

    if (isCorrect) {
      vocabTest.correct += 1;
      if (matchedSynonym) {
        const standardAnswer = [word.english, ...(word.synonyms || [])].join("/");
        elements.testFeedback.textContent = `同义词正确，标准答案：${standardAnswer}`;
        elements.testFeedback.className = "test-feedback is-correct is-synonym";
        nextQuestionDelay = 2600;
      } else {
        elements.testFeedback.textContent = "回答正确";
        elements.testFeedback.className = "test-feedback is-correct";
        if (vocabTest.questionType === "spelling") nextQuestionDelay = 500;
      }
    } else {
      vocabTest.wrong += 1;
      vocabTest.wrongWords.push({
        english: word.english,
        pos: word.pos,
        meaning: word.meaning,
      });
      elements.testFeedback.textContent = `回答错误，正确答案是 ${word.english}`;
      elements.testFeedback.className = "test-feedback is-wrong";
    }

    const key = normalizeWordKey(word.english);
    vocabTest.wordResults.push({
      wordKey: key,
      english: word.english,
      pos: word.pos,
      meaning: word.meaning,
      errorCount: isCorrect ? 0 : 1,
    });
    updateTestDashboard();

    vocabTest.timer = window.setTimeout(() => {
      vocabTest.timer = null;
      nextVocabQuestion();
    }, nextQuestionDelay);
  }

  function readPersistedProficiencyStats() {
    try {
      const rawStats = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || "null");
      const storedArray = Array.isArray(rawStats)
        ? rawStats
        : rawStats && Array.isArray(rawStats.wordStats)
          ? rawStats.wordStats
          : null;
      if (Array.isArray(storedArray)) {
        return storedArray;
      }
    } catch {
      // Ignore invalid stored data and fall back to memory.
    }
    return Array.isArray(state.vocab.wordStats)
      ? state.vocab.wordStats
      : [];
  }

  function accumulateTestWordStats(libraryId, wordResults) {
    if (!libraryId || !Array.isArray(wordResults) || wordResults.length === 0) {
      return;
    }
    // Merge into the complete persisted array so every library is preserved.
    const proficiency = readPersistedProficiencyStats();

    wordResults.forEach((wordResult) => {
      const key =
        wordResult.wordKey || wordResult.english.trim().toLowerCase();
      if (!key) return;
      let entry = proficiency.find(
        (item) => item.libraryId === libraryId && item.wordKey === key,
      );
      if (!entry) {
        entry = {
          libraryId,
          wordKey: key,
          english: wordResult.english || key,
          pos: wordResult.pos || "",
          meaning: wordResult.meaning || "",
          testCount: 0,
          errorCount: 0,
        };
        proficiency.push(entry);
      }
      entry.testCount += 1;
      entry.errorCount += Math.min(
        1,
        Math.max(0, Number(wordResult.errorCount) || 0),
      );
    });
    state.vocab.wordStats = proficiency;
  }

  function finishVocabTest(reason = "manual") {
    if (!vocabTest.active) return;
    window.clearTimeout(vocabTest.timer);
    vocabTest.timer = null;
    vocabTest.active = false;
    vocabTest.locked = true;

    const total = vocabTest.correct + vocabTest.wrong;
    accumulateTestWordStats(vocabTest.libraryId, vocabTest.wordResults);
    state.vocab.testHistory.push({
      id: uid(),
      createdAt: new Date().toISOString(),
      libraryId: vocabTest.libraryId,
      libraryName: vocabTest.libraryName,
      mode: vocabTest.mode,
      total,
      correct: vocabTest.correct,
      wrong: vocabTest.wrong,
      wrongWords: vocabTest.wrongWords.map((word) => ({ ...word })),
      wordResults: vocabTest.wordResults.map((word) => ({ ...word })),
      accuracy: total
        ? Number(((vocabTest.correct / total) * 100).toFixed(2))
        : 0,
    });
    state.vocab.testLibraryId = vocabTest.libraryId;
    saveVocabularyState();
    saveStatsState();
    saveHistoryState();
    renderTestHistory();
    renderWordStats();
    populateLibrarySelects();
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

      const library = document.createElement("span");
      library.className = "review-library";
      library.textContent = record.libraryName || "默认词库";

      const summary = document.createElement("span");
      summary.className = "review-summary";
      summary.textContent = `${getTestModeLabel(record.mode)} · ${record.total} 题 · 对 ${record.correct} · 错 ${record.wrong}`;

      const accuracy = document.createElement("strong");
      accuracy.className = "review-accuracy";
      const accuracyValue = Number(record.accuracy);
      accuracy.textContent =
        `${Number.isFinite(accuracyValue) ? accuracyValue.toFixed(2) : "0.00"}%`;

      const detailButton = document.createElement("button");
      detailButton.className = "history-detail";
      detailButton.type = "button";
      detailButton.textContent = "查看详情";
      detailButton.setAttribute("aria-label", `查看 ${formatReviewDate(record.createdAt)} 的错题详情`);
      detailButton.addEventListener("click", () => openHistoryDetails(record.id, detailButton));

      const deleteButton = document.createElement("button");
      deleteButton.className = "history-delete";
      deleteButton.type = "button";
      deleteButton.textContent = "删除";
      deleteButton.setAttribute("aria-label", `删除 ${record.libraryName} 的测试记录`);
      deleteButton.addEventListener("click", () => deleteTestHistory(record.id));

      const actions = document.createElement("div");
      actions.className = "history-actions";
      actions.append(detailButton, deleteButton);

      row.append(date, library, summary, accuracy, actions);
      elements.testHistoryList.append(row);
    });
  }

  function openHistoryDetails(id, trigger) {
    const record = state.vocab.testHistory.find((item) => item.id === id);
    if (!record) return;
    const recordDate = new Date(record.createdAt);
    const dateLabel = Number.isNaN(recordDate.getTime())
      ? "--"
      : formatVocabDate(localDateKey(recordDate));

    lastHistoryTrigger = trigger instanceof HTMLElement ? trigger : null;
    elements.historyModalTitle.textContent = `${dateLabel} 测试错题详情`;
    elements.historyModalMeta.textContent =
      `${record.libraryName || "默认词库"} · ${getTestModeLabel(record.mode)} · 错 ${record.wrong} 题`;
    elements.historyModalBody.replaceChildren();

    if (!record.wrongWords || record.wrongWords.length === 0) {
      const perfect = document.createElement("p");
      perfect.className = "history-perfect";
      perfect.textContent =
        record.wrong > 0
          ? "该历史记录未保存具体错题详情。"
          : "太棒了，本次测试全对！";
      elements.historyModalBody.append(perfect);
    } else {
      const list = document.createElement("ul");
      list.className = "history-wrong-list";
      record.wrongWords.forEach((word) => {
        const item = document.createElement("li");
        item.textContent = `${word.english} ${word.pos} ${word.meaning}`;
        list.append(item);
      });
      elements.historyModalBody.append(list);
    }

    elements.historyModal.hidden = false;
    document.body.classList.add("history-modal-open");
    elements.historyModalClose.focus();
  }

  function closeHistoryDetails() {
    if (elements.historyModal.hidden) return;
    elements.historyModal.hidden = true;
    document.body.classList.remove("history-modal-open");
    if (lastHistoryTrigger?.isConnected) lastHistoryTrigger.focus();
    lastHistoryTrigger = null;
  }

  function deleteTestHistory(id) {
    const record = state.vocab.testHistory.find((item) => item.id === id);
    if (!record) return;
    if (!window.confirm("确定删除这条测试历史记录吗？")) return;

    if (Array.isArray(record.wordResults) && record.wordResults.length > 0) {
      const library =
        getLibraryById(record.libraryId) ||
        state.vocab.libraries.find((item) => item.name === record.libraryName);
      const libraryId = library?.id || record.libraryId;
      if (libraryId) {
        record.wordResults.forEach((wordResult) => {
          const key =
            wordResult.wordKey || normalizeWordKey(wordResult.english || "");
          const index = state.vocab.wordStats.findIndex(
            (item) => item.libraryId === libraryId && item.wordKey === key,
          );
          if (index < 0) return;

          const entry = state.vocab.wordStats[index];
          entry.testCount -= 1;
          entry.errorCount = Math.max(
            0,
            entry.errorCount - Math.max(0, Number(wordResult.errorCount) || 0),
          );
          if (entry.testCount <= 0) state.vocab.wordStats.splice(index, 1);
        });
      }
    }

    state.vocab.testHistory = state.vocab.testHistory.filter((item) => item.id !== id);
    saveStatsState();
    saveHistoryState();
    renderTestHistory();
    renderWordStats();
    showToast("测试历史记录已删除");
  }

  function clearAllWordStats() {
    if (!Array.isArray(state.vocab.wordStats) || state.vocab.wordStats.length === 0) {
      showToast("暂无记录可清空");
      return;
    }
    if (!window.confirm("确定要清空所有单词的熟练度记录吗？此操作不可逆！")) return;

    state.vocab.wordStats = [];
    // saveStatsState merges with old data, so reset the stored array first.
    localStorage.setItem(
      STATS_STORAGE_KEY,
      JSON.stringify({ wordStats: [] }),
    );
    saveStatsState();
    renderWordStats();
    showToast("已清空所有单词熟练度记录");
  }

  function renderWordStats() {
    const allStats = Array.isArray(state.vocab.wordStats)
      ? state.vocab.wordStats
      : [];
    elements.wordStatsClear.disabled = allStats.length === 0;
    const rows = allStats
      .filter((item) => item && item.libraryId && item.wordKey && item.testCount > 0)
      .map((stats) => {
        const library = getLibraryById(stats.libraryId);
        const libraryWord = library?.words.find(
          (word) => normalizeWordKey(word.english) === stats.wordKey,
        );
        return {
          stats,
          libraryName: library?.name || "未知词库",
          word: {
            english: stats.english || libraryWord?.english || stats.wordKey,
            pos: stats.pos || libraryWord?.pos || "",
            meaning: stats.meaning || libraryWord?.meaning || "",
          },
        };
      })
      .sort(
        (first, second) =>
          second.stats.errorCount - first.stats.errorCount ||
          second.stats.testCount - first.stats.testCount ||
          first.libraryName.localeCompare(second.libraryName) ||
          first.word.english.localeCompare(second.word.english),
      );

    elements.wordStatsList.replaceChildren();

    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "review-empty";
      empty.textContent = "完成答题后，这里会显示所有词库中需要重点复习的单词。";
      elements.wordStatsList.append(empty);
      return;
    }

    rows.forEach(({ word, stats, libraryName }) => {
      const row = document.createElement("div");
      row.className = "word-stats-row";

      const wordInfo = document.createElement("div");
      wordInfo.className = "word-stats-word";
      const english = document.createElement("strong");
      english.textContent = `${word.english} (${libraryName})`;
      english.title = `${word.english} · ${libraryName}`;
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
  elements.wordManageSelect.addEventListener("change", () => {
    if (vocabTest.active) return;
    state.vocab.manageLibraryId = elements.wordManageSelect.value;
    saveVocabularyState();
    renderWordLibrary();
  });
  elements.wordLibraryDelete.addEventListener("click", deleteCurrentLibrary);
  elements.testLibrarySelect.addEventListener("change", () => {
    if (vocabTest.active) return;
    state.vocab.testLibraryId = elements.testLibrarySelect.value;
    saveVocabularyState();
    renderWordStats();
    const library = getTestLibrary();
    if (library) {
      showTestIdle(
        `已选择「${library.name}」`,
        `这个词库共有 ${library.words.length} 个单词，点击“开始测试”随机抽题。`,
      );
    }
  });
  elements.testModeInputs.forEach((input) => {
    input.addEventListener("change", syncTestModeUI);
  });
  elements.testStart.addEventListener("click", startVocabTest);
  elements.testStop.addEventListener("click", () => finishVocabTest("manual"));
  elements.spellingForm.addEventListener("submit", submitSpellingAnswer);
  elements.historyModalClose.addEventListener("click", closeHistoryDetails);
  elements.historyModal.addEventListener("click", (event) => {
    if (event.target === elements.historyModal) closeHistoryDetails();
  });
  elements.wordStatsClear.addEventListener("click", clearAllWordStats);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeHistoryDetails();
  });
  elements.mockForm.addEventListener("submit", addMock);
  elements.mockListening.addEventListener("input", updateMockPreview);
  elements.mockReading.addEventListener("input", updateMockPreview);
  elements.noteForm.addEventListener("submit", addNote);
  elements.noteInput.addEventListener("input", syncNoteDraft);
  vocabTabButtons.forEach((button, index) => {
    button.addEventListener("click", () => activateVocabTab(button.dataset.vocabTab));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let targetIndex = index;
      if (event.key === "ArrowLeft") targetIndex = (index - 1 + vocabTabButtons.length) % vocabTabButtons.length;
      if (event.key === "ArrowRight") targetIndex = (index + 1) % vocabTabButtons.length;
      if (event.key === "Home") targetIndex = 0;
      if (event.key === "End") targetIndex = vocabTabButtons.length - 1;
      activateVocabTab(vocabTabButtons[targetIndex].dataset.vocabTab, true);
    });
  });

  elements.noteInput.value = state.noteDraft;
  elements.noteChars.textContent = String(state.noteDraft.length);

  updateCountdown();
  renderTasks();
  renderScores();
  renderVocab();
  populateLibrarySelects();
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
