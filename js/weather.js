var Weather={
    HOUR_MS:120000,startTime:null,startHour:6,
    canvas:null,ctx:null,clouds:[],raindrops:[],
    lastBuildingState:null,_running:false,_skySet:false,
    SCHEDULE:{rain:[[3,4],[15,16]]},

    init:function(){
        this.startTime=Date.now();
        // Use real hour from pet if available
        if(typeof App!=='undefined'&&App.pet&&App.pet.startRealHour!==undefined){
            this.startHour=App.pet.startRealHour;
        }else{
            this.startHour=new Date().getHours();
        }
        // Apply sky gradient IMMEDIATELY via inline style
        this._applySky();
        this.updateBuilding();
        this.updateClock();
        // Canvas init with retries
        var self=this;
        var tryCanvas=function(attempt){
            var c=document.getElementById('weather-canvas');
            if(!c){if(attempt<10)setTimeout(function(){tryCanvas(attempt+1);},300);return;}
            self.canvas=c;
            var scene=document.querySelector('.scene');
            var w=scene?scene.clientWidth:window.innerWidth;
            var h=scene?scene.clientHeight:400;
            if(w<10||h<10){if(attempt<10)setTimeout(function(){tryCanvas(attempt+1);},300);return;}
            c.width=w;c.height=h;
            self.ctx=c.getContext('2d');
            // Init clouds
            for(var i=0;i<6;i++)self.clouds.push({x:Math.random()*w,y:12+Math.random()*50,w:90+Math.random()*80,s:0.12+Math.random()*0.35,o:0.4+Math.random()*0.35});
            if(!self._running){self._running=true;self._loop();}
        };
        tryCanvas(0);
        // Also run sky update every 2s in case canvas fails
        setInterval(function(){self._applySky();self.updateBuilding();self.updateClock();},2000);
    },

    getHour:function(){return(this.startHour+(Date.now()-this.startTime)/this.HOUR_MS)%24;},
    getSkyBrightness:function(){return this.getBri();},
    getBri:function(){var h=this.getHour();if(h>=8&&h<18)return 1;if(h>=22||h<4)return 0;if(h>=4&&h<8)return(h-4)/4;if(h>=18&&h<22)return 1-(h-18)/4;return .5;},

    _applySky:function(){
        var sky=document.getElementById('layer-sky');if(!sky)return;
        var h=this.getHour(),t,r1,g1,b1,r2,g2,b2;
        if(h>=8&&h<17){r1=74;g1=144;b1=208;r2=135;g2=206;b2=235;}
        else if(h>=17&&h<19){t=(h-17)/2;r1=74-48*t|0;g1=144-112*t|0;b1=208-144*t|0;r2=135+97*t|0;g2=206-74*t|0;b2=235-143*t|0;}
        else if(h>=19&&h<21){t=(h-19)/2;r1=26-16*t|0;g1=32-16*t|0;b1=64-32*t|0;r2=232-206*t|0;g2=132-100*t|0;b2=92-28*t|0;}
        else if(h>=21||h<4){r1=6;g1=8;b1=16;r2=10;g2=22;b2=40;}
        else if(h>=4&&h<6){t=(h-4)/2;r1=6+20*t|0;g1=8+24*t|0;b1=16+64*t|0;r2=10+202*t|0;g2=22+106*t|0;b2=40+56*t|0;}
        else{t=(h-6)/2;r1=26+48*t|0;g1=32+112*t|0;b1=80+128*t|0;r2=212-77*t|0;g2=128+78*t|0;b2=96+139*t|0;}
        sky.style.background='linear-gradient(180deg,rgb('+r1+','+g1+','+b1+'),rgb('+r2+','+g2+','+b2+'))';
        var ov=document.getElementById('scene-overlay');
        if(ov)ov.style.background='rgba(5,5,30,'+((1-this.getBri())*.3)+')';
    },

    updateBuilding:function(){
        var d=this.getBri()>.45;
        var l=(typeof App!=='undefined'&&App.pet)?App.pet.housingLevel||0:0;
        var ho=Engine.HOUSING[l]||Engine.HOUSING[0];
        var src='assets/backgrounds/'+ho.bg+(d?'_jour':'_nuit')+'.png';
        if(this.lastBuildingState!==src){this.lastBuildingState=src;var el=document.getElementById('layer-building');if(el)el.innerHTML='<img src="'+src+'">';}
    },
    updateClock:function(){
        var h=this.getHour(),hh=Math.floor(h),mm=Math.floor((h-hh)*60);
        var el=document.getElementById('hud-clock');
        if(el)el.textContent=(h>=7&&h<21?'☀️':'🌙')+' '+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');
    },

    _loop:function(){
        if(!this.ctx)return;
        var ctx=this.ctx,cw=this.canvas.width,ch=this.canvas.height,h=this.getHour();
        ctx.clearRect(0,0,cw,ch);
        // Sun
        if(h>=6&&h<20){var p=(h-6)/14,ay=Math.sin(p*Math.PI),sx=p*(cw-60)+20,sy=ch*.18-ay*ch*.14+10,al=Math.min(1,Math.min((h-6)/1.5,(20-h)/1.5));ctx.globalAlpha=al;var g=ctx.createRadialGradient(sx+20,sy+20,8,sx+20,sy+20,55);g.addColorStop(0,'rgba(255,220,80,.5)');g.addColorStop(1,'rgba(255,220,80,0)');ctx.fillStyle=g;ctx.fillRect(sx-35,sy-35,110,110);ctx.fillStyle='#ffe040';ctx.beginPath();ctx.arc(sx+20,sy+20,20,0,6.28);ctx.fill();ctx.fillStyle='#fff8a0';ctx.beginPath();ctx.arc(sx+18,sy+18,11,0,6.28);ctx.fill();ctx.globalAlpha=1;}
        // Moon
        if(h>=20||h<6){var nh=h>=20?h-20:h+4,p2=nh/10,mx=p2*(cw-40)+10,my=ch*.12-Math.sin(p2*3.14)*ch*.1+10;ctx.globalAlpha=Math.min(1,Math.min(nh,10-nh));ctx.fillStyle='#e8e8f0';ctx.beginPath();ctx.arc(mx+16,my+16,16,0,6.28);ctx.fill();ctx.fillStyle='rgba(20,20,60,.5)';ctx.beginPath();ctx.arc(mx+24,my+14,12,0,6.28);ctx.fill();ctx.globalAlpha=1;}
        // Clouds
        for(var i=0;i<this.clouds.length;i++){var c=this.clouds[i];c.x+=c.s;if(c.x>cw+100)c.x=-c.w-50;ctx.globalAlpha=c.o;ctx.fillStyle='rgba(235,240,250,.85)';ctx.beginPath();ctx.arc(c.x+c.w*.3,c.y+18,17,0,6.28);ctx.arc(c.x+c.w*.5,c.y+8,23,0,6.28);ctx.arc(c.x+c.w*.7,c.y+15,15,0,6.28);ctx.fill();}
        ctx.globalAlpha=1;
        // Rain
        var inten=0;for(var j=0;j<this.SCHEDULE.rain.length;j++){var rs=this.SCHEDULE.rain[j][0],re=this.SCHEDULE.rain[j][1];if(h>=rs&&h<re){var mid=(rs+re)/2;inten=h<mid?(h-rs)/(mid-rs):1-(h-mid)/(re-mid);}}
        var tgt=Math.floor(inten*200);while(this.raindrops.length<tgt)this.raindrops.push({x:Math.random()*cw,y:Math.random()*-ch,s:5+Math.random()*8,l:10+Math.random()*18});while(this.raindrops.length>tgt)this.raindrops.pop();
        if(this.raindrops.length){ctx.strokeStyle='rgba(160,196,232,.6)';ctx.lineWidth=1.5;for(var k=0;k<this.raindrops.length;k++){var d=this.raindrops[k];d.y+=d.s;d.x-=1.5;if(d.y>ch){d.y=-30;d.x=Math.random()*cw;}ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-2,d.y+d.l);ctx.stroke();}}

        this._applySky();this.updateBuilding();this.updateClock();
        var self=this;requestAnimationFrame(function(){self._loop();});
    }
};
