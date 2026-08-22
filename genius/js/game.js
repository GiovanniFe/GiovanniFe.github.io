const screens = {
    menu: document.getElementById('screen-menu'),
    game: document.getElementById('screen-game'),
    gameover: document.getElementById('screen-gameover')
};

const levelText = document.getElementById('level-text');
const buttons = Array.from(document.querySelectorAll('.genius-btn'));
const btnClassic = document.getElementById('btn-classic');
const btnQuit = document.getElementById('btn-quit');
const btnBackMenu = document.getElementById('btn-back-menu');
const gameoverStats = document.getElementById('gameover-stats');
const menuRecClassic = document.getElementById('menu-rec-classic');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const frequencies = [329.63, 261.63, 220.00, 164.81];

let state = {
    sequence: [],
    playerStep: 0,
    level: 1,
    isPlayerTurn: false
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
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
    document.body.classList.toggle('in-game', screenName === 'game');
}

function updateMenuRecords() {
    menuRecClassic.innerText = `🏆 ${record}`;
}

function showMenu() {
    updateMenuRecords();
    switchScreen('menu');
}

function startGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    state.sequence = [];
    state.level = 1;
    state.isPlayerTurn = false;
    switchScreen('game');
    nextRound();
}

function nextRound() {
    state.isPlayerTurn = false;
    state.playerStep = 0;
    levelText.innerText = `Nível: ${state.level}`;
    state.sequence.push(Math.floor(Math.random() * 4));
    buttons.forEach(btn => btn.classList.add('disabled'));
    setTimeout(playSequence, 800);
}

function playSequence() {
    let i = 0;
    const interval = setInterval(() => {
        activateButton(state.sequence[i]);
        i++;
        if (i >= state.sequence.length) {
            clearInterval(interval);
            setTimeout(() => {
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
    if (!state.isPlayerTurn) return;
    const index = parseInt(e.target.dataset.color);
    activateButton(index);

    if (index === state.sequence[state.playerStep]) {
        state.playerStep++;
        if (state.playerStep === state.sequence.length) {
            state.isPlayerTurn = false;
            buttons.forEach(btn => btn.classList.add('disabled'));
            state.level++;
            setTimeout(nextRound, 1000);
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

updateMenuRecords();