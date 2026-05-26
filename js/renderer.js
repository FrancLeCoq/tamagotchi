var Renderer={
    els:{},walkDir:1,walkTarget:50,currentPetX:50,
    _lastMood:null,_lastSprite:'',_lastStade:-1,_lastAnim:'',

    init:function(){
        var g=function(id){return document.getElementById(id)};
        this.els={
            pet:g('pet'),petSprite:g('pet-sprite'),petWrapper:g('pet-wrapper'),
            scene:g('scene'),sceneItems:g('scene-items'),poopContainer:g('poop-container'),
            emotionBubble:g('emotion-bubble'),emotionIcon:g('emotion-icon'),
            speechBubble:g('speech-bubble'),speechText:g('speech-text'),
            moodEmoji:g('mood-emoji')
        };
        if(this.els.pet) this.els.pet.className='pet idle';
    },

    update:function(pet){
        if(!pet)return;
        this.updateHUD(pet);
        this.updateStats(pet);
        this.updatePetSprite(pet);
        this.updatePoops(pet);
        this.updateSleepState(pet);
        this.updateMoodEmoji(pet);
        this.updateSleepButton(pet);
    },

    updateHUD:function(pet){
        var stage=Engine.STAGES[pet.stade];
        var el=document.getElementById('hud-stage');
        if(el&&el.textContent!==stage.nom) el.textContent=stage.nom;
        var lv=document.getElementById('hud-level');
        var lvText='Niveau '+Math.floor(pet.experience/50+1);
        if(lv&&lv.textContent!==lvText) lv.textContent=lvText;
        var coins=document.getElementById('hud-coins');
        var cText='🪙 '+pet.coins;
        if(coins&&coins.textContent!==cText) coins.textContent=cText;
        var dot=document.getElementById('alert-dot');
        if(dot) dot.classList.toggle('hidden',!Engine.hasAlerts(pet));
        var sprite=Engine.getSpriteForPet(pet);
        var avi=document.getElementById('tb-avatar-img');
        if(avi&&this._lastSprite!==sprite) avi.src=sprite;
        this.updateXPRing(pet);
    },

    updateXPRing:function(pet){
        var ring=document.getElementById('xp-ring');if(!ring)return;
        var stage=Engine.STAGES[pet.stade];
        var pct=stage.heures?Math.min(1,(Date.now()-pet.derniereEvolution)/3600000/stage.heures):1;
        ring.style.strokeDashoffset=(132*(1-pct)).toFixed(1);
    },

    updateStats:function(pet){
        this._setStat('faim',pet.faim,'green');
        this._setStat('bonheur',pet.bonheur,'green');
        this._setStat('energie',pet.energie,'yellow');
        this._setStat('sante',pet.sante,'green');
        this._setStat('hygiene',pet.hygiene||50,'blue');
        this._setStat('amour',pet.amour||30,'pink');
    },
    _setStat:function(name,value,baseColor){
        var pct=Math.max(0,Math.min(100,value));
        var bar=document.getElementById('stat-'+name);
        if(bar) bar.style.width=pct+'%';
        var txt=document.getElementById('pct-'+name);
        if(txt) txt.textContent=Math.round(pct)+'%';
    },

    updatePetSprite:function(pet){
        var p=this.els.pet;if(!p)return;
        var stage=Engine.STAGES[pet.stade];
        var sprite=Engine.getSpriteForPet(pet);

        if(this._lastSprite!==sprite){
            this._lastSprite=sprite;
            this.els.petSprite.src=sprite;
        }

        if(this._lastStade!==pet.stade){
            this._lastStade=pet.stade;
            p.style.width=stage.size+'px';
            p.style.height=stage.size+'px';
        }

        var mood=Engine.getMood(pet);
        var targetAnim='idle';
        if(mood==='sleeping') targetAnim='sleeping';
        else if(mood==='malade') targetAnim='sick';
        else if(mood==='triste'||mood==='faim'||mood==='fatigue'||mood==='sale') targetAnim='sad';

        if(this._lastAnim!==targetAnim){
            ['idle','walking','sleeping','sick','sad','eating','happy'].forEach(function(cls){p.classList.remove(cls);});
            p.classList.add(targetAnim);
            this._lastAnim=targetAnim;
        }
    },

    updateSleepState:function(pet){
        var pw=this.els.petWrapper;var zzz=document.getElementById('sleep-zzz');
        if(pet.isSleeping){pw.classList.add('in-building');if(zzz)zzz.classList.remove('hidden');}
        else{pw.classList.remove('in-building');if(zzz)zzz.classList.add('hidden');}
    },

    updateSleepButton:function(pet){
        var btn=document.getElementById('btn-dormir');if(!btn)return;
        var icon=btn.querySelector('.act-icon'),label=btn.querySelector('.act-label');
        if(pet.isSleeping){
            btn.classList.add('sleep-active');btn.classList.remove('on-cooldown');
            if(icon)icon.textContent='⏹️';if(label)label.textContent='Réveiller';
        }else{
            btn.classList.remove('sleep-active');
            if(icon)icon.textContent='💤';if(label)label.textContent='Dormir';
        }
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
        if(key===this._lastMood)return;
        this._lastMood=key;
        if(!emoji){el.classList.add('hidden');return;}
        el.textContent=emoji;el.style.left='58%';el.style.bottom='48%';el.classList.remove('hidden');
    },

    updatePoops:function(pet){
        var c=this.els.poopContainer;if(!c)return;
        var tp=pet.poops||0,cp=c.querySelectorAll('.poop').length;
        while(cp<tp){var p=document.createElement('div');p.className='poop';p.textContent='💩';p.style.left=(12+Math.random()*65)+'%';c.appendChild(p);cp++;}
        while(cp>tp){var pp=c.querySelector('.poop');if(pp)pp.remove();cp--;}
    },

    tickMovement:function(pet){
        if(!pet||pet.isSleeping||pet.estMort)return;
        if(Math.random()<0.02)this.walkTarget=15+Math.random()*70;
        var dx=this.walkTarget-this.currentPetX;
        var priorityAnims=['sleeping','sick','sad','eating','happy'];
        var isPriority=priorityAnims.indexOf(this._lastAnim)>=0;

        if(Math.abs(dx)>2){
            this.walkDir=dx>0?1:-1;
            this.currentPetX+=this.walkDir*0.3;
            this.els.petWrapper.style.left=this.currentPetX+'%';
            if(!isPriority && this._lastAnim!=='walking'){
                ['idle','walking','sleeping','sick','sad','eating','happy'].forEach(function(cls){this.els.pet.classList.remove(cls);},this);
                this.els.pet.classList.add('walking');
                this._lastAnim='walking';
            }
        }else{
            if(!isPriority && this._lastAnim==='walking'){
                ['idle','walking','sleeping','sick','sad','eating','happy'].forEach(function(cls){this.els.pet.classList.remove(cls);},this);
                this.els.pet.classList.add('idle');
                this._lastAnim='idle';
            }
            if(Math.random()<0.005)this.walkTarget=15+Math.random()*70;
        }
        this.els.pet.classList.toggle('flip',this.walkDir<0);
    },

    showEmotion:function(emoji,dur){this.els.emotionIcon.textContent=emoji;this.els.emotionBubble.classList.remove('hidden');var s=this;setTimeout(function(){s.els.emotionBubble.classList.add('hidden');},dur||1500);},
    showSpeech:function(text){this.els.speechText.textContent=text;this.els.speechBubble.classList.remove('hidden');var s=this;setTimeout(function(){s.els.speechBubble.classList.add('hidden');},3000);},
    showFloatingItem:function(emoji,x,y){var d=document.createElement('div');d.className='float-item';d.textContent=emoji;d.style.left=(x||50)+'%';d.style.top=(y||60)+'%';this.els.sceneItems.appendChild(d);setTimeout(function(){d.remove();},1500);},
    showSleepZ:function(){var z=document.createElement('div');z.className='zzz';z.textContent='Z';z.style.left=(this.currentPetX+5)+'%';z.style.top='35%';this.els.sceneItems.appendChild(z);setTimeout(function(){z.remove();},2000);},
    showHeartAt:function(x,y){var h=document.createElement('div');h.className='touch-heart';h.textContent='💕';h.style.left=x+'px';h.style.top=y+'px';document.body.appendChild(h);setTimeout(function(){h.remove();},1000);},
    showCoinAt:function(x,y){var c=document.createElement('div');c.className='coin-float';c.textContent='+1 🪙';c.style.left=x+'px';c.style.top=y+'px';document.body.appendChild(c);setTimeout(function(){c.remove();},1200);},
    showBigSyringe:function(){var s=document.createElement('div');s.className='big-syringe';s.textContent='💉';s.style.left='50%';s.style.top='35%';this.els.sceneItems.appendChild(s);setTimeout(function(){s.remove();},1500);},
    showBigBroom:function(){var b=document.createElement('div');b.className='big-broom';b.textContent='🧹';b.style.left='50%';b.style.bottom='15%';this.els.sceneItems.appendChild(b);setTimeout(function(){b.remove();},1200);},
    showHeavyShower:function(){var self=this;var pw=this.els.petWrapper;var sc=this.els.scene;if(!pw||!sc)return;var pr=pw.getBoundingClientRect(),sr=sc.getBoundingClientRect();var cx=((pr.left+pr.width/2-sr.left)/sr.width*100);var ty=((pr.top-sr.top)/sr.height*100)-5;for(var i=0;i<40;i++){(function(i){setTimeout(function(){var d=document.createElement('div');d.className='shower-drop';d.textContent='💧';d.style.left=(cx-8+Math.random()*16)+'%';d.style.top=Math.max(0,ty)+'%';self.els.sceneItems.appendChild(d);setTimeout(function(){d.remove();},900);},i*60);})(i);}},
    petEatAnimation:function(){var p=this.els.pet;['idle','walking','sleeping','sick','sad','happy'].forEach(function(cls){p.classList.remove(cls);});p.classList.add('eating');this._lastAnim='eating';var s=this;setTimeout(function(){p.classList.remove('eating');p.classList.add('idle');s._lastAnim='idle';},2000);},
    petHappyAnimation:function(){var p=this.els.pet;['idle','walking','sleeping','sick','sad','eating'].forEach(function(cls){p.classList.remove(cls);});p.classList.add('happy');this._lastAnim='happy';var s=this;setTimeout(function(){p.classList.remove('happy');p.classList.add('idle');s._lastAnim='idle';},1200);},
    showHenVisit:function(henSprite,petSize){var w=document.getElementById('hen-wrapper'),img=document.getElementById('hen-sprite');img.src=henSprite;var sz=petSize||120;img.style.width=sz+'px';img.style.height=sz+'px';w.classList.remove('hidden');var s=this;for(var i=0;i<6;i++){(function(i){setTimeout(function(){var h=document.createElement('div');h.className='float-item';h.textContent='💕';h.style.left=(35+Math.random()*30)+'%';h.style.top=(30+Math.random()*20)+'%';s.els.sceneItems.appendChild(h);setTimeout(function(){h.remove();},1500);},i*500);})(i);}setTimeout(function(){w.classList.add('hidden');},5000);},
    showEvolution:function(o,n){document.getElementById('evo-old').textContent=o.emoji;document.getElementById('evo-new').textContent=n.emoji;document.getElementById('evo-desc').textContent=n.nom;document.getElementById('evolution-screen').classList.remove('hidden');},
    hideEvolution:function(){document.getElementById('evolution-screen').classList.add('hidden');},
    showDeath:function(pet){var age=Engine.getAge(pet);document.getElementById('death-desc').textContent=pet.nom+' a vécu '+age.days+'j. Cause: '+(pet.causeMort||'?');document.getElementById('death-stats').innerHTML='<p style="color:#8899bb">XP: '+pet.experience+' · 🪙 '+pet.coins+'</p>';document.getElementById('death-screen').classList.remove('hidden');},
    hideDeath:function(){document.getElementById('death-screen').classList.add('hidden');},
    toast:function(msg){var el=document.getElementById('toast'),tx=document.getElementById('toast-text');tx.textContent=msg;el.classList.remove('hidden');clearTimeout(this._tt);this._tt=setTimeout(function(){el.classList.add('hidden');},2500);},
    haptic:function(){},
    renderFoodGrid:function(){return Engine.FOODS.map(function(f){return'<div class="food-item" data-food="'+f.id+'"><span class="food-icon">'+f.emoji+'</span><span class="food-name">'+f.nom+'</span><span class="food-stats">+'+f.faim+'🌾</span></div>';}).join('');},
    renderStatsDetail:function(pet){
        var sc=function(v){return v>=70?'#44cc66':v>=40?'#f0c040':'#e74c3c';};
        var rows=[{e:'🌾',n:'Faim',v:pet.faim},{e:'😊',n:'Bonheur',v:pet.bonheur},{e:'⚡',n:'Énergie',v:pet.energie},{e:'❤️',n:'Santé',v:pet.sante},{e:'🧼',n:'Hygiène',v:pet.hygiene||50},{e:'🧠',n:'Intellect',v:pet.intellect||30},{e:'💕',n:'Amour',v:pet.amour||30}];
        var html=rows.map(function(s){return'<div class="stat-row"><span class="stat-emoji">'+s.e+'</span><div class="stat-info"><div class="stat-name">'+s.n+'</div><div class="stat-value" style="color:'+sc(s.v)+'">'+Math.round(s.v)+'%</div><div class="stat-bar-big"><div class="stat-bar-fill" style="width:'+s.v+'%;background:'+sc(s.v)+'"></div></div></div></div>';}).join('');
        var stage=Engine.STAGES[pet.stade],age=Engine.getAge(pet),evo=Engine.getTimeToEvolve(pet);
        html+='<div class="stats