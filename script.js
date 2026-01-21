/* --- Game State --- */
const STATE = {
  mode: 'instant', // 'instant' | 'test'
  draggedItem: null,
  totalTries: 0,
  correctTries: 0,
  testTimer: null,
  testTimeLeft: 60,
  testDurationIndex: 1, // 0:30s, 1:60s, 2:90s
  testStarted: false,
  testLocked: false,
  testChoices: [30, 60, 90]
};

const UI = {
  zones: document.querySelectorAll('.drop-zone'),
  optionsGrid: document.getElementById('options-grid'),
  msg: document.getElementById('msg'),
  modeBtn: document.getElementById('mode-btn'),
  timeBtn: document.getElementById('time-btn'),
  resetBtn: document.getElementById('reset-btn'),
  checkBtn: document.getElementById('check-btn'),
  timerDisplay: document.getElementById('timer-display'),
  scoreDisplay: document.getElementById('score-display')
};

/* --- Initialization --- */
function init() {
  setupData();
  setupEventListeners();
  updateUI();
}

function setupData() {
  const items = Array.from(document.querySelectorAll('.item'));
  // Shuffle initially
  items.sort(() => Math.random() - 0.5);
  items.forEach(item => UI.optionsGrid.appendChild(item));
}

function setupEventListeners() {
  // Drag Events
  document.querySelectorAll('.item').forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
  });

  UI.optionsGrid.addEventListener('dragover', e => e.preventDefault());
  UI.optionsGrid.addEventListener('drop', handleDropBackToOptions);

  UI.zones.forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => handleDropInZone(e, zone));
  });

  // Controls
  UI.modeBtn.addEventListener('click', toggleMode);
  UI.timeBtn.addEventListener('click', cycleTime);
  UI.resetBtn.addEventListener('click', resetGame);
  UI.checkBtn.addEventListener('click', checkAnswersTest);
}

/* --- Drag & Drop Logic --- */
function handleDragStart(e) {
  if (STATE.mode === 'test') {
    if (STATE.testLocked) {
      e.preventDefault();
      return;
    }
    startTestTimer();
  }
  
  STATE.draggedItem = e.target;
  e.target.classList.add('dragging');
  // Hide success messages on interaction
  hideMsg();
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  UI.zones.forEach(z => z.classList.remove('drag-over'));
}

function handleDropBackToOptions(e) {
  if (!STATE.draggedItem) return;
  if (STATE.mode === 'test' && STATE.testLocked) return;

  resetItemState(STATE.draggedItem);
  UI.optionsGrid.appendChild(STATE.draggedItem);
  updateCheckBtn();
}

function handleDropInZone(e, zone) {
  if (!STATE.draggedItem) return;
  if (STATE.mode === 'test' && STATE.testLocked) return;

  const zoneType = zone.dataset.type;
  zone.querySelector('.zone-content').appendChild(STATE.draggedItem);
  zone.classList.remove('drag-over');

  // Logic based on mode
  if (STATE.mode === 'instant') {
    handleInstantFeedback(STATE.draggedItem, zoneType);
  } else {
    // In test mode, just place it. Validate later.
    resetItemState(STATE.draggedItem); // Clear any previous marks
    updateCheckBtn();
  }
}

function handleInstantFeedback(item, zoneType) {
  STATE.totalTries++;
  const isCorrect = item.dataset.answer === zoneType;

  if (isCorrect) {
    STATE.correctTries++;
    setItemStatus(item, 'correct');
    checkWinCondition();
  } else {
    setItemStatus(item, 'wrong');
    // Snap back after delay
    setTimeout(() => {
        if (item.classList.contains('wrong')) {
             resetItemState(item);
             UI.optionsGrid.appendChild(item);
        }
    }, 600);
  }
  updateScore();
}

/* --- Mode & Timer Logic --- */
function toggleMode() {
  STATE.mode = STATE.mode === 'instant' ? 'test' : 'instant';
  resetGame();
}

function cycleTime() {
  if (STATE.mode !== 'test') return;
  STATE.testDurationIndex = (STATE.testDurationIndex + 1) % STATE.testChoices.length;
  resetGame(); // Changing time resets the board in the original game logic
}

function startTestTimer() {
  if (STATE.testStarted || STATE.testLocked || STATE.mode !== 'test') return;
  
  STATE.testStarted = true;
  STATE.testTimeLeft = STATE.testChoices[STATE.testDurationIndex];
  updateTimerDisplay();

  STATE.testTimer = setInterval(() => {
    STATE.testTimeLeft--;
    updateTimerDisplay();

    if (STATE.testTimeLeft <= 0) {
      clearInterval(STATE.testTimer);
      checkAnswersTest(true); // Auto-check on timeout
    }
  }, 1000);
}

function checkAnswersTest(isTimeout = false) {
  if (STATE.mode !== 'test' || STATE.testLocked) return;
  
  if (!isTimeout) clearInterval(STATE.testTimer);
  STATE.testLocked = true;
  
  let score = 0;
  const items = Array.from(document.querySelectorAll('.item'));
  
  items.forEach(item => {
    const parentZone = item.closest('.drop-zone');
    if (parentZone) {
      const isCorrect = item.dataset.answer === parentZone.dataset.type;
      setItemStatus(item, isCorrect ? 'correct' : 'wrong');
      if (isCorrect) score++;
    } else {
        // Not placed items count as wrong in score, but visually stay neutral
    }
  });

  UI.scoreDisplay.textContent = `Score: ${score} / 10`;
  
  const msg = score === 10 ? 
    `Perfect Score! ${score}/10` : 
    `Test Completed. Score: ${score}/10`;
    
  showMsg(msg, score === 10 ? 'success' : 'neutral');
  if (score === 10) fireConfetti();
  
  UI.checkBtn.disabled = true;
}

/* --- Helpers --- */
function resetGame() {
  // Clear Timer
  clearInterval(STATE.testTimer);
  STATE.testStarted = false;
  STATE.testLocked = false;
  STATE.testTimeLeft = STATE.testChoices[STATE.testDurationIndex];
  
  // Reset Stats
  STATE.totalTries = 0;
  STATE.correctTries = 0;

  // Reset UI Items
  const items = Array.from(document.querySelectorAll('.item'));
  items.forEach(item => {
    resetItemState(item);
    UI.optionsGrid.appendChild(item);
  });
  
  // Shuffle again
  for (let i = UI.optionsGrid.children.length; i >= 0; i--) {
      UI.optionsGrid.appendChild(UI.optionsGrid.children[Math.random() * i | 0]);
  }

  hideMsg();
  updateUI();
}

function resetItemState(item) {
  item.classList.remove('correct', 'wrong');
  item.textContent = item.dataset.short; // Reset text
}

function setItemStatus(item, status) {
  item.classList.remove('correct', 'wrong');
  item.classList.add(status);
  // Optional: show full name on correct
  if (status === 'correct') {
      item.textContent = item.dataset.full || item.textContent;
  }
}

function checkWinCondition() {
  const items = document.querySelectorAll('.item');
  const allCorrect = Array.from(items).every(i => i.classList.contains('correct'));
  
  if (allCorrect) {
    showMsg(`Success! ${STATE.correctTries}/${STATE.totalTries} tries`, 'success');
    fireConfetti();
  }
}

function updateCheckBtn() {
  if (STATE.mode === 'test' && !STATE.testLocked) {
      const placedCount = document.querySelectorAll('.drop-zone .item').length;
      UI.checkBtn.disabled = placedCount !== 10;
  } else {
      UI.checkBtn.disabled = true;
  }
}

function updateScore() {
    if (STATE.mode === 'instant') {
        UI.scoreDisplay.textContent = `Score: ${STATE.correctTries} / ${STATE.totalTries}`;
    } else {
        UI.scoreDisplay.textContent = `Score: 0 / 0`;
    }
}

function updateTimerDisplay() {
    UI.timerDisplay.textContent = `${STATE.testTimeLeft}s`;
}

function updateUI() {
  // Mode Button
  UI.modeBtn.textContent = STATE.mode === 'instant' ? '⚡ Training' : '🧪 Test Mode';
  
  // Visibility
  const isTest = STATE.mode === 'test';
  UI.timeBtn.style.display = isTest ? 'inline-flex' : 'none';
  UI.timerDisplay.style.display = isTest ? 'block' : 'none';
  UI.checkBtn.style.display = isTest ? 'inline-flex' : 'none';
  UI.checkBtn.disabled = true; // Initially disabled until all placed

  // Time Button Text
  UI.timeBtn.textContent = `⏱️ ${STATE.testChoices[STATE.testDurationIndex]}s`;
  
  updateScore();
  updateTimerDisplay();
}

function showMsg(text, type = 'neutral') {
  UI.msg.textContent = text;
  UI.msg.className = 'feedback-msg visible ' + type;
}

function hideMsg() {
  UI.msg.classList.remove('visible');
}

/* --- Confetti Effect (Simple Implementation) --- */
function fireConfetti() {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };

  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }));
  }

  // We need the confetti library. For now, we'll assume it's loaded via CDN 
  // or add a simple fallback if not present.
  if (typeof confetti === 'function') {
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  } else {
      console.log('Confetti! (Library not loaded)');
  }
}

// Start
init();
