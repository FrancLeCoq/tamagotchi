var App = {
    pet:null, gameLoop:null, moveLoop:null, saveInterval:null,
    speechInterval:null, sleepZInterval:null,
    bgMusic:null, soundOn:false, paused:false, notificationsOn:true,
    lastNotif:0, NOTIF_INTERVAL:300000,

    init:function(){
        Storage.init(); Renderer.init();
        this.bindEvents(); this.initTelegram(); this.initSound(); this.loadPrefs();
        var self=this;
        Storage.load(function(data){
            if(data&&!data.estMort){self.pet=data;Engine.updateStats(self.pet);self.showGame();}
            else document.getElementById('splash-screen').classList.add('active');
        });
    },
    initTelegram:function(){try{var tg=window.Telegram&&window.Telegram.WebApp;if(tg){tg.ready();tg.expand();tg.enableClosingConfirmation();}}catch(e){}},
    initSound:function(){this.bgMusic=new Audio('assets/sounds/ferme.mp3');this.bgMusic.loop=true;this.bgMusic.volume=0.3;},
    toggleSound:function(){
        this.soundOn=!this.soundOn;
        document.getElementById('sound-icon').textContent=this.soundOn?'🔊':'🔇';
        if(this.soundOn) this.bgMusic.play().catch(function(){});else this.bgMusic.pause();
        this.savePrefs();
    },
    loadPrefs:function(){
        try{var p=JSON.parse(localStorage.getItem('francis_prefs')||'{}');
        this.notificationsOn=p.notif!==false;this.soundOn=!!p.sound;}catch(e){}
    },
    savePrefs:function(){try{localStorage.setItem('francis_prefs',JSON.stringify({notif:this.notificationsOn,sound:this.soundOn}));}catch(e){}},
    toggleNotifications:function(){
        this.notificationsOn=!this.notificationsOn;
        document.getElementById('notif-icon').textContent=this.notificationsOn?'🔔':'🔕';
        Renderer.toast(this.notificationsOn?'🔔 Notifications on':'🔕 Notifications off');
        this.savePrefs();
    },
    togglePause:function(){
        this.paused=!this.paused;
        document.getElementById('pause-icon').textContent=this.paused?'▶️':'⏸️';
        if(this.paused){this.stopLoops();Renderer.toast('⏸️ Pause');}
        else{if(this.pet)Engine.updateStats(this.pet);this.startLoops();Renderer.toast('▶️ Repris !');}
    },
    resetGame:function(){
        if(confirm('⚠️ Remettre à zéro ? Tout sera perdu !')){
            Storage.clear();try{localStorage.removeItem('francis_prefs');}catch(e){}
            this.pet=null;this.stopLoops();
            document.getElementById('game-screen').classList.remove('active');
            document.getElementById('splash-screen').classList.add('active');
            Renderer.toast('🗑️ Reset !');
        }
    },

    bindEvents:function(){
        var self=this;
        document.getElementById('btn-start-game').addEventListener('click',function(){self.newGame();});
        // Action row
        document.getElementById('btn-nourrir').addEventListener('click',function(){self.openFood();});
        document.getElementById('btn-jouer').addEventListener('click',function(){self.doPlay();});
        document.getElementById('btn-dormir').addEventListener('click',function(){self.doSleep();});
        document.getElementById('btn-visite').addEventListener('click',function(){self.doVisit();});
        document.getElementById('btn-soigner').addEventListener('click',function(){self.doHeal();});
        // Bottom nav
        document.getElementById('btn-nav-home').addEventListener('click',function(){self.closeAllOverlays();});
        document.getElementById('btn-stats').addEventListener('click',function(){self.openStats();});
        document.getElementById('btn-nav-care').addEventListener('click',function(){self.openCare();});
        document.getElementById('btn-housing').addEventListener('click',function(){self.openHousing();});
        document.getElementById('btn-nav-more').addEventListener('click',function(){self.openMore();});
        // Care sub-buttons
        document.getElementById('btn-toilette').addEventListener('click',function(){self.doToilet();});
        document.getElementById('btn-douche').addEventListener('click',function(){self.doShower();});
        document.getElementById('btn-intellect').addEventListener('click',function(){self.openIntellect();});
        document.getElementById('btn-farm').addEventListener('click',function(){self.openFarm();});
        // More sub-buttons
        document.getElementById('btn-sound').addEventListener('click',function(){self.toggleSound();});
        document.getElementById('btn-pause').addEventListener('click',function(){self.togglePause();});
        document.getElementById('btn-reset').addEventListener('click',function(){self.resetGame();});
        // Notif bell
        document.getElementById('btn-notif').addEventListener('click',function(){self.toggleNotifications();});
        // Evo/death
        document.getElementById('btn-evo-ok').addEventListener('click',function(){Renderer.hideEvolution();});
        document.getElementById('btn-restart').addEventListener('click',function(){Renderer.hideDeath();self.newGame();});
        // Intellect
        document.getElementById('btn-study-auto').addEventListener('click',function(){self.doStudyAuto();});
        document.getElementById('btn-study-sudoku').addEventListener('click',function(){self.doStudySudoku();});
        // Scene touch
        document.getElementById('scene-touch').addEventListener('click',function(e){self.doPetClick(e);});
        // Food grid
        document.getElementById('food-grid').addEventListener('click',function(e){
            var item=e.target.closest('[data-food]');if(item) self.doFeed(item.dataset.food);
        });
        // Close buttons
        var cb=document.querySelectorAll('[data-close]');
        for(var i=0;i<cb.length;i++){(function(btn){btn.addEventListener('click',function(){
            var t=btn.getAttribute('data-close');
            if(t==='farm-screen') Farm.close();
            document.getElementById(t).classList.add('hidden');
        });})(cb[i]);}
    },

    closeAllOverlays:function(){
        var overlays=['care-screen','more-screen','food-screen','stats-screen','minigame-screen','intellect-screen','housing-screen','farm-screen'];
        for(var i=0;i<overlays.length;i++) document.getElementById(overlays[i]).classList.add('hidden');
        Farm.close();
    },

    newGame:function(){
        this.pet=Engine.createPet('Francis');Storage.save(this.pet);this.showGame();
        Renderer.toast('🥚 Francis est né !');Renderer.showEmotion('🐣',2000);
    },
    showGame:function(){
        document.getElementById('splash-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        Renderer.update(this.pet);Weather.init();this.startLoops();
        if(this.pet.estMort){var self=this;setTimeout(function(){Renderer.showDeath(self.pet);},500);}
    },
    startLoops:function(){
        this.stopLoops();var self=this;
        this.gameLoop=setInterval(function(){self.gameTick();},5000);
        this.moveLoop=setInterval(function(){if(self.pet&&!self.pet.estMort&&!self.paused)Renderer.tickMovement(self.pet);},50);
        this.saveInterval=setInterval(function(){if(self.pet)Storage.save(self.pet);},30000);
        this.speechInterval=setInterval(function(){
            if(self.pet&&!self.pet.estMort&&!self.pet.isSleeping&&!self.paused&&Math.random()<0.3)
                Renderer.showSpeech(Engine.getDialogue(self.pet));
        },15000);
        this.sleepZInterval=setInterval(function(){if(self.pet&&self.pet.isSleeping&&!self.paused)Renderer.showSleepZ();},1500);
    },
    stopLoops:function(){clearInterval(this.gameLoop);clearInterval(this.moveLoop);clearInterval(this.saveInterval);clearInterval(this.speechInterval);clearInterval(this.sleepZInterval);},

    gameTick:function(){
        if(!this.pet||this.pet.estMort||this.paused) return;
        Engine.updateStats(this.pet);Renderer.update(this.pet);this.updateCooldowns();
        if(this.pet.farm&&this.pet.farm.hens>0){
            Farm.update(this.pet);
            if(this.pet.farm.deadRecent>0&&!Farm.isOpen) Renderer.toast('💀 -'+this.pet.farm.deadRecent+' poule(s) !');
            if(Farm.isOpen) Farm.renderUI(this.pet);
        }
        if(Engine.checkEvolution(this.pet)){
            var old=Engine.STAGES[this.pet.stade];Engine.evolve(this.pet);
            Renderer.showEvolution(old,Engine.STAGES[this.pet.stade]);Storage.save(this.pet);
        }
        if(this.pet.estMort){Renderer.showDeath(this.pet);Storage.save(this.pet);}
        this.checkNotifications();
    },

    checkNotifications:function(){
        if(!this.notificationsOn||!this.pet) return;
        var now=Date.now();if(now-this.lastNotif<this.NOTIF_INTERVAL) return;
        var alerts=[];
        if(this.pet.faim<25) alerts.push('🌾 Francis a faim !');
        if(this.pet.bonheur<25) alerts.push('😢 Francis est triste');
        if(this.pet.sante<25) alerts.push('🤒 Francis est malade');
        if(this.pet.hygiene<25) alerts.push('🧼 Francis est sale');
        if(this.pet.amour<20) alerts.push('💔 Francis se sent seul');
        if(alerts.length>0){Renderer.toast(alerts[0]);this.lastNotif=now;
        try{if(window.Notification&&Notification.permission==='granted')new Notification('🐓 Francis',{body:alerts.join('\n'),icon:'assets/sprites/francis.png'});
        else if(window.Notification&&Notification.permission!=='denied')Notification.requestPermission();}catch(e){}}
    },

    updateCooldowns:function(){
        var now=Date.now();
        var actions=['nourrir','jouer','dormir','soigner','visite'];
        for(var i=0;i<actions.length;i++){
            var a=actions[i],btn=document.getElementById('btn-'+a);if(!btn) continue;
            var cd=(this.pet.cooldowns&&this.pet.cooldowns[a])||0;
            if(now<cd){btn.classList.add('on-cooldown');
                var secs=Math.ceil((cd-now)/1000),mn=Math.floor(secs/60),s=secs%60;
                var t=btn.querySelector('.cooldown-timer');
                if(!t){t=document.createElement('span');t.className='cooldown-timer';btn.appendChild(t);}
                t.textContent=mn+':'+String(s).padStart(2,'0');
            } else {btn.classList.remove('on-cooldown');var t2=btn.querySelector('.cooldown-timer');if(t2)t2.remove();}
        }
    },

    // ─── Actions ───────────────────────────────────
    doPetClick:function(e){
        if(!this.pet||this.pet.estMort||this.paused) return;
        Engine.petClick(this.pet);Renderer.showCoinAt(e.clientX-10,e.clientY-20);
        Engine.caress(this.pet);Renderer.showHeartAt(e.clientX+10,e.clientY-10);
        Renderer.update(this.pet);Storage.save(this.pet);
    },
    openFood:function(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping){Renderer.toast('💤');return;}
        var c=Engine.canDo(this.pet,'nourrir');if(!c.ok){Renderer.toast(c.msg);return;}
        document.getElementById('food-grid').innerHTML=Renderer.renderFoodGrid();
        document.getElementById('food-screen').classList.remove('hidden');
    },
    doFeed:function(foodId){
        var r=Engine.feed(this.pet,foodId);document.getElementById('food-screen').classList.add('hidden');
        if(r.ok){Renderer.toast(r.msg);Renderer.petEatAnimation();Renderer.showFloatingItem(r.food.emoji,50,50);Renderer.haptic('light');Storage.save(this.pet);}
        else Renderer.toast(r.msg);Renderer.update(this.pet);
    },
    doPlay:function(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping) return;
        var c=Engine.canDo(this.pet,'jouer');if(!c.ok){Renderer.toast(c.msg);return;}
        var self=this;
        Minigames.startPlay(function(bonus){
            var r=Engine.play(self.pet,bonus);
            if(r.ok){Renderer.toast('🎮 +'+bonus);Renderer.petHappyAnimation();Renderer.showEmotion('🎉');Storage.save(self.pet);}
            Renderer.update(self.pet);
        });
    },
    doSleep:function(){
        if(!this.pet||this.pet.estMort) return;
        var r=Engine.sleep(this.pet);Renderer.toast(r.msg);
        if(r.ok){Renderer.haptic('light');Renderer.showEmotion(this.pet.isSleeping?'😴':'☀️');Storage.save(this.pet);}
        Renderer.update(this.pet);
    },
    doHeal:function(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping) return;
        var r=Engine.heal(this.pet);Renderer.toast(r.msg);
        if(r.ok){Renderer.showFloatingItem(r.emoji,50,40);Renderer.showEmotion(r.isInjection?'😖':'😬');Renderer.haptic(r.isInjection?'heavy':'light');Storage.save(this.pet);}
        Renderer.update(this.pet);
    },
    doToilet:function(){
        if(!this.pet) return;document.getElementById('care-screen').classList.add('hidden');
        var r=Engine.toilet(this.pet);Renderer.toast(r.msg);
        if(r.ok){Renderer.showEmotion('✨');Renderer.haptic('light');Storage.save(this.pet);}
        Renderer.update(this.pet);
    },
    doShower:function(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping) return;
        document.getElementById('care-screen').classList.add('hidden');
        var r=Engine.shower(this.pet);Renderer.toast(r.msg);
        if(r.ok){Renderer.showShowerAnimation();Renderer.showEmotion('🧼');Renderer.petHappyAnimation();Renderer.haptic('medium');Storage.save(this.pet);}
        Renderer.update(this.pet);
    },
    doVisit:function(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping) return;
        var r=Engine.visit(this.pet);Renderer.toast(r.msg);
        if(r.ok){Renderer.showHenVisit(r.henSprite,Engine.STAGES[this.pet.stade].size);
        Renderer.showEmotion('💕');Renderer.petHappyAnimation();Renderer.haptic('medium');Storage.save(this.pet);}
        Renderer.update(this.pet);
    },
    openIntellect:function(){
        if(!this.pet||this.pet.estMort||this.pet.isSleeping) return;
        document.getElementById('care-screen').classList.add('hidden');
        var c=Engine.canDo(this.pet,'intellect');if(!c.ok){Renderer.toast(c.msg);return;}
        document.getElementById('intellect-screen').classList.remove('hidden');
    },
    doStudyAuto:function(){
        document.getElementById('intellect-screen').classList.add('hidden');
        var r=Engine.studyAuto(this.pet);Renderer.toast(r.msg);
        if(r.ok){Renderer.showEmotion('📖');Renderer.showFloatingItem('📖',50,40);Storage.save(this.pet);}
        Renderer.update(this.pet);
    },
    doStudySudoku:function(){
        document.getElementById('intellect-screen').classList.add('hidden');
        var self=this;
        Minigames.startSudoku(function(bonus){
            var r=Engine.studyGame(self.pet,bonus);
            if(r.ok){Renderer.toast(r.msg);Renderer.showEmotion('🧠');Storage.save(self.pet);}
            Renderer.update(self.pet);
        });
    },
    openCare:function(){document.getElementById('care-screen').classList.remove('hidden');},
    openMore:function(){document.getElementById('more-screen').classList.remove('hidden');},
    openStats:function(){
        if(!this.pet) return;
        document.getElementById('stats-detail').innerHTML=Renderer.renderStatsDetail(this.pet);
        document.getElementById('stats-screen').classList.remove('hidden');
    },
    openHousing:function(){
        if(!this.pet) return;var list=document.getElementById('housing-list');list.innerHTML='';var self=this;
        for(var i=0;i<Engine.HOUSING.length;i++){
            var h=Engine.HOUSING[i],isCur=i===this.pet.housingLevel,isNext=i===this.pet.housingLevel+1,isLock=i>this.pet.housingLevel+1;
            var cls='housing-item';if(isCur)cls+=' current';if(isLock)cls+=' locked';
            var cost=h.cost===0?'Gratuit':h.cost+' 🪙';
            var status=isCur?'✅ Actuel':isNext?(this.pet.coins>=h.cost?'Acheter':'Fonds insuffisants'):(isLock?'🔒':'');
            list.innerHTML+='<div class="'+cls+'" data-housing="'+i+'"><span class="housing-emoji">'+h.emoji+'</span><div class="housing-info"><div class="housing-name">'+h.nom+'</div><div class="housing-cost">'+cost+' · '+status+'</div></div></div>';
        }
        var items=list.querySelectorAll('[data-housing]');
        for(var j=0;j<items.length;j++){(function(el){el.addEventListener('click',function(){
            var idx=parseInt(el.getAttribute('data-housing'));
            if(idx===self.pet.housingLevel+1){var r=Engine.upgradeHousing(self.pet);Renderer.toast(r.msg);
            if(r.ok){Renderer.showEmotion('🏠');Renderer.haptic('heavy');Weather.lastBgState=null;Storage.save(self.pet);Renderer.update(self.pet);self.openHousing();}}
        });})(items[j]);}
        document.getElementById('housing-screen').classList.remove('hidden');
    },
    openFarm:function(){
        if(!this.pet) return;
        document.getElementById('care-screen').classList.add('hidden');
        Farm.open(this.pet);this.bindFarmButtons();
    },
    bindFarmButtons:function(){
        var self=this;
        var bb=document.getElementById('btn-farm-buy'),bf=document.getElementById('btn-farm-feed'),bc=document.getElementById('btn-farm-clean');
        var nb=bb.cloneNode(true);bb.parentNode.replaceChild(nb,bb);
        var nf=bf.cloneNode(true);bf.parentNode.replaceChild(nf,bf);
        var nc=bc.cloneNode(true);bc.parentNode.replaceChild(nc,bc);
        nb.addEventListener('click',function(){var r=Farm.buyHen(self.pet);Renderer.toast(r.msg);if(r.ok){Farm.addHenToScene();Renderer.haptic('light');Farm.renderUI(self.pet);Storage.save(self.pet);Renderer.update(self.pet);}});
        nf.addEventListener('click',function(){var r=Farm.feedEnclosure(self.pet);Renderer.toast(r.msg);if(r.ok){Farm.renderUI(self.pet);Storage.save(self.pet);}});
        nc.addEventListener('click',function(){var r=Farm.cleanEnclosure(self.pet);Renderer.toast(r.msg);if(r.ok){Farm.renderUI(self.pet);Storage.save(self.pet);}});
    }
};
document.addEventListener('DOMContentLoaded',function(){App.init();});
