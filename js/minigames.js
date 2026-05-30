const Minigames = {
    active:false, timer:null, score:0, onComplete:null,

    startPlay(onComplete) {
        this.onComplete=onComplete;
        document.getElementById('minigame-title').textContent='Attrape les grains ! 🌾';
        document.getElementById('minigame-screen').classList.remove('hidden');
        this.startTapGame();
    },


    startMorpion(onComplete) {
        this.onComplete=onComplete;
        this.active=false;
        if(this._interval){clearInterval(this._interval);this._interval=null;}
        if(this.timer){clearTimeout(this.timer);this.timer=null;}
        document.getElementById('minigame-title').textContent='Morpion vs Bot ⭕';
        var area=document.getElementById('minigame-area');if(area)area.innerHTML='';
        document.getElementById('minigame-screen').classList.remove('hidden');
        this.morpionBoard=['','','','','','','','',''];
        this.morpionOver=false;this.botThinking=false;
        this.renderMorpion();
    },
    renderMorpion(msg) {
        var area=document.getElementById('minigame-area');if(!area)return;
        var self=this;
        var html='<div class="morpion-msg">'+(msg||'À toi de jouer ! Tu es ❌')+'</div>';
        html+='<div class="morpion-grid">';
        for(var i=0;i<9;i++){
            html+='<div class="morpion-cell" data-i="'+i+'">'+(this.morpionBoard[i]||'')+'</div>';
        }
        html+='</div>';
        area.innerHTML=html;
        area.querySelectorAll('.morpion-cell').forEach(function(el){
            el.addEventListener('click',function(){
                if(self.morpionOver||self.botThinking)return;
                var i=parseInt(el.getAttribute('data-i'));
                if(self.morpionBoard[i])return;
                self.morpionBoard[i]='❌';
                if(self.checkMorpion('❌')){self.endMorpion(true);return;}
                if(self.morpionBoard.every(function(x){return x;})){self.endMorpion(false,'Match nul !');return;}
                // Bot thinks for 5 seconds with countdown
                self.botThinking=true;
                var sec=2;
                self.renderMorpion('🤖 Le bot réfléchit... '+sec+'s');
                self.botTimer=setInterval(function(){
                    sec--;
                    if(sec<=0){
                        clearInterval(self.botTimer);
                        self.botThinking=false;
                        self.botMove();
                    }else{
                        self.renderMorpion('🤖 Le bot réfléchit... '+sec+'s');
                    }
                },1000);
            });
        });
    },
    botMove() {
        var b=this.morpionBoard,self=this;
        // Bot is ⭕: win if possible, block if needed, else center/corner/random
        function tryLine(mark){
            var wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
            for(var w=0;w<wins.length;w++){
                var L=wins[w],vals=L.map(function(i){return b[i];});
                var cnt=vals.filter(function(v){return v===mark;}).length;
                var empty=L.filter(function(i){return !b[i];});
                if(cnt===2&&empty.length===1)return empty[0];
            }
            return -1;
        }
        var move=tryLine('⭕');
        if(move<0)move=tryLine('❌');
        if(move<0&&!b[4])move=4;
        if(move<0){var corners=[0,2,6,8].filter(function(i){return !b[i];});if(corners.length)move=corners[Math.floor(Math.random()*corners.length)];}
        if(move<0){var empty=[];for(var i=0;i<9;i++)if(!b[i])empty.push(i);move=empty[Math.floor(Math.random()*empty.length)];}
        b[move]='⭕';
        if(this.checkMorpion('⭕')){this.endMorpion(false,'Le bot a gagné ! 🤖');return;}
        if(b.every(function(x){return x;})){this.endMorpion(false,'Match nul !');return;}
        this.renderMorpion();
    },
    checkMorpion(mark) {
        var b=this.morpionBoard;
        var wins=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return wins.some(function(L){return L.every(function(i){return b[i]===mark;});});
    },
    endMorpion(win,msg) {
        this.morpionOver=true;this.botThinking=false;if(this.botTimer)clearInterval(this.botTimer);
        var self=this;
        this.renderMorpion(win?'🎉 Tu as gagné !':(msg||'Perdu...'));
        setTimeout(function(){
            document.getElementById('minigame-screen').classList.add('hidden');
            if(self.onComplete)self.onComplete(win);
        },1500);
    },

    startSudoku(onComplete) {
        this.onComplete=onComplete;
        document.getElementById('minigame-title').textContent='Mini Sudoku 🧠';
        document.getElementById('minigame-screen').classList.remove('hidden');
        this.startSudokuGame();
    },

    close() {
        this.active=false; clearTimeout(this.timer); clearInterval(this._interval);
        document.getElementById('minigame-screen').classList.add('hidden');
    },

    // ─── Tap Game ──────────────────────────────────────
    startTapGame() {
        this.active=true; this.score=0; let timeLeft=10000;
        const area=document.getElementById('minigame-area');
        area.innerHTML=`<div class="mini-score" id="mg-score">0</div><div class="mini-timer-bar" id="mg-timer" style="width:100%"></div><div class="mini-field" id="mg-field"></div>`;
        const field=document.getElementById('mg-field'), scoreEl=document.getElementById('mg-score'), timerEl=document.getElementById('mg-timer');

        const spawn=()=>{
            if(!this.active) return;
            field.querySelectorAll('.mini-target').forEach(t=>t.remove());
            const t=document.createElement('div'); t.className='mini-target';
            const emojis=['🌾','🌽','🥖','🧀','🐛'], emoji=emojis[Math.floor(Math.random()*emojis.length)];
            const pts=emoji==='🐛'?-2:(emoji==='🌾'?1:2);
            t.textContent=emoji; t.style.left=(10+Math.random()*70)+'%'; t.style.top=(10+Math.random()*70)+'%';
            t.addEventListener('click',(e)=>{
                e.stopPropagation(); this.score=Math.max(0,this.score+pts); scoreEl.textContent=this.score;
                t.remove(); Renderer.haptic(pts>0?'light':'medium');
                const fl=document.createElement('div'); fl.className='float-item';
                fl.textContent=pts>0?'+'+pts:''+pts; fl.style.color=pts>0?'#2ecc71':'#e74c3c';
                fl.style.left=t.style.left; fl.style.top=t.style.top; fl.style.fontSize='18px'; fl.style.fontWeight='700';
                field.appendChild(fl); setTimeout(()=>fl.remove(),1000);
                if(this.active) setTimeout(spawn,200);
            });
            field.appendChild(t);
            this.timer=setTimeout(()=>{if(this.active){t.remove();spawn();}},1500);
        };
        const st=Date.now();
        this._interval=setInterval(()=>{
            const e=Date.now()-st, pct=Math.max(0,(1-e/timeLeft)*100);
            timerEl.style.width=pct+'%'; timerEl.style.background=pct>30?'#2ecc71':pct>10?'#f39c12':'#e74c3c';
            if(e>=timeLeft){this.active=false;clearInterval(this._interval);this.endTapGame();}
        },50);
        spawn();
    },
    endTapGame() {
        const area=document.getElementById('minigame-area');
        // Économie : chaque grain attrapé = 2 pièces + 1% faim, + bonus bonheur
        const coins=this.score*2, faim=Math.min(40,this.score), bonus=Math.min(20,this.score);
        this._reward={coins:coins,faim:faim,bonheur:bonus,jeu:20};
        area.innerHTML=`<div class="mini-result"><div style="font-size:48px;margin-bottom:12px">🌾</div><div style="font-size:24px;font-weight:800;color:#f0c040;margin-bottom:4px">Score : ${this.score}</div><div style="font-size:14px;color:#5fe08a;margin:8px 0;line-height:1.6">🪙 +${coins} pièces<br>🍽️ +${faim}% faim<br>😊 +${bonus}% bonheur</div><button class="mini-btn" id="mg-done">Récolter ! 🐓</button></div>`;
        document.getElementById('mg-done').addEventListener('click',()=>{this.close();if(this.onComplete)this.onComplete(this._reward);});
    },

    // ─── Mini Sudoku 4×4 ───────────────────────────────
    startSudokuGame() {
        this.active=true;
        const area=document.getElementById('minigame-area');
        
        // Generate a valid 4×4 sudoku
        const solution=this.generateSudoku4();
        const puzzle=solution.map(r=>[...r]);
        // Remove some cells
        let removals=0;
        while(removals<8){
            const r=Math.floor(Math.random()*4), c=Math.floor(Math.random()*4);
            if(puzzle[r][c]!==0){puzzle[r][c]=0;removals++;}
        }

        let selected=null, mistakes=0;
        const startTime=Date.now();

        const render=()=>{
            let html=`<div style="text-align:center;margin-bottom:8px"><span style="color:#f0c040;font-weight:700">Erreurs: ${mistakes}/3</span></div>`;
            html+=`<div class="sudoku-grid">`;
            for(let r=0;r<4;r++) for(let c=0;c<4;c++){
                const v=puzzle[r][c], isFixed=v!==0;
                const sel=selected&&selected[0]===r&&selected[1]===c;
                let cls='sudoku-cell';if(isFixed)cls+=' fixed';if(!isFixed)cls+=' empty';if(sel)cls+=' selected';
                html+=`<div class="${cls}" data-r="${r}" data-c="${c}">${v||''}</div>`;
            }
            html+=`</div>`;
            html+=`<div class="sudoku-numpad">`;
            for(let n=1;n<=4;n++) html+=`<div class="sudoku-num" data-num="${n}">${n}</div>`;
            html+=`</div>`;
            area.innerHTML=html;

            // Bind cells
            area.querySelectorAll('.sudoku-cell:not(.fixed)').forEach(el=>{
                el.addEventListener('click',()=>{
                    selected=[parseInt(el.dataset.r),parseInt(el.dataset.c)];
                    render();
                });
            });
            // Bind numpad
            area.querySelectorAll('.sudoku-num').forEach(el=>{
                el.addEventListener('click',()=>{
                    if(!selected) return;
                    const [r,c]=selected, num=parseInt(el.dataset.num);
                    if(num===solution[r][c]){
                        puzzle[r][c]=num;
                        selected=null;
                        // Check win
                        const complete=puzzle.every(row=>row.every(v=>v!==0));
                        if(complete) this.endSudokuGame(mistakes,startTime);
                        else render();
                    } else {
                        mistakes++;
                        if(mistakes>=3) this.endSudokuGame(mistakes,startTime);
                        else {
                            // Flash wrong
                            const cell=area.querySelector(`[data-r="${r}"][data-c="${c}"]`);
                            if(cell){cell.classList.add('wrong');setTimeout(()=>render(),500);}
                        }
                    }
                });
            });
        };
        render();
    },

    endSudokuGame(mistakes,startTime) {
        const area=document.getElementById('minigame-area');
        const won=mistakes<3;
        const elapsed=Math.floor((Date.now()-startTime)/1000);
        const bonus=won?Math.max(5,20-elapsed-mistakes*3):2;
        area.innerHTML=`<div class="mini-result">
            <div style="font-size:48px;margin-bottom:12px">${won?'🧠':'😵'}</div>
            <div style="font-size:24px;font-weight:800;color:${won?'#f0c040':'#e74c3c'};margin-bottom:8px">${won?'Résolu !':'Trop d\'erreurs !'}</div>
            <div style="font-size:14px;color:#8888aa;margin-bottom:16px">Temps: ${elapsed}s · Bonus intellect: +${bonus}</div>
            <button class="mini-btn" id="mg-done">${won?'Brillant ! 🐓':'Réessayer...'}</button>
        </div>`;
        document.getElementById('mg-done').addEventListener('click',()=>{this.close();if(this.onComplete)this.onComplete(bonus);});
    },

    generateSudoku4() {
        // Generate valid 4x4 sudoku using backtracking
        const grid=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        const isValid=(g,r,c,n)=>{
            for(let i=0;i<4;i++){if(g[r][i]===n||g[i][c]===n) return false;}
            const br=r<2?0:2, bc=c<2?0:2;
            for(let i=br;i<br+2;i++) for(let j=bc;j<bc+2;j++) if(g[i][j]===n) return false;
            return true;
        };
        const solve=(g)=>{
            for(let r=0;r<4;r++) for(let c=0;c<4;c++){
                if(g[r][c]===0){
                    const nums=[1,2,3,4].sort(()=>Math.random()-.5);
                    for(const n of nums){if(isValid(g,r,c,n)){g[r][c]=n;if(solve(g)) return true;g[r][c]=0;}}
                    return false;
                }
            }
            return true;
        };
        solve(grid);
        return grid;
    },
};
