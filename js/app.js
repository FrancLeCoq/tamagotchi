/* ═══════════════════════════════════════════════════════
   🐓 App — Main game controller
   ═══════════════════════════════════════════════════════ */

const App = {
    pet: null,
    gameLoop: null,
    moveLoop: null,
    saveInterval: null,
    speechInterval: null,
    sleepZInterval: null,

    init() {
        Storage.init();
        Renderer.init();
        this.bindEvents();
        this.initTelegram();

        Storage.load((data) => {
            if (data && !data.estMort) {
                this.pet = data;
                Engine.updateStats(this.pet);
                this.showGame();
            } else {
                document.getElementById('splash-screen').classList.add('active');
            }
        });
    },

    // ─── Telegram WebApp integration ───────────────────
    initTelegram() {
        try {
            const tg = window.Telegram?.WebApp;
            if (tg) {
                tg.ready();
                tg.expand();
                tg.enableClosingConfirmation();
                if (tg.themeParams) {
                    const tp = tg.themeParams;
                    if (tp.bg_color) {
                        document.documentElement.style.setProperty('--bg-dark', tp.bg_color);
                    }
                }
                tg.BackButton.onClick(() => {
                    const overlays = document.querySelectorAll('.overlay:not(.hidden)');
                    if (overlays.length) {
                        overlays.forEach(o => o.classList.add('hidden'));
                        tg.BackButton.hide();
                    }
                });
            }
        } catch(e) { console.log('Not in Telegram context'); }
    },

    // ─── Event bindings ────────────────────────────────
    bindEvents() {
        // Start button
        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.newGame();
        });

        // Action buttons
        document.getElementById('btn-nourrir').addEventListener('click', () => this.openFood());
        document.getElementById('btn-jouer').addEventListener('click', () => this.doPlay());
        document.getElementById('btn-dormir').addEventListener('click', () => this.doSleep());
        document.getElementById('btn-soigner').addEventListener('click', () => this.doHeal());
        document.getElementById('btn-nettoyer').addEventListener('click', () => this.doClean());
        document.getElementById('btn-stats').addEventListener('click', () => this.openStats());

        // Close buttons
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.close;
                document.getElementById(target).classList.add('hidden');
                try { window.Telegram?.WebApp?.BackButton?.hide(); } catch(e) {}
            });
        });

        // Evolution OK
        document.getElementById('btn-evo-ok').addEventListener('click', () => {
            Renderer.hideEvolution();
        });

        // Restart
        document.getElementById('btn-restart').addEventListener('click', () => {
            Renderer.hideDeath();
            this.newGame();
        });

        // Scene touch (petting)
        document.getElementById('scene-touch').addEventListener('click', (e) => {
            this.doPet(e);
        });

        // Food grid delegation
        document.getElementById('food-grid').addEventListener('click', (e) => {
            const item = e.target.closest('[data-food]');
            if (item) this.doFeed(item.dataset.food);
        });
    },

    // ─── New game ──────────────────────────────────────
    newGame() {
        let name = 'Francis';
        try {
            const tg = window.Telegram?.WebApp;
            if (tg?.initDataUnsafe?.user?.first_name) {
                // Keep Francis as the pet name
            }
        } catch(e) {}

        this.pet = Engine.createPet(name);
        Storage.save(this.pet);
        this.showGame();
        Renderer.toast('🥚 Francis est né ! Prends soin de lui !');
        Renderer.showEmotion('🐣', 2000);
    },

    // ─── Show main game ────────────────────────────────
    showGame() {
        document.getElementById('splash-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');

        Renderer.update(this.pet);
        this.startLoops();

        // Check for death on load
        if (this.pet.estMort) {
            setTimeout(() => Renderer.showDeath(this.pet), 500);
        }
    },

    // ─── Game loops ────────────────────────────────────
    startLoops() {
        this.stopLoops();

        // Main game tick (every 5 seconds)
        this.gameLoop = setInterval(() => this.gameTick(), 5000);

        // Movement tick (60fps-ish)
        this.moveLoop = setInterval(() => {
            if (this.pet && !this.pet.estMort) {
                Renderer.tickMovement(this.pet);
            }
        }, 50);

        // Auto-save (every 30 seconds)
        this.saveInterval = setInterval(() => {
            if (this.pet) Storage.save(this.pet);
        }, 30000);

        // Random speech
        this.speechInterval = setInterval(() => {
            if (this.pet && !this.pet.estMort && !this.pet.isSleeping) {
                if (Math.random() < 0.3) {
                    Renderer.showSpeech(Engine.getDialogue(this.pet));
                }
            }
        }, 15000);

        // Sleep Z's
        this.sleepZInterval = setInterval(() => {
            if (this.pet?.isSleeping) {
                Renderer.showSleepZ();
            }
        }, 1500);
    },

    stopLoops() {
        clearInterval(this.gameLoop);
        clearInterval(this.moveLoop);
        clearInterval(this.saveInterval);
        clearInterval(this.speechInterval);
        clearInterval(this.sleepZInterval);
    },

    gameTick() {
        if (!this.pet || this.pet.estMort) return;

        Engine.updateStats(this.pet);
        Renderer.update(this.pet);
        this.updateCooldowns();

        // Check evolution
        if (Engine.checkEvolution(this.pet)) {
            const oldStage = Engine.STAGES[this.pet.stade];
            Engine.evolve(this.pet);
            const newStage = Engine.STAGES[this.pet.stade];
            Renderer.showEvolution(oldStage, newStage);
            Storage.save(this.pet);
        }

        // Check death
        if (this.pet.estMort) {
            Renderer.showDeath(this.pet);
            Storage.save(this.pet);
        }
    },

    updateCooldowns() {
        const now = Date.now();
        const actions = ['nourrir', 'jouer', 'dormir', 'soigner', 'nettoyer'];
        actions.forEach(action => {
            const btn = document.getElementById('btn-' + action);
            if (!btn) return;
            const cd = this.pet.cooldowns[action] || 0;
            if (now < cd) {
                btn.classList.add('on-cooldown');
                const secs = Math.ceil((cd - now) / 1000);
                const m = Math.floor(secs / 60), s = secs % 60;
                let timerEl = btn.querySelector('.cooldown-timer');
                if (!timerEl) {
                    timerEl = document.createElement('span');
                    timerEl.className = 'cooldown-timer';
                    btn.appendChild(timerEl);
                }
                timerEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
            } else {
                btn.classList.remove('on-cooldown');
                const timerEl = btn.querySelector('.cooldown-timer');
                if (timerEl) timerEl.remove();
            }
        });
    },

    // ─── Actions ───────────────────────────────────────
    openFood() {
        if (!this.pet || this.pet.estMort) return;
        if (this.pet.isSleeping) { Renderer.toast('😴 Francis dort !'); return; }

        const check = Engine.canDoAction(this.pet, 'nourrir');
        if (!check.ok) { Renderer.toast(check.msg); return; }

        document.getElementById('food-grid').innerHTML = Renderer.renderFoodGrid();
        document.getElementById('food-screen').classList.remove('hidden');
        try { window.Telegram?.WebApp?.BackButton?.show(); } catch(e) {}
    },

    doFeed(foodId) {
        const result = Engine.feed(this.pet, foodId);
        document.getElementById('food-screen').classList.add('hidden');
        try { window.Telegram?.WebApp?.BackButton?.hide(); } catch(e) {}

        if (result.ok) {
            Renderer.toast(result.msg);
            Renderer.petEatAnimation();
            Renderer.showFloatingItem(result.food.emoji, this.randomSceneX(), 50);
            Renderer.haptic('light');
            Storage.save(this.pet);
        } else {
            Renderer.toast(result.msg);
        }
        Renderer.update(this.pet);
    },

    doPlay() {
        if (!this.pet || this.pet.estMort) return;
        if (this.pet.isSleeping) { Renderer.toast('😴 Francis dort !'); return; }

        const check = Engine.canDoAction(this.pet, 'jouer');
        if (!check.ok) { Renderer.toast(check.msg); return; }

        Minigames.start((bonus) => {
            const result = Engine.play(this.pet, bonus);
            if (result.ok) {
                Renderer.toast(`🎮 +${bonus} bonheur !`);
                Renderer.petHappyAnimation();
                Renderer.showEmotion('🎉');
                Renderer.haptic('light');
                Storage.save(this.pet);
            }
            Renderer.update(this.pet);
        });
    },

    doSleep() {
        if (!this.pet || this.pet.estMort) return;
        const result = Engine.sleep(this.pet);
        Renderer.toast(result.msg);
        if (result.ok) {
            Renderer.haptic('light');
            if (this.pet.isSleeping) {
                Renderer.showEmotion('😴');
            } else {
                Renderer.showEmotion('☀️');
                Renderer.petHappyAnimation();
            }
            Storage.save(this.pet);
        }
        Renderer.update(this.pet);
    },

    doHeal() {
        if (!this.pet || this.pet.estMort) return;
        if (this.pet.isSleeping) { Renderer.toast('😴 Francis dort !'); return; }

        const result = Engine.heal(this.pet);
        Renderer.toast(result.msg);
        if (result.ok) {
            Renderer.showFloatingItem('💊', this.randomSceneX(), 50);
            Renderer.showEmotion('💪');
            Renderer.haptic('light');
            Storage.save(this.pet);
        }
        Renderer.update(this.pet);
    },

    doClean() {
        if (!this.pet) return;
        const result = Engine.clean(this.pet);
        Renderer.toast(result.msg);
        if (result.ok) {
            Renderer.showEmotion('✨');
            Renderer.haptic('light');
            Storage.save(this.pet);
        }
        Renderer.update(this.pet);
    },

    doPet(e) {
        if (!this.pet || this.pet.estMort) return;
        Renderer.showHeartAt(e.clientX - 10, e.clientY - 10);

        const result = Engine.caress(this.pet);
        if (result.ok) {
            Renderer.showEmotion('💕');
            this.els_pet().classList.add('pet-touched');
            setTimeout(() => this.els_pet().classList.remove('pet-touched'), 300);
            Renderer.haptic('light');
            Storage.save(this.pet);
        }
        Renderer.update(this.pet);
    },

    openStats() {
        if (!this.pet) return;
        document.getElementById('stats-detail').innerHTML = Renderer.renderStatsDetail(this.pet);
        document.getElementById('stats-screen').classList.remove('hidden');
        try { window.Telegram?.WebApp?.BackButton?.show(); } catch(e) {}
    },

    // ─── Helpers ───────────────────────────────────────
    randomSceneX() { return 20 + Math.random() * 60; },
    els_pet() { return document.getElementById('pet'); },
};

// ─── Boot ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
