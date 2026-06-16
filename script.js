// ============================================
// GAME STATE
// ============================================

const game = {
    currentNum: 1,
    score: 0,
    timeLeft: 60,
    isPlaying: false,
    timer: null,
    playerName: '',
    found: new Set(),
    gameEnded: false,
    sessionBest: 0,
    passwordVerified: false,
    numbers: [],
    gridUnlocked: false
};

const SIZE_CLASSES = ['size-xs', 'size-sm', 'size-md', 'size-lg', 'size-xl', 'size-xxl'];
const CELLS = 9;
const TOTAL_NUMBERS = 100;
const PASSWORD = 'Srm@123';

// ============================================
// UTILITY FUNCTIONS
// ============================================

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getRandomSize() {
    return SIZE_CLASSES[Math.floor(Math.random() * SIZE_CLASSES.length)];
}

function getRandomColor() {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6fb7', '#a29bfe', '#fd79a8', '#00b894', '#fdcb6e',
        '#e17055'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// ============================================
// GENERATE NUMBERS - No consecutive adjacency
// ============================================

function generateNonAdjacentNumbers() {
    const numbers = [];
    const available = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const grid = [];

    // Create 9 cells with approximately equal distribution
    const perCell = Math.ceil(TOTAL_NUMBERS / CELLS);
    const distribution = [];

    for (let i = 0; i < CELLS; i++) {
        const count = Math.min(perCell, TOTAL_NUMBERS - i * perCell);
        distribution.push(count > 0 ? count : 0);
    }

    // Shuffle available numbers
    shuffle(available);

    // Distribute numbers to cells
    let idx = 0;
    for (let cell = 0; cell < CELLS; cell++) {
        const cellNumbers = [];
        const count = distribution[cell] || 0;

        for (let i = 0; i < count && idx < available.length; i++) {
            cellNumbers.push(available[idx++]);
        }

        // Sort each cell's numbers
        cellNumbers.sort((a, b) => a - b);

        // Shuffle within cell to avoid adjacency
        shuffle(cellNumbers);

        // Ensure no consecutive numbers are adjacent within the cell
        for (let i = 0; i < cellNumbers.length - 1; i++) {
            if (Math.abs(cellNumbers[i] - cellNumbers[i + 1]) === 1) {
                // Swap with a later number if possible
                for (let j = i + 2; j < cellNumbers.length; j++) {
                    if (Math.abs(cellNumbers[i] - cellNumbers[j]) !== 1 &&
                        Math.abs(cellNumbers[i + 1] - cellNumbers[j]) !== 1) {
                        [cellNumbers[i + 1], cellNumbers[j]] = [cellNumbers[j], cellNumbers[i + 1]];
                        break;
                    }
                }
            }
        }

        grid.push(cellNumbers);
    }

    return grid;
}

// ============================================
// RENDER GRID
// ============================================

function renderGrid() {
    const grid = generateNonAdjacentNumbers();

    for (let cellIdx = 0; cellIdx < CELLS; cellIdx++) {
        const cell = document.getElementById('cell-' + cellIdx);
        // Clear cell but keep the label
        const label = cell.querySelector('.cell-label');
        cell.innerHTML = '';
        cell.appendChild(label);

        const numbers = grid[cellIdx] || [];

        numbers.forEach(n => {
            const div = document.createElement('div');
            div.className = 'num ' + getRandomSize();
            div.id = 'num-' + n;
            div.textContent = n;
            div.dataset.number = n;
            div.onclick = () => clickNumber(n);
            cell.appendChild(div);
        });
    }
}

// ============================================
// GAME LOGIC
// ============================================

function startGame() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();

    if (!name) {
        alert('⚠️ Please enter your name!');
        nameInput.focus();
        return;
    }

    game.playerName = name;
    game.passwordVerified = false;
    game.gridUnlocked = false;

    document.getElementById('playerDisplay').textContent = name;
    document.getElementById('login').style.display = 'none';
    const gameArea = document.getElementById('gameArea');
    gameArea.style.display = 'flex';
    gameArea.style.flexDirection = 'column';
    gameArea.style.flex = '1';
    gameArea.style.minHeight = '0';

    // Hide grid lines initially
    document.getElementById('masterGrid').classList.remove('show-grid');

    resetGame();
}

function resetGame() {
    if (game.timer) {
        clearInterval(game.timer);
        game.timer = null;
    }

    game.currentNum = 1;
    game.score = 0;
    game.timeLeft = 60;
    game.isPlaying = false;
    game.found = new Set();
    game.gameEnded = false;
    game.passwordVerified = false;
    game.gridUnlocked = false;

    // Hide grid lines
    document.getElementById('masterGrid').classList.remove('show-grid');
    document.getElementById('passwordOverlay').classList.remove('active');

    renderGrid();

    document.getElementById('msg').className = 'msg';
    document.getElementById('msg').textContent = '';

    updateUI();

    const timerEl = document.getElementById('timer');
    timerEl.className = 'val timer';

    document.querySelectorAll('.num').forEach(el => {
        el.classList.remove('disabled');
        el.classList.remove('found');
        el.classList.remove('current');
        el.classList.remove('wrong');
    });

    // Reset leaderboard display
    displayLeaderboard();

    setTimeout(() => {
        game.isPlaying = true;
        startTimer();
        showMessage('🎯 Find number 1 to start!', 'info');
    }, 500);
}

function startTimer() {
    game.timer = setInterval(() => {
        game.timeLeft--;
        updateUI();

        const timerEl = document.getElementById('timer');
        if (game.timeLeft <= 5) {
            timerEl.className = 'val timer danger';
        } else if (game.timeLeft <= 15) {
            timerEl.className = 'val timer warning';
        }

        if (game.timeLeft <= 0) {
            endGame(false);
        }
    }, 1000);
}

function clickNumber(number) {
    if (!game.isPlaying || game.gameEnded) {
        showMessage('⏳ Game over! Click "Restart" to play again.', 'info');
        return;
    }

    if (game.found.has(number)) {
        showMessage(`✅ ${number} already found!`, 'info');
        return;
    }

    const element = document.getElementById('num-' + number);
    if (!element) return;

    if (number === game.currentNum) {
        // Correct!
        game.found.add(number);
        game.score++;
        game.currentNum++;

        element.classList.add('found');
        element.classList.remove('current');
        updateUI();

        if (game.score === TOTAL_NUMBERS) {
            endGame(true);
        } else {
            // Highlight next number
            const nextEl = document.getElementById('num-' + game.currentNum);
            if (nextEl) {
                nextEl.classList.add('current');
            }
            showMessage(`✅ Found ${number}! Next: ${game.currentNum}`, 'info');
        }
    } else if (number > game.currentNum) {
        // Wrong - clicked ahead
        element.classList.add('wrong');
        const origBg = element.style.background;
        showMessage(`❌ Wrong! Need ${game.currentNum}`, 'info');
        setTimeout(() => {
            element.classList.remove('wrong');
        }, 500);
    } else {
        // Wrong - already passed
        element.classList.add('wrong');
        showMessage(`❌ ${number} already found! Next is ${game.currentNum}`, 'info');
        setTimeout(() => {
            element.classList.remove('wrong');
        }, 500);
    }
}

function endGame(won) {
    if (game.gameEnded) return;

    game.gameEnded = true;
    game.isPlaying = false;

    if (game.timer) {
        clearInterval(game.timer);
        game.timer = null;
    }

    // Disable all numbers
    document.querySelectorAll('.num').forEach(el => {
        el.classList.add('disabled');
        el.classList.remove('current');
    });

    // Update session best
    if (game.score > game.sessionBest) {
        game.sessionBest = game.score;
    }

    // Save to leaderboard if score > 0
    if (game.score > 0) {
        saveToLeaderboard(game.playerName, game.score);
    }

    if (won) {
        showMessage(`🎉🎊 PERFECT! ${game.playerName} found all 100 numbers! 🎊🎉`, 'celebrate');
        celebrateWin();
    } else {
        showMessage(`⏰ Time up! ${game.playerName}, you found ${game.score} numbers.`, 'fail');
    }

    updateUI();

    // Show password overlay after delay
    setTimeout(() => {
        showPasswordPrompt();
    }, 1500);
}

// ============================================
// PASSWORD PROMPT
// ============================================

function showPasswordPrompt() {
    document.getElementById('finalName').textContent = '👤 ' + game.playerName;
    document.getElementById('finalScore').textContent = '🎯 Score: ' + game.score + ' / 100';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').classList.remove('show');
    document.getElementById('passwordOverlay').classList.add('active');

    // Focus on password input
    setTimeout(() => {
        document.getElementById('passwordInput').focus();
    }, 300);
}

function verifyPassword() {
    const input = document.getElementById('passwordInput');
    const error = document.getElementById('passwordError');

    if (input.value.trim() === PASSWORD) {
        error.classList.remove('show');
        game.passwordVerified = true;
        game.gridUnlocked = true;

        // Show grid lines
        document.getElementById('masterGrid').classList.add('show-grid');

        // Close overlay
        document.getElementById('passwordOverlay').classList.remove('active');

        showMessage('🔓 Grid unlocked! 3×3 structure revealed.', 'success');

        // Re-enable numbers for viewing (but not clicking)
        document.querySelectorAll('.num').forEach(el => {
            el.classList.remove('disabled');
            el.style.cursor = 'default';
            el.onclick = null;
        });

        // Update leaderboard again
        displayLeaderboard();

    } else {
        error.classList.add('show');
        input.value = '';
        input.focus();
        setTimeout(() => {
            error.classList.remove('show');
        }, 3000);
    }
}

// Handle Enter key on password input
document.getElementById('passwordInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        verifyPassword();
    }
});

// ============================================
// LEADERBOARD (Local Storage)
// ============================================

function getLeaderboard() {
    try {
        return JSON.parse(localStorage.getItem('srmLeaderboard')) || [];
    } catch {
        return [];
    }
}

function saveToLeaderboard(name, score) {
    let board = getLeaderboard();
    board.push({ name, score, date: new Date().toLocaleString() });
    board.sort((a, b) => b.score - a.score);
    board = board.slice(0, 10);
    localStorage.setItem('srmLeaderboard', JSON.stringify(board));
    displayLeaderboard();
}

function displayLeaderboard() {
    const board = getLeaderboard();
    const list = document.getElementById('leaderboardList');

    if (board.length === 0) {
        list.innerHTML = '<div class="no-scores">No scores yet. Be the first!</div>';
        return;
    }

    list.innerHTML = board.map((item, index) => {
        let rankClass = '';
        let rankIcon = `#${index + 1}`;
        if (index === 0) { rankClass = 'top1';
            rankIcon = '🥇'; } else if (index === 1) { rankClass = 'top2';
            rankIcon = '🥈'; } else if (index === 2) { rankClass = 'top3';
            rankIcon = '🥉'; }

        return `<div class="lb-item ${rankClass}">
                    <span class="rank">${rankIcon}</span>
                    <span class="name">${escapeHtml(item.name)}</span>
                    <span class="score">${item.score}</span>
                </div>`;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// UI UPDATES
// ============================================

function updateUI() {
    document.getElementById('timer').textContent = game.timeLeft;
    document.getElementById('score').textContent = game.score;
    document.getElementById('sessionBest').textContent = game.sessionBest;
}

function showMessage(text, type) {
    const msg = document.getElementById('msg');
    msg.textContent = text;
    msg.className = 'msg ' + type;

    if (type === 'info') {
        setTimeout(() => {
            if (msg.className === 'msg info') {
                msg.className = 'msg';
                msg.textContent = '';
            }
        }, 2000);
    }
}

// ============================================
// CELEBRATION EFFECTS
// ============================================

function celebrateWin() {
    for (let i = 0; i < 80; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            const size = 6 + Math.random() * 12;
            const duration = 2 + Math.random() * 3;
            const left = Math.random() * 100;
            const isCircle = Math.random() > 0.5;

            confetti.style.cssText = `
                        position: fixed;
                        width: ${size}px;
                        height: ${size * (0.6 + Math.random() * 0.8)}px;
                        background: ${getRandomColor()};
                        left: ${left}vw;
                        top: -10px;
                        border-radius: ${isCircle ? '50%' : '2px'};
                        animation: confettiFall ${duration}s linear forwards;
                        pointer-events: none;
                        z-index: 9999;
                        box-shadow: 0 0 10px rgba(255,255,255,0.2);
                    `;

            document.body.appendChild(confetti);

            setTimeout(() => {
                confetti.remove();
            }, duration * 1000 + 100);
        }, i * 60);
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('login').style.display !== 'none') {
        startGame();
    }
    if ((e.key === 'r' || e.key === 'R') &&
        document.getElementById('gameArea').style.display === 'flex' &&
        !document.getElementById('passwordOverlay').classList.contains('active')) {
        resetGame();
    }
    if (e.key === 'Escape' && document.getElementById('passwordOverlay').classList.contains('active')) {
        // Allow closing password overlay only if already verified
        if (game.passwordVerified) {
            document.getElementById('passwordOverlay').classList.remove('active');
        }
    }
});

// ============================================
// INITIALIZE
// ============================================

window.onload = function() {
    // Initial render
    renderGrid();
    document.getElementById('sessionBest').textContent = '0';
    displayLeaderboard();
    document.getElementById('playerName').focus();
};