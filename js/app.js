var App={
    pet:null,gameLoop:null,moveLoop:null,saveInterval:null,speechInterval:null,sleepZInterval:null,
    farmWalkLoop:null,soundOn:false,paused:false,
    touchStartX:0,touchStartY:0,isSwiping:false,
    _cheatBuffer:'',_cheatTimer:null,_visitTimer:null,

    init:function(){
        Storage.init();Renderer.init();this.showSplash();this.bindEvents();
    },

    showSplash:function(){
        var data=Storage.loadSync();
        var rb=document.getElementById('btn-resume');
        rb.classList.toggle('hidden',!(data&&!data.estMort));
        var lbEl=document.getElementById('lb-record');
        if(lbEl){var rec=this.getRecord();lbEl.textContent=rec>0?(rec<1?Math.round(rec*24)+'h':rec.toFixed(1)+' jours'):'Aucun record';}
        if(Engine.isWalletConnected()){var h=document.getElementById('holder-amount');if(h)h.textContent='✅ CONNECTÉ';}
    },

    bindEvents:function(){
        var self=this;
        document.getElementById('btn-resume').addEventListener('click',function(){
            var d=Storage.loadSync();if(d){self.pet=d;Engine.migrate(self.pet);Engine.updateStats(self.pet);self.showGame();Renderer.toast('▶ Reprise !');}
        });
        document.getElementById('btn-new-game').addEventListener('click',function(){self.newGame();});
        var cw=document.getElementById('btn-connect-wallet');if(cw)cw.addEventListener('click',function(){self.connectWallet();});
        var ho=document.getElementById('splash-holder');if(ho)ho.addEventListener('click',function(){self.connectWallet();});
        document.getElementById('btn-wallet-game').addEventListener('click',function(){self.connectWallet();document.getElementById('more-screen').classList.add('hidden');});
        document.getElementById('btn-wallet-gate').addEventListener('click',function(){self.connectWallet();document.getElementById('wallet-gate').classList.add('hidden');});
        document.getElementById('btn-wallet-skip').addEventListener('click',function(){document.getElementById('wallet-gate').classList.add('hidden');self.newGame();});

        // Game
        document.getElementById('btn-nourrir').addEventListener('click',function(){self.openFood();});
        document.getElementById('btn-jouer').addEventListener('click',function(){self.openPlay();});
        document.getElementById('btn-dormir').addEventListener('click',function(){self.doSleep();});
        document.getElementById('btn-visite').addEventListener('click',function(){self.doVisit();});
        document.getElementById('btn-soigner').addEventListener('click',function(){document.getElementById('care-screen').classList.remove('hidden');});
        document.getElementById('btn-stats').addEventListener('click',function(){self.openStats();});
        document.getElementById('btn-housing').addEventListener('click',function(){self.openHousing();});
        document.getElementById('btn-sound').addEventListener('click',function(){
            self.soundOn=!self.soundOn;
            document.getElementById('sound-icon').textContent=self.soundOn?'🔊':'🔇';
            self.updateAudio();
        });
        document.getElementById('btn-pause').addEventListener('click',function(){self.togglePause();});
        var pr=document.getElementById('btn-pause-resume');if(pr)pr.addEventListener('click',function(){self.setPause(false);});
        var be=document.getElementById('btn-envelope');if(be)be.addEventListener('click',function(){Features.renderQuests(self.pet);document.getElementById('quests-screen').classList.remove('hidden');});
        var bj=document.getElementById('btn-journal');if(bj)bj.addEventListener('click',function(){Features.renderJournal(self.pet);document.getElementById('more-screen').classList.add('hidden');document.getElementById('journal-screen').classList.remove('hidden');});
        document.getElementById('btn-nav-more').addEventListener('click',function(){document.getElementById('more-screen').classList.remove('hidden');});
        document.getElementById('btn-heal-direct').addEventListener('click',function(){self.doHeal();});
        document.getElementById('btn-toilette').addEventListener('click',function(){self.doToilet();});
        document.getElementById('btn-douche').addEventListener('click',function(){self.doShower();});
        document.getElementById('btn-brossage').addEventListener('click',function(){self.doBrossage();});
        document.getElementById('btn-enclos-badge').addEventListener('click',function(e){e.stopPropagation();self.openFarm();});
        document.getElementById('btn-notif').addEventListener('click',function(){Renderer.toast('🔔');});
        document.getElementById('btn-evo-ok').addEventListener('click',function(){Renderer.hideEvolution();});
        document.getElementById('btn-restart').addEventListener('click',function(){Renderer.hideDeath();self.newGame();});
        document.getElementById('btn-play-game').addEventListener('click',function(){self.doPlay();});
        document.getElementById('btn-play-study').addEventListener('click',function(){self.doStudy();});
        document.getElementById('btn-play-sudoku').addEventListener('click',function(){self.doStudySudoku();});
        document.getElementById('btn-play-morpion').addEventListener('click',function(){self.doMorpion();});
        document.getElementById('btn-play-catch').addEventListener('click',function(){self.doCatch();});
        document.getElementById('btn-play-roost').addEventListener('click',function(){self.doRoost();});
        document.getElementById('food-grid').addEventListener('click',function(e){var item=e.target.closest('[data-food]');if(item)self.doFeed(item.dataset.food);});
        document.getElementById('btn-reset').addEventListener('click',function(){document.getElementById('more-screen').classList.add('hidden');if(confirm('Reset?')){Storage.clear();self.pet=null;document.getElementById('game-screen').classList.remove('active');document.getElementById('splash-screen').classList.add('active');self.showSplash();}});

        // Cheats via keyboard
        document.addEventListener('keyup',function(e){
            if(!self.pet)return;var k=e.key.toUpperCase();
            if(k.length===1&&k>='A'&&k<='Z'){
                self._cheatBuffer+=k;clearTimeout(self._cheatTimer);
                self._cheatTimer=setTimeout(function(){self._cheatBuffer='';},2000);
                var r=Engine.applyCheat(self.pet,self._cheatBuffer);
                if(r.ok){Renderer.toast(r.msg);Storage.save(self.pet);Renderer.update(self.pet);self._cheatBuffer='';if(self.pet.estMort){self.saveRecord();Renderer.showDeath(self.pet);}}
            }
        });

        // Touch
        var touch=document.getElementById('scene-touch');
        touch.addEventListener('touchstart',function(e){self.touchStartX=e.touches[0].clientX;self.touchStartY=e.touches[0].clientY;self.isSwiping=false;},{passive:true});
        touch.addEventListener('touchmove',function(e){if(Math.abs(e.touches[0].clientX-self.touchStartX)>12||Math.abs(e.touches[0].clientY-self.touchStartY)>12)self.isSwiping=true;},{passive:true});
        touch.addEventListener('touchend',function(e){
            if(!self.pet||self.pet.estMort||self.paused)return;
            var cx=e.changedTouches[0].clientX,cy=e.changedTouches[0].clientY;
            if(self.isSwiping&&self._nearPet(self.touchStartX,self.touchStartY)){Engine.caress(self.pet);Features.trackQuest(self.pet,'caress',1);Renderer.showHeartAt(cx,cy-20);Renderer.toast('💕');Renderer.update(self.pet);Storage.save(self.pet);}
            else if(!self.isSwiping&&self._nearPet(cx,cy)){Engine.petClick(self.pet);Renderer.petPulse();Renderer.showCoinAt(cx-10,cy-20);Renderer.update(self.pet);Storage.save(self.pet);}
        });
        touch.addEventListener('click',function(e){if(!self.pet||self.pet.estMort||self.paused||'ontouchstart' in window)return;if(self._nearPet(e.clientX,e.clientY)){Engine.petClick(self.pet);Renderer.petPulse();Renderer.showCoinAt(e.clientX-10,e.clientY-20);Renderer.update(self.pet);Storage.save(self.pet);}});

        document.querySelectorAll('[data-close]').forEach(function(btn){btn.addEventListener('click',function(){var id=btn.getAttribute('data-close');if(id==='farm-screen'){Farm.close();clearInterval(self.farmWalkLoop);}document.getElementById(id).classList.add('hidden');});});
    },

    _nearPet:function(cx,cy){var pw=document.getElementById('pet-wrapper');if(!pw)return false;var r=pw.getBoundingClientRect(),m=40;return cx>r.left-m&&cx<r.right+m&&cy>r.top-m&&cy<r.bottom+m;},
    connectWallet:function(){Engine.connectWallet();var h=document.getElementById('holder-amount');if(h)h.textContent='✅ CONNECTÉ';Renderer.toast('✅ Wallet connecté !');},

    playBirthVideo:function(onDone){
        var overlay=document.getElementById('birth-video-overlay');
        var video=document.getElementById('birth-video');
        var skip=document.getElementById('birth-skip');
        if(!overlay||!video){if(onDone)onDone();return;}
        var finished=false;
        function done(){if(finished)return;finished=true;overlay.classList.add('hidden');try{video.pause();}catch(e){}if(onDone)onDone();}
        overlay.classList.remove('hidden');
        video.currentTime=0;
        var p=video.play();if(p&&p.catch)p.catch(function(){done();});
        video.onended=done;
        skip.onclick=done;
        // Safety timeout in case video fails
        setTimeout(function(){if(!finished&&(video.ended||video.error||video.readyState===0))done();},12000);
    },
    newGame:function(){
        var self=this;
        this.pet=Engine.createPet('Francis');Storage.save(this.pet);
        this.playBirthVideo(function(){
            self.showGame();Renderer.toast('🥚 Francis est né !');
        });
    },
    initAudio:function(){
        if(this._audioReady)return;
        this._ambientAudio=new Audio('assets/sounds/ferme.mp3');
        this._ambientAudio.loop=true;this._ambientAudio.volume=0.35;
        this._rainAudio=new Audio('assets/sounds/rain.mp3');
        this._rainAudio.loop=true;this._rainAudio.volume=0.5;
        this._audioReady=true;
    },
    updateAudio:function(){
        this.initAudio();
        var self=this;
        if(this.soundOn){
            // Ambient farm music always plays
            this._ambientAudio.play().catch(function(){});
            // Rain sound only when raining
            var raining=(typeof Weather!=='undefined'&&Weather._isRaining)?Weather._isRaining():false;
            if(raining)this._rainAudio.play().catch(function(){});
            else this._rainAudio.pause();
        }else{
            this._ambientAudio.pause();
            this._rainAudio.pause();
        }
    },
    requestWakeLock:function(){
        var self=this;
        if('wakeLock' in navigator){
            navigator.wakeLock.request('screen').then(function(wl){
                self._wakeLock=wl;
                wl.addEventListener('release',function(){});
            }).catch(function(e){});
        }
        // Re-acquire on visibility change
        if(!this._wakeLockListener){
            this._wakeLockListener=true;
            document.addEventListener('visibilitychange',function(){
                if(document.visibilityState==='visible'&&self.pet)self.requestWakeLock();
            });
        }
    },
    showGame:function(){
        this.requestWakeLock();
        if(this.pet&&this.pet.isPaused){var s=this;setTimeout(function(){s.setPause(true);},300);}
        try{if(window.Notification&&Notification.permission==='default')Notification.requestPermission();}catch(e){}
        var self=this;
        if(!this._audioSyncIv)this._audioSyncIv=setInterval(function(){if(self.soundOn)self.updateAudio();},5000);
        document.getElementById('splash-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        Storage.save(this.pet);
        var self=this;
        requestAnimationFrame(function(){requestAnimationFrame(function(){Renderer.update(self.pet);Weather.init();self.startLoops();});});
    },
    startLoops:function(){this.stopLoops();var self=this;
        this.gameLoop=setInterval(function(){self.gameTick();},5000);
        this.moveLoop=setInterval(function(){if(self.pet&&!self.pet.estMort&&!self.paused)Renderer.tickMovement(self.pet);},50);
        this.saveInterval=setInterval(function(){Storage.save(self.pet);},60000);
        this.speechInterval=setInterval(function(){if(self.pet&&!self.pet.estMort&&!self.pet.isSleeping&&!self.paused&&Math.random()<.4){var m=Engine.getMood(self.pet);if(m!=='ok')Renderer.showSpeech(Engine.getDialogue(self.pet));}},12000);
        this.sleepZInterval=setInterval(function(){if(self.pet&&self.pet.isSleeping&&!self.paused)Renderer.showSleepZ();},1500);
    },
    stopLoops:function(){clearInterval(this.gameLoop);clearInterval(this.moveLoop);clearInterval(this.saveInterval);clearInterval(this.speechInterval);clearInterval(this.sleepZInterval);},

    togglePause:function(){
        this.setPause(!this.paused);
    },
    setPause:function(state){
        this.paused=state;
        var icon=document.getElementById('pause-icon');if(icon)icon.textContent=this.paused?'▶️':'⏸️';
        var lbl=document.getElementById('pause-label');if(lbl)lbl.textContent=this.paused?'Reprendre':'Pause';
        var ov=document.getElementById('pause-overlay');if(ov)ov.classList.toggle('hidden',!this.paused);
        if(this.pet){
            this.pet.isPaused=this.paused;
            if(this.paused){
                this.pet._pauseStart=Date.now();
            }else if(this.pet._pauseStart){
                var pausedMs=Date.now()-this.pet._pauseStart;
                this.pet.derniereUpdate=(this.pet.derniereUpdate||Date.now())+pausedMs;
                if(this.pet.farm)this.pet.farm.lastUpdate=(this.pet.farm.lastUpdate||Date.now())+pausedMs;
                this.pet._pauseStart=null;
            }
            Storage.save(this.pet);
        }
        if(typeof Weather!=='undefined'){
            if(this.paused)Weather._pausedAt=Date.now();
            else if(Weather._pausedAt){Weather.startTime+=(Date.now()-Weather._pausedAt);Weather._pausedAt=null;}
        }
    },
    saveRecord:function(){
        if(!this.pet)return;
        var age=Engine.getAge(this.pet);
        var days=age.days+age.hours/24;
        var rec=0;
        try{rec=parseFloat(localStorage.getItem('francis_record')||'0');}catch(e){}
        if(days>rec){try{localStorage.setItem('francis_record',days.toFixed(2));}catch(e){}}
    },
    getRecord:function(){
        try{return parseFloat(localStorage.getItem('francis_record')||'0');}catch(e){return 0;}
    },
    gameTick:function(){
        if(!this.pet||this.pet.estMort||this.paused)return;
        Engine.updateStats(this.pet);Renderer.update(this.pet);this.updateCooldowns();
        this.checkAlerts();
        if(Engine.needsWalletGate(this.pet)){document.getElementById('wallet-gate').classList.remove('hidden');return;}
        if(this.pet.farm&&this.pet.farm.hens>0){Farm.update(this.pet);Farm.checkBonheurDeaths(this.pet);}
        if(Engine.checkEvolution(this.pet)){var old=Engine.STAGES[this.pet.stade];Engine.evolve(this.pet);Renderer.showEvolution(old,Engine.STAGES[this.pet.stade]);Storage.save(this.pet);}
        if(this.pet.estMort){this.saveRecord();Renderer.showDeath(this.pet);Storage.save(this.pet);}
        // ── FEATURES ──
        Features.applyWeatherImpact(this.pet);
        Features.autoJournal(this.pet);
        Features.maybeTriggerEvent(this.pet);
        Features.trackQuest(this.pet,'happy',0);
        this.updateWeatherBanner();
        this.updateQuestDot();
    },
    updateWeatherBanner:function(){
        var el=document.getElementById('weather-banner');if(!el)return;
        var label=Features.getWeatherLabel();
        el.textContent=label;el.style.display=label?'block':'none';
    },
    updateQuestDot:function(){
        if(!this.pet)return;
        var f=Features.ensure(this.pet);var env=document.getElementById('btn-envelope');
        if(!env||!f.quests)return;
        var hasClaim=f.quests.some(function(q){return q.done&&!q.claimed;});
        env.classList.toggle('hidden',!hasClaim);
    },

    _lastAlertLevel:100,
    checkAlerts:function(){
        if(!this.pet)return;
        var p=this.pet,b=Math.round(p.bonheur);
        var dot=document.getElementById('alert-dot');
        if(dot)dot.classList.toggle('hidden',b>=50);
        // Threshold notifications
        var thresholds=[
            {v:50,msg:'⚠️ Francis ne va pas bien ('+b+'%) !'},
            {v:25,msg:'🚨 ALERTE : Francis va très mal ('+b+'%) !'},
            {v:10,msg:'💀 DANGER CRITIQUE : Francis est en danger de mort ('+b+'%) !'},
            {v:5,msg:'☠️ URGENCE ABSOLUE ! Francis agonise ('+b+'%) !!'},
            {v:0,msg:'😇 La faucheuse est passée... Toutes nos condoléances.'}
        ];
        // Find cause
        var cause='';
        if(p.faim<20)cause='Il a super faim !';
        else if(p.energie<20)cause='Il est épuisé !';
        else if(p.sante<20)cause='Il est très malade !';
        else if((p.hygiene||50)<20)cause='Son hygiène est critique !';
        else if((p.amour||30)<20)cause='Il se sent abandonné !';
        else if((p.jeu||0)<15)cause='Il s\'ennuie !';
        for(var i=0;i<thresholds.length;i++){
            var t=thresholds[i];
            if(b<=t.v&&this._lastAlertLevel>t.v){
                this._lastAlertLevel=t.v;
                var fullMsg=t.msg+(cause?' '+cause:'');
                Renderer.toast(fullMsg);
                // Try Telegram notification
                try{if(window.Telegram&&Telegram.WebApp)Telegram.WebApp.showAlert(fullMsg);}catch(e){}
                // Try browser notification
                try{if(window.Notification&&Notification.permission==='granted')new Notification('🐓 Francis le Coq',{body:fullMsg,icon:'assets/sprites/francis.png'});}catch(e){}
                break;
            }
        }
        if(b>50)this._lastAlertLevel=100;
    },

    updateCooldowns:function(){
        var now=Date.now(),acts=['nourrir','jouer','dormir','soigner','visite'];
        for(var i=0;i<acts.length;i++){var a=acts[i],btn=document.getElementById('btn-'+a);if(!btn)continue;
        if(a==='dormir'&&this.pet&&this.pet.isSleeping)continue;
        var cd=(this.pet.cooldowns&&this.pet.cooldowns[a])||0;
        if(now<cd){btn.classList.add('on-cooldown');var s=Math.ceil((cd-now)/1000);var t=btn.querySelector('.cooldown-timer');if(!t){t=document.createElement('span');t.className='cooldown-timer';btn.appendChild(t);}t.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
        else{btn.classList.remove('on-cooldown');var t2=btn.querySelector('.cooldown-timer');if(t2)t2.remove();}}
    },

    // ═══ NOURRIR — 10s animation with food emoji ═══
    openFood:function(){if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;var c=Engine.canDo(this.pet,'nourrir');if(!c.ok){Renderer.toast(c.msg);return;}document.getElementById('food-grid').innerHTML=Renderer.renderFoodGrid();document.getElementById('food-screen').classList.remove('hidden');},
    doFeed:function(id){
        var f=Engine.FOODS.find(function(x){return x.id===id;});
        if(!f){return;}
        document.getElementById('food-screen').classList.add('hidden');
        var cd=Engine.canDo(this.pet,'nourrir');if(!cd.ok){Renderer.toast(cd.msg);return;}
        var self=this;var oldFaim=this.pet.faim||0;
        var gain=f.faim; // 1% = 1 second
        Engine.setCooldown(this.pet,'nourrir');
        Renderer.petEatAnimation(f.emoji,function(){
            var before=self.pet.faim||0;
            self.pet.faim=Engine.cl(self.pet.faim+f.faim);
            self.pet.bonheur=Engine.cl(self.pet.bonheur+(f.bonheur||0));
            self.pet.energie=Engine.cl(self.pet.energie+(f.energie||0));
            self.pet.sante=Engine.cl(self.pet.sante+(f.sante||0));
            self.pet.coins+=2;
            Renderer.animateGauge('faim','Faim',before,self.pet.faim);
            Features.trackQuest(self.pet,'feed',1);
            Renderer.update(self.pet);Storage.save(self.pet);
        },gain);
        Storage.save(this.pet);
    },

    // ═══ JOUER — panel with mini-jeu + lecture + sudoku ═══
    openPlay:function(){if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;var c=Engine.canDo(this.pet,'jouer');if(!c.ok){Renderer.toast(c.msg);return;}document.getElementById('play-screen').classList.remove('hidden');},
    doPlay:function(){
        document.getElementById('play-screen').classList.add('hidden');
        var self=this;
        Minigames.startPlay(function(reward){
            reward=reward||{};
            var beforeJeu=self.pet.jeu||0, beforeFaim=self.pet.faim||0;
            self.pet.jeu=Engine.cl((self.pet.jeu||0)+(reward.jeu||20));
            self.pet.faim=Engine.cl((self.pet.faim||0)+(reward.faim||0));
            self.pet.bonheur=Engine.cl(self.pet.bonheur+(reward.bonheur||10));
            self.pet.energie=Engine.cl(self.pet.energie-5);
            self.pet.coins+=(reward.coins||3);
            if(Renderer.petHappyAnimation)Renderer.petHappyAnimation();
            Storage.save(self.pet);
            setTimeout(function(){
                Renderer.animateGauge('jeu','Jeu',beforeJeu,self.pet.jeu);
                if(reward.faim)setTimeout(function(){Renderer.animateGauge('faim','Faim',beforeFaim,self.pet.faim);},700);
                Features.trackQuest(self.pet,'play',1);Renderer.update(self.pet);
            },800);
        });
    },
    doStudy:function(){
        document.getElementById('play-screen').classList.add('hidden');
        var c=Engine.canDo(this.pet,'intellect');if(!c.ok){Renderer.toast(c.msg);return;}
        var self=this;
        Engine.setCooldown(this.pet,'intellect');
        Renderer.showStudyAnimation(function(){
            var before=self.pet.jeu||0;
            self.pet.intellect=Engine.cl(self.pet.intellect+15);
            self.pet.jeu=Engine.cl((self.pet.jeu||0)+15);
            self.pet.experience+=10;self.pet.coins+=2;
            Renderer.animateGauge('jeu','Jeu',before,self.pet.jeu);
            Features.trackQuest(self.pet,'study',1);Features.trackQuest(self.pet,'play',1);
            Renderer.update(self.pet);Storage.save(self.pet);
        });
        Storage.save(this.pet);
    },
    doStudySudoku:function(){
        document.getElementById('play-screen').classList.add('hidden');
        var self=this;
        Minigames.startSudoku(function(win){
            var before=self.pet.jeu||0;
            self.pet.jeu=Engine.cl((self.pet.jeu||0)+30);
            self.pet.intellect=Engine.cl(self.pet.intellect+30);
            self.pet.coins+=5;
            Storage.save(self.pet);
            setTimeout(function(){Renderer.animateGauge('jeu','Jeu',before,self.pet.jeu);Renderer.update(self.pet);},800);
        });
    },
    doCatch:function(){
        document.getElementById('play-screen').classList.add('hidden');
        var self=this;
        Minigames.startCatch(function(reward){
            reward=reward||{};
            var bJeu=self.pet.jeu||0,bFaim=self.pet.faim||0;
            self.pet.jeu=Engine.cl((self.pet.jeu||0)+(reward.jeu||30));
            self.pet.faim=Engine.cl((self.pet.faim||0)+(reward.faim||0));
            self.pet.bonheur=Engine.cl(self.pet.bonheur+(reward.bonheur||0));
            self.pet.coins+=(reward.coins||0);
            Storage.save(self.pet);
            setTimeout(function(){Renderer.animateGauge('jeu','Jeu',bJeu,self.pet.jeu);Features.trackQuest(self.pet,'play',1);Renderer.update(self.pet);},800);
        });
    },
    doRoost:function(){
        document.getElementById('play-screen').classList.add('hidden');
        var self=this;
        Minigames.startRoostClicker(function(reward){
            reward=reward||{};
            var bJeu=self.pet.jeu||0,bBon=self.pet.bonheur||0;
            self.pet.jeu=Engine.cl((self.pet.jeu||0)+(reward.jeu||15));
            self.pet.bonheur=Engine.cl(self.pet.bonheur+(reward.bonheur||20));
            self.pet.coins+=(reward.coins||0);
            Storage.save(self.pet);
            setTimeout(function(){Renderer.animateGauge('bonheur','Bonheur',bBon,self.pet.bonheur);Features.trackQuest(self.pet,'play',1);Renderer.update(self.pet);},800);
        });
    },
    doMorpion:function(){
        document.getElementById('play-screen').classList.add('hidden');
        var self=this;
        Minigames.startMorpion(function(win){
            var before=self.pet.jeu||0;
            self.pet.jeu=Engine.cl((self.pet.jeu||0)+30);
            self.pet.intellect=Engine.cl(self.pet.intellect+20);
            self.pet.bonheur=Engine.cl(self.pet.bonheur+(win?15:5));
            self.pet.coins+=(win?8:3);
            Storage.save(self.pet);
            setTimeout(function(){Renderer.animateGauge('jeu','Jeu',before,self.pet.jeu);Renderer.update(self.pet);},800);
        });
    },

    // ═══ DORMIR ═══
    doSleep:function(){
        if(!this.pet||this.pet.estMort)return;
        var wasSleeping=this.pet.isSleeping;
        var r=Engine.sleep(this.pet);Renderer.toast(r.msg);
        Storage.save(this.pet);Renderer.update(this.pet);
        // If interrupting sleep, stop the animation/countdown/zzz
        if(wasSleeping&&!this.pet.isSleeping){Renderer.stopSleepAnimation();return;}
        // Countdown = time for energy to reach 100% (10%/game-hour, 1 game-h=120s)
        if(!wasSleeping&&this.pet.isSleeping){
            var oldEnergie=this.pet.energie||50;var self=this;
            var gameHoursNeeded=(100-oldEnergie)/10; // 10% per game hour
            var seconds=Math.max(3,Math.round(gameHoursNeeded*120)); // 1 game-h = 120s real
            Renderer.showSleepAnimation(function(){
                self.pet.energie=100;
                self.pet.isSleeping=false;
                Renderer.animateGauge('energie','Énergie',oldEnergie,100);
                Renderer.update(self.pet);Storage.save(self.pet);
            },seconds);
        }
    },

    // ═══ SOIGNER — 10s animation, +20%, gauge result ═══
    doHeal:function(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;
        document.getElementById('care-screen').classList.add('hidden');
        var c=Engine.canDo(this.pet,'soigner');if(!c.ok){Renderer.toast(c.msg);return;}
        var self=this;
        Engine.setCooldown(this.pet,'soigner');
        Renderer.showBigSyringe(function(){
            var before=self.pet.sante||50;
            self.pet.sante=Engine.cl(self.pet.sante+20);
            self.pet.experience+=10;self.pet.coins+=3;
            Renderer.animateGauge('sante','Santé',before,self.pet.sante);
            Features.trackQuest(self.pet,'heal',1);
            Renderer.update(self.pet);Storage.save(self.pet);
        });
        Storage.save(this.pet);
    },

    // ═══ TOILETTE — +20%, gauge result ═══
    doToilet:function(){
        if(!this.pet)return;document.getElementById('care-screen').classList.add('hidden');
        var poopCount=this.pet.poops||0;
        if(poopCount<=0){Renderer.toast('Rien à nettoyer !');return;}
        var self=this;var oldHyg2=this.pet.hygiene||50;
        var gain=poopCount*10; // +10% per poop
        Renderer.showBigBroom(function(){
            self.pet.poops=0;self.pet.pipis=0;
            self.pet.hygiene=Engine.cl(oldHyg2+gain);
            Renderer.animateGauge('hygiene','Hygiène',oldHyg2,self.pet.hygiene);
            Renderer.update(self.pet);Storage.save(self.pet);
        },poopCount);
        Storage.save(this.pet);
    },

    doBrossage:function(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;
        document.getElementById('care-screen').classList.add('hidden');
        var self=this;var oldHyg=this.pet.hygiene||50;
        Renderer.showToothbrush(function(){
            self.pet.hygiene=Engine.cl(oldHyg+20);
            self.pet.bonheur=Engine.cl(self.pet.bonheur+3);
            self.pet.coins+=2;
            Renderer.animateGauge('hygiene','Hygiène',oldHyg,self.pet.hygiene);
            Renderer.update(self.pet);Storage.save(self.pet);
        });
        Storage.save(this.pet);
    },

    // ═══ DOUCHE — 10s, +20%, gauge result ═══
    doShower:function(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;
        document.getElementById('care-screen').classList.add('hidden');
        var c=Engine.canDo(this.pet,'douche');if(!c.ok){Renderer.toast(c.msg);return;}
        var self=this;var oldHyg=this.pet.hygiene||50;
        Engine.setCooldown(this.pet,'douche');
        Renderer.showHeavyShower(function(){
            var before=self.pet.hygiene||50;
            self.pet.hygiene=Engine.cl(self.pet.hygiene+20);
            self.pet.bonheur=Engine.cl(self.pet.bonheur+5);
            self.pet.experience+=10;self.pet.coins+=3;
            Renderer.animateGauge('hygiene','Hygiène',before,self.pet.hygiene);
            Features.trackQuest(self.pet,'wash',1);
            Renderer.update(self.pet);Storage.save(self.pet);
        });
        Storage.save(this.pet);
    },

    // ═══ CALINER — 1 min, amour ticks +5 every 10s ═══
    doVisit:function(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;
        var r=Engine.visit(this.pet);Renderer.toast(r.msg);
        if(r.ok){
            var oldAmour=this.pet.amour||30;
            var self=this;
            // Amour ticks during visit (+5 every 10s over 60s = +30 max)
            clearInterval(this._visitTimer);
            this._visitTimer=setInterval(function(){
                if(self.pet)self.pet.amour=Math.min(100,(self.pet.amour||30)+5);
                Renderer.update(self.pet);Storage.save(self.pet);
            },10000);
            var henSz=Engine.STAGES[this.pet.stade].size;if(this.pet.stade===0)henSz=94;if(this.pet.stade===1)henSz=Math.round(henSz*0.7);var henBot=(this.pet.stade===2)?2:10;Renderer.showHenVisit(r.henSprite,henSz,function(){
                clearInterval(self._visitTimer);
                Renderer.animateGauge('amour','Amour',oldAmour,self.pet.amour||30);
                Renderer.update(self.pet);Storage.save(self.pet);
            },henBot);
            Storage.save(this.pet);
        }
    },

    openStats:function(){if(!this.pet)return;document.getElementById('stats-detail').innerHTML=Renderer.renderStatsDetail(this.pet);document.getElementById('stats-screen').classList.remove('hidden');},
    openHousing:function(){
        if(!this.pet)return;var list=document.getElementById('housing-list');list.innerHTML='';var self=this;
        for(var i=0;i<Engine.HOUSING.length;i++){var h=Engine.HOUSING[i],isCur=i===this.pet.housingLevel,isNext=i===this.pet.housingLevel+1;
        var cls='housing-item'+(isCur?' current':'')+(i>this.pet.housingLevel+1?' locked':'')+(isNext&&this.pet.coins>=h.cost?' can-buy':'');
        list.innerHTML+='<div class="'+cls+'" data-housing="'+i+'"><span class="housing-emoji">'+h.emoji+'</span><div class="housing-info"><div class="housing-name">'+h.nom+'</div><div class="housing-cost">'+(h.cost||'Gratuit')+' 🪙</div></div></div>';}
        list.querySelectorAll('[data-housing]').forEach(function(el){el.addEventListener('click',function(){var idx=+el.dataset.housing;if(idx===self.pet.housingLevel+1){var r=Engine.upgradeHousing(self.pet);Renderer.toast(r.msg);if(r.ok){Weather.lastBuildingState=null;Storage.save(self.pet);Renderer.update(self.pet);self.openHousing();}}});});
        document.getElementById('housing-screen').classList.remove('hidden');
    },
    openFarm:function(){if(!this.pet)return;Farm.open(this.pet);this.bindFarmButtons();clearInterval(this.farmWalkLoop);var el=document.getElementById('farm-francis'),img=document.getElementById('farm-francis-img');if(el&&img&&this.pet){img.src=Engine.STAGES[this.pet.stade].sprite;/* Francis FIXED: 5% from left, 50% from bottom — never overlaps hens */el.style.left='5%';el.style.bottom='50%';el.style.top='auto';}},
    bindFarmButtons:function(){var self=this;['btn-farm-buy','btn-farm-feed','btn-farm-clean'].forEach(function(id){var o=document.getElementById(id);if(!o)return;var n=o.cloneNode(true);o.parentNode.replaceChild(n,o);});
    document.getElementById('btn-farm-buy').addEventListener('click',function(){var r=Farm.buyHen(self.pet);Renderer.toast(r.msg);if(r.ok){Farm.addHenToScene();Farm.renderUI(self.pet);Storage.save(self.pet);Renderer.update(self.pet);}});
    document.getElementById('btn-farm-feed').addEventListener('click',function(){var r=Farm.feedEnclosure(self.pet);Renderer.toast(r.msg);if(r.ok){Farm.showFeedAnimation('🌾');Farm.renderUI(self.pet);}Storage.save(self.pet);});
    document.getElementById('btn-farm-clean').addEventListener('click',function(){var r=Farm.cleanEnclosure(self.pet);Renderer.toast(r.msg);if(r.ok){Farm.showCleanAnimation();Farm.renderUI(self.pet);}Storage.save(self.pet);});}
};
document.addEventListener('DOMContentLoaded',function(){App.init();});
