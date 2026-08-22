const difficultyInput = document.getElementById('difficulty');
const scoreInput = document.getElementById('score');
const squares = document.querySelectorAll('.square-div');

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

function slightlyModifyHexColor(hexColor) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hexColor = hexColor.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
    if (!result) return hexColor;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    const modificationFactor = Number(difficultyInput.value);

    const newR = Math.max(0, Math.min(255, r + modificationFactor));
    const newG = Math.max(0, Math.min(255, g + modificationFactor));
    const newB = Math.max(0, Math.min(255, b + modificationFactor));

    return "#" + componentToHex(newR) + componentToHex(newG) + componentToHex(newB);
}

function handleSquareClick(isCorrect) {
    if (isCorrect) {
        scoreInput.value = Number(scoreInput.value) + 1;
        difficultyInput.value = Math.max(1, Number(difficultyInput.value) - 1);
        startRound();
    } else {
        difficultyInput.value = Number(difficultyInput.value) + 10;
    }
}

function startRound() {
    const baseColor = generateRandomHexColor();
    const modifiedColor = slightlyModifyHexColor(baseColor);
    const correctIndex = Math.floor(Math.random() * squares.length);

    squares.forEach((square, index) => {
        if (index === correctIndex) {
            square.style.backgroundColor = modifiedColor;
            square.onclick = () => handleSquareClick(true);
        } else {
            square.style.backgroundColor = baseColor;
            square.onclick = () => handleSquareClick(false);
        }
    });
}

startRound();