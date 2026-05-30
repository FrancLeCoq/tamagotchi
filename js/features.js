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
            texte:'Une horde de renards envahit le poulailler ! Cache Francis et appelle le chasseur (coûte 10% de ta cagnotte).',
            anim:'renard',
            choix:[
                {label:'Cacher Francis & appeler le chasseur 🔫', effet:function(p){
                    var cout=Math.floor((p.coins||0)*0.1);p.coins-=cout;
                    Features._fearAllGauges(p);
                    return 'Le chasseur a chassé les renards ! (-'+cout+' 🪙, Francis a eu peur : -5% partout)';
                }}
            ]
        },
        {
            id:'tempete', emoji:'⛈️', titre:'Tempête !',
            texte:'Une violente tempête arrive ! Cache Francis, vite !',
            anim:'tempete',
            choix:[
                {label:'Cacher Francis 🏠', effet:function(p){
                    Features._fearAllGauges(p);
                    Features._runTempete();
                    return 'Francis se met à l\'abri 30s... (-5% partout, il a eu peur)';
                }}
            ]
        },
        {
            id:'malade', emoji:'🦠', titre:'PANDÉMIE — Covid19 !',
            texte:'Une pandémie frappe le poulailler ! Il faut vacciner Francis immédiatement !',
            anim:'malade',
            choix:[
                {label:'Vacciner 💉', effet:function(p){p.sante=100;return 'Vacciné ! Santé à 100% 💪';}},
                {label:'Pas de vaccin 🚫', effet:function(p){p.sante=0;return 'Catastrophe... Santé tombée à 0% !';}}
            ]
        },
        {
            id:'ami', emoji:'👩\u200d🌾', titre:'Visite de Chantal',
            texte:'Chantal, son éleveuse, vient lui rendre visite avec son panier !',
            anim:'ami',
            choix:[
                {label:'Faire un câlin 🤗', effet:function(p){p.amour=Engine.cl((p.amour||0)+40);Features._showHearts();return 'Que d\'amour ! +40% amour 💕';}},
                {label:'Récupérer les œufs 🥚', effet:function(p){if(!p.farm)p.farm={};p.farm.pendingEggs=(p.farm.pendingEggs||0)+50;p.farm.totalEggs=(p.farm.totalEggs||0)+50;return '+50 œufs dans le panier ! 🥚';}}
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
    // Animations spécifiques par événement
    playEventAnimation:function(ev){
        var scene=document.getElementById('scene');if(!scene)return;
        if(ev.anim==='renard')return this._animRenard(scene);
        if(ev.anim==='tempete')return this._animTempeteIntro(scene);
        if(ev.anim==='malade')return this._animVirus(scene);
        if(ev.anim==='ami')return; // l'éleveuse s'affiche via le choix
    },
    _animRenard:function(scene){
        // Sirène police bleu/rouge + renards envahissent
        var siren=document.createElement('div');siren.className='evt-siren';siren.id='evt-siren';
        scene.appendChild(siren);
        for(var i=0;i<10;i++){
            (function(idx){
                var fox=document.createElement('img');
                fox.src='assets/events/renards.png';fox.className='evt-fox';
                var fromLeft=Math.random()<.5;
                fox.style.cssText='position:absolute;width:90px;z-index:232;pointer-events:none;top:'+(40+Math.random()*45)+'%;left:'+(fromLeft?-15:110)+'%';
                scene.appendChild(fox);
                if(fox.animate){fox.animate([
                    {left:(fromLeft?-15:110)+'%',opacity:0},
                    {left:(20+Math.random()*60)+'%',opacity:1,offset:.4},
                    {left:(20+Math.random()*60)+'%',opacity:1,offset:.8},
                    {opacity:0}
                ],{duration:3500,delay:idx*120,easing:'ease-out'}).onfinish=function(){fox.remove();};}
                setTimeout(function(){if(fox.parentNode)fox.remove();},4000);
            })(i);
        }
        setTimeout(function(){var s=document.getElementById('evt-siren');if(s)s.remove();},4000);
    },
    _animTempeteIntro:function(scene){
        var dark=document.createElement('div');dark.className='evt-storm-dark';dark.id='evt-storm-dark';
        scene.appendChild(dark);
        setTimeout(function(){var d=document.getElementById('evt-storm-dark');if(d&&!d.dataset.keep)d.remove();},2000);
    },
    _animVirus:function(scene){
        for(var i=0;i<16;i++){
            (function(idx){
                var v=document.createElement('div');v.textContent='🦠';v.className='evt-virus';
                v.style.cssText='position:absolute;font-size:'+(28+Math.random()*24)+'px;z-index:232;pointer-events:none;left:'+(Math.random()*90)+'%;top:'+(Math.random()*80)+'%';
                scene.appendChild(v);
                if(v.animate){v.animate([
                    {opacity:0,transform:'scale(0) rotate(0deg)'},
                    {opacity:.9,transform:'scale(1) rotate(180deg)',offset:.3},
                    {opacity:.9,transform:'scale(1.1) rotate(300deg)',offset:.8},
                    {opacity:0,transform:'scale(.5) rotate(360deg)'}
                ],{duration:3000,delay:idx*80}).onfinish=function(){v.remove();};}
                setTimeout(function(){if(v.parentNode)v.remove();},3200);
            })(i);
        }
    },
    // Toutes les jauges -5% (Francis a eu peur)
    _fearAllGauges:function(p){
        ['faim','energie','sante','hygiene','amour','intellect','jeu'].forEach(function(g){
            if(p[g]!==undefined)p[g]=Engine.cl(p[g]-5);
        });
    },
    // Tempête : Francis disparaît 30s + rain.mp3
    _runTempete:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        var dark=document.getElementById('evt-storm-dark');
        if(!dark){dark=document.createElement('div');dark.className='evt-storm-dark';dark.id='evt-storm-dark';scene.appendChild(dark);}
        dark.dataset.keep='1';
        // Bandeau
        var band=document.createElement('div');band.className='evt-storm-band';band.id='evt-storm-band';band.textContent='⛈️ Cache Francis !';
        scene.appendChild(band);
        // Cacher Francis
        var pw=document.getElementById('pet-wrapper');if(pw)pw.style.visibility='hidden';
        // Pluie forte + son
        if(typeof Weather!=='undefined'&&Weather._forceRain)Weather._forceRain(true);
        try{if(typeof App!=='undefined'&&App._rainAudio){App._rainAudio.currentTime=0;App._rainAudio.play();}}catch(e){}
        setTimeout(function(){
            var d=document.getElementById('evt-storm-dark');if(d)d.remove();
            var b=document.getElementById('evt-storm-band');if(b)b.remove();
            if(pw)pw.style.visibility='visible';
            if(typeof Weather!=='undefined'&&Weather._forceRain)Weather._forceRain(false);
            try{if(typeof App!=='undefined'&&App._rainAudio)App._rainAudio.pause();}catch(e){}
            if(typeof Renderer!=='undefined')Renderer.toast('☀️ La tempête est passée !');
        },30000);
    },
    _showChantal:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        var old=document.getElementById('evt-chantal');if(old)old.remove();
        var img=document.createElement('img');
        img.src='assets/events/chantal.png';img.id='evt-chantal';img.className='evt-chantal';
        // Même position que la poule du câlin : gauche, bas 10%
        img.style.cssText='position:absolute;left:3%;bottom:10%;width:150px;z-index:14;pointer-events:none';
        scene.appendChild(img);
    },
    // Pluie de cœurs (câlin éleveuse)
    _showHearts:function(){
        var scene=document.getElementById('scene');if(!scene)return;
        for(var i=0;i<18;i++){
            (function(idx){
                var ht=document.createElement('div');ht.textContent='💕';
                ht.style.cssText='position:absolute;font-size:'+(22+Math.random()*22)+'px;z-index:233;pointer-events:none;left:'+(10+Math.random()*80)+'%;top:100%';
                scene.appendChild(ht);
                if(ht.animate){ht.animate([
                    {top:'100%',opacity:1},
                    {top:(10+Math.random()*30)+'%',opacity:0}
                ],{duration:2200,delay:idx*90,easing:'ease-out'}).onfinish=function(){ht.remove();};}
                setTimeout(function(){if(ht.parentNode)ht.remove();},2400);
            })(i);
        }
    },
    showEvent:function(ev,pet){
        this.playEventAnimation(ev);
        var self=this;
        var ov=document.getElementById('event-overlay');
        if(!ov)return;
        if(ev.anim==='ami')this._showChantal();
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
                if(ev.anim==='ami'){var ch2=document.getElementById('evt-chantal');if(ch2)setTimeout(function(){ch2.remove();},2000);}
                if(typeof Renderer!=='undefined'){Renderer.toast(ev.emoji+' '+res);Renderer.update(pet);}
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
