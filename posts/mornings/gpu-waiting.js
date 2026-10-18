/* Illustrative one-scheduler model; not a GPU timing predictor. */
(function (root) {
  'use strict';
  const A = [[1,2,3,4],[2,1,0,1],[0,1,2,1],[3,0,1,2]];
  const B4 = [[1,2,3,4],[0,1,0,1],[2,0,1,0],[1,1,1,1]];
  const B = B4.map(row => Array.from({length:32}, (_,j) => row[j%4]));
  function simulate(capacity=4, latency=4) {
    if (![1,2,4].includes(capacity) || !Number.isInteger(latency) || latency<1 || latency>40) throw Error('Invalid model parameters');
    const warps = A.map((_,id)=>({id,admitted:false,done:false,k:0,stage:0,aReady:0,bReady:0,acc:Array(32).fill(0),completed:null}));
    const frames=[]; let last=-1, issued=0;
    const admit=()=>{let free=capacity-warps.filter(w=>w.admitted&&!w.done).length; for(const w of warps)if(free>0&&!w.admitted){w.admitted=true;free--;}};
    const eligible=(w,t)=>w.admitted&&!w.done&&(w.stage!==2||t>=Math.max(w.aReady,w.bReady));
    const snapshot=t=>warps.map(w=>({id:w.id,k:w.k,stage:w.stage,acc:w.acc.slice(),completed:w.completed,status:w.done?'done':!w.admitted?'queued':eligible(w,t)?'ready':'waiting',readyAt:w.stage===2?Math.max(w.aReady,w.bReady):t}));
    admit();frames.push({cycle:-1,event:null,warps:snapshot(0)});
    for(let t=0;t<2000;t++) {
      admit();let chosen=null;
      for(let offset=1;offset<=4;offset++){const w=warps[(last+offset)%4];if(eligible(w,t)){chosen=w;break;}}
      let event=null;
      if(chosen){
        const w=chosen,k=w.k;last=w.id;issued++;
        if(w.stage===0){w.aReady=t+latency;w.stage=1;event={warp:w.id,op:'A',k,readyAt:w.aReady};}
        else if(w.stage===1){w.bReady=t+latency;w.stage=2;event={warp:w.id,op:'B',k,readyAt:w.bReady};}
        else{for(let j=0;j<32;j++)w.acc[j]+=A[w.id][k]*B[k][j];w.k++;w.stage=0;event={warp:w.id,op:'M',k};if(w.k===4){w.done=true;w.completed=t+1;}}
      }
      frames.push({cycle:t,event,warps:snapshot(t+1)});
      if(warps.every(w=>w.done))return {capacity,latency,frames,cycles:t+1,issued,idle:t+1-issued,result:warps.map(w=>w.acc.slice()),completion:warps.map(w=>w.completed)};
    }
    throw Error('Simulation did not complete');
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={simulate,A,B};
  if(typeof document==='undefined')return;
  const $=id=>document.getElementById(id);
  let run=simulate(1,4),position=0;
  const stageNames=['load A','load B','multiply-add'];
  const words={ready:'ready',waiting:'waiting for operands',queued:'not resident',done:'finished'};
  function timeline(){
    const cell=21,left=42,width=left+run.cycles*cell+10,top=30;
    let markup=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 170" width="${width}" height="170" role="img" aria-label="Schedule: one row per warp, columns are cycles. A and B are loads; M is a multiply-add. Blank columns have no issue.">`;
    for(let i=0;i<4;i++)markup+=`<text x="3" y="${top+i*28+16}">W${i}</text>`;
    for(let t=0;t<run.cycles;t++){
      const x=left+t*cell,e=run.frames[t+1].event;
      if(t%4===0)markup+=`<text x="${x+8}" y="16" text-anchor="middle">${t}</text>`;
      for(let w=0;w<4;w++)markup+=`<rect class="grid-cell" x="${x}" y="${top+w*28}" width="19" height="24" rx="3"/>`;
      if(e)markup+=`<rect class="event event-${e.op}" x="${x}" y="${top+e.warp*28}" width="19" height="24" rx="3"/><text class="event-label" x="${x+9.5}" y="${top+e.warp*28+16}" text-anchor="middle">${e.op}</text>`;
      else markup+=`<path class="idle-mark" d="M${x+4} 149h11"/>`;
    }
    if(position>0)markup+=`<rect class="cursor" x="${left+(position-1)*cell-1}" y="23" width="21" height="137" rx="3"/>`;
    markup+='</svg>'; $('timeline').innerHTML=markup;
  }
  function render(){
    const frame=run.frames[position];$('scrub').max=run.frames.length-1;$('scrub').value=position;
    $('position').textContent=position===0?'Before cycle 0':`After cycle ${frame.cycle}`;
    $('back').disabled=position===0;$('next').disabled=$('multiply').disabled=$('finish').disabled=position===run.frames.length-1;
    let description='The first resident blocks have their registers allocated. No instruction has issued yet. Choose Next cycle to dispatch one warp instruction.';
    if(position){const e=frame.event;description=!e?`Cycle ${frame.cycle}: no resident warp has a ready next instruction. The issue slot is empty; outstanding loads keep progressing.`:e.op==='M'?`Cycle ${frame.cycle}: W${e.warp} multiplies term k=${e.k} and adds it to all 32 private accumulators. Four lanes are shown below.`:`Cycle ${frame.cycle}: W${e.warp} issues load ${e.op} for k=${e.k}. Its result becomes available at the start of cycle ${e.readyAt}. The load has not become faster because another warp can issue next.`;}
    $('explanation').textContent=description;
    for(const w of frame.warps){
      $('warp-'+w.id).dataset.status=w.status;
      $('status-'+w.id).textContent=words[w.status]+(w.status==='waiting'?` · ready at ${w.readyAt}`:w.status==='ready'?` · next: ${stageNames[w.stage]}`:'');
      $('acc-'+w.id).textContent=w.acc.slice(0,4).join('  ·  ');
      $('terms-'+w.id).textContent=`${w.k}/4 terms accumulated`;
    }
    $('cycles').textContent=run.cycles;$('idle').textContent=run.idle;$('busy').textContent=`${Math.round(100*run.issued/run.cycles)}%`;
    $('summary').textContent=`Same workload: 128 outputs, 48 warp instructions. W0 completes after ${run.completion[0]} cycles; the whole job finishes after ${run.cycles}. These are simulated cycles, not device measurements.`;
    $('comparison').innerHTML=[1,2,4].map(n=>{const s=simulate(n,run.latency);return `<tr${n===run.capacity?' class="selected"':''}><th scope="row">${n}</th><td>${s.cycles}</td><td>${s.idle}</td><td>${Math.round(100*s.issued/s.cycles)}%</td></tr>`;}).join('');
    timeline();
  }
  function change(){run=simulate(Number($('resident').value),Number($('latency').value));position=0;$('latency-value').textContent=run.latency;render();$('timeline').scrollLeft=0;}
  function move(p){position=Math.max(0,Math.min(p,run.frames.length-1));render();const x=42+(position-1)*21,box=$('timeline');if(x<box.scrollLeft||x>box.scrollLeft+box.clientWidth-42)box.scrollLeft=Math.max(0,x-box.clientWidth/2);}
  $('resident').addEventListener('change',change);$('latency').addEventListener('input',change);
  $('scrub').addEventListener('input',()=>move(Number($('scrub').value)));
  $('back').addEventListener('click',()=>move(position-1));$('next').addEventListener('click',()=>move(position+1));$('reset').addEventListener('click',()=>move(0));$('finish').addEventListener('click',()=>move(run.frames.length-1));
  $('multiply').addEventListener('click',()=>{let p=position+1;while(p<run.frames.length-1&&run.frames[p].event?.op!=='M')p++;move(p);});
  $('theme').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme==='dark'||(document.documentElement.dataset.theme!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.dataset.theme=dark?'light':'dark';$('theme').textContent=dark?'Dark theme':'Light theme';});
  const dark=matchMedia('(prefers-color-scheme:dark)').matches;$('theme').textContent=dark?'Light theme':'Dark theme';
  $('theme').hidden=false;$('lab').hidden=false;render();
  root.gpuWaitingModel={simulate,A,B};
})(typeof window!=='undefined'?window:globalThis);
