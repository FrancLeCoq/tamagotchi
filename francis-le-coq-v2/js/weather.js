/* ═══════════════════════════════════════════════════════
   🌤️ Weather — Day/night cycle, clouds, rain, fog
   1 game hour = 2 real minutes (full day = 48 min)
   ═══════════════════════════════════════════════════════ */

const Weather = {
    HOUR_MS: 120000,
    startTime: null,
    startHour: 6,
    canvas: null,
    ctx: null,
    clouds: [],
    raindrops: [],
    fogParticles: [],
    animFrame: null,
    lastBgState: null,

    SCHEDULE: {
        fog:  [[8, 9], [20, 21]],
        rain: [[3, 4], [15, 16]],
    },

    init(sceneEl) {
        this.startTime = Date.now();
        this.canvas = document.getElementById('weather-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.initClouds();
        this.tick();
    },

    resizeCanvas() {
        const scene = document.querySelector('.scene');
        if (!scene) return;
        this.canvas.width = scene.offsetWidth;
        this.canvas.height = scene.offsetHeight;
    },

    getGameHour() {
        const elapsed = Date.now() - this.startTime;
        const totalGameHours = elapsed / this.HOUR_MS;
        return (this.startHour + totalGameHours) % 24;
    },

    getGameHourInt() {
        return Math.floor(this.getGameHour());
    },

    getFormattedTime() {
        const h = this.getGameHour();
        const hh = Math.floor(h);
        const mm = Math.floor((h - hh) * 60);
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    },

    isInRange(hour, ranges) {
        for (const [start, end] of ranges) {
            if (hour >= start && hour < end) return true;
        }
        return false;
    },

    getWeather() {
        const h = this.getGameHour();
        if (this.isInRange(h, this.SCHEDULE.rain)) return 'rain';
        if (this.isInRange(h, this.SCHEDULE.fog)) return 'fog';
        return 'clear';
    },

    isDaytime() {
        const h = this.getGameHour();
        return h >= 7 && h < 21;
    },

    getSkyBrightness() {
        const h = this.getGameHour();
        if (h >= 8 && h < 19) return 1.0;
        if (h >= 21 || h < 5) return 0.0;
        if (h >= 5 && h < 8) return (h - 5) / 3;
        if (h >= 19 && h < 21) return 1.0 - (h - 19) / 2;
        return 0.5;
    },

    // ─── Clouds ────────────────────────────────────────
    initClouds() {
        this.clouds = [];
        for (let i = 0; i < 4; i++) {
            this.clouds.push({
                x: Math.random() * (this.canvas.width + 400) - 200,
                y: 20 + Math.random() * 80,
                speed: 0.15 + Math.random() * 0.25,
                type: Math.random() > 0.5 ? 1 : 2,
                scale: 0.5 + Math.random() * 0.6,
                opacity: 0.7 + Math.random() * 0.3,
            });
        }
        this.cloudImg1 = new Image(); this.cloudImg1.src = 'assets/weather/nuage1.png';
        this.cloudImg2 = new Image(); this.cloudImg2.src = 'assets/weather/nuage2.png';
        this.sunImg = new Image(); this.sunImg.src = 'assets/weather/soleil.png';
        this.moonImg = new Image(); this.moonImg.src = 'assets/weather/lune.png';
    },

    updateClouds(weather) {
        const dense = weather === 'rain' || weather === 'fog';
        const targetCount = dense ? 10 : 4;
        const speedMult = dense ? 0.4 : 1.0;

        while (this.clouds.length < targetCount) {
            this.clouds.push({
                x: -300,
                y: 10 + Math.random() * (dense ? 150 : 80),
                speed: (dense ? 0.08 : 0.15) + Math.random() * (dense ? 0.1 : 0.25),
                type: Math.random() > 0.5 ? 1 : 2,
                scale: dense ? 0.8 + Math.random() * 0.8 : 0.5 + Math.random() * 0.6,
                opacity: dense ? 0.85 + Math.random() * 0.15 : 0.7 + Math.random() * 0.3,
            });
        }
        while (this.clouds.length > targetCount) this.clouds.pop();

        for (const c of this.clouds) {
            c.x += c.speed * speedMult;
            const cw = (c.type === 1 ? 354 : 188) * c.scale;
            if (c.x > this.canvas.width + 100) {
                c.x = -cw - 50;
                c.y = 10 + Math.random() * (dense ? 150 : 80);
            }
        }
    },

    drawClouds() {
        for (const c of this.clouds) {
            const img = c.type === 1 ? this.cloudImg1 : this.cloudImg2;
            if (!img.complete) continue;
            const w = img.naturalWidth * c.scale;
            const h = img.naturalHeight * c.scale;
            this.ctx.globalAlpha = c.opacity;
            this.ctx.drawImage(img, c.x, c.y, w, h);
        }
        this.ctx.globalAlpha = 1;
    },

    // ─── Sun & Moon ────────────────────────────────────
    drawCelestial() {
        const h = this.getGameHour();
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        if (h >= 6 && h < 20 && this.sunImg.complete) {
            const progress = (h - 6) / 14;
            const x = progress * (cw - 60) + 10;
            const y = 15 + Math.sin(progress * Math.PI) * -30 + 40;
            const size = 60 + Math.sin(progress * Math.PI) * 15;
            this.ctx.globalAlpha = Math.min(1, Math.min((h - 6) / 1.5, (20 - h) / 1.5));
            this.ctx.drawImage(this.sunImg, x, y, size, size);
            this.ctx.globalAlpha = 1;
        }

        if ((h >= 20 || h < 6) && this.moonImg.complete) {
            const nightH = h >= 20 ? h - 20 : h + 4;
            const progress = nightH / 10;
            const x = progress * (cw - 50) + 10;
            const y = 10 + Math.sin(progress * Math.PI) * -25 + 35;
            this.ctx.globalAlpha = Math.min(1, Math.min(nightH / 1, (10 - nightH) / 1));
            this.ctx.drawImage(this.moonImg, x, y, 55, 55);
            this.ctx.globalAlpha = 1;
        }
    },

    // ─── Rain ──────────────────────────────────────────
    updateRain() {
        const h = this.getGameHour();
        let intensity = 0;
        for (const [start, end] of this.SCHEDULE.rain) {
            if (h >= start && h < end) {
                const mid = (start + end) / 2;
                intensity = h < mid
                    ? (h - start) / (mid - start)
                    : 1 - (h - mid) / (end - mid);
                break;
            }
        }

        const targetDrops = Math.floor(intensity * 200);
        while (this.raindrops.length < targetDrops) {
            this.raindrops.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * -this.canvas.height,
                speed: 4 + Math.random() * 6,
                length: 8 + Math.random() * 16,
                opacity: 0.2 + Math.random() * 0.4,
            });
        }
        while (this.raindrops.length > targetDrops) this.raindrops.pop();

        for (const d of this.raindrops) {
            d.y += d.speed;
            d.x -= 1;
            if (d.y > this.canvas.height) {
                d.y = Math.random() * -50;
                d.x = Math.random() * this.canvas.width;
            }
        }
    },

    drawRain() {
        if (this.raindrops.length === 0) return;
        this.ctx.strokeStyle = '#a0c4e8';
        this.ctx.lineWidth = 1.2;
        for (const d of this.raindrops) {
            this.ctx.globalAlpha = d.opacity;
            this.ctx.beginPath();
            this.ctx.moveTo(d.x, d.y);
            this.ctx.lineTo(d.x - 2, d.y + d.length);
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
    },

    // ─── Fog ───────────────────────────────────────────
    updateFog() {
        const h = this.getGameHour();
        let intensity = 0;
        for (const [start, end] of this.SCHEDULE.fog) {
            if (h >= start && h < end) {
                const mid = (start + end) / 2;
                intensity = h < mid
                    ? (h - start) / (mid - start)
                    : 1 - (h - mid) / (end - mid);
                break;
            }
        }

        const targetParts = Math.floor(intensity * 30);
        while (this.fogParticles.length < targetParts) {
            this.fogParticles.push({
                x: Math.random() * this.canvas.width * 1.5 - this.canvas.width * 0.25,
                y: this.canvas.height * 0.3 + Math.random() * this.canvas.height * 0.6,
                radius: 80 + Math.random() * 160,
                speed: 0.1 + Math.random() * 0.2,
                opacity: 0.04 + Math.random() * 0.08,
            });
        }
        while (this.fogParticles.length > targetParts) this.fogParticles.pop();

        for (const p of this.fogParticles) {
            p.x += p.speed;
            if (p.x - p.radius > this.canvas.width) {
                p.x = -p.radius * 2;
                p.y = this.canvas.height * 0.3 + Math.random() * this.canvas.height * 0.6;
            }
        }
    },

    drawFog() {
        if (this.fogParticles.length === 0) return;
        for (const p of this.fogParticles) {
            const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            grad.addColorStop(0, `rgba(200, 210, 220, ${p.opacity})`);
            grad.addColorStop(1, 'rgba(200, 210, 220, 0)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
        }
    },

    // ─── Background transition ─────────────────────────
    updateBackground() {
        const brightness = this.getSkyBrightness();
        const sceneBg = document.getElementById('scene-bg');
        const sceneOverlay = document.getElementById('scene-overlay');
        const scene = document.getElementById('scene');

        const isDay = brightness > 0.5;
        const bgSrc = isDay ? 'assets/backgrounds/bg_jour.png' : 'assets/backgrounds/bg_nuit.png';

        if (this.lastBgState !== bgSrc) {
            this.lastBgState = bgSrc;
            sceneBg.style.backgroundImage = `url(${bgSrc})`;
            sceneBg.style.backgroundSize = 'cover';
            sceneBg.style.backgroundPosition = 'center bottom';
            scene.classList.add('has-bg');
        }

        const darken = 1 - brightness;
        sceneOverlay.style.background = `rgba(10, 10, 40, ${darken * 0.55})`;
    },

    // ─── Clock ─────────────────────────────────────────
    updateClock() {
        const el = document.getElementById('hud-clock');
        if (el) {
            const time = this.getFormattedTime();
            const icon = this.isDaytime() ? '☀️' : '🌙';
            el.textContent = `${icon} ${time}`;
        }
        const weatherEl = document.getElementById('hud-weather');
        if (weatherEl) {
            const w = this.getWeather();
            const icons = { clear: '', rain: '🌧️', fog: '🌫️' };
            weatherEl.textContent = icons[w] || '';
        }
    },

    // ─── Main tick ─────────────────────────────────────
    tick() {
        if (!this.canvas || !this.ctx) return;
        const weather = this.getWeather();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawCelestial();
        this.updateClouds(weather);
        this.drawClouds();

        if (weather === 'rain') {
            this.updateRain();
            this.drawRain();
        } else {
            this.raindrops = [];
        }

        if (weather === 'fog') {
            this.updateFog();
            this.drawFog();
        } else {
            this.fogParticles = [];
        }

        this.updateBackground();
        this.updateClock();

        this.animFrame = requestAnimationFrame(() => this.tick());
    },

    stop() {
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    },

    setStartHour(h) {
        this.startHour = h;
        this.startTime = Date.now();
    },
};
