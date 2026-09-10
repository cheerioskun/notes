(function(){
 'use strict';
 function rng(seed){let x=seed>>>0;return()=>{x=(x+0x6d2b79f5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return(((t^(t>>>14))>>>0)+0.5)/4294967296;};}
 function simulate(lambda,regular=false,seed=42,count=100000,warmup=10000){
  if(!(lambda>0&&lambda<1000))throw Error('Require 0 < arrival rate < 1000');
  const ra=rng(seed),rs=rng(seed^0x9e3779b9);let arrival=0,departure=0,sum=0,wait=0,windowStart=0;
  const records=[];
  for(let i=0;i<count+warmup;i++){
   arrival+=regular?1/lambda:-Math.log(ra())/lambda;
   const service=regular?.001:-Math.log(rs())/1000;
   const start=Math.max(arrival,departure);departure=start+service;
   records.push({arrival,departure});
   if(i===warmup)windowStart=arrival;
   if(i>=warmup){sum+=departure-arrival;wait+=start-arrival;}
  }
  const end=windowStart+.2,events=[];let present=0;
  for(const r of records){
   if(r.arrival<windowStart&&r.departure>=windowStart)present++;
   if(r.arrival>=windowStart&&r.arrival<=end)events.push({t:r.arrival-windowStart,delta:1});
   if(r.departure>=windowStart&&r.departure<=end)events.push({t:r.departure-windowStart,delta:-1});
  }
  events.sort((a,b)=>a.t-b.t||a.delta-b.delta);
  const points=[[0,present]];
  for(const e of events){points.push([e.t,present]);present+=e.delta;points.push([e.t,present]);}
  points.push([.2,present]);
  return{mean:sum/count,waiting:wait/count,points,seed};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={simulate,rng};
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id);let seed=42;
 const label=(x,y,s,extra='')=>`<text x="${x}" y="${y}" ${extra}>${s}</text>`;
 const line=(x1,y1,x2,y2)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--rule)"/>`;
 const path=(points,color,extra='')=>`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="2" ${extra}/>`;
 function render(){
  const load=Number($('load').value),regular=$('mode').value==='regular',result=simulate(load,regular,seed);
  $('load-value').textContent=load;
  $('sample').disabled=regular;
  $('state').textContent=`Utilization ${(load/10).toFixed(0)}%. Model mean response: ${(regular?1:1000/(1000-load)).toFixed(2)} ms. Simulated response: ${(result.mean*1000).toFixed(2)} ms; queueing: ${(result.waiting*1000).toFixed(2)} ms. Seed ${seed}.`;
  const x=n=>52+(n-200)/750*400,y=n=>229-n/25*185;
  let curve='<title>Mean response versus arrival rate</title><desc>M/M/1 mean rises from 1.25 to 20 milliseconds; regular timing stays at 1 millisecond.</desc>';
  for(const n of [0,5,10,15,20,25])curve+=line(52,y(n),452,y(n))+label(42,y(n)+4,n,'text-anchor="end"');
  for(const n of [200,500,800,950])curve+=label(x(n),251,n,'text-anchor="middle"');
  curve+=label(52,20,'Mean response (ms)')+label(452,275,'Arrival rate / second','text-anchor="end"');
  curve+=path(Array.from({length:151},(_,i)=>{const l=200+i*5;return[x(l),y(1000/(1000-l))];}),'var(--accent)');
  curve+=path([[x(200),y(1)],[x(950),y(1)]],'var(--other)','stroke-dasharray="6 4"');
  for(const [v,c] of [[1000/(1000-load),'var(--accent)'],[1,'var(--other)']])curve+=`<circle cx="${x(load)}" cy="${y(v)}" r="5" fill="${c}"/>`;
  $('curve').innerHTML=curve;
  const tx=n=>52+n/.2*400,ty=n=>211-Math.min(n,100)/100*166;
  let trace='<title>Simulated number in the system</title><desc>A 200 millisecond trace after warm-up. Values above 100 are clipped.</desc>';
  for(const n of [0,25,50,75,100])trace+=line(52,ty(n),452,ty(n))+label(42,ty(n)+4,n,'text-anchor="end"');
  for(const n of [0,.05,.1,.15,.2])trace+=label(tx(n),234,Math.round(n*1000),'text-anchor="middle"');
  trace+=label(52,20,'Requests in system')+label(452,257,'Elapsed ms','text-anchor="end"');
  trace+=path(result.points.map(p=>[tx(p[0]),ty(p[1])]),regular?'var(--other)':'var(--accent)');
  if(result.points.some(p=>p[1]>100))trace+=label(452,38,'Above 100: clipped','text-anchor="end"');
  $('trace').innerHTML=trace;
 }
 $('load').addEventListener('input',render);$('mode').addEventListener('change',render);
 $('sample').addEventListener('click',()=>{seed=(seed+1)>>>0;render();});
 render();$('explorer').hidden=false;
})();
