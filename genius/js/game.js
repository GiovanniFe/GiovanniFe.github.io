const screens = {
    menu: document.getElementById('screen-menu'),
    game: document.getElementById('screen-game'),
    pause: document.getElementById('screen-pause'),
    gameover: document.getElementById('screen-gameover')
};

const levelText = document.getElementById('level-text');
const buttons = Array.from(document.querySelectorAll('.genius-btn'));
const btnClassic = document.getElementById('btn-classic');
const btnQuit = document.getElementById('btn-quit');
const btnBackMenu = document.getElementById('btn-back-menu');
const gameoverStats = document.getElementById('gameover-stats');
const menuRecClassic = document.getElementById('menu-rec-classic');
const btnPause = document.getElementById('btn-pause');
const btnResume = document.getElementById('btn-resume');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const frequencies = [329.63, 261.63, 220.00, 164.81];

let state = {
    sequence: [],
    playerStep: 0,
    level: 1,
    isPlayerTurn: false,
    playbackIndex: 0,
    playbackInterval: null,
    gameTimeout: null,
    resumeCallback: null,
    isPaused: false
};

let record = localStorage.getItem('geniusRecord') || 0;

function playTone(index) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequencies[index];
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
    oscillator.stop(audioCtx.currentTime + 0.5);
}

function switchScreen(screenName) {
    Object.values(screens).forEach(s => {
        if (s) s.classList.add('hidden');
    });
    if (screens[screenName]) {
        screens[screenName].classList.remove('hidden');
    }
    document.body.classList.toggle('in-game', screenName === 'game' || screenName === 'pause');
}

function updateMenuRecords() {
    menuRecClassic.innerText = `🏆 ${record}`;
}

function showMenu() {
    clearInterval(state.playbackInterval);
    clearTimeout(state.gameTimeout);
    state.isPaused = false;
    state.resumeCallback = null;
    updateMenuRecords();
    switchScreen('menu');
}

function setGameTimeout(callback, delay) {
    clearTimeout(state.gameTimeout);
    state.resumeCallback = callback;
    state.gameTimeout = setTimeout(() => {
        state.resumeCallback = null;
        if (!state.isPaused) callback();
    }, delay);
}

function startGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    clearInterval(state.playbackInterval);
    clearTimeout(state.gameTimeout);
    state.sequence = [];
    state.level = 1;
    state.isPlayerTurn = false;
    state.isPaused = false;
    state.resumeCallback = null;
    switchScreen('game');
    nextRound();
}

function togglePause() {
    state.isPaused = !state.isPaused;

    if (state.isPaused) {
        clearInterval(state.playbackInterval);
        clearTimeout(state.gameTimeout);
        switchScreen('pause');
    } else {
        switchScreen('game');

        if (state.resumeCallback) {
            const callback = state.resumeCallback;
            state.resumeCallback = null;
            callback();
        } else if (!state.isPlayerTurn) {
            playSequence();
        }
    }
}

function nextRound() {
    state.isPlayerTurn = false;
    state.playerStep = 0;
    state.playbackIndex = 0;
    levelText.innerText = `Nível: ${state.level}`;
    state.sequence.push(Math.floor(Math.random() * 4));
    buttons.forEach(btn => btn.classList.add('disabled'));

    setGameTimeout(playSequence, 800);
}

function playSequence() {
    state.playbackInterval = setInterval(() => {
        activateButton(state.sequence[state.playbackIndex]);
        state.playbackIndex++;

        if (state.playbackIndex >= state.sequence.length) {
            clearInterval(state.playbackInterval);
            setGameTimeout(() => {
                state.isPlayerTurn = true;
                buttons.forEach(btn => btn.classList.remove('disabled'));
            }, 500);
        }
    }, 800);
}

function activateButton(index) {
    const btn = buttons.find(b => parseInt(b.dataset.color) === index);
    playTone(index);
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 400);
}

function handleSquareClick(e) {
    if (!state.isPlayerTurn || state.isPaused) return;

    const index = parseInt(e.target.dataset.color);
    activateButton(index);

    if (index === state.sequence[state.playerStep]) {
        state.playerStep++;
        if (state.playerStep === state.sequence.length) {
            state.isPlayerTurn = false;
            buttons.forEach(btn => btn.classList.add('disabled'));
            state.level++;
            setGameTimeout(nextRound, 1000);
        }
    } else {
        endGame();
    }
}

function endGame() {
    if (state.level - 1 > record) {
        record = state.level - 1;
        localStorage.setItem('geniusRecord', record);
    }
    gameoverStats.innerText = `Você alcançou o Nível ${state.level}`;
    switchScreen('gameover');
}

buttons.forEach(btn => btn.addEventListener('click', handleSquareClick));
btnClassic.addEventListener('click', startGame);
btnQuit.addEventListener('click', showMenu);
btnBackMenu.addEventListener('click', showMenu);

if (btnPause) btnPause.addEventListener('click', togglePause);
if (btnResume) btnResume.addEventListener('click', togglePause);

updateMenuRecords();