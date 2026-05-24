var Weather = {
    HOUR_MS:120000, startTime:null, startHour:6,
    canvas:null, ctx:null, clouds:[], raindrops:[], fogParticles:[],
    animFrame:null, lastBgState:null, lastBuildingState:null,
    rainAudio:null, rainPlaying:false,
    cloudImg1:null, cloudImg2:null, sunImg:null, moonImg:null,
    SCHEDULE:{fog:[[8,9],[20,21]],rain:[[3,4],[15,16]]},

    init:function(){
        this.startTime=Date.now();
        this.canvas=document.getElementById('weather-canvas');
        if(!this.canvas) return;
        this.ctx=this.canvas.getContext('2d');
        this.resizeCanvas();
        var self=this;window.addEventListener('resize',function(){self.resizeCanvas();});
        this.cloudImg1=new Image();this.cloudImg1.src='assets/weather/nuage1.png';
        this.cloudImg2=new Image();this.cloudImg2.src='assets/weather/nuage2.png';
        this.sunImg=new Image();this.sunImg.src='assets/weather/soleil.png';
        this.moonImg=new Image();this.moonImg.src='assets/weather/lune.png';
        this.rainAudio=new Audio('assets/sounds/rain.mp3');
        this.rainAudio.loop=true;this.rainAudio.volume=0.25;
        this.initClouds();this.tick();
    },
    resizeCanvas:function(){var s=document.querySelector('.scene');if(!s||!this.canvas)return;this.canvas.width=s.offsetWidth;this.canvas.height=s.offsetHeight;},
    getGameHour:function(){return(this.startHour+(Date.now()-this.startTime)/this.HOUR_MS)%24;},
    getFormattedTime:function(){var h=this.getGameHour(),hh=Math.floor(h),mm=Math.floor((h-hh)*60);return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');},
    isDaytime:function(){var h=this.getGameHour();return h>=7&&h<21;},
    getSkyBrightness:function(){var h=this.getGameHour();if(h>=8&&h<19)return 1;if(h>=21||h<5)return 0;if(h>=5&&h<8)return(h-5)/3;if(h>=19&&h<21)return 1-(h-19)/2;return .5;},
    isInRange:function(h,r){for(var i=0;i<r.length;i++)if(h>=r[i][0]&&h<r[i][1])return true;return false;},
    getWeather:function(){var h=this.getGameHour();if(this.isInRange(h,this.SCHEDULE.rain))return'rain';if(this.isInRange(h,this.SCHEDULE.fog))return'fog';return'clear';},

    initClouds:function(){this.clouds=[];for(var i=0;i<4;i++)this.clouds.push({x:Math.random()*(this.canvas.width+400)-200,y:-45+Math.random()*30,speed:.15+Math.random()*.25,type:Math.random()>.5?1:2,scale:.35+Math.random()*.45,opacity:.45+Math.random()*.3});},

    updateClouds:function(w){
        var dense=w==='rain'||w==='fog',target=dense?10:4;
        while(this.clouds.length<target)this.clouds.push({x:-300,y:-45+Math.random()*(dense?60:30),speed:(dense?.06:.15)+Math.random()*(dense?.08:.25),type:Math.random()>.5?1:2,scale:dense?.6+Math.random()*.6:.35+Math.random()*.45,opacity:dense?.7+Math.random()*.25:.45+Math.random()*.3});
        while(this.clouds.length>target)this.clouds.pop();
        for(var i=0;i<this.clouds.length;i++){var c=this.clouds[i];c.x+=c.speed*(dense?.4:1);var cw=(c.type===1?354:188)*c.scale;if(c.x>this.canvas.width+100){c.x=-cw-50;c.y=-45+Math.random()*(dense?60:30);}}
    },
    drawClouds:function(){for(var i=0;i<this.clouds.length;i++){var c=this.clouds[i],img=c.type===1?this.cloudImg1:this.cloudImg2;if(!img||!img.complete)continue;this.ctx.globalAlpha=c.opacity;this.ctx.drawImage(img,c.x,c.y,img.naturalWidth*c.scale,img.naturalHeight*c.scale);}this.ctx.globalAlpha=1;},

    drawCelestial:function(){
        var h=this.getGameHour(),cw=this.canvas.width;
        if(h>=6&&h<20&&this.sunImg&&this.sunImg.complete){var p=(h-6)/14,x=p*(cw-50)+10,y=3+Math.sin(p*Math.PI)*-18+20,sz=45+Math.sin(p*Math.PI)*10;this.ctx.globalAlpha=Math.min(1,Math.min((h-6)/1.5,(20-h)/1.5));this.ctx.drawImage(this.sunImg,x,y,sz,sz);this.ctx.globalAlpha=1;}
        if((h>=20||h<6)&&this.moonImg&&this.moonImg.complete){var nh=h>=20?h-20:h+4,p2=nh/10,x2=p2*(cw-45)+10,y2=3+Math.sin(p2*Math.PI)*-15+18;this.ctx.globalAlpha=Math.min(1,Math.min(nh/1,(10-nh)/1));this.ctx.drawImage(this.moonImg,x2,y2,42,42);this.ctx.globalAlpha=1;}
    },

    updateRain:function(){
        var h=this.getGameHour(),intensity=0;
        for(var i=0;i<this.SCHEDULE.rain.length;i++){var s=this.SCHEDULE.rain[i][0],e=this.SCHEDULE.rain[i][1];if(h>=s&&h<e){var mid=(s+e)/2;intensity=h<mid?(h-s)/(mid-s):1-(h-mid)/(e-mid);break;}}
        var target=Math.floor(intensity*200);
        while(this.raindrops.length<target)this.raindrops.push({x:Math.random()*this.canvas.width,y:Math.random()*-this.canvas.height,speed:4+Math.random()*6,length:8+Math.random()*16,opacity:.2+Math.random()*.4});
        while(this.raindrops.length>target)this.raindrops.pop();
        for(var j=0;j<this.raindrops.length;j++){var d=this.raindrops[j];d.y+=d.speed;d.x-=1;if(d.y>this.canvas.height){d.y=Math.random()*-50;d.x=Math.random()*this.canvas.width;}}
        if(intensity>.1&&!this.rainPlaying&&typeof App!=='undefined'&&App.soundOn){this.rainAudio.play().catch(function(){});this.rainAudio.volume=Math.min(.4,intensity*.5);this.rainPlaying=true;}
        else if(intensity<=.1&&this.rainPlaying){this.rainAudio.pause();this.rainPlaying=false;}
    },
    drawRain:function(){if(!this.raindrops.length)return;this.ctx.strokeStyle='#a0c4e8';this.ctx.lineWidth=1.2;for(var i=0;i<this.raindrops.length;i++){var d=this.raindrops[i];this.ctx.globalAlpha=d.opacity;this.ctx.beginPath();this.ctx.moveTo(d.x,d.y);this.ctx.lineTo(d.x-2,d.y+d.length);this.ctx.stroke();}this.ctx.globalAlpha=1;},

    updateFog:function(){
        var h=this.getGameHour(),intensity=0;
        for(var i=0;i<this.SCHEDULE.fog.length;i++){var s=this.SCHEDULE.fog[i][0],e=this.SCHEDULE.fog[i][1];if(h>=s&&h<e){var mid=(s+e)/2;intensity=h<mid?(h-s)/(mid-s):1-(h-mid)/(e-mid);break;}}
        var target=Math.floor(intensity*30);
        while(this.fogParticles.length<target)this.fogParticles.push({x:Math.random()*this.canvas.width*1.5-this.canvas.width*.25,y:this.canvas.height*.3+Math.random()*this.canvas.height*.6,radius:80+Math.random()*160,speed:.1+Math.random()*.2,opacity:.04+Math.random()*.08});
        while(this.fogParticles.length>target)this.fogParticles.pop();
        for(var j=0;j<this.fogParticles.length;j++){var p=this.fogParticles[j];p.x+=p.speed;if(p.x-p.radius>this.canvas.width){p.x=-p.radius*2;p.y=this.canvas.height*.3+Math.random()*this.canvas.height*.6;}}
    },
    drawFog:function(){for(var i=0;i<this.fogParticles.length;i++){var p=this.fogParticles[i],g=this.ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.radius);g.addColorStop(0,'rgba(200,210,220,'+p.opacity+')');g.addColorStop(1,'rgba(200,210,220,0)');this.ctx.fillStyle=g;this.ctx.fillRect(p.x-p.radius,p.y-p.radius,p.radius*2,p.radius*2);}},

    updateSky:function(){
        var b=this.getSkyBrightness();
        var sky=document.getElementById('layer-sky');
        if(!sky) return;
        // Dynamic sky gradient
        var dayTop='#87CEEB',dayBot='#d4eef8',nightTop='#0a1628',nightBot='#1a2a50';
        var lerp=function(a,c,t){
            var ra=parseInt(a.slice(1,3),16),ga=parseInt(a.slice(3,5),16),ba=parseInt(a.slice(5,7),16);
            var rc=parseInt(c.slice(1,3),16),gc=parseInt(c.slice(3,5),16),bc=parseInt(c.slice(5,7),16);
            var r=Math.round(ra+(rc-ra)*t),g2=Math.round(ga+(gc-ga)*t),b2=Math.round(ba+(bc-ba)*t);
            return 'rgb('+r+','+g2+','+b2+')';
        };
        var top=lerp(nightTop,dayTop,b),bot=lerp(nightBot,dayBot,b);
        sky.style.background='linear-gradient(180deg,'+top+' 0%,'+bot+' 100%)';
        // Overlay
        var ov=document.getElementById('scene-overlay');
        if(ov) ov.style.background='rgba(10,10,40,'+((1-b)*.35)+')';
    },

    updateBuilding:function(){
        var isDay=this.getSkyBrightness()>0.5;
        var level=(typeof App!=='undefined'&&App.pet)?App.pet.housingLevel||0:0;
        var housing=Engine.HOUSING[level]||Engine.HOUSING[0];
        var prefix=housing.bg;
        var src='assets/backgrounds/'+prefix+(isDay?'_jour':'_nuit')+'.png';
        if(this.lastBuildingState!==src){
            this.lastBuildingState=src;
            var el=document.getElementById('layer-building');
            if(el) el.innerHTML='<img src="'+src+'" alt="">';
        }
    },

    updateClock:function(){
        var el=document.getElementById('hud-clock');
        if(el){var icon=this.isDaytime()?'☀️':'🌙';el.textContent=icon+' '+this.getFormattedTime();}
        var we=document.getElementById('hud-weather');
        if(we){var w=this.getWeather();we.textContent=w==='rain'?'🌧️':w==='fog'?'🌫️':'';}
    },

    tick:function(){
        if(!this.canvas||!this.ctx) return;
        var w=this.getWeather();
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.drawCelestial();
        this.updateClouds(w);this.drawClouds();
        if(w==='rain'){this.updateRain();this.drawRain();}else{this.raindrops=[];if(this.rainPlaying){this.rainAudio.pause();this.rainPlaying=false;}}
        if(w==='fog'){this.updateFog();this.drawFog();}else this.fogParticles=[];
        this.updateSky();this.updateBuilding();this.updateClock();
        var self=this;this.animFrame=requestAnimationFrame(function(){self.tick();});
    }
};
