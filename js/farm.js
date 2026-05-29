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
        farm.feedLevel=Math.min(100,farm.feedLevel+20);pet.coins+=1;
        return {ok:true,msg:'🌾 Enclos nourri !'};
    },

    cleanEnclosure:function(pet){
        var farm=this.ensureData(pet);
        if(farm.hens<=0) return {ok:false,msg:'Pas de poules !'};
        farm.cleanLevel=Math.min(100,farm.cleanLevel+20);pet.coins+=1;
        // Remove poops proportionally
        var removed=Math.floor((farm.farmPoops||0)*0.2);farm.farmPoops=Math.max(0,(farm.farmPoops||0)-removed-1);
        return {ok:true,msg:'🧹 Enclos nettoyé !'};
    },

    open:function(pet){
        this.isOpen=true;
        // Dynamic sky matching time of day
        this._updateFarmSky();
        if(this._farmSkyIv)clearInterval(this._farmSkyIv);
        var selfF=this;this._farmSkyIv=setInterval(function(){selfF._updateFarmSky();},3000);
        var farm=this.ensureData(pet);
        this.update(pet);
        document.getElementById('farm-screen').classList.remove('hidden');

        // Preload images
        this.henImg=new Image();this.henImg.src='assets/sprites/poule_enclos.png';
        

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
                targetY:this.canvas.height*0.2+Math.random()*(this.canvas.height*0.45),
                speed:0.3+Math.random()*0.5, flipX:Math.random()>0.5,
                state:'idle', stateTimer:Math.random()*200, bob:Math.random()*Math.PI*2
            });
        }
    },

    updateHens:function(){
        // Collision avoidance: keep minimum distance between hens
        for(var a=0;a<this.hens.length;a++){
            for(var b=a+1;b<this.hens.length;b++){
                var dx=this.hens[a].x-this.hens[b].x,dy=this.hens[a].y-this.hens[b].y;
                var dist=Math.sqrt(dx*dx+dy*dy),minDist=80;
                if(dist<minDist&&dist>0){
                    var push=(minDist-dist)/2;
                    var nx=dx/dist,ny=dy/dist;
                    this.hens[a].x+=nx*push;this.hens[a].y+=ny*push;
                    this.hens[b].x-=nx*push;this.hens[b].y-=ny*push;
                }
            }
        }
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
            var sz=80;
            this.ctx.save();
            this.ctx.translate(h.x+sz/2,h.y+sz/2);
            if(h.flipX) this.ctx.scale(-1,1);
            this.ctx.drawImage(this.henImg,-sz/2,-sz/2+bobY+walkBob,sz,sz);
            this.ctx.restore();
        }
    },

    animate:function(){
        if(!this.isOpen||!this.canvas||!this.ctx) return;
        // Travail gauge ticks while in enclos
        if(typeof App!=='undefined'&&App.pet){App.pet.travail=Math.min(100,(App.pet.travail||0)+0.005);}
        // Poop generation: 2 per 10% decay in cleanLevel
        var farm=this.ensureData(typeof App!=='undefined'?App.pet:{});
        if(farm&&farm.hens>0){
            var poopTarget=Math.floor((100-farm.cleanLevel)/10)*2;
            farm.farmPoops=farm.farmPoops||0;
            if(farm.cleanLevel<90&&farm.farmPoops<poopTarget&&Math.random()<0.002)farm.farmPoops=Math.min(poopTarget,farm.farmPoops+1);
        }
        var isDay=Weather.getBri()>0.5;
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        if(!isDay){this.ctx.fillStyle='rgba(10,10,40,0.35)';this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);}
        this.updateHens();
        this.drawHens();
        this.drawFarmPoops();
        var self=this;
        this.animFrame=requestAnimationFrame(function(){self.animate();});
    },

    renderUI:function(pet){
        var farm=this.ensureData(pet);
        var fb=document.getElementById('farm-feed-bar');
        var cb=document.getElementById('farm-clean-bar');
        var farmBon=Math.round(((farm.feedLevel||0)+(farm.cleanLevel||0))/2);
        var fbonBar=document.getElementById('farm-bonheur-bar');
        var fbonPct=document.getElementById('farm-bonheur-pct');
        if(fbonBar){fbonBar.style.width=farmBon+'%';fbonBar.style.background=farmBon>60?'#44cc66':farmBon>30?'#e8a020':'#e74c3c';}
        if(fbonPct)fbonPct.textContent=farmBon+'%';
        if(fb){fb.style.width=farm.feedLevel+'%';fb.style.background=farm.feedLevel>40?'#2ecc71':farm.feedLevel>15?'#f39c12':'#e74c3c';}
        if(cb){cb.style.width=farm.cleanLevel+'%';cb.style.background=farm.cleanLevel>40?'#2ecc71':farm.cleanLevel>15?'#f39c12':'#e74c3c';}
        var info=document.getElementById('farm-info');
        if(info) info.innerHTML='<span>🐔 '+farm.hens+'/'+this.MAX_HENS+'</span><span>🥚 '+farm.totalEggs+'</span><span>🪙 '+pet.coins+'</span>';
        // Gray out controls when no hens
        var noHens=farm.hens<=0;
        var rows=['farm-feed-row','farm-clean-row','farm-bonheur-row'];
        for(var ri=0;ri<rows.length;ri++){var row=document.getElementById(rows[ri]);if(row)row.style.opacity=noHens?'.35':'1';}
        var feedBtn=document.getElementById('btn-farm-feed');if(feedBtn)feedBtn.disabled=noHens;
        var cleanBtn=document.getElementById('btn-farm-clean');if(cleanBtn)cleanBtn.disabled=noHens;
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
            targetY:this.canvas.height*0.2+Math.random()*(this.canvas.height*0.45),
            speed:0.5+Math.random()*0.5, flipX:false,
            state:'walking', stateTimer:200, bob:Math.random()*Math.PI*2
        });
    },

    showFeedAnimation:function(foodEmoji){
        if(!this.canvas||!this.hens||!this.hens.length) return;
        var emoji = foodEmoji || '🌾';
        var scene = document.getElementById('farm-scene');
        if(!scene) return;
        var self = this;
        var duration = 30000; // 30s
        var startTime = Date.now();
        var loop = setInterval(function(){
            if(!self.isOpen || Date.now()-startTime > duration){clearInterval(loop);return;}
            // Pick a random hen and send food to it
            var h = self.hens[Math.floor(Math.random()*self.hens.length)];
            if(!h) return;
            var item = document.createElement('div');
            item.className = 'farm-food-fly'; item.textContent = emoji;
            // Start from top center of canvas, fly to hen
            var cRect = self.canvas.getBoundingClientRect();
            var sRect = scene.getBoundingClientRect();
            var startX = ((cRect.left-sRect.left+cRect.width/2)/sRect.width*100);
            var henXpct = (h.x/self.canvas.width*100);
            var henYpct = (h.y/self.canvas.height*100);
            item.style.left = startX+'%'; item.style.top = '5%';
            item.style.setProperty('--farm-tx',(henXpct-startX)+'vw');
            item.style.setProperty('--farm-ty',(henYpct-5)+'vh');
            scene.appendChild(item);
            setTimeout(function(){if(item.parentNode)item.remove();},2000);
        }, 800);
    },

    // ═══ FARM CLEAN ANIMATION — broom goes to each poop ═══
    showCleanAnimation:function(){
        var scene=document.getElementById('farm-scene');if(!scene)return;
        var self=this;
        // Find poop elements on canvas (they are drawn, not DOM elements)
        // We'll place visual broom near bottom and animate toward poop positions
        var farm=this.ensureData(typeof App!=='undefined'?App.pet:{farm:{}});
        var poopCount=farm.farmPoops||0;
        if(poopCount<=0)return;
        // Clean 20% at a time
        var toClean=Math.max(1,Math.ceil(poopCount*0.2));
        var broom=document.createElement('div');
        broom.style.cssText='position:absolute;font-size:50px;z-index:10;pointer-events:none;bottom:15%;transition:left .8s ease';
        broom.textContent='🧹';
        broom.style.left='5%';
        scene.appendChild(broom);
        var idx=0;
        var iv=setInterval(function(){
            if(idx>=toClean){clearInterval(iv);broom.remove();return;}
            // Move broom to poop position
            var px=((idx*0.17+0.08)%0.85)*100;
            broom.style.left=px+'%';
            broom.style.bottom='15%';
            // After reaching poop, shake and poop disappears
            setTimeout(function(){
                broom.style.transform='rotate(-15deg)';
                setTimeout(function(){broom.style.transform='rotate(15deg)';
                    setTimeout(function(){broom.style.transform='rotate(0)';},150);
                },150);
                idx++;
            },900);
        },1100);
    },

    drawFarmPoops:function(){
        if(!this.ctx||!this.canvas)return;
        var farm=this.ensureData(typeof App!=='undefined'?App.pet:{});
        if(!farm)return;
        var count=farm.farmPoops||0;
        if(count<=0)return;
        // Draw poops spread across bottom of canvas
        var ctx=this.ctx;
        ctx.font=(this.canvas.width*0.05)+'px serif';
        ctx.textAlign='center';
        for(var i=0;i<count;i++){
            // Stable positions based on index
            var x=((i*0.17+0.1)%0.9)*this.canvas.width;
            var y=this.canvas.height*0.78+((i%3)*this.canvas.height*0.05);
            ctx.fillText('💩',x,y);
        }
        ctx.textAlign='left';
    }
,

    _updateFarmSky:function(){
        var scene=document.getElementById('farm-scene');if(!scene)return;
        var h=(typeof Weather!=='undefined')?Weather.getHour():12;
        var top,mid;
        if(h>=8&&h<17){top='#87CEEB';mid='#b8e4f0';}
        else if(h>=17&&h<20){top='#FFB347';mid='#FFCC99';}
        else if(h>=20||h<5){top='#0a1228';mid='#1a2848';}
        else{top='#FF9966';mid='#FFD4A3';}
        scene.style.backgroundImage="url('../assets/backgrounds/enclos.png'),linear-gradient(180deg,"+top+" 0%,"+mid+" 48%,#3a6a28 48%,#3a6a28 100%)";
        scene.style.backgroundSize='cover,100% 100%';
        scene.style.backgroundPosition='center bottom,center';
    }
};