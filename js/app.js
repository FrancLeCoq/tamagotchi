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
        if(Engine.isWalletConnected()){var h=document.getElementById('holder-amount');if(h)h.textContent='✅ CONNECTÉ';}
    },

    bindEvents:function(){
        var self=this;
        document.getElementById('btn-resume').addEventListener('click',function(){
            var d=Storage.loadSync();if(d){self.pet=d;Engine.migrate(self.pet);Engine.updateStats(self.pet);self.showGame();Renderer.toast('▶ Reprise !');}
        });
        document.getElementById('btn-new-game').addEventListener('click',function(){self.newGame();});
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
        document.getElementById('btn-pause').addEventListener('click',function(){self.paused=!self.paused;document.getElementById('pause-icon').textContent=self.paused?'▶️':'⏸️';Renderer.toast(self.paused?'⏸️':'▶️');});
        document.getElementById('btn-nav-more').addEventListener('click',function(){document.getElementById('more-screen').classList.remove('hidden');});
        document.getElementById('btn-heal-direct').addEventListener('click',function(){self.doHeal();});
        document.getElementById('btn-toilette').addEventListener('click',function(){self.doToilet();});
        document.getElementById('btn-douche').addEventListener('click',function(){self.doShower();});
        document.getElementById('btn-enclos-badge').addEventListener('click',function(e){e.stopPropagation();self.openFarm();});
        document.getElementById('btn-notif').addEventListener('click',function(){Renderer.toast('🔔');});
        document.getElementById('btn-evo-ok').addEventListener('click',function(){Renderer.hideEvolution();});
        document.getElementById('btn-restart').addEventListener('click',function(){Renderer.hideDeath();self.newGame();});
        document.getElementById('btn-play-game').addEventListener('click',function(){self.doPlay();});
        document.getElementById('btn-play-study').addEventListener('click',function(){self.doStudy();});
        document.getElementById('btn-play-sudoku').addEventListener('click',function(){self.doStudySudoku();});
        document.getElementById('food-grid').addEventListener('click',function(e){var item=e.target.closest('[data-food]');if(item)self.doFeed(item.dataset.food);});
        document.getElementById('btn-reset').addEventListener('click',function(){document.getElementById('more-screen').classList.add('hidden');if(confirm('Reset?')){Storage.clear();self.pet=null;document.getElementById('game-screen').classList.remove('active');document.getElementById('splash-screen').classList.add('active');self.showSplash();}});

        // Cheats via keyboard
        document.addEventListener('keyup',function(e){
            if(!self.pet)return;var k=e.key.toUpperCase();
            if(k.length===1&&k>='A'&&k<='Z'){
                self._cheatBuffer+=k;clearTimeout(self._cheatTimer);
                self._cheatTimer=setTimeout(function(){self._cheatBuffer='';},2000);
                var r=Engine.applyCheat(self.pet,self._cheatBuffer);
                if(r.ok){Renderer.toast(r.msg);Storage.save(self.pet);Renderer.update(self.pet);self._cheatBuffer='';if(self.pet.estMort)Renderer.showDeath(self.pet);}
            }
        });

        // Touch
        var touch=document.getElementById('scene-touch');
        touch.addEventListener('touchstart',function(e){self.touchStartX=e.touches[0].clientX;self.touchStartY=e.touches[0].clientY;self.isSwiping=false;},{passive:true});
        touch.addEventListener('touchmove',function(e){if(Math.abs(e.touches[0].clientX-self.touchStartX)>12||Math.abs(e.touches[0].clientY-self.touchStartY)>12)self.isSwiping=true;},{passive:true});
        touch.addEventListener('touchend',function(e){
            if(!self.pet||self.pet.estMort||self.paused)return;
            var cx=e.changedTouches[0].clientX,cy=e.changedTouches[0].clientY;
            if(self.isSwiping&&self._nearPet(self.touchStartX,self.touchStartY)){Engine.caress(self.pet);Renderer.showHeartAt(cx,cy-20);Renderer.toast('💕');Renderer.update(self.pet);Storage.save(self.pet);}
            else if(!self.isSwiping&&self._nearPet(cx,cy)){Engine.petClick(self.pet);Renderer.showCoinAt(cx-10,cy-20);Renderer.update(self.pet);Storage.save(self.pet);}
        });
        touch.addEventListener('click',function(e){if(!self.pet||self.pet.estMort||self.paused||'ontouchstart' in window)return;if(self._nearPet(e.clientX,e.clientY)){Engine.petClick(self.pet);Renderer.showCoinAt(e.clientX-10,e.clientY-20);Renderer.update(self.pet);Storage.save(self.pet);}});

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

    gameTick:function(){
        if(!this.pet||this.pet.estMort||this.paused)return;
        Engine.updateStats(this.pet);Renderer.update(this.pet);this.updateCooldowns();
        this.checkAlerts();
        if(Engine.needsWalletGate(this.pet)){document.getElementById('wallet-gate').classList.remove('hidden');return;}
        if(this.pet.farm&&this.pet.farm.hens>0)Farm.update(this.pet);
        if(Engine.checkEvolution(this.pet)){var old=Engine.STAGES[this.pet.stade];Engine.evolve(this.pet);Renderer.showEvolution(old,Engine.STAGES[this.pet.stade]);Storage.save(this.pet);}
        if(this.pet.estMort){Renderer.showDeath(this.pet);Storage.save(this.pet);}
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
        var oldFaim=this.pet?this.pet.faim:50;
        var r=Engine.feed(this.pet,id);
        document.getElementById('food-screen').classList.add('hidden');
        if(r.ok){
            var self=this;
            Renderer.petEatAnimation(f?f.emoji:'🌾',function(){
                Renderer.animateGauge('faim','Faim',oldFaim,self.pet.faim);Renderer.update(self.pet);
            });
            Storage.save(this.pet);
        }else Renderer.toast(r.msg);
    },

    // ═══ JOUER — panel with mini-jeu + lecture + sudoku ═══
    openPlay:function(){if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;var c=Engine.canDo(this.pet,'jouer');if(!c.ok){Renderer.toast(c.msg);return;}document.getElementById('play-screen').classList.remove('hidden');},
    doPlay:function(){
        document.getElementById('play-screen').classList.add('hidden');
        var self=this;var oldJeu=this.pet.jeu||0;
        Minigames.startPlay(function(b){
            Engine.play(self.pet,b);Renderer.petHappyAnimation();Storage.save(self.pet);
            setTimeout(function(){Renderer.animateGauge('jeu','Jeu',oldJeu,self.pet.jeu||0);Renderer.update(self.pet);},1500);
        });
    },
    doStudy:function(){
        document.getElementById('play-screen').classList.add('hidden');
        var c=Engine.canDo(this.pet,'intellect');if(!c.ok){Renderer.toast(c.msg);return;}
        var self=this;var oldJeu=this.pet.jeu||0;
        // Set cooldown now but apply gauge gain at END of countdown
        Engine.setCooldown(this.pet,'intellect');
        Renderer.showStudyAnimation(function(){
            var before=self.pet.jeu||0;
            self.pet.intellect=Engine.cl(self.pet.intellect+20);
            self.pet.jeu=Engine.cl((self.pet.jeu||0)+20);
            self.pet.experience+=10;self.pet.coins+=2;
            Renderer.animateGauge('jeu','Jeu',before,self.pet.jeu);
            Renderer.update(self.pet);Storage.save(self.pet);
        });
        Storage.save(this.pet);
    },
    doStudySudoku:function(){
        document.getElementById('play-screen').classList.add('hidden');
        var self=this;
        Minigames.startSudoku(function(b){Engine.studyGame(self.pet,b);Storage.save(self.pet);
            setTimeout(function(){Renderer.showGaugeResult('Intellect',self.pet.intellect||30);Renderer.update(self.pet);},1500);
        });
    },

    // ═══ DORMIR ═══
    doSleep:function(){
        if(!this.pet||this.pet.estMort)return;
        var wasSleeping=this.pet.isSleeping;
        var r=Engine.sleep(this.pet);Renderer.toast(r.msg);
        Storage.save(this.pet);Renderer.update(this.pet);
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
            Renderer.update(self.pet);Storage.save(self.pet);
        });
        Storage.save(this.pet);
    },

    // ═══ TOILETTE — +20%, gauge result ═══
    doToilet:function(){
        if(!this.pet)return;document.getElementById('care-screen').classList.add('hidden');
        if((this.pet.poops||0)<=0&&(this.pet.pipis||0)<=0){Renderer.toast('Rien à nettoyer !');return;}
        var self=this;var oldHyg2=this.pet.hygiene||50;
        Renderer.showBigBroom(function(){
            self.pet.poops=0;self.pet.pipis=0;
            self.pet.hygiene=Engine.cl(self.pet.hygiene+20);
            Renderer.animateGauge('hygiene','Hygiène',oldHyg2,self.pet.hygiene);
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
            Renderer.showHenVisit(r.henSprite,Engine.STAGES[this.pet.stade].size,function(){
                clearInterval(self._visitTimer);
                Renderer.animateGauge('amour','Amour',oldAmour,self.pet.amour||30);
                Renderer.update(self.pet);Storage.save(self.pet);
            });
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
