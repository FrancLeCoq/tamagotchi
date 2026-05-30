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
            id:'tresor', emoji:'💰', titre:'Un trésor !',
            texte:'Francis a déterré une vieille bourse en grattant le sol !',
            choix:[
                {label:'Ramasser 💰', effet:function(p){p.coins+=150;return '+150 pièces !';}},
                {label:'Partager avec les poules 🐔', effet:function(p){p.coins+=80;p.bonheur=Engine.cl(p.bonheur+15);return '+80 pièces, +15 bonheur';}}
            ]
        },
        {
            id:'renard', emoji:'🦊', titre:'Le renard rôde !',
            texte:'Un renard affamé s\'approche du poulailler...',
            choix:[
                {label:'Cacher Francis 🙈', effet:function(p){p.energie=Engine.cl(p.energie-10);return 'Sauvé ! -10 énergie';}},
                {label:'Le chasser ! 💪', effet:function(p){if(Math.random()<0.6){p.bonheur=Engine.cl(p.bonheur+20);return 'Héros ! +20 bonheur';}else{p.sante=Engine.cl(p.sante-20);return 'Aïe ! Mordu, -20 santé';}}}
            ]
        },
        {
            id:'ami', emoji:'🐓', titre:'Visite d\'un ami',
            texte:'Coquardo, le coq du village voisin, vient dire bonjour !',
            choix:[
                {label:'Faire la fête 🎉', effet:function(p){p.bonheur=Engine.cl(p.bonheur+25);p.energie=Engine.cl(p.energie-10);return '+25 bonheur, -10 énergie';}},
                {label:'Discuter calmement ☕', effet:function(p){p.bonheur=Engine.cl(p.bonheur+12);p.intellect=Engine.cl(p.intellect+10);return '+12 bonheur, +10 intellect';}}
            ]
        },
        {
            id:'tempete', emoji:'⛈️', titre:'Tempête soudaine !',
            texte:'De gros nuages noirs arrivent. Le vent se lève !',
            choix:[
                {label:'Rentrer à l\'abri 🏠', effet:function(p){p.hygiene=Engine.cl(p.hygiene-5);return 'À l\'abri ! -5 hygiène';}},
                {label:'Danser sous la pluie 💃', effet:function(p){p.bonheur=Engine.cl(p.bonheur+18);p.hygiene=Engine.cl(p.hygiene-15);p.sante=Engine.cl(p.sante-8);return 'Fun mais risqué !';}}
            ]
        },
        {
            id:'marchand', emoji:'🧺', titre:'Marchand ambulant',
            texte:'Un marchand propose un sac de grains premium à moitié prix !',
            choix:[
                {label:'Acheter (50 🪙)', effet:function(p){if(p.coins>=50){p.coins-=50;p.faim=Engine.cl(p.faim+40);return 'Bien nourri ! +40 faim';}return 'Pas assez de pièces...';}},
                {label:'Refuser poliment', effet:function(p){return 'Une autre fois !';}}
            ]
        },
        {
            id:'etoile', emoji:'🌠', titre:'Étoile filante',
            texte:'Une étoile filante traverse le ciel ! Fais un vœu...',
            choix:[
                {label:'Vœu de richesse 💰', effet:function(p){p.coins+=100;return 'Le ciel t\'entend ! +100 pièces';}},
                {label:'Vœu de bonheur ✨', effet:function(p){p.bonheur=Engine.cl(p.bonheur+30);return 'Cœur léger ! +30 bonheur';}}
            ]
        },
        {
            id:'malade', emoji:'🤧', titre:'Petit rhume',
            texte:'Francis éternue... il a attrapé un coup de froid !',
            choix:[
                {label:'Soigner tout de suite 💊', effet:function(p){p.sante=Engine.cl(p.sante-5);return 'Pris à temps ! -5 santé';}},
                {label:'Laisser passer 🛌', effet:function(p){p.sante=Engine.cl(p.sante-18);p.energie=Engine.cl(p.energie-10);return 'Empiré... -18 santé';}}
            ]
        },
        {
            id:'concours', emoji:'🏅', titre:'Concours du plus beau coq',
            texte:'Le concours annuel du village commence ! Francis participe ?',
            choix:[
                {label:'Participer 🏅', effet:function(p){if((p.hygiene||0)>60&&(p.bonheur||0)>60){p.coins+=120;p.bonheur=Engine.cl(p.bonheur+15);return '🥇 GAGNÉ ! +120 pièces';}else{p.bonheur=Engine.cl(p.bonheur+5);return 'Participé ! Soigne-le mieux la prochaine fois';}}},
                {label:'Rester à la maison', effet:function(p){return 'Timide aujourd\'hui';}}
            ]
        }
    ],

    EVENT_INTERVAL: 3*60*1000, // ~3 min réelles entre événements possibles
    EVENT_CHANCE: 0.35,

    maybeTriggerEvent:function(pet){
        if(!pet||pet.estMort||pet.isSleeping)return;
        if(App.paused)return;
        var f=this.ensure(pet);
        if(Date.now()-f.lastEventAt < this.EVENT_INTERVAL)return;
        f.lastEventAt=Date.now();
        if(Math.random()>this.EVENT_CHANCE)return;
        var ev=this.EVENTS[Math.floor(Math.random()*this.EVENTS.length)];
        this.showEvent(ev,pet);
    },

    showEvent:function(ev,pet){
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
