const Engine = {
    STAGES: [
        { id:0, nom:'Poussin',    emoji:'🐣', heures:24,  depletion:1.6, size:80,  sprite:'assets/sprites/poussin.png',    hen:'assets/sprites/poule_poussin.png', henName:'Poussinette', desc:'Un petit poussin fragile !' },
        { id:1, nom:'Petit Coq',  emoji:'🐤', heures:48,  depletion:1.4, size:100, sprite:'assets/sprites/petit_coq.png',  hen:'assets/sprites/poule_petite.png',  henName:'Cocotte',     desc:'Premières plumes !' },
        { id:2, nom:'Coq Ado',    emoji:'🐔', heures:72,  depletion:1.2, size:120, sprite:'assets/sprites/coq_ado.png',    hen:'assets/sprites/poule_ado.png',     henName:'Poulette',    desc:'Francis chante le matin.' },
        { id:3, nom:'Coq Adulte', emoji:'🐓', heures:168, depletion:1.0, size:140, sprite:'assets/sprites/coq_adulte.png', hen:'assets/sprites/poule_adulte.png',  henName:'Françoise',   desc:'Béret, lunettes, 1F !' },
        { id:4, nom:'Coq Vieux',  emoji:'👴',  heures:null,depletion:0.7, size:130, sprite:'assets/sprites/coq_vieux.png',  hen:'assets/sprites/poule_vieille.png', henName:'Mamie Plume', desc:'Le sage Francis.' },
    ],
    FOODS: [
        { id:'grain',   nom:'Grain',    emoji:'🌾', faim:20, bonheur:5,  energie:5,  sante:0 },
        { id:'mais',    nom:'Maïs',     emoji:'🌽', faim:30, bonheur:10, energie:5,  sante:5 },
        { id:'baguette',nom:'Baguette', emoji:'🥖', faim:40, bonheur:15, energie:10, sante:-5 },
        { id:'graines', nom:'Graines',  emoji:'🫘', faim:18, bonheur:8,  energie:8,  sante:10 },
        { id:'gateau',  nom:'Gâteau',   emoji:'🧁', faim:25, bonheur:30, energie:15, sante:-10 },
        { id:'fromage', nom:'Fromage',  emoji:'🧀', faim:35, bonheur:20, energie:10, sante:5 },
    ],
    HOUSING: [
        { id:0, nom:'Poulailler',      emoji:'🏚️', cost:0,    bg:'poulailler' },
        { id:1, nom:'Maison en bois',  emoji:'🏡', cost:200,  bg:'bois' },
        { id:2, nom:'Maison en brique',emoji:'🏠', cost:800,  bg:'brique' },
        { id:3, nom:'Château',         emoji:'🏰', cost:2500, bg:'chateau' },
        { id:4, nom:'Palace',          emoji:'🏛️', cost:8000, bg:'palace' },
    ],
    DIALOGUES: {
        content:['Cocoricoooo ! 🎵','Je suis le plus beau coq de France !','Mon béret est-il bien droit ?','1 Franc, la belle époque !','Côt côt côt !','Vive la République ! 🇫🇷'],
        faim:['J\'ai la dalle ! 🌾','Du grain, stp...','Mon ventre gargouille...'],
        triste:['Personne ne me voit... 😢','Un coq sans ami est perdu.','Ma cocarde perd ses couleurs...'],
        fatigue:['Zzz... même les coqs dorment...','Je pique du bec...'],
        malade:['Côt côt... *tousse*...','Pas bien du tout...','Au secours ! 🏥'],
        sale:['Ça pue ici... 🤢','Une douche, svp !','Je suis tout crado...'],
    },
    COOLDOWNS: { nourrir:120, jouer:300, dormir:900, soigner:600, toilette:120, douche:300, caresser:30, intellect:300, visite:600 },
    MAX_STAT:100, CRIT:15, POOP_INTERVAL:5400, PIPI_INTERVAL:3600,

    createPet(name='Francis') {
        const now = Date.now();
        return {
            nom:name, stade:0,
            faim:80, bonheur:80, energie:80, sante:80, hygiene:90, intellect:50, amour:30,
            experience:0, actions:0, soinTotal:0, coins:0,
            housingLevel:0,
            neLe:now, derniereUpdate:now, derniereEvolution:now,
            dernierePoop:now, dernierePipi:now,
            cooldowns:{}, poops:0, pipis:0, healthActionCount:0,
            estMort:false, causeMort:null, isSleeping:false, sleepStart:null,
        };
    },

    updateStats(pet) {
        if (pet.estMort) return pet;
        const now = Date.now();
        const elapsed = (now - pet.derniereUpdate) / 3600000;
        if (elapsed < 0.005) return pet;
        const m = this.STAGES[pet.stade].depletion;
        // Migration
        if (pet.amour===undefined) pet.amour=30;
        if (pet.hygiene===undefined) pet.hygiene=50;
        if (pet.intellect===undefined) pet.intellect=30;
        if (pet.coins===undefined) pet.coins=0;
        if (pet.housingLevel===undefined) pet.housingLevel=0;
        if (pet.pipis===undefined) pet.pipis=0;
        if (pet.dernierePipi===undefined) pet.dernierePipi=now;
        if (pet.healthActionCount===undefined) pet.healthActionCount=0;

        if (pet.isSleeping) {
            pet.energie = this.clamp(pet.energie + elapsed*15);
            pet.faim = this.clamp(pet.faim - elapsed*2*m);
            pet.bonheur = this.clamp(pet.bonheur - elapsed*0.5);
            pet.sante = this.clamp(pet.sante + elapsed*2);
            pet.hygiene = this.clamp(pet.hygiene - elapsed*0.5);
            pet.amour = this.clamp(pet.amour - elapsed*0.3);
        } else {
            pet.faim = this.clamp(pet.faim - elapsed*4*m);
            pet.bonheur = this.clamp(pet.bonheur - elapsed*3*m);
            pet.energie = this.clamp(pet.energie - elapsed*2.5*m);
            pet.sante = this.clamp(pet.sante - elapsed*1.5*m);
            pet.hygiene = this.clamp(pet.hygiene - elapsed*2*m);
            pet.intellect = this.clamp(pet.intellect - elapsed*1*m);
            pet.amour = this.clamp(pet.amour - elapsed*1.5*m);
        }
        const dirt = pet.poops + pet.pipis;
        if (dirt >= 2) { pet.bonheur = this.clamp(pet.bonheur - elapsed*dirt*0.8); pet.hygiene = this.clamp(pet.hygiene - elapsed*dirt*0.5); }
        if (dirt >= 4) pet.sante = this.clamp(pet.sante - elapsed*1.5);
        if (pet.hygiene < 30) { pet.bonheur = this.clamp(pet.bonheur - elapsed); pet.sante = this.clamp(pet.sante - elapsed*0.5); }
        if (pet.faim < this.CRIT) { pet.sante = this.clamp(pet.sante - elapsed*2); pet.bonheur = this.clamp(pet.bonheur - elapsed); }
        if (pet.energie < this.CRIT) pet.bonheur = this.clamp(pet.bonheur - elapsed*1.5);

        const poopE = (now - pet.dernierePoop)/1000;
        if (poopE > this.POOP_INTERVAL/(m||1) && pet.poops < 5) { pet.poops = Math.min(5, pet.poops+1); pet.dernierePoop = now; pet.hygiene = this.clamp(pet.hygiene-8); }
        const pipiE = (now - pet.dernierePipi)/1000;
        if (pipiE > this.PIPI_INTERVAL/(m||1) && pet.pipis < 3) { pet.pipis = Math.min(3, pet.pipis+1); pet.dernierePipi = now; pet.hygiene = this.clamp(pet.hygiene-5); }

        if (pet.isSleeping && pet.sleepStart && ((now-pet.sleepStart)/3600000 >= 2 || pet.energie >= 95)) { pet.isSleeping = false; pet.sleepStart = null; }

        if (['faim','sante','energie'].filter(s => pet[s] <= 0).length >= 2) {
            pet.estMort = true;
            pet.causeMort = pet.faim<=0?'famine':pet.sante<=0?'maladie':'épuisement';
        }
        pet.derniereUpdate = now;
        return pet;
    },

    checkEvolution(pet) {
        if (pet.estMort || pet.stade >= 4) return false;
        const s = this.STAGES[pet.stade];
        if (!s.heures) return false;
        const elapsed = (Date.now()-pet.derniereEvolution)/3600000;
        const avg = (pet.faim+pet.bonheur+pet.energie+pet.sante+pet.hygiene)/5;
        return elapsed >= s.heures && avg >= 25;
    },
    evolve(pet) {
        if (pet.stade >= 4) return pet;
        pet.stade++; pet.derniereEvolution = Date.now();
        pet.faim=this.clamp(pet.faim+20); pet.bonheur=this.clamp(pet.bonheur+30);
        pet.energie=this.clamp(pet.energie+20); pet.sante=this.clamp(pet.sante+20);
        pet.hygiene=this.clamp(pet.hygiene+15); pet.coins += 50;
        return pet;
    },

    canDoAction(pet, action) {
        if (pet.estMort) return {ok:false,msg:'Francis n\'est plus là...'};
        const now=Date.now(), cd=pet.cooldowns[action]||0;
        if (now<cd) { const s=Math.ceil((cd-now)/1000), mn=Math.floor(s/60); return {ok:false,msg:'⏳ '+mn+':'+String(s%60).padStart(2,'0')}; }
        return {ok:true};
    },

    feed(pet, foodId) {
        const c=this.canDoAction(pet,'nourrir'); if(!c.ok) return c;
        if (pet.isSleeping) return {ok:false,msg:'Francis dort ! 😴'};
        const food=this.FOODS.find(f=>f.id===foodId); if(!food) return {ok:false,msg:'?'};
        pet.faim=this.clamp(pet.faim+food.faim); pet.bonheur=this.clamp(pet.bonheur+food.bonheur);
        pet.energie=this.clamp(pet.energie+food.energie); pet.sante=this.clamp(pet.sante+food.sante);
        pet.cooldowns.nourrir=Date.now()+this.COOLDOWNS.nourrir*1000;
        pet.experience+=10; pet.actions++; pet.coins+=1;
        return {ok:true,msg:food.emoji+' Miam ! '+food.nom+' !',food};
    },
    play(pet, bonus=0) {
        const c=this.canDoAction(pet,'jouer'); if(!c.ok) return c;
        if (pet.isSleeping) return {ok:false,msg:'Francis dort ! 😴'};
        pet.bonheur=this.clamp(pet.bonheur+25+bonus); pet.faim=this.clamp(pet.faim-8);
        pet.energie=this.clamp(pet.energie-12); pet.sante=this.clamp(pet.sante+5);
        pet.cooldowns.jouer=Date.now()+this.COOLDOWNS.jouer*1000;
        pet.experience+=15+bonus; pet.actions++; pet.coins+=2+Math.floor(bonus/3);
        return {ok:true,msg:'🎮 Francis s\'amuse !'};
    },
    sleep(pet) {
        if (pet.isSleeping) { pet.isSleeping=false; pet.sleepStart=null; return {ok:true,msg:'☀️ Francis se réveille !'}; }
        const c=this.canDoAction(pet,'dormir'); if(!c.ok) return c;
        pet.isSleeping=true; pet.sleepStart=Date.now();
        pet.cooldowns.dormir=Date.now()+this.COOLDOWNS.dormir*1000; pet.actions++;
        return {ok:true,msg:'😴 Francis s\'endort... Zzz'};
    },
    heal(pet) {
        const c=this.canDoAction(pet,'soigner'); if(!c.ok) return c;
        if (pet.isSleeping) return {ok:false,msg:'Francis dort ! 😴'};
        pet.healthActionCount=(pet.healthActionCount||0)+1;
        const isInj = pet.healthActionCount%2===1;
        pet.sante=this.clamp(pet.sante+35); pet.bonheur=this.clamp(pet.bonheur+(isInj?-10:-3));
        pet.energie=this.clamp(pet.energie-5);
        pet.cooldowns.soigner=Date.now()+this.COOLDOWNS.soigner*1000;
        pet.experience+=10; pet.actions++; pet.coins+=2;
        return {ok:true,msg:isInj?'💉 Piqûre ! Francis grimace...':'💊 Cachet avalé !',emoji:isInj?'💉':'💊',isInjection:isInj};
    },
    toilet(pet) {
        const c=this.canDoAction(pet,'toilette'); if(!c.ok) return c;
        if (pet.poops<=0 && pet.pipis<=0) return {ok:false,msg:'Déjà propre ! ✨'};
        const cleaned=pet.poops+pet.pipis; pet.poops=0; pet.pipis=0;
        pet.hygiene=this.clamp(pet.hygiene+15); pet.bonheur=this.clamp(pet.bonheur+10);
        pet.cooldowns.toilette=Date.now()+this.COOLDOWNS.toilette*1000;
        pet.experience+=5; pet.actions++; pet.coins+=1;
        return {ok:true,msg:'🧹 Tout nettoyé ! ('+cleaned+')',cleaned};
    },
    shower(pet) {
        const c=this.canDoAction(pet,'douche'); if(!c.ok) return c;
        if (pet.isSleeping) return {ok:false,msg:'Francis dort ! 😴'};
        pet.hygiene=this.clamp(pet.hygiene+50); pet.bonheur=this.clamp(pet.bonheur+15);
        pet.sante=this.clamp(pet.sante+5); pet.energie=this.clamp(pet.energie-5);
        pet.cooldowns.douche=Date.now()+this.COOLDOWNS.douche*1000;
        pet.experience+=10; pet.actions++; pet.coins+=2;
        return {ok:true,msg:'🚿 Francis est tout propre !'};
    },
    studyAuto(pet) {
        const c=this.canDoAction(pet,'intellect'); if(!c.ok) return c;
        if (pet.isSleeping) return {ok:false,msg:'Francis dort ! 😴'};
        pet.intellect=this.clamp(pet.intellect+25); pet.energie=this.clamp(pet.energie-10);
        pet.bonheur=this.clamp(pet.bonheur+5);
        pet.cooldowns.intellect=Date.now()+this.COOLDOWNS.intellect*1000;
        pet.experience+=15; pet.actions++; pet.coins+=3;
        return {ok:true,msg:'📖 Francis lit un livre !'};
    },
    studyGame(pet, bonus=0) {
        pet.intellect=this.clamp(pet.intellect+20+bonus); pet.energie=this.clamp(pet.energie-8);
        pet.experience+=10+bonus; pet.actions++; pet.coins+=2+Math.floor(bonus/2);
        return {ok:true,msg:'🧠 +'+bonus+' intellect !'};
    },
    caress(pet) {
        const c=this.canDoAction(pet,'caresser'); if(!c.ok) return c;
        if (pet.isSleeping) return {ok:false,msg:'Chut, Francis dort ! 😴'};
        pet.bonheur=this.clamp(pet.bonheur+12); pet.sante=this.clamp(pet.sante+2);
        pet.cooldowns.caresser=Date.now()+this.COOLDOWNS.caresser*1000;
        pet.experience+=3; pet.actions++; pet.coins+=1;
        return {ok:true,msg:'💕'};
    },
    visit(pet) {
        const c=this.canDoAction(pet,'visite'); if(!c.ok) return c;
        if (pet.isSleeping) return {ok:false,msg:'Francis dort ! 😴'};
        const stage = this.STAGES[pet.stade];
        pet.amour=this.clamp(pet.amour+35);
        pet.bonheur=this.clamp(pet.bonheur+20);
        pet.energie=this.clamp(pet.energie-5);
        pet.cooldowns.visite=Date.now()+this.COOLDOWNS.visite*1000;
        pet.experience+=10; pet.actions++; pet.coins+=3;
        return {ok:true, msg:'💕 '+stage.henName+' rend visite à Francis !', henSprite:stage.hen, henName:stage.henName};
    },
    upgradeHousing(pet) {
        const next = pet.housingLevel + 1;
        if (next >= this.HOUSING.length) return {ok:false,msg:'Niveau max atteint ! 🏛️'};
        const h = this.HOUSING[next];
        if (pet.coins < h.cost) return {ok:false,msg:'Il faut '+h.cost+' 🪙 (tu as '+pet.coins+')'};
        pet.coins -= h.cost; pet.housingLevel = next; pet.bonheur = this.clamp(pet.bonheur+30);
        return {ok:true,msg:h.emoji+' Nouveau logement : '+h.nom+' !'};
    },

    getMood(pet) {
        if (pet.estMort) return 'mort'; if (pet.isSleeping) return 'sleeping';
        if (pet.sante<this.CRIT) return 'malade'; if (pet.faim<this.CRIT) return 'faim';
        if (pet.hygiene<20) return 'sale'; if (pet.energie<this.CRIT) return 'fatigue';
        if (pet.bonheur<30) return 'triste'; return 'content';
    },
    getDialogue(pet) {
        const mood=this.getMood(pet);
        if(mood==='mort') return '💀 ...'; if(mood==='sleeping') return 'Zzz...';
        const pool=this.DIALOGUES[mood]||this.DIALOGUES.content;
        return pool[Math.floor(Math.random()*pool.length)];
    },
    getCareRating(pet) { const avg=(pet.faim+pet.bonheur+pet.energie+pet.sante+pet.hygiene)/5; return avg>=70?3:avg>=40?2:1; },
    getAge(pet) { const h=Math.floor((Date.now()-pet.neLe)/3600000); return {days:Math.floor(h/24),hours:h%24,totalHours:h}; },
    getTimeToEvolve(pet) { const s=this.STAGES[pet.stade]; if(!s.heures) return null; return Math.max(0,s.heures-(Date.now()-pet.derniereEvolution)/3600000); },
    hasAlerts(pet) { return pet.faim<30||pet.bonheur<30||pet.energie<30||pet.sante<30||pet.hygiene<30||(pet.poops+pet.pipis)>=3; },
    clamp(v) { return Math.max(0,Math.min(this.MAX_STAT,v)); },
};
