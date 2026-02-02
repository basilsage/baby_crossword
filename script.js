(function () {
  "use strict";

  // --- Puzzle Data ---
  var ROWS = 15;
  var COLS = 11;

  var words = [
    // Across
    { num: 1, dir: "across", answer: "VIETNAM", row: 0, col: 4, clue: "DJ and Marie\u2019s favorite country from their honeymoon." },
    { num: 5, dir: "across", answer: "SEPTEMBER", row: 4, col: 0, clue: "What month did Marie and DJ meet?" },
    { num: 6, dir: "across", answer: "JUNIOR", row: 7, col: 0, clue: "DJ and Marie met during their ___ year at Cal." },
    { num: 8, dir: "across", answer: "OAHU", row: 8, col: 7, clue: "What\u2019s Marie and DJ\u2019s favorite vacation ever?" },
    { num: 10, dir: "across", answer: "CLAREMONT", row: 11, col: 2, clue: "DJ and Marie stayed at this hotel after getting married." },
    { num: 11, dir: "across", answer: "THURSDAY", row: 14, col: 3, clue: "What day of the week is reserved for date nights with DJ and Marie?" },
    // Down
    { num: 2, dir: "down", answer: "TILDEN", row: 0, col: 7, clue: "What park did DJ and Marie get married in?" },
    { num: 3, dir: "down", answer: "SYMPHONY", row: 1, col: 2, clue: "What was DJ and Marie\u2019s first official date?" },
    { num: 4, dir: "down", answer: "SUMMERBEAR", row: 2, col: 5, clue: "\u201cPenny Rabbit and ______\u201d was DJ and Marie\u2019s first dance song." },
    { num: 7, dir: "down", answer: "COLUMBUS", row: 7, col: 7, clue: "What street do DJ and Marie live on?" },
    { num: 9, dir: "down", answer: "ACAI", row: 10, col: 2, clue: "What food do DJ and Marie eat every weekend together?" }
  ];

  // Build set of active cells and their expected letters
  // Key: "row-col", value: expected letter
  var cellData = {};   // "r-c" -> { letter, numbers: [], acrossWord, downWord }
  var clueNumbers = {}; // "r-c" -> number (for first-cell-of-word numbering)

  words.forEach(function (w) {
    for (var i = 0; i < w.answer.length; i++) {
      var r = w.dir === "across" ? w.row : w.row + i;
      var c = w.dir === "across" ? w.col + i : w.col;
      var key = r + "-" + c;
      if (!cellData[key]) {
        cellData[key] = { letter: w.answer[i], acrossWord: null, downWord: null };
      }
      if (w.dir === "across") {
        cellData[key].acrossWord = w;
      } else {
        cellData[key].downWord = w;
      }
      // Mark clue number on first cell
      if (i === 0) {
        clueNumbers[key] = w.num;
      }
    }
  });

  // --- State ---
  var currentDirection = "across"; // or "down"
  var currentCell = null;          // {row, col} of focused cell

  // --- Build Grid ---
  function buildGrid() {
    var grid = document.getElementById("grid");
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var key = r + "-" + c;
        var div = document.createElement("div");
        div.className = "cell";
        div.dataset.row = r;
        div.dataset.col = c;

        if (cellData[key]) {
          // Active cell
          if (clueNumbers[key] !== undefined) {
            var numSpan = document.createElement("span");
            numSpan.className = "clue-number";
            numSpan.textContent = clueNumbers[key];
            div.appendChild(numSpan);
          }
          var input = document.createElement("input");
          input.type = "text";
          input.maxLength = 1;
          input.autocomplete = "off";
          input.dataset.row = r;
          input.dataset.col = c;
          input.addEventListener("focus", onCellFocus);
          input.addEventListener("input", onCellInput);
          input.addEventListener("keydown", onCellKeydown);
          input.addEventListener("mousedown", onCellMousedown);
          div.appendChild(input);
        } else {
          div.classList.add("black");
        }
        grid.appendChild(div);
      }
    }
  }

  // --- Helpers ---
  function getInput(r, c) {
    return document.querySelector('.cell input[data-row="' + r + '"][data-col="' + c + '"]');
  }

  function isActiveCell(r, c) {
    return !!cellData[r + "-" + c];
  }

  function getWordCells(word) {
    var cells = [];
    for (var i = 0; i < word.answer.length; i++) {
      var r = word.dir === "across" ? word.row : word.row + i;
      var c = word.dir === "across" ? word.col + i : word.col;
      cells.push({ row: r, col: c });
    }
    return cells;
  }

  function getCurrentWord() {
    if (!currentCell) return null;
    var key = currentCell.row + "-" + currentCell.col;
    var data = cellData[key];
    if (!data) return null;
    if (currentDirection === "across" && data.acrossWord) return data.acrossWord;
    if (currentDirection === "down" && data.downWord) return data.downWord;
    // Fallback: use whatever direction is available
    return data.acrossWord || data.downWord;
  }

  // --- Highlighting ---
  function clearHighlights() {
    document.querySelectorAll(".cell.current-word").forEach(function (el) {
      el.classList.remove("current-word");
    });
    document.querySelectorAll(".clue-list li.active-clue").forEach(function (el) {
      el.classList.remove("active-clue");
    });
  }

  function highlightCurrentWord() {
    clearHighlights();
    var word = getCurrentWord();
    if (!word) return;
    var cells = getWordCells(word);
    cells.forEach(function (pos) {
      var cellDiv = document.querySelector('.cell[data-row="' + pos.row + '"][data-col="' + pos.col + '"]');
      if (cellDiv) cellDiv.classList.add("current-word");
    });
    // Highlight clue
    var clueId = "clue-" + word.num + "-" + word.dir;
    var clueLi = document.getElementById(clueId);
    if (clueLi) clueLi.classList.add("active-clue");
    updateMobileClueBar();
  }

  function updateMobileClueBar() {
    var barText = document.getElementById("clue-bar-text");
    if (!barText) return;
    var word = getCurrentWord();
    if (word) {
      var dirLabel = word.dir.charAt(0).toUpperCase() + word.dir.slice(1);
      barText.textContent = word.num + " " + dirLabel + ": " + word.clue;
    } else {
      barText.textContent = "Tap a cell to begin";
    }
  }

  // --- Input Handlers ---
  function onCellMousedown(e) {
    var inp = e.target;
    var r = parseInt(inp.dataset.row);
    var c = parseInt(inp.dataset.col);
    // If clicking the already-focused cell, toggle direction
    if (currentCell && currentCell.row === r && currentCell.col === c) {
      var key = r + "-" + c;
      var data = cellData[key];
      if (data.acrossWord && data.downWord) {
        currentDirection = currentDirection === "across" ? "down" : "across";
      }
      highlightCurrentWord();
      e.preventDefault();
    }
  }

  function onCellFocus(e) {
    var inp = e.target;
    var r = parseInt(inp.dataset.row);
    var c = parseInt(inp.dataset.col);
    currentCell = { row: r, col: c };

    // Pick best direction for this cell
    var key = r + "-" + c;
    var data = cellData[key];
    if (currentDirection === "across" && !data.acrossWord && data.downWord) {
      currentDirection = "down";
    } else if (currentDirection === "down" && !data.downWord && data.acrossWord) {
      currentDirection = "across";
    }
    highlightCurrentWord();
  }

  function onCellInput(e) {
    var inp = e.target;
    var val = inp.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
    inp.value = val;

    if (val.length === 1) {
      advanceCursor();
    }

  }

  function advanceCursor() {
    if (!currentCell) return;
    var word = getCurrentWord();
    if (!word) return;
    var dr = word.dir === "across" ? 0 : 1;
    var dc = word.dir === "across" ? 1 : 0;
    var nr = currentCell.row + dr;
    var nc = currentCell.col + dc;
    if (isActiveCell(nr, nc)) {
      var nextInp = getInput(nr, nc);
      if (nextInp) nextInp.focus();
    }
  }

  function retreatCursor() {
    if (!currentCell) return;
    var word = getCurrentWord();
    if (!word) return;
    var dr = word.dir === "across" ? 0 : -1;
    var dc = word.dir === "across" ? -1 : 0;
    var nr = currentCell.row + dr;
    var nc = currentCell.col + dc;
    if (isActiveCell(nr, nc)) {
      var prevInp = getInput(nr, nc);
      if (prevInp) prevInp.focus();
    }
  }

  function onCellKeydown(e) {
    var inp = e.target;
    var r = parseInt(inp.dataset.row);
    var c = parseInt(inp.dataset.col);

    switch (e.key) {
      case "Backspace":
        if (inp.value === "") {
          retreatCursor();
        } else {
          inp.value = "";
      
        }
        e.preventDefault();
        break;
      case "Delete":
        inp.value = "";
    
        e.preventDefault();
        break;
      case "ArrowRight":
        moveTo(r, c + 1);
        e.preventDefault();
        break;
      case "ArrowLeft":
        moveTo(r, c - 1);
        e.preventDefault();
        break;
      case "ArrowDown":
        moveTo(r + 1, c);
        e.preventDefault();
        break;
      case "ArrowUp":
        moveTo(r - 1, c);
        e.preventDefault();
        break;
      case "Tab":
        e.preventDefault();
        moveToNextWord(e.shiftKey);
        break;
      default:
        // If typing a letter, clear the cell first so it gets replaced
        if (/^[a-zA-Z]$/.test(e.key)) {
          inp.value = "";
        }
        break;
    }
  }

  function moveTo(r, c) {
    if (isActiveCell(r, c)) {
      var inp = getInput(r, c);
      if (inp) inp.focus();
    }
  }

  function moveToNextWord(reverse) {
    // Build ordered list of words: across first sorted by num, then down sorted by num
    var acrossWords = words.filter(function (w) { return w.dir === "across"; })
      .sort(function (a, b) { return a.num - b.num; });
    var downWords = words.filter(function (w) { return w.dir === "down"; })
      .sort(function (a, b) { return a.num - b.num; });
    var allWords = acrossWords.concat(downWords);

    var currentWord = getCurrentWord();
    if (!currentWord) {
      // No active clue: jump to first or last word
      var fallback = reverse ? allWords[allWords.length - 1] : allWords[0];
      currentDirection = fallback.dir;
      var fallbackInp = getInput(fallback.row, fallback.col);
      if (fallbackInp) fallbackInp.focus();
      return;
    }

    var idx = -1;
    for (var i = 0; i < allWords.length; i++) {
      if (allWords[i].num === currentWord.num && allWords[i].dir === currentWord.dir) {
        idx = i;
        break;
      }
    }

    var nextIdx;
    if (reverse) {
      nextIdx = (idx - 1 + allWords.length) % allWords.length;
    } else {
      nextIdx = (idx + 1) % allWords.length;
    }

    var nextWord = allWords[nextIdx];
    currentDirection = nextWord.dir;
    var inp = getInput(nextWord.row, nextWord.col);
    if (inp) inp.focus();
  }

  // --- Clue Click ---
  function onClueClick(word) {
    currentDirection = word.dir;
    var inp = getInput(word.row, word.col);
    if (inp) inp.focus();
  }

  // --- Build Clue Lists ---
  function buildClues() {
    var acrossList = document.getElementById("across-clues");
    var downList = document.getElementById("down-clues");

    words.forEach(function (w) {
      var li = document.createElement("li");
      li.id = "clue-" + w.num + "-" + w.dir;
      var numSpan = document.createElement("span");
      numSpan.className = "clue-num";
      numSpan.textContent = w.num + ".";
      li.appendChild(numSpan);
      li.appendChild(document.createTextNode(" " + w.clue));
      li.addEventListener("click", function () { onClueClick(w); });
      if (w.dir === "across") {
        acrossList.appendChild(li);
      } else {
        downList.appendChild(li);
      }
    });
  }

  // --- Check Puzzle ---
  function checkPuzzle() {
    var allCorrect = true;

    words.forEach(function (w) {
      for (var i = 0; i < w.answer.length; i++) {
        var r = w.dir === "across" ? w.row : w.row + i;
        var c = w.dir === "across" ? w.col + i : w.col;
        var inp = getInput(r, c);
        if (!inp) continue;
        var val = inp.value.toUpperCase();
        if (val !== w.answer[i]) {
          allCorrect = false;
        }
      }
    });

    // Clear previous correct state
    document.querySelectorAll(".cell.correct").forEach(function (el) {
      el.classList.remove("correct");
    });

    if (allCorrect) {
      // Show all green briefly then modal
      Object.keys(cellData).forEach(function (key) {
        var parts = key.split("-");
        var cellDiv = document.querySelector('.cell[data-row="' + parts[0] + '"][data-col="' + parts[1] + '"]');
        if (cellDiv) cellDiv.classList.add("correct");
      });
      setTimeout(function () {
        document.getElementById("modal-overlay").classList.add("show");
        launchConfetti();
      }, 400);
    } else {
      document.getElementById("error-modal-overlay").classList.add("show");
    }
  }

  // --- Mobile Clue Bar ---
  function setupViewportTracking() {
    var clueBar = document.getElementById("mobile-clue-bar");
    if (!clueBar) return;

    if (window.visualViewport) {
      var onViewportChange = function () {
        var vv = window.visualViewport;
        var keyboardHeight = window.innerHeight - (vv.offsetTop + vv.height);
        if (keyboardHeight > 0) {
          clueBar.style.bottom = keyboardHeight + "px";
        } else {
          clueBar.style.bottom = "0";
        }
      };
      window.visualViewport.addEventListener("resize", onViewportChange);
      window.visualViewport.addEventListener("scroll", onViewportChange);
    }
  }

  function initMobileClueBar() {
    var prevBtn = document.getElementById("clue-prev");
    var nextBtn = document.getElementById("clue-next");
    if (!prevBtn || !nextBtn) return;

    // Prevent buttons from stealing focus (which would dismiss the keyboard)
    prevBtn.addEventListener("mousedown", function (e) { e.preventDefault(); });
    prevBtn.addEventListener("touchstart", function (e) { e.preventDefault(); });
    nextBtn.addEventListener("mousedown", function (e) { e.preventDefault(); });
    nextBtn.addEventListener("touchstart", function (e) { e.preventDefault(); });

    prevBtn.addEventListener("click", function () { moveToNextWord(true); });
    nextBtn.addEventListener("click", function () { moveToNextWord(false); });

    setupViewportTracking();
  }

  // --- Init ---
  function init() {
    buildGrid();
    buildClues();
    initMobileClueBar();

    document.getElementById("check-btn").addEventListener("click", checkPuzzle);

    document.getElementById("modal-close").addEventListener("click", function () {
      document.getElementById("modal-overlay").classList.remove("show");
      clearConfetti();
    });

    document.getElementById("modal-overlay").addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.remove("show");
        clearConfetti();
      }
    });

    document.getElementById("error-modal-close").addEventListener("click", function () {
      document.getElementById("error-modal-overlay").classList.remove("show");
    });

    document.getElementById("error-modal-overlay").addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.remove("show");
      }
    });


    // Focus first active cell
    var firstInput = getInput(0, 4);
    if (firstInput) firstInput.focus();
  }

  // --- Confetti ---
  var confettiInterval = null;
  var confettiColors = [
    '#FF69B4', '#FFB6C1', '#FF1493', '#FFC0CB',
    '#FFD700', '#87CEEB', '#98FB98', '#DDA0DD',
    '#F0E68C', '#FF6347', '#40E0D0', '#EE82EE'
  ];
  var confettiShapes = ['circle', 'square', 'rectangle'];

  function createConfettiPiece() {
    var container = document.getElementById("confetti-container");
    var piece = document.createElement("div");
    piece.className = "confetti-piece";

    var color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    var shape = confettiShapes[Math.floor(Math.random() * confettiShapes.length)];
    var left = Math.random() * 100;
    var size = Math.random() * 8 + 6;
    var duration = Math.random() * 2 + 2;
    var delay = Math.random() * 0.3;

    piece.style.left = left + "%";
    piece.style.backgroundColor = color;
    piece.style.animationDuration = duration + "s";
    piece.style.animationDelay = delay + "s";

    if (shape === 'circle') {
      piece.style.borderRadius = "50%";
      piece.style.width = size + "px";
      piece.style.height = size + "px";
    } else if (shape === 'rectangle') {
      piece.style.width = (size * 0.6) + "px";
      piece.style.height = (size * 1.4) + "px";
      piece.style.borderRadius = "2px";
    } else {
      piece.style.width = size + "px";
      piece.style.height = size + "px";
      piece.style.borderRadius = "2px";
    }

    container.appendChild(piece);

    // Remove piece after animation ends
    setTimeout(function () {
      if (piece.parentNode) piece.parentNode.removeChild(piece);
    }, (duration + delay) * 1000 + 100);
  }

  function launchConfetti() {
    clearConfetti();
    // Initial burst
    for (var i = 0; i < 60; i++) {
      createConfettiPiece();
    }
    // Continuous stream
    confettiInterval = setInterval(function () {
      for (var j = 0; j < 8; j++) {
        createConfettiPiece();
      }
    }, 300);
  }

  function clearConfetti() {
    if (confettiInterval) {
      clearInterval(confettiInterval);
      confettiInterval = null;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
