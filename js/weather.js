var Weather={
    HOUR_MS:120000,startTime:null,startHour:6,
    canvas:null,ctx:null,
    clouds:[],raindrops:[],
    animFrame:null,lastBuildingState:null,
    SCHEDULE:{rain:[[3,4],[15,16]]},

    init:function(){
        this.startTime=Date.now();
        // Set sky color IMMEDIATELY (no canvas needed)
        this.updateSky();
        this.updateBuilding();
        this.updateClock();
        // Init canvas after a delay to ensure it has dimensions
        var self=this;
        setTimeout(function(){self.initCanvas();},300);
    },

    initCanvas:function(){
        this.canvas=document.getElementById('weather-canvas');
        if(!this.canvas)return;
        this.ctx=this.canvas.getContext('2d');
        var scene=document.querySelector('.scene');
        if(scene){
            var rect=scene.getBoundingClientRect();
            this.canvas.width=Math.max(400,Math.floor(rect.width));
            this.canvas.height=Math.max(600,Math.floor(rect.height));
        }
        // If still no size, retry
        if(this.canvas.width<10){
            var self=this;
            setTimeout(function(){self.initCanvas();},500);
            return;
        }
        console.log('Weather canvas: '+this.canvas.width+'x'+this.canvas.height);
        this.initClouds();
        this.tick();
    },

    getGameHour:function(){return(this.startHour+(Date.now()-this.startTime)/this.HOUR_MS)%24;},
    getFormattedTime:function(){var h=this.getGameHour(),hh=Math.floor(h),mm=Math.floor((h-hh)*60);return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');},
    isDaytime:function(){var h=this.getGameHour();return h>=7&&h<21;},
    getBrightness:function(){
        var h=this.getGameHour();
        if(h>=8&&h<18)return 1;
        if(h>=22||h<4)return 0;
        if(h>=4&&h<8)return(h-4)/4;
        if(h>=18&&h<22)return 1-(h-18)/4;
        return 0.5;
    },

    lerp:function(a,b,t){return a+(b-a)*t;},
    lerpRGB:function(c1,c2,t){
        return'rgb('+Math.round(this.lerp(c1[0],c2[0],t))+','+Math.round(this.lerp(c1[1],c2[1],t))+','+Math.round(this.lerp(c1[2],c2[2],t))+')';
    },

    updateSky:function(){
        var sky=document.getElementById('layer-sky');if(!sky)return;
        var h=this.getGameHour();
        var top,bot;
        if(h>=8&&h<17){top=[74,144,208];bot=[135,206,235];}
        else if(h>=17&&h<19){var t=(h-17)/2;top=[Math.round(74+(26-74)*t),Math.round(144+(32-144)*t),Math.round(208+(64-208)*t)];bot=[Math.round(135+(232-135)*t),Math.round(206+(132-206)*t),Math.round(235+(92-235)*t)];}
        else if(h>=19&&h<21){var t2=(h-19)/2;top=[Math.round(26+(10-26)*t2),Math.round(32+(16-32)*t2),Math.round(64+(32-64)*t2)];bot=[Math.round(232+(26-232)*t2),Math.round(132+(32-132)*t2),Math.round(92+(64-92)*t2)];}
        else if(h>=21||h<4){top=[6,8,16];bot=[10,22,40];}
        else if(h>=4&&h<6){var t3=(h-4)/2;top=[Math.round(6+(26-6)*t3),Math.round(8+(32-8)*t3),Math.round(16+(80-16)*t3)];bot=[Math.round(10+(212-10)*t3),Math.round(22+(128-22)*t3),Math.round(40+(96-40)*t3)];}
        else{var t4=(h-6)/2;top=[Math.round(26+(74-26)*t4),Math.round(32+(144-32)*t4),Math.round(80+(208-80)*t4)];bot=[Math.round(212+(135-212)*t4),Math.round(128+(206-128)*t4),Math.round(96+(235-96)*t4)];}

        sky.style.background='linear-gradient(180deg, rgb('+top[0]+','+top[1]+','+top[2]+') 0%, rgb('+bot[0]+','+bot[1]+','+bot[2]+') 100%)';

        var ov=document.getElementById('scene-overlay');
        var b=this.getBrightness();
        if(ov)ov.style.background='rgba(5,5,30,'+((1-b)*0.3)+')';
    },

    updateBuilding:function(){
        var isDay=this.getBrightness()>0.45;
        var level=(typeof App!=='undefined'&&App.pet)?App.pet.housingLevel||0:0;
        var housing=Engine.HOUSING[level]||Engine.HOUSING[0];
        var src='assets/backgrounds/'+housing.bg+(isDay?'_jour':'_nuit')+'.png';
        if(this.lastBuildingState!==src){this.lastBuildingState=src;var el=document.getElementById('layer-building');if(el)el.innerHTML='<img src="'+src+'">';}
    },

    updateClock:function(){
        var el=document.getElementById('hud-clock');
        if(el)el.textContent=(this.isDaytime()?'☀️':'🌙')+' '+this.getFormattedTime();
        var we=document.getElementById('hud-weather');
        if(we){var h=this.getGameHour();var isRain=false;for(var i=0;i<this.SCHEDULE.rain.length;i++){if(h>=this.SCHEDULE.rain[i][0]&&h<this.SCHEDULE.rain[i][1])isRain=true;}we.textContent=isRain?'🌧️':'';}
    },

    initClouds:function(){
        this.clouds=[];var cw=this.canvas?this.canvas.width:400;
        for(var i=0;i<6;i++){this.clouds.push({x:Math.random()*cw,y:15+Math.random()*50,w:100+Math.random()*80,speed:0.15+Math.random()*0.35,opacity:0.45+Math.random()*0.35});}
    },

    drawSunMoon:function(){
        if(!this.ctx)return;
        var h=this.getGameHour(),ctx=this.ctx,cw=this.canvas.width,ch=this.canvas.height;
        // Sun
        if(h>=6&&h<20){
            var p=(h-6)/14,arcY=Math.sin(p*Math.PI);
            var sx=p*(cw-60)+20,sy=ch*0.2-arcY*ch*0.15+10;
            var alpha=Math.min(1,Math.min((h-6)/1.5,(20-h)/1.5));
            ctx.globalAlpha=alpha;
            var g=ctx.createRadialGradient(sx+20,sy+20,8,sx+20,sy+20,50);
            g.addColorStop(0,'rgba(255,220,80,0.5)');g.addColorStop(1,'rgba(255,220,80,0)');
            ctx.fillStyle=g;ctx.fillRect(sx-30,sy-30,100,100);
            ctx.fillStyle='#ffe040';ctx.beginPath();ctx.arc(sx+20,sy+20,18,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#fff8a0';ctx.beginPath();ctx.arc(sx+18,sy+18,10,0,Math.PI*2);ctx.fill();
        }
        // Moon
        if(h>=20||h<6){
            var nh=h>=20?h-20:h+4,p2=nh/10;
            var mx=p2*(cw-40)+10,my=ch*0.15-Math.sin(p2*Math.PI)*ch*0.1+10;
            var a2=Math.min(1,Math.min(nh/1,(10-nh)/1));
            ctx.globalAlpha=a2;
            var mg=ctx.createRadialGradient(mx+16,my+16,6,mx+16,my+16,40);
            mg.addColorStop(0,'rgba(200,210,255,0.25)');mg.addColorStop(1,'rgba(200,210,255,0)');
            ctx.fillStyle=mg;ctx.fillRect(mx-20,my-20,80,80);
            ctx.fillStyle='#e8e8f0';ctx.beginPath();ctx.arc(mx+16,my+16,14,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='rgba(20,20,60,0.5)';ctx.beginPath();ctx.arc(mx+22,my+14,11,0,Math.PI*2);ctx.fill();
        }
        ctx.globalAlpha=1;
    },

    drawClouds:function(){
        if(!this.ctx)return;
        var ctx=this.ctx,cw=this.canvas.width;
        for(var i=0;i<this.clouds.length;i++){
            var c=this.clouds[i];c.x+=c.speed;if(c.x>cw+100)c.x=-c.w-50;
            ctx.globalAlpha=c.opacity;ctx.fillStyle='rgba(230,235,245,0.85)';
            var hw=c.w/2,hh=20;
            ctx.beginPath();
            ctx.arc(c.x+hw*0.3,c.y+hh,hh*0.8,0,Math.PI*2);
            ctx.arc(c.x+hw*0.6,c.y+hh*0.5,hh*1.1,0,Math.PI*2);
            ctx.arc(c.x+hw,c.y+hh*0.8,hh*0.7,0,Math.PI*2);
            ctx.fill();
        }
        ctx.globalAlpha=1;
    },

    drawRain:function(){
        if(!this.ctx)return;
        var h=this.getGameHour(),ctx=this.ctx,cw=this.canvas.width,ch=this.canvas.height;
        var intensity=0;
        for(var i=0;i<this.SCHEDULE.rain.length;i++){var s=this.SCHEDULE.rain[i][0],e=this.SCHEDULE.rain[i][1];if(h>=s&&h<e){var mid=(s+e)/2;intensity=h<mid?(h-s)/(mid-s):1-(h-mid)/(e-mid);}}
        var target=Math.floor(intensity*200);
        while(this.raindrops.length<target)this.raindrops.push({x:Math.random()*cw,y:Math.random()*-ch,spd:5+Math.random()*8,len:10+Math.random()*18});
        while(this.raindrops.length>target)this.raindrops.pop();
        ctx.strokeStyle='rgba(160,196,232,0.6)';ctx.lineWidth=1.5;
        for(var j=0;j<this.raindrops.length;j++){
            var d=this.raindrops[j];d.y+=d.spd;d.x-=1.5;if(d.y>ch){d.y=-30;d.x=Math.random()*cw;}
            ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-2,d.y+d.len);ctx.stroke();
        }
    },

    tick:function(){
        if(!this.ctx)return;
        if(this.canvas.width===0||this.canvas.height===0){this.initCanvas();return;}
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.drawSunMoon();
        this.drawClouds();
        this.drawRain();
        this.updateSky();
        this.updateBuilding();
        this.updateClock();
        var self=this;this.animFrame=requestAnimationFrame(function(){self.tick();});
    }
};
