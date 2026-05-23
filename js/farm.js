/* ═══════════════════════════════════════════════════════
   🐔 Farm — Enclosure management system
   Buy hens, feed/clean enclosure, hens walk around
   ═══════════════════════════════════════════════════════ */

const Farm = {
    HEN_COST: 50,
    MAX_HENS: 20,
    DEPLETION_RATE: 3, // per hour per hen
    CHECK_INTERVAL: 60000, // check deaths every minute
    canvas: null,
    ctx: null,
    hens: [],
    animFrame: null,
    isOpen: false,

    // Initialize farm data in pet if not present
    ensureData(pet) {
        if (!pet.farm) {
            pet.farm = {
                hens: 0,
                feedLevel: 80,
                cleanLevel: 80,
                lastUpdate: Date.now(),
                deadRecent: 0,
                totalEggs: 0,
            };
        }
        return pet.farm;
    },

    // Update farm stats based on elapsed time
    update(pet) {
        const farm = this.ensureData(pet);
        if (farm.hens <= 0) return farm;

        const now = Date.now();
        const elapsed = (now - farm.lastUpdate) / 3600000; // hours
        if (elapsed < 0.01) return farm;

        const rate = this.DEPLETION_RATE * farm.hens * 0.15;
        farm.feedLevel = Math.max(0, farm.feedLevel - elapsed * rate);
        farm.cleanLevel = Math.max(0, farm.cleanLevel - elapsed * rate * 0.7);

        // Hen death check
        farm.deadRecent = 0;
        if (farm.feedLevel <= 0 && farm.hens > 0) {
            const deaths = Math.min(farm.hens, Math.ceil(elapsed * 0.5));
            if (deaths > 0) {
                farm.hens -= deaths;
                farm.deadRecent = deaths;
                farm.feedLevel = 5; // reset slightly
            }
        }
        if (farm.cleanLevel <= 0 && farm.hens > 0) {
            const deaths = Math.min(farm.hens, Math.ceil(elapsed * 0.3));
            if (deaths > 0) {
                farm.hens -= deaths;
                farm.deadRecent += deaths;
                farm.cleanLevel = 5;
            }
        }

        // Passive coin income from hens (eggs)
        if (farm.feedLevel > 20 && farm.cleanLevel > 20) {
            const eggs = Math.floor(elapsed * farm.hens * 0.3);
            if (eggs > 0) {
                pet.coins += eggs;
                farm.totalEggs += eggs;
            }
        }

        farm.lastUpdate = now;
        return farm;
    },

    buyHen(pet) {
        const farm = this.ensureData(pet);
        if (farm.hens >= this.MAX_HENS) return { ok: false, msg: 'Enclos plein ! (max ' + this.MAX_HENS + ')' };
        if (pet.coins < this.HEN_COST) return { ok: false, msg: 'Il faut ' + this.HEN_COST + ' 🪙 (tu as ' + pet.coins + ')' };
        pet.coins -= this.HEN_COST;
        farm.hens++;
        return { ok: true, msg: '🐔 Nouvelle poule achetée ! (' + farm.hens + '/' + this.MAX_HENS + ')' };
    },

    feedEnclosure(pet) {
        const farm = this.ensureData(pet);
        if (farm.hens <= 0) return { ok: false, msg: 'Pas de poules à nourrir !' };
        if (farm.feedLevel >= 95) return { ok: false, msg: 'L\'enclos est déjà bien nourri ! 🌾' };
        farm.feedLevel = Math.min(100, farm.feedLevel + 40);
        pet.coins += 1;
        return { ok: true, msg: '🌾 Enclos nourri ! +40' };
    },

    cleanEnclosure(pet) {
        const farm = this.ensureData(pet);
        if (farm.hens <= 0) return { ok: false, msg: 'Pas de poules à nettoyer !' };
        if (farm.cleanLevel >= 95) return { ok: false, msg: 'L\'enclos est déjà propre ! ✨' };
        farm.cleanLevel = Math.min(100, farm.cleanLevel + 40);
        pet.coins += 1;
        return { ok: true, msg: '🧹 Enclos nettoyé ! +40' };
    },

    // ─── Rendering ─────────────────────────────────────
    open(pet) {
        this.isOpen = true;
        const farm = this.ensureData(pet);
        this.update(pet);

        const screen = document.getElementById('farm-screen');
        screen.classList.remove('hidden');

        // Setup canvas
        this.canvas = document.getElementById('farm-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // Initialize hen positions
        this.initHens(farm.hens);

        // Update UI
        this.renderUI(pet);

        // Show death notification
        if (farm.deadRecent > 0) {
            this.showDeathNotice(farm.deadRecent);
        }

        // Start animation
        this.animate();
    },

    close() {
        this.isOpen = false;
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        document.getElementById('farm-screen').classList.add('hidden');
    },

    resizeCanvas() {
        const container = document.getElementById('farm-scene');
        if (!container) return;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
    },

    initHens(count) {
        this.hens = [];
        this.henImg = new Image();
        this.henImg.src = 'assets/sprites/poule_enclos.png';
        for (let i = 0; i < count; i++) {
            this.hens.push({
                x: 30 + Math.random() * (this.canvas.width - 80),
                y: this.canvas.height * 0.45 + Math.random() * (this.canvas.height * 0.4),
                targetX: 0, targetY: 0,
                speed: 0.3 + Math.random() * 0.5,
                flipX: Math.random() > 0.5,
                state: 'idle', // idle, walking, pecking
                stateTimer: Math.random() * 200,
                bobOffset: Math.random() * Math.PI * 2,
            });
            this.hens[i].targetX = this.hens[i].x;
            this.hens[i].targetY = this.hens[i].y;
        }
    },

    updateHens() {
        for (const h of this.hens) {
            h.stateTimer--;
            if (h.stateTimer <= 0) {
                // Change state
                const r = Math.random();
                if (r < 0.4) {
                    h.state = 'walking';
                    h.targetX = 30 + Math.random() * (this.canvas.width - 80);
                    h.targetY = this.canvas.height * 0.45 + Math.random() * (this.canvas.height * 0.4);
                    h.stateTimer = 100 + Math.random() * 200;
                } else if (r < 0.7) {
                    h.state = 'pecking';
                    h.stateTimer = 30 + Math.random() * 60;
                } else {
                    h.state = 'idle';
                    h.stateTimer = 50 + Math.random() * 150;
                }
            }

            if (h.state === 'walking') {
                const dx = h.targetX - h.x;
                const dy = h.targetY - h.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2) {
                    h.x += (dx / dist) * h.speed;
                    h.y += (dy / dist) * h.speed;
                    h.flipX = dx < 0;
                } else {
                    h.state = 'idle';
                    h.stateTimer = 50 + Math.random() * 100;
                }
            }
        }
    },

    drawHens() {
        if (!this.henImg.complete) return;
        const t = Date.now() / 1000;
        for (const h of this.hens) {
            const bob = h.state === 'pecking'
                ? Math.sin(t * 8 + h.bobOffset) * 4
                : Math.sin(t * 2 + h.bobOffset) * 1.5;
            const sz = 40;

            this.ctx.save();
            this.ctx.translate(h.x + sz / 2, h.y + sz / 2);
            if (h.flipX) this.ctx.scale(-1, 1);

            // Walking bob
            const walkBob = h.state === 'walking' ? Math.sin(t * 6 + h.bobOffset) * 2 : 0;
            this.ctx.drawImage(this.henImg, -sz / 2, -sz / 2 + bob + walkBob, sz, sz);
            this.ctx.restore();
        }
    },

    animate() {
        if (!this.isOpen) return;
        const isDay = Weather.getSkyBrightness() > 0.5;
        const bg = new Image();
        bg.src = isDay ? 'assets/backgrounds/champs_jour.png' : 'assets/backgrounds/champs_nuit.png';

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        if (bg.complete) {
            this.ctx.drawImage(bg, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Night overlay
        if (!isDay) {
            this.ctx.fillStyle = 'rgba(10,10,40,0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.updateHens();
        this.drawHens();

        this.animFrame = requestAnimationFrame(() => this.animate());
    },

    renderUI(pet) {
        const farm = this.ensureData(pet);

        // Gauges
        const feedBar = document.getElementById('farm-feed-bar');
        const cleanBar = document.getElementById('farm-clean-bar');
        if (feedBar) {
            feedBar.style.width = farm.feedLevel + '%';
            feedBar.style.background = farm.feedLevel > 40 ? '#2ecc71' : farm.feedLevel > 15 ? '#f39c12' : '#e74c3c';
        }
        if (cleanBar) {
            cleanBar.style.width = farm.cleanLevel + '%';
            cleanBar.style.background = farm.cleanLevel > 40 ? '#2ecc71' : farm.cleanLevel > 15 ? '#f39c12' : '#e74c3c';
        }

        // Info
        const info = document.getElementById('farm-info');
        if (info) {
            info.innerHTML =
                '<span>🐔 ' + farm.hens + '/' + this.MAX_HENS + '</span>' +
                '<span>🥚 ' + farm.totalEggs + ' œufs</span>' +
                '<span>🪙 ' + pet.coins + '</span>';
        }
    },

    showDeathNotice(count) {
        const notice = document.getElementById('farm-death-notice');
        if (notice) {
            notice.textContent = '💀 -' + count + ' poule' + (count > 1 ? 's' : '') + ' !';
            notice.classList.remove('hidden');
            setTimeout(() => notice.classList.add('hidden'), 4000);
        }
    },

    // Add a hen to the animation when bought
    addHenToScene() {
        if (!this.canvas) return;
        this.hens.push({
            x: -40,
            y: this.canvas.height * 0.5 + Math.random() * (this.canvas.height * 0.3),
            targetX: 50 + Math.random() * (this.canvas.width - 100),
            targetY: this.canvas.height * 0.45 + Math.random() * (this.canvas.height * 0.4),
            speed: 0.5 + Math.random() * 0.5,
            flipX: false,
            state: 'walking',
            stateTimer: 200,
            bobOffset: Math.random() * Math.PI * 2,
        });
    },
};
