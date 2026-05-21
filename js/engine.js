/* ═══════════════════════════════════════════════════════
   🐓 Engine — Core game mechanics v2
   Hygiene, poop/pipi, shower, health alternation
   ═══════════════════════════════════════════════════════ */

const Engine = {
    STAGES: [
        { id: 0, nom: 'Poussin',     emoji: '🐣', heures: 24,  depletion: 1.6, size: 80,  sprite: 'assets/sprites/poussin.png',     desc: 'Un petit poussin fragile qui découvre le monde !' },
        { id: 1, nom: 'Petit Coq',   emoji: '🐤', heures: 48,  depletion: 1.4, size: 100, sprite: 'assets/sprites/petit_coq.png',   desc: 'Francis grandit ! Ses premières plumes apparaissent.' },
        { id: 2, nom: 'Coq Ado',     emoji: '🐔', heures: 72,  depletion: 1.2, size: 120, sprite: 'assets/sprites/coq_ado.png',     desc: "L'adolescence ! Francis commence à chanter." },
        { id: 3, nom: 'Coq Adulte',  emoji: '🐓', heures: 168, depletion: 1.0, size: 140, sprite: 'assets/sprites/coq_adulte.png',  desc: 'Francis dans toute sa splendeur ! Béret et lunettes.' },
        { id: 4, nom: 'Coq Vieux',   emoji: '👴',  heures: null, depletion: 0.7, size: 130, sprite: 'assets/sprites/coq_vieux.png',   desc: 'Le sage Francis. Tant d\'histoires à raconter...' },
    ],

    FOODS: [
        { id: 'grain',    nom: 'Grain',     emoji: '🌾', faim: 20, bonheur: 5,  energie: 5,  sante: 0 },
        { id: 'mais',     nom: 'Maïs',      emoji: '🌽', faim: 30, bonheur: 10, energie: 5,  sante: 5 },
        { id: 'baguette', nom: 'Baguette',  emoji: '🥖', faim: 40, bonheur: 15, energie: 10, sante: -5 },
        { id: 'graines',  nom: 'Graines',   emoji: '🫘', faim: 18, bonheur: 8,  energie: 8,  sante: 10 },
        { id: 'gateau',   nom: 'Gâteau',    emoji: '🧁', faim: 25, bonheur: 30, energie: 15, sante: -10 },
        { id: 'fromage',  nom: 'Fromage',   emoji: '🧀', faim: 35, bonheur: 20, energie: 10, sante: 5 },
    ],

    DIALOGUES: {
        content: [
            'Cocoricoooo ! 🎵', 'Je suis le plus beau coq de France !',
            'Sacré bleu, quelle journée !', 'Mon béret est-il bien droit ?',
            'Ajustement de lunettes... 🤓', '1 Franc, la belle époque !',
            'Côt côt côt !', 'Vive la République ! 🇫🇷',
        ],
        faim: [
            'J\'ai la dalle ! 🌾', 'Du grain, stp...', 'Mon ventre gargouille...',
            'Côt côt... (bruit de ventre)', 'Un bon maïs, c\'est pas de refus !',
        ],
        triste: [
            'Personne ne me voit... 😢', 'Un coq sans ami est perdu.',
            'Ma cocarde perd ses couleurs...', 'Même mes lunettes sont tristes.',
        ],
        fatigue: [
            'Zzz... même les coqs dorment...', 'Je pique du bec...',
            'Paupières lourdes comme un camembert.',
        ],
        malade: [
            'Côt côt... *tousse*...', 'Pas bien du tout...', 'Au secours ! 🏥',
        ],
        sale: [
            'Ça pue ici... 🤢', 'Une douche, svp !', 'Je suis tout crado...',
            'Beurk, c\'est dégueu !', 'Nettoyez mon poulailler !',
        ],
    },

    COOLDOWNS: {
        nourrir: 120, jouer: 300, dormir: 900, soigner: 600,
        toilette: 120, douche: 300, caresser: 60,
    },

    MAX_STAT: 100,
    CRIT: 15,
    POOP_INTERVAL: 5400,
    PIPI_INTERVAL: 3600,

    // ─── Create new pet ────────────────────────────────
    createPet(name = 'Francis') {
        const now = Date.now();
        return {
            nom: name, stade: 0,
            faim: 80, bonheur: 80, energie: 80, sante: 80, hygiene: 90,
            experience: 0, actions: 0, soinTotal: 0,
            neLe: now, derniereUpdate: now, derniereEvolution: now,
            dernierePoop: now, dernierePipi: now,
            cooldowns: {},
            poops: 0, pipis: 0,
            healthActionCount: 0,
            estMort: false, causeMort: null,
            isSleeping: false, sleepStart: null,
        };
    },

    // ─── Update stats based on elapsed time ────────────
    updateStats(pet) {
        if (pet.estMort) return pet;
        const now = Date.now();
        const elapsed = (now - pet.derniereUpdate) / 3600000;
        if (elapsed < 0.005) return pet;

        const stage = this.STAGES[pet.stade];
        const m = stage.depletion;

        if (pet.isSleeping) {
            pet.energie = this.clamp(pet.energie + elapsed * 15);
            pet.faim = this.clamp(pet.faim - elapsed * 2 * m);
            pet.bonheur = this.clamp(pet.bonheur - elapsed * 0.5);
            pet.sante = this.clamp(pet.sante + elapsed * 2);
            pet.hygiene = this.clamp(pet.hygiene - elapsed * 0.5);
        } else {
            pet.faim = this.clamp(pet.faim - elapsed * 4 * m);
            pet.bonheur = this.clamp(pet.bonheur - elapsed * 3 * m);
            pet.energie = this.clamp(pet.energie - elapsed * 2.5 * m);
            pet.sante = this.clamp(pet.sante - elapsed * 1.5 * m);
            pet.hygiene = this.clamp(pet.hygiene - elapsed * 2 * m);
        }

        // Ensure hygiene field exists (migration)
        if (pet.hygiene === undefined) pet.hygiene = 50;
        if (pet.pipis === undefined) pet.pipis = 0;
        if (pet.dernierePipi === undefined) pet.dernierePipi = now;
        if (pet.healthActionCount === undefined) pet.healthActionCount = 0;

        // Cross-stat effects
        if (pet.faim < this.CRIT) {
            pet.sante = this.clamp(pet.sante - elapsed * 2);
            pet.bonheur = this.clamp(pet.bonheur - elapsed * 1);
        }
        if (pet.energie < this.CRIT) {
            pet.bonheur = this.clamp(pet.bonheur - elapsed * 1.5);
        }

        // Dirty environment hurts mood and health
        const dirtLevel = pet.poops + pet.pipis;
        if (dirtLevel >= 2) {
            pet.bonheur = this.clamp(pet.bonheur - elapsed * dirtLevel * 0.8);
            pet.hygiene = this.clamp(pet.hygiene - elapsed * dirtLevel * 0.5);
        }
        if (dirtLevel >= 4) {
            pet.sante = this.clamp(pet.sante - elapsed * 1.5);
        }
        if (pet.hygiene < 30) {
            pet.bonheur = this.clamp(pet.bonheur - elapsed * 1);
            pet.sante = this.clamp(pet.sante - elapsed * 0.5);
        }

        // Auto poop generation
        const poopElapsed = (now - pet.dernierePoop) / 1000;
        if (poopElapsed > this.POOP_INTERVAL / (m || 1) && pet.poops < 5) {
            pet.poops = Math.min(5, pet.poops + Math.floor(poopElapsed / (this.POOP_INTERVAL / m)));
            pet.dernierePoop = now;
            pet.hygiene = this.clamp(pet.hygiene - 8);
        }

        // Auto pipi generation
        const pipiElapsed = (now - pet.dernierePipi) / 1000;
        if (pipiElapsed > this.PIPI_INTERVAL / (m || 1) && pet.pipis < 3) {
            pet.pipis = Math.min(3, pet.pipis + 1);
            pet.dernierePipi = now;
            pet.hygiene = this.clamp(pet.hygiene - 5);
        }

        // Auto wake up after 2 hours
        if (pet.isSleeping && pet.sleepStart) {
            const sleepH = (now - pet.sleepStart) / 3600000;
            if (sleepH >= 2 || pet.energie >= 95) {
                pet.isSleeping = false;
                pet.sleepStart = null;
            }
        }

        // Death check
        const critCount = ['faim', 'sante', 'energie'].filter(s => pet[s] <= 0).length;
        if (critCount >= 2) {
            pet.estMort = true;
            pet.causeMort = pet.faim <= 0 ? 'famine' : pet.sante <= 0 ? 'maladie' : 'épuisement';
        }

        pet.derniereUpdate = now;
        return pet;
    },

    // ─── Evolution ─────────────────────────────────────
    checkEvolution(pet) {
        if (pet.estMort || pet.stade >= 4) return false;
        const stage = this.STAGES[pet.stade];
        if (!stage.heures) return false;
        const elapsed = (Date.now() - pet.derniereEvolution) / 3600000;
        const avg = (pet.faim + pet.bonheur + pet.energie + pet.sante + pet.hygiene) / 5;
        return elapsed >= stage.heures && avg >= 25;
    },

    evolve(pet) {
        if (pet.stade >= 4) return pet;
        pet.stade++;
        pet.derniereEvolution = Date.now();
        pet.faim = this.clamp(pet.faim + 20);
        pet.bonheur = this.clamp(pet.bonheur + 30);
        pet.energie = this.clamp(pet.energie + 20);
        pet.sante = this.clamp(pet.sante + 20);
        pet.hygiene = this.clamp(pet.hygiene + 15);
        return pet;
    },

    // ─── Actions ───────────────────────────────────────
    canDoAction(pet, action) {
        if (pet.estMort) return { ok: false, msg: 'Francis n\'est plus là...' };
        const now = Date.now();
        const cd = pet.cooldowns[action] || 0;
        if (now < cd) {
            const secs = Math.ceil((cd - now) / 1000);
            const mn = Math.floor(secs / 60), s = secs % 60;
            return { ok: false, msg: '\u23F3 ' + mn + ':' + String(s).padStart(2,'0') };
        }
        return { ok: true };
    },

    feed(pet, foodId) {
        const check = this.canDoAction(pet, 'nourrir');
        if (!check.ok) return check;
        if (pet.isSleeping) return { ok: false, msg: 'Francis dort ! 😴' };
        const food = this.FOODS.find(f => f.id === foodId);
        if (!food) return { ok: false, msg: 'Nourriture inconnue' };

        pet.faim = this.clamp(pet.faim + food.faim);
        pet.bonheur = this.clamp(pet.bonheur + food.bonheur);
        pet.energie = this.clamp(pet.energie + food.energie);
        pet.sante = this.clamp(pet.sante + food.sante);
        pet.cooldowns.nourrir = Date.now() + this.COOLDOWNS.nourrir * 1000;
        pet.experience += 10;
        pet.actions++;
        pet.soinTotal += Math.max(0, food.faim);
        return { ok: true, msg: food.emoji + ' Miam ! ' + food.nom + ' !', food };
    },

    play(pet, bonusPoints = 0) {
        const check = this.canDoAction(pet, 'jouer');
        if (!check.ok) return check;
        if (pet.isSleeping) return { ok: false, msg: 'Francis dort ! 😴' };
        const bonus = bonusPoints || 0;
        pet.bonheur = this.clamp(pet.bonheur + 25 + bonus);
        pet.faim = this.clamp(pet.faim - 8);
        pet.energie = this.clamp(pet.energie - 12);
        pet.sante = this.clamp(pet.sante + 5);
        pet.cooldowns.jouer = Date.now() + this.COOLDOWNS.jouer * 1000;
        pet.experience += 15 + bonus;
        pet.actions++;
        return { ok: true, msg: '🎮 Francis s\'amuse !' };
    },

    sleep(pet) {
        if (pet.isSleeping) {
            pet.isSleeping = false; pet.sleepStart = null;
            return { ok: true, msg: '☀️ Francis se réveille !' };
        }
        const check = this.canDoAction(pet, 'dormir');
        if (!check.ok) return check;
        pet.isSleeping = true;
        pet.sleepStart = Date.now();
        pet.cooldowns.dormir = Date.now() + this.COOLDOWNS.dormir * 1000;
        pet.actions++;
        return { ok: true, msg: '😴 Francis s\'endort... Zzz' };
    },

    // Health: alternates injection 💉 / pill 💊
    heal(pet) {
        const check = this.canDoAction(pet, 'soigner');
        if (!check.ok) return check;
        if (pet.isSleeping) return { ok: false, msg: 'Francis dort ! 😴' };

        pet.healthActionCount = (pet.healthActionCount || 0) + 1;
        const isInjection = pet.healthActionCount % 2 === 1;

        pet.sante = this.clamp(pet.sante + 35);
        pet.bonheur = this.clamp(pet.bonheur + (isInjection ? -10 : -3));
        pet.energie = this.clamp(pet.energie - 5);
        pet.cooldowns.soigner = Date.now() + this.COOLDOWNS.soigner * 1000;
        pet.experience += 10;
        pet.actions++;

        const emoji = isInjection ? '💉' : '💊';
        const msg = isInjection ? '💉 Piqûre ! Francis grimace...' : '💊 Cachet avalé ! Beurk...';
        return { ok: true, msg, emoji, isInjection };
    },

    // Toilet: cleans poop and pipi
    toilet(pet) {
        const check = this.canDoAction(pet, 'toilette');
        if (!check.ok) return check;
        if (pet.poops <= 0 && pet.pipis <= 0) return { ok: false, msg: 'C\'est déjà propre ! ✨' };

        const cleaned = pet.poops + pet.pipis;
        pet.poops = 0;
        pet.pipis = 0;
        pet.hygiene = this.clamp(pet.hygiene + 15);
        pet.bonheur = this.clamp(pet.bonheur + 10);
        pet.cooldowns.toilette = Date.now() + this.COOLDOWNS.toilette * 1000;
        pet.experience += 5;
        pet.actions++;
        return { ok: true, msg: '🧹 Tout nettoyé ! (' + cleaned + ' déchets)', cleaned };
    },

    // Shower: washes Francis, big hygiene boost
    shower(pet) {
        const check = this.canDoAction(pet, 'douche');
        if (!check.ok) return check;
        if (pet.isSleeping) return { ok: false, msg: 'Francis dort ! 😴' };

        pet.hygiene = this.clamp(pet.hygiene + 50);
        pet.bonheur = this.clamp(pet.bonheur + 15);
        pet.sante = this.clamp(pet.sante + 5);
        pet.energie = this.clamp(pet.energie - 5);
        pet.cooldowns.douche = Date.now() + this.COOLDOWNS.douche * 1000;
        pet.experience += 10;
        pet.actions++;
        return { ok: true, msg: '🚿 Douche ! Francis est tout propre !' };
    },

    caress(pet) {
        const check = this.canDoAction(pet, 'caresser');
        if (!check.ok) return check;
        if (pet.isSleeping) return { ok: false, msg: 'Chut, Francis dort ! 😴' };
        pet.bonheur = this.clamp(pet.bonheur + 15);
        pet.sante = this.clamp(pet.sante + 3);
        pet.cooldowns.caresser = Date.now() + this.COOLDOWNS.caresser * 1000;
        pet.experience += 5;
        pet.actions++;
        return { ok: true, msg: '💕' };
    },

    // ─── Mood ──────────────────────────────────────────
    getMood(pet) {
        if (pet.estMort) return 'mort';
        if (pet.isSleeping) return 'sleeping';
        if (pet.sante < this.CRIT) return 'malade';
        if (pet.faim < this.CRIT) return 'faim';
        if (pet.hygiene < 20) return 'sale';
        if (pet.energie < this.CRIT) return 'fatigue';
        if (pet.bonheur < 30) return 'triste';
        return 'content';
    },

    getDialogue(pet) {
        const mood = this.getMood(pet);
        if (mood === 'mort') return '\uD83D\uDC80 ...';
        if (mood === 'sleeping') return 'Zzz...';
        const pool = this.DIALOGUES[mood] || this.DIALOGUES.content;
        return pool[Math.floor(Math.random() * pool.length)];
    },

    getCareRating(pet) {
        const avg = (pet.faim + pet.bonheur + pet.energie + pet.sante + pet.hygiene) / 5;
        return avg >= 70 ? 3 : avg >= 40 ? 2 : 1;
    },

    getAge(pet) {
        const ms = Date.now() - pet.neLe;
        const hours = Math.floor(ms / 3600000);
        return { days: Math.floor(hours / 24), hours: hours % 24, totalHours: hours };
    },

    getTimeToEvolve(pet) {
        const stage = this.STAGES[pet.stade];
        if (!stage.heures) return null;
        const elapsed = (Date.now() - pet.derniereEvolution) / 3600000;
        return Math.max(0, stage.heures - elapsed);
    },

    isNight() { const h = new Date().getHours(); return h >= 21 || h < 7; },

    hasAlerts(pet) {
        return pet.faim < 30 || pet.bonheur < 30 || pet.energie < 30 || 
               pet.sante < 30 || pet.hygiene < 30 || (pet.poops + pet.pipis) >= 3;
    },

    clamp(v) { return Math.max(0, Math.min(this.MAX_STAT, v)); },
};
