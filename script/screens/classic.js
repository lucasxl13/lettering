import { getLanguage, t } from "../systems/language.js";
import { startGridEffects } from "../systems/grid-effects.js";

const BOARD_ROWS = 10;
const BOARD_COLUMNS = 9;
const PIECE_SIZE = 4;
const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const LETTER_WEIGHTS = {
    A: 9, B: 4, C: 5, D: 6, E: 10, F: 4, G: 5,
    H: 6, I: 9, J: 2, K: 3, L: 6, M: 5, N: 8,
    O: 9, P: 4, Q: 2, R: 8, S: 7, T: 9, U: 6,
    V: 3, W: 4, X: 2, Y: 4, Z: 2
};

export async function loadClassic(onBack) {
    const app = document.getElementById("app");
    const dictionary = await loadDictionary();
    let currentBatch = createLetterBatch();
    const board = Array.from(
        { length: BOARD_ROWS },
        () => Array(BOARD_COLUMNS).fill(null)
    );
    const activeBlock = { row: 0, column: Math.floor(BOARD_COLUMNS / 2) };
    let selectedLetterIndex = 0;
    let elapsedSeconds = 0;
    let lives = 3;
    let score = 0;
    let pendingWord = null;
    const foundWords = [];
    let paused = false;

    app.innerHTML = `
        <main class="classic-screen">
            <div class="classic-layout">
                <section class="board-area">
                    <header class="board-header">
                        <div class="board-stat">
                            <span>${t("score")}</span>
                            <strong id="score">0</strong>
                        </div>

                        <div class="board-lives" aria-label="${t("lives")}">
                            <span>${t("lives")}:</span>
                            <strong id="lives-count">3</strong>
                        </div>

                        <div class="board-stat board-time">
                            <span>${t("elapsed_time")}</span>
                            <strong id="elapsed-time">00:00</strong>
                        </div>

                        <button
                            class="pause-trigger"
                            id="pause-game"
                            type="button"
                            aria-label="${t("pause_game")}"
                        >
                            II
                        </button>
                    </header>

                    <div class="current-batch" aria-label="${t("piece_letters")}">
                        ${createCurrentBatch(currentBatch, selectedLetterIndex)}
                    </div>

                    <div
                        class="classic-board"
                        role="grid"
                        aria-label="${t("game_board")}"
                        aria-rowcount="${BOARD_ROWS}"
                        aria-colcount="${BOARD_COLUMNS}"
                    >
                        ${createBoardCells()}
                    </div>
                </section>

                <aside class="found-words-panel">
                    <div class="found-words-title">
                        <div>
                            <h2>${t("found_words")}</h2>
                            <small>${t("match_history")}</small>
                        </div>
                        <strong id="found-words-count">0</strong>
                    </div>

                    <div class="found-words-list" id="found-words-list">
                        <p>${t("no_words_found")}</p>
                    </div>
                </aside>
            </div>
        </main>
    `;

    const screen = document.querySelector(".classic-screen");
    const timeDisplay = document.getElementById("elapsed-time");
    const livesDisplay = document.getElementById("lives-count");
    const scoreDisplay = document.getElementById("score");
    const foundWordsCount = document.getElementById("found-words-count");
    const foundWordsList = document.getElementById("found-words-list");
    const boardCells = [...document.querySelectorAll(".board-cell")];
    const currentBatchElement = document.querySelector(".current-batch");

    currentBatchElement.addEventListener("click", event => {
        const button = event.target.closest(".current-letter");
        if (!button) return;

        selectedLetterIndex = Number(button.dataset.letterIndex);
        renderCurrentBatch();
        renderBoard();
    });

    document.querySelector(".classic-board").addEventListener("click", event => {
        if (event.target.closest(".word-match")) {
            confirmPendingWord();
            return;
        }

        selectNextLetter();
    });

    function renderCurrentBatch() {
        currentBatchElement.innerHTML = createCurrentBatch(currentBatch, selectedLetterIndex);
    }

    function selectNextLetter() {
        selectedLetterIndex = (selectedLetterIndex + 1) % PIECE_SIZE;
        renderCurrentBatch();
        renderBoard();
    }

    function renderBoard() {
        boardCells.forEach((cell, index) => {
            const row = Math.floor(index / BOARD_COLUMNS);
            const column = index % BOARD_COLUMNS;
            const lockedLetter = board[row][column];
            const isFalling = row === activeBlock.row && column === activeBlock.column;

            cell.classList.toggle("locked", Boolean(lockedLetter));
            cell.classList.toggle("falling", isFalling);
            cell.classList.toggle(
                "word-match",
                pendingWord?.cells.includes(index) ?? false
            );
            cell.textContent = isFalling
                ? currentBatch[selectedLetterIndex]
                : lockedLetter ?? "";
        });
    }

    function canMove(row, column) {
        return row >= 0
            && row < BOARD_ROWS
            && column >= 0
            && column < BOARD_COLUMNS
            && !board[row][column];
    }

    function moveHorizontally(direction) {
        const nextColumn = activeBlock.column + direction;
        if (!canMove(activeBlock.row, nextColumn)) return;

        activeBlock.column = nextColumn;
        renderBoard();
    }

    function dropBlock() {
        if (paused) return;

        const nextRow = activeBlock.row + 1;

        if (canMove(nextRow, activeBlock.column)) {
            activeBlock.row = nextRow;
            renderBoard();
            return;
        }

        const reachedTop = activeBlock.row === 0;
        board[activeBlock.row][activeBlock.column] = currentBatch[selectedLetterIndex];
        currentBatch = createLetterBatch();
        selectedLetterIndex = 0;
        activeBlock.row = 0;

        renderCurrentBatch();

        if (reachedTop) {
            loseLife();
            return;
        }

        pendingWord = findBestWord(board, dictionary);
        renderBoard();
    }

    function loseLife() {
        lives -= 1;
        livesDisplay.textContent = String(lives);
        livesDisplay.parentElement.setAttribute(
            "aria-label",
            `${t("lives")}: ${lives}`
        );

        board.forEach(row => row.fill(null));
        pendingWord = null;
        renderBoard();

        if (lives === 0) {
            showGameOver();
        }
    }

    function handleKeyboard(event) {
        const key = event.key.toLowerCase();

        if (event.key === "Escape") {
            const pauseOverlay = document.querySelector(".pause-overlay");

            if (pauseOverlay) {
                closePauseMenu(pauseOverlay);
            } else {
                openPauseMenu();
            }

            event.preventDefault();
            return;
        }

        if ((key === "r" || key === "w") && !paused) {
            selectNextLetter();
            event.preventDefault();
            return;
        }

        if (paused) return;

        if (event.code === "Space" && pendingWord) {
            confirmPendingWord();
            event.preventDefault();
            return;
        }

        if (event.key === "ArrowLeft" || key === "a") moveHorizontally(-1);
        if (event.key === "ArrowRight" || key === "d") moveHorizontally(1);
        if (event.key === "ArrowDown" || key === "s") dropBlock();

        if (["ArrowLeft", "ArrowRight", "ArrowDown"].includes(event.key)
            || ["a", "d", "s"].includes(key)) {
            event.preventDefault();
        }
    }

    function confirmPendingWord() {
        if (!pendingWord || paused) return;

        const points = pendingWord.word.length
            * (pendingWord.direction === "horizontal" ? 10 : 50);

        if (pendingWord.direction === "horizontal") {
            board.splice(pendingWord.line, 1);
            board.unshift(Array(BOARD_COLUMNS).fill(null));
        } else {
            board.forEach(row => {
                row[pendingWord.line] = null;
            });
        }

        score += points;
        foundWords.unshift({ ...pendingWord, points });
        scoreDisplay.textContent = String(score);
        foundWordsCount.textContent = String(foundWords.length);
        pendingWord = null;

        renderFoundWords();
        renderBoard();
    }

    function renderFoundWords() {
        foundWordsList.innerHTML = foundWords.map(item => `
            <article class="found-word-item">
                <div>
                    <strong>${item.word}</strong>
                    <small>${getWordTranslation(item.entry)}</small>
                </div>
                <span>+${item.points}</span>
            </article>
        `).join("");
    }

    function openPauseMenu() {
        paused = true;

        const overlay = document.createElement("div");
        overlay.className = "pause-overlay";
        overlay.innerHTML = `
            <section class="pause-menu" role="dialog" aria-modal="true" aria-labelledby="pause-title">
                <h2 id="pause-title">${t("paused")}</h2>
                <button class="pause-button" id="resume-game">${t("continue_game")}</button>
                <button class="pause-button" id="restart-game">${t("restart")}</button>
                <button class="pause-button" id="leave-game">${t("leave_game")}</button>
            </section>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector("#resume-game").addEventListener("click", () => {
            closePauseMenu(overlay);
        });

        overlay.querySelector("#restart-game").addEventListener("click", () => {
            stopGame();
            overlay.remove();
            loadClassic(onBack);
        });

        overlay.querySelector("#leave-game").addEventListener("click", () => {
            stopGame();
            overlay.remove();
            onBack?.();
        });
    }

    function closePauseMenu(overlay) {
        overlay.remove();
        paused = false;
    }

    function showGameOver() {
        stopGame();

        const overlay = document.createElement("div");
        overlay.className = "game-over-overlay";
        overlay.innerHTML = `
            <section class="game-over-menu" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
                <h2 id="game-over-title">${t("game_over")}</h2>
                <button class="pause-button" id="restart-after-game-over">${t("restart")}</button>
                <button class="pause-button" id="leave-after-game-over">${t("leave_game")}</button>
            </section>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector("#restart-after-game-over").addEventListener("click", () => {
            overlay.remove();
            loadClassic(onBack);
        });

        overlay.querySelector("#leave-after-game-over").addEventListener("click", () => {
            overlay.remove();
            onBack?.();
        });
    }

    function stopGame() {
        window.clearInterval(timer);
        window.clearInterval(gravity);
        document.removeEventListener("keydown", handleKeyboard);
    }

    document.addEventListener("keydown", handleKeyboard);
    document.getElementById("pause-game").addEventListener("click", openPauseMenu);
    renderBoard();
    startGridEffects(screen);

    const timer = window.setInterval(() => {
        if (!screen.isConnected) {
            window.clearInterval(timer);
            window.clearInterval(gravity);
            document.removeEventListener("keydown", handleKeyboard);
            return;
        }

        if (paused) return;

        elapsedSeconds += 1;
        timeDisplay.textContent = formatTime(elapsedSeconds);
    }, 1000);

    const gravity = window.setInterval(() => {
        if (!screen.isConnected) return;
        dropBlock();
    }, 700);
}

function createBoardCells() {
    return Array.from(
        { length: BOARD_ROWS * BOARD_COLUMNS },
        () => '<div class="board-cell" role="gridcell"></div>'
    ).join("");
}

function createLetterBatch() {
    const availableLetters = Object.keys(LETTER_WEIGHTS);
    const availableVowels = availableLetters.filter(letter => VOWELS.has(letter));
    const requiredVowel = availableVowels[
        Math.floor(Math.random() * availableVowels.length)
    ];
    const batch = [requiredVowel];

    while (batch.length < PIECE_SIZE) {
        const candidates = availableLetters.filter(letter => !batch.includes(letter));
        batch.push(pickWeightedLetter(candidates));
    }

    const shuffledBatch = shuffle(batch);

    // Salvaguardas: todo lote precisa ter quatro letras únicas e uma vogal.
    if (!shuffledBatch.some(letter => VOWELS.has(letter))) {
        shuffledBatch[0] = "A";
    }

    if (new Set(shuffledBatch).size !== PIECE_SIZE) {
        return createLetterBatch();
    }

    return shuffledBatch;
}

function pickWeightedLetter(letters) {
    const totalWeight = letters.reduce(
        (total, letter) => total + LETTER_WEIGHTS[letter],
        0
    );
    let randomWeight = Math.random() * totalWeight;

    for (const letter of letters) {
        randomWeight -= LETTER_WEIGHTS[letter];
        if (randomWeight <= 0) return letter;
    }

    return letters.at(-1);
}

function shuffle(letters) {
    const shuffledLetters = [...letters];

    for (let index = shuffledLetters.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledLetters[index], shuffledLetters[randomIndex]] = [
            shuffledLetters[randomIndex],
            shuffledLetters[index]
        ];
    }

    return shuffledLetters;
}

function createCurrentBatch(letters, selectedIndex) {
    return letters.map((letter, index) => `
        <button
            class="current-letter ${index === selectedIndex ? "active" : ""}"
            type="button"
            data-letter-index="${index}"
            aria-pressed="${index === selectedIndex}"
        >
            ${letter}
        </button>
    `).join("");
}

function findBestWord(board, dictionary) {
    const candidates = [];

    board.forEach((row, rowIndex) => {
        collectLineWords(row, "horizontal", rowIndex, dictionary, candidates);
    });

    for (let column = 0; column < BOARD_COLUMNS; column += 1) {
        const columnLetters = board.map(row => row[column]);
        collectLineWords(columnLetters, "vertical", column, dictionary, candidates);
    }

    candidates.sort((first, second) => {
        if (second.word.length !== first.word.length) {
            return second.word.length - first.word.length;
        }

        return second.multiplier - first.multiplier;
    });

    return candidates[0] ?? null;
}

function collectLineWords(letters, direction, line, dictionary, candidates) {
    dictionary.forEach(entry => {
        const word = entry.word.toUpperCase();

        for (let start = 0; start <= letters.length - word.length; start += 1) {
            const section = letters.slice(start, start + word.length);
            if (section.some(letter => !letter)) continue;
            const forwardText = section.join("");
            const backwardText = [...section].reverse().join("");
            if (forwardText !== word && backwardText !== word) continue;

            const cells = Array.from({ length: word.length }, (_, offset) => {
                const position = start + offset;
                return direction === "horizontal"
                    ? line * BOARD_COLUMNS + position
                    : position * BOARD_COLUMNS + line;
            });

            candidates.push({
                word,
                entry,
                direction,
                line,
                cells,
                reading: forwardText === word ? "forward" : "backward",
                multiplier: direction === "horizontal" ? 10 : 50
            });
        }
    });
}

function getWordTranslation(entry) {
    const translation = entry.translations[getLanguage()]
        ?? entry.translations["pt-BR"]
        ?? entry.word;

    return Array.isArray(translation)
        ? translation.join(" / ")
        : translation;
}

async function loadDictionary(theme = null) {
    try {
        const response = await fetch("script/data/words.json", {
            cache: "no-store"
        });
        if (!response.ok) return [];

        const data = await response.json();
        const themes = data.general ?? {};

        if (theme) {
            return normalizeDictionary(themes[theme]?.words ?? []);
        }

        const allWords = Object.values(themes)
            .flatMap(themeData => themeData.words ?? []);
        return normalizeDictionary(allWords);
    } catch {
        return [];
    }
}

function normalizeDictionary(words) {
    const mergedWords = new Map();

    words.forEach(entry => {
        if (!entry?.word || !entry?.translations) return;

        if (!mergedWords.has(entry.word)) {
            mergedWords.set(entry.word, {
                word: entry.word,
                translations: {}
            });
        }

        const mergedEntry = mergedWords.get(entry.word);

        Object.keys(entry.translations).forEach(language => {
            const meaning = entry.description?.[language]
                ?? entry.translations[language];
            const meanings = mergedEntry.translations[language] ?? [];

            if (!meanings.includes(meaning)) meanings.push(meaning);
            mergedEntry.translations[language] = meanings;
        });
    });

    return [...mergedWords.values()];
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
