/* ═══════════════════════════════════════════════════════
   🐓 App — Main game controller v2
   Sound, hygiene, toilet, shower, health alternation
   ═══════════════════════════════════════════════════════ */

const App = {
    pet: null,
    gameLoop: null,
    moveLoop: null,
    saveInterval: null,
    speechInterval: null,
    sleepZInterval: null,
    bgMusic: null,
    soundOn: false,

    init() {
        Storage.init();
        Renderer.init();
        this.bindEvents();
        this.initTelegram();
        this.initSound();

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

    initTelegram() {
        try {
            const tg = window.Telegram?.WebApp;
            if (tg) {
                tg.ready(); tg.expand(); tg.enableClosingConfirmation();
                tg.BackButton.onClick(() => {
                    const overlays = document.querySelectorAll('.overlay:not(.hidden)');
                    if (overlays.length) {
                        overlays.forEach(o => o.classList.add('hidden'));
                        tg.BackButton.hide();
                    }
                });
            }
        } catch(e) {}
    },

    initSound() {
        this.bgMusic = new Audio('assets/sounds/ferme.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.3;
    },

    toggleSound() {
        this.soundOn = !this.soundOn;
        const icon = document.getElementById('sound-icon');
        if (this.soundOn) {
            this.bgMusic.play().catch(() => {});
            icon.textContent = '🔊';
        } else {
            this.bgMusic.pause();
            icon.textContent = '🔇';
        }
    },

    bindEvents() {
        document.getElementById('btn-start-game').addEventListener('click', () => this.newGame());
        document.getElementById('btn-nourrir').addEventListener('click', () => this.openFood());
        document.getElementById('btn-jouer').addEventListener('click', () => this.doPlay());
        document.getElementById('btn-dormir').addEventListener('click', () => this.doSleep());
        document.getElementById('btn-soigner').addEventListener('click', () => this.doHeal());
        document.getElementById('btn-toilette').addEventListener('click', () => this.doToilet());
        document.getElementById('btn-douche').addEventListener('click', () => this.doShower());
        document.getElementById('btn-stats').addEventListener('click', () => this.openStats());
        document.getElementById('btn-sound').addEventListener('click', () => this.toggleSound());

        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById(btn.dataset.close).classList.add('hidden');
                try { window.Telegram?.WebApp?.BackButton?.hide(); } catch(e) {}
            });
        });

        document.getElementById('btn-evo-ok').addEventListener('click', () => Renderer.hideEvolution());
        document.getElementById('btn-restart').addEventListener('click', () => { Renderer.hideDeath(); this.newGame(); });
        document.getElementById('scene-touch').addEventListener('click', (e) => this.doPet(e));
        document.getElementById('food-grid').addEventListener('click', (e) => {
            const item = e.target.closest('[data-food]');
            if (item) this.doFeed(item.dataset.food);
        });
    },

    newGame() {
        this.pet = Engine.createPet('Francis');
        Storage.save(this.pet);
        this.showGame();
        Renderer.toast('🥚 Francis est né ! Prends soin de lui !');
        Renderer.showEmotion('🐣', 2000);
    },

    showGame() {
        document.getElementById('splash-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        Renderer.update(this.pet);
        Weather.init();
        this.startLoops();
        if (this.pet.estMort) setTimeout(() => Renderer.showDeath(this.pet), 500);
    },

    startLoops() {
        this.stopLoops();
        this.gameLoop = setInterval(() => this.gameTick(), 5000);
        this.moveLoop = setInterval(() => {
            if (this.pet && !this.pet.estMort) Renderer.tickMovement(this.pet);
        }, 50);
        this.saveInterval = setInterval(() => { if (this.pet) Storage.save(this.pet); }, 30000);
        this.speechInterval = setInterval(() => {
            if (this.pet && !this.pet.estMort && !this.pet.isSleeping && Math.random() < 0.3) {
                Renderer.showSpeech(Engine.getDialogue(this.pet));
            }
        }, 15000);
        this.sleepZInterval = setInterval(() => {
            if (this.pet?.isSleeping) Renderer.showSleepZ();
        }, 1500);
    },

    stopLoops() {
        clearInterval(this.gameLoop); clearInterval(this.moveLoop);
        clearInterval(this.saveInterval); clearInterval(this.speechInterval);
        clearInterval(this.sleepZInterval);
    },

    gameTick() {
        if (!this.pet || this.pet.estMort) return;
        Engine.updateStats(this.pet);
        Renderer.update(this.pet);
        this.updateCooldowns();
        if (Engine.checkEvolution(this.pet)) {
            const oldStage = Engine.STAGES[this.pet.stade];
            Engine.evolve(this.pet);
            const newStage = Engine.STAGES[this.pet.stade];
            Renderer.showEvolution(oldStage, newStage);
            Storage.save(this.pet);
        }
        if (this.pet.estMort) { Renderer.showDeath(this.pet); Storage.save(this.pet); }
    },

    updateCooldowns() {
        const now = Date.now();
        const actions = ['nourrir', 'jouer', 'dormir', 'soigner', 'toilette', 'douche'];
        actions.forEach(action => {
            const btn = document.getElementById('btn-' + action);
            if (!btn) return;
            const cd = this.pet.cooldowns[action] || 0;
            if (now < cd) {
                btn.classList.add('on-cooldown');
                const secs = Math.ceil((cd - now) / 1000);
                const m = Math.floor(secs / 60), s = secs % 60;
                let t = btn.querySelector('.cooldown-timer');
                if (!t) { t = document.createElement('span'); t.className = 'cooldown-timer'; btn.appendChild(t); }
                t.textContent = m + ':' + String(s).padStart(2, '0');
            } else {
                btn.classList.remove('on-cooldown');
                const t = btn.querySelector('.cooldown-timer');
                if (t) t.remove();
            }
        });
    },

    // ─── Actions ───────────────────────────────────────
    openFood() {
        if (!this.pet || this.pet.estMort || this.pet.isSleeping) { Renderer.toast('😴 Francis dort !'); return; }
        const check = Engine.canDoAction(this.pet, 'nourrir');
        if (!check.ok) { Renderer.toast(check.msg); return; }
        document.getElementById('food-grid').innerHTML = Renderer.renderFoodGrid();
        document.getElementById('food-screen').classList.remove('hidden');
    },

    doFeed(foodId) {
        const result = Engine.feed(this.pet, foodId);
        document.getElementById('food-screen').classList.add('hidden');
        if (result.ok) {
            Renderer.toast(result.msg);
            Renderer.petEatAnimation();
            Renderer.showFloatingItem(result.food.emoji, this.rndX(), 50);
            Renderer.haptic('light');
            Storage.save(this.pet);
        } else { Renderer.toast(result.msg); }
        Renderer.update(this.pet);
    },

    doPlay() {
        if (!this.pet || this.pet.estMort || this.pet.isSleeping) return;
        const check = Engine.canDoAction(this.pet, 'jouer');
        if (!check.ok) { Renderer.toast(check.msg); return; }
        Minigames.start((bonus) => {
            const result = Engine.play(this.pet, bonus);
            if (result.ok) {
                Renderer.toast('🎮 +' + bonus + ' bonheur !');
                Renderer.petHappyAnimation();
                Renderer.showEmotion('🎉');
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
            Renderer.showEmotion(this.pet.isSleeping ? '😴' : '☀️');
            if (!this.pet.isSleeping) Renderer.petHappyAnimation();
            Storage.save(this.pet);
        }
        Renderer.update(this.pet);
    },

    doHeal() {
        if (!this.pet || this.pet.estMort || this.pet.isSleeping) return;
        const result = Engine.heal(this.pet);
        Renderer.toast(result.msg);
        if (result.ok) {
            Renderer.showFloatingItem(result.emoji, this.rndX(), 40);
            Renderer.showEmotion(result.isInjection ? '😖' : '😬');
            Renderer.haptic(result.isInjection ? 'heavy' : 'light');
            Storage.save(this.pet);
        }
        Renderer.update(this.pet);
    },

    doToilet() {
        if (!this.pet) return;
        const result = Engine.toilet(this.pet);
        Renderer.toast(result.msg);
        if (result.ok) {
            Renderer.showEmotion('✨');
            Renderer.haptic('light');
            Storage.save(this.pet);
        }
        Renderer.update(this.pet);
    },

    doShower() {
        if (!this.pet || this.pet.estMort || this.pet.isSleeping) return;
        const result = Engine.shower(this.pet);
        Renderer.toast(result.msg);
        if (result.ok) {
            Renderer.showShowerAnimation();
            Renderer.showEmotion('🧼');
            Renderer.petHappyAnimation();
            Renderer.haptic('medium');
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
            Renderer.haptic('light');
            Storage.save(this.pet);
        }
        Renderer.update(this.pet);
    },

    openStats() {
        if (!this.pet) return;
        document.getElementById('stats-detail').innerHTML = Renderer.renderStatsDetail(this.pet);
        document.getElementById('stats-screen').classList.remove('hidden');
    },

    rndX() { return 20 + Math.random() * 60; },
};

document.addEventListener('DOMContentLoaded', () => App.init());
