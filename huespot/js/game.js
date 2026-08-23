const screens = {
    menu: document.getElementById('screen-menu'),
    game: document.getElementById('screen-game'),
    gameover: document.getElementById('screen-gameover')
};

const hud = {
    left: document.getElementById('hud-left'),
    center: document.getElementById('timer-text'),
    right: document.getElementById('hud-right')
};

const grid = document.getElementById('grid');
const squares = document.querySelectorAll('.square-div');
const btnTrick = document.getElementById('btn-trick');
const timeAnim = document.getElementById('time-anim');
const modalOverlay = document.getElementById('modal-overlay');

let state = {
    mode: '',
    score: 0,
    level: 1,
    difficulty: 50,
    time: 0,
    isTrickRound: false,
    timerInterval: null,
    zenDifficulty: null
};

let records = JSON.parse(localStorage.getItem('coloristRecords')) || {
    survival: 0,
    progressivo: 0,
    pegadinha: 0
};

let seenTutorials = JSON.parse(localStorage.getItem('coloristTutorials')) || {};

const instructions = {
    tutorial: { title: "Tutorial", text: "Encontre o quadrado com a cor ligeiramente diferente dos outros e toque nele. Vamos testar!" },
    survival: { title: "Survival", text: "Você joga contra o tempo. Acerte para ganhar tempo extra! Conforme sua pontuação sobe, a dificuldade aumenta e você precisará de mais acertos seguidos para ganhar os mesmos segundos." },
    progressivo: { title: "Progressivo", text: "Começa muito fácil, mas a diferença de cores diminui a cada rodada. Até onde você consegue chegar sem errar?" },
    pegadinha: { title: "Pegadinha", text: "Cuidado! Às vezes todos os quadrados serão exatamente iguais. Quando isso acontecer, clique no botão 'Pegadinha!' embaixo do quadro para não perder." },
    zen: { title: "Modo Zen", text: "Sem tempo, sem recordes e a dificuldade não muda. Apenas relaxe e clique nas cores." }
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
    document.body.classList.toggle('in-game', screenName === 'game');
}

function updateMenuRecords() {
    document.getElementById('menu-rec-survival').innerText = `🏆 ${records.survival}`;
    document.getElementById('menu-rec-progressivo').innerText = `🏆 ${records.progressivo}`;
    document.getElementById('menu-rec-pegadinha').innerText = `🏆 ${records.pegadinha}`;
}

function randomizeTitle() {
    const titleElement = document.getElementById('game-title');
    if (!titleElement) return;

    const text = "Colorist";
    const baseColor = generateRandomHexColor();
    const modifiedColor = slightlyModifyHexColor(baseColor, 60);
    const impostorIndex = Math.floor(Math.random() * text.length);

    titleElement.innerHTML = '';

    for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.innerText = text[i];
        span.style.color = (i === impostorIndex) ? modifiedColor : baseColor;
        titleElement.appendChild(span);
    }
}

function showMenu() {
    clearInterval(state.timerInterval);
    updateMenuRecords();
    randomizeTitle();
    switchScreen('menu');
}

function startGame(mode, zenDifficulty = null) {
    state.mode = mode;
    state.zenDifficulty = zenDifficulty;

    let tutKey = mode === 'zen' ? 'zen' : mode;

    if (!seenTutorials[tutKey]) {
        document.getElementById('modal-title').innerText = instructions[tutKey].title;
        document.getElementById('modal-text').innerText = instructions[tutKey].text;
        document.getElementById('chk-dont-show').checked = false;
        modalOverlay.classList.remove('hidden');
    } else {
        initGameParams();
    }
}

function closeModalAndInit() {
    let tutKey = state.mode === 'zen' ? 'zen' : state.mode;
    const dontShow = document.getElementById('chk-dont-show').checked;

    if (dontShow) {
        seenTutorials[tutKey] = true;
        localStorage.setItem('coloristTutorials', JSON.stringify(seenTutorials));
    }

    modalOverlay.classList.add('hidden');
    initGameParams();
}

function initGameParams() {
    state.score = 0;
    state.level = 1;
    state.isTrickRound = false;
    clearInterval(state.timerInterval);

    if (state.mode === 'tutorial') {
        state.difficulty = 80;
        state.time = 0;
    } else if (state.mode === 'survival') {
        state.difficulty = 50;
        state.time = 15;
    } else if (state.mode === 'zen') {
        state.difficulty = state.zenDifficulty;
        state.time = 0;
    } else {
        state.difficulty = 60;
        state.time = 0;
    }

    if (state.mode === 'pegadinha') {
        btnTrick.classList.remove('hidden');
    } else {
        btnTrick.classList.add('hidden');
    }

    if (state.mode === 'survival') {
        state.timerInterval = setInterval(() => {
            state.time--;
            updateHUD();
            if (state.time <= 0) endGame();
        }, 1000);
    }

    switchScreen('game');
    startRound();
}

function showTimeAnimation(text, isNegative = false) {
    timeAnim.innerText = text;
    timeAnim.classList.remove('show', 'negative');

    if (isNegative) {
        timeAnim.classList.add('negative');
    }

    void timeAnim.offsetWidth;
    timeAnim.classList.add('show');
}

function updateHUD() {
    if (state.mode === 'zen' || state.mode === 'tutorial') {
        hud.left.innerText = '';
        hud.center.innerText = state.mode === 'tutorial' ? `Fase ${state.level}/3` : 'Zen';
        hud.right.innerText = '';
        return;
    }

    if (state.mode === 'survival') {
        hud.left.innerText = `Pts: ${state.score}`;
        hud.center.innerText = `${state.time}s`;
        hud.right.innerText = `🏆 ${records.survival}`;
    } else {
        hud.left.innerText = `Lvl: ${state.level}`;
        hud.center.innerText = '';
        hud.right.innerText = `🏆 ${records[state.mode]}`;
    }
}

function startRound() {
    const baseColor = generateRandomHexColor();
    let modifiedColor = slightlyModifyHexColor(baseColor, state.difficulty);
    let correctIndex = Math.floor(Math.random() * squares.length);

    state.isTrickRound = false;

    if (state.mode === 'pegadinha' && Math.random() < 0.15) {
        state.isTrickRound = true;
        modifiedColor = baseColor;
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
    } else {
        if (state.mode === 'survival') {
            state.time -= 3;
            showTimeAnimation('-3s', true);
            updateHUD();

            if (state.time <= 0) {
                endGame();
            }
        } else {
            endGame();
        }
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
    if (state.mode === 'tutorial') {
        state.level++;
        if (state.level > 3) {
            endGame();
            return;
        }
    } else if (state.mode === 'survival') {
        state.score++;
        state.difficulty = Math.max(3, state.difficulty - 1);

        let requiredWinsToGetTime = Math.floor(state.score / 15) + 1;
        if (state.score % requiredWinsToGetTime === 0) {
            state.time += 2;
            showTimeAnimation('+2s');
        }
    } else if (state.mode === 'progressivo' || state.mode === 'pegadinha') {
        state.level++;
        state.difficulty = Math.max(3, state.difficulty - 2);
    } else if (state.mode === 'zen') {
        state.level++;
    }

    startRound();
}

function endGame() {
    clearInterval(state.timerInterval);
    const statsElement = document.getElementById('gameover-stats');

    if (state.mode === 'tutorial') {
        statsElement.innerText = "Você está pronto! Escolha um modo de jogo.";
    } else if (state.mode === 'zen') {
        statsElement.innerText = `Você acertou ${state.level - 1} vezes antes de errar!`;
    } else {
        let currentRecord = records[state.mode];
        let newValue = state.mode === 'survival' ? state.score : state.level;

        if (newValue > currentRecord) {
            records[state.mode] = newValue;
            localStorage.setItem('coloristRecords', JSON.stringify(records));
        }

        if (state.mode === 'survival') {
            statsElement.innerText = `Pontos: ${state.score}`;
        } else {
            statsElement.innerText = `Nível alcançado: ${state.level}`;
        }
    }

    switchScreen('gameover');
}

history.pushState(null, null, location.href);

window.addEventListener('popstate', () => {
    history.pushState(null, null, location.href);

    if (!screens.game.classList.contains('hidden')) {
        showMenu();
    }
});

updateMenuRecords();
randomizeTitle();