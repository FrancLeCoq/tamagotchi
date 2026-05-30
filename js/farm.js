var Farm = {
    HEN_COST:50, MAX_HENS:20, DEPLETION_RATE:3,
    canvas:null, ctx:null, hens:[], animFrame:null, isOpen:false,
    henImg:null, bgDayImg:null, bgNightImg:null,

    ensureData:function(pet){
        if(!pet.farm) pet.farm={hens:0,feedLevel:100,cleanLevel:100,lastUpdate:Date.now(),deadRecent:0,totalEggs:0,farmPoops:0,pendingEggs:0,eggAccum:0};
        return pet.farm;
    },

    showHenDeathAnimation:function(deaths){
        var scene=document.getElementById('farm-scene');if(!scene)return;
        var self=this;
        // La faucheuse traverse l'écran
        var reaper=document.createElement('div');
        reaper.textContent='💀';
        reaper.style.cssText='position:absolute;left:-60px;top:35%;font-size:54px;z-index:30;pointer-events:none;filter:drop-shadow(0 0 10px rgba(120,0,0,.8))';
        scene.appendChild(reaper);
        if(reaper.animate){
            reaper.animate([
                {left:'-60px',opacity:0},
                {left:'40%',opacity:1,offset:.5},
                {left:'110%',opacity:0}
            ],{duration:2200,easing:'ease-in-out'}).onfinish=function(){reaper.remove();};
        }else{setTimeout(function(){reaper.remove();},2200);}
        // Petite tête de mort sur chaque poule disparue
        (deaths||[]).forEach(function(d){
            if(d.x===undefined)return;
            var rect=self.canvas?self.canvas.getBoundingClientRect():null;
            var sk=document.createElement('div');
            sk.textContent='☠️';
            var leftPct=self.canvas?(d.x/self.canvas.width*100):50;
            var topPct=self.canvas?(d.y/self.canvas.height*100):50;
            sk.style.cssText='position:absolute;left:'+leftPct+'%;top:'+topPct+'%;font-size:32px;z-index:31;pointer-events:none;transform:translate(-50%,-50%)';
            scene.appendChild(sk);
            if(sk.animate){
                sk.animate([
                    {opacity:0,transform:'translate(-50%,-50%) scale(.3)'},
                    {opacity:1,transform:'translate(-50%,-80%) scale(1.2)',offset:.4},
                    {opacity:0,transform:'translate(-50%,-160%) scale(.8)'}
                ],{duration:2500,easing:'ease-out'}).onfinish=function(){sk.remove();};
            }else{setTimeout(function(){sk.remove();},2500);}
        });
    },

    // Décès de poules selon le bonheur de Francis
    checkBonheurDeaths:function(pet){
        var farm=this.ensureData(pet);
        if(farm.hens<=0)return 0;
        var b=pet.bonheur||100;
        var target=0;
        if(b<=0)target=farm.hens;
        else if(b<5)target=4;
        else if(b<10)target=3;
        else if(b<15)target=2;
        else if(b<20)target=1;
        // Combien on a déjà tué pour ce palier
        if(farm._bonheurDeaths===undefined)farm._bonheurDeaths=0;
        // Reset si le bonheur remonte au dessus de 20
        if(b>=20){farm._bonheurDeaths=0;return 0;}
        var toKill=target-farm._bonheurDeaths;
        if(toKill>0){
            toKill=Math.min(toKill,farm.hens);
            // Positions des poules qui meurent (pour l'animation)
            var deaths=[];
            for(var i=0;i<toKill;i++){
                if(this.hens&&this.hens.length>0){
                    var idx=Math.floor(Math.random()*this.hens.length);
                    deaths.push({x:this.hens[idx].x,y:this.hens[idx].y});
                    this.hens.splice(idx,1);
                }
            }
            farm.hens-=toKill;
            farm._bonheurDeaths+=toKill;
            if(this.isOpen)this.showHenDeathAnimation(deaths);
            if(typeof Renderer!=='undefined')Renderer.toast('💀 '+toKill+' poule(s) ont succombé au chagrin de Francis !');
            return toKill;
        }
        return 0;
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
        // 1 œuf / heure réelle / poule (si nourries & propres)
        if(farm.feedLevel>20&&farm.cleanLevel>20&&farm.hens>0){
            farm.eggAccum=(farm.eggAccum||0)+elapsed*farm.hens; // 1/h/hen
            var newEggs=Math.floor(farm.eggAccum);
            if(newEggs>0){farm.eggAccum-=newEggs;farm.pendingEggs=(farm.pendingEggs||0)+newEggs;farm.totalEggs+=newEggs;}
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
        this._initEggCorner();
        if(this._farmSkyIv)clearInterval(this._farmSkyIv);if(this._farmCelIv)clearInterval(this._farmCelIv);if(this._farmRainIv)cancelAnimationFrame(this._farmRainIv);if(this._eggIv)clearInterval(this._eggIv);
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
                targetY:this.canvas.height*0.35+Math.random()*(this.canvas.height*0.37),
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
                    h.targetY=this.canvas.height*0.40+Math.random()*(this.canvas.height*0.30);
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
        if(info) info.innerHTML='<span>🐔 '+farm.hens+'/'+this.MAX_HENS+'</span><span>🪙 '+pet.coins+'</span>';
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
            targetY:this.canvas.height*0.35+Math.random()*(this.canvas.height*0.37),
            speed:0.5+Math.random()*0.5, flipX:false,
            state:'walking', stateTimer:200, bob:Math.random()*Math.PI*2
        });
    },

    showFeedAnimation:function(foodEmoji){
        var scene=document.getElementById('farm-scene');if(!scene)return;
        var self=this;
        // Big corn at center (40% from bottom), pulsing
        var big=document.createElement('div');
        big.style.cssText='position:absolute;bottom:75%;left:50%;transform:translateX(-50%);font-size:72px;z-index:12;pointer-events:none;animation:farmFoodPulse 1s ease-in-out infinite';
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
            var startX=self.canvas?self.canvas.width/2:200,startY=self.canvas?self.canvas.height*0.25:150;
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
        // Couleur synchronisée sur l'heure du jeu (cohérente avec la scène principale)
        var top,mid;
        if(h>=8&&h<17){top='#87CEEB';mid='#b8e4f0';}       // plein jour
        else if(h>=17&&h<19){top='#FFB347';mid='#FFCC99';} // coucher
        else if(h>=19&&h<21){top='#7a5a8a';mid='#b88aa0';} // crépuscule
        else if(h>=21||h<5){top='#0a1228';mid='#1a2848';}  // nuit
        else if(h>=5&&h<7){top='#3a3a6a';mid='#8a7aa0';}   // aube
        else{top='#FF9966';mid='#FFD4A3';}                 // lever (7-8h)
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
        wrap.innerHTML='<div class="farm-sun"></div><div class="farm-moon"></div>'+
            '<div class="farm-cloud farm-cloud1"></div>'+
            '<div class="farm-cloud farm-cloud2"></div>'+
            '<div class="farm-cloud farm-cloud3"></div>';
        // Set cloud backgrounds via JS (avoids quote-collision in inline HTML)
        var cloudBg=(typeof Weather!=='undefined'&&Weather._cloudSVG)?Weather._cloudSVG(false):'';
        if(cloudBg){
            var fc=wrap.querySelectorAll('.farm-cloud');
            for(var ci=0;ci<fc.length;ci++){fc[ci].style.backgroundImage='url("'+cloudBg+'")';fc[ci].style.backgroundSize='contain';fc[ci].style.backgroundRepeat='no-repeat';}
        }
        scene.insertBefore(wrap,scene.firstChild);
        this._farmCelWrap=wrap;
        // Rain canvas for enclos
        var rainC=scene.querySelector('.farm-rain-canvas');
        if(!rainC){rainC=document.createElement('canvas');rainC.className='farm-rain-canvas';rainC.style.cssText='position:absolute;inset:0;z-index:6;pointer-events:none';scene.appendChild(rainC);}
        rainC.width=scene.offsetWidth;rainC.height=scene.offsetHeight;
        this._farmRainCanvas=rainC;this._farmRainCtx=rainC.getContext('2d');
        this._farmRainDrops=[];this._farmRainInit=true;
        var selfR=this;
        if(this._farmRainIv)cancelAnimationFrame(this._farmRainIv);if(this._eggIv)clearInterval(this._eggIv);
        var rainLoop=function(){
            selfR._drawFarmRain();selfR._farmRainIv=requestAnimationFrame(rainLoop);
        };rainLoop();
        this._updateFarmCelestial();
        var self=this;
        if(this._farmCelIv)clearInterval(this._farmCelIv);if(this._farmRainIv)cancelAnimationFrame(this._farmRainIv);if(this._eggIv)clearInterval(this._eggIv);
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
,

    _initEggCorner:function(){
        var scene=document.getElementById('farm-scene');if(!scene)return;
        var old=scene.querySelector('.egg-corner');if(old)old.remove();
        var corner=document.createElement('div');
        corner.className='egg-corner';
        corner.innerHTML='<div class="egg-pile" id="egg-pile"></div><div class="egg-count" id="egg-count">🥚 0</div>';
        scene.appendChild(corner);
        var self=this;
        corner.addEventListener('click',function(){self.collectEggs();});
        this._eggCorner=corner;
        this.updateEggCorner();
        if(this._eggIv)clearInterval(this._eggIv);
        this._eggIv=setInterval(function(){self.updateEggCorner();},2000);
    },

    updateEggCorner:function(){
        if(!this._eggCorner||typeof App==='undefined'||!App.pet||!App.pet.farm)return;
        var n=App.pet.farm.pendingEggs||0;
        var pile=this._eggCorner.querySelector('#egg-pile');
        var cnt=this._eggCorner.querySelector('#egg-count');
        if(cnt)cnt.textContent='🥚 '+n;
        if(pile){
            var show=Math.min(n,12);var html='';
            for(var i=0;i<show;i++){
                var x=(i%4)*16, y=Math.floor(i/4)*12;
                html+='<span class="egg-one" style="left:'+x+'px;bottom:'+y+'px">🥚</span>';
            }
            pile.innerHTML=html;
        }
        this._eggCorner.style.opacity=n>0?'1':'0.5';
    },

    collectEggs:function(){
        if(typeof App==='undefined'||!App.pet||!App.pet.farm)return;
        var n=App.pet.farm.pendingEggs||0;
        if(n<=0){if(typeof Renderer!=='undefined')Renderer.toast('Aucun œuf à ramasser');return;}
        App.pet.coins+=n; // 1 œuf = 1 pièce
        App.pet.farm.pendingEggs=0;
        if(typeof Features!=='undefined')Features.trackQuest(App.pet,'eggs',n);
        if(typeof Renderer!=='undefined')Renderer.toast('🥚→🪙 +'+n+' pièces !');
        // Coin burst animation
        var corner=this._eggCorner;
        if(corner){
            for(var i=0;i<Math.min(n,8);i++){
                (function(idx){setTimeout(function(){
                    var co=document.createElement('div');co.textContent='🪙';
                    co.style.cssText='position:absolute;right:'+(10+Math.random()*30)+'px;bottom:40px;font-size:20px;z-index:20;pointer-events:none;transition:all 1s ease';
                    corner.appendChild(co);
                    requestAnimationFrame(function(){co.style.bottom='160px';co.style.opacity='0';});
                    setTimeout(function(){co.remove();},1000);
                },idx*80);})(i);
            }
        }
        this.updateEggCorner();
        if(typeof App!=='undefined')App.renderFarmUI&&App.renderFarmUI();
        if(typeof Storage!=='undefined')Storage.save(App.pet);
    }
};