const App = {
    pet:null, gameLoop:null, moveLoop:null, saveInterval:null,
    speechInterval:null, sleepZInterval:null,
    bgMusic:null, soundOn:false,

    init() {
        Storage.init(); Renderer.init(); this.bindEvents(); this.initTelegram(); this.initSound();
        Storage.load((data) => {
            if (data && !data.estMort) { this.pet=data; Engine.updateStats(this.pet); this.showGame(); }
            else document.getElementById('splash-screen').classList.add('active');
        });
    },
    initTelegram() {
        try { const tg=window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();tg.enableClosingConfirmation();
        tg.BackButton.onClick(()=>{document.querySelectorAll('.overlay:not(.hidden)').forEach(o=>o.classList.add('hidden'));tg.BackButton.hide();}); }} catch(e){}
    },
    initSound() { this.bgMusic=new Audio('assets/sounds/ferme.mp3'); this.bgMusic.loop=true; this.bgMusic.volume=0.3; },
    toggleSound() {
        this.soundOn=!this.soundOn;
        document.getElementById('sound-icon').textContent=this.soundOn?'🔊':'🔇';
        this.soundOn?this.bgMusic.play().catch(()=>{}):this.bgMusic.pause();
    },

    bindEvents() {
        document.getElementById('btn-start-game').addEventListener('click',()=>this.newGame());
        document.getElementById('btn-nourrir').addEventListener('click',()=>this.openFood());
        document.getElementById('btn-jouer').addEventListener('click',()=>this.doPlay());
        document.getElementById('btn-dormir').addEventListener('click',()=>this.doSleep());
        document.getElementById('btn-soigner').addEventListener('click',()=>this.doHeal());
        document.getElementById('btn-toilette').addEventListener('click',()=>this.doToilet());
        document.getElementById('btn-douche').addEventListener('click',()=>this.doShower());
        document.getElementById('btn-intellect').addEventListener('click',()=>this.openIntellect());
        document.getElementById('btn-stats').addEventListener('click',()=>this.openStats());
        document.getElementById('btn-housing').addEventListener('click',()=>this.openHousing());
        document.getElementById('btn-sound').addEventListener('click',()=>this.toggleSound());
        document.getElementById('btn-evo-ok').addEventListener('click',()=>Renderer.hideEvolution());
        document.getElementById('btn-restart').addEventListener('click',()=>{Renderer.hideDeath();this.newGame();});
        document.getElementById('scene-touch').addEventListener('click',(e)=>this.doPet(e));
        document.getElementById('food-grid').addEventListener('click',(e)=>{const i=e.target.closest('[data-food]');if(i)this.doFeed(i.dataset.food);});
        document.getElementById('btn-study-auto').addEventListener('click',()=>this.doStudyAuto());
        document.getElementById('btn-study-sudoku').addEventListener('click',()=>this.doStudySudoku());
        document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{
            document.getElementById(b.dataset.close).classList.add('hidden');
            try{window.Telegram?.WebApp?.BackButton?.hide();}catch(e){}
        }));
    },

    newGame() {
        this.pet=Engine.createPet('Francis'); Storage.save(this.pet); this.showGame();
        Renderer.toast('🥚 Francis est né !'); Renderer.showEmotion('🐣',2000);
    },
    showGame() {
        document.getElementById('splash-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        Renderer.update(this.pet); Weather.init(); this.startLoops();
        if(this.pet.estMort) setTimeout(()=>Renderer.showDeath(this.pet),500);
    },
    startLoops() {
        this.stopLoops();
        this.gameLoop=setInterval(()=>this.gameTick(),5000);
        this.moveLoop=setInterval(()=>{if(this.pet&&!this.pet.estMort)Renderer.tickMovement(this.pet);},50);
        this.saveInterval=setInterval(()=>{if(this.pet)Storage.save(this.pet);},30000);
        this.speechInterval=setInterval(()=>{if(this.pet&&!this.pet.estMort&&!this.pet.isSleeping&&Math.random()<.3)Renderer.showSpeech(Engine.getDialogue(this.pet));},15000);
        this.sleepZInterval=setInterval(()=>{if(this.pet?.isSleeping)Renderer.showSleepZ();},1500);
    },
    stopLoops(){clearInterval(this.gameLoop);clearInterval(this.moveLoop);clearInterval(this.saveInterval);clearInterval(this.speechInterval);clearInterval(this.sleepZInterval);},

    gameTick() {
        if(!this.pet||this.pet.estMort) return;
        Engine.updateStats(this.pet); Renderer.update(this.pet); this.updateCooldowns(); this.updateHUD();
        if(Engine.checkEvolution(this.pet)){
            const old=Engine.STAGES[this.pet.stade]; Engine.evolve(this.pet);
            Renderer.showEvolution(old,Engine.STAGES[this.pet.stade]); Storage.save(this.pet);
        }
        if(this.pet.estMort){Renderer.showDeath(this.pet);Storage.save(this.pet);}
    },

    updateHUD() {
        if(!this.pet) return;
        document.getElementById('hud-coins').textContent='🪙 '+this.pet.coins;
        document.getElementById('hud-stage').textContent=Engine.STAGES[this.pet.stade].emoji+' '+Engine.STAGES[this.pet.stade].nom;
        const h=Engine.HOUSING[this.pet.housingLevel||0];
        document.getElementById('housing-badge').textContent=h.emoji;
    },

    updateCooldowns() {
        const now=Date.now();
        ['nourrir','jouer','dormir','soigner','toilette','douche','intellect'].forEach(a=>{
            const btn=document.getElementById('btn-'+a); if(!btn) return;
            const cd=this.pet.cooldowns[a]||0;
            if(now<cd){btn.classList.add('on-cooldown');const s=Math.ceil((cd-now)/1000),m=Math.floor(s/60);
                let t=btn.querySelector('.cooldown-timer');if(!t){t=document.createElement('span');t.className='cooldown-timer';btn.appendChild(t);}
                t.textContent=m+':'+String(s%60).padStart(2,'0');
            } else {btn.classList.remove('on-cooldown');const t=btn.querySelector('.cooldown-timer');if(t)t.remove();}
        });
    },

    openFood(){
        if(!this.pet||this.pet.estMort) return;
        if(this.pet.isSleeping){Renderer.toast('😴');return;}
        const c=Engine.canDoAction(this.pet,'nourrir');if(!c.ok){Renderer.toast(c.msg);return;}
        document.getElementById('food-grid').innerHTML=Renderer.renderFoodGrid();
        document.getElementById('food-screen').classList.remove('hidden');
    },
    doFeed(foodId){
        const r=Engine.feed(this.pet,foodId); document.getElementById('food-screen').classList.add('hidden');
        if(r.ok){Renderer.toast(r.msg);Renderer.petEatAnimation();Renderer.showFloatingItem(r.food.emoji,this.rndX(),50);Renderer.haptic('light');this.showCoinGain(1);Storage.save(this.pet);}
        else Renderer.toast(r.msg); Renderer.update(this.pet);
    },
    doPlay(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping) return;
        const c=Engine.canDoAction(this.pet,'jouer');if(!c.ok){Renderer.toast(c.msg);return;}
        Minigames.startPlay((bonus)=>{
            const r=Engine.play(this.pet,bonus);
            if(r.ok){Renderer.toast('🎮 +'+bonus+' bonheur !');Renderer.petHappyAnimation();Renderer.showEmotion('🎉');this.showCoinGain(2+Math.floor(bonus/3));Storage.save(this.pet);}
            Renderer.update(this.pet);
        });
    },
    doSleep(){
        if(!this.pet||this.pet.estMort) return;
        const r=Engine.sleep(this.pet); Renderer.toast(r.msg);
        if(r.ok){Renderer.haptic('light');Renderer.showEmotion(this.pet.isSleeping?'😴':'☀️');if(!this.pet.isSleeping)Renderer.petHappyAnimation();Storage.save(this.pet);}
        Renderer.update(this.pet);
    },
    doHeal(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping) return;
        const r=Engine.heal(this.pet); Renderer.toast(r.msg);
        if(r.ok){Renderer.showFloatingItem(r.emoji,this.rndX(),40);Renderer.showEmotion(r.isInjection?'😖':'😬');Renderer.haptic(r.isInjection?'heavy':'light');this.showCoinGain(2);Storage.save(this.pet);}
        Renderer.update(this.pet);
    },
    doToilet(){
        if(!this.pet) return;
        const r=Engine.toilet(this.pet); Renderer.toast(r.msg);
        if(r.ok){Renderer.showEmotion('✨');Renderer.haptic('light');this.showCoinGain(1);Storage.save(this.pet);}
        Renderer.update(this.pet);
    },
    doShower(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping) return;
        const r=Engine.shower(this.pet); Renderer.toast(r.msg);
        if(r.ok){Renderer.showShowerAnimation();Renderer.showEmotion('🧼');Renderer.petHappyAnimation();Renderer.haptic('medium');this.showCoinGain(2);Storage.save(this.pet);}
        Renderer.update(this.pet);
    },

    openIntellect(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping) return;
        const c=Engine.canDoAction(this.pet,'intellect');if(!c.ok){Renderer.toast(c.msg);return;}
        document.getElementById('intellect-screen').classList.remove('hidden');
    },
    doStudyAuto(){
        document.getElementById('intellect-screen').classList.add('hidden');
        const r=Engine.studyAuto(this.pet); Renderer.toast(r.msg);
        if(r.ok){Renderer.showEmotion('📖');Renderer.showFloatingItem('📖',this.rndX(),40);this.showCoinGain(3);Storage.save(this.pet);}
        Renderer.update(this.pet);
    },
    doStudySudoku(){
        document.getElementById('intellect-screen').classList.add('hidden');
        Minigames.startSudoku((bonus)=>{
            const r=Engine.studyGame(this.pet,bonus);
            if(r.ok){Renderer.toast(r.msg);Renderer.showEmotion('🧠');this.showCoinGain(2+Math.floor(bonus/2));Storage.save(this.pet);}
            Renderer.update(this.pet);
        });
    },

    doPet(e){
        if(!this.pet||this.pet.estMort) return;
        Renderer.showHeartAt(e.clientX-10,e.clientY-10);
        const r=Engine.caress(this.pet);
        if(r.ok){Renderer.showEmotion('💕');Renderer.haptic('light');this.showCoinGain(1,e.clientX,e.clientY);Storage.save(this.pet);}
        Renderer.update(this.pet);
    },

    openStats(){
        if(!this.pet) return;
        document.getElementById('stats-detail').innerHTML=Renderer.renderStatsDetail(this.pet);
        document.getElementById('stats-screen').classList.remove('hidden');
    },

    openHousing(){
        if(!this.pet) return;
        const list=document.getElementById('housing-list'); list.innerHTML='';
        Engine.HOUSING.forEach((h,i)=>{
            const isCurrent=i===this.pet.housingLevel;
            const isLocked=i>this.pet.housingLevel+1;
            const isNext=i===this.pet.housingLevel+1;
            const canAfford=this.pet.coins>=h.cost;
            let cls='housing-item';if(isCurrent)cls+=' current';if(isLocked)cls+=' locked';
            const costText=h.cost===0?'Gratuit':h.cost+' 🪙';
            const statusText=isCurrent?'✅ Actuel':isNext?(canAfford?'Acheter':'Fonds insuffisants'):(isLocked?'🔒':'');
            list.innerHTML+=`<div class="${cls}" data-housing="${i}">
                <span class="housing-emoji">${h.emoji}</span>
                <div class="housing-info"><div class="housing-name">${h.nom}</div><div class="housing-cost">${costText} · ${statusText}</div></div>
            </div>`;
        });
        list.querySelectorAll('[data-housing]').forEach(el=>el.addEventListener('click',()=>{
            const idx=parseInt(el.dataset.housing);
            if(idx===this.pet.housingLevel+1){
                const r=Engine.upgradeHousing(this.pet);Renderer.toast(r.msg);
                if(r.ok){Renderer.showEmotion('🏠');Renderer.haptic('heavy');Storage.save(this.pet);this.updateHUD();this.openHousing();}
            }
        }));
        document.getElementById('housing-screen').classList.remove('hidden');
    },

    showCoinGain(amount,x,y){
        if(!amount) return;
        const el=document.createElement('div');el.className='coin-float';
        el.textContent='+'+amount+' 🪙';
        el.style.left=(x||window.innerWidth/2)+'px';
        el.style.top=(y||window.innerHeight/2-50)+'px';
        document.body.appendChild(el);
        setTimeout(()=>el.remove(),1200);
        this.updateHUD();
    },

    rndX(){return 20+Math.random()*60;},
};
document.addEventListener('DOMContentLoaded',()=>App.init());
