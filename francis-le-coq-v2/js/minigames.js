/* ═══════════════════════════════════════════════════════
   🐓 Minigames — Tap & Catch games
   ═══════════════════════════════════════════════════════ */

const Minigames = {
    active: false,
    timer: null,
    score: 0,
    onComplete: null,

    GAMES: [
        { id: 'tap', nom: 'Attrape les grains ! 🌾', desc: 'Tape sur les grains le plus vite possible !' },
        { id: 'memory', nom: 'Mémoire de coq 🧠', desc: 'Retiens la séquence !' },
    ],

    start(onComplete) {
        this.onComplete = onComplete;
        const game = this.GAMES[Math.floor(Math.random() * this.GAMES.length)];
        document.getElementById('minigame-title').textContent = game.nom;
        document.getElementById('minigame-screen').classList.remove('hidden');
        
        if (game.id === 'tap') this.startTapGame();
        else this.startMemoryGame();
    },

    close() {
        this.active = false;
        clearTimeout(this.timer);
        clearInterval(this._interval);
        document.getElementById('minigame-screen').classList.add('hidden');
    },

    // ─── Tap Game ──────────────────────────────────────
    startTapGame() {
        this.active = true;
        this.score = 0;
        let timeLeft = 10000;
        const area = document.getElementById('minigame-area');

        area.innerHTML = `
            <div class="mini-score" id="mg-score">0</div>
            <div class="mini-timer-bar" id="mg-timer" style="width:100%"></div>
            <div class="mini-field" id="mg-field"></div>
        `;

        const field = document.getElementById('mg-field');
        const scoreEl = document.getElementById('mg-score');
        const timerEl = document.getElementById('mg-timer');

        const spawnTarget = () => {
            if (!this.active) return;
            field.querySelectorAll('.mini-target').forEach(t => t.remove());

            const target = document.createElement('div');
            target.className = 'mini-target';
            const emojis = ['🌾', '🌽', '🥖', '🧀', '🐛'];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            const points = emoji === '🐛' ? -2 : (emoji === '🌾' ? 1 : 2);
            target.textContent = emoji;
            target.style.left = (10 + Math.random() * 70) + '%';
            target.style.top = (10 + Math.random() * 70) + '%';

            target.addEventListener('click', (e) => {
                e.stopPropagation();
                this.score = Math.max(0, this.score + points);
                scoreEl.textContent = this.score;
                target.remove();
                Renderer.haptic(points > 0 ? 'light' : 'medium');

                // Float effect
                const item = document.createElement('div');
                item.className = 'float-item';
                item.textContent = points > 0 ? `+${points}` : `${points}`;
                item.style.color = points > 0 ? '#2ecc71' : '#e74c3c';
                item.style.left = target.style.left;
                item.style.top = target.style.top;
                item.style.fontSize = '18px';
                item.style.fontWeight = '700';
                field.appendChild(item);
                setTimeout(() => item.remove(), 1000);

                if (this.active) setTimeout(spawnTarget, 200);
            });

            field.appendChild(target);
            this.timer = setTimeout(() => { if (this.active) { target.remove(); spawnTarget(); } }, 1500);
        };

        // Countdown timer
        const startTime = Date.now();
        this._interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const pct = Math.max(0, (1 - elapsed / timeLeft) * 100);
            timerEl.style.width = pct + '%';
            timerEl.style.background = pct > 30 ? '#2ecc71' : pct > 10 ? '#f39c12' : '#e74c3c';

            if (elapsed >= timeLeft) {
                this.active = false;
                clearInterval(this._interval);
                this.endTapGame();
            }
        }, 50);

        spawnTarget();
    },

    endTapGame() {
        const area = document.getElementById('minigame-area');
        const bonus = Math.min(20, this.score * 2);
        area.innerHTML = `
            <div class="mini-result">
                <div style="font-size:48px;margin-bottom:12px">🌾</div>
                <div style="font-size:24px;font-weight:800;color:#f0c040;margin-bottom:8px">Score : ${this.score}</div>
                <div style="font-size:14px;color:#8888aa;margin-bottom:16px">Bonus bonheur : +${bonus}</div>
                <button class="mini-btn" id="mg-done">Super ! 🐓</button>
            </div>
        `;
        document.getElementById('mg-done').addEventListener('click', () => {
            this.close();
            if (this.onComplete) this.onComplete(bonus);
        });
        Renderer.haptic('medium');
    },

    // ─── Memory Game ───────────────────────────────────
    startMemoryGame() {
        this.active = true;
        this.score = 0;
        const area = document.getElementById('minigame-area');
        const emojis = ['🌾', '🌽', '🥖', '🧀', '💊', '⚽'];
        let sequence = [];
        let playerSeq = [];
        let round = 1;

        const render = () => {
            area.innerHTML = `
                <div class="mini-score" id="mg-score">Niveau ${round}</div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:100%;max-width:280px" id="mg-grid"></div>
                <div style="font-size:13px;color:#8888aa" id="mg-msg">Regarde bien...</div>
            `;
            const grid = document.getElementById('mg-grid');
            emojis.forEach((e, i) => {
                const btn = document.createElement('button');
                btn.className = 'food-item';
                btn.style.padding = '16px';
                btn.style.opacity = '0.5';
                btn.innerHTML = `<span style="font-size:32px">${e}</span>`;
                btn.dataset.idx = i;
                btn.addEventListener('click', () => handleTap(i));
                grid.appendChild(btn);
            });
        };

        const flash = async (idx) => {
            const grid = document.getElementById('mg-grid');
            if (!grid) return;
            const btn = grid.children[idx];
            if (!btn) return;
            btn.style.opacity = '1';
            btn.style.border = '2px solid #f0c040';
            await new Promise(r => setTimeout(r, 500));
            btn.style.opacity = '0.5';
            btn.style.border = '';
            await new Promise(r => setTimeout(r, 200));
        };

        const showSequence = async () => {
            const newEmoji = Math.floor(Math.random() * emojis.length);
            sequence.push(newEmoji);
            render();

            const msg = document.getElementById('mg-msg');
            if (msg) msg.textContent = 'Regarde bien...';

            await new Promise(r => setTimeout(r, 600));
            for (const idx of sequence) {
                if (!this.active) return;
                await flash(idx);
            }

            if (msg) msg.textContent = 'À toi !';
            playerSeq = [];
            const grid = document.getElementById('mg-grid');
            if (grid) Array.from(grid.children).forEach(b => b.style.opacity = '1');
        };

        const handleTap = (idx) => {
            if (!this.active) return;
            playerSeq.push(idx);
            Renderer.haptic('light');

            const grid = document.getElementById('mg-grid');
            if (grid && grid.children[idx]) {
                grid.children[idx].style.border = '2px solid #4ecdc4';
                setTimeout(() => {
                    if (grid.children[idx]) grid.children[idx].style.border = '';
                }, 200);
            }

            const pos = playerSeq.length - 1;
            if (playerSeq[pos] !== sequence[pos]) {
                this.active = false;
                this.endMemoryGame(round - 1);
                return;
            }

            if (playerSeq.length === sequence.length) {
                round++;
                this.score = round - 1;
                setTimeout(() => { if (this.active) showSequence(); }, 800);
            }
        };

        showSequence();
    },

    endMemoryGame(level) {
        const area = document.getElementById('minigame-area');
        const bonus = Math.min(20, level * 4);
        area.innerHTML = `
            <div class="mini-result">
                <div style="font-size:48px;margin-bottom:12px">🧠</div>
                <div style="font-size:24px;font-weight:800;color:#f0c040;margin-bottom:8px">Niveau atteint : ${level}</div>
                <div style="font-size:14px;color:#8888aa;margin-bottom:16px">Bonus bonheur : +${bonus}</div>
                <button class="mini-btn" id="mg-done">Cocorico ! 🐓</button>
            </div>
        `;
        document.getElementById('mg-done').addEventListener('click', () => {
            this.close();
            if (this.onComplete) this.onComplete(bonus);
        });
    },
};
