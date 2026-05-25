var Renderer = {
    els:{},walkDir:1,walkTarget:50,currentPetX:50,
    _lastMoodKey:null,

    init:function(){
        this.els={pet:document.getElementById('pet'),petSprite:document.getElementById('pet-sprite'),petWrapper:document.getElementById('pet-wrapper'),scene:document.getElementById('scene'),sceneItems:document.getElementById('scene-items'),poopContainer:document.getElementById('poop-container'),emotionBubble:document.getElementById('emotion-bubble'),emotionIcon:document.getElementById('emotion-icon'),speechBubble:document.getElementById('speech-bubble'),speechText:document.getElementById('speech-text'),moodEmoji:document.getElementById('mood-emoji')};
    },

    update:function(pet){if(!pet)return;this.updateHUD(pet);this.updateStats(pet);this.updatePet(pet);this.updatePoops(pet);this.updateSleepState(pet);this.updateMoodEmoji(pet);this.updateSleepButton(pet);},

    updateHUD:function(pet){
        var stage=Engine.STAGES[pet.stade];
        var el=document.getElementById('hud-stage');if(el)el.textContent=stage.nom;
        var lv=document.getElementById('hud-level');if(lv)lv.textContent='Niveau '+Math.floor(pet.experience/50+1);
        var coins=document.getElementById('hud-coins');if(coins)coins.textContent='🪙 '+pet.coins;
        var dot=document.getElementById('alert-dot');if(dot)dot.classList.toggle('hidden',!Engine.hasAlerts(pet));
        // Avatar uses current sprite (sad or normal)
        var sprite=Engine.getSpriteForPet(pet);
        var avi=document.getElementById('tb-avatar-img');if(avi&&avi.src.indexOf(sprite)===-1)avi.src=sprite;
        this.updateXPRing(pet);
    },

    updateXPRing:function(pet){
        var ring=document.getElementById('xp-ring');if(!ring) return;
        var stage=Engine.STAGES[pet.stade];var pct=0;
        if(stage.heures){pct=Math.min(1,(Date.now()-pet.derniereEvolution)/3600000/stage.heures);}else{pct=1;}
        ring.style.strokeDashoffset=(132*(1-pct)).toFixed(2);
    },

    updateStats:function(pet){
        this.setStat('faim',pet.faim);this.setStat('bonheur',pet.bonheur);
        this.setStat('energie',pet.energie);this.setStat('sante',pet.sante);
        this.setStat('hygiene',pet.hygiene||50);this.setStat('amour',pet.amour||30);
    },

    setStat:function(name,value){
        var pct=Math.max(0,Math.min(100,value));
        var bar=document.getElementById('stat-'+name);var txt=document.getElementById('pct-'+name);
        if(bar){bar.style.width=pct+'%';bar.className='sp-fill '+(pct>=60?'sp-green':pct>=30?'sp-yellow':'sp-red');if(name==='amour')bar.className='sp-fill '+(pct>=40?'sp-pink':'sp-red');if(name==='hygiene')bar.className='sp-fill '+(pct>=40?'sp-blue':'sp-red');}
        if(txt)txt.textContent=Math.round(pct)+'%';
    },

    _currentSpriteSrc:'',

    updatePet:function(pet){
        var sprite=Engine.getSpriteForPet(pet);
        var mood=Engine.getMood(pet);
        this.els.pet.className='pet stage-'+pet.stade;
        // Only change sprite src if actually different (prevents blinking)
        if(this._currentSpriteSrc!==sprite){
            this._currentSpriteSrc=sprite;
            this.els.petSprite.src=sprite;
        }
        var stage=Engine.STAGES[pet.stade];
        this.els.pet.style.width=stage.size+'px';this.els.pet.style.height=stage.size+'px';
        var anim='idle';
        if(mood==='sleeping')anim='sleeping';else if(mood==='malade')anim='sick';
        else if(mood==='triste'||mood==='faim'||mood==='fatigue'||mood==='sale')anim='sad';
        this.els.pet.classList.add(anim);
        this.els.pet.classList.toggle('flip',this.walkDir<0);
    },

    updateSleepState:function(pet){
        var pw=this.els.petWrapper;var zzz=document.getElementById('sleep-zzz');
        if(pet.isSleeping){pw.classList.add('in-building');if(zzz)zzz.classList.remove('hidden');}
        else{pw.classList.remove('in-building');if(zzz)zzz.classList.add('hidden');}
    },

    // Bouton dormir → stop quand sieste active
    updateSleepButton:function(pet){
        var btn=document.getElementById('btn-dormir');if(!btn)return;
        if(pet.isSleeping){
            btn.classList.add('sleep-active');
            btn.querySelector('.act-icon').textContent='⏹️';
            btn.querySelector('.act-label').textContent='Réveiller';
            btn.classList.remove('on-cooldown');
        } else {
            btn.classList.remove('sleep-active');
            btn.querySelector('.act-icon').textContent='💤';
            btn.querySelector('.act-label').textContent='Dormir';
        }
    },

    updateMoodEmoji:function(pet){
        var el=this.els.moodEmoji;if(!el)return;
        var moodKey='',emoji='';
        if(pet.isSleeping){moodKey='sleep';emoji='💤';}
        else if((pet.poops||0)>=2){moodKey='poop';emoji='🤢';}
        else if((pet.hygiene||50)<25){moodKey='dirty';emoji='🪥';}
        else if((pet.amour||30)<20){moodKey='lonely';emoji='💔';}
        else if((pet.faim||50)<20){moodKey='hungry';emoji='😫';}
        else if((pet.energie||50)<20){moodKey='tired';emoji='😴';}
        else if((pet.sante||50)<25){moodKey='sick';emoji='🤒';}
        else{moodKey='ok';emoji='';}
        if(moodKey===this._lastMoodKey)return;
        this._lastMoodKey=moodKey;
        if(!emoji){el.classList.add('hidden');return;}
        el.textContent=emoji;el.style.left='58%';el.style.bottom='48%';el.classList.remove('hidden');
    },

    updatePoops:function(pet){
        var c=this.els.poopContainer;if(!c)return;
        var tp=pet.poops||0,tpi=pet.pipis||0;
        var cp=c.querySelectorAll('.poop').length,cpi=c.querySelectorAll('.pipi').length;
        while(cp<tp){var p=document.createElement('div');p.className='poop';p.innerHTML='💩';p.style.left=(12+Math.random()*65)+'%';
        for(var f=0;f<2;f++){var fl=document.createElement('span');fl.className='fly';fl.textContent='🪰';fl.style.animationDelay=(Math.random()*2)+'s';fl.style.setProperty('--fly-dx',(Math.random()*30-15)+'px');fl.style.setProperty('--fly-dy',(Math.random()*20-15)+'px');p.appendChild(fl);}
        c.appendChild(p);cp++;}
        while(cp>tp){var pp=c.querySelector('.poop');if(pp)pp.remove();cp--;}
        while(cpi<tpi){var pi=document.createElement('div');pi.className='pipi';pi.textContent='💧';pi.style.left=(10+Math.random()*70)+'%';c.appendChild(pi);cpi++;}
        while(cpi>tpi){var pp2=c.querySelector('.pipi');if(pp2)pp2.remove();cpi--;}
    },

    tickMovement:function(pet){
        if(!pet||pet.isSleeping||pet.estMort)return;
        if(Math.random()<0.02)this.walkTarget=15+Math.random()*70;
        var dx=this.walkTarget-this.currentPetX;
        if(Math.abs(dx)>2){this.walkDir=dx>0?1:-1;this.currentPetX+=this.walkDir*0.3;this.els.petWrapper.style.left=this.currentPetX+'%';
        if(!this.els.pet.classList.contains('walking')){this.els.pet.classList.remove('idle');this.els.pet.classList.add('walking');}}
        else{if(this.els.pet.classList.contains('walking')){this.els.pet.classList.remove('walking');this.els.pet.classList.add('idle');}if(Math.random()<0.005)this.walkTarget=15+Math.random()*70;}
        this.els.pet.classList.toggle('flip',this.walkDir<0);
    },

    showEmotion:function(emoji,dur){this.els.emotionIcon.textContent=emoji;this.els.emotionBubble.classList.remove('hidden');this.els.emotionBubble.style.animation='none';void this.els.emotionBubble.offsetHeight;this.els.emotionBubble.style.animation='';var self=this;setTimeout(function(){self.els.emotionBubble.classList.add('hidden');},dur||1500);},
    showSpeech:function(text){this.els.speechText.textContent=text;this.els.speechBubble.classList.remove('hidden');this.els.speechBubble.style.animation='none';void this.els.speechBubble.offsetHeight;this.els.speechBubble.style.animation='';var self=this;setTimeout(function(){self.els.speechBubble.classList.add('hidden');},3000);},
    showFloatingItem:function(emoji,x,y){var item=document.createElement('div');item.className='float-item';item.textContent=emoji;item.style.left=(x||50)+'%';item.style.top=(y||60)+'%';this.els.sceneItems.appendChild(item);setTimeout(function(){item.remove();},1500);},
    showSleepZ:function(){var z=document.createElement('div');z.className='zzz';z.textContent='Z';z.style.left=(this.currentPetX+5)+'%';z.style.top='35%';z.style.fontSize=(14+Math.random()*12)+'px';this.els.sceneItems.appendChild(z);setTimeout(function(){z.remove();},2000);},
    showHeartAt:function(x,y){var h=document.createElement('div');h.className='touch-heart';h.textContent='💕';h.style.left=x+'px';h.style.top=y+'px';document.body.appendChild(h);setTimeout(function(){h.remove();},1000);},
    showCoinAt:function(x,y){var c=document.createElement('div');c.className='coin-float';c.textContent='+1 🪙';c.style.left=x+'px';c.style.top=y+'px';document.body.appendChild(c);setTimeout(function(){c.remove();},1200);},
    showBigSyringe:function(){var s=document.createElement('div');s.className='big-syringe';s.textContent='💉';s.style.left='50%';s.style.top='35%';this.els.sceneItems.appendChild(s);setTimeout(function(){s.remove();},1500);},
    showBigBroom:function(){var b=document.createElement('div');b.className='big-broom';b.textContent='🧹';b.style.left='50%';b.style.bottom='15%';this.els.sceneItems.appendChild(b);setTimeout(function(){b.remove();},1200);},
    showHeavyShower:function(){var self=this;var petRect=this.els.petWrapper.getBoundingClientRect();var sceneRect=this.els.scene.getBoundingClientRect();var petCenterPct=((petRect.left+petRect.width/2-sceneRect.left)/sceneRect.width*100);var petTopPct=((petRect.top-sceneRect.top)/sceneRect.height*100)-5;for(var i=0;i<40;i++){(function(i){setTimeout(function(){var d=document.createElement('div');d.className='shower-drop';d.textContent='💧';d.style.fontSize=(10+Math.random()*8)+'px';d.style.left=(petCenterPct-8+Math.random()*16)+'%';d.style.top=Math.max(0,petTopPct-5)+'%';d.style.animationDuration=(.4+Math.random()*.3)+'s';self.els.sceneItems.appendChild(d);setTimeout(function(){d.remove();},900);},i*60);})(i);}},
    petEatAnimation:function(){this.els.pet.classList.remove('idle','walking');this.els.pet.classList.add('eating');var self=this;setTimeout(function(){self.els.pet.classList.remove('eating');self.els.pet.classList.add('idle');},2000);},
    petHappyAnimation:function(){this.els.pet.classList.remove('idle','walking','sad');this.els.pet.classList.add('happy');var self=this;setTimeout(function(){self.els.pet.classList.remove('happy');self.els.pet.classList.add('idle');},1200);},
    showHenVisit:function(henSprite,petSize){var w=document.getElementById('hen-wrapper'),img=document.getElementById('hen-sprite');img.src=henSprite;var sz=petSize||120;img.style.width=sz+'px';img.style.height=sz+'px';w.classList.remove('hidden');w.style.animation='none';void w.offsetHeight;w.style.animation='';var self=this;for(var i=0;i<8;i++){(function(i){setTimeout(function(){var h=document.createElement('div');h.className='float-item';h.textContent=['💕','❤️','💗','💖'][Math.floor(Math.random()*4)];h.style.left=(35+Math.random()*30)+'%';h.style.top=(30+Math.random()*20)+'%';self.els.sceneItems.appendChild(h);setTimeout(function(){h.remove();},1500);},i*400);})(i);}setTimeout(function(){w.classList.add('hidden');},5000);},
    showEvolution:function(old,nw){document.getElementById('evo-old').textContent=old.emoji;document.getElementById('evo-new').textContent=nw.emoji;document.getElementById('evo-desc').textContent=nw.nom;document.getElementById('evolution-screen').classList.remove('hidden');this.haptic('heavy');},
    hideEvolution:function(){document.getElementById('evolution-screen').classList.add('hidden');},
    showDeath:function(pet){var age=Engine.getAge(pet);document.getElementById('death-desc').textContent=pet.nom+' a vécu '+age.days+'j. Cause: '+(pet.causeMort||'?');document.getElementById('death-stats').innerHTML='<p style="color:#8899bb">XP: '+pet.experience+' · 🪙 '+pet.coins+'</p>';document.getElementById('death-screen').classList.remove('hidden');},
    hideDeath:function(){document.getElementById('death-screen').classList.add('hidden');},
    toast:function(msg){var el=document.getElementById('toast');document.getElementById('toast-text').textContent=msg;el.classList.remove('hidden');el.style.animation='none';void el.offsetHeight;el.style.animation='';clearTimeout(this._tt);var self=this;this._tt=setTimeout(function(){el.classList.add('hidden');},2500);},
    haptic:function(type){try{if(window.Telegram&&window.Telegram.WebApp&&window.Telegram.WebApp.HapticFeedback)window.Telegram.WebApp.HapticFeedback.impactOccurred(type||'light');}catch(e){}},
    renderFoodGrid:function(){return Engine.FOODS.map(function(f){return'<div class="food-item" data-food="'+f.id+'"><span class="food-icon">'+f.emoji+'</span><span class="food-name">'+f.nom+'</span><span class="food-stats">+'+f.faim+'🌾 +'+f.bonheur+'😊</span></div>';}).join('');},
    renderStatsDetail:function(pet){
        var sc=function(v){return v>=70?'#44cc66':v>=40?'#f0c040':'#e74c3c';};
        var rows=[{e:'🌾',n:'Faim',v:pet.faim},{e:'😊',n:'Bonheur',v:pet.bonheur},{e:'⚡',n:'Énergie',v:pet.energie},{e:'❤️',n:'Santé',v:pet.sante},{e:'🧼',n:'Hygiène',v:pet.hygiene||50},{e:'🧠',n:'Intellect',v:pet.intellect||30},{e:'💕',n:'Amour',v:pet.amour||30}];
        var html=rows.map(function(s){return'<div class="stat-row"><span class="stat-emoji">'+s.e+'</span><div class="stat-info"><div class="stat-name">'+s.n+'</div><div class="stat-value" style="color:'+sc(s.v)+'">'+Math.round(s.v)+'%</div><div class="stat-bar-big"><div class="stat-bar-fill" style="width:'+s.v+'%;background:'+sc(s.v)+'"></div></div></div></div>';}).join('');
        var stage=Engine.STAGES[pet.stade],age=Engine.getAge(pet),evo=Engine.getTimeToEvolve(pet);
        html+='<div class="stats-section-title">Infos</div><div class="stats-info-grid">';
        html+='<div class="stats-info-card"><div class="label">Stade</div><div class="value">'+stage.emoji+'</div></div>';
        html+='<div class="stats-info-card"><div class="label">Âge</div><div class="value">'+age.days+'j '+age.hours+'h</div></div>';
        html+='<div class="stats-info-card"><div class="label">XP</div><div class="value">'+pet.experience+'</div></div>';
        html+='<div class="stats-info-card"><div class="label">Évolution</div><div class="value">'+(evo!==null?Math.ceil(evo)+'h':'🏆')+'</div></div></div>';
        return html;
    }
};
