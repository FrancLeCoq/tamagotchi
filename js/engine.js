const Engine = {
    STAGES: [
        { id:0, nom:'Poussin',    emoji:'🐣', heures:24,  depletion:1.6, size:104,  sprite:'assets/sprites/poussin.png', spriteSad:'assets/sprites/poussin_triste.png', hen:'assets/sprites/poule_poussin.png', henName:'Poussinette' },
        { id:1, nom:'Petit Coq',  emoji:'🐤', heures:48,  depletion:1.4, size:150, sprite:'assets/sprites/petit_coq.png', spriteSad:'assets/sprites/petit_coq_triste.png', hen:'assets/sprites/poule_petite.png',  henName:'Cocotte' },
        { id:2, nom:'Coq Ado',    emoji:'🐔', heures:72,  depletion:1.2, size:156, sprite:'assets/sprites/coq_ado.png', spriteSad:'assets/sprites/coq_ado_triste.png', hen:'assets/sprites/poule_ado.png',     henName:'Poulette' },
        { id:3, nom:'Coq Adulte', emoji:'🐓', heures:168, depletion:1.0, size:155, sprite:'assets/sprites/coq_adulte.png', spriteSad:'assets/sprites/coq_adulte_triste.png', hen:'assets/sprites/poule_adulte.png',  henName:'Françoise' },
        { id:4, nom:'Coq Vieux',  emoji:'👴', heures:null,depletion:0.7, size:169, sprite:'assets/sprites/coq_vieux.png', spriteSad:'assets/sprites/coq_vieux_triste.png', hen:'assets/sprites/poule_vieille.png', henName:'Mamie Plume' },
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
        { id:0, nom:'Poulailler',       emoji:'🏚️', cost:0,     bg:'poulailler' },
        { id:1, nom:'Maison en bois',   emoji:'🏡', cost:1000,  bg:'bois' },
        { id:2, nom:'Maison en brique', emoji:'🏠', cost:10000, bg:'brique' },
        { id:3, nom:'Château',          emoji:'🏰', cost:15000, bg:'chateau' },
        { id:4, nom:'Palace',           emoji:'🏛️', cost:20000, bg:'palace' },
    ],
    DIALOGUES: {
        faim:['J\'ai la dalle ! 🌾','Du grain, stp...','Mon ventre gargouille...','Nourris-moi ! Je dépéris !','Je mangerais bien un croissant... 🥐','Mon estomac crie famine !','Un grain... juste un grain...','Par Toutatis, du maïs !','Même une miette ferait l\'affaire...','Le frigo est vide ou quoi ?'],
        fatigue:['Zzz... même les coqs dorment...','Je pique du bec...','Trop fatigué pour chanter... 😴','Une bonne sieste, vite !','Mes paupières sont lourdes...','Je tiens plus debout...','Un lit, par pitié !','Je bâille sans arrêt...','Mon énergie est à zéro !','Même les poules dorment mieux...'],
        sale:['Ça pue ici... C\'est moi ? 🤢','Une douche, et vite !','Mon plumage est dans un état !','Je suis sale comme un cochon...','Beurk, je sens le poulailler...','Mes plumes collent... 🧼','Faut que je me lave, là !','L\'hygiène, c\'est important !','Mon béret est tout crado...','Même les mouches me fuient !'],
        triste:['Personne ne me voit... 😢','Un coq sans ami est perdu.','Je me sens bien seul...','Un câlin, ça fait du bien...','Où sont mes amis ?','Mon cœur est lourd...','La solitude, c\'est dur...','Quelqu\'un veut bien jouer ?','Je m\'ennuie tout seul...','Un peu d\'amour svp... 💔'],
        malade:['Côt côt... *tousse*...','Au secours ! 🏥','J\'ai besoin d\'un médecin... 💉','Je me sens tout flagada...','Ma crête est toute pâle...','J\'ai mal partout...','Docteur ! Docteur !','Un cachet, vite !','Je ne me sens pas bien du tout...','Mes plumes tombent...'],
        jeu:['Je m\'ennuie ! 🎮','On joue à quoi ?','Un sudoku peut-être ?','Rien à faire ici...','Où est ma manette ?','C\'est long sans jeu...','Même un livre ferait l\'affaire 📖','Stimulez mon intellect !','Je vais rouiller sans activité !','On fait un mini-jeu ?'],
        enclos:['Les poules ont faim !','L\'enclos est sale...','Mes poules ont besoin d\'attention !','Vérifie l\'enclos stp...','Les œufs n\'attendent pas !','L\'hygiène de l\'enclos... 😬','Nourris les poules !'],
    },
    COOLDOWNS: { nourrir:3,jouer:3,dormir:3,soigner:3,toilette:3,douche:3,intellect:3,visite:3 },
    MAX_STAT:100, CRIT:15, POOP_INTERVAL:5400, PIPI_INTERVAL:3600,

    // Cheat codes
    CHEATS: {
        'FRANCA': function(p){ p.coins+=50000; return '💰 +50000 pièces !' },
        'FRANCB': function(p){ p.stade=1; p.derniereEvolution=Date.now(); return '🐤 Petit Coq !' },
        'FRANCC': function(p){ p.stade=2; p.derniereEvolution=Date.now(); return '🐔 Coq Ado !' },
        'FRANCD': function(p){ p.stade=3; p.derniereEvolution=Date.now(); return '🐓 Coq Adulte !' },
        'FRANCE': function(p){ p.stade=4; p.derniereEvolution=Date.now(); return '👴 Coq Vieux !' },
        'MORT': function(p){ p.sante=0; p.faim=0; p.bonheur=0; p.estMort=true; p.causeMort='Cheat MORT'; return '💀 La faucheuse arrive...' },
    },

    applyCheat(pet, code) {
        var fn = this.CHEATS[code.toUpperCase().trim()];
        if(fn && pet) return { ok:true, msg:fn(pet) };
        return { ok:false, msg:'Code inconnu' };
    },

    // Wallet
    isWalletConnected() {
        try { return localStorage.getItem('francis_wallet') === 'connected'; } catch(e) { return false; }
    },
    connectWallet() {
        try { localStorage.setItem('francis_wallet', 'connected'); } catch(e) {}
    },
    needsWalletGate(pet) {
        if(this.isWalletConnected()) return false;
        if(!pet || pet.stade > 0) return false;
        // Check if poussin stage time is up
        var s = this.STAGES[0];
        var elapsed = (Date.now() - pet.derniereEvolution) / 3600000;
        return elapsed >= s.heures;
    },

    // Check if pet should show sad sprite
    isSad(pet) {
        if(!pet) return false;
        // Show sad sprite when bonheur < 40% OR any critical gauge
        return pet.bonheur < 50 || pet.faim < 10 || pet.energie < 10 || pet.sante < 10 || (pet.hygiene||50) < 10;
    },

    getSpriteForPet(pet) {
        var stage = this.STAGES[pet.stade];
        return this.isSad(pet) ? stage.spriteSad : stage.sprite;
    },

    createPet(name) {
        var now = Date.now();
        return { nom:name||'Francis', stade:0,
            faim:50,bonheur:40,energie:60,sante:70,hygiene:50,intellect:20,amour:15,
            experience:0,actions:0,soinTotal:0,coins:0,housingLevel:0,jeu:0,travail:0,
            neLe:now,derniereUpdate:now,derniereEvolution:now,dernierePoop:now,dernierePipi:now,startRealHour:new Date().getHours(),
            cooldowns:{},poops:0,pipis:0,healthActionCount:0,
            estMort:false,causeMort:null,isSleeping:false,sleepStart:null,farm:null
        };
    },

    migrate(pet) {
        if(pet.hygiene===undefined) pet.hygiene=50;
        if(pet.intellect===undefined) pet.intellect=30;
        if(pet.amour===undefined) pet.amour=30;
        if(pet.coins===undefined) pet.coins=0;
        if(pet.jeu===undefined) pet.jeu=0;
        if(pet.travail===undefined) pet.travail=0;
        if(pet.farm){if(pet.farm.farmPoops===undefined)pet.farm.farmPoops=0;if(pet.farm.hens===0){pet.farm.feedLevel=100;pet.farm.cleanLevel=100;pet.farm.farmPoops=0;}}
        if(pet.housingLevel===undefined) pet.housingLevel=0;
        if(pet.pipis===undefined) pet.pipis=0;
        if(pet.dernierePipi===undefined) pet.dernierePipi=Date.now();
        if(pet.healthActionCount===undefined) pet.healthActionCount=0;
    },

    updateStats(pet) {
        if(pet.estMort) return pet;
        this.migrate(pet);
        var now=Date.now(), elapsed=(now-pet.derniereUpdate)/3600000;
        if(elapsed<0.005) return pet;
        var m=this.STAGES[pet.stade].depletion;
        if(pet.isSleeping){
            pet.energie=this.cl(pet.energie+elapsed*15);
            pet.faim=this.cl(pet.faim-elapsed*2*m);
            pet.sante=this.cl(pet.sante+elapsed*2);
            pet.hygiene=this.cl(pet.hygiene-elapsed*0.5);
            pet.amour=this.cl(pet.amour-elapsed*0.3);
        } else {
            pet.faim=this.cl(pet.faim-elapsed*4*m);
            pet.bonheur=this.cl(pet.bonheur-elapsed*3*m);
            pet.energie=this.cl(pet.energie-elapsed*2.5*m);
            pet.sante=this.cl(pet.sante-elapsed*1.5*m);
            pet.hygiene=this.cl(pet.hygiene-elapsed*2*m);
            pet.intellect=this.cl(pet.intellect-elapsed*1*m);pet.jeu=this.cl((pet.jeu||0)-elapsed*2*m);pet.travail=this.cl((pet.travail||0)-elapsed*1.5*m);
            pet.amour=this.cl(pet.amour-elapsed*1.5*m);
        }
        var dirt=pet.poops+pet.pipis;
        if(dirt>=2){pet.bonheur=this.cl(pet.bonheur-elapsed*dirt*0.8);pet.hygiene=this.cl(pet.hygiene-elapsed*dirt*0.5);}
        if(dirt>=4) pet.sante=this.cl(pet.sante-elapsed*1.5);
        // Poop/pipi
        if(now-pet.dernierePoop>this.POOP_INTERVAL*1000){pet.poops=Math.min(12,pet.poops+3);pet.dernierePoop=now;pet.hygiene=this.cl(pet.hygiene-8);}
        if(now-pet.dernierePipi>this.PIPI_INTERVAL*1000){pet.pipis=Math.min(5,pet.pipis+1);pet.dernierePipi=now;}
        // Starvation / death
        if(pet.faim<=0&&pet.sante<=5){pet.estMort=true;pet.causeMort='Famine';}
        if(pet.sante<=0){pet.estMort=true;pet.causeMort='Maladie';}
        if(pet.bonheur<=0&&pet.sante<=10){pet.estMort=true;pet.causeMort='Dépression';}
        pet.derniereUpdate=now;
        return pet;
    },

    cl(v){return Math.max(0,Math.min(100,v));},
    getMood(pet){
        if(pet.isSleeping) return 'sleeping';
        if(pet.sante<50) return 'malade';
        if(pet.faim<50) return 'faim';
        if(pet.energie<50) return 'fatigue';
        if((pet.hygiene||50)<50) return 'sale';
        if((pet.jeu||0)<50) return 'jeu';
        if((pet.amour||30)<50) return 'triste';
        if(pet.bonheur<50) return 'triste';
        return 'ok';
    },
    // Mood for SPRITE (sad sprite only when really low)
    getSpriteMood(pet){
        if(pet.isSleeping) return 'sleeping';
        if(pet.sante<15) return 'malade';
        if(pet.faim<15||pet.energie<15||(pet.hygiene||50)<15) return 'sad';
        return 'ok';
    },
    getDialogue(pet){var m=this.getMood(pet);var pool=this.DIALOGUES[m]||this.DIALOGUES.faim;if((pet.jeu||0)<20&&Math.random()<.3)pool=this.DIALOGUES.jeu;return pool[Math.floor(Math.random()*pool.length)];},
    hasAlerts(pet){return pet.faim<10||pet.bonheur<10||pet.energie<10||pet.sante<10||pet.hygiene<10||pet.amour<10;},
    getAge(pet){var ms=Date.now()-pet.neLe,h=ms/3600000;return{days:Math.floor(h/24),hours:Math.floor(h%24)};},

    checkEvolution(pet){
        if(pet.estMort||pet.stade>=4) return false;
        var s=this.STAGES[pet.stade]; if(!s.heures) return false;
        var elapsed=(Date.now()-pet.derniereEvolution)/3600000;
        var avg=(pet.faim+pet.bonheur+pet.energie+pet.sante+pet.hygiene)/5;
        return elapsed>=s.heures&&avg>=25;
    },
    evolve(pet){
        if(pet.stade>=4) return pet;
        pet.stade++;pet.derniereEvolution=Date.now();
        pet.faim=this.cl(pet.faim+20);pet.bonheur=this.cl(pet.bonheur+30);
        pet.energie=this.cl(pet.energie+20);pet.sante=this.cl(pet.sante+20);
        pet.hygiene=this.cl(pet.hygiene+15);pet.coins+=50;
        return pet;
    },

    canDo(pet,action){
        if(pet.estMort) return {ok:false,msg:'Francis n\'est plus là...'};
        var now=Date.now(),cd=pet.cooldowns[action]||0;
        if(now<cd){var s=Math.ceil((cd-now)/1000),mn=Math.floor(s/60);return {ok:false,msg:'⏳ '+mn+':'+String(s%60).padStart(2,'0')};}
        return {ok:true};
    },
    setCooldown(pet,action){pet.cooldowns[action]=Date.now()+(this.COOLDOWNS[action]||120)*1000;},

    petClick(pet){pet.coins+=1;pet.experience+=2;pet.actions++;},
    caress(pet){pet.amour=this.cl(pet.amour+1);pet.experience+=3;pet.actions++;},

    feed(pet,foodId){
        var c=this.canDo(pet,'nourrir');if(!c.ok)return c;
        var f=this.FOODS.find(function(x){return x.id===foodId;});if(!f)return{ok:false,msg:'?'};
        pet.faim=this.cl(pet.faim+f.faim);pet.bonheur=this.cl(pet.bonheur+f.bonheur);
        pet.energie=this.cl(pet.energie+f.energie);pet.sante=this.cl(pet.sante+f.sante);
        pet.experience+=10;pet.actions++;pet.coins+=1;
        this.setCooldown(pet,'nourrir');
        return{ok:true,msg:'🍽️ '+f.nom+' !',food:f};
    },
    play(pet,bonus){
        var c=this.canDo(pet,'jouer');if(!c.ok)return c;
        pet.bonheur=this.cl(pet.bonheur+Math.min(20,15+bonus));pet.energie=this.cl(pet.energie-10);pet.jeu=this.cl(pet.jeu+20);
        pet.experience+=15+bonus;pet.actions++;pet.coins+=2+Math.floor(bonus/3);
        this.setCooldown(pet,'jouer');return{ok:true,msg:'🎮 Fun !'};
    },
    sleep(pet){
        if(pet.isSleeping){
            // Interrompre la sieste
            pet.isSleeping=false;pet.sleepStart=null;
            return{ok:true,msg:'⏹️ Sieste interrompue',interrupted:true};
        }
        var c=this.canDo(pet,'dormir');if(!c.ok)return c;
        pet.isSleeping=true;pet.sleepStart=Date.now();
        pet.experience+=10;pet.actions++;pet.coins+=2;
        this.setCooldown(pet,'dormir');return{ok:true,msg:'💤 Dodo...',interrupted:false};
    },
    heal(pet){
        var c=this.canDo(pet,'soigner');if(!c.ok)return c;
        var isInj=pet.healthActionCount%2===0;
        pet.sante=this.cl(pet.sante+20);pet.bonheur=this.cl(pet.bonheur-5);
        pet.experience+=5;pet.actions++;pet.coins+=1;pet.healthActionCount++;pet.soinTotal++;
        this.setCooldown(pet,'soigner');return{ok:true,msg:isInj?'💉 Piqûre !':'💊 Cachet !',isInjection:isInj};
    },
    toilet(pet){
        if(pet.poops<=0&&pet.pipis<=0)return{ok:false,msg:'Rien à nettoyer !'};
        pet.poops=0;pet.pipis=0;pet.hygiene=this.cl(pet.hygiene+20);
        pet.experience+=10;pet.actions++;pet.coins+=2;
        return{ok:true,msg:'🧹 Propre !'};
    },
    shower(pet){
        var c=this.canDo(pet,'douche');if(!c.ok)return c;
        pet.hygiene=this.cl(pet.hygiene+20);pet.bonheur=this.cl(pet.bonheur+5);
        pet.experience+=10;pet.actions++;pet.coins+=3;
        this.setCooldown(pet,'douche');return{ok:true,msg:'🚿 Douche !'};
    },
    visit(pet){
        var c=this.canDo(pet,'visite');if(!c.ok)return c;
        var stage=this.STAGES[pet.stade];
        pet.amour=this.cl(pet.amour+20);pet.bonheur=this.cl(pet.bonheur+20);
        pet.experience+=15;pet.actions++;pet.coins+=3;
        this.setCooldown(pet,'visite');return{ok:true,msg:'💕 '+stage.henName+' !',henSprite:stage.hen};
    },
    studyAuto(pet){
        var c=this.canDo(pet,'intellect');if(!c.ok)return c;
        pet.intellect=this.cl(pet.intellect+20);pet.energie=this.cl(pet.energie-5);pet.jeu=this.cl(pet.jeu+20);
        pet.experience+=10;pet.actions++;pet.coins+=2;
        this.setCooldown(pet,'intellect');return{ok:true,msg:'📖 Lecture !'};
    },
    studyGame(pet,bonus){
        pet.intellect=this.cl(pet.intellect+15+bonus*2);pet.bonheur=this.cl(pet.bonheur+10);
        pet.experience+=10+bonus;pet.actions++;pet.coins+=2+Math.floor(bonus/2);
        return{ok:true,msg:'🧠 +'+(15+bonus*2)+' intellect'};
    },
    upgradeHousing(pet){
        var next=pet.housingLevel+1;if(next>=this.HOUSING.length)return{ok:false,msg:'Max atteint !'};
        var h=this.HOUSING[next];if(pet.coins<h.cost)return{ok:false,msg:'Pas assez de 🪙 ('+h.cost+')'};
        pet.coins-=h.cost;pet.housingLevel=next;return{ok:true,msg:'🏠 '+h.nom+' !'};
    },
    getTimeToEvolve(pet){var s=this.STAGES[pet.stade];if(!s.heures)return null;return Math.max(0,s.heures-(Date.now()-pet.derniereEvolution)/3600000);},
};
