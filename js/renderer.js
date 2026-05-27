var Renderer={
    els:{},walkDir:1,walkTarget:50,currentPetX:50,
    _lastMood:null,_lastSprite:'',_lastStade:-1,_curAnim:'idle',_curFlip:false,
    _actionLock:false,
    // Spritesheet config for poussin walking
    _sheet:{active:false,el:null,frame:0,total:16,cols:4,rows:4,iv:null},

    ANIMS:{
        idle:'spriteIdle 2.5s ease-in-out infinite',
        walking:'spriteWalk .4s ease-in-out infinite',
        eating:'spriteEat .5s ease-in-out infinite',
        sleeping:'spriteSleep 2s ease-in-out infinite',
        happy:'spriteHappy .3s ease-in-out 3',
        sad:'spriteSad 1.5s ease-in-out infinite',
        sick:'spriteSick 1s ease-in-out infinite'
    },

    init:function(){
        var g=function(id){return document.getElementById(id)};
        this.els={pet:g('pet'),petSprite:g('pet-sprite'),petWrapper:g('pet-wrapper'),scene:g('scene'),sceneItems:g('scene-items'),poopContainer:g('poop-container'),emotionBubble:g('emotion-bubble'),emotionIcon:g('emotion-icon'),speechBubble:g('speech-bubble'),speechText:g('speech-text'),moodEmoji:g('mood-emoji')};
        var style=document.createElement('style');
        style.textContent='@keyframes spriteIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes spriteWalk{0%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-3px) rotate(1deg)}}@keyframes spriteEat{0%,100%{transform:rotate(0)}25%{transform:rotate(6deg) translateY(3px)}75%{transform:rotate(-3deg)}}@keyframes spriteSleep{0%,100%{transform:scale(1)}50%{transform:scale(.97) translateY(2px)}}@keyframes spriteHappy{0%,100%{transform:translateY(0)}25%{transform:translateY(-10px) rotate(-3deg)}75%{transform:translateY(-10px) rotate(3deg)}}@keyframes spriteSad{0%,100%{transform:translateY(0)}50%{transform:translateY(2px) scale(.97)}}@keyframes spriteSick{0%,100%{transform:translateX(0)}25%{transform:translateX(-2px)}75%{transform:translateX(2px)}}';
        document.head.appendChild(style);
        this._applyAnim('idle');
    },

    _applyAnim:function(name){
        if(this._curAnim===name||this._actionLock)return;
        this._curAnim=name;
        var s=this.els.petSprite;if(!s)return;
        s.style.animation=this.ANIMS[name]||this.ANIMS.idle;
        // Start/stop spritesheet for walking
        if(name==='walking')this._startSheet();
        else this._stopSheet();
    },
    _forceAnim:function(name){
        this._curAnim=name;
        if(name==='walking')this._startSheet();
        else this._stopSheet();
        var s=this.els.petSprite;if(!s)return;
        s.style.animation='none';var self=this;
        requestAnimationFrame(function(){s.style.animation=self.ANIMS[name]||self.ANIMS.idle;});
    },
    _applyFlip:function(f){
        if(this._curFlip===f)return;this._curFlip=f;
        this.els.petWrapper.style.transform='translateX(-50%)'+(f?' scaleX(-1)':'');
    },

    // ═══ SPRITESHEET for poussin walking ═══
    _startSheet:function(){
        if(this._sheet.active)return;
        var sprite=this.els.petSprite;
        // Only activate for poussin stage
        if(!sprite||this._lastStade!==0)return;
        this._sheet.active=true;
        sprite.style.objectFit='none';
        sprite.style.objectPosition='0 0';
        sprite.src='assets/sprites/poussin_sheet.png';
        var self=this;var frame=0;
        this._sheet.iv=setInterval(function(){
            frame=(frame+1)%self._sheet.total;
            var col=frame%self._sheet.cols,row=Math.floor(frame/self._sheet.cols);
            var fw=256,fh=256;
            var size=parseInt(self.els.pet.style.width)||104;
            // Scale: spritesheet frame is 256px, display is `size`px
            var scale=size/fw;
            sprite.style.width=(fw*self._sheet.cols*scale)+'px';
            sprite.style.height=(fh*self._sheet.rows*scale)+'px';
            sprite.style.objectPosition=(-col*fw*scale)+'px '+(-row*fh*scale)+'px';
        },120);
    },
    _stopSheet:function(){
        if(!this._sheet.active)return;
        this._sheet.active=false;clearInterval(this._sheet.iv);
        var sprite=this.els.petSprite;
        if(!sprite)return;
        // Restore normal image
        sprite.style.objectFit='contain';
        sprite.style.objectPosition='';
        sprite.style.width='100%';sprite.style.height='100%';
        sprite.src=this._lastSprite||'assets/sprites/poussin.png';
    },

    update:function(pet){if(!pet)return;this.updateHUD(pet);this.updateStats(pet);this.updatePetSprite(pet);this.updatePoops(pet);this.updateSleepState(pet);this.updateMoodEmoji(pet);this.updateSleepButton(pet);},

    updateHUD:function(pet){
        var stage=Engine.STAGES[pet.stade];
        var el=document.getElementById('hud-stage');if(el)el.textContent=stage.nom;
        var lv=document.getElementById('hud-level');if(lv)lv.textContent='Nv.'+Math.floor(pet.experience/50+1);
        var coins=document.getElementById('hud-coins');if(coins)coins.textContent='🪙 '+pet.coins;
        var dot=document.getElementById('alert-dot');if(dot)dot.classList.toggle('hidden',!Engine.hasAlerts(pet));
        var sprite=Engine.getSpriteForPet(pet);
        var avi=document.getElementById('tb-avatar-img');if(avi&&this._lastSprite!==sprite)avi.src=sprite;
        this.updateXPRing(pet);
        var ce=document.getElementById('hud-coins');if(ce){var nh=Engine.HOUSING[pet.housingLevel+1];ce.classList.toggle('coins-pulse',pet.coins>=50||(nh&&pet.coins>=nh.cost));}
    },
    updateXPRing:function(pet){var ring=document.getElementById('xp-ring');if(!ring)return;var s=Engine.STAGES[pet.stade];var pct=s.heures?Math.min(1,(Date.now()-pet.derniereEvolution)/3600000/s.heures):1;ring.style.strokeDashoffset=(132*(1-pct)).toFixed(1);},

    updateStats:function(pet){
        // Bonheur = average of all gauges (displayed full width above)
        var gauges=[pet.faim,pet.energie,pet.sante,pet.hygiene||50,pet.amour||30,(pet.jeu||0),(pet.travail||0)];
        var avg=gauges.reduce(function(a,b){return a+b;},0)/gauges.length;
        pet.bonheur=Math.max(0,Math.min(100,avg));

        var bonBar=document.getElementById('stat-bonheur-main');
        if(bonBar){bonBar.style.width=pet.bonheur+'%';bonBar.style.background=this._gc(pet.bonheur);}
        var bonPct=document.getElementById('pct-bonheur-main');
        if(bonPct)bonPct.textContent=Math.round(pet.bonheur)+'%';

        // Individual stats (jeu replaces bonheur slot)
        var stats=[['faim',pet.faim],['jeu',pet.jeu||0],['energie',pet.energie],['sante',pet.sante],['hygiene',pet.hygiene||50],['amour',pet.amour||30]];
        for(var i=0;i<stats.length;i++){
            var n=stats[i][0],v=Math.max(0,Math.min(100,stats[i][1]));
            var bar=document.getElementById('stat-'+n);if(bar){bar.style.width=v+'%';bar.style.background=this._gc(v);}
            var txt=document.getElementById('pct-'+n);if(txt)txt.textContent=Math.round(v)+'%';
        }
        this._showHints(pet);
    },
    _gc:function(v){if(v>=70)return'#44cc66';if(v>=50)return'#a0cc44';if(v>=40)return'#ddcc00';if(v>=30)return'#e8a020';if(v>=20)return'#e06820';if(v>=15)return'#d83030';return'#cc1515';},

    _showHints:function(pet){
        var hint=document.getElementById('hint-bar');if(!hint)return;
        var msg='';
        if(pet.faim<20)msg='🌾 Francis a faim → Nourrir';
        else if(pet.energie<20)msg='😴 Francis est épuisé → Dormir';
        else if(pet.sante<20)msg='❤️ Francis est malade → Soigner';
        else if((pet.hygiene||50)<20)msg='🧼 Francis est sale → Douche';
        else if((pet.amour||30)<20)msg='💕 Francis se sent seul → Câliner';
        else if((pet.jeu||0)<20)msg='🎮 Francis s\'ennuie → Jouer';
        hint.textContent=msg;hint.style.display=msg?'block':'none';
    },

    updatePetSprite:function(pet){
        var sprite=Engine.getSpriteForPet(pet);
        if(this._lastSprite!==sprite&&!this._sheet.active){this._lastSprite=sprite;this.els.petSprite.src=sprite;}
        var stage=Engine.STAGES[pet.stade];
        if(this._lastStade!==pet.stade){this._lastStade=pet.stade;this.els.pet.style.width=stage.size+'px';this.els.pet.style.height=stage.size+'px';}
        if(!this._actionLock&&this._curAnim!=='walking'){
            var mood=Engine.getMood(pet);
            if(mood==='sleeping')this._applyAnim('sleeping');
            else if(mood==='malade')this._applyAnim('sick');
            else if(mood==='triste'||mood==='faim'||mood==='fatigue'||mood==='sale')this._applyAnim('sad');
            else this._applyAnim('idle');
        }
    },

    updateSleepState:function(pet){
        this.els.petWrapper.classList.toggle('in-building',pet.isSleeping);
        var zzz=document.getElementById('sleep-zzz');if(zzz)zzz.classList.toggle('hidden',!pet.isSleeping);
    },
    updateSleepButton:function(pet){
        var btn=document.getElementById('btn-dormir');if(!btn)return;
        var ic=btn.querySelector('.act-icon'),lb=btn.querySelector('.act-label');
        if(pet.isSleeping){btn.classList.add('sleep-active');btn.classList.remove('on-cooldown');if(ic)ic.textContent='⏹️';if(lb)lb.textContent='Réveiller';}
        else{btn.classList.remove('sleep-active');if(ic)ic.textContent='💤';if(lb)lb.textContent='Dormir';}
    },
    updateMoodEmoji:function(pet){
        var el=this.els.moodEmoji;if(!el)return;
        var key='',emoji='';
        if(pet.isSleeping){key='sleep';emoji='💤';}else if((pet.poops||0)>=2){key='poop';emoji='🤢';}
        else if((pet.hygiene||50)<25){key='dirty';emoji='🪥';}else if((pet.amour||30)<20){key='lonely';emoji='💔';}
        else if((pet.faim||50)<20){key='hungry';emoji='😫';}else if((pet.energie||50)<20){key='tired';emoji='😴';}
        else if((pet.sante||50)<25){key='sick';emoji='🤒';}else{key='ok';}
        if(key===this._lastMood)return;this._lastMood=key;
        if(!emoji){el.classList.add('hidden');return;}
        el.textContent=emoji;el.style.left='58%';el.style.bottom='48%';el.classList.remove('hidden');
    },
    updatePoops:function(pet){
        var c=this.els.poopContainer;if(!c)return;
        var tp=pet.poops||0,cp=c.querySelectorAll('.poop').length;
        while(cp<tp){var p=document.createElement('div');p.className='poop';p.textContent='💩';p.style.left=(8+Math.random()*70)+'%';p.style.fontSize='42px';c.appendChild(p);cp++;}
        while(cp>tp){var pp=c.querySelector('.poop');if(pp)pp.remove();cp--;}
    },

    tickMovement:function(pet){
        if(!pet||pet.isSleeping||pet.estMort||this._actionLock)return;
        if(Math.random()<.02)this.walkTarget=15+Math.random()*70;
        var dx=this.walkTarget-this.currentPetX;
        if(Math.abs(dx)>2){
            this.walkDir=dx>0?1:-1;this.currentPetX+=this.walkDir*.3;
            this.els.petWrapper.style.left=this.currentPetX+'%';
            this._applyAnim('walking');
        }else{
            if(this._curAnim==='walking')this._applyAnim('idle');
            if(Math.random()<.005)this.walkTarget=15+Math.random()*70;
        }
        this._applyFlip(this.walkDir<0);
    },

    // ═══ COUNTDOWN with label in top bar ═══
    _countdown:function(label,seconds,onEnd){
        var cd=document.createElement('div');cd.className='countdown-display';
        cd.innerHTML='<span class="cd-label">'+label+'</span> <span class="cd-num">'+seconds+'s</span>';
        this.els.scene.appendChild(cd);
        var remaining=seconds;
        var iv=setInterval(function(){remaining--;
            var span=cd.querySelector('.cd-num');if(span)span.textContent=remaining+'s';
            if(remaining<=0){clearInterval(iv);cd.remove();if(onEnd)onEnd();}
        },1000);
        return{el:cd,interval:iv};
    },

    // ═══ GAUGE RESULT ═══
    showGaugeResult:function(label,pct){
        var d=document.createElement('div');d.className='gauge-result';
        d.innerHTML='<div class="gr-label">'+label+'</div><div class="gr-bar"><div class="gr-fill" style="width:0;background:'+this._gc(pct)+'"></div></div><div class="gr-pct">+20%</div>';
        this.els.scene.appendChild(d);
        requestAnimationFrame(function(){var f=d.querySelector('.gr-fill');if(f)f.style.width=pct+'%';});
        setTimeout(function(){d.remove();},3000);
    },

    // ═══ NOURRIR — big food pulsing + flies to beak ═══
    petEatAnimation:function(foodEmoji){
        var self=this;this._actionLock=true;this._forceAnim('eating');
        var emoji=foodEmoji||'🌾';
        var big=document.createElement('div');big.className='big-food-anim';big.textContent=emoji;
        this.els.scene.appendChild(big);
        var feedLoop=setInterval(function(){
            var m=document.createElement('div');m.className='food-fly';m.textContent=emoji;
            m.style.left='50%';m.style.top='22%';
            // Target: pet position
            var petPct=self.currentPetX;
            m.style.setProperty('--tx',(petPct-50)+'vw');
            self.els.sceneItems.appendChild(m);
            setTimeout(function(){m.remove();},1800);
        },1600);
        var timer=this._countdown('🍽️ Francis mange',10,function(){
            clearInterval(feedLoop);big.remove();self._actionLock=false;self._forceAnim('idle');
        });
    },

    // ═══ LECTURE — book at pet height, 40s ═══
    showStudyAnimation:function(){
        var self=this;this._actionLock=true;
        var pw=this.els.petWrapper;if(!pw){this._actionLock=false;return;}
        var pr=pw.getBoundingClientRect(),sr=this.els.scene.getBoundingClientRect();
        var petBottomPct=((sr.bottom-pr.bottom)/sr.height*100);
        var book=document.createElement('div');book.className='big-book-anim';book.textContent='📖';
        book.style.bottom=(petBottomPct+2)+'%';
        book.style.left=(this.currentPetX+8)+'%';
        this.els.scene.appendChild(book);
        var brainLoop=setInterval(function(){
            var b=document.createElement('div');b.className='brain-float';b.textContent='🧠';
            b.style.left=(self.currentPetX-8+Math.random()*16)+'%';
            b.style.bottom=(petBottomPct+18)+'%';
            self.els.sceneItems.appendChild(b);setTimeout(function(){b.remove();},2500);
        },700);
        var timer=this._countdown('📖 Francis lit',40,function(){
            clearInterval(brainLoop);book.remove();self._actionLock=false;
        });
    },

    // ═══ DOUCHE — 30s, showerhead above pet ═══
    showHeavyShower:function(){
        var self=this;this._actionLock=true;
        var pw=this.els.petWrapper,sc=this.els.scene;if(!pw||!sc){this._actionLock=false;return;}
        var pr=pw.getBoundingClientRect(),sr=sc.getBoundingClientRect();
        var cx=((pr.left+pr.width/2-sr.left)/sr.width*100),ty=((pr.top-sr.top)/sr.height*100)-8;
        var head=document.createElement('div');head.className='shower-head';head.textContent='🚿';
        head.style.left=cx+'%';head.style.top=Math.max(0,ty-3)+'%';
        this.els.sceneItems.appendChild(head);
        var dropLoop=setInterval(function(){
            for(var i=0;i<3;i++){var d=document.createElement('div');d.className='shower-drop';d.textContent='💧';d.style.left=(cx-10+Math.random()*20)+'%';d.style.top=Math.max(0,ty)+'%';self.els.sceneItems.appendChild(d);setTimeout(function(){d.remove();},900);}
        },200);
        var timer=this._countdown('🚿 Francis se lave',30,function(){
            clearInterval(dropLoop);head.remove();self._actionLock=false;
        });
    },

    // ═══ BALAI — broom sweeps poops, they fade ═══
    showBigBroom:function(){
        var self=this;this._actionLock=true;
        // Sweep each poop with broom
        var poops=this.els.poopContainer?this.els.poopContainer.querySelectorAll('.poop'):[];
        var idx=0;
        var broom=document.createElement('div');broom.className='broom-sweeping';broom.textContent='🧹';broom.style.fontSize='56px';
        this.els.sceneItems.appendChild(broom);
        var sweepLoop=setInterval(function(){
            if(idx<poops.length){
                var poop=poops[idx];
                if(poop&&poop.parentNode){
                    var left=parseFloat(poop.style.left)||30;
                    broom.style.left=(left-5)+'%';broom.style.bottom='8%';
                    broom.style.animation='broomSwing .4s ease-in-out';
                    setTimeout(function(p){return function(){p.style.transition='opacity .5s';p.style.opacity='0';setTimeout(function(){if(p.parentNode)p.parentNode.removeChild(p);},500);}}(poop),300);
                }
                idx++;
            }
        },1000);
        var timer=this._countdown('🧹 Nettoyage de Francis',10,function(){
            clearInterval(sweepLoop);broom.remove();self._actionLock=false;
        });
    },

    // ═══ SERINGUE — 180°, flies to pet ═══
    showBigSyringe:function(){
        var self=this;this._actionLock=true;
        var loop=setInterval(function(){
            var s=document.createElement('div');s.className='syringe-fly';s.textContent='💉';
            s.style.setProperty('--pet-x',self.currentPetX+'%');
            self.els.sceneItems.appendChild(s);setTimeout(function(){s.remove();},2000);
        },2100);
        var timer=this._countdown('🚨 Soin en cours',20,function(){clearInterval(loop);self._actionLock=false;});
    },

    // ═══ CALINER — hen static on left ═══
    showHenVisit:function(henSprite,petSize){
        var w=document.getElementById('hen-wrapper'),img=document.getElementById('hen-sprite');
        img.src=henSprite;img.style.width=(petSize||120)+'px';img.style.height=(petSize||120)+'px';
        w.style.left='2%';w.style.bottom='10%';w.style.position='absolute';
        w.classList.remove('hidden');
        var self=this;
        var heartLoop=setInterval(function(){
            var hrt=document.createElement('div');hrt.className='float-item';
            hrt.textContent=['💕','❤️','💗','💖'][Math.floor(Math.random()*4)];
            hrt.style.left=(8+Math.random()*25)+'%';hrt.style.top=(30+Math.random()*30)+'%';
            hrt.style.fontSize='48px';
            self.els.sceneItems.appendChild(hrt);setTimeout(function(){hrt.remove();},1500);
        },800);
        setTimeout(function(){clearInterval(heartLoop);w.classList.add('hidden');},60000);
    },

    petHappyAnimation:function(){this._forceAnim('happy');var s=this;setTimeout(function(){s._forceAnim('idle');},1200);},
    showEmotion:function(e,d){this.els.emotionIcon.textContent=e;this.els.emotionBubble.classList.remove('hidden');var s=this;setTimeout(function(){s.els.emotionBubble.classList.add('hidden');},d||1500);},
    showSpeech:function(t){
        var b=this.els.speechBubble,tx=this.els.speechText;
        tx.textContent=t;tx.style.direction='ltr';tx.style.unicodeBidi='plaintext';
        b.style.direction='ltr';b.classList.remove('hidden');
        var s=this;setTimeout(function(){b.classList.add('hidden');},3000);
    },
    showSleepZ:function(){var z=document.createElement('div');z.className='zzz';z.textContent='Z';z.style.left=(this.currentPetX+5)+'%';z.style.top='35%';this.els.sceneItems.appendChild(z);setTimeout(function(){z.remove();},2000);},
    showHeartAt:function(x,y){var h=document.createElement('div');h.className='touch-heart';h.textContent='💕';h.style.left=x+'px';h.style.top=y+'px';h.style.fontSize='48px';document.body.appendChild(h);setTimeout(function(){h.remove();},1000);},
    showCoinAt:function(x,y){var c=document.createElement('div');c.className='coin-float';c.textContent='+1 🪙';c.style.left=x+'px';c.style.top=y+'px';document.body.appendChild(c);setTimeout(function(){c.remove();},1200);},
    showFloatingItem:function(e,x,y){var d=document.createElement('div');d.className='float-item';d.textContent=e;d.style.left=(x||50)+'%';d.style.top=(y||60)+'%';this.els.sceneItems.appendChild(d);setTimeout(function(){d.remove();},1500);},
    showEvolution:function(o,n){document.getElementById('evo-old').textContent=o.emoji;document.getElementById('evo-new').textContent=n.emoji;document.getElementById('evo-desc').textContent=n.nom;document.getElementById('evolution-screen').classList.remove('hidden');},
    hideEvolution:function(){document.getElementById('evolution-screen').classList.add('hidden');},
    showDeath:function(pet){var age=Engine.getAge(pet);document.getElementById('death-desc').textContent=pet.nom+' a vécu '+age.days+'j. Cause: '+(pet.causeMort||'?');document.getElementById('death-stats').innerHTML='<p style="color:#8899bb">XP:'+pet.experience+' 🪙'+pet.coins+'</p>';document.getElementById('death-screen').classList.remove('hidden');},
    hideDeath:function(){document.getElementById('death-screen').classList.add('hidden');},
    toast:function(m){var el=document.getElementById('toast'),tx=document.getElementById('toast-text');tx.textContent=m;el.classList.remove('hidden');clearTimeout(this._tt);this._tt=setTimeout(function(){el.classList.add('hidden');},2500);},
    haptic:function(){},
    renderFoodGrid:function(){return Engine.FOODS.map(function(f){return'<div class="food-item" data-food="'+f.id+'"><span class="food-icon">'+f.emoji+'</span><span class="food-name">'+f.nom+'</span><span class="food-stats">+'+f.faim+'🌾</span></div>';}).join('');},
    renderStatsDetail:function(pet){var sc=function(v){return v>=70?'#44cc66':v>=40?'#f0c040':'#e74c3c';};var rows=[{e:'🌾',n:'Faim',v:pet.faim},{e:'🎮',n:'Jeu',v:pet.jeu||0},{e:'⚡',n:'Énergie',v:pet.energie},{e:'❤️',n:'Santé',v:pet.sante},{e:'🧼',n:'Hygiène',v:pet.hygiene||50},{e:'🧠',n:'Intellect',v:pet.intellect||30},{e:'💕',n:'Amour',v:pet.amour||30},{e:'👷',n:'Travail',v:pet.travail||0}];var html='<div class="bonheur-main-row"><span class="stat-emoji">😊</span><div class="stat-info"><div class="stat-name">Bonheur général</div><div class="stat-value" style="color:'+sc(pet.bonheur)+'">'+Math.round(pet.bonheur)+'%</div><div class="stat-bar-big"><div class="stat-bar-fill" style="width:'+pet.bonheur+'%;background:'+sc(pet.bonheur)+'"></div></div></div></div>';html+=rows.map(function(s){return'<div class="stat-row"><span class="stat-emoji">'+s.e+'</span><div class="stat-info"><div class="stat-name">'+s.n+'</div><div class="stat-value" style="color:'+sc(s.v)+'">'+Math.round(s.v)+'%</div><div class="stat-bar-big"><div class="stat-bar-fill" style="width:'+s.v+'%;background:'+sc(s.v)+'"></div></div></div></div>';}).join('');var stage=Engine.STAGES[pet.stade],age=Engine.getAge(pet),evo=Engine.getTimeToEvolve(pet);html+='<div class="stats-section-title">Infos</div><div class="stats-info-grid"><div class="stats-info-card"><div class="label">Stade</div><div class="value">'+stage.emoji+'</div></div><div class="stats-info-card"><div class="label">Âge</div><div class="value">'+age.days+'j</div></div><div class="stats-info-card"><div class="label">XP</div><div class="value">'+pet.experience+'</div></div><div class="stats-info-card"><div class="label">Évolution</div><div class="value">'+(evo!==null?Math.ceil(evo)+'h':'🏆')+'</div></div></div>';return html;}
};
