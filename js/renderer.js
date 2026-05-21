/* ═══════════════════════════════════════════════════════
   🐓 Renderer — Visual updates, pet animation, scene
   ═══════════════════════════════════════════════════════ */

const Renderer = {
    els: {},
    walkDir: 1,
    walkTarget: 50,
    currentPetX: 50,
    animState: 'idle',
    clouds: [],

    init() {
        this.els = {
            pet: document.getElementById('pet'),
            petSprite: document.getElementById('pet-sprite'),
            petWrapper: document.getElementById('pet-wrapper'),
            scene: document.getElementById('scene'),
            sceneBg: document.getElementById('scene-bg'),
            sceneOverlay: document.getElementById('scene-overlay'),
            sceneItems: document.getElementById('scene-items'),
            poopContainer: document.getElementById('poop-container'),
            sceneTouch: document.getElementById('scene-touch'),
            emotionBubble: document.getElementById('emotion-bubble'),
            emotionIcon: document.getElementById('emotion-icon'),
            speechBubble: document.getElementById('speech-bubble'),
            speechText: document.getElementById('speech-text'),
            hudName: document.getElementById('hud-name'),
            hudStage: document.getElementById('hud-stage'),
            alertDot: document.getElementById('alert-dot'),
            statFaim: document.getElementById('stat-faim'),
            statBonheur: document.getElementById('stat-bonheur'),
            statEnergie: document.getElementById('stat-energie'),
            statSante: document.getElementById('stat-sante'),
        };
        this.spawnClouds();
    },

    // ─── Update all visuals ────────────────────────────
    update(pet) {
        this.updateHUD(pet);
        this.updateStats(pet);
        this.updatePet(pet);
        this.updateScene(pet);
        this.updatePoops(pet);
    },

    updateHUD(pet) {
        const stage = Engine.STAGES[pet.stade];
        this.els.hudName.textContent = pet.nom;
        this.els.hudStage.textContent = `${stage.emoji} ${stage.nom}`;
        this.els.alertDot.classList.toggle('hidden', !Engine.hasAlerts(pet));
    },

    updateStats(pet) {
        this.setStatBar(this.els.statFaim, pet.faim);
        this.setStatBar(this.els.statBonheur, pet.bonheur);
        this.setStatBar(this.els.statEnergie, pet.energie);
        this.setStatBar(this.els.statSante, pet.sante);
    },

    setStatBar(el, value) {
        const pct = Math.max(0, Math.min(100, value));
        el.style.width = pct + '%';
        el.classList.remove('warning', 'danger');
        if (pct < Engine.CRIT) el.classList.add('danger');
        else if (pct < 40) el.classList.add('warning');
    },

    updatePet(pet) {
        const stage = Engine.STAGES[pet.stade];
        const mood = Engine.getMood(pet);

        // Stage class
        this.els.pet.className = 'pet stage-' + pet.stade;

        // Swap sprite image if stage changed
        const expectedSrc = stage.sprite;
        if (!this.els.petSprite.src.endsWith(expectedSrc)) {
            this.els.petSprite.src = expectedSrc;
            // Fallback to PNG if SVG fails
            this.els.petSprite.onerror = () => {
                this.els.petSprite.src = stage.png;
                this.els.petSprite.onerror = () => {
                    this.els.petSprite.src = 'assets/sprites/francis.png';
                };
            };
        }

        // Animation state
        let anim = 'idle';
        if (mood === 'sleeping') anim = 'sleeping';
        else if (mood === 'malade') anim = 'sick';
        else if (mood === 'triste') anim = 'sad';
        else if (mood === 'faim' || mood === 'fatigue') anim = 'sad';

        if (this.animState !== anim) {
            this.animState = anim;
            this.els.pet.classList.add(anim);
        }

        // Flip direction
        this.els.pet.classList.toggle('flip', this.walkDir < 0);
    },

    updateScene(pet) {
        const night = Engine.isNight();
        this.els.sceneBg.classList.toggle('night', night);
        this.els.sceneOverlay.classList.toggle('night', night);
    },

    updatePoops(pet) {
        const container = this.els.poopContainer;
        const current = container.children.length;
        if (current < pet.poops) {
            for (let i = current; i < pet.poops; i++) {
                const poop = document.createElement('div');
                poop.className = 'poop';
                poop.textContent = '💩';
                poop.style.left = (15 + Math.random() * 70) + '%';
                container.appendChild(poop);
            }
        } else if (current > pet.poops) {
            while (container.children.length > pet.poops) {
                container.lastChild.remove();
            }
        }
    },

    // ─── Pet movement (random walking) ─────────────────
    tickMovement(pet) {
        if (pet.isSleeping || pet.estMort) return;

        // Random direction change
        if (Math.random() < 0.02) {
            this.walkTarget = 15 + Math.random() * 70;
        }

        const dx = this.walkTarget - this.currentPetX;
        if (Math.abs(dx) > 2) {
            this.walkDir = dx > 0 ? 1 : -1;
            this.currentPetX += this.walkDir * 0.3;
            this.els.petWrapper.style.left = this.currentPetX + '%';

            if (!this.els.pet.classList.contains('walking') && this.animState === 'idle') {
                this.els.pet.classList.remove('idle');
                this.els.pet.classList.add('walking');
            }
        } else {
            if (this.els.pet.classList.contains('walking')) {
                this.els.pet.classList.remove('walking');
                this.els.pet.classList.add('idle');
            }
            // Pick new target occasionally
            if (Math.random() < 0.005) {
                this.walkTarget = 15 + Math.random() * 70;
            }
        }

        this.els.pet.classList.toggle('flip', this.walkDir < 0);
    },

    // ─── Visual effects ────────────────────────────────
    showEmotion(emoji, duration = 1500) {
        this.els.emotionIcon.textContent = emoji;
        this.els.emotionBubble.classList.remove('hidden');
        this.els.emotionBubble.style.animation = 'none';
        void this.els.emotionBubble.offsetHeight;
        this.els.emotionBubble.style.animation = '';
        setTimeout(() => this.els.emotionBubble.classList.add('hidden'), duration);
    },

    showSpeech(text, duration = 3000) {
        this.els.speechText.textContent = text;
        this.els.speechBubble.classList.remove('hidden');
        this.els.speechBubble.style.animation = 'none';
        void this.els.speechBubble.offsetHeight;
        this.els.speechBubble.style.animation = '';
        setTimeout(() => this.els.speechBubble.classList.add('hidden'), duration);
    },

    showFloatingItem(emoji, x, y) {
        const item = document.createElement('div');
        item.className = 'float-item';
        item.textContent = emoji;
        item.style.left = (x || 50) + '%';
        item.style.top = (y || 60) + '%';
        this.els.sceneItems.appendChild(item);
        setTimeout(() => item.remove(), 1500);
    },

    showSleepZ() {
        const z = document.createElement('div');
        z.className = 'zzz';
        z.textContent = 'Z';
        z.style.left = (this.currentPetX + 5) + '%';
        z.style.top = '35%';
        z.style.fontSize = (14 + Math.random() * 12) + 'px';
        this.els.sceneItems.appendChild(z);
        setTimeout(() => z.remove(), 2000);
    },

    showHeartAt(x, y) {
        const heart = document.createElement('div');
        heart.className = 'touch-heart';
        heart.textContent = '💕';
        heart.style.left = x + 'px';
        heart.style.top = y + 'px';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1000);
    },

    petEatAnimation() {
        this.els.pet.classList.remove('idle', 'walking');
        this.els.pet.classList.add('eating');
        setTimeout(() => {
            this.els.pet.classList.remove('eating');
            this.els.pet.classList.add('idle');
        }, 2000);
    },

    petHappyAnimation() {
        this.els.pet.classList.remove('idle', 'walking', 'sad');
        this.els.pet.classList.add('happy');
        setTimeout(() => {
            this.els.pet.classList.remove('happy');
            this.els.pet.classList.add('idle');
        }, 1200);
    },

    // ─── Clouds ────────────────────────────────────────
    spawnClouds() {
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            const w = 60 + Math.random() * 80;
            cloud.style.width = w + 'px';
            cloud.style.height = (w * 0.4) + 'px';
            cloud.style.top = (5 + Math.random() * 20) + '%';
            cloud.style.animationDuration = (30 + Math.random() * 40) + 's';
            cloud.style.animationDelay = (-Math.random() * 40) + 's';
            cloud.style.opacity = 0.4 + Math.random() * 0.4;
            this.els.scene.appendChild(cloud);
        }
    },

    // ─── Stats detail panel ────────────────────────────
    renderStatsDetail(pet) {
        const stage = Engine.STAGES[pet.stade];
        const age = Engine.getAge(pet);
        const care = Engine.getCareRating(pet);
        const evo = Engine.getTimeToEvolve(pet);

        const statColor = v => v >= 70 ? '#2ecc71' : v >= 40 ? '#f39c12' : '#e74c3c';

        const statRows = [
            { emoji: '🌾', name: 'Faim', val: pet.faim },
            { emoji: '😊', name: 'Bonheur', val: pet.bonheur },
            { emoji: '⚡', name: 'Énergie', val: pet.energie },
            { emoji: '❤️', name: 'Santé', val: pet.sante },
        ];

        let html = statRows.map(s => `
            <div class="stat-row">
                <span class="stat-emoji">${s.emoji}</span>
                <div class="stat-info">
                    <div class="stat-name">${s.name}</div>
                    <div class="stat-value" style="color:${statColor(s.val)}">${Math.round(s.val)}%</div>
                    <div class="stat-bar-big">
                        <div class="stat-bar-fill" style="width:${s.val}%;background:${statColor(s.val)}"></div>
                    </div>
                </div>
            </div>
        `).join('');

        html += `<div class="stats-section-title">Informations</div>`;
        html += `<div class="stats-info-grid">
            <div class="stats-info-card">
                <div class="label">Stade</div>
                <div class="value">${stage.emoji} ${stage.nom}</div>
            </div>
            <div class="stats-info-card">
                <div class="label">Âge</div>
                <div class="value">${age.days}j ${age.hours}h</div>
            </div>
            <div class="stats-info-card">
                <div class="label">Soin</div>
                <div class="value">${'⭐'.repeat(care)}${'☆'.repeat(3-care)}</div>
            </div>
            <div class="stats-info-card">
                <div class="label">XP</div>
                <div class="value">${pet.experience}</div>
            </div>
            <div class="stats-info-card">
                <div class="label">Actions</div>
                <div class="value">${pet.actions}</div>
            </div>
            <div class="stats-info-card">
                <div class="label">Évolution</div>
                <div class="value">${evo !== null ? Math.ceil(evo) + 'h' : '🏆'}</div>
            </div>
        </div>`;

        return html;
    },

    // ─── Food grid ─────────────────────────────────────
    renderFoodGrid() {
        return Engine.FOODS.map(f => `
            <div class="food-item" data-food="${f.id}">
                <span class="food-icon">${f.emoji}</span>
                <span class="food-name">${f.nom}</span>
                <span class="food-stats">+${f.faim}🌾 +${f.bonheur}😊</span>
            </div>
        `).join('');
    },

    // ─── Evolution screen ──────────────────────────────
    showEvolution(oldStage, newStage) {
        const screen = document.getElementById('evolution-screen');
        document.getElementById('evo-old').textContent = oldStage.emoji;
        document.getElementById('evo-new').textContent = newStage.emoji;
        document.getElementById('evo-desc').textContent = newStage.desc;

        // Particles
        const particles = document.getElementById('evo-particles');
        particles.innerHTML = '';
        const colors = ['#f0c040', '#e8593c', '#4ecdc4', '#e84393', '#4a90d9'];
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'evo-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            p.style.setProperty('--dx', (Math.random() - 0.5) * 200 + 'px');
            p.style.setProperty('--dy', (Math.random() - 0.5) * 200 + 'px');
            p.style.animationDelay = Math.random() * 1 + 's';
            particles.appendChild(p);
        }

        screen.classList.remove('hidden');
        this.haptic('heavy');
    },

    hideEvolution() {
        document.getElementById('evolution-screen').classList.add('hidden');
    },

    // ─── Death screen ──────────────────────────────────
    showDeath(pet) {
        const age = Engine.getAge(pet);
        const stage = Engine.STAGES[pet.stade];
        document.getElementById('death-desc').textContent =
            `${pet.nom} a vécu ${age.days} jours en tant que ${stage.nom}.\nCause : ${pet.causeMort || 'inconnue'}.`;
        document.getElementById('death-stats').innerHTML = `
            <p style="color:#888">XP: ${pet.experience} · Actions: ${pet.actions}</p>`;
        document.getElementById('death-screen').classList.remove('hidden');
    },

    hideDeath() {
        document.getElementById('death-screen').classList.add('hidden');
    },

    // ─── Toast ─────────────────────────────────────────
    toast(msg, duration = 2500) {
        const el = document.getElementById('toast');
        document.getElementById('toast-text').textContent = msg;
        el.classList.remove('hidden');
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = '';
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
    },

    // ─── Haptic ────────────────────────────────────────
    haptic(type = 'light') {
        try {
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
            }
        } catch(e) {}
    },
};
