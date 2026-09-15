import { getLanguage, t } from "../systems/language.js";
import { startGridEffects } from "../systems/grid-effects.js";
import { getSession } from "../systems/auth.js";
import { WS_BASE_URL } from "../config.js";

const BOARD_ROWS = 10;
const BOARD_COLUMNS = 9;
const PIECE_SIZE = 4;
const VOWELS = new Set(["A", "E", "I", "O", "U"]);

export async function loadVersus(onBack) {
    window._versusCleanup?.();

    const session = getSession();
    if (!session?.token) {
        window.alert(t("versus_login_required"));
        onBack?.();
        return;
    }

    const app = document.getElementById("app");
    let socket = null;
    let socketAuthenticated = false;
    let pendingSocketAction = null;
    let roomCode = null;
    let isHost = false;
    let opponentUsername = t("opponent");
    let gameStarted = false;
    let gameEnded = false;
    let localStateVersion = 0;
    let opponentStateVersion = -1;
    let matchRandom = Math.random;

    // Game state
    let [dictionary, letterWeights] = await Promise.all([
        loadDictionary(),
        loadLetterWeights()
    ]);

    const board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLUMNS).fill(null));
    const opponentBoard = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLUMNS).fill(null));
    let opponentActiveBlock = null;
    let opponentScore = 0;
    let opponentLives = 3;

    let currentBatch = createLetterBatch(letterWeights);
    const activeBlock = { row: 0, column: Math.floor(BOARD_COLUMNS / 2) };
    let selectedLetterIndex = 0;
    let score = 0;
    let lives = 3;
    let pendingWord = null;
    let gravityInterval = null;
    let elapsedSeconds = 0;
    let timerInterval = null;
    let activeKeyHandler = null;

    renderLobby();

    function connectSocket(onOpen) {
        if (socket && socket.readyState === WebSocket.OPEN && socketAuthenticated) {
            onOpen?.();
            return;
        }

        pendingSocketAction = onOpen ?? null;
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

        socket = new WebSocket(`${WS_BASE_URL}?token=${encodeURIComponent(session.token)}`);
        socketAuthenticated = false;

        socket.onmessage = event => {
            try {
                const message = JSON.parse(event.data);
                handleSocketMessage(message);
            } catch (err) {
                console.error("Versus socket message parse error", err);
            }
        };

        socket.onerror = () => {
            showRequestError(t("connection_problem"));
        };

        socket.onclose = () => {
            socketAuthenticated = false;
            updateConnectionStatus(false);
            if (gameStarted && !gameEnded) {
                showToast(t("connection_problem"));
            }
        };
    }

    function sendWs(payload) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
        }
    }

    function handleSocketMessage(msg) {
        switch (msg.type) {
            case "authenticated": {
                socketAuthenticated = true;
                updateConnectionStatus(true);
                const action = pendingSocketAction;
                pendingSocketAction = null;
                action?.();
                break;
            }

            case "room_created":
                roomCode = msg.code;
                isHost = true;
                renderWaitingRoom(roomCode);
                break;

            case "searching_quick_match":
                renderSearchingQuickMatch();
                break;

            case "match_start":
                roomCode = msg.roomCode;
                isHost = msg.role === "host";
                opponentUsername = msg.opponent?.username || t("opponent");
                if (Array.isArray(msg.initialBatch) && msg.initialBatch.length === 4) {
                    currentBatch = msg.initialBatch;
                }
                matchRandom = createSeededRandom(Number(msg.matchSeed) || Date.now());
                startCountdownAndMatch();
                break;

            case "opponent_state":
                if (Number.isFinite(msg.version) && msg.version <= opponentStateVersion) break;
                if (Number.isFinite(msg.version)) opponentStateVersion = msg.version;
                if (Array.isArray(msg.board)) {
                    for (let r = 0; r < BOARD_ROWS; r++) {
                        for (let c = 0; c < BOARD_COLUMNS; c++) {
                            opponentBoard[r][c] = msg.board[r]?.[c] ?? null;
                        }
                    }
                }
                opponentActiveBlock = msg.activeBlock ?? null;
                if (typeof msg.score === "number") opponentScore = msg.score;
                if (typeof msg.lives === "number") opponentLives = msg.lives;
                renderOpponentBoard();
                break;

            case "opponent_word":
                showToast(`⚔️ ${opponentUsername}: ${msg.word} (+${msg.points})`);
                break;

            case "match_over":
                handleMatchOver(msg);
                break;

            case "opponent_disconnected":
                handleMatchOver({
                    result: "win",
                    winner: session.user.username,
                    reason: "forfeit",
                    message: t("opponent_disconnected")
                });
                break;

            case "error":
                showRequestError(msg.message || t("game_request_error"));
                break;
        }
    }

    /* ======================================================================
       LOBBY RENDERING
       ====================================================================== */

    function renderLobby() {
        cleanupGame();
        gameStarted = false;
        gameEnded = false;
        opponentUsername = t("opponent");
        app.innerHTML = `
            <main class="versus-screen">
                <section class="versus-lobby">
                    <h2>${t("versus_mode")}</h2>
                    <p class="versus-lobby-description">${t("versus_description")}</p>

                    <div class="versus-lobby-actions">
                        <button class="mode-menu-button primary-mode-button" id="btn-quick-match">
                            ${t("quick_match")}
                        </button>

                        <button class="mode-menu-button" id="btn-create-room">
                            ${t("create_room")}
                        </button>

                        <div class="versus-lobby-divider">OU</div>

                        <div class="join-room-box">
                            <input
                                type="text"
                                class="join-room-input"
                                id="join-room-code"
                                placeholder="ABC123"
                                maxlength="6"
                                autocomplete="off"
                                spellcheck="false"
                            />
                            <button class="mode-menu-button" id="btn-join-room">
                                ${t("join_room")}
                            </button>
                        </div>

                        <button class="mode-menu-button" id="btn-back">
                            ${t("back")}
                        </button>
                    </div>
                </section>
            </main>
        `;

        startGridEffects(document.querySelector(".versus-screen"));

        document.getElementById("btn-quick-match").addEventListener("click", () => {
            connectSocket(() => {
                sendWs({ type: "quick_match" });
            });
        });

        document.getElementById("btn-create-room").addEventListener("click", () => {
            connectSocket(() => {
                sendWs({ type: "create_room" });
            });
        });

        document.getElementById("btn-join-room").addEventListener("click", () => {
            const input = document.getElementById("join-room-code");
            const code = input?.value.trim().toUpperCase();
            if (!code || code.length < 4) {
                window.alert(t("invalid_room_code"));
                return;
            }
            connectSocket(() => {
                sendWs({ type: "join_room", code });
            });
        });

        document.getElementById("btn-back").addEventListener("click", () => {
            if (socket) socket.close();
            onBack?.();
        });
    }

    function renderWaitingRoom(code) {
        app.innerHTML = `
            <main class="versus-screen">
                <section class="versus-lobby">
                    <h2>${t("room_code")}</h2>
                    <p class="versus-lobby-description">Envie este código para o seu amigo:</p>

                    <div class="versus-room-card">
                        <div class="versus-room-code-display">
                            <span class="versus-room-code" id="display-room-code">${code}</span>
                            <button class="copy-code-btn" id="btn-copy-code">${t("copy_code")}</button>
                        </div>
                    </div>

                    <div class="versus-waiting-pulse">
                        <span class="pulse-dot"></span>
                        <span>${t("waiting_opponent")}</span>
                    </div>

                    <button class="mode-menu-button" id="btn-cancel-room">
                        ${t("back")}
                    </button>
                </section>
            </main>
        `;

        startGridEffects(document.querySelector(".versus-screen"));

        document.getElementById("btn-copy-code").addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(code);
                const btn = document.getElementById("btn-copy-code");
                if (btn) btn.textContent = t("code_copied");
                setTimeout(() => {
                    if (btn) btn.textContent = t("copy_code");
                }, 2000);
            } catch {
                window.prompt("Copie o código abaixo:", code);
            }
        });

        document.getElementById("btn-cancel-room").addEventListener("click", () => {
            sendWs({ type: "cancel_search" });
            renderLobby();
        });
    }

    function renderSearchingQuickMatch() {
        app.innerHTML = `
            <main class="versus-screen">
                <section class="versus-lobby">
                    <h2>${t("quick_match")}</h2>
                    <div class="versus-waiting-pulse" style="margin: 20px 0;">
                        <span class="pulse-dot"></span>
                        <span>${t("searching_match")}</span>
                    </div>

                    <button class="mode-menu-button" id="btn-cancel-quick">
                        ${t("back")}
                    </button>
                </section>
            </main>
        `;

        startGridEffects(document.querySelector(".versus-screen"));

        document.getElementById("btn-cancel-quick").addEventListener("click", () => {
            sendWs({ type: "cancel_search" });
            renderLobby();
        });
    }

    /* ======================================================================
       MATCH ARENA (GAMEPLAY)
       ====================================================================== */

    function startCountdownAndMatch() {
        cleanupGame();
        gameStarted = true;
        gameEnded = false;
        lives = 3;
        score = 0;
        opponentLives = 3;
        opponentScore = 0;
        opponentActiveBlock = null;
        localStateVersion = 0;
        opponentStateVersion = -1;
        elapsedSeconds = 0;
        pendingWord = null;
        selectedLetterIndex = 0;
        activeBlock.row = 0;
        activeBlock.column = Math.floor(BOARD_COLUMNS / 2);
        board.forEach(row => row.fill(null));
        opponentBoard.forEach(row => row.fill(null));

        app.innerHTML = `
            <main class="versus-screen">
                <div class="versus-toast-container" id="versus-toasts"></div>

                <header class="versus-matchbar">
                    <div class="versus-match-title">
                        <span class="versus-live-dot"></span>
                        <span>1V1 AO VIVO</span>
                    </div>
                    <div class="versus-clock" id="match-timer">00:00</div>
                    <button class="versus-exit" id="btn-leave-match" type="button">${t("leave_game")}</button>
                </header>

                <div class="versus-arena">
                    <!-- PLAYER 1 BOARD -->
                    <section class="versus-player versus-player--you">
                        <header class="versus-player-header">
                            <div class="versus-player-identity">
                                <small>VOCÊ</small>
                                <strong>${escapeHtml(session.user.username)}</strong>
                            </div>
                            <div class="versus-player-metrics">
                                <span><small>PONTOS</small><strong id="score">${score}</strong></span>
                                <span><small>${t("lives")}</small><strong id="lives-count">${lives}</strong></span>
                            </div>
                        </header>

                        <div class="versus-board versus-board--you" id="board" role="grid" aria-label="${t("game_board")}">
                            ${createBoardCellsHtml()}
                        </div>
                        <div class="versus-controls">
                            <div>
                                <small>ESCOLHA A LETRA</small>
                                <div class="current-letter-container" id="current-letter-list" role="group">
                                    ${createCurrentBatchHtml(currentBatch, selectedLetterIndex)}
                                </div>
                            </div>
                            <p><kbd>A</kbd><kbd>D</kbd> mover &nbsp; <kbd>S</kbd> descer &nbsp; <kbd>W</kbd> trocar</p>
                        </div>
                    </section>

                    <!-- CENTER VS PANEL -->
                    <aside class="versus-center-panel">
                        <div class="versus-badge">VS</div>
                        <div class="versus-status-indicator">
                            <span class="status-dot-connected" id="connection-dot"></span>
                            <span id="connection-label">ONLINE</span>
                        </div>
                    </aside>

                    <!-- OPPONENT BOARD -->
                    <section class="versus-player versus-player--opponent">
                        <header class="versus-player-header">
                            <div class="versus-player-identity">
                                <small>OPONENTE</small>
                                <strong>${escapeHtml(opponentUsername)}</strong>
                            </div>
                            <div class="versus-player-metrics">
                                <span><small>PONTOS</small><strong id="opp-score">${opponentScore}</strong></span>
                                <span><small>${t("lives")}</small><strong id="opp-lives">${opponentLives}</strong></span>
                            </div>
                        </header>

                        <div class="versus-board versus-board--opponent" id="opponent-board" role="grid" aria-label="Matriz de ${escapeHtml(opponentUsername)}">
                            ${createOpponentCellsHtml()}
                        </div>
                        <div class="opponent-watch-label">MATRIZ EM TEMPO REAL</div>
                    </section>
                </div>
            </main>
        `;

        startGridEffects(document.querySelector(".versus-screen"));

        // Setup DOM elements
        const boardElement = document.getElementById("board");
        const scoreDisplay = document.getElementById("score");
        const livesDisplay = document.getElementById("lives-count");
        const batchContainer = document.getElementById("current-letter-list");
        const timerDisplay = document.getElementById("match-timer");
        document.getElementById("btn-leave-match").addEventListener("click", leaveVersus);

        renderPlayerBoard();
        renderOpponentBoard();

        // Keyboard inputs
        document.addEventListener("keydown", handleKeyInput);

        // Batch letter click
        batchContainer.addEventListener("click", event => {
            const button = event.target.closest("button[data-letter-index]");
            if (!button || gameEnded) return;
            selectedLetterIndex = Number(button.dataset.letterIndex);
            renderBatch();
            renderPlayerBoard();
            syncState();
        });

        // Board click to confirm pending word
        boardElement.addEventListener("click", event => {
            if (event.target.closest(".word-match")) {
                confirmWord();
            }
        });

        // Gravity tick (every 700ms)
        gravityInterval = setInterval(() => {
            if (!gameEnded) {
                dropBlock();
            }
        }, 700);

        // Timer
        timerInterval = setInterval(() => {
            if (!gameEnded) {
                elapsedSeconds += 1;
                const m = Math.floor(elapsedSeconds / 60);
                const s = elapsedSeconds % 60;
                timerDisplay.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
            }
        }, 1000);

        // Initial state sync
        syncState();

        function handleKeyInput(event) {
            if (gameEnded) return;
            const key = event.key.toLowerCase();

            if (key === "arrowleft" || key === "a") {
                moveHorizontally(-1);
                event.preventDefault();
            } else if (key === "arrowright" || key === "d") {
                moveHorizontally(1);
                event.preventDefault();
            } else if (key === "arrowdown" || key === "s") {
                dropBlock();
                event.preventDefault();
            } else if (key === "r" || key === "w") {
                selectNextLetter();
                event.preventDefault();
            } else if (event.code === "Space" && pendingWord) {
                confirmWord();
                event.preventDefault();
            }
        }

        function selectNextLetter() {
            selectedLetterIndex = (selectedLetterIndex + 1) % PIECE_SIZE;
            renderBatch();
            renderPlayerBoard();
            syncState();
        }

        function moveHorizontally(dir) {
            const nextCol = activeBlock.column + dir;
            if (canMove(activeBlock.row, nextCol)) {
                activeBlock.column = nextCol;
                renderPlayerBoard();
                syncState();
            }
        }

        function canMove(r, c) {
            return r >= 0 && r < BOARD_ROWS && c >= 0 && c < BOARD_COLUMNS && !board[r][c];
        }

        function dropBlock() {
            if (gameEnded) return;

            const nextRow = activeBlock.row + 1;
            if (canMove(nextRow, activeBlock.column)) {
                activeBlock.row = nextRow;
                renderPlayerBoard();
                syncState();
                return;
            }

            // Lock piece
            const landedRow = activeBlock.row;
            const landedCol = activeBlock.column;
            const letter = currentBatch[selectedLetterIndex];

            board[landedRow][landedCol] = letter;

            if (landedRow === 0) {
                // Top reached -> Lose life
                lives -= 1;
                livesDisplay.textContent = String(lives);
                board.forEach(row => row.fill(null));
                pendingWord = null;

                if (lives <= 0) {
                    gameEnded = true;
                    cleanupGame();
                    sendWs({ type: "game_over", finalScore: score });
                    return;
                }
            }

            // Generate next batch
            currentBatch = createLetterBatch(letterWeights, matchRandom);
            selectedLetterIndex = 0;
            activeBlock.row = 0;
            activeBlock.column = Math.floor(BOARD_COLUMNS / 2);

            // Check for words
            pendingWord = findBestWord(board, dictionary);

            renderBatch();
            renderPlayerBoard();
            syncState();
        }

        function confirmWord() {
            if (!pendingWord || gameEnded) return;

            const pts = pendingWord.entry?.score ?? (pendingWord.word.length * 10);
            score += pts;
            scoreDisplay.textContent = String(score);

            // Clear cells & apply gravity
            if (pendingWord.direction === "horizontal") {
                board.splice(pendingWord.line, 1);
                board.unshift(Array(BOARD_COLUMNS).fill(null));
            } else {
                board.forEach(row => { row[pendingWord.line] = null; });
            }

            const confirmedWordText = pendingWord.word;
            pendingWord = findBestWord(board, dictionary);

            renderPlayerBoard();
            syncState();

            // Send word event to opponent
            sendWs({
                type: "word_confirmed",
                word: confirmedWordText,
                points: pts
            });
        }

        function syncState() {
            localStateVersion += 1;
            sendWs({
                type: "state_sync",
                version: localStateVersion,
                board: board.map(row => [...row]),
                activeBlock: {
                    row: activeBlock.row,
                    column: activeBlock.column,
                    letter: currentBatch[selectedLetterIndex]
                },
                score,
                lives
            });
        }

        function renderPlayerBoard() {
            const cells = boardElement.querySelectorAll(".board-cell");
            cells.forEach((cell, index) => {
                const r = Math.floor(index / BOARD_COLUMNS);
                const c = index % BOARD_COLUMNS;
                const isFalling = r === activeBlock.row && c === activeBlock.column;
                const lockedLetter = board[r][c];

                cell.classList.toggle("falling", isFalling);
                cell.classList.toggle("locked", Boolean(lockedLetter) && !isFalling);
                cell.classList.toggle("word-match", pendingWord?.cells.includes(index) ?? false);

                cell.textContent = isFalling
                    ? currentBatch[selectedLetterIndex]
                    : (lockedLetter || "");
            });
        }

        function renderBatch() {
            batchContainer.innerHTML = createCurrentBatchHtml(currentBatch, selectedLetterIndex);
        }

        activeKeyHandler = handleKeyInput;
        window._versusCleanup = cleanupGame;
    }

    function renderOpponentBoard() {
        const oppGrid = document.getElementById("opponent-board");
        const oppLivesDisplay = document.getElementById("opp-lives");
        const oppScoreDisplay = document.getElementById("opp-score");

        if (oppLivesDisplay) oppLivesDisplay.textContent = String(opponentLives);
        if (oppScoreDisplay) oppScoreDisplay.textContent = String(opponentScore);

        if (!oppGrid) return;
        const cells = oppGrid.querySelectorAll(".opponent-cell");

        cells.forEach((cell, index) => {
            const r = Math.floor(index / BOARD_COLUMNS);
            const c = index % BOARD_COLUMNS;
            const isFalling = opponentActiveBlock && opponentActiveBlock.row === r && opponentActiveBlock.column === c;
            const lockedLetter = opponentBoard[r]?.[c];

            cell.className = "opponent-cell";
            if (isFalling) {
                cell.classList.add("falling");
                cell.textContent = opponentActiveBlock.letter || "";
            } else if (lockedLetter) {
                cell.classList.add("locked");
                cell.textContent = lockedLetter;
            } else {
                cell.textContent = "";
            }
        });
    }

    function showToast(text) {
        const container = document.getElementById("versus-toasts");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = "versus-toast";
        toast.textContent = text;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function handleMatchOver(data) {
        gameEnded = true;
        cleanupGame();

        const isWin = data.result === "win" || data.winner === session.user.username;
        const title = isWin ? t("you_won") : t("you_lost");
        const modalClass = isWin ? "victory" : "defeat";

        const overlay = document.createElement("div");
        overlay.className = "versus-result-overlay";
        overlay.innerHTML = `
            <section class="versus-result-modal ${modalClass}">
                <h2>${title}</h2>
                <p>${escapeHtml(data.message || (isWin ? "Parabéns, você superou seu oponente!" : "Seu oponente resistiu mais tempo."))}</p>

                <div class="versus-result-scores">
                    <div class="versus-score-box">
                        <small>Você (${escapeHtml(session.user.username)})</small>
                        <strong>${score} pts</strong>
                    </div>
                    <div class="versus-score-box">
                        <small>${escapeHtml(opponentUsername)}</small>
                        <strong>${opponentScore} pts</strong>
                    </div>
                </div>

                <button class="mode-menu-button primary-mode-button" id="btn-versus-rematch">
                    ${t("play_again")}
                </button>
                <button class="mode-menu-button" id="btn-versus-leave">
                    ${t("leave_game")}
                </button>
            </section>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector("#btn-versus-rematch").addEventListener("click", () => {
            overlay.remove();
            renderLobby();
        });

        overlay.querySelector("#btn-versus-leave").addEventListener("click", () => {
            overlay.remove();
            if (socket) socket.close();
            onBack?.();
        });
    }

    function cleanupGame() {
        if (gravityInterval) clearInterval(gravityInterval);
        if (timerInterval) clearInterval(timerInterval);
        gravityInterval = null;
        timerInterval = null;
        if (activeKeyHandler) document.removeEventListener("keydown", activeKeyHandler);
        activeKeyHandler = null;
    }

    function leaveVersus() {
        cleanupGame();
        gameEnded = true;
        sendWs({ type: "leave_match" });
        socket?.close();
        socket = null;
        onBack?.();
    }

    function updateConnectionStatus(connected) {
        const dot = document.getElementById("connection-dot");
        const label = document.getElementById("connection-label");
        if (dot) dot.className = connected ? "status-dot-connected" : "status-dot-disconnected";
        if (label) label.textContent = connected ? "ONLINE" : "DESCONECTADO";
    }

    function showRequestError(message) {
        if (document.getElementById("versus-toasts")) {
            showToast(message);
            return;
        }
        window.alert(message);
        renderLobby();
    }
}

function createBoardCellsHtml() {
    return Array.from({ length: BOARD_ROWS * BOARD_COLUMNS }, () => `
        <div class="board-cell" role="gridcell"></div>
    `).join("");
}

function createOpponentCellsHtml() {
    return Array.from({ length: BOARD_ROWS * BOARD_COLUMNS }, () => `
        <div class="opponent-cell"></div>
    `).join("");
}

function createCurrentBatchHtml(batch, selectedIndex) {
    return batch.map((letter, index) => `
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

function createLetterBatch(letterWeights, random = Math.random) {
    const letters = [...letterWeights.keys()];
    const vowels = letters.filter(l => VOWELS.has(l));
    const batch = [vowels[Math.floor(random() * vowels.length)]];

    while (batch.length < PIECE_SIZE) {
        const candidates = letters.filter(l => !batch.includes(l));
        batch.push(pickWeightedLetter(candidates, letterWeights, random));
    }

    for (let i = batch.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [batch[i], batch[j]] = [batch[j], batch[i]];
    }

    return batch;
}

function pickWeightedLetter(letters, letterWeights, random = Math.random) {
    const total = letters.reduce((sum, l) => sum + (letterWeights.get(l) || 1), 0);
    let rand = random() * total;
    for (const l of letters) {
        rand -= (letterWeights.get(l) || 1);
        if (rand <= 0) return l;
    }
    return letters[letters.length - 1];
}

function createSeededRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) | 0;
        let value = Math.imul(state ^ (state >>> 15), 1 | state);
        value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'\"]/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '\"': "&quot;"
    })[character]);
}

function findBestWord(board, dictionary) {
    const candidates = [];
    board.forEach((row, rowIndex) => {
        collectLineWords(row, "horizontal", rowIndex, dictionary, candidates);
    });
    for (let col = 0; col < BOARD_COLUMNS; col++) {
        const colLetters = board.map(row => row[col]);
        collectLineWords(colLetters, "vertical", col, dictionary, candidates);
    }
    candidates.sort((a, b) => b.word.length - a.word.length);
    return candidates[0] ?? null;
}

function collectLineWords(letters, direction, line, dictionary, candidates) {
    dictionary.forEach(entry => {
        const word = entry.word.toUpperCase();
        for (let start = 0; start <= letters.length - word.length; start++) {
            const section = letters.slice(start, start + word.length);
            if (section.some(l => !l)) continue;
            if (section.join("") !== word) continue;

            const cells = Array.from({ length: word.length }, (_, offset) => {
                const pos = start + offset;
                return direction === "horizontal"
                    ? line * BOARD_COLUMNS + pos
                    : pos * BOARD_COLUMNS + line;
            });

            candidates.push({ word, entry, direction, line, cells });
        }
    });
}

async function loadDictionary() {
    try {
        const response = await fetch("script/data/words.json");
        if (!response.ok) return [];
        const data = await response.json();
        const themes = data.general ?? {};
        return Object.values(themes).flatMap(t => t.words ?? []);
    } catch {
        return [];
    }
}

async function loadLetterWeights() {
    try {
        const response = await fetch("script/data/letters.json");
        if (!response.ok) throw new Error();
        const data = await response.json();
        const defs = Array.isArray(data.letters) ? data.letters : [];
        return new Map(defs.map(d => [d.value, d.weight]));
    } catch {
        return new Map([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map(l => [l, 1]));
    }
}
