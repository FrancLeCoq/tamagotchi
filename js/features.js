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
            id:'renard', emoji:'🦊', titreKey:'ev_fox_title',
            intro:10, // 10s d'animation renards + sirène
            texteKey:'ev_fox_text',
            choix:[
                {labelKey:'ev_fox_c1', effet:function(p){
                    var cout=Math.floor((p.coins||0)*0.1);
                    // La taxe est prélevée à la fin (quand le chasseur part), de façon synchronisée avec l'animation
                    Features._runChasseur(p,cout);
                    return I18n.t('ev_fox_r1',{c:cout});
                }},
                {labelKey:'ev_fox_c2', effet:function(p){
                    p.sante=0;p.faim=0;p.bonheur=0;p.estMort=true;p.causeMortKey='ev_fox_death';p.causeMort=I18n.t('ev_fox_death');
                    return I18n.t('ev_fox_r2');
                }}
            ]
        },
        {
            id:'tempete', emoji:'🌪️', titreKey:'ev_storm_title',
            intro:10, // 10s tornades + pluie + son
            texteKey:'ev_storm_text',
            choix:[
                {labelKey:'ev_storm_c1', effet:function(p){
                    Features._runTempeteHide(p);
                    return I18n.t('ev_storm_r1');
                }},
                {labelKey:'ev_storm_c2', effet:function(p){
                    p.sante=0;p.estMort=true;p.causeMortKey='ev_storm_death';p.causeMort=I18n.t('ev_storm_death');
                    return I18n.t('ev_storm_r2');
                }}
            ]
        },
        {
            id:'malade', emoji:'🦠', titreKey:'ev_sick_title',
            intro:10, // 10s virus partout + sirène
            texteKey:'ev_sick_text',
            choix:[
                {labelKey:'ev_sick_c1', effet:function(p){Features._runVaccin(p);return I18n.t('ev_sick_r1');}},
                {labelKey:'ev_sick_c2', effet:function(p){p.sante=0;Features._stopCovidDecor();return I18n.t('ev_sick_r2');}}
            ]
        },
        {
            id:'ami', emoji:'👩\u200d🌾', titreKey:'ev_friend_title',
            intro:10, // 10s Chantal apparaît
            texteKey:'ev_friend_text',
            choix:[
                {labelKey:'ev_friend_c1', effet:function(p){p.amour=Engine.cl((p.amour||0)+40);Features._runHearts();return I18n.t('ev_friend_r1');}},
                {labelKey:'ev_friend_c2', effet:function(p){p.coins=(p.coins||0)+50;Features._runEggCoins();return I18n.t('ev_friend_r2');}}
            ]
        }
    ],

    EVENT_INTERVAL: 3*60*1000, // ~3 min réelles entre événements possibles
    EVENT_CHANCE: 0.35,

    EVENT_QUOTA:{renard:1,tempete:2,malade:1,ami:2},
    maybeTriggerEvent:function(pet){
        if(!pet||pet.estMort||pet.isSleeping)return;
        if(App.paused)return;
        // Ne pas déclencher d'événement si une action/animation est en cours (évite la superposition)
        if(typeof Renderer!=='undefined'&&Renderer._actionLock)return;
        // Ni si une modale d'événement ou un compte à rebours est déjà à l'écran
        var ov=document.getElementById('event-overlay');if(ov&&!ov.classList.contains('hidden'))return;
        if(document.querySelector('.countdown-display, .evt-countdown'))return;
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
                ],{duration:10000,delay:idx*120,easing:'ease-out',fill:'forwards'});
            })(i);
        }
    },
    // Génère des tornades mobiles (sans rotation) sur tout l'écran, pour durationMs
    _spawnTornadoes:function(scene,count,durationMs){
        if(!scene)return;
        var rect=scene.getBoundingClientRect();
        var W=rect.width||320,H=rect.height||320;
        for(var i=0;i<count;i++){
            (function(idx){
                var t=document.createElement('div');t.textContent='🌪️';t.className='evt-tmp evt-tornado';
                var size=(72+Math.random()*72); // x2
                t.style.cssText='position:absolute;font-size:'+size+'px;z-index:232;pointer-events:none;left:0;top:0;will-change:transform;filter:drop-shadow(0 4px 8px rgba(0,0,0,.4))';
                scene.appendChild(t);
                var pad=size;
                function rndX(){return Math.random()*Math.max(10,W-pad);}
                function rndY(){return Math.random()*Math.max(10,H-pad);}
                var frames=[],steps=8;
                for(var k=0;k<steps;k++)frames.push({transform:'translate('+rndX()+'px,'+rndY()+'px)',opacity:k===0?0:1});
                frames[frames.length-1].opacity=1;
                if(t.animate)t.animate(frames,{duration:durationMs||10000,delay:idx*120,easing:'ease-in-out',fill:'forwards'});
            })(i);
        }
    },
    _animTempete:function(scene){
        if(!scene)return;
        var dark=document.createElement('div');dark.className='evt-storm-dark evt-tmp';dark.id='evt-storm-dark';scene.appendChild(dark);
        // Tornades mobiles plein écran (sans rotation), taille x2
        this._spawnTornadoes(scene,8,10000);
        // Pluie TRÈS forte + son (garantie)
        if(typeof Weather!=='undefined'&&Weather._forceRain)Weather._forceRain(true);
        try{if(typeof App!=='undefined'&&App._rainAudio){App._rainAudio.currentTime=0;App._rainAudio.play();}}catch(e){}
    },
    _animVirus:function(scene){
        if(!scene)return;
        // Décor alarmiste : sirène rouge/bleu
        var alarm=document.createElement('div');alarm.className='evt-covid-alarm evt-tmp';alarm.id='evt-covid-alarm';scene.appendChild(alarm);
        var band=document.createElement('div');band.className='evt-storm-band evt-tmp evt-alarm-band';band.id='evt-covid-band';band.textContent=I18n.t('ev_sick_alarm');scene.appendChild(band);
        for(var i=0;i<22;i++){
            (function(idx){
                var v=document.createElement('div');v.textContent='🦠';v.className='evt-tmp evt-virus';
                v.style.cssText='position:absolute;font-size:'+(28+Math.random()*28)+'px;z-index:232;pointer-events:none;left:'+(Math.random()*92)+'%;top:'+(Math.random()*85)+'%';
                scene.appendChild(v);
                if(v.animate)v.animate([
                    {opacity:0,transform:'scale(0) rotate(0deg)'},
                    {opacity:.95,transform:'scale(1) rotate(180deg)',offset:.3},
                    {opacity:.95,transform:'scale(1.1) rotate(540deg)'}
                ],{duration:10000,delay:idx*70,fill:'forwards'});
            })(i);
        }
    },
    _stopCovidDecor:function(){
        var a=document.getElementById('evt-covid-alarm');if(a)a.remove();
        var b=document.getElementById('evt-covid-band');if(b)b.remove();
    },
    _showChantal:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        var old=document.getElementById('evt-chantal');if(old)old.remove();
        var oldb=document.getElementById('evt-chantal-bubble');if(oldb)oldb.remove();
        var img=document.createElement('img');
        img.src='assets/events/chantal.png';img.id='evt-chantal';img.className='evt-chantal';
        // À DROITE de l'écran, position basse
        img.style.cssText='position:absolute;right:3%;bottom:-5%;width:150px;z-index:14;pointer-events:none';
        scene.appendChild(img);
        // Bulle de dialogue au-dessus de la tête de Chantal
        var bubble=document.createElement('div');
        bubble.id='evt-chantal-bubble';bubble.className='evt-chantal-bubble evt-tmp';
        bubble.textContent=I18n.t('ev_friend_bubble');
        scene.appendChild(bubble);
        // Pousser Francis à gauche pour éviter la superposition
        if(typeof Renderer!=='undefined')Renderer._chantalActive=true;
    },

    // ─── Issues (outcomes) ───
    _runChasseur:function(pet,cout){
        var scene=document.getElementById('scene');if(!scene)return;
        var self=this;
        // Nettoyer les renards
        this._clearTmp();
        var s=document.getElementById('evt-siren');if(s)s.remove();
        var hunter=document.createElement('img');hunter.src='assets/events/chasseur.png';hunter.className='evt-hunter evt-tmp';
        hunter.style.cssText='position:absolute;left:50%;bottom:4%;height:80%;transform:translateX(-50%);z-index:233;pointer-events:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,.5))';
        scene.appendChild(hunter);
        // Message affiché en haut comme l'événement tempête (bannière scène, pas de débordement)
        if(typeof Renderer!=='undefined')Renderer.sceneNotif(I18n.t('ev_band_hunter')+(cout?' (-'+cout+' 🪙)':''));
        this._sceneCountdown(10,'',function(){
            // Prélèvement EFFECTIF de la taxe au moment où le chasseur part
            if(cout&&cout>0&&pet){
                pet.coins=Math.max(0,(pet.coins||0)-cout);
                self._runCoinLoss(cout);
                if(typeof Storage!=='undefined')Storage.save(pet);
            }
            if(hunter.parentNode)hunter.remove();
            self._stopAlarm();
            if(typeof Renderer!=='undefined'){Renderer.update(pet||App.pet);Renderer.sceneNotif(I18n.t('ev_toast_secured'));}
        });
    },
    // Pièces qui s'envolent (perte) — affiché quand le chasseur part
    _runCoinLoss:function(cout){
        var scene=document.getElementById('scene');if(!scene)return;
        // Montant en gros au centre
        var amount=document.createElement('div');amount.className='evt-tmp evt-coinloss-amount';amount.textContent='-'+Number(cout).toLocaleString()+' 🪙';
        scene.appendChild(amount);
        if(amount.animate)amount.animate([
            {opacity:0,transform:'translateX(-50%) translateY(0) scale(.6)'},
            {opacity:1,transform:'translateX(-50%) translateY(-10px) scale(1.1)',offset:.25},
            {opacity:1,transform:'translateX(-50%) translateY(-10px) scale(1)',offset:.7},
            {opacity:0,transform:'translateX(-50%) translateY(-40px) scale(.9)'}
        ],{duration:2200,easing:'ease-out',fill:'forwards'}).onfinish=function(){if(amount.parentNode)amount.remove();};
        // Pièces qui tombent/s'échappent
        for(var i=0;i<16;i++){
            (function(idx){
                var co=document.createElement('div');co.textContent='🪙';co.className='evt-tmp';
                co.style.cssText='position:absolute;font-size:'+(20+Math.random()*18)+'px;z-index:233;pointer-events:none;left:'+(20+Math.random()*60)+'%;top:'+(40+Math.random()*15)+'%;filter:grayscale(.2)';
                scene.appendChild(co);
                if(co.animate)co.animate([
                    {transform:'translateY(0) rotate(0deg)',opacity:1},
                    {transform:'translateY('+(80+Math.random()*60)+'px) rotate('+(Math.random()*360)+'deg)',opacity:0}
                ],{duration:1400+Math.random()*500,delay:idx*45,easing:'ease-in'}).onfinish=function(){if(co.parentNode)co.remove();};
            })(i);
        }
        if(typeof Renderer!=='undefined'&&Renderer.haptic)Renderer.haptic('medium');
    },
    _runTempeteHide:function(pet){
        var scene=document.getElementById('scene');if(!scene)return;
        var self=this;
        var pw=document.getElementById('pet-wrapper');if(pw)pw.style.visibility='hidden';
        var band=document.createElement('div');band.className='evt-storm-band evt-tmp';band.id='evt-storm-band';band.textContent=I18n.t('ev_band_shelter');scene.appendChild(band);
        // La tempête continue de faire rage visuellement : tornades mobiles + pluie (l'alarme reste celle lancée au début)
        var dark=document.getElementById('evt-storm-dark');if(!dark){dark=document.createElement('div');dark.className='evt-storm-dark evt-tmp';dark.id='evt-storm-dark';scene.appendChild(dark);}
        this._spawnTornadoes(scene,8,10000);
        if(typeof Weather!=='undefined'&&Weather._forceRain)Weather._forceRain(true);
        this._sceneCountdown(10,'',function(){
            // Calme progressif
            self._clearTmp();
            var d=document.getElementById('evt-storm-dark');if(d)d.remove();
            if(pw)pw.style.visibility='visible';
            if(typeof Weather!=='undefined'&&Weather._forceRain)Weather._forceRain(false);
            self._stopAlarm();
            // Francis a eu peur : -5% sur TOUTES les jauges
            if(pet){
                var keys=['faim','bonheur','energie','sante','hygiene','amour','jeu'];
                for(var i=0;i<keys.length;i++){if(typeof pet[keys[i]]==='number')pet[keys[i]]=Math.max(0,pet[keys[i]]-5);}
                if(typeof Storage!=='undefined')Storage.save(pet);
                if(typeof Renderer!=='undefined')Renderer.update(pet);
            }
            if(typeof Renderer!=='undefined'){
                Renderer.sceneNotif(I18n.t('ev_storm_fear'));
                Renderer.toast(I18n.t('ev_toast_stormgone'));
            }
        });
    },
    _runVaccin:function(p){
        var scene=document.getElementById('scene');
        var self=this;
        p.sante=100;
        // Phase 2 : on retire le bandeau "HEALTH ALERT" et on affiche "VACCINATION IN PROGRESS"
        // en haut, selon le même schéma que le message tempête (bannière scène)
        var ab=document.getElementById('evt-covid-band');if(ab)ab.remove();
        if(typeof Renderer!=='undefined')Renderer.sceneNotif(I18n.t('ev_band_vaccine'));
        // Seringue SANS son propre compte à rebours (un seul countdown géré ci-dessous)
        if(typeof Renderer!=='undefined'&&Renderer.showBigSyringe){
            Renderer.showBigSyringe(function(){if(typeof Renderer!=='undefined')Renderer.update(p);},{noTimer:true,duration:10});
        }
        // Les virus s'estompent progressivement sur 10s
        if(scene){
            var viruses=scene.querySelectorAll('.evt-virus');
            for(var i=0;i<viruses.length;i++){
                (function(v,idx){
                    if(v.animate)v.animate([{opacity:.95},{opacity:0}],{duration:10000,delay:idx*60,easing:'ease-in',fill:'forwards'}).onfinish=function(){if(v.parentNode)v.remove();};
                })(viruses[i],i);
            }
        }
        // UN SEUL compte à rebours de 10s puis nettoyage complet du décor covid
        this._sceneCountdown(10,'',function(){
            self._stopCovidDecor();
            self._clearTmp();
            self._stopAlarm();
            if(typeof Renderer!=='undefined')Renderer.update(p);
        });
    },
    _runHearts:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        var self=this;
        function burst(){
            for(var i=0;i<8;i++){
                (function(idx){
                    var ht=document.createElement('div');ht.textContent='💕';ht.className='evt-tmp evt-ami-fx';
                    ht.style.cssText='position:absolute;font-size:'+(22+Math.random()*24)+'px;z-index:233;pointer-events:none;left:'+(8+Math.random()*84)+'%;top:100%';
                    scene.appendChild(ht);
                    if(ht.animate)ht.animate([{top:'100%',opacity:1},{top:(5+Math.random()*35)+'%',opacity:0}],{duration:2500,delay:idx*70,easing:'ease-out'}).onfinish=function(){ht.remove();};
                })(i);
            }
        }
        burst();
        var iv=setInterval(burst,900); // coeurs en continu pendant tout le compte à rebours
        var lbl=document.createElement('div');lbl.className='evt-storm-band evt-tmp';lbl.textContent=I18n.t('ev_band_love');scene.appendChild(lbl);
        this._sceneCountdown(10,'',function(){
            clearInterval(iv);
            if(lbl.parentNode)lbl.remove();
            var ch=document.getElementById('evt-chantal');if(ch)ch.remove();var chb=document.getElementById('evt-chantal-bubble');if(chb)chb.remove();
            if(typeof Renderer!=='undefined')Renderer._chantalActive=false;
        },'pink');
    },
    _runEggCoins:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        var self=this;
        function burst(){
            for(var i=0;i<8;i++){
                (function(idx){
                    var co=document.createElement('div');co.textContent='🪙';co.className='evt-tmp evt-ami-fx';
                    co.style.cssText='position:absolute;font-size:'+(22+Math.random()*22)+'px;z-index:233;pointer-events:none;left:'+(8+Math.random()*84)+'%;top:-10%';
                    scene.appendChild(co);
                    if(co.animate)co.animate([{top:'-10%',opacity:1},{top:(60+Math.random()*30)+'%',opacity:0}],{duration:2200,delay:idx*70,easing:'ease-in'}).onfinish=function(){co.remove();};
                })(i);
            }
        }
        burst();
        var iv=setInterval(burst,900); // pièces en continu pendant tout le compte à rebours
        var lbl=document.createElement('div');lbl.className='evt-storm-band evt-tmp';lbl.textContent=I18n.t('ev_band_eggs');scene.appendChild(lbl);
        this._sceneCountdown(10,'',function(){
            clearInterval(iv);
            if(lbl.parentNode)lbl.remove();
            var ch=document.getElementById('evt-chantal');if(ch)ch.remove();var chb=document.getElementById('evt-chantal-bubble');if(chb)chb.remove();
            if(typeof Renderer!=='undefined')Renderer._chantalActive=false;
        },'pink');
    },
    _clearTmp:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        var els=scene.querySelectorAll('.evt-tmp, .evt-fox, .evt-siren, .evt-covid-alarm, .evt-tornado, .evt-virus');
        for(var i=0;i<els.length;i++)els[i].remove();
    },

    // Compte à rebours circulaire affiché sur la scène (pour les phases d'événement)
    _sceneCountdown:function(seconds,label,onEnd,color){
        var scene=document.getElementById('scene');if(!scene){if(onEnd)onEnd();return;}
        var old=document.getElementById('evt-countdown');if(old)old.remove();
        var cd=document.createElement('div');cd.id='evt-countdown';cd.className='evt-countdown'+(color==='pink'?' evt-countdown-pink':'');
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
        // Phase 1 : animation d'intro avec décor + compte à rebours
        this._startEventIntro(ev);
        var introSec=ev.intro||5;
        // Compte à rebours rose pour l'événement Ami (Chantal)
        var cdColor=(ev.id==='ami')?'pink':null;
        this._sceneCountdown(introSec,'',function(){
            self._stopEventIntro(ev);
            // Phase 2 : modale de choix
            self._showEventChoice(ev,pet);
        },cdColor);
    },
    _startEventIntro:function(ev){
        // Son d'alarme pendant toute la durée des événements tempête / renard / covid
        if(ev.id==='renard'||ev.id==='tempete'||ev.id==='malade')this._startAlarm();
        if(ev.id==='renard')this._animRenard(document.getElementById('scene'));
        else if(ev.id==='tempete')this._animTempete(document.getElementById('scene'));
        else if(ev.id==='malade')this._animVirus(document.getElementById('scene'));
        else if(ev.id==='ami')this._showChantal();
    },
    _startAlarm:function(){
        try{
            if(typeof App!=='undefined'){
                if(App.initAudio)App.initAudio();
                // Respecte le réglage son du jeu
                if(App.soundOn&&App._alarmAudio){App._alarmAudio.currentTime=0;App._alarmAudio.play().catch(function(){});}
            }
        }catch(e){}
    },
    _stopAlarm:function(){
        try{if(typeof App!=='undefined'&&App._alarmAudio){App._alarmAudio.pause();App._alarmAudio.currentTime=0;}}catch(e){}
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
        document.getElementById('event-title').textContent=I18n.t(ev.titreKey);
        document.getElementById('event-text').textContent=I18n.t(ev.texteKey);
        var box=document.getElementById('event-choices');
        box.innerHTML='';
        ev.choix.forEach(function(ch){
            var b=document.createElement('button');
            b.className='event-choice-btn';
            b.textContent=I18n.t(ch.labelKey);
            b.addEventListener('click',function(){
                var res=ch.effet(pet);
                self.addJournal(pet,ev.emoji+' '+I18n.t(ev.titreKey)+' — '+res);
                ov.classList.add('hidden');
                // La bulle de Chantal ne s'affiche que pendant la phase 1 : on la retire dès le choix
                var chb0=document.getElementById('evt-chantal-bubble');if(chb0)chb0.remove();
                // Nettoyage post-choix
                // (Chantal est retirée à la fin du compte à rebours dans _runHearts/_runEggCoins)
                if(ev.id==='tempete'&&pet.estMort){
                    // Mort en tempête : on nettoie tout de suite tornades/pluie/obscurité
                    self._clearTmp();
                    var d=document.getElementById('evt-storm-dark');if(d)d.remove();
                    if(typeof Weather!=='undefined'&&Weather._forceRain)Weather._forceRain(false);
                    try{if(typeof App!=='undefined'&&App._rainAudio)App._rainAudio.pause();}catch(e){}
                    var pw=document.getElementById('pet-wrapper');if(pw)pw.style.visibility='visible';
                }
                if(ev.id==='renard'&&pet.estMort){self._clearTmp();var sr=document.getElementById('evt-siren');if(sr)sr.remove();}
                if(ev.id==='malade'&&pet.estMort){self._stopCovidDecor();self._clearTmp();}
                // Coupe l'alarme dès qu'un choix mortel met fin à l'événement
                if(pet.estMort)self._stopAlarm();
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
        {id:'feed3', texteKey:'q_feed3', cible:3, reward:30, track:'feed'},
        {id:'play2', texteKey:'q_play2', cible:2, reward:25, track:'play'},
        {id:'wash1', texteKey:'q_wash1', cible:1, reward:20, track:'wash'},
        {id:'happy80', texteKey:'q_happy80', cible:80, reward:40, track:'happy'},
        {id:'caress5', texteKey:'q_caress5', cible:5, reward:20, track:'caress'},
        {id:'eggs5', texteKey:'q_eggs5', cible:5, reward:35, track:'eggs'},
        {id:'heal1', texteKey:'q_heal1', cible:1, reward:25, track:'heal'},
        {id:'study1', texteKey:'q_study1', cible:1, reward:20, track:'study'}
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
            picked.push({id:q.id,texteKey:q.texteKey,cible:q.cible,reward:q.reward,track:q.track,progress:0,done:false,claimed:false,seen:false});
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
        if(changed&&typeof Renderer!=='undefined')Renderer.toast(I18n.t('q_done_toast'));
        return changed;
    },

    claimQuest:function(pet,id){
        var f=this.ensure(pet);
        var q=f.quests.find(function(x){return x.id===id;});
        if(!q||!q.done||q.claimed)return false;
        q.claimed=true;
        pet.coins+=q.reward;
        this.addJournal(pet,I18n.t('q_success_journal',{t:I18n.t(q.texteKey),r:q.reward}));
        if(typeof Renderer!=='undefined'){Renderer.toast(I18n.t('q_coins_toast',{r:q.reward}));Renderer.update(pet);}
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
                ? '<button class="quest-claim" data-q="'+q.id+'">'+I18n.t('q_claim',{r:q.reward})+'</button>'
                : (q.claimed?'<span class="quest-claimed">'+I18n.t('q_claimed')+'</span>':'<span class="quest-reward">'+I18n.t('q_reward',{r:q.reward})+'</span>');
            item.innerHTML='<div class="quest-top"><span class="quest-text">'+I18n.t(q.texteKey)+'</span>'+btn+'</div>'+
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
            var lineKeys=['j_line1','j_line2','j_line3','j_line4','j_line5'];
            var line=I18n.t(lineKeys[Math.floor(Math.random()*lineKeys.length)]);
            if(age.days>0)this.addJournal(pet,I18n.t('j_day',{n:age.days,line:line}));
        }
    },

    renderJournal:function(pet){
        var f=this.ensure(pet);
        var box=document.getElementById('journal-list');
        if(!box)return;
        if(!f.journal.length){box.innerHTML='<p class="journal-empty">'+I18n.t('j_empty')+'</p>';return;}
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
        if(raining)return I18n.t('w_rain');
        if(bri>0.8)return I18n.t('w_sun');
        if(bri<0.3)return I18n.t('w_night');
        return I18n.t('w_mild');
    }
};
