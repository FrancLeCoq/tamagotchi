var Weather = {
    HOUR_MS:120000, // 1 game hour = 2 min real
    startTime:null, startHour:6,
    canvas:null, ctx:null,
    clouds:[], raindrops:[], fogParticles:[],
    animFrame:null, lastBuildingState:null,
    rainAudio:null, rainPlaying:false,
    cloudImg1:null, cloudImg2:null, sunImg:null, moonImg:null,
    imagesReady:false,
    SCHEDULE:{fog:[[8,9],[20,21]],rain:[[3,4],[15,16]]},

    init:function(){
        this.startTime=Date.now();
        this.canvas=document.getElementById('weather-canvas');
        if(!this.canvas) return;
        this.ctx=this.canvas.getContext('2d');
        this.resizeCanvas();
        var self=this;
        window.addEventListener('resize',function(){self.resizeCanvas();});

        // Load images
        var loaded=0,total=4;
        var onLoad=function(){loaded++;if(loaded>=total)self.imagesReady=true;};
        this.cloudImg1=new Image();this.cloudImg1.onload=onLoad;this.cloudImg1.onerror=onLoad;this.cloudImg1.src='assets/weather/nuage1.png';
        this.cloudImg2=new Image();this.cloudImg2.onload=onLoad;this.cloudImg2.onerror=onLoad;this.cloudImg2.src='assets/weather/nuage2.png';
        this.sunImg=new Image();this.sunImg.onload=onLoad;this.sunImg.onerror=onLoad;this.sunImg.src='assets/weather/soleil.png';
        this.moonImg=new Image();this.moonImg.onload=onLoad;this.moonImg.onerror=onLoad;this.moonImg.src='assets/weather/lune.png';

        this.rainAudio=new Audio('assets/sounds/rain.mp3');
        this.rainAudio.loop=true;this.rainAudio.volume=0.25;

        this.initClouds();
        this.tick();
    },

    resizeCanvas:function(){
        var s=document.querySelector('.scene');
        if(!s||!this.canvas) return;
        this.canvas.width=s.offsetWidth;
        this.canvas.height=s.offsetHeight;
    },

    getGameHour:function(){
        return(this.startHour+(Date.now()-this.startTime)/this.HOUR_MS)%24;
    },
    getFormattedTime:function(){
        var h=this.getGameHour(),hh=Math.floor(h),mm=Math.floor((h-hh)*60);
        return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    },
    isDaytime:function(){var h=this.getGameHour();return h>=7&&h<21;},

    getSkyBrightness:function(){
        var h=this.getGameHour();
        if(h>=8&&h<18) return 1;        // full day
        if(h>=22||h<4) return 0;         // full night
        if(h>=4&&h<8) return (h-4)/4;    // dawn
        if(h>=18&&h<22) return 1-(h-18)/4; // dusk
        return 0.5;
    },

    isInRange:function(h,r){for(var i=0;i<r.length;i++)if(h>=r[i][0]&&h<r[i][1])return true;return false;},
    getWeather:function(){var h=this.getGameHour();if(this.isInRange(h,this.SCHEDULE.rain))return'rain';if(this.isInRange(h,this.SCHEDULE.fog))return'fog';return'clear';},

    initClouds:function(){
        this.clouds=[];
        for(var i=0;i<5;i++){
            this.clouds.push({
                x:Math.random()*800-100,
                y:10+Math.random()*40,
                speed:0.15+Math.random()*0.3,
                type:Math.random()>0.5?1:2,
                scale:0.4+Math.random()*0.5,
                opacity:0.5+Math.random()*0.35
            });
        }
    },

    updateClouds:function(w){
        var dense=w==='rain'||w==='fog',target=dense?10:5;
        while(this.clouds.length<target)this.clouds.push({x:-250,y:10+Math.random()*(dense?80:50),speed:(dense?0.08:0.15)+Math.random()*(dense?0.1:0.3),type:Math.random()>0.5?1:2,scale:dense?0.6+Math.random()*0.7:0.4+Math.random()*0.5,opacity:dense?0.6+Math.random()*0.3:0.5+Math.random()*0.35});
        while(this.clouds.length>target)this.clouds.pop();
        var cw=this.canvas?this.canvas.width:400;
        for(var i=0;i<this.clouds.length;i++){
            var c=this.clouds[i];
            c.x+=c.speed;
            if(c.x>cw+150){c.x=-250;c.y=10+Math.random()*(dense?80:50);}
        }
    },

    drawClouds:function(){
        if(!this.imagesReady)return;
        for(var i=0;i<this.clouds.length;i++){
            var c=this.clouds[i];
            var img=c.type===1?this.cloudImg1:this.cloudImg2;
            if(!img||!img.naturalWidth)continue;
            var w=img.naturalWidth*c.scale,h=img.naturalHeight*c.scale;
            this.ctx.globalAlpha=c.opacity;
            this.ctx.drawImage(img,c.x,c.y,w,h);
        }
        this.ctx.globalAlpha=1;
    },

    drawCelestial:function(){
        if(!this.imagesReady)return;
        var h=this.getGameHour(),cw=this.canvas.width,ch=this.canvas.height;

        // Sun: 6h → 20h
        if(h>=6&&h<20&&this.sunImg&&this.sunImg.naturalWidth){
            var p=(h-6)/14;
            var x=p*(cw-60)+10;
            var arcY=Math.sin(p*Math.PI);
            var y=ch*0.35-arcY*ch*0.28;
            var sz=50+arcY*15;
            var alpha=Math.min(1,Math.min((h-6)/1.5,(20-h)/1.5));
            this.ctx.globalAlpha=alpha;
            // Sun glow
            var glow=this.ctx.createRadialGradient(x+sz/2,y+sz/2,sz*0.3,x+sz/2,y+sz/2,sz*1.2);
            glow.addColorStop(0,'rgba(255,220,100,0.3)');
            glow.addColorStop(1,'rgba(255,220,100,0)');
            this.ctx.fillStyle=glow;
            this.ctx.fillRect(x-sz,y-sz,sz*4,sz*4);
            this.ctx.drawImage(this.sunImg,x,y,sz,sz);
            this.ctx.globalAlpha=1;
        }

        // Moon: 20h → 6h
        if((h>=20||h<6)&&this.moonImg&&this.moonImg.naturalWidth){
            var nh=h>=20?h-20:h+4;
            var p2=nh/10;
            var x2=p2*(cw-50)+10;
            var arcY2=Math.sin(p2*Math.PI);
            var y2=ch*0.3-arcY2*ch*0.2;
            var alpha2=Math.min(1,Math.min(nh/1,(10-nh)/1));
            this.ctx.globalAlpha=alpha2;
            // Moon glow
            var mg=this.ctx.createRadialGradient(x2+22,y2+22,15,x2+22,y2+22,50);
            mg.addColorStop(0,'rgba(180,200,255,0.2)');
            mg.addColorStop(1,'rgba(180,200,255,0)');
            this.ctx.fillStyle=mg;
            this.ctx.fillRect(x2-30,y2-30,100,100);
            this.ctx.drawImage(this.moonImg,x2,y2,44,44);
            this.ctx.globalAlpha=1;
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
        while(this.raindrops.length<target)this.raindrops.push({x:Math.random()*cw,y:Math.random()*-ch,speed:5+Math.random()*8,length:10+Math.random()*20,opacity:0.25+Math.random()*0.45});
        while(this.raindrops.length>target)this.raindrops.pop();
        for(var j=0;j<this.raindrops.length;j++){
            var d=this.raindrops[j];
            d.y+=d.speed;d.x-=1.5;
            if(d.y>ch){d.y=Math.random()*-60;d.x=Math.random()*cw;}
        }
        // Audio
        if(intensity>0.1&&!this.rainPlaying&&typeof App!=='undefined'&&App.soundOn){this.rainAudio.play().catch(function(){});this.rainAudio.volume=Math.min(0.45,intensity*0.55);this.rainPlaying=true;}
        else if(intensity<=0.1&&this.rainPlaying){this.rainAudio.pause();this.rainPlaying=false;}
    },

    drawRain:function(){
        if(!this.raindrops.length)return;
        this.ctx.lineWidth=1.5;
        for(var i=0;i<this.raindrops.length;i++){
            var d=this.raindrops[i];
            this.ctx.globalAlpha=d.opacity;
            this.ctx.strokeStyle='rgba(160,196,232,0.8)';
            this.ctx.beginPath();
            this.ctx.moveTo(d.x,d.y);
            this.ctx.lineTo(d.x-2,d.y+d.length);
            this.ctx.stroke();
        }
        this.ctx.globalAlpha=1;
    },

    updateFog:function(){
        var h=this.getGameHour(),intensity=0;
        for(var i=0;i<this.SCHEDULE.fog.length;i++){var s=this.SCHEDULE.fog[i][0],e=this.SCHEDULE.fog[i][1];if(h>=s&&h<e){var mid=(s+e)/2;intensity=h<mid?(h-s)/(mid-s):1-(h-mid)/(e-mid);break;}}
        var cw=this.canvas.width,ch=this.canvas.height;
        var target=Math.floor(intensity*30);
        while(this.fogParticles.length<target)this.fogParticles.push({x:Math.random()*cw*1.5-cw*0.25,y:ch*0.3+Math.random()*ch*0.6,radius:80+Math.random()*160,speed:0.12+Math.random()*0.2,opacity:0.04+Math.random()*0.08});
        while(this.fogParticles.length>target)this.fogParticles.pop();
        for(var j=0;j<this.fogParticles.length;j++){var p=this.fogParticles[j];p.x+=p.speed;if(p.x-p.radius>cw){p.x=-p.radius*2;p.y=ch*0.3+Math.random()*ch*0.6;}}
    },
    drawFog:function(){
        for(var i=0;i<this.fogParticles.length;i++){
            var p=this.fogParticles[i];
            var g=this.ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.radius);
            g.addColorStop(0,'rgba(200,210,220,'+p.opacity+')');
            g.addColorStop(1,'rgba(200,210,220,0)');
            this.ctx.fillStyle=g;
            this.ctx.fillRect(p.x-p.radius,p.y-p.radius,p.radius*2,p.radius*2);
        }
    },

    lerpColor:function(a,b,t){
        var ra=parseInt(a.slice(1,3),16),ga=parseInt(a.slice(3,5),16),ba=parseInt(a.slice(5,7),16);
        var rb=parseInt(b.slice(1,3),16),gb=parseInt(b.slice(3,5),16),bb=parseInt(b.slice(5,7),16);
        return 'rgb('+Math.round(ra+(rb-ra)*t)+','+Math.round(ga+(gb-ga)*t)+','+Math.round(ba+(bb-ba)*t)+')';
    },

    updateSky:function(){
        var b=this.getSkyBrightness();
        var sky=document.getElementById('layer-sky');
        if(!sky) return;

        // Sky colors based on time
        var h=this.getGameHour();
        var topColor, botColor;

        if(h>=8&&h<17){
            // Clear day
            topColor='#4a90d0';botColor='#87CEEB';
        } else if(h>=17&&h<19){
            // Sunset
            var t=(h-17)/2;
            topColor=this.lerpColor('#4a90d0','#1a2040',t);
            botColor=this.lerpColor('#87CEEB','#e8845c',t);
        } else if(h>=19&&h<21){
            // Dusk
            var t2=(h-19)/2;
            topColor=this.lerpColor('#1a2040','#0a1020',t2);
            botColor=this.lerpColor('#e8845c','#1a2040',t2);
        } else if(h>=21||h<4){
            // Night
            topColor='#060810';botColor='#0a1628';
        } else if(h>=4&&h<6){
            // Pre-dawn
            var t3=(h-4)/2;
            topColor=this.lerpColor('#060810','#1a2050',t3);
            botColor=this.lerpColor('#0a1628','#d48060',t3);
        } else if(h>=6&&h<8){
            // Dawn
            var t4=(h-6)/2;
            topColor=this.lerpColor('#1a2050','#4a90d0',t4);
            botColor=this.lerpColor('#d48060','#87CEEB',t4);
        } else {
            topColor=this.lerpColor('#0a1628','#4a90d0',b);
            botColor=this.lerpColor('#1a2040','#87CEEB',b);
        }

        sky.style.background='linear-gradient(180deg,'+topColor+' 0%,'+botColor+' 100%)';

        // Night overlay
        var ov=document.getElementById('scene-overlay');
        if(ov) ov.style.background='rgba(5,5,30,'+((1-b)*0.3)+')';
    },

    updateBuilding:function(){
        var isDay=this.getSkyBrightness()>0.45;
        var level=(typeof App!=='undefined'&&App.pet)?App.pet.housingLevel||0:0;
        var housing=Engine.HOUSING[level]||Engine.HOUSING[0];
        var src='assets/backgrounds/'+housing.bg+(isDay?'_jour':'_nuit')+'.png';
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
        if(!this.canvas||!this.ctx)return;
        var w=this.getWeather();
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

        // Draw celestial (sun/moon) first
        this.drawCelestial();

        // Clouds
        this.updateClouds(w);
        this.drawClouds();

        // Rain
        if(w==='rain'){this.updateRain();this.drawRain();}
        else{this.raindrops=[];if(this.rainPlaying){this.rainAudio.pause();this.rainPlaying=false;}}

        // Fog
        if(w==='fog'){this.updateFog();this.drawFog();}
        else this.fogParticles=[];

        // Sky, building, clock
        this.updateSky();
        this.updateBuilding();
        this.updateClock();

        var self=this;
        this.animFrame=requestAnimationFrame(function(){self.tick();});
    }
};
