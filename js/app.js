var App={
    pet:null,gameLoop:null,moveLoop:null,saveInterval:null,speechInterval:null,sleepZInterval:null,
    farmWalkLoop:null,bgMusic:null,soundOn:false,paused:false,
    touchStartX:0,touchStartY:0,isSwiping:false,

    init:function(){
        console.log('App.init');
        Storage.init();Renderer.init();
        this.loadPrefs();this.showSplash();this.bindEvents();
    },

    // ═══ SAVE/LOAD — pure synchronous localStorage ═══
    savePet:function(){
        if(!this.pet)return;
        try{
            Storage.save(this.pet);
            var resumeBtn=document.getElementById('btn-resume');
            if(resumeBtn)resumeBtn.classList.remove('hidden');
        }catch(e){console.warn('Save failed',e);}
    },
    loadPet:function(){
        try{return Storage._loadLocal();}catch(e){return null;}
    },

    showSplash:function(){
        var data=this.loadPet();
        var resumeBtn=document.getElementById('btn-resume');
        if(data&&!data.estMort){
            resumeBtn.classList.remove('hidden');
            console.log('Save found, resume available');
        }else{
            resumeBtn.classList.add('hidden');
            console.log('No save found');
        }
        if(Engine.isWalletConnected()){
            var h=document.getElementById('holder-amount');if(h)h.textContent='✅ CONNECTÉ';
        }
    },

    loadPrefs:function(){try{var p=JSON.parse(localStorage.getItem('francis_prefs')||'{}');this.soundOn=!!p.sound;}catch(e){}},
    savePrefs:function(){try{localStorage.setItem('francis_prefs',JSON.stringify({sound:this.soundOn}));}catch(e){}},

    bindEvents:function(){
        var self=this;

        // ═══ SPLASH ═══
        document.getElementById('btn-resume').addEventListener('click',function(){
            console.log('Resume clicked');
            var data=self.loadPet();
            if(data){
                self.pet=data;
                Engine.migrate(self.pet);
                Engine.updateStats(self.pet);
                self.showGame();
                Renderer.toast('▶ Partie reprise !');
            }else{
                Renderer.toast('❌ Pas de sauvegarde');
            }
        });

        document.getElementById('btn-new-game').addEventListener('click',function(){
            console.log('New game clicked');
            self.newGame();
        });

        // ═══ CHEATS ═══
        var cheatInput=document.getElementById('cheat-input');
        if(cheatInput){
            cheatInput.addEventListener('keyup',function(e){
                if(e.key==='Enter'){
                    var code=cheatInput.value.trim().toUpperCase();
                    cheatInput.value='';
                    if(!code)return;
                    console.log('Cheat code: '+code);
                    // Create pet if needed
                    if(!self.pet){self.pet=Engine.createPet('Francis');self.savePet();}
                    var r=Engine.applyCheat(self.pet,code);
                    console.log('Cheat result:',r);
                    Renderer.toast(r.msg);
                    if(r.ok){
                        self.savePet();
                        if(document.getElementById('game-screen').classList.contains('active')){
                            Renderer.update(self.pet);
                        }
                    }
                }
            });
        }

        // Wallet
        var holder=document.getElementById('splash-holder');
        if(holder)holder.addEventListener('click',function(){self.connectWallet();});
        document.getElementById('btn-wallet-game').addEventListener('click',function(){self.connectWallet();document.getElementById('more-screen').classList.add('hidden');});
        document.getElementById('btn-wallet-gate').addEventListener('click',function(){self.connectWallet();document.getElementById('wallet-gate').classList.add('hidden');});
        document.getElementById('btn-wallet-skip').addEventListener('click',function(){document.getElementById('wallet-gate').classList.add('hidden');self.newGame();});

        // ═══ GAME BUTTONS ═══
        document.getElementById('btn-nourrir').addEventListener('click',function(){self.openFood();});
        document.getElementById('btn-jouer').addEventListener('click',function(){self.doPlay();});
        document.getElementById('btn-dormir').addEventListener('click',function(){self.doSleep();});
        document.getElementById('btn-visite').addEventListener('click',function(){self.doVisit();});
        document.getElementById('btn-soigner').addEventListener('click',function(){document.getElementById('care-screen').classList.remove('hidden');});
        document.getElementById('btn-stats').addEventListener('click',function(){self.openStats();});
        document.getElementById('btn-housing').addEventListener('click',function(){self.openHousing();});
        document.getElementById('btn-sound').addEventListener('click',function(){self.soundOn=!self.soundOn;document.getElementById('sound-icon').textContent=self.soundOn?'🔊':'🔇';self.savePrefs();});
        document.getElementById('btn-pause').addEventListener('click',function(){self.paused=!self.paused;document.getElementById('pause-icon').textContent=self.paused?'▶️':'⏸️';Renderer.toast(self.paused?'⏸️ Pause':'▶️ Repris');});
        document.getElementById('btn-nav-more').addEventListener('click',function(){document.getElementById('more-screen').classList.remove('hidden');});
        document.getElementById('btn-heal-direct').addEventListener('click',function(){self.doHeal();});
        document.getElementById('btn-toilette').addEventListener('click',function(){self.doToilet();});
        document.getElementById('btn-douche').addEventListener('click',function(){self.doShower();});
        document.getElementById('btn-intellect').addEventListener('click',function(){self.openIntellect();});
        document.getElementById('btn-enclos-badge').addEventListener('click',function(e){e.stopPropagation();self.openFarm();});
        document.getElementById('btn-notif').addEventListener('click',function(){Renderer.toast('🔔');});
        document.getElementById('btn-evo-ok').addEventListener('click',function(){Renderer.hideEvolution();});
        document.getElementById('btn-restart').addEventListener('click',function(){Renderer.hideDeath();self.newGame();});
        document.getElementById('btn-study-auto').addEventListener('click',function(){self.doStudyAuto();});
        document.getElementById('btn-study-sudoku').addEventListener('click',function(){self.doStudySudoku();});
        document.getElementById('food-grid').addEventListener('click',function(e){var item=e.target.closest('[data-food]');if(item)self.doFeed(item.dataset.food);});
        document.getElementById('btn-reset').addEventListener('click',function(){document.getElementById('more-screen').classList.add('hidden');if(confirm('Reset?')){try{localStorage.removeItem('francis_save');}catch(e){}self.pet=null;document.getElementById('game-screen').classList.remove('active');document.getElementById('splash-screen').classList.add('active');self.showSplash();}});

        // ═══ TOUCH ═══
        var touch=document.getElementById('scene-touch');
        touch.addEventListener('touchstart',function(e){self.touchStartX=e.touches[0].clientX;self.touchStartY=e.touches[0].clientY;self.isSwiping=false;},{passive:true});
        touch.addEventListener('touchmove',function(e){if(Math.abs(e.touches[0].clientX-self.touchStartX)>12||Math.abs(e.touches[0].clientY-self.touchStartY)>12)self.isSwiping=true;},{passive:true});
        touch.addEventListener('touchend',function(e){
            if(!self.pet||self.pet.estMort||self.paused)return;
            var cx=e.changedTouches[0].clientX,cy=e.changedTouches[0].clientY;
            if(self.isSwiping&&self._nearPet(self.touchStartX,self.touchStartY)){
                Engine.caress(self.pet);Renderer.showHeartAt(cx,cy-20);Renderer.toast('💕');Renderer.update(self.pet);self.savePet();
            }else if(!self.isSwiping&&self._nearPet(cx,cy)){
                Engine.petClick(self.pet);Renderer.showCoinAt(cx-10,cy-20);Renderer.update(self.pet);self.savePet();
            }
        });

        // Close buttons
        document.querySelectorAll('[data-close]').forEach(function(btn){
            btn.addEventListener('click',function(){
                var id=btn.getAttribute('data-close');
                if(id==='farm-screen'){Farm.close();clearInterval(self.farmWalkLoop);}
                document.getElementById(id).classList.add('hidden');
            });
        });
    },

    _nearPet:function(cx,cy){
        var pw=document.getElementById('pet-wrapper');if(!pw)return false;
        var r=pw.getBoundingClientRect(),m=40;
        return cx>r.left-m&&cx<r.right+m&&cy>r.top-m&&cy<r.bottom+m;
    },

    connectWallet:function(){Engine.connectWallet();var h=document.getElementById('holder-amount');if(h)h.textContent='✅ CONNECTÉ';Renderer.toast('✅ Wallet connecté !');},

    newGame:function(){
        this.pet=Engine.createPet('Francis');
        this.savePet();
        this.showGame();
        Renderer.toast('🥚 Francis est né !');
    },

    showGame:function(){
        document.getElementById('splash-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        this.savePet(); // Ensure save exists for resume
        var self=this;
        // Use rAF to let layout happen, then init weather + render
        requestAnimationFrame(function(){
            requestAnimationFrame(function(){
                Renderer.update(self.pet);
                Weather.init();
                self.startLoops();
                console.log('Game started, weather initialized');
            });
        });
    },

    startLoops:function(){
        this.stopLoops();var self=this;
        this.gameLoop=setInterval(function(){self.gameTick();},5000);
        this.moveLoop=setInterval(function(){if(self.pet&&!self.pet.estMort&&!self.paused)Renderer.tickMovement(self.pet);},50);
        this.saveInterval=setInterval(function(){self.savePet();},60000);
        this.speechInterval=setInterval(function(){if(self.pet&&!self.pet.estMort&&!self.pet.isSleeping&&!self.paused&&Math.random()<.3)Renderer.showSpeech(Engine.getDialogue(self.pet));},15000);
        this.sleepZInterval=setInterval(function(){if(self.pet&&self.pet.isSleeping&&!self.paused)Renderer.showSleepZ();},1500);
    },
    stopLoops:function(){clearInterval(this.gameLoop);clearInterval(this.moveLoop);clearInterval(this.saveInterval);clearInterval(this.speechInterval);clearInterval(this.sleepZInterval);},

    gameTick:function(){
        if(!this.pet||this.pet.estMort||this.paused)return;
        Engine.updateStats(this.pet);Renderer.update(this.pet);this.updateCooldowns();
        if(Engine.needsWalletGate(this.pet)){document.getElementById('wallet-gate').classList.remove('hidden');return;}
        if(this.pet.farm&&this.pet.farm.hens>0)Farm.update(this.pet);
        if(Engine.checkEvolution(this.pet)){var old=Engine.STAGES[this.pet.stade];Engine.evolve(this.pet);Renderer.showEvolution(old,Engine.STAGES[this.pet.stade]);this.savePet();}
        if(this.pet.estMort){Renderer.showDeath(this.pet);this.savePet();}
    },

    updateCooldowns:function(){
        var now=Date.now(),actions=['nourrir','jouer','dormir','soigner','visite'];
        for(var i=0;i<actions.length;i++){var a=actions[i],btn=document.getElementById('btn-'+a);if(!btn)continue;
        if(a==='dormir'&&this.pet&&this.pet.isSleeping)continue;
        var cd=(this.pet.cooldowns&&this.pet.cooldowns[a])||0;
        if(now<cd){btn.classList.add('on-cooldown');var secs=Math.ceil((cd-now)/1000);var t=btn.querySelector('.cooldown-timer');if(!t){t=document.createElement('span');t.className='cooldown-timer';btn.appendChild(t);}t.textContent=Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0');}
        else{btn.classList.remove('on-cooldown');var t2=btn.querySelector('.cooldown-timer');if(t2)t2.remove();}}
    },

    openFood:function(){if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;var c=Engine.canDo(this.pet,'nourrir');if(!c.ok){Renderer.toast(c.msg);return;}document.getElementById('food-grid').innerHTML=Renderer.renderFoodGrid();document.getElementById('food-screen').classList.remove('hidden');},
    doFeed:function(foodId){var r=Engine.feed(this.pet,foodId);document.getElementById('food-screen').classList.add('hidden');if(r.ok){Renderer.toast(r.msg);Renderer.petEatAnimation();this.savePet();}else Renderer.toast(r.msg);Renderer.update(this.pet);},
    doPlay:function(){if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;var c=Engine.canDo(this.pet,'jouer');if(!c.ok){Renderer.toast(c.msg);return;}var self=this;Minigames.startPlay(function(bonus){Engine.play(self.pet,bonus);Renderer.toast('🎮 +'+bonus);Renderer.petHappyAnimation();self.savePet();Renderer.update(self.pet);});},
    doSleep:function(){if(!this.pet||this.pet.estMort)return;var r=Engine.sleep(this.pet);Renderer.toast(r.msg);this.savePet();Renderer.update(this.pet);},
    doHeal:function(){if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;document.getElementById('care-screen').classList.add('hidden');var r=Engine.heal(this.pet);Renderer.toast(r.msg);if(r.ok){Renderer.showBigSyringe();this.savePet();}Renderer.update(this.pet);},
    doToilet:function(){if(!this.pet)return;document.getElementById('care-screen').classList.add('hidden');var r=Engine.toilet(this.pet);Renderer.toast(r.msg);if(r.ok){Renderer.showBigBroom();this.savePet();}Renderer.update(this.pet);},
    doShower:function(){if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;document.getElementById('care-screen').classList.add('hidden');var r=Engine.shower(this.pet);Renderer.toast(r.msg);if(r.ok){Renderer.showHeavyShower();Renderer.petHappyAnimation();this.savePet();}Renderer.update(this.pet);},
    doVisit:function(){if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;var r=Engine.visit(this.pet);Renderer.toast(r.msg);if(r.ok){Renderer.showHenVisit(r.henSprite,Engine.STAGES[this.pet.stade].size);Renderer.petHappyAnimation();this.savePet();}Renderer.update(this.pet);},
    openIntellect:function(){if(!this.pet||this.pet.estMort||this.pet.isSleeping)return;document.getElementById('care-screen').classList.add('hidden');document.getElementById('intellect-screen').classList.remove('hidden');},
    doStudyAuto:function(){document.getElementById('intellect-screen').classList.add('hidden');var r=Engine.studyAuto(this.pet);Renderer.toast(r.msg);this.savePet();Renderer.update(this.pet);},
    doStudySudoku:function(){document.getElementById('intellect-screen').classList.add('hidden');var self=this;Minigames.startSudoku(function(b){Engine.studyGame(self.pet,b);Renderer.toast('🧠');self.savePet();Renderer.update(self.pet);});},
    openStats:function(){if(!this.pet)return;document.getElementById('stats-detail').innerHTML=Renderer.renderStatsDetail(this.pet);document.getElementById('stats-screen').classList.remove('hidden');},
    openHousing:function(){
        if(!this.pet)return;var list=document.getElementById('housing-list');list.innerHTML='';var self=this;
        for(var i=0;i<Engine.HOUSING.length;i++){var h=Engine.HOUSING[i],isCur=i===this.pet.housingLevel,isNext=i===this.pet.housingLevel+1;
        var cls='housing-item'+(isCur?' current':'')+(i>this.pet.housingLevel+1?' locked':'');
        list.innerHTML+='<div class="'+cls+'" data-housing="'+i+'"><span class="housing-emoji">'+h.emoji+'</span><div class="housing-info"><div class="housing-name">'+h.nom+'</div><div class="housing-cost">'+(h.cost||'Gratuit')+'</div></div></div>';}
        list.querySelectorAll('[data-housing]').forEach(function(el){el.addEventListener('click',function(){var idx=+el.dataset.housing;if(idx===self.pet.housingLevel+1){var r=Engine.upgradeHousing(self.pet);Renderer.toast(r.msg);if(r.ok){Weather.lastBuildingState=null;self.savePet();Renderer.update(self.pet);self.openHousing();}}});});
        document.getElementById('housing-screen').classList.remove('hidden');
    },
    openFarm:function(){if(!this.pet)return;Farm.open(this.pet);this.bindFarmButtons();clearInterval(this.farmWalkLoop);var self=this,el=document.getElementById('farm-francis'),img=document.getElementById('farm-francis-img');if(el&&img&&this.pet){img.src=Engine.STAGES[this.pet.stade].sprite;var x=15;this.farmWalkLoop=setInterval(function(){x+=(Math.random()-.48)*0.4;x=Math.max(5,Math.min(85,x));el.style.left=x+'%';},50);}},
    bindFarmButtons:function(){
        var self=this;
        ['btn-farm-buy','btn-farm-feed','btn-farm-clean'].forEach(function(id){
            var old=document.getElementById(id);if(!old)return;
            var nw=old.cloneNode(true);old.parentNode.replaceChild(nw,old);
        });
        document.getElementById('btn-farm-buy').addEventListener('click',function(){var r=Farm.buyHen(self.pet);Renderer.toast(r.msg);if(r.ok){Farm.addHenToScene();Farm.renderUI(self.pet);self.savePet();Renderer.update(self.pet);}});
        document.getElementById('btn-farm-feed').addEventListener('click',function(){var r=Farm.feedEnclosure(self.pet);Renderer.toast(r.msg);if(r.ok)Farm.renderUI(self.pet);self.savePet();});
        document.getElementById('btn-farm-clean').addEventListener('click',function(){var r=Farm.cleanEnclosure(self.pet);Renderer.toast(r.msg);if(r.ok)Farm.renderUI(self.pet);self.savePet();});
    }
};
document.addEventListener('DOMContentLoaded',function(){App.init();});
