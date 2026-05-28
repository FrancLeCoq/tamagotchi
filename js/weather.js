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
            self.updateBuilding();self.updateClock();
        },2000);
        setTimeout(function(){self._moveCelestial();},200);
    },

    getHour:function(){return(this.startHour+(Date.now()-this.startTime)/this.HOUR_MS)%24;},
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
            var sy=sh*.08+(1-Math.sin(p*Math.PI))*sh*.18;
            var al=Math.min(1,Math.min((h-6)/1.5,(20-h)/1.5));
            this._sunEl.style.display='block';
            this._sunEl.style.left=sx+'px';
            this._sunEl.style.top=sy+'px';
            this._sunEl.style.opacity=al;
        }else{this._sunEl.style.display='none';}

        // MOON: arc 20h-6h
        if(h>=20||h<6){
            var nh=h>=20?h-20:h+4,p2=nh/10;
            var mx=p2*(sw-65)+8;
            var my=sh*.05+(1-Math.sin(p2*Math.PI))*sh*.15;
            var ma=Math.min(1,Math.min(nh,10-nh));
            this._moonEl.style.display='block';
            this._moonEl.style.left=mx+'px';
            this._moonEl.style.top=my+'px';
            this._moonEl.style.opacity=ma;
        }else{this._moonEl.style.display='none';}
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
            el.style.cssText='width:'+w+'px;height:'+h+'px;top:'+(8+Math.random()*50)+'px;left:'+(Math.random()*sw)+'px;background:rgba(230,238,252,'+(0.45+Math.random()*0.35)+');border-radius:'+h+'px '+h+'px '+h+'px '+h+'px;';
            container.appendChild(el);
            this._cloudEls.push({el:el,x:parseFloat(el.style.left),s:0.12+Math.random()*0.35,w:w});
        }
        // Animate clouds
        setInterval(function(){
            var sw2=scene?scene.offsetWidth:400;
            for(var j=0;j<self._cloudEls.length;j++){
                var c=self._cloudEls[j];
                c.x+=c.s;if(c.x>sw2+c.w+20)c.x=-(c.w+20);
                c.el.style.left=c.x+'px';
            }
        },50);
    },

    updateBuilding:function(){
        var d=this.getBri()>.45;
        var l=(typeof App!=='undefined'&&App.pet)?App.pet.housingLevel||0:0;
        var ho=(typeof Engine!=='undefined'&&Engine.HOUSING)?Engine.HOUSING[l]||Engine.HOUSING[0]:{bg:'poulailler'};
        var src='assets/backgrounds/'+ho.bg+(d?'_jour':'_nuit')+'.png';
        if(this.lastBuildingState!==src){this.lastBuildingState=src;
            var el=document.getElementById('layer-building');if(el)el.innerHTML='<img src="'+src+'">';}
    },
    updateClock:function(){
        var h=this.getHour(),hh=Math.floor(h),mm=Math.floor((h-hh)*60);
        var el=document.getElementById('hud-clock');
        if(el)el.textContent=(h>=7&&h<21?'☀️':'🌙')+' '+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    },

    // Canvas only used for rain now
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
