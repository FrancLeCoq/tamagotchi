// ═══════════════════════════════════════════════════════════
// FEATURES — Événements aléatoires, Quêtes journalières,
//            Journal de Francis, Impact météo
// ═══════════════════════════════════════════════════════════
var Features = {

    // ─── État persistant (stocké dans pet.features) ───
    ensure:function(pet){
        if(!pet.features){
            pet.features={
                quests:null, questDay:null, questDone:[],
                journal:[], lastJournalDay:-1,
                lastEventAt:Date.now(), eventCount:0,
                weatherBuff:null
            };
        }
        return pet.features;
    },

    // ═══════════════════════════════════════════════════════
    //  1. ÉVÉNEMENTS ALÉATOIRES
    // ═══════════════════════════════════════════════════════
    EVENTS:[
        {
            id:'renard', emoji:'🦊', titre:'Les renards attaquent !',
            intro:5, // 5s d'animation renards + sirène
            texte:'Les renards envahissent le poulailler ! Que fais-tu ?',
            choix:[
                {label:'Cacher Francis + appeler le chasseur 🔫', effet:function(p){
                    var cout=Math.floor((p.coins||0)*0.1);p.coins-=cout;
                    Features._runChasseur();
                    return 'Le chasseur sécurise le poulailler ! (-'+cout+' 🪙)';
                }},
                {label:'Cacher Francis sans payer 🙈', effet:function(p){
                    p.sante=0;p.faim=0;p.bonheur=0;p.estMort=true;p.causeMort='Dévoré par les renards';
                    return 'Francis a été dévoré par les renards... 💀';
                }}
            ]
        },
        {
            id:'tempete', emoji:'🌪️', titre:'Tempête !',
            intro:5, // 5s tornades + pluie + son
            texte:'Une tempête fait rage ! Que fais-tu ?',
            choix:[
                {label:'Cacher Francis 🏠', effet:function(p){
                    Features._runTempeteHide();
                    return 'Francis se met à l\'abri, le temps se calme...';
                }},
                {label:'Apprendre à voler 🪽', effet:function(p){
                    p.sante=0;p.estMort=true;p.causeMort='Emporté par la tempête';
                    return 'Francis s\'est envolé... et n\'est jamais revenu 💀';
                }}
            ]
        },
        {
            id:'malade', emoji:'🦠', titre:'PANDÉMIE — Covid19 !',
            intro:5, // 5s virus partout
            texte:'Une pandémie frappe le poulailler ! Vaccines-tu Francis ?',
            choix:[
                {label:'Vacciner 💉', effet:function(p){Features._runVaccin(p);return 'Vacciné ! Santé à 100% 💪';}},
                {label:'Pas de vaccin 🚫', effet:function(p){p.sante=0;return 'Catastrophe... Santé tombée à 0% !';}}
            ]
        },
        {
            id:'ami', emoji:'👩\u200d🌾', titre:'Visite de Chantal',
            intro:5, // 5s Chantal apparaît
            texte:'Chantal, son éleveuse, vient lui rendre visite !',
            choix:[
                {label:'Faire un câlin 🤗', effet:function(p){p.amour=Engine.cl((p.amour||0)+40);Features._runHearts();return '+40% amour 💕';}},
                {label:'Récupérer les œufs 🥚', effet:function(p){if(!p.farm)p.farm={};p.farm.pendingEggs=(p.farm.pendingEggs||0)+50;p.farm.totalEggs=(p.farm.totalEggs||0)+50;Features._runEggCoins();return '+50 œufs ! 🥚';}}
            ]
        }
    ],

    EVENT_INTERVAL: 3*60*1000, // ~3 min réelles entre événements possibles
    EVENT_CHANCE: 0.35,

    EVENT_QUOTA:{renard:1,tempete:2,malade:1,ami:2},
    maybeTriggerEvent:function(pet){
        if(!pet||pet.estMort||pet.isSleeping)return;
        if(App.paused)return;
        var f=this.ensure(pet);
        if(Date.now()-f.lastEventAt < this.EVENT_INTERVAL)return;
        f.lastEventAt=Date.now();
        if(Math.random()>this.EVENT_CHANCE)return;
        // Recurrence par statut (stade)
        if(f.eventStage!==pet.stade){f.eventStage=pet.stade;f.eventDone={};}
        if(!f.eventDone)f.eventDone={};
        // Événements encore disponibles pour ce stade
        var self=this;
        var avail=this.EVENTS.filter(function(e){
            var quota=self.EVENT_QUOTA[e.id]||1;
            return (f.eventDone[e.id]||0)<quota;
        });
        if(!avail.length)return;
        var ev=avail[Math.floor(Math.random()*avail.length)];
        f.eventDone[ev.id]=(f.eventDone[ev.id]||0)+1;
        this.showEvent(ev,pet);
    },

    forceEvent:function(pet,id){
        var ev=this.EVENTS.find(function(e){return e.id===id;});
        if(ev)this.showEvent(ev,pet);
    },
    // ─── Animations d'intro ───
    _animRenard:function(scene){
        if(!scene)return;
        var siren=document.createElement('div');siren.className='evt-siren';siren.id='evt-siren';scene.appendChild(siren);
        for(var i=0;i<14;i++){
            (function(idx){
                var fox=document.createElement('img');fox.src='assets/events/renards.png';fox.className='evt-fox evt-tmp';
                var fromLeft=Math.random()<.5;
                fox.style.cssText='position:absolute;width:'+(70+Math.random()*50)+'px;z-index:232;pointer-events:none;top:'+(30+Math.random()*55)+'%;left:'+(fromLeft?-20:115)+'%';
                scene.appendChild(fox);
                if(fox.animate)fox.animate([
                    {left:(fromLeft?-20:115)+'%',opacity:0},
                    {left:(15+Math.random()*70)+'%',opacity:1,offset:.4},
                    {left:(15+Math.random()*70)+'%',opacity:1,offset:.85},
                    {opacity:.9}
                ],{duration:5000,delay:idx*120,easing:'ease-out',fill:'forwards'});
            })(i);
        }
    },
    _animTempete:function(scene){
        if(!scene)return;
        var dark=document.createElement('div');dark.className='evt-storm-dark evt-tmp';dark.id='evt-storm-dark';scene.appendChild(dark);
        // Tornades
        for(var i=0;i<10;i++){
            (function(idx){
                var t=document.createElement('div');t.textContent='🌪️';t.className='evt-tmp';
                t.style.cssText='position:absolute;font-size:'+(36+Math.random()*36)+'px;z-index:232;pointer-events:none;left:'+(Math.random()*90)+'%;top:'+(20+Math.random()*60)+'%';
                scene.appendChild(t);
                if(t.animate)t.animate([
                    {opacity:0,transform:'translateY(20px) rotate(0deg)'},
                    {opacity:1,transform:'translateY(0) rotate(360deg)',offset:.3},
                    {opacity:1,transform:'translateX('+(Math.random()*40-20)+'px) rotate(1080deg)'}
                ],{duration:5000,delay:idx*150,easing:'linear',fill:'forwards'});
            })(i);
        }
        // Pluie forte + son
        if(typeof Weather!=='undefined'&&Weather._forceRain)Weather._forceRain(true);
        try{if(typeof App!=='undefined'&&App._rainAudio){App._rainAudio.currentTime=0;App._rainAudio.play();}}catch(e){}
    },
    _animVirus:function(scene){
        if(!scene)return;
        for(var i=0;i<22;i++){
            (function(idx){
                var v=document.createElement('div');v.textContent='🦠';v.className='evt-tmp';
                v.style.cssText='position:absolute;font-size:'+(28+Math.random()*28)+'px;z-index:232;pointer-events:none;left:'+(Math.random()*92)+'%;top:'+(Math.random()*85)+'%';
                scene.appendChild(v);
                if(v.animate)v.animate([
                    {opacity:0,transform:'scale(0) rotate(0deg)'},
                    {opacity:.95,transform:'scale(1) rotate(180deg)',offset:.3},
                    {opacity:.95,transform:'scale(1.1) rotate(540deg)'}
                ],{duration:5000,delay:idx*70,fill:'forwards'});
            })(i);
        }
    },
    _showChantal:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        var old=document.getElementById('evt-chantal');if(old)old.remove();
        var img=document.createElement('img');
        img.src='assets/events/chantal.png';img.id='evt-chantal';img.className='evt-chantal';
        // À DROITE de l'écran
        img.style.cssText='position:absolute;right:3%;bottom:10%;width:150px;z-index:14;pointer-events:none';
        scene.appendChild(img);
        // Pousser Francis à gauche pour éviter la superposition
        if(typeof Renderer!=='undefined')Renderer._chantalActive=true;
    },

    // ─── Issues (outcomes) ───
    _runChasseur:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        // Nettoyer les renards
        this._clearTmp();
        var s=document.getElementById('evt-siren');if(s)s.remove();
        var hunter=document.createElement('img');hunter.src='assets/events/chasseur.png';hunter.className='evt-hunter evt-tmp';
        hunter.style.cssText='position:absolute;left:50%;bottom:4%;height:80%;transform:translateX(-50%);z-index:233;pointer-events:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,.5))';
        scene.appendChild(hunter);
        var band=document.createElement('div');band.className='evt-storm-band evt-tmp';band.textContent='🔫 Le chasseur sécurise le poulailler';
        scene.appendChild(band);
        this._sceneCountdown(10,'',function(){
            if(hunter.parentNode)hunter.remove();if(band.parentNode)band.remove();
            if(typeof Renderer!=='undefined')Renderer.toast('✅ Poulailler sécurisé !');
        });
    },
    _runTempeteHide:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        var self=this;
        var pw=document.getElementById('pet-wrapper');if(pw)pw.style.visibility='hidden';
        var band=document.createElement('div');band.className='evt-storm-band evt-tmp';band.id='evt-storm-band';band.textContent='🏠 Francis est à l\'abri';scene.appendChild(band);
        this._sceneCountdown(10,'',function(){
            // Calme progressif
            self._clearTmp();
            var d=document.getElementById('evt-storm-dark');if(d)d.remove();
            if(pw)pw.style.visibility='visible';
            if(typeof Weather!=='undefined'&&Weather._forceRain)Weather._forceRain(false);
            try{if(typeof App!=='undefined'&&App._rainAudio)App._rainAudio.pause();}catch(e){}
            if(typeof Renderer!=='undefined')Renderer.toast('☀️ La tempête est passée !');
        });
    },
    _runVaccin:function(p){
        p.sante=100;
        // Réutilise l'animation seringue du jeu
        if(typeof Renderer!=='undefined'&&Renderer.showBigSyringe){
            this._clearTmp();
            Renderer.showBigSyringe(function(){if(typeof Renderer!=='undefined')Renderer.update(p);});
        }
    },
    _runHearts:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        for(var i=0;i<24;i++){
            (function(idx){
                var ht=document.createElement('div');ht.textContent='💕';ht.className='evt-tmp';
                ht.style.cssText='position:absolute;font-size:'+(22+Math.random()*24)+'px;z-index:233;pointer-events:none;left:'+(8+Math.random()*84)+'%;top:100%';
                scene.appendChild(ht);
                if(ht.animate)ht.animate([{top:'100%',opacity:1},{top:(5+Math.random()*35)+'%',opacity:0}],{duration:2500,delay:idx*70,easing:'ease-out'}).onfinish=function(){ht.remove();};
            })(i);
        }
        var lbl=document.createElement('div');lbl.className='evt-storm-band evt-tmp';lbl.textContent='💕 +40% amour';scene.appendChild(lbl);
        this._sceneCountdown(5,'',function(){if(lbl.parentNode)lbl.remove();});
    },
    _runEggCoins:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        for(var i=0;i<24;i++){
            (function(idx){
                var co=document.createElement('div');co.textContent='🪙';co.className='evt-tmp';
                co.style.cssText='position:absolute;font-size:'+(22+Math.random()*22)+'px;z-index:233;pointer-events:none;left:'+(8+Math.random()*84)+'%;top:-10%';
                scene.appendChild(co);
                if(co.animate)co.animate([{top:'-10%',opacity:1},{top:(60+Math.random()*30)+'%',opacity:0}],{duration:2200,delay:idx*70,easing:'ease-in'}).onfinish=function(){co.remove();};
            })(i);
        }
        var lbl=document.createElement('div');lbl.className='evt-storm-band evt-tmp';lbl.textContent='🥚 +50 œufs !';scene.appendChild(lbl);
        this._sceneCountdown(5,'',function(){if(lbl.parentNode)lbl.remove();});
    },
    _clearTmp:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        var els=scene.querySelectorAll('.evt-tmp, .evt-fox, .evt-siren');
        for(var i=0;i<els.length;i++)els[i].remove();
    },

    // Compte à rebours circulaire affiché sur la scène (pour les phases d'événement)
    _sceneCountdown:function(seconds,label,onEnd){
        var scene=document.getElementById('scene');if(!scene){if(onEnd)onEnd();return;}
        var old=document.getElementById('evt-countdown');if(old)old.remove();
        var cd=document.createElement('div');cd.id='evt-countdown';cd.className='evt-countdown';
        cd.innerHTML='<div class="evt-cd-ring"><svg viewBox="0 0 40 40"><circle class="evt-cd-track" cx="20" cy="20" r="16"/><circle class="evt-cd-fill" cx="20" cy="20" r="16" id="evt-cd-arc"/></svg><span class="evt-cd-num" id="evt-cd-num">'+seconds+'</span></div>'+(label?'<div class="evt-cd-label">'+label+'</div>':'');
        scene.appendChild(cd);
        var arc=cd.querySelector('#evt-cd-arc');var circ=100.5;if(arc){arc.style.strokeDasharray=circ;arc.style.strokeDashoffset=0;}
        var remaining=seconds,total=seconds;
        var iv=setInterval(function(){
            remaining--;
            var num=cd.querySelector('#evt-cd-num');if(num)num.textContent=Math.max(0,remaining);
            if(arc)arc.style.strokeDashoffset=(circ*(1-remaining/total));
            if(remaining<=0){clearInterval(iv);cd.remove();if(onEnd)onEnd();}
        },1000);
        return cd;
    },

    showEvent:function(ev,pet){
        var self=this;
        // Phase 1 : animation d'intro (5s) avec décor + compte à rebours
        this._startEventIntro(ev);
        var introSec=ev.intro||5;
        this._sceneCountdown(introSec,'',function(){
            self._stopEventIntro(ev);
            // Phase 2 : modale de choix
            self._showEventChoice(ev,pet);
        });
    },
    _startEventIntro:function(ev){
        if(ev.id==='renard')this._animRenard(document.getElementById('scene'));
        else if(ev.id==='tempete')this._animTempete(document.getElementById('scene'));
        else if(ev.id==='malade')this._animVirus(document.getElementById('scene'));
        else if(ev.id==='ami')this._showChantal();
    },
    _stopEventIntro:function(ev){
        // Nettoyer les éléments d'intro qui doivent disparaître avant le choix
        if(ev.id==='renard'){var s=document.getElementById('evt-siren');if(s)s.remove();}
        if(ev.id==='tempete'){/* la pluie reste pendant le choix */}
    },
    _showEventChoice:function(ev,pet){
        var self=this;
        var ov=document.getElementById('event-overlay');
        if(!ov)return;
        document.getElementById('event-emoji').textContent=ev.emoji;
        document.getElementById('event-title').textContent=ev.titre;
        document.getElementById('event-text').textContent=ev.texte;
        var box=document.getElementById('event-choices');
        box.innerHTML='';
        ev.choix.forEach(function(ch){
            var b=document.createElement('button');
            b.className='event-choice-btn';
            b.textContent=ch.label;
            b.addEventListener('click',function(){
                var res=ch.effet(pet);
                self.addJournal(pet,ev.emoji+' '+ev.titre+' — '+res);
                ov.classList.add('hidden');
                // Nettoyage post-choix
                if(ev.id==='ami'){var ch2=document.getElementById('evt-chantal');if(ch2)setTimeout(function(){ch2.remove();if(typeof Renderer!=='undefined')Renderer._chantalActive=false;},5000);}
                if(ev.id==='tempete'){/* géré par _runTempeteHide / mort */ if(pet.estMort){var d=document.getElementById('evt-storm-dark');if(d)d.remove();var r=document.querySelector('.evt-rain-overlay');if(r)r.remove();}}
                if(typeof Renderer!=='undefined'){Renderer.toast(ev.emoji+' '+res);Renderer.update(pet);}
                if(pet.estMort&&typeof Renderer!=='undefined'){if(typeof App!=='undefined')App.saveRecord&&App.saveRecord();Renderer.showDeath(pet);}
                if(typeof Storage!=='undefined')Storage.save(pet);
            });
            box.appendChild(b);
        });
        ov.classList.remove('hidden');
    },

    // ═══════════════════════════════════════════════════════
    //  2. QUÊTES JOURNALIÈRES
    // ═══════════════════════════════════════════════════════
    QUEST_POOL:[
        {id:'feed3', texte:'Nourrir Francis 3 fois', cible:3, reward:30, track:'feed'},
        {id:'play2', texte:'Jouer 2 fois', cible:2, reward:25, track:'play'},
        {id:'wash1', texte:'Laver Francis 1 fois', cible:1, reward:20, track:'wash'},
        {id:'happy80', texte:'Atteindre 80% de bonheur', cible:80, reward:40, track:'happy'},
        {id:'caress5', texte:'Caresser Francis 5 fois', cible:5, reward:20, track:'caress'},
        {id:'eggs5', texte:'Récolter 5 œufs', cible:5, reward:35, track:'eggs'},
        {id:'heal1', texte:'Soigner Francis 1 fois', cible:1, reward:25, track:'heal'},
        {id:'study1', texte:'Faire lire Francis 1 fois', cible:1, reward:20, track:'study'}
    ],

    _dayNumber:function(){return Math.floor(Date.now()/86400000);},

    refreshQuests:function(pet){
        var f=this.ensure(pet);
        var today=this._dayNumber();
        if(f.questDay===today && f.quests)return f.quests;
        // New day: pick 3 random quests
        var pool=this.QUEST_POOL.slice();
        var picked=[];
        for(var i=0;i<3&&pool.length;i++){
            var idx=Math.floor(Math.random()*pool.length);
            var q=pool.splice(idx,1)[0];
            picked.push({id:q.id,texte:q.texte,cible:q.cible,reward:q.reward,track:q.track,progress:0,done:false,claimed:false});
        }
        f.quests=picked; f.questDay=today;
        return f.quests;
    },

    trackQuest:function(pet,track,amount){
        var f=this.ensure(pet);
        if(!f.quests)this.refreshQuests(pet);
        var changed=false;
        f.quests.forEach(function(q){
            if(q.done||q.track!==track)return;
            if(track==='happy'){
                q.progress=Math.round(pet.bonheur||0);
                if(q.progress>=q.cible){q.done=true;changed=true;}
            }else{
                q.progress+=(amount||1);
                if(q.progress>=q.cible){q.progress=q.cible;q.done=true;changed=true;}
            }
        });
        if(changed&&typeof Renderer!=='undefined')Renderer.toast('🎯 Quête accomplie ! Va la réclamer');
        return changed;
    },

    claimQuest:function(pet,id){
        var f=this.ensure(pet);
        var q=f.quests.find(function(x){return x.id===id;});
        if(!q||!q.done||q.claimed)return false;
        q.claimed=true;
        pet.coins+=q.reward;
        this.addJournal(pet,'🎯 Quête réussie : '+q.texte+' (+'+q.reward+' 🪙)');
        if(typeof Renderer!=='undefined'){Renderer.toast('🪙 +'+q.reward+' pièces !');Renderer.update(pet);}
        if(typeof Storage!=='undefined')Storage.save(pet);
        return true;
    },

    renderQuests:function(pet){
        this.refreshQuests(pet);
        var f=this.ensure(pet);
        var box=document.getElementById('quests-list');
        if(!box)return;
        var self=this;
        box.innerHTML='';
        f.quests.forEach(function(q){
            var pct=Math.min(100,Math.round(q.progress/q.cible*100));
            var item=document.createElement('div');
            item.className='quest-item'+(q.done?' quest-done':'');
            var btn=q.done&&!q.claimed
                ? '<button class="quest-claim" data-q="'+q.id+'">Réclamer +'+q.reward+'🪙</button>'
                : (q.claimed?'<span class="quest-claimed">✅ Fait</span>':'<span class="quest-reward">+'+q.reward+'🪙</span>');
            item.innerHTML='<div class="quest-top"><span class="quest-text">'+q.texte+'</span>'+btn+'</div>'+
                '<div class="quest-bar"><div class="quest-fill" style="width:'+pct+'%"></div></div>'+
                '<div class="quest-prog">'+Math.min(q.progress,q.cible)+' / '+q.cible+'</div>';
            box.appendChild(item);
        });
        box.querySelectorAll('.quest-claim').forEach(function(b){
            b.addEventListener('click',function(){self.claimQuest(pet,b.dataset.q);self.renderQuests(pet);});
        });
    },

    // ═══════════════════════════════════════════════════════
    //  3. JOURNAL DE FRANCIS
    // ═══════════════════════════════════════════════════════
    addJournal:function(pet,texte){
        var f=this.ensure(pet);
        var age=Engine.getAge(pet);
        f.journal.unshift({jour:age.days,texte:texte,t:Date.now()});
        if(f.journal.length>50)f.journal.pop();
    },

    // Auto journal entries on milestones
    autoJournal:function(pet){
        var f=this.ensure(pet);
        var age=Engine.getAge(pet);
        if(age.days>f.lastJournalDay){
            f.lastJournalDay=age.days;
            var lines=[
                'Une nouvelle journée commence pour Francis.',
                'Francis a bien dormi et chante le coq !',
                'Le soleil brille sur le poulailler.',
                'Francis se sent en pleine forme aujourd\'hui.',
                'Encore un jour de gagné dans la vie de Francis !'
            ];
            if(age.days>0)this.addJournal(pet,'📅 Jour '+age.days+' — '+lines[Math.floor(Math.random()*lines.length)]);
        }
    },

    renderJournal:function(pet){
        var f=this.ensure(pet);
        var box=document.getElementById('journal-list');
        if(!box)return;
        if(!f.journal.length){box.innerHTML='<p class="journal-empty">Le journal de Francis est vide pour l\'instant. Vis des aventures !</p>';return;}
        box.innerHTML='';
        f.journal.forEach(function(e){
            var d=document.createElement('div');
            d.className='journal-entry';
            d.innerHTML='<span class="journal-day">J'+e.jour+'</span><span class="journal-txt">'+e.texte+'</span>';
            box.appendChild(d);
        });
    },

    // ═══════════════════════════════════════════════════════
    //  4. IMPACT MÉTÉO
    // ═══════════════════════════════════════════════════════
    // Appelé périodiquement : ajuste subtilement les jauges selon la météo
    applyWeatherImpact:function(pet){
        if(!pet||pet.estMort||pet.isSleeping||App.paused)return;
        if(typeof Weather==='undefined')return;
        var raining=Weather._isRaining?Weather._isRaining():false;
        var bri=Weather.getBri?Weather.getBri():1;
        var f=this.ensure(pet);
        if(raining){
            // Pluie : humeur et hygiène baissent un peu plus vite
            pet.bonheur=Engine.cl(pet.bonheur-0.15);
            pet.hygiene=Engine.cl(pet.hygiene-0.1);
            f.weatherBuff='rain';
        }else if(bri>0.8){
            // Plein soleil : petit boost d'énergie et de bonheur
            pet.energie=Engine.cl(pet.energie+0.08);
            pet.bonheur=Engine.cl(pet.bonheur+0.05);
            f.weatherBuff='sun';
        }else{
            f.weatherBuff=null;
        }
    },

    getWeatherLabel:function(){
        if(typeof Weather==='undefined')return '';
        var raining=Weather._isRaining?Weather._isRaining():false;
        var bri=Weather.getBri?Weather.getBri():1;
        if(raining)return '🌧️ Pluie — humeur en baisse';
        if(bri>0.8)return '☀️ Grand soleil — Francis est boosté !';
        if(bri<0.3)return '🌙 Nuit calme';
        return '⛅ Temps doux';
    }
};
