var Renderer = {
    els:{},walkDir:1,walkTarget:50,currentPetX:50,animState:'idle',

    init:function(){
        this.els={
            pet:document.getElementById('pet'),
            petSprite:document.getElementById('pet-sprite'),
            petWrapper:document.getElementById('pet-wrapper'),
            scene:document.getElementById('scene'),
            sceneBg:document.getElementById('scene-bg'),
            sceneOverlay:document.getElementById('scene-overlay'),
            sceneItems:document.getElementById('scene-items'),
            poopContainer:document.getElementById('poop-container'),
            emotionBubble:document.getElementById('emotion-bubble'),
            emotionIcon:document.getElementById('emotion-icon'),
            speechBubble:document.getElementById('speech-bubble'),
            speechText:document.getElementById('speech-text'),
            statFaim:document.getElementById('stat-faim'),
            statBonheur:document.getElementById('stat-bonheur'),
            statEnergie:document.getElementById('stat-energie'),
            statSante:document.getElementById('stat-sante'),
        };
    },

    update:function(pet){
        if(!pet) return;
        this.updateHUD(pet);
        this.updateStats(pet);
        this.updatePet(pet);
        this.updatePoops(pet);
    },

    updateHUD:function(pet){
        var stage=Engine.STAGES[pet.stade];
        var el=document.getElementById('hud-stage');
        if(el) el.textContent=stage.emoji+' '+stage.nom;
        var dot=document.getElementById('alert-dot');
        if(dot) dot.classList.toggle('hidden',!Engine.hasAlerts(pet));
        var coins=document.getElementById('hud-coins');
        if(coins) coins.textContent='🪙 '+pet.coins;
        var badge=document.getElementById('housing-badge');
        if(badge) badge.textContent=Engine.HOUSING[pet.housingLevel||0].emoji;
    },

    updateStats:function(pet){
        this.setBar(this.els.statFaim,pet.faim);
        this.setBar(this.els.statBonheur,pet.bonheur);
        this.setBar(this.els.statEnergie,pet.energie);
        this.setBar(this.els.statSante,pet.sante);
        this.setBar(document.getElementById('stat-hygiene'),pet.hygiene||50);
        this.setBar(document.getElementById('stat-intellect'),pet.intellect||30);
        this.setBar(document.getElementById('stat-amour'),pet.amour||30);
    },

    setBar:function(el,value){
        if(!el) return;
        var pct=Math.max(0,Math.min(100,value));
        el.style.width=pct+'%';
        el.classList.remove('warning','danger');
        if(pct<15) el.classList.add('danger');
        else if(pct<40) el.classList.add('warning');
    },

    updatePet:function(pet){
        var stage=Engine.STAGES[pet.stade];
        var mood=Engine.getMood(pet);
        this.els.pet.className='pet stage-'+pet.stade;
        // Swap sprite
        var src=stage.sprite;
        if(this.els.petSprite.src.indexOf(src)===-1){
            this.els.petSprite.src=src;
        }
        // Dynamic size
        this.els.pet.style.width=stage.size+'px';
        this.els.pet.style.height=stage.size+'px';
        // Animation
        var anim='idle';
        if(mood==='sleeping') anim='sleeping';
        else if(mood==='malade') anim='sick';
        else if(mood==='triste'||mood==='faim'||mood==='fatigue'||mood==='sale') anim='sad';
        this.els.pet.classList.add(anim);
        this.els.pet.classList.toggle('flip',this.walkDir<0);
    },

    updatePoops:function(pet){
        var container=this.els.poopContainer;
        if(!container) return;
        var totalPoops=pet.poops||0;
        var totalPipis=pet.pipis||0;
        var curPoops=container.querySelectorAll('.poop').length;
        var curPipis=container.querySelectorAll('.pipi').length;
        while(curPoops<totalPoops){
            var p=document.createElement('div');p.className='poop';p.innerHTML='💩';
            p.style.left=(12+Math.random()*65)+'%';
            for(var f=0;f<2;f++){
                var fly=document.createElement('span');fly.className='fly';fly.textContent='🪰';
                fly.style.animationDelay=(Math.random()*2)+'s';
                fly.style.setProperty('--fly-dx',(Math.random()*30-15)+'px');
                fly.style.setProperty('--fly-dy',(Math.random()*20-15)+'px');
                p.appendChild(fly);
            }
            container.appendChild(p);curPoops++;
        }
        while(curPoops>totalPoops){var pp=container.querySelector('.poop');if(pp)pp.remove();curPoops--;}
        while(curPipis<totalPipis){
            var pi=document.createElement('div');pi.className='pipi';pi.textContent='💧';
            pi.style.left=(10+Math.random()*70)+'%';container.appendChild(pi);curPipis++;
        }
        while(curPipis>totalPipis){var pp2=container.querySelector('.pipi');if(pp2)pp2.remove();curPipis--;}
    },

    tickMovement:function(pet){
        if(!pet||pet.isSleeping||pet.estMort) return;
        if(Math.random()<0.02) this.walkTarget=15+Math.random()*70;
        var dx=this.walkTarget-this.currentPetX;
        if(Math.abs(dx)>2){
            this.walkDir=dx>0?1:-1;
            this.currentPetX+=this.walkDir*0.3;
            this.els.petWrapper.style.left=this.currentPetX+'%';
            if(!this.els.pet.classList.contains('walking')){
                this.els.pet.classList.remove('idle');
                this.els.pet.classList.add('walking');
            }
        } else {
            if(this.els.pet.classList.contains('walking')){
                this.els.pet.classList.remove('walking');
                this.els.pet.classList.add('idle');
            }
            if(Math.random()<0.005) this.walkTarget=15+Math.random()*70;
        }
        this.els.pet.classList.toggle('flip',this.walkDir<0);
    },

    showEmotion:function(emoji,dur){
        this.els.emotionIcon.textContent=emoji;
        this.els.emotionBubble.classList.remove('hidden');
        this.els.emotionBubble.style.animation='none';
        void this.els.emotionBubble.offsetHeight;
        this.els.emotionBubble.style.animation='';
        var self=this;setTimeout(function(){self.els.emotionBubble.classList.add('hidden');},dur||1500);
    },

    showSpeech:function(text,dur){
        this.els.speechText.textContent=text;
        this.els.speechBubble.classList.remove('hidden');
        this.els.speechBubble.style.animation='none';
        void this.els.speechBubble.offsetHeight;
        this.els.speechBubble.style.animation='';
        var self=this;setTimeout(function(){self.els.speechBubble.classList.add('hidden');},dur||3000);
    },

    showFloatingItem:function(emoji,x,y){
        var item=document.createElement('div');item.className='float-item';item.textContent=emoji;
        item.style.left=(x||50)+'%';item.style.top=(y||60)+'%';
        this.els.sceneItems.appendChild(item);
        setTimeout(function(){item.remove();},1500);
    },

    showSleepZ:function(){
        var z=document.createElement('div');z.className='zzz';z.textContent='Z';
        z.style.left=(this.currentPetX+5)+'%';z.style.top='35%';
        z.style.fontSize=(14+Math.random()*12)+'px';
        this.els.sceneItems.appendChild(z);
        setTimeout(function(){z.remove();},2000);
    },

    showHeartAt:function(x,y){
        var h=document.createElement('div');h.className='touch-heart';h.textContent='💕';
        h.style.left=x+'px';h.style.top=y+'px';
        document.body.appendChild(h);setTimeout(function(){h.remove();},1000);
    },

    showCoinAt:function(x,y){
        var c=document.createElement('div');c.className='coin-float';c.textContent='+1 🪙';
        c.style.left=x+'px';c.style.top=y+'px';
        document.body.appendChild(c);setTimeout(function(){c.remove();},1200);
    },

    petEatAnimation:function(){
        this.els.pet.classList.remove('idle','walking');this.els.pet.classList.add('eating');
        var self=this;setTimeout(function(){self.els.pet.classList.remove('eating');self.els.pet.classList.add('idle');},2000);
    },
    petHappyAnimation:function(){
        this.els.pet.classList.remove('idle','walking','sad');this.els.pet.classList.add('happy');
        var self=this;setTimeout(function(){self.els.pet.classList.remove('happy');self.els.pet.classList.add('idle');},1200);
    },
    showShowerAnimation:function(){
        var self=this;
        for(var i=0;i<15;i++){
            (function(i){setTimeout(function(){
                var d=document.createElement('div');d.className='shower-drop';d.textContent='💧';
                d.style.left=(self.currentPetX-8+Math.random()*16)+'%';d.style.top='15%';
                self.els.sceneItems.appendChild(d);setTimeout(function(){d.remove();},1200);
            },i*120);})(i);
        }
    },
    showHenVisit:function(henSprite,petSize){
        var wrapper=document.getElementById('hen-wrapper');
        var img=document.getElementById('hen-sprite');
        img.src=henSprite;
        var sz=Math.max(60,(petSize||100)-20);
        img.style.width=sz+'px';img.style.height=sz+'px';
        wrapper.classList.remove('hidden');
        wrapper.style.animation='none';void wrapper.offsetHeight;wrapper.style.animation='';
        var self=this;
        for(var i=0;i<8;i++){
            (function(i){setTimeout(function(){
                var h=document.createElement('div');h.className='float-item';
                h.textContent=['💕','❤️','💗','💖'][Math.floor(Math.random()*4)];
                h.style.left=(35+Math.random()*30)+'%';h.style.top=(30+Math.random()*20)+'%';
                self.els.sceneItems.appendChild(h);setTimeout(function(){h.remove();},1500);
            },i*400);})(i);
        }
        setTimeout(function(){wrapper.classList.add('hidden');},5000);
    },

    showEvolution:function(oldStage,newStage){
        document.getElementById('evo-old').textContent=oldStage.emoji;
        document.getElementById('evo-new').textContent=newStage.emoji;
        document.getElementById('evo-desc').textContent=newStage.nom;
        document.getElementById('evolution-screen').classList.remove('hidden');
        this.haptic('heavy');
    },
    hideEvolution:function(){document.getElementById('evolution-screen').classList.add('hidden');},
    showDeath:function(pet){
        var age=Engine.getAge(pet);var stage=Engine.STAGES[pet.stade];
        document.getElementById('death-desc').textContent=pet.nom+' a vécu '+age.days+'j. Cause: '+(pet.causeMort||'?');
        document.getElementById('death-stats').innerHTML='<p style="color:#888">XP: '+pet.experience+' · Coins: '+pet.coins+'</p>';
        document.getElementById('death-screen').classList.remove('hidden');
    },
    hideDeath:function(){document.getElementById('death-screen').classList.add('hidden');},

    toast:function(msg,dur){
        var el=document.getElementById('toast');
        document.getElementById('toast-text').textContent=msg;
        el.classList.remove('hidden');el.style.animation='none';void el.offsetHeight;el.style.animation='';
        clearTimeout(this._tt);var self=this;
        this._tt=setTimeout(function(){el.classList.add('hidden');},dur||2500);
    },

    haptic:function(type){
        try{if(window.Telegram&&window.Telegram.WebApp&&window.Telegram.WebApp.HapticFeedback)window.Telegram.WebApp.HapticFeedback.impactOccurred(type||'light');}catch(e){}
    },

    renderFoodGrid:function(){
        return Engine.FOODS.map(function(f){
            return '<div class="food-item" data-food="'+f.id+'"><span class="food-icon">'+f.emoji+'</span><span class="food-name">'+f.nom+'</span><span class="food-stats">+'+f.faim+'🌾 +'+f.bonheur+'😊</span></div>';
        }).join('');
    },

    renderStatsDetail:function(pet){
        var statColor=function(v){return v>=70?'#2ecc71':v>=40?'#f39c12':'#e74c3c';};
        var rows=[
            {e:'🌾',n:'Faim',v:pet.faim},{e:'😊',n:'Bonheur',v:pet.bonheur},
            {e:'⚡',n:'Énergie',v:pet.energie},{e:'❤️',n:'Santé',v:pet.sante},
            {e:'🧼',n:'Hygiène',v:pet.hygiene||50},{e:'🧠',n:'Intellect',v:pet.intellect||30},
            {e:'💕',n:'Amour',v:pet.amour||30}
        ];
        var html=rows.map(function(s){
            return '<div class="stat-row"><span class="stat-emoji">'+s.e+'</span><div class="stat-info"><div class="stat-name">'+s.n+'</div><div class="stat-value" style="color:'+statColor(s.v)+'">'+Math.round(s.v)+'%</div><div class="stat-bar-big"><div class="stat-bar-fill" style="width:'+s.v+'%;background:'+statColor(s.v)+'"></div></div></div></div>';
        }).join('');
        var stage=Engine.STAGES[pet.stade],age=Engine.getAge(pet),evo=Engine.getTimeToEvolve(pet);
        html+='<div class="stats-section-title">Informations</div><div class="stats-info-grid">';
        html+='<div class="stats-info-card"><div class="label">Stade</div><div class="value">'+stage.emoji+'</div></div>';
        html+='<div class="stats-info-card"><div class="label">Âge</div><div class="value">'+age.days+'j '+age.hours+'h</div></div>';
        html+='<div class="stats-info-card"><div class="label">XP</div><div class="value">'+pet.experience+'</div></div>';
        html+='<div class="stats-info-card"><div class="label">Évolution</div><div class="value">'+(evo!==null?Math.ceil(evo)+'h':'🏆')+'</div></div>';
        html+='</div>';
        return html;
    }
};
