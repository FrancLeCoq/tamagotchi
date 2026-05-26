var Weather={
    HOUR_MS:120000,startTime:null,startHour:6,
    canvas:null,ctx:null,clouds:[],raindrops:[],
    animFrame:null,lastBuildingState:null,
    SCHEDULE:{rain:[[3,4],[15,16]]},
    _running:false,

    init:function(){
        this.startTime=Date.now();
        this.updateSky();this.updateBuilding();this.updateClock();
        var self=this;
        // Delay canvas init to ensure game screen has layout
        setTimeout(function(){self._initCanvas();},500);
    },

    _initCanvas:function(){
        this.canvas=document.getElementById('weather-canvas');
        if(!this.canvas)return;
        var scene=document.querySelector('.scene');
        if(scene&&scene.offsetWidth>0){
            this.canvas.width=scene.offsetWidth;
            this.canvas.height=scene.offsetHeight;
        }else{this.canvas.width=400;this.canvas.height=600;}
        this.ctx=this.canvas.getContext('2d');
        if(this.canvas.width<10){var s=this;setTimeout(function(){s._initCanvas();},500);return;}
        for(var i=0;i<6;i++)this.clouds.push({x:Math.random()*this.canvas.width,y:15+Math.random()*50,w:100+Math.random()*80,spd:0.15+Math.random()*0.35,op:0.45+Math.random()*0.3});
        if(!this._running){this._running=true;this._tick();}
    },

    getHour:function(){return(this.startHour+(Date.now()-this.startTime)/this.HOUR_MS)%24;},
    getBrightness:function(){var h=this.getHour();if(h>=8&&h<18)return 1;if(h>=22||h<4)return 0;if(h>=4&&h<8)return(h-4)/4;if(h>=18&&h<22)return 1-(h-18)/4;return .5;},

    updateSky:function(){
        var sky=document.getElementById('layer-sky');if(!sky)return;
        var h=this.getHour();var t,c1,c2;
        if(h>=8&&h<17){c1='74,144,208';c2='135,206,235';}
        else if(h>=17&&h<19){t=(h-17)/2;c1=Math.round(74-48*t)+','+Math.round(144-112*t)+','+Math.round(208-144*t);c2=Math.round(135+97*t)+','+Math.round(206-74*t)+','+Math.round(235-143*t);}
        else if(h>=19&&h<21){t=(h-19)/2;c1=Math.round(26-16*t)+','+Math.round(32-16*t)+','+Math.round(64-32*t);c2=Math.round(232-206*t)+','+Math.round(132-100*t)+','+Math.round(92-28*t);}
        else if(h>=21||h<4){c1='6,8,16';c2='10,22,40';}
        else if(h>=4&&h<6){t=(h-4)/2;c1=Math.round(6+20*t)+','+Math.round(8+24*t)+','+Math.round(16+64*t);c2=Math.round(10+202*t)+','+Math.round(22+106*t)+','+Math.round(40+56*t);}
        else{t=(h-6)/2;c1=Math.round(26+48*t)+','+Math.round(32+112*t)+','+Math.round(80+128*t);c2=Math.round(212-77*t)+','+Math.round(128+78*t)+','+Math.round(96+139*t);}
        sky.style.background='linear-gradient(180deg,rgb('+c1+'),rgb('+c2+'))';
        var ov=document.getElementById('scene-overlay');
        if(ov){var b=this.getBrightness();ov.style.background='rgba(5,5,30,'+((1-b)*.3)+')';}
    },

    updateBuilding:function(){
        var isDay=this.getBrightness()>.45;
        var lvl=(typeof App!=='undefined'&&App.pet)?App.pet.housingLevel||0:0;
        var h=Engine.HOUSING[lvl]||Engine.HOUSING[0];
        var src='assets/backgrounds/'+h.bg+(isDay?'_jour':'_nuit')+'.png';
        if(this.lastBuildingState!==src){this.lastBuildingState=src;
        var el=document.getElementById('layer-building');if(el)el.innerHTML='<img src="'+src+'">';}
    },

    updateClock:function(){
        var h=this.getHour(),hh=Math.floor(h),mm=Math.floor((h-hh)*60);
        var el=document.getElementById('hud-clock');
        if(el)el.textContent=(h>=7&&h<21?'☀️':'🌙')+' '+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    },

    _tick:function(){
        if(!this.ctx){var s=this;this.animFrame=requestAnimationFrame(function(){s._tick();});return;}
        var ctx=this.ctx,cw=this.canvas.width,ch=this.canvas.height,h=this.getHour();
        ctx.clearRect(0,0,cw,ch);

        // Sun
        if(h>=6&&h<20){
            var p=(h-6)/14,ay=Math.sin(p*Math.PI),sx=p*(cw-60)+20,sy=ch*.2-ay*ch*.15+10;
            var al=Math.min(1,Math.min((h-6)/1.5,(20-h)/1.5));
            ctx.globalAlpha=al;
            var g=ctx.createRadialGradient(sx+20,sy+20,8,sx+20,sy+20,50);
            g.addColorStop(0,'rgba(255,220,80,.5)');g.addColorStop(1,'rgba(255,220,80,0)');
            ctx.fillStyle=g;ctx.fillRect(sx-30,sy-30,100,100);
            ctx.fillStyle='#ffe040';ctx.beginPath();ctx.arc(sx+20,sy+20,18,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#fff8a0';ctx.beginPath();ctx.arc(sx+18,sy+18,10,0,Math.PI*2);ctx.fill();
            ctx.globalAlpha=1;
        }
        // Moon
        if(h>=20||h<6){
            var nh=h>=20?h-20:h+4,p2=nh/10,mx=p2*(cw-40)+10,my=ch*.15-Math.sin(p2*Math.PI)*ch*.1+10;
            ctx.globalAlpha=Math.min(1,Math.min(nh,10-nh));
            ctx.fillStyle='#e8e8f0';ctx.beginPath();ctx.arc(mx+16,my+16,14,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='rgba(20,20,60,.5)';ctx.beginPath();ctx.arc(mx+22,my+14,11,0,Math.PI*2);ctx.fill();
            ctx.globalAlpha=1;
        }
        // Clouds
        for(var i=0;i<this.clouds.length;i++){
            var c=this.clouds[i];c.x+=c.spd;if(c.x>cw+100)c.x=-c.w-50;
            ctx.globalAlpha=c.op;ctx.fillStyle='rgba(230,235,245,.85)';
            ctx.beginPath();ctx.arc(c.x+c.w*.3,c.y+20,16,0,Math.PI*2);
            ctx.arc(c.x+c.w*.5,c.y+10,22,0,Math.PI*2);
            ctx.arc(c.x+c.w*.7,c.y+16,14,0,Math.PI*2);ctx.fill();
        }
        ctx.globalAlpha=1;
        // Rain
        var intensity=0;
        for(var j=0;j<this.SCHEDULE.rain.length;j++){var rs=this.SCHEDULE.rain[j][0],re=this.SCHEDULE.rain[j][1];if(h>=rs&&h<re){var mid=(rs+re)/2;intensity=h<mid?(h-rs)/(mid-rs):1-(h-mid)/(re-mid);}}
        var target=Math.floor(intensity*200);
        while(this.raindrops.length<target)this.raindrops.push({x:Math.random()*cw,y:Math.random()*-ch,s:5+Math.random()*8,l:10+Math.random()*18});
        while(this.raindrops.length>target)this.raindrops.pop();
        if(this.raindrops.length){ctx.strokeStyle='rgba(160,196,232,.6)';ctx.lineWidth=1.5;
        for(var k=0;k<this.raindrops.length;k++){var d=this.raindrops[k];d.y+=d.s;d.x-=1.5;if(d.y>ch){d.y=-30;d.x=Math.random()*cw;}ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-2,d.y+d.l);ctx.stroke();}}

        this.updateSky();this.updateBuilding();this.updateClock();
        var self=this;this.animFrame=requestAnimationFrame(function(){self._tick();});
    }
};
