var Renderer={
    els:{},walkDir:1,walkTarget:50,currentPetX:50,
    _lastMood:null,_lastSprite:'',_lastStade:-1,_lastAnim:'',_lastFlip:false,
    ALL_ANIMS:['idle','walking','sleeping','sick','sad','eating','happy'],

    init:function(){
        var g=function(id){return document.getElementById(id)};
        this.els={pet:g('pet'),petSprite:g('pet-sprite'),petWrapper:g('pet-wrapper'),scene:g('scene'),sceneItems:g('scene-items'),poopContainer:g('poop-container'),emotionBubble:g('emotion-bubble'),emotionIcon:g('emotion-icon'),speechBubble:g('speech-bubble'),speechText:g('speech-text'),moodEmoji:g('mood-emoji')};
        if(this.els.pet){this.els.pet.classList.add('pet');this._setAnim('idle');}
    },

    _setAnim:function(a){
        if(this._lastAnim===a)return;
        var p=this.els.pet;
        for(var i=0;i<this.ALL_ANIMS.length;i++)p.classList.remove(this.ALL_ANIMS[i]);
        p.classList.add(a);this._lastAnim=a;
    },

    // Use transform directly for flip - NO class toggle that restarts animations
    _setFlip:function(flipped){
        if(this._lastFlip===flipped)return;
        this._lastFlip=flipped;
        this.els.petSprite.style.transform=flipped?'scaleX(-1)':'scaleX(1)';
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
        // Coin pulse
        var ce=document.getElementById('hud-coins');if(ce){var nh=Engine.HOUSING[pet.housingLevel+1];var can=pet.coins>=50||(nh&&pet.coins>=nh.cost);ce.classList.toggle('coins-pulse',can);}
    },
    updateXPRing:function(pet){var ring=document.getElementById('xp-ring');if(!ring)return;var s=Engine.STAGES[pet.stade];var pct=s.heures?Math.min(1,(Date.now()-pet.derniereEvolution)/3600000/s.heures):1;ring.style.strokeDashoffset=(132*(1-pct)).toFixed(1);},

    updateStats:function(pet){
        var stats=[['faim',pet.faim],['bonheur',pet.bonheur],['energie',pet.energie],['sante',pet.sante],['hygiene',pet.hygiene||50],['amour',pet.amour||30]];
        for(var i=0;i<stats.length;i++){
            var n=stats[i][0],v=Math.max(0,Math.min(100,stats[i][1]));
            var bar=document.getElementById('stat-'+n);
            var txt=document.getElementById('pct-'+n);
            if(bar){bar.style.width=v+'%';bar.style.background=this._gaugeColor(v);}
            if(txt)txt.textContent=Math.round(v)+'%';
        }
    },
    _gaugeColor:function(v){
        if(v>=70)return'#44cc66';if(v>=50)return'#a0cc44';if(v>=40)return'#ddcc00';
        if(v>=30)return'#e8a020';if(v>=20)return'#e06820';if(v>=15)return'#d83030';return'#cc1515';
    },

    updatePetSprite:function(pet){
        var p=this.els.pet;if(!p)return;
        var stage=Engine.STAGES[pet.stade];
        var sprite=Engine.getSpriteForPet(pet);
        if(this._lastSprite!==sprite){this._lastSprite=sprite;this.els.petSprite.src=sprite;}
        if(this._lastStade!==pet.stade){this._lastStade=pet.stade;p.style.width=stage.size+'px';p.style.height=stage.size+'px';}
        var mood=Engine.getMood(pet);
        var tgt='idle';
        if(mood==='sleeping')tgt='sleeping';else if(mood==='malade')tgt='sick';
        else if(mood==='triste'||mood==='faim'||mood==='fatigue'||mood==='sale')tgt='sad';
        this._setAnim(tgt);
    },

    updateSleepState:function(pet){
        var pw=this.els.petWrapper;var zzz=document.getElementById('sleep-zzz');
        if(pet.isSleeping){pw.classList.add('in-building');if(zzz)zzz.classList.remove('hidden');}
        else{pw.classList.remove('in-building');if(zzz)zzz.classList.add('hidden');}
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
        if(pet.isSleeping){key='sleep';emoji='💤';}
        else if((pet.poops||0)>=2){key='poop';emoji='🤢';}
        else if((pet.hygiene||50)<25){key='dirty';emoji='🪥';}
        else if((pet.amour||30)<20){key='lonely';emoji='💔';}
        else if((pet.faim||50)<20){key='hungry';emoji='😫';}
        else if((pet.energie||50)<20){key='tired';emoji='😴';}
        else if((pet.sante||50)<25){key='sick';emoji='🤒';}
        else{key='ok';}
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
        if(!pet||pet.isSleeping||pet.estMort)return;
        if(Math.random()<.02)this.walkTarget=15+Math.random()*70;
        var dx=this.walkTarget-this.currentPetX;
        var priority=['sleeping','sick','sad','eating','happy'];
        var isPri=priority.indexOf(this._lastAnim)>=0;
        if(Math.abs(dx)>2){
            this.walkDir=dx>0?1:-1;this.currentPetX+=this.walkDir*.3;
            this.els.petWrapper.style.left=this.currentPetX+'%';
            if(!isPri)this._setAnim('walking');
        }else{
            if(!isPri&&this._lastAnim==='walking')this._setAnim('idle');
            if(Math.random()<.005)this.walkTarget=15+Math.random()*70;
        }
        // Flip via transform, NOT classList
        this._setFlip(this.walkDir<0);
    },

    // ═══ BIG ANIMATIONS ═══
    showEmotion:function(e,d){this.els.emotionIcon.textContent=e;this.els.emotionBubble.classList.remove('hidden');var s=this;setTimeout(function(){s.els.emotionBubble.classList.add('hidden');},d||1500);},
    showSpeech:function(t){this.els.speechText.textContent=t;this.els.speechBubble.classList.remove('hidden');var s=this;setTimeout(function(){s.els.speechBubble.classList.add('hidden');},3000);},
    showSleepZ:function(){var z=document.createElement('div');z.className='zzz';z.textContent='Z';z.style.left=(this.currentPetX+5)+'%';z.style.top='35%';this.els.sceneItems.appendChild(z);setTimeout(function(){z.remove();},2000);},
    showHeartAt:function(x,y){var h=document.createElement('div');h.className='touch-heart';h.textContent='💕';h.style.left=x+'px';h.style.top=y+'px';h.style.fontSize='48px';document.body.appendChild(h);setTimeout(function(){h.remove();},1000);},
    showCoinAt:function(x,y){var c=document.createElement('div');c.className='coin-float';c.textContent='+1 🪙';c.style.left=x+'px';c.style.top=y+'px';document.body.appendChild(c);setTimeout(function(){c.remove();},1200);},

    // Broom: 10s animation with "Nettoyage en cours"
    showBigBroom:function(){
        var self=this;
        var overlay=document.createElement('div');overlay.className='action-overlay';
        overlay.innerHTML='<div class="action-text">🧹 Nettoyage en cours...</div>';
        this.els.scene.appendChild(overlay);
        var broomLoop=setInterval(function(){
            var b=document.createElement('div');b.className='big-broom';b.textContent='🧹';b.style.fontSize='80px';
            b.style.left='50%';b.style.bottom='15%';
            self.els.sceneItems.appendChild(b);setTimeout(function(){b.remove();},1200);
        },1300);
        setTimeout(function(){clearInterval(broomLoop);overlay.remove();},10000);
    },

    // Syringe: 10s animation toward pet
    showBigSyringe:function(){
        var self=this;
        var overlay=document.createElement('div');overlay.className='action-overlay';
        overlay.innerHTML='<div class="action-text">💉 Soin en cours...</div>';
        this.els.scene.appendChild(overlay);
        var syringeLoop=setInterval(function(){
            var s=document.createElement('div');s.className='big-syringe';s.textContent='💉';s.style.fontSize='80px';
            s.style.left='50%';s.style.top='35%';
            self.els.sceneItems.appendChild(s);setTimeout(function(){s.remove();},1500);
        },1600);
        setTimeout(function(){clearInterval(syringeLoop);overlay.remove();},10000);
    },

    // Shower with showerhead emoji
    showHeavyShower:function(){
        var self=this;var pw=this.els.petWrapper,sc=this.els.scene;
        if(!pw||!sc)return;
        var pr=pw.getBoundingClientRect(),sr=sc.getBoundingClientRect();
        var cx=((pr.left+pr.width/2-sr.left)/sr.width*100);
        var ty=((pr.top-sr.top)/sr.height*100)-8;
        // Showerhead
        var head=document.createElement('div');head.className='shower-head';head.textContent='🚿';
        head.style.left=cx+'%';head.style.top=Math.max(0,ty-3)+'%';
        this.els.sceneItems.appendChild(head);
        for(var i=0;i<50;i++){(function(i){setTimeout(function(){
            var d=document.createElement('div');d.className='shower-drop';d.textContent='💧';
            d.style.left=(cx-10+Math.random()*20)+'%';d.style.top=Math.max(0,ty)+'%';
            self.els.sceneItems.appendChild(d);setTimeout(function(){d.remove();},900);
        },i*60);})(i);}
        setTimeout(function(){head.remove();},4000);
    },

    // Eat animation: 10s with miam miam
    petEatAnimation:function(){
        var self=this;this._setAnim('eating');
        var miamLoop=setInterval(function(){
            var m=document.createElement('div');m.className='float-item';
            m.textContent=['miam!','😋','miam miam!','🍽️'][Math.floor(Math.random()*4)];
            m.style.left=(self.currentPetX-10+Math.random()*20)+'%';m.style.top='45%';
            m.style.fontSize='22px';m.style.fontWeight='800';m.style.color='#f0c040';
            self.els.sceneItems.appendChild(m);setTimeout(function(){m.remove();},1500);
        },1200);
        setTimeout(function(){clearInterval(miamLoop);self._setAnim('idle');},10000);
    },

    petHappyAnimation:function(){this._setAnim('happy');var s=this;setTimeout(function(){s._setAnim('idle');},1200);},

    // Hen visit: 2 minutes, big hearts
    showHenVisit:function(h,sz){
        var w=document.getElementById('hen-wrapper'),img=document.getElementById('hen-sprite');
        img.src=h;img.style.width=(sz||120)+'px';img.style.height=(sz||120)+'px';
        w.classList.remove('hidden');
        var self=this;
        var heartLoop=setInterval(function(){
            var hrt=document.createElement('div');hrt.className='float-item';hrt.textContent=['💕','❤️','💗','💖'][Math.floor(Math.random()*4)];
            hrt.style.left=(30+Math.random()*40)+'%';hrt.style.top=(25+Math.random()*25)+'%';
            hrt.style.fontSize='48px';
            self.els.sceneItems.appendChild(hrt);setTimeout(function(){hrt.remove();},1500);
        },800);
        // 2 minutes = 120000ms
        setTimeout(function(){clearInterval(heartLoop);w.classList.add('hidden');},120000);
    },

    showFloatingItem:function(e,x,y){var d=document.createElement('div');d.className='float-item';d.textContent=e;d.style.left=(x||50)+'%';d.style.top=(y||60)+'%';this.els.sceneItems.appendChild(d);setTimeout(function(){d.remove();},1500);},
    showEvolution:function(o,n){document.getElementById('evo-old').textContent=o.emoji;document.getElementById('evo-new').textContent=n.emoji;document.getElementById('evo-desc').textContent=n.nom;document.getElementById('evolution-screen').classList.remove('hidden');},
    hideEvolution:function(){document.getElementById('evolution-screen').classList.add('hidden');},
    showDeath:function(pet){var age=Engine.getAge(pet);document.getElementById('death-desc').textContent=pet.nom+' a vécu '+age.days+'j. Cause: '+(pet.causeMort||'?');document.getElementById('death-stats').innerHTML='<p style="color:#8899bb">XP:'+pet.experience+' 🪙'+pet.coins+'</p>';document.getElementById('death-screen').classList.remove('hidden');},
    hideDeath:function(){document.getElementById('death-screen').classList.add('hidden');},
    toast:function(m){var el=document.getElementById('toast'),tx=document.getElementById('toast-text');tx.textContent=m;el.classList.remove('hidden');clearTimeout(this._tt);this._tt=setTimeout(function(){el.classList.add('hidden');},2500);},
    haptic:function(){},
    renderFoodGrid:function(){return Engine.FOODS.map(function(f){return'<div class="food-item" data-food="'+f.id+'"><span class="food-icon">'+f.emoji+'</span><span class="food-name">'+f.nom+'</span><span class="food-stats">+'+f.faim+'🌾</span></div>';}).join('');},
    renderStatsDetail:function(pet){var sc=function(v){return v>=70?'#44cc66':v>=40?'#f0c040':'#e74c3c';};var rows=[{e:'🌾',n:'Faim',v:pet.faim},{e:'😊',n:'Bonheur',v:pet.bonheur},{e:'⚡',n:'Énergie',v:pet.energie},{e:'❤️',n:'Santé',v:pet.sante},{e:'🧼',n:'Hygiène',v:pet.hygiene||50},{e:'🧠',n:'Intellect',v:pet.intellect||30},{e:'💕',n:'Amour',v:pet.amour||30}];var html=rows.map(function(s){return'<div class="stat-row"><span class="stat-emoji">'+s.e+'</span><div class="stat-info"><div class="stat-name">'+s.n+'</div><div class="stat-value" style="color:'+sc(s.v)+'">'+Math.round(s.v)+'%</div><div class="stat-bar-big"><div class="stat-bar-fill" style="width:'+s.v+'%;background:'+sc(s.v)+'"></div></div></div></div>';}).join('');var stage=Engine.STAGES[pet.stade],age=Engine.getAge(pet),evo=Engine.getTimeToEvolve(pet);html+='<div class="stats-section-title">Infos</div><div class="stats-info-grid"><div class="stats-info-card"><div class="label">Stade</div><div class="value">'+stage.emoji+'</div></div><div class="stats-info-card"><div class="label">Âge</div><div class="value">'+age.days+'j</div></div><div class="stats-info-card"><div class="label">XP</div><div class="value">'+pet.experience+'</div></div><div class="stats-info-card"><div class="label">Évolution</div><div class="value">'+(evo!==null?Math.ceil(evo)+'h':'🏆')+'</div></div></div>';return html;}
};
