var Weather={
    HOUR_MS:120000, startTime:null, startHour:6,
    canvas:null, ctx:null, clouds:[], raindrops:[],
    lastBuildingState:null, _running:false,
    _sunEl:null, _moonEl:null, _cloudEls:[],
    SCHEDULE:{rain:[[3,4],[15,16]]},

    init:function(){
        var self=this;
        this.startTime=Date.now();
        this.startHour=(typeof App!=='undefined'&&App.pet&&App.pet.startRealHour!==undefined)
            ?App.pet.startRealHour:new Date().getHours();

        // Get HTML celestial elements
        this._sunEl=document.getElementById('cel-sun');
        this._moonEl=document.getElementById('cel-moon');
        this._initClouds();

        // Apply sky immediately
        this._applySky();this.updateBuilding();this.updateClock();

        // Canvas for rain only
        var tries=0;
        function tryCanvas(){
            tries++;
            var c=document.getElementById('weather-canvas');
            if(!c){if(tries<20)setTimeout(tryCanvas,300);return;}
            var scene=document.querySelector('.scene');
            var sw=scene?scene.clientWidth:window.innerWidth;
            var sh=scene?scene.clientHeight:600;
            if(sw<10||sh<10){if(tries<20)setTimeout(tryCanvas,300);return;}
            self.canvas=c; c.width=sw; c.height=sh;
            self.ctx=c.getContext('2d');
            if(!self._running){self._running=true;self._loop();}
        }
        setTimeout(tryCanvas,400);

        // Update celestial positions every 2s + sky refresh
        setInterval(function(){
            self._applySky();self._moveCelestial();
            self.updateBuilding();self.updateClock();self._checkRocketLaunch();
        },2000);
        setTimeout(function(){self._moveCelestial();},200);
    },

    getHour:function(){return(this.startHour+(Date.now()-this.startTime)/this.HOUR_MS)%24;},
    jumpHours:function(h){
        this.startHour=(this.startHour+h)%24;
        this._applySky();this._moveCelestial();this.updateBuilding();this.updateClock();
    },
    setHour:function(targetHour){
        // Set clock to exact game hour (accounts for elapsed time)
        var elapsedHours=(Date.now()-this.startTime)/this.HOUR_MS;
        this.startHour=((targetHour-elapsedHours)%24+24)%24;
        this._applySky();this._moveCelestial();this.updateBuilding();this.updateClock();
    },
    getBri:function(){var h=this.getHour();if(h>=8&&h<18)return 1;if(h>=22||h<4)return 0;if(h>=4&&h<8)return(h-4)/4;if(h>=18&&h<22)return 1-(h-18)/4;return .5;},
    getSkyBrightness:function(){return this.getBri();},

    _applySky:function(){
        var sky=document.getElementById('layer-sky');if(!sky)return;
        var h=this.getHour(),t,r1,g1,b1,r2,g2,b2;
        if(h>=8&&h<17){r1=74;g1=144;b1=208;r2=135;g2=206;b2=235;}
        else if(h>=17&&h<19){t=(h-17)/2;r1=74-48*t|0;g1=144-112*t|0;b1=208-144*t|0;r2=135+97*t|0;g2=206-74*t|0;b2=235-143*t|0;}
        else if(h>=19&&h<21){t=(h-19)/2;r1=26-16*t|0;g1=32-16*t|0;b1=64-32*t|0;r2=232-206*t|0;g2=132-100*t|0;b2=92-28*t|0;}
        else if(h>=21||h<4){r1=6;g1=8;b1=16;r2=10;g2=22;b2=40;}
        else if(h>=4&&h<6){t=(h-4)/2;r1=6+20*t|0;g1=8+24*t|0;b1=16+64*t|0;r2=10+202*t|0;g2=22+106*t|0;b2=40+56*t|0;}
        else{t=(h-6)/2;r1=26+48*t|0;g1=32+112*t|0;b1=80+128*t|0;r2=212-77*t|0;g2=128+78*t|0;b2=96+139*t|0;}
        sky.style.background='linear-gradient(180deg,rgb('+r1+','+g1+','+b1+') 0%,rgb('+r2+','+g2+','+b2+') 100%)';
        var ov=document.getElementById('scene-overlay');
        if(ov)ov.style.background='rgba(5,5,30,'+((1-this.getBri())*.3)+')';
    },

    _moveCelestial:function(){
        var h=this.getHour();
        var scene=document.querySelector('.scene');
        if(!scene||!this._sunEl||!this._moonEl)return;
        var sw=scene.offsetWidth||400, sh=scene.offsetHeight||600;

        // SUN: arc from left to right 6h-20h
        if(h>=6&&h<20){
            var p=(h-6)/14;
            var sx=p*(sw-90)+10;
            var sy=sh*.02+(1-Math.sin(p*Math.PI))*sh*.10;
            var al=Math.min(1,Math.min((h-6)/1.5,(20-h)/1.5));
            this._sunEl.style.left=sx+'px';
            this._sunEl.style.top=sy+'px';
            this._sunEl.style.opacity=al;
        }else{this._sunEl.style.opacity='0';}

        // MOON: arc 20h-6h
        if(h>=20||h<6){
            var nh=h>=20?h-20:h+4,p2=nh/10;
            var mx=p2*(sw-65)+8;
            var my=sh*.02+(1-Math.sin(p2*Math.PI))*sh*.08;
            var ma=Math.min(1,Math.min(nh,10-nh));
            this._moonEl.style.opacity=ma;
            this._moonEl.style.left=mx+'px';
            this._moonEl.style.top=my+'px';
            this._moonEl.style.opacity=ma;
        }else{this._moonEl.style.opacity='0';}
    },

    _cloudSVG:function(dark){
        var fill=dark?'%23aab0bd':'%23ffffff';
        var fill2=dark?'%239aa0ad':'%23f2f5fb';
        return 'data:image/svg+xml;utf8,'+
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 90">'+
        '<g fill="'+fill+'">'+
        '<ellipse cx="55" cy="58" rx="48" ry="30"/>'+
        '<ellipse cx="105" cy="42" rx="56" ry="38"/>'+
        '<ellipse cx="150" cy="56" rx="46" ry="30"/>'+
        '<ellipse cx="100" cy="62" rx="80" ry="26"/>'+
        '</g>'+
        '<g fill="'+fill2+'" opacity="0.6">'+
        '<ellipse cx="95" cy="40" rx="44" ry="26"/>'+
        '</g>'+
        '</svg>';
    },
    _initClouds:function(){
        var self=this;
        var container=document.getElementById('layer-clouds');if(!container)return;
        container.innerHTML='';
        this._cloudEls=[];
        var scene=document.querySelector('.scene');
        var sw=scene?scene.offsetWidth:400;
        for(var i=0;i<6;i++){
            var el=document.createElement('div');
            el.className='cloud-el';
            var w=90+Math.random()*110;
            var h=w*0.38;
            el.style.cssText='width:'+w+'px;height:'+(w*0.45)+'px;top:'+(8+Math.random()*45)+'px;left:'+(Math.random()*sw)+'px;background:url(\''+self._cloudSVG(false)+'\') center/contain no-repeat;opacity:'+(0.78+Math.random()*0.18)+';filter:drop-shadow(0 4px 6px rgba(0,0,0,.06));';
            container.appendChild(el);
            this._cloudEls.push({el:el,x:parseFloat(el.style.left),s:0.12+Math.random()*0.35,w:w,baseOp:el.style.opacity||'0.85'});
        }
        // Animate clouds
        setInterval(function(){
            var sw2=scene?scene.offsetWidth:400;
            var raining=self._isRaining();
            for(var j=0;j<self._cloudEls.length;j++){
                var cl=self._cloudEls[j];
                cl.x+=cl.s*(raining?1.8:1);if(cl.x>sw2+cl.w+20)cl.x=-(cl.w+20);
                cl.el.style.left=cl.x+'px';
                // Darken clouds when raining
                if(raining){cl.el.style.filter='brightness(0.55) saturate(0.7)';cl.el.style.opacity='0.95';}
                else{cl.el.style.filter='';cl.el.style.opacity=cl.baseOp||'0.85';}
            }
            // Extra rain clouds
            if(raining&&self._cloudEls.length<10){self._addRainCloud(sw2);}
            else if(!raining&&self._cloudEls.length>6){
                var extra=self._cloudEls.pop();if(extra&&extra.el)extra.el.remove();
            }
        },50);
    },

    launchRocket:function(){
        var scene=document.querySelector('.scene');if(!scene)return;
        var r=document.createElement('div');
        r.textContent='🚀';
        r.style.cssText='position:absolute;left:50%;bottom:35%;font-size:34px;z-index:8;pointer-events:none;transform:translateX(-50%) rotate(-45deg)';
        scene.appendChild(r);
        // Trail
        if(r.animate){
            r.animate([
                {bottom:'35%',opacity:1,transform:'translateX(-50%) rotate(-45deg) scale(1)'},
                {bottom:'105%',opacity:0,transform:'translateX(20%) rotate(-45deg) scale(.5)'}
            ],{duration:2500,easing:'ease-in',fill:'forwards'}).onfinish=function(){r.remove();};
        }else{setTimeout(function(){r.remove();},2500);}
    },
    _checkRocketLaunch:function(){
        var l=(typeof App!=='undefined'&&App.pet)?App.pet.housingLevel||0:0;
        var ho=(typeof Engine!=='undefined'&&Engine.HOUSING)?Engine.HOUSING[l]:null;
        if(!ho||ho.bg!=='spacex')return;
        var gameHour=this.getHour();
        var gameMin=Math.floor((this.startHour*60+(Date.now()-this.startTime)/this.HOUR_MS*60));
        // Launch every 10 game-minutes
        var slot=Math.floor(gameMin/10);
        if(this._lastRocketSlot===undefined)this._lastRocketSlot=slot;
        if(slot>this._lastRocketSlot){this._lastRocketSlot=slot;this.launchRocket();}
    },
    updateBuilding:function(){
        var d=this.getBri()>.45;
        var l=(typeof App!=='undefined'&&App.pet)?App.pet.housingLevel||0:0;
        var ho=(typeof Engine!=='undefined'&&Engine.HOUSING)?Engine.HOUSING[l]||Engine.HOUSING[0]:{bg:'poulailler'};
        var src='assets/backgrounds/'+ho.bg+(d?'_jour':'_nuit')+'.png';
        // Per-building vertical position from bottom
        var vPos={poulailler:25,bois:25,brique:15,chateau:15,palace:30,spacex:18}[ho.bg]||25;
        var el=document.getElementById('layer-building');
        if(el)el.style.bottom=vPos+'%';
        if(this.lastBuildingState!==src){this.lastBuildingState=src;
            if(el)el.innerHTML='<img src="'+src+'">';}
    },
    updateClock:function(){
        var h=this.getHour(),hh=Math.floor(h),mm=Math.floor((h-hh)*60);
        var el=document.getElementById('hud-clock');
        if(el)el.textContent=(h>=7&&h<21?'☀️':'🌙')+' '+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    },

    // Canvas only used for rain now
    _addRainCloud:function(sw){
        var container=document.getElementById('layer-clouds');if(!container)return;
        var el=document.createElement('div');el.className='cloud-el';
        var w=110+Math.random()*90,h=w*0.4;
        el.style.cssText='width:'+w+'px;height:'+(w*0.45)+'px;top:'+(8+Math.random()*40)+'px;left:'+(Math.random()*sw)+'px;background:url(\''+this._cloudSVG(true)+'\') center/contain no-repeat;opacity:0.92;';
        container.appendChild(el);
        this._cloudEls.push({el:el,x:parseFloat(el.style.left),s:0.18+Math.random()*0.4,w:w,baseOp:'0.85'});
    },
    _isRaining:function(){
        var h=this.getHour();
        for(var j=0;j<this.SCHEDULE.rain.length;j++){
            if(h>=this.SCHEDULE.rain[j][0]&&h<this.SCHEDULE.rain[j][1])return true;
        }
        return false;
    },
    _loop:function(){
        if(!this.ctx)return;
        var ctx=this.ctx,cw=this.canvas.width,ch=this.canvas.height,h=this.getHour();
        ctx.clearRect(0,0,cw,ch);
        var inten=0;
        for(var j=0;j<this.SCHEDULE.rain.length;j++){
            var rs=this.SCHEDULE.rain[j][0],re=this.SCHEDULE.rain[j][1];
            if(h>=rs&&h<re){var mid=(rs+re)/2;inten=h<mid?(h-rs)/(mid-rs):1-(h-mid)/(re-mid);}
        }
        var tgt=Math.floor(inten*200);
        while(this.raindrops.length<tgt)this.raindrops.push({x:Math.random()*cw,y:Math.random()*-ch,s:5+Math.random()*8,l:10+Math.random()*18});
        while(this.raindrops.length>tgt)this.raindrops.pop();
        if(this.raindrops.length){
            ctx.strokeStyle='rgba(160,196,232,.65)';ctx.lineWidth=1.5;
            for(var k=0;k<this.raindrops.length;k++){
                var d=this.raindrops[k];d.y+=d.s;d.x-=1.5;
                if(d.y>ch){d.y=-30;d.x=Math.random()*cw;}
                ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-2,d.y+d.l);ctx.stroke();
            }
        }
        var self=this;requestAnimationFrame(function(){self._loop();});
    }
};
