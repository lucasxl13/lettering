import { getLanguage, t } from "../systems/language.js";
import { startGridEffects } from "../systems/grid-effects.js";
import { getSession } from "../systems/auth.js";
import { ApiRequestError } from "../api/apiClient.js";
import {
    getMatches,
    getMatchState,
    postLeaveMatch,
    postMatch,
    postMatchPiece,
    postConfirmMatchWord,
    postPauseMatch,
    postResumeMatch
} from "../api/matchesApi.js";

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
    const authenticated = Boolean(getSession()?.token);
    let initialSnapshot = null;

    if (authenticated) {
        try {
            initialSnapshot = await loadOrCreateAuthenticatedMatch();
        } catch (error) {
            window.alert(getGameRequestError(error));
            onBack?.();
            return;
        }
    }

    const dictionary = authenticated ? [] : await loadDictionary();
    let currentBatch = authenticated
        ? initialSnapshot.match.letterOptions
        : createLetterBatch();
    const board = Array.from(
        { length: BOARD_ROWS },
        () => Array(BOARD_COLUMNS).fill(null)
    );
    if (authenticated) fillBoardFromCells(board, initialSnapshot.match.board.cells);
    const activeBlock = { row: 0, column: Math.floor(BOARD_COLUMNS / 2) };
    let selectedLetterIndex = 0;
    let elapsedSeconds = authenticated
        ? Math.floor(initialSnapshot.match.player.gameTimeMs / 1000)
        : 0;
    let lives = authenticated ? initialSnapshot.match.player.livesRemaining : 3;
    let score = authenticated ? initialSnapshot.match.player.score : 0;
    let pendingWord = authenticated && initialSnapshot.match.pendingWord
        ? normalizeServerWord(initialSnapshot.match.pendingWord)
        : null;
    const foundWords = authenticated
        ? initialSnapshot.match.foundWords.map(normalizeServerWord)
        : [];
    let paused = authenticated && initialSnapshot.match.player.status === "paused";
    let requestPending = false;
    const matchId = authenticated ? initialSnapshot.match.id : null;
    let boardVersion = authenticated ? initialSnapshot.match.board.version : 0;

    app.innerHTML = `
        <main class="classic-screen">
            <div class="classic-layout">
                <section class="board-area">
                    <header class="board-header">
                        <div class="board-stat">
                            <span>${t("score")}</span>
                            <strong id="score">${score}</strong>
                        </div>

                        <div class="board-lives" aria-label="${t("lives")}">
                            <span>${t("lives")}:</span>
                            <strong id="lives-count">${lives}</strong>
                        </div>

                        <div class="board-stat board-time">
                            <span>${t("elapsed_time")}</span>
                            <strong id="elapsed-time">${formatTime(elapsedSeconds)}</strong>
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
        if (requestPending || currentBatch.length === 0) return;
        selectedLetterIndex = (selectedLetterIndex + 1) % PIECE_SIZE;
        renderCurrentBatch();
        renderBoard();
    }

    function renderBoard() {
        boardCells.forEach((cell, index) => {
            const row = Math.floor(index / BOARD_COLUMNS);
            const column = index % BOARD_COLUMNS;
            const lockedLetter = board[row][column];
            const isFalling = currentBatch.length > 0
                && row === activeBlock.row
                && column === activeBlock.column;

            cell.classList.toggle("locked", Boolean(lockedLetter));
            cell.classList.toggle("falling", isFalling);
            cell.classList.toggle(
                "word-match",
                pendingWord?.cells.includes(index) ?? false
            );
            cell.textContent = isFalling
                ? getOptionLetter(currentBatch[selectedLetterIndex])
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
        if (requestPending) return;
        const nextColumn = activeBlock.column + direction;
        if (!canMove(activeBlock.row, nextColumn)) return;

        activeBlock.column = nextColumn;
        renderBoard();
    }

    async function dropBlock() {
        if (paused || pendingWord || requestPending || currentBatch.length === 0) return;

        const nextRow = activeBlock.row + 1;

        if (canMove(nextRow, activeBlock.column)) {
            activeBlock.row = nextRow;
            renderBoard();
            return;
        }

        if (authenticated) {
            await submitAuthenticatedPiece();
            return;
        }

        const reachedTop = activeBlock.row === 0;
        board[activeBlock.row][activeBlock.column] = getOptionLetter(
            currentBatch[selectedLetterIndex]
        );
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

    async function submitAuthenticatedPiece() {
        const selectedOption = currentBatch[selectedLetterIndex];
        if (!selectedOption?.pieceId) return;

        requestPending = true;
        try {
            const result = await postMatchPiece(matchId, {
                pieceId: selectedOption.pieceId,
                column: activeBlock.column,
                boardVersion
            });

            boardVersion = result.boardVersion;
            fillBoardFromCells(board, result.board.cells);
            currentBatch = result.letterOptions;
            selectedLetterIndex = 0;
            activeBlock.row = 0;
            score = result.currentScore;
            lives = result.livesRemaining;

            pendingWord = result.foundWord
                ? normalizeServerWord(result.foundWord)
                : null;

            scoreDisplay.textContent = String(score);
            updateLivesDisplay(livesDisplay, lives);
            foundWordsCount.textContent = String(foundWords.length);
            renderCurrentBatch();
            renderFoundWords();
            renderBoard();

            if (result.gameOver) showGameOver();
        } catch (error) {
            if (error instanceof ApiRequestError && error.code === "STALE_BOARD_VERSION") {
                try {
                    const snapshot = await getMatchState(matchId);
                    applyAuthenticatedSnapshot(snapshot);
                } catch (syncError) {
                    showMatchConnectionError(syncError);
                }
            } else if (error instanceof ApiRequestError && error.code === "MATCH_PAUSED") {
                paused = true;
            } else {
                showMatchConnectionError(error);
            }
        } finally {
            requestPending = false;
        }
    }

    function applyAuthenticatedSnapshot(snapshot) {
        boardVersion = snapshot.match.board.version;
        fillBoardFromCells(board, snapshot.match.board.cells);
        currentBatch = snapshot.match.letterOptions;
        selectedLetterIndex = 0;
        activeBlock.row = 0;
        score = snapshot.match.player.score;
        lives = snapshot.match.player.livesRemaining;
        elapsedSeconds = Math.floor(snapshot.match.player.gameTimeMs / 1000);
        paused = snapshot.match.player.status === "paused";
        pendingWord = snapshot.match.pendingWord
            ? normalizeServerWord(snapshot.match.pendingWord)
            : null;
        foundWords.splice(
            0,
            foundWords.length,
            ...snapshot.match.foundWords.map(normalizeServerWord)
        );

        scoreDisplay.textContent = String(score);
        timeDisplay.textContent = formatTime(elapsedSeconds);
        updateLivesDisplay(livesDisplay, lives);
        foundWordsCount.textContent = String(foundWords.length);
        renderCurrentBatch();
        renderFoundWords();
        renderBoard();
    }

    function loseLife() {
        lives -= 1;
        updateLivesDisplay(livesDisplay, lives);

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
            if (document.querySelector(".match-error-overlay")) {
                event.preventDefault();
                return;
            }

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

    async function confirmPendingWord() {
        if (!pendingWord || paused) return;

        if (authenticated) {
            await confirmAuthenticatedWord();
            return;
        }

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

    async function confirmAuthenticatedWord() {
        if (requestPending) return;
        requestPending = true;

        try {
            const result = await postConfirmMatchWord(matchId, boardVersion);
            boardVersion = result.boardVersion;
            fillBoardFromCells(board, result.board.cells);
            score = result.currentScore;
            foundWords.unshift(normalizeServerWord(result.confirmedWord));
            pendingWord = null;

            scoreDisplay.textContent = String(score);
            foundWordsCount.textContent = String(foundWords.length);
            renderFoundWords();
            renderBoard();
        } catch (error) {
            if (error instanceof ApiRequestError && error.code === "STALE_BOARD_VERSION") {
                try {
                    const snapshot = await getMatchState(matchId);
                    applyAuthenticatedSnapshot(snapshot);
                } catch (syncError) {
                    showMatchConnectionError(syncError);
                }
            } else {
                showMatchConnectionError(error);
            }
        } finally {
            requestPending = false;
        }
    }

    function renderFoundWords() {
        if (foundWords.length === 0) {
            foundWordsList.innerHTML = `<p>${t("no_words_found")}</p>`;
            return;
        }

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

    function showMatchConnectionError(error) {
        if (document.querySelector(".match-error-overlay")) return;
        paused = true;

        const overlay = document.createElement("div");
        overlay.className = "pause-overlay match-error-overlay";
        overlay.innerHTML = `
            <section class="pause-menu" role="alertdialog" aria-modal="true" aria-labelledby="match-error-title">
                <h2 id="match-error-title">${t("connection_problem")}</h2>
                <p class="match-error-message"></p>
                <button class="pause-button" id="retry-match">${t("retry_connection")}</button>
                <button class="pause-button" id="leave-failed-match">${t("leave_game")}</button>
            </section>
        `;
        overlay.querySelector(".match-error-message").textContent = getGameRequestError(error);
        document.body.appendChild(overlay);

        overlay.querySelector("#retry-match").addEventListener("click", async event => {
            const button = event.currentTarget;
            button.disabled = true;

            try {
                let snapshot = await getMatchState(matchId);
                if (snapshot.match.player.status === "paused") {
                    snapshot = await postResumeMatch(matchId);
                }

                applyAuthenticatedSnapshot(snapshot);
                overlay.remove();

                if (snapshot.match.player.status === "game_over") showGameOver();
            } catch (retryError) {
                overlay.querySelector(".match-error-message").textContent =
                    getGameRequestError(retryError);
                button.disabled = false;
            }
        });

        overlay.querySelector("#leave-failed-match").addEventListener("click", async () => {
            stopGame();
            await safelyLeaveMatch(matchId);
            overlay.remove();
            onBack?.();
        });
    }

    async function openPauseMenu() {
        if (requestPending || document.querySelector(".pause-overlay")) return;
        paused = true;

        if (authenticated) {
            try {
                const snapshot = await postPauseMatch(matchId);
                elapsedSeconds = Math.floor(snapshot.match.player.gameTimeMs / 1000);
                timeDisplay.textContent = formatTime(elapsedSeconds);
            } catch (error) {
                paused = false;
                window.alert(getGameRequestError(error));
                return;
            }
        }

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

        overlay.querySelector("#resume-game").addEventListener("click", async () => {
            await closePauseMenu(overlay);
        });

        overlay.querySelector("#restart-game").addEventListener("click", async () => {
            stopGame();
            if (authenticated) await safelyLeaveMatch(matchId);
            overlay.remove();
            loadClassic(onBack);
        });

        overlay.querySelector("#leave-game").addEventListener("click", async () => {
            stopGame();
            if (authenticated) await safelyLeaveMatch(matchId);
            overlay.remove();
            onBack?.();
        });
    }

    async function closePauseMenu(overlay) {
        if (authenticated) {
            try {
                const snapshot = await postResumeMatch(matchId);
                elapsedSeconds = Math.floor(snapshot.match.player.gameTimeMs / 1000);
                timeDisplay.textContent = formatTime(elapsedSeconds);
            } catch (error) {
                window.alert(getGameRequestError(error));
                return;
            }
        }
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
    foundWordsCount.textContent = String(foundWords.length);
    if (foundWords.length > 0) renderFoundWords();
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
    return letters.map((option, index) => `
        <button
            class="current-letter ${index === selectedIndex ? "active" : ""}"
            type="button"
            data-letter-index="${index}"
            aria-pressed="${index === selectedIndex}"
        >
            ${getOptionLetter(option)}
        </button>
    `).join("");
}

function getOptionLetter(option) {
    if (typeof option === "string") return option;
    return option?.letter ?? "";
}

function fillBoardFromCells(board, cells = []) {
    board.forEach(row => row.fill(null));

    cells.forEach(cell => {
        const row = Number(cell.row);
        const column = Number(cell.column);

        if (!Number.isInteger(row) || !Number.isInteger(column)) return;
        if (row < 0 || row >= BOARD_ROWS) return;
        if (column < 0 || column >= BOARD_COLUMNS) return;

        board[row][column] = cell.letter;
    });
}

function updateLivesDisplay(element, lives) {
    element.textContent = String(lives);
    element.parentElement?.setAttribute("aria-label", `${t("lives")}: ${lives}`);
}

function normalizeServerWord(item) {
    const word = String(item.word ?? item.formedWord ?? "").toUpperCase();
    const translations = Array.isArray(item.translations) && item.translations.length > 0
        ? item.translations
        : [word];

    return {
        word,
        points: Number(item.pointsEarned ?? 0),
        direction: item.direction ?? "horizontal",
        cells: Array.isArray(item.cells)
            ? item.cells.map(cell => cell.row * BOARD_COLUMNS + cell.column)
            : [],
        entry: {
            word,
            translations: {
                "pt-BR": translations,
                "en-US": [word],
                "es-ES": translations
            }
        }
    };
}

async function loadOrCreateAuthenticatedMatch() {
    try {
        return await postMatch();
    } catch (error) {
        if (!(error instanceof ApiRequestError) || error.code !== "ACTIVE_MATCH_EXISTS") {
            throw error;
        }

        const history = await getMatches(50, 0);
        const activeMatch = history.items.find(item =>
            ["in_progress", "waiting"].includes(item.matchStatus)
            && ["playing", "paused"].includes(item.playerStatus)
        );

        if (!activeMatch) throw error;
        if (activeMatch.playerStatus === "paused") {
            return postResumeMatch(activeMatch.id);
        }

        return getMatchState(activeMatch.id);
    }
}

async function safelyLeaveMatch(matchId) {
    try {
        await postLeaveMatch(matchId);
    } catch (error) {
        console.error("Could not leave the authenticated match", error);
    }
}

function getGameRequestError(error) {
    if (!(error instanceof ApiRequestError)) return t("game_request_error");
    if (error.code === "NETWORK_ERROR") return t("server_unavailable");
    if (error.code === "ACTIVE_MATCH_EXISTS") return t("active_match_error");
    if (error.code === "STALE_BOARD_VERSION") return t("stale_match_error");

    return error.message || t("game_request_error");
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
