var Weather = {
    HOUR_MS:120000,
    startTime:null, startHour:6,
    canvas:null, ctx:null,
    clouds:[], raindrops:[], fogParticles:[],
    animFrame:null, lastBuildingState:null,
    rainAudio:null, rainPlaying:false,
    SCHEDULE:{fog:[[8,9],[20,21]],rain:[[3,4],[15,16]]},
    _started:false,

    init:function(){
        this.startTime=Date.now();
        this.canvas=document.getElementById('weather-canvas');
        if(!this.canvas){console.warn('Weather: no canvas');return;}
        this.ctx=this.canvas.getContext('2d');

        this.rainAudio=new Audio('assets/sounds/rain.mp3');
        this.rainAudio.loop=true;this.rainAudio.volume=0.25;

        // Delay start until canvas is actually visible and has dimensions
        var self=this;
        this._started=false;
        setTimeout(function(){self._startRendering();},100);
        window.addEventListener('resize',function(){self.resizeCanvas();});
    },

    _startRendering:function(){
        if(this._started)return;
        this.resizeCanvas();
        // If canvas still has no size, retry
        if(this.canvas.width<10||this.canvas.height<10){
            var self=this;
            setTimeout(function(){self._startRendering();},200);
            return;
        }
        this._started=true;
        this.initClouds();
        this.updateSky();
        this.updateBuilding();
        this.updateClock();
        this.tick();
    },

    resizeCanvas:function(){
        if(!this.canvas)return;
        var s=document.querySelector('.scene');
        if(!s)return;
        var w=s.offsetWidth,h=s.offsetHeight;
        if(w>0&&h>0){
            this.canvas.width=w;
            this.canvas.height=h;
        }
    },

    getGameHour:function(){return(this.startHour+(Date.now()-this.startTime)/this.HOUR_MS)%24;},
    getFormattedTime:function(){var h=this.getGameHour(),hh=Math.floor(h),mm=Math.floor((h-hh)*60);return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');},
    isDaytime:function(){var h=this.getGameHour();return h>=7&&h<21;},
    getSkyBrightness:function(){
        var h=this.getGameHour();
        if(h>=8&&h<18)return 1;
        if(h>=22||h<4)return 0;
        if(h>=4&&h<8)return(h-4)/4;
        if(h>=18&&h<22)return 1-(h-18)/4;
        return 0.5;
    },
    isInRange:function(h,r){for(var i=0;i<r.length;i++)if(h>=r[i][0]&&h<r[i][1])return true;return false;},
    getWeather:function(){var h=this.getGameHour();if(this.isInRange(h,this.SCHEDULE.rain))return'rain';if(this.isInRange(h,this.SCHEDULE.fog))return'fog';return'clear';},

    initClouds:function(){
        this.clouds=[];
        var cw=this.canvas.width||400;
        for(var i=0;i<5;i++){
            this.clouds.push({x:Math.random()*cw,y:15+Math.random()*45,speed:0.2+Math.random()*0.3,scale:0.4+Math.random()*0.5,opacity:0.5+Math.random()*0.3});
        }
    },

    updateClouds:function(w){
        var dense=w==='rain'||w==='fog',target=dense?10:5;
        var cw=this.canvas.width;
        while(this.clouds.length<target)this.clouds.push({x:-200,y:15+Math.random()*(dense?80:50),speed:(dense?0.1:0.2)+Math.random()*(dense?0.12:0.3),scale:dense?0.6+Math.random()*0.6:0.4+Math.random()*0.5,opacity:dense?0.55+Math.random()*0.3:0.5+Math.random()*0.3});
        while(this.clouds.length>target)this.clouds.pop();
        for(var i=0;i<this.clouds.length;i++){
            var c=this.clouds[i];c.x+=c.speed;
            if(c.x>cw+150){c.x=-200;c.y=15+Math.random()*(dense?80:50);}
        }
    },

    drawClouds:function(){
        var ctx=this.ctx;
        for(var i=0;i<this.clouds.length;i++){
            var c=this.clouds[i];
            var w=120*c.scale,h=50*c.scale;
            ctx.globalAlpha=c.opacity;
            ctx.fillStyle='rgba(220,230,240,0.9)';
            ctx.beginPath();
            // Draw cloud shape with arcs
            ctx.arc(c.x+w*0.3,c.y+h*0.6,h*0.5,0,Math.PI*2);
            ctx.arc(c.x+w*0.5,c.y+h*0.35,h*0.6,0,Math.PI*2);
            ctx.arc(c.x+w*0.7,c.y+h*0.55,h*0.45,0,Math.PI*2);
            ctx.fill();
        }
        ctx.globalAlpha=1;
    },

    drawCelestial:function(){
        var h=this.getGameHour(),ctx=this.ctx,cw=this.canvas.width,ch=this.canvas.height;
        // Sun 6h-20h
        if(h>=6&&h<20){
            var p=(h-6)/14;
            var x=p*(cw-60)+20;
            var arcY=Math.sin(p*Math.PI);
            var y=ch*0.2-arcY*ch*0.15+10;
            var sz=40+arcY*15;
            var alpha=Math.min(1,Math.min((h-6)/1.5,(20-h)/1.5));
            ctx.globalAlpha=alpha;
            // Glow
            var glow=ctx.createRadialGradient(x+sz/2,y+sz/2,sz*0.2,x+sz/2,y+sz/2,sz*1.5);
            glow.addColorStop(0,'rgba(255,220,80,0.4)');glow.addColorStop(1,'rgba(255,220,80,0)');
            ctx.fillStyle=glow;ctx.fillRect(x-sz,y-sz,sz*4,sz*4);
            // Sun disc
            ctx.fillStyle='#ffe040';
            ctx.beginPath();ctx.arc(x+sz/2,y+sz/2,sz/2,0,Math.PI*2);ctx.fill();
            // Inner highlight
            ctx.fillStyle='#fff8a0';
            ctx.beginPath();ctx.arc(x+sz/2-2,y+sz/2-2,sz/3,0,Math.PI*2);ctx.fill();
            ctx.globalAlpha=1;
        }
        // Moon 20h-6h
        if(h>=20||h<6){
            var nh=h>=20?h-20:h+4;
            var p2=nh/10;
            var x2=p2*(cw-50)+10;
            var arcY2=Math.sin(p2*Math.PI);
            var y2=ch*0.15-arcY2*ch*0.1+10;
            var alpha2=Math.min(1,Math.min(nh/1,(10-nh)/1));
            ctx.globalAlpha=alpha2;
            // Glow
            var mg=ctx.createRadialGradient(x2+20,y2+20,10,x2+20,y2+20,45);
            mg.addColorStop(0,'rgba(180,200,255,0.25)');mg.addColorStop(1,'rgba(180,200,255,0)');
            ctx.fillStyle=mg;ctx.fillRect(x2-30,y2-30,100,100);
            // Moon
            ctx.fillStyle='#e8e8f0';
            ctx.beginPath();ctx.arc(x2+20,y2+20,18,0,Math.PI*2);ctx.fill();
            // Crescent shadow
            ctx.fillStyle='rgba(20,20,60,0.4)';
            ctx.beginPath();ctx.arc(x2+26,y2+18,14,0,Math.PI*2);ctx.fill();
            ctx.globalAlpha=1;
        }
    },

    updateRain:function(){
        var h=this.getGameHour(),intensity=0;
        for(var i=0;i<this.SCHEDULE.rain.length;i++){
            var s=this.SCHEDULE.rain[i][0],e=this.SCHEDULE.rain[i][1];
            if(h>=s&&h<e){var mid=(s+e)/2;intensity=h<mid?(h-s)/(mid-s):1-(h-mid)/(e-mid);break;}
        }
        var cw=this.canvas.width,ch=this.canvas.height;
        var target=Math.floor(intensity*250);
        while(this.raindrops.length<target)this.raindrops.push({x:Math.random()*cw,y:Math.random()*-ch,speed:5+Math.random()*8,length:10+Math.random()*20,opacity:0.25+Math.random()*0.4});
        while(this.raindrops.length>target)this.raindrops.pop();
        for(var j=0;j<this.raindrops.length;j++){var d=this.raindrops[j];d.y+=d.speed;d.x-=1.5;if(d.y>ch){d.y=Math.random()*-60;d.x=Math.random()*cw;}}
        if(intensity>0.1&&!this.rainPlaying&&typeof App!=='undefined'&&App.soundOn){this.rainAudio.play().catch(function(){});this.rainAudio.volume=Math.min(0.45,intensity*0.55);this.rainPlaying=true;}
        else if(intensity<=0.1&&this.rainPlaying){this.rainAudio.pause();this.rainPlaying=false;}
    },
    drawRain:function(){
        if(!this.raindrops.length)return;
        var ctx=this.ctx;ctx.lineWidth=1.5;ctx.strokeStyle='rgba(160,196,232,0.7)';
        for(var i=0;i<this.raindrops.length;i++){var d=this.raindrops[i];ctx.globalAlpha=d.opacity;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-2,d.y+d.length);ctx.stroke();}
        ctx.globalAlpha=1;
    },

    updateFog:function(){
        var h=this.getGameHour(),intensity=0;
        for(var i=0;i<this.SCHEDULE.fog.length;i++){var s=this.SCHEDULE.fog[i][0],e=this.SCHEDULE.fog[i][1];if(h>=s&&h<e){var mid=(s+e)/2;intensity=h<mid?(h-s)/(mid-s):1-(h-mid)/(e-mid);break;}}
        var cw=this.canvas.width,ch=this.canvas.height,target=Math.floor(intensity*25);
        while(this.fogParticles.length<target)this.fogParticles.push({x:Math.random()*cw*1.5-cw*0.25,y:ch*0.3+Math.random()*ch*0.5,radius:80+Math.random()*150,speed:0.12+Math.random()*0.2,opacity:0.04+Math.random()*0.08});
        while(this.fogParticles.length>target)this.fogParticles.pop();
        for(var j=0;j<this.fogParticles.length;j++){var p=this.fogParticles[j];p.x+=p.speed;if(p.x-p.radius>cw){p.x=-p.radius*2;}}
    },
    drawFog:function(){
        var ctx=this.ctx;
        for(var i=0;i<this.fogParticles.length;i++){var p=this.fogParticles[i];var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.radius);g.addColorStop(0,'rgba(200,210,220,'+p.opacity+')');g.addColorStop(1,'rgba(200,210,220,0)');ctx.fillStyle=g;ctx.fillRect(p.x-p.radius,p.y-p.radius,p.radius*2,p.radius*2);}
    },

    lerpColor:function(a,b,t){
        var ra=parseInt(a.slice(1,3),16),ga=parseInt(a.slice(3,5),16),ba=parseInt(a.slice(5,7),16);
        var rb=parseInt(b.slice(1,3),16),gb=parseInt(b.slice(3,5),16),bb=parseInt(b.slice(5,7),16);
        return 'rgb('+Math.round(ra+(rb-ra)*t)+','+Math.round(ga+(gb-ga)*t)+','+Math.round(ba+(bb-ba)*t)+')';
    },

    updateSky:function(){
        var h=this.getGameHour(),b=this.getSkyBrightness();
        var sky=document.getElementById('layer-sky');
        if(!sky)return;
        var topColor,botColor;
        if(h>=8&&h<17){topColor='#4a90d0';botColor='#87CEEB';}
        else if(h>=17&&h<19){var t=(h-17)/2;topColor=this.lerpColor('#4a90d0','#1a2040',t);botColor=this.lerpColor('#87CEEB','#e8845c',t);}
        else if(h>=19&&h<21){var t2=(h-19)/2;topColor=this.lerpColor('#1a2040','#0a1020',t2);botColor=this.lerpColor('#e8845c','#1a2040',t2);}
        else if(h>=21||h<4){topColor='#060810';botColor='#0a1628';}
        else if(h>=4&&h<6){var t3=(h-4)/2;topColor=this.lerpColor('#060810','#1a2050',t3);botColor=this.lerpColor('#0a1628','#d48060',t3);}
        else if(h>=6&&h<8){var t4=(h-6)/2;topColor=this.lerpColor('#1a2050','#4a90d0',t4);botColor=this.lerpColor('#d48060','#87CEEB',t4);}
        else{topColor=this.lerpColor('#0a1628','#4a90d0',b);botColor=this.lerpColor('#1a2040','#87CEEB',b);}
        sky.style.background='linear-gradient(180deg,'+topColor+' 0%,'+botColor+' 100%)';
        var ov=document.getElementById('scene-overlay');
        if(ov)ov.style.background='rgba(5,5,30,'+((1-b)*0.3)+')';
    },

    updateBuilding:function(){
        var isDay=this.getSkyBrightness()>0.45;
        var level=(typeof App!=='undefined'&&App.pet)?App.pet.housingLevel||0:0;
        var housing=Engine.HOUSING[level]||Engine.HOUSING[0];
        var src='assets/backgrounds/'+housing.bg+(isDay?'_jour':'_nuit')+'.png';
        if(this.lastBuildingState!==src){this.lastBuildingState=src;var el=document.getElementById('layer-building');if(el)el.innerHTML='<img src="'+src+'" alt="">';}
    },

    updateClock:function(){
        var el=document.getElementById('hud-clock');
        if(el){var icon=this.isDaytime()?'☀️':'🌙';el.textContent=icon+' '+this.getFormattedTime();}
        var we=document.getElementById('hud-weather');
        if(we){var w=this.getWeather();we.textContent=w==='rain'?'🌧️':w==='fog'?'🌫️':'';}
    },

    tick:function(){
        if(!this.canvas||!this.ctx||!this._started)return;
        var w=this.getWeather(),ctx=this.ctx;
        ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.drawCelestial();
        this.updateClouds(w);this.drawClouds();
        if(w==='rain'){this.updateRain();this.drawRain();}else{this.raindrops=[];if(this.rainPlaying){this.rainAudio.pause();this.rainPlaying=false;}}
        if(w==='fog'){this.updateFog();this.drawFog();}else this.fogParticles=[];
        this.updateSky();this.updateBuilding();this.updateClock();
        var self=this;this.animFrame=requestAnimationFrame(function(){self.tick();});
    }
};
