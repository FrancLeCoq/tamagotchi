var Farm = {
    HEN_COST:50, MAX_HENS:20, DEPLETION_RATE:3,
    canvas:null, ctx:null, hens:[], animFrame:null, isOpen:false,
    henImg:null, bgDayImg:null, bgNightImg:null,

    ensureData:function(pet){
        if(!pet.farm) pet.farm={hens:0,feedLevel:100,cleanLevel:100,lastUpdate:Date.now(),deadRecent:0,totalEggs:0,farmPoops:0};
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
        this._initFarmCelestial();
        if(this._farmSkyIv)clearInterval(this._farmSkyIv);if(this._farmCelIv)clearInterval(this._farmCelIv);if(this._farmRainIv)cancelAnimationFrame(this._farmRainIv);
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
                targetX:this.canvas.width*0.28+Math.random()*(this.canvas.width*0.65),
                targetY:this.canvas.height*0.35+Math.random()*(this.canvas.height*0.45),
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
                    h.targetX=this.canvas.width*0.28+Math.random()*(this.canvas.width*0.65);
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
            var sz=70;
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
        var farm=(typeof App!=='undefined'&&App.pet)?App.pet.farm:null;
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
            targetX:this.canvas.width*0.28+Math.random()*(this.canvas.width*0.65),
            targetY:this.canvas.height*0.35+Math.random()*(this.canvas.height*0.45),
            speed:0.5+Math.random()*0.5, flipX:false,
            state:'walking', stateTimer:200, bob:Math.random()*Math.PI*2
        });
    },

    showFeedAnimation:function(foodEmoji){
        var scene=document.getElementById('farm-scene');if(!scene)return;
        var self=this;
        // Big corn at center (40% from bottom), pulsing
        var big=document.createElement('div');
        big.style.cssText='position:absolute;bottom:65%;left:50%;transform:translateX(-50%);font-size:72px;z-index:12;pointer-events:none;animation:farmFoodPulse 1s ease-in-out infinite';
        big.textContent='🌽';
        scene.appendChild(big);
        var count=0,maxCount=18;
        var loop=setInterval(function(){
            if(!self.isOpen||count>=maxCount){clearInterval(loop);setTimeout(function(){if(big.parentNode)big.remove();},600);return;}
            count++;
            // Target an actual hen position (or random if none)
            var tx,ty;
            if(self.hens&&self.hens.length&&self.canvas){
                var h=self.hens[Math.floor(Math.random()*self.hens.length)];
                tx=h.x;ty=h.y;
            }else{tx=self.canvas?self.canvas.width*(0.3+Math.random()*0.6):200;ty=self.canvas?self.canvas.height*(0.5+Math.random()*0.3):200;}
            var item=document.createElement('div');
            var startX=self.canvas?self.canvas.width/2:200,startY=self.canvas?self.canvas.height*0.35:150;
            var dx=tx-startX,dy=ty-startY;
            item.style.cssText='position:absolute;font-size:28px;z-index:11;pointer-events:none;left:'+startX+'px;top:'+startY+'px';
            item.textContent='🌽';
            scene.appendChild(item);
            // Fly to hen + fade to 0 on arrival (same as main scene)
            if(item.animate){
                item.animate([
                    {transform:'translate(0,0) scale(1)',opacity:1},
                    {transform:'translate('+dx*0.85+'px,'+dy*0.85+'px) scale(.6)',opacity:.85,offset:.7},
                    {transform:'translate('+dx+'px,'+dy+'px) scale(.2)',opacity:0}
                ],{duration:1400,easing:'ease-in',fill:'forwards'}).onfinish=function(){if(item.parentNode)item.remove();};
            }else{setTimeout(function(){if(item.parentNode)item.remove();},1400);}
        },600);
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
        if(typeof App==='undefined'||!App.pet||!App.pet.farm)return;
        var farm=App.pet.farm;
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
        // Rain darkening
        var raining=(typeof Weather!=='undefined'&&Weather._isRaining)?Weather._isRaining():false;
        scene.classList.toggle('raining',raining);
        var top,mid;
        if(h>=8&&h<17){top='#87CEEB';mid='#b8e4f0';}
        else if(h>=17&&h<20){top='#FFB347';mid='#FFCC99';}
        else if(h>=20||h<5){top='#0a1228';mid='#1a2848';}
        else{top='#FF9966';mid='#FFD4A3';}
        scene.style.backgroundImage="url('../assets/backgrounds/enclos.png'),linear-gradient(180deg,"+top+" 0%,"+mid+" 48%,#3a6a28 48%,#3a6a28 100%)";
        scene.style.backgroundSize='cover,100% 100%';
        scene.style.backgroundPosition='center bottom,center';
    }
,

    _initFarmCelestial:function(){
        var scene=document.getElementById('farm-scene');if(!scene)return;
        // Remove old
        var old=scene.querySelector('.farm-celestial');if(old)old.remove();
        var wrap=document.createElement('div');
        wrap.className='farm-celestial';
        wrap.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;overflow:hidden';
        wrap.innerHTML='<div class="farm-sun"></div><div class="farm-moon"></div><div class="farm-cloud farm-cloud1"></div><div class="farm-cloud farm-cloud2"></div><div class="farm-cloud farm-cloud3"></div>';
        scene.insertBefore(wrap,scene.firstChild);
        this._farmCelWrap=wrap;
        // Rain canvas for enclos
        var rainC=scene.querySelector('.farm-rain-canvas');
        if(!rainC){rainC=document.createElement('canvas');rainC.className='farm-rain-canvas';rainC.style.cssText='position:absolute;inset:0;z-index:6;pointer-events:none';scene.appendChild(rainC);}
        rainC.width=scene.offsetWidth;rainC.height=scene.offsetHeight;
        this._farmRainCanvas=rainC;this._farmRainCtx=rainC.getContext('2d');
        this._farmRainDrops=[];this._farmRainInit=true;
        var selfR=this;
        if(this._farmRainIv)cancelAnimationFrame(this._farmRainIv);
        var rainLoop=function(){
            selfR._drawFarmRain();selfR._farmRainIv=requestAnimationFrame(rainLoop);
        };rainLoop();
        this._updateFarmCelestial();
        var self=this;
        if(this._farmCelIv)clearInterval(this._farmCelIv);if(this._farmRainIv)cancelAnimationFrame(this._farmRainIv);
        this._farmCelIv=setInterval(function(){self._updateFarmCelestial();},2000);
    },

    _updateFarmCelestial:function(){
        if(!this._farmCelWrap)return;
        var h=(typeof Weather!=='undefined')?Weather.getHour():12;
        var sun=this._farmCelWrap.querySelector('.farm-sun');
        var moon=this._farmCelWrap.querySelector('.farm-moon');
        var w=this._farmCelWrap.offsetWidth||400;
        if(sun){
            if(h>=6&&h<20){var p=(h-6)/14;sun.style.opacity=Math.min(1,Math.min((h-6)/1.5,(20-h)/1.5));sun.style.left=(p*(w-50)+10)+'px';sun.style.top='8px';}
            else sun.style.opacity='0';
        }
        if(moon){
            if(h>=20||h<6){var nh=h>=20?h-20:h+4,p2=nh/10;moon.style.opacity=Math.min(1,Math.min(nh,10-nh));moon.style.left=(p2*(w-40)+10)+'px';moon.style.top='8px';}
            else moon.style.opacity='0';
        }
    }
,

    _drawFarmRain:function(){
        if(!this._farmRainCtx||!this._farmRainCanvas)return;
        var ctx=this._farmRainCtx,cw=this._farmRainCanvas.width,ch=this._farmRainCanvas.height;
        ctx.clearRect(0,0,cw,ch);
        var raining=(typeof Weather!=='undefined'&&Weather._isRaining)?Weather._isRaining():false;
        var tgt=raining?150:0;
        while(this._farmRainDrops.length<tgt)this._farmRainDrops.push({x:Math.random()*cw,y:Math.random()*-ch,s:5+Math.random()*8,l:10+Math.random()*16});
        while(this._farmRainDrops.length>tgt)this._farmRainDrops.pop();
        if(this._farmRainDrops.length){
            ctx.strokeStyle='rgba(160,196,232,.6)';ctx.lineWidth=1.5;
            for(var k=0;k<this._farmRainDrops.length;k++){
                var d=this._farmRainDrops[k];d.y+=d.s;d.x-=1.5;
                if(d.y>ch){d.y=-20;d.x=Math.random()*cw;}
                ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-2,d.y+d.l);ctx.stroke();
            }
        }
    }
};