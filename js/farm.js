var Farm = {
    HEN_COST:50, MAX_HENS:20, DEPLETION_RATE:3,
    canvas:null, ctx:null, hens:[], animFrame:null, isOpen:false,
    henImg:null, bgDayImg:null, bgNightImg:null,

    ensureData:function(pet){
        if(!pet.farm) pet.farm={hens:0,feedLevel:80,cleanLevel:80,lastUpdate:Date.now(),deadRecent:0,totalEggs:0};
        return pet.farm;
    },

    update:function(pet){
        var farm=this.ensureData(pet);
        if(farm.hens<=0) return farm;
        var now=Date.now(), elapsed=(now-farm.lastUpdate)/3600000;
        if(elapsed<0.01) return farm;
        var rate=this.DEPLETION_RATE*farm.hens*0.15;
        farm.feedLevel=Math.max(0,farm.feedLevel-elapsed*rate);
        farm.cleanLevel=Math.max(0,farm.cleanLevel-elapsed*rate*0.7);
        farm.deadRecent=0;
        if(farm.feedLevel<=0&&farm.hens>0){
            var d=Math.min(farm.hens,Math.ceil(elapsed*0.5));
            farm.hens-=d;farm.deadRecent=d;farm.feedLevel=5;
        }
        if(farm.cleanLevel<=0&&farm.hens>0){
            var d2=Math.min(farm.hens,Math.ceil(elapsed*0.3));
            farm.hens-=d2;farm.deadRecent+=d2;farm.cleanLevel=5;
        }
        if(farm.feedLevel>20&&farm.cleanLevel>20){
            var eggs=Math.floor(elapsed*farm.hens*0.3);
            if(eggs>0){pet.coins+=eggs;farm.totalEggs+=eggs;}
        }
        farm.lastUpdate=now;
        return farm;
    },

    buyHen:function(pet){
        var farm=this.ensureData(pet);
        if(farm.hens>=this.MAX_HENS) return {ok:false,msg:'Enclos plein ! (max '+this.MAX_HENS+')'};
        if(pet.coins<this.HEN_COST) return {ok:false,msg:'Il faut '+this.HEN_COST+' 🪙 (tu as '+pet.coins+')'};
        pet.coins-=this.HEN_COST;farm.hens++;
        return {ok:true,msg:'🐔 Nouvelle poule ! ('+farm.hens+'/'+this.MAX_HENS+')'};
    },

    feedEnclosure:function(pet){
        var farm=this.ensureData(pet);
        if(farm.hens<=0) return {ok:false,msg:'Pas de poules !'};
        if(farm.feedLevel>=95) return {ok:false,msg:'Déjà nourri ! 🌾'};
        farm.feedLevel=Math.min(100,farm.feedLevel+40);pet.coins+=1;
        return {ok:true,msg:'🌾 Enclos nourri !'};
    },

    cleanEnclosure:function(pet){
        var farm=this.ensureData(pet);
        if(farm.hens<=0) return {ok:false,msg:'Pas de poules !'};
        if(farm.cleanLevel>=95) return {ok:false,msg:'Déjà propre ! ✨'};
        farm.cleanLevel=Math.min(100,farm.cleanLevel+40);pet.coins+=1;
        return {ok:true,msg:'🧹 Enclos nettoyé !'};
    },

    open:function(pet){
        this.isOpen=true;
        var farm=this.ensureData(pet);
        this.update(pet);
        document.getElementById('farm-screen').classList.remove('hidden');

        // Preload images
        this.henImg=new Image();this.henImg.src='assets/sprites/poule_enclos.png';
        this.bgDayImg=new Image();this.bgDayImg.src='assets/backgrounds/champs_jour.png';
        this.bgNightImg=new Image();this.bgNightImg.src='assets/backgrounds/champs_nuit.png';

        // Setup canvas after a frame so DOM is ready
        var self=this;
        requestAnimationFrame(function(){
            self.canvas=document.getElementById('farm-canvas');
            if(!self.canvas) return;
            self.ctx=self.canvas.getContext('2d');
            var container=document.getElementById('farm-scene');
            self.canvas.width=container.offsetWidth;
            self.canvas.height=container.offsetHeight;
            self.initHens(farm.hens);
            self.renderUI(pet);
            if(farm.deadRecent>0) self.showDeathNotice(farm.deadRecent);
            self.animate();
        });
    },

    close:function(){
        this.isOpen=false;
        if(this.animFrame) cancelAnimationFrame(this.animFrame);
        document.getElementById('farm-screen').classList.add('hidden');
    },

    initHens:function(count){
        this.hens=[];
        if(!this.canvas) return;
        for(var i=0;i<count;i++){
            this.hens.push({
                x:30+Math.random()*(this.canvas.width-80),
                y:this.canvas.height*0.45+Math.random()*(this.canvas.height*0.4),
                targetX:30+Math.random()*(this.canvas.width-80),
                targetY:this.canvas.height*0.45+Math.random()*(this.canvas.height*0.4),
                speed:0.3+Math.random()*0.5, flipX:Math.random()>0.5,
                state:'idle', stateTimer:Math.random()*200, bob:Math.random()*Math.PI*2
            });
        }
    },

    updateHens:function(){
        for(var i=0;i<this.hens.length;i++){
            var h=this.hens[i];
            h.stateTimer--;
            if(h.stateTimer<=0){
                var r=Math.random();
                if(r<0.4){
                    h.state='walking';
                    h.targetX=30+Math.random()*(this.canvas.width-80);
                    h.targetY=this.canvas.height*0.45+Math.random()*(this.canvas.height*0.4);
                    h.stateTimer=100+Math.random()*200;
                } else if(r<0.7){h.state='pecking';h.stateTimer=30+Math.random()*60;}
                else {h.state='idle';h.stateTimer=50+Math.random()*150;}
            }
            if(h.state==='walking'){
                var dx=h.targetX-h.x,dy=h.targetY-h.y;
                var dist=Math.sqrt(dx*dx+dy*dy);
                if(dist>2){h.x+=(dx/dist)*h.speed;h.y+=(dy/dist)*h.speed;h.flipX=dx<0;}
                else {h.state='idle';h.stateTimer=50+Math.random()*100;}
            }
        }
    },

    drawHens:function(){
        if(!this.henImg||!this.henImg.complete) return;
        var t=Date.now()/1000;
        for(var i=0;i<this.hens.length;i++){
            var h=this.hens[i];
            var bobY=h.state==='pecking'?Math.sin(t*8+h.bob)*4:Math.sin(t*2+h.bob)*1.5;
            var walkBob=h.state==='walking'?Math.sin(t*6+h.bob)*2:0;
            var sz=40;
            this.ctx.save();
            this.ctx.translate(h.x+sz/2,h.y+sz/2);
            if(h.flipX) this.ctx.scale(-1,1);
            this.ctx.drawImage(this.henImg,-sz/2,-sz/2+bobY+walkBob,sz,sz);
            this.ctx.restore();
        }
    },

    animate:function(){
        if(!this.isOpen||!this.canvas||!this.ctx) return;
        var isDay=Weather.getSkyBrightness()>0.5;
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        if(!isDay){this.ctx.fillStyle='rgba(10,10,40,0.35)';this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);}
        this.updateHens();
        this.drawHens();
        var self=this;
        this.animFrame=requestAnimationFrame(function(){self.animate();});
    },

    renderUI:function(pet){
        var farm=this.ensureData(pet);
        var fb=document.getElementById('farm-feed-bar');
        var cb=document.getElementById('farm-clean-bar');
        if(fb){fb.style.width=farm.feedLevel+'%';fb.style.background=farm.feedLevel>40?'#2ecc71':farm.feedLevel>15?'#f39c12':'#e74c3c';}
        if(cb){cb.style.width=farm.cleanLevel+'%';cb.style.background=farm.cleanLevel>40?'#2ecc71':farm.cleanLevel>15?'#f39c12':'#e74c3c';}
        var info=document.getElementById('farm-info');
        if(info) info.innerHTML='<span>🐔 '+farm.hens+'/'+this.MAX_HENS+'</span><span>🥚 '+farm.totalEggs+'</span><span>🪙 '+pet.coins+'</span>';
    },

    showDeathNotice:function(count){
        var n=document.getElementById('farm-death-notice');
        if(n){n.textContent='💀 -'+count+' poule'+(count>1?'s':'');n.classList.remove('hidden');
        setTimeout(function(){n.classList.add('hidden');},4000);}
    },

    addHenToScene:function(){
        if(!this.canvas) return;
        this.hens.push({
            x:-40, y:this.canvas.height*0.5+Math.random()*(this.canvas.height*0.3),
            targetX:50+Math.random()*(this.canvas.width-100),
            targetY:this.canvas.height*0.45+Math.random()*(this.canvas.height*0.4),
            speed:0.5+Math.random()*0.5, flipX:false,
            state:'walking', stateTimer:200, bob:Math.random()*Math.PI*2
        });
    }
};
