// ============================================
// GAME STATE
// ============================================

let game = {
    currentNum: 1,
    score: 0,
    timeLeft: 60,
    isPlaying: false,
    timer: null,
    playerName: '',
    found: new Set(),
    gameEnded: false,
    sessionBest: 0
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Get random color for confetti
 */
function getRandomColor() {
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6fb7', '#a29bfe', '#fd79a8', '#00b894'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// ============================================
// RENDER GRID
// ============================================

/**
 * Render the number grid with shuffled numbers
 */
function renderGrid() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    const numbers = shuffle([...Array(100).keys()].map(i => i + 1));
    
    numbers.forEach(n => {
        const div = document.createElement('div');
        div.className = 'num';
        div.id = 'num-' + n;
        div.textContent = n;
        div.onclick = () => clickNumber(n);
        grid.appendChild(div);
    });
}

// ============================================
// GAME LOGIC
// ============================================

/**
 * Start the game
 */
function startGame() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('⚠️ Please enter your name!');
        nameInput.focus();
        return;
    }
    
    game.playerName = name;
    document.getElementById('playerDisplay').textContent = name;
    document.getElementById('login').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    
    resetGame();
}

/**
 * Reset the game
 */
function resetGame() {
    // Clear timer
    if (game.timer) {
        clearInterval(game.timer);
        game.timer = null;
    }
    
    // Reset state
    game.currentNum = 1;
    game.score = 0;
    game.timeLeft = 60;
    game.isPlaying = false;
    game.found = new Set();
    game.gameEnded = false;
    
    // Render new shuffled grid
    renderGrid();
    
    // Clear messages
    document.getElementById('msg').className = 'msg';
    document.getElementById('msg').textContent = '';
    
    // Update UI
    updateUI();
    
    // Reset timer style
    const timerEl = document.getElementById('timer');
    timerEl.className = 'val timer';
    
    // Enable all numbers
    document.querySelectorAll('.num').forEach(el => {
        el.classList.remove('disabled');
    });
    
    // Start after short delay
    setTimeout(() => {
        game.isPlaying = true;
        startTimer();
        showMessage('🎯 Find number 1 to start!', 'info');
    }, 500);
}

/**
 * Start the timer countdown
 */
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

/**
 * Handle number click
 */
function clickNumber(number) {
    // Check if game is active
    if (!game.isPlaying || game.gameEnded) {
        showMessage('⏳ Game not active! Click "Restart Game"', 'info');
        return;
    }
    
    // Check if already found
    if (game.found.has(number)) {
        showMessage(`✅ ${number} already found!`, 'info');
        return;
    }
    
    const element = document.getElementById('num-' + number);
    
    if (number === game.currentNum) {
        // Correct number!
        game.found.add(number);
        game.score++;
        game.currentNum++;
        
        element.classList.add('found');
        updateUI();
        
        // Check win
        if (game.score === 100) {
            endGame(true);
        } else {
            // Highlight next number
            const nextEl = document.getElementById('num-' + game.currentNum);
            if (nextEl) {
                nextEl.classList.add('current');
                setTimeout(() => {
                    nextEl.classList.remove('current');
                }, 800);
            }
        }
    } else if (number > game.currentNum) {
        // Clicked ahead
        element.classList.add('wrong');
        showMessage(`❌ Wrong! Need ${game.currentNum}`, 'info');
        setTimeout(() => {
            element.classList.remove('wrong');
        }, 400);
    } else {
        // Already passed
        element.classList.add('wrong');
        showMessage(`❌ ${number} already found! Next is ${game.currentNum}`, 'info');
        setTimeout(() => {
            element.classList.remove('wrong');
        }, 400);
    }
}

/**
 * End the game
 */
function endGame(won) {
    if (game.gameEnded) return;
    
    game.gameEnded = true;
    game.isPlaying = false;
    
    // Clear timer
    if (game.timer) {
        clearInterval(game.timer);
        game.timer = null;
    }
    
    // Disable all numbers
    document.querySelectorAll('.num').forEach(el => {
        el.classList.add('disabled');
    });
    
    // Update session best
    if (game.score > game.sessionBest) {
        game.sessionBest = game.score;
        document.getElementById('sessionBest').textContent = game.sessionBest;
        document.getElementById('sessionBestDisplay').textContent = game.sessionBest;
    }
    
    // Show result
    if (won) {
        showMessage(`🎉🎊 PERFECT! ${game.playerName} found all 100 numbers! 🎊🎉`, 'celebrate');
        celebrateWin();
    } else {
        showMessage(`⏰ Time up! ${game.playerName}, you found ${game.score} numbers. Try again! 💪`, 'fail');
    }
    
    updateUI();
}

// ============================================
// UI UPDATES
// ============================================

/**
 * Update the UI with current game state
 */
function updateUI() {
    document.getElementById('timer').textContent = game.timeLeft;
    document.getElementById('score').textContent = game.score;
}

/**
 * Show a message
 */
function showMessage(text, type) {
    const msg = document.getElementById('msg');
    msg.textContent = text;
    msg.className = 'msg ' + type;
    
    // Auto-hide info messages
    if (type === 'info') {
        setTimeout(() => {
            if (msg.className === 'msg info') {
                msg.className = 'msg';
                msg.textContent = '';
            }
        }, 2500);
    }
}

// ============================================
// CELEBRATION EFFECTS
// ============================================

/**
 * Create confetti celebration
 */
function celebrateWin() {
    for (let i = 0; i < 60; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            const size = 8 + Math.random() * 10;
            const duration = 2 + Math.random() * 2;
            const left = Math.random() * 100;
            const isCircle = Math.random() > 0.5;
            
            confetti.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                background: ${getRandomColor()};
                left: ${left}vw;
                top: -10px;
                border-radius: ${isCircle ? '50%' : '2px'};
                animation: confettiFall ${duration}s linear forwards;
                pointer-events: none;
                z-index: 9999;
            `;
            
            document.body.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                confetti.remove();
            }, duration * 1000 + 100);
        }, i * 80);
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    // Enter to start game
    if (e.key === 'Enter' && document.getElementById('login').style.display !== 'none') {
        startGame();
    }
    
    // R to restart
    if ((e.key === 'r' || e.key === 'R') && document.getElementById('gameArea').style.display === 'block') {
        resetGame();
    }
});

// ============================================
// INITIALIZE
// ============================================

/**
 * Initialize the game on page load
 */
window.onload = function() {
    renderGrid();
    document.getElementById('sessionBest').textContent = '0';
    document.getElementById('sessionBestDisplay').textContent = '0';
    
    // Focus on name input
    document.getElementById('playerName').focus();
};