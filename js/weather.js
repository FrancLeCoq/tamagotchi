const Weather = {
    HOUR_MS: 120000,
    startTime: null,
    startHour: 6,
    canvas: null, ctx: null,
    clouds: [], raindrops: [], fogParticles: [],
    animFrame: null, lastBgState: null,
    rainAudio: null, rainPlaying: false,

    SCHEDULE: { fog: [[8,9],[20,21]], rain: [[3,4],[15,16]] },

    init() {
        this.startTime = Date.now();
        this.canvas = document.getElementById('weather-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.initAssets();
        this.rainAudio = new Audio('assets/sounds/rain.mp3');
        this.rainAudio.loop = true; this.rainAudio.volume = 0.25;
        this.tick();
    },

    resizeCanvas() {
        const s = document.querySelector('.scene');
        if (!s) return;
        this.canvas.width = s.offsetWidth; this.canvas.height = s.offsetHeight;
    },

    getGameHour() {
        return (this.startHour + (Date.now() - this.startTime) / this.HOUR_MS) % 24;
    },
    getFormattedTime() {
        const h = this.getGameHour(), hh = Math.floor(h), mm = Math.floor((h-hh)*60);
        return String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
    },
    isInRange(h, ranges) { return ranges.some(([s,e]) => h >= s && h < e); },
    getWeather() {
        const h = this.getGameHour();
        if (this.isInRange(h, this.SCHEDULE.rain)) return 'rain';
        if (this.isInRange(h, this.SCHEDULE.fog)) return 'fog';
        return 'clear';
    },
    isDaytime() { const h = this.getGameHour(); return h >= 7 && h < 21; },
    getSkyBrightness() {
        const h = this.getGameHour();
        if (h >= 8 && h < 19) return 1;
        if (h >= 21 || h < 5) return 0;
        if (h >= 5 && h < 8) return (h-5)/3;
        if (h >= 19 && h < 21) return 1-(h-19)/2;
        return 0.5;
    },

    initAssets() {
        this.clouds = [];
        for (let i = 0; i < 4; i++) this.clouds.push({
            x: Math.random()*(this.canvas.width+400)-200,
            y: -15 + Math.random()*50, speed: .15+Math.random()*.25,
            type: Math.random()>.5?1:2, scale: .5+Math.random()*.6, opacity: .6+Math.random()*.3,
        });
        this.cloudImg1 = new Image(); this.cloudImg1.src = 'assets/weather/nuage1.png';
        this.cloudImg2 = new Image(); this.cloudImg2.src = 'assets/weather/nuage2.png';
        this.sunImg = new Image(); this.sunImg.src = 'assets/weather/soleil.png';
        this.moonImg = new Image(); this.moonImg.src = 'assets/weather/lune.png';
    },

    updateClouds(weather) {
        const dense = weather==='rain'||weather==='fog';
        const target = dense ? 10 : 4;
        while (this.clouds.length < target) this.clouds.push({
            x: -300, y: -15+Math.random()*(dense?100:50),
            speed: (dense?.06:.15)+Math.random()*(dense?.08:.25),
            type: Math.random()>.5?1:2, scale: dense?.8+Math.random()*.8:.5+Math.random()*.6,
            opacity: dense?.85+Math.random()*.15:.6+Math.random()*.3,
        });
        while (this.clouds.length > target) this.clouds.pop();
        for (const c of this.clouds) {
            c.x += c.speed*(dense?.4:1);
            if (c.x > this.canvas.width+100) { c.x = -(c.type===1?354:188)*c.scale-50; c.y = -15+Math.random()*(dense?100:50); }
        }
    },
    drawClouds() {
        for (const c of this.clouds) {
            const img = c.type===1?this.cloudImg1:this.cloudImg2;
            if (!img.complete) continue;
            this.ctx.globalAlpha = c.opacity;
            this.ctx.drawImage(img, c.x, c.y, img.naturalWidth*c.scale, img.naturalHeight*c.scale);
        }
        this.ctx.globalAlpha = 1;
    },

    drawCelestial() {
        const h = this.getGameHour(), cw = this.canvas.width;
        // SUN: only during daytime
        if (h >= 6 && h < 20 && this.sunImg.complete) {
            const p = (h-6)/14;
            const x = p*(cw-60)+10, y = 10+Math.sin(p*Math.PI)*-25+30;
            const sz = 55+Math.sin(p*Math.PI)*12;
            this.ctx.globalAlpha = Math.min(1, Math.min((h-6)/1.5,(20-h)/1.5));
            this.ctx.drawImage(this.sunImg, x, y, sz, sz);
            this.ctx.globalAlpha = 1;
        }
        // MOON: only at night (no sun!)
        if ((h >= 20 || h < 6) && this.moonImg.complete) {
            const nh = h >= 20 ? h-20 : h+4;
            const p = nh/10;
            const x = p*(cw-50)+10, y = 8+Math.sin(p*Math.PI)*-20+28;
            this.ctx.globalAlpha = Math.min(1, Math.min(nh/1,(10-nh)/1));
            this.ctx.drawImage(this.moonImg, x, y, 50, 50);
            this.ctx.globalAlpha = 1;
        }
    },

    updateRain() {
        const h = this.getGameHour(); let intensity = 0;
        for (const [s,e] of this.SCHEDULE.rain) {
            if (h>=s&&h<e) { const mid=(s+e)/2; intensity = h<mid?(h-s)/(mid-s):1-(h-mid)/(e-mid); break; }
        }
        const target = Math.floor(intensity*200);
        while (this.raindrops.length < target) this.raindrops.push({
            x: Math.random()*this.canvas.width, y: Math.random()*-this.canvas.height,
            speed: 4+Math.random()*6, length: 8+Math.random()*16, opacity: .2+Math.random()*.4
        });
        while (this.raindrops.length > target) this.raindrops.pop();
        for (const d of this.raindrops) { d.y += d.speed; d.x -= 1; if (d.y > this.canvas.height) { d.y = Math.random()*-50; d.x = Math.random()*this.canvas.width; } }
        // Rain sound
        if (intensity > 0.1 && !this.rainPlaying && App.soundOn) {
            this.rainAudio.play().catch(()=>{});
            this.rainAudio.volume = Math.min(0.4, intensity*0.5);
            this.rainPlaying = true;
        } else if (intensity <= 0.1 && this.rainPlaying) {
            this.rainAudio.pause(); this.rainPlaying = false;
        } else if (this.rainPlaying) {
            this.rainAudio.volume = Math.min(0.4, intensity*0.5);
        }
    },
    drawRain() {
        if (!this.raindrops.length) return;
        this.ctx.strokeStyle = '#a0c4e8'; this.ctx.lineWidth = 1.2;
        for (const d of this.raindrops) {
            this.ctx.globalAlpha = d.opacity;
            this.ctx.beginPath(); this.ctx.moveTo(d.x,d.y); this.ctx.lineTo(d.x-2,d.y+d.length); this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
    },

    updateFog() {
        const h = this.getGameHour(); let intensity = 0;
        for (const [s,e] of this.SCHEDULE.fog) {
            if (h>=s&&h<e) { const mid=(s+e)/2; intensity = h<mid?(h-s)/(mid-s):1-(h-mid)/(e-mid); break; }
        }
        const target = Math.floor(intensity*30);
        while (this.fogParticles.length < target) this.fogParticles.push({
            x: Math.random()*this.canvas.width*1.5-this.canvas.width*.25,
            y: this.canvas.height*.3+Math.random()*this.canvas.height*.6,
            radius: 80+Math.random()*160, speed: .1+Math.random()*.2, opacity: .04+Math.random()*.08,
        });
        while (this.fogParticles.length > target) this.fogParticles.pop();
        for (const p of this.fogParticles) { p.x += p.speed; if (p.x-p.radius > this.canvas.width) { p.x = -p.radius*2; p.y = this.canvas.height*.3+Math.random()*this.canvas.height*.6; } }
    },
    drawFog() {
        for (const p of this.fogParticles) {
            const g = this.ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.radius);
            g.addColorStop(0,'rgba(200,210,220,'+p.opacity+')'); g.addColorStop(1,'rgba(200,210,220,0)');
            this.ctx.fillStyle = g; this.ctx.fillRect(p.x-p.radius,p.y-p.radius,p.radius*2,p.radius*2);
        }
    },

    updateBackground() {
        const brightness = this.getSkyBrightness();
        const sceneBg = document.getElementById('scene-bg');
        const sceneOverlay = document.getElementById('scene-overlay');
        const scene = document.getElementById('scene');
        const isDay = brightness > 0.5;
        // Get housing prefix from pet data
        const housingLevel = (App.pet && App.pet.housingLevel) || 0;
        const housing = Engine.HOUSING[housingLevel] || Engine.HOUSING[0];
        const prefix = housing.bg;
        const ext = (prefix === 'bois' && isDay) ? '.png' : '.png';
        const bgSrc = 'assets/backgrounds/' + prefix + (isDay ? '_jour' : '_nuit') + ext;
        if (this.lastBgState !== bgSrc) {
            this.lastBgState = bgSrc;
            sceneBg.style.backgroundImage = 'url('+bgSrc+')';
            sceneBg.style.backgroundSize = 'cover';
            sceneBg.style.backgroundPosition = 'center bottom';
            scene.classList.add('has-bg');
        }
        sceneOverlay.style.background = 'rgba(10,10,40,'+(1-brightness)*0.55+')';
    },

    updateClock() {
        const el = document.getElementById('hud-clock');
        if (el) { const icon = this.isDaytime()?'☀️':'🌙'; el.textContent = icon+' '+this.getFormattedTime(); }
        const we = document.getElementById('hud-weather');
        if (we) { const w = this.getWeather(); we.textContent = ({clear:'',rain:'🌧️',fog:'🌫️'})[w]||''; }
    },

    tick() {
        if (!this.canvas||!this.ctx) return;
        const w = this.getWeather();
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.drawCelestial();
        this.updateClouds(w); this.drawClouds();
        if (w==='rain') { this.updateRain(); this.drawRain(); } else { this.raindrops=[]; if(this.rainPlaying){this.rainAudio.pause();this.rainPlaying=false;} }
        if (w==='fog') { this.updateFog(); this.drawFog(); } else this.fogParticles=[];
        this.updateBackground(); this.updateClock();
        this.animFrame = requestAnimationFrame(() => this.tick());
    },
    stop() { if (this.animFrame) cancelAnimationFrame(this.animFrame); },
};
