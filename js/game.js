const screens = {
    menu: document.getElementById('screen-menu'),
    game: document.getElementById('screen-game'),
    gameover: document.getElementById('screen-gameover')
};

const hud = {
    left: document.getElementById('hud-left'),
    center: document.getElementById('hud-center'),
    right: document.getElementById('hud-right')
};

const grid = document.getElementById('grid');
const squares = document.querySelectorAll('.square-div');
const btnTrick = document.getElementById('btn-trick');

let state = {
    mode: '',
    score: 0,
    level: 1,
    difficulty: 50,
    time: 0,
    isTrickRound: false,
    timerInterval: null
};

let records = JSON.parse(localStorage.getItem('coloristRecords')) || {
    survival: 0,
    progressivo: 0,
    pegadinha: 0
};

function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

function generateRandomHexColor() {
    let color = '#';
    for (let i = 0; i < 3; i++) {
        color += componentToHex(Math.floor(Math.random() * 256));
    }
    return color;
}

function slightlyModifyHexColor(hexColor, factor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const newR = r > 127 ? r - factor : r + factor;
    const newG = g > 127 ? g - factor : g + factor;
    const newB = b > 127 ? b - factor : b + factor;

    return "#" + componentToHex(newR) + componentToHex(newG) + componentToHex(newB);
}

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

function showMenu() {
    clearInterval(state.timerInterval);
    switchScreen('menu');
}

function updateHUD() {
    if (state.mode === 'zen') {
        hud.left.innerText = '';
        hud.center.innerText = 'Zen';
        hud.right.innerText = '';
        return;
    }

    if (state.mode === 'survival') {
        hud.left.innerText = `Pts: ${state.score}`;
        hud.center.innerText = `${state.time}s`;
        hud.right.innerText = `Rec: ${records.survival}`;
    } else {
        hud.left.innerText = `Lvl: ${state.level}`;
        hud.center.innerText = '';
        hud.right.innerText = `Rec: ${records[state.mode]}`;
    }
}

function startGame(mode, zenDifficulty = null) {
    state = {
        mode: mode,
        score: 0,
        level: 1,
        difficulty: zenDifficulty || 60,
        time: mode === 'survival' ? 15 : 0,
        isTrickRound: false,
        timerInterval: null
    };

    if (mode === 'pegadinha') {
        btnTrick.classList.remove('hidden');
    } else {
        btnTrick.classList.add('hidden');
    }

    if (mode === 'survival') {
        state.timerInterval = setInterval(() => {
            state.time--;
            updateHUD();
            if (state.time <= 0) endGame();
        }, 1000);
    }

    switchScreen('game');
    startRound();
}

function startRound() {
    const baseColor = generateRandomHexColor();
    let modifiedColor = slightlyModifyHexColor(baseColor, state.difficulty);
    let correctIndex = Math.floor(Math.random() * squares.length);

    state.isTrickRound = false;

    if (state.mode === 'pegadinha') {
        if (Math.random() < 0.15) {
            state.isTrickRound = true;
            modifiedColor = baseColor;
        }
    }

    squares.forEach((square, index) => {
        square.onclick = () => handleSquareClick(index === correctIndex);
        square.style.backgroundColor = (index === correctIndex) ? modifiedColor : baseColor;
    });

    updateHUD();
}

function handleSquareClick(isCorrect) {
    if (state.mode === 'pegadinha' && state.isTrickRound) {
        endGame();
        return;
    }

    if (isCorrect) {
        advanceProgress();
    } else if (state.mode !== 'zen') {
        endGame();
    } else {
        startRound();
    }
}

function handleTrickButtonClick() {
    if (state.mode !== 'pegadinha') return;

    if (state.isTrickRound) {
        advanceProgress();
    } else {
        endGame();
    }
}

function advanceProgress() {
    if (state.mode === 'survival') {
        state.score++;
        state.time += 2;
    } else if (state.mode === 'progressivo' || state.mode === 'pegadinha') {
        state.level++;
        state.difficulty = Math.max(3, state.difficulty - 2);
    }

    startRound();
}

function endGame() {
    clearInterval(state.timerInterval);

    let currentRecord = records[state.mode];
    let newValue = state.mode === 'survival' ? state.score : state.level;

    if (newValue > currentRecord) {
        records[state.mode] = newValue;
        localStorage.setItem('coloristRecords', JSON.stringify(records));
    }

    const statsElement = document.getElementById('gameover-stats');
    if (state.mode === 'survival') {
        statsElement.innerText = `Pontos: ${state.score}`;
    } else if (state.mode !== 'zen') {
        statsElement.innerText = `Nível alcançado: ${state.level}`;
    } else {
        statsElement.innerText = 'Espero que tenha relaxado!';
    }

    switchScreen('gameover');
}