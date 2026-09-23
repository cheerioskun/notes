'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const set = (id, text) => { $(id).textContent = text; };
  const clean = n => Number(n.toFixed(3)).toString();
  const state = {flight: 0.75, capacity: 10, time: 50};
  const NS = 'http://www.w3.org/2000/svg';
  function element(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs || {})) e.setAttribute(key, value);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function chart(id, {title, xmax, ymax, xticks, yticks, xlabel, suffix = ''}) {
    const svg = $(id); svg.replaceChildren();
    const x = n => 51 + n / xmax * 303;
    const y = n => 184 - n / ymax * 133;
    const add = (tag, attrs, text) => svg.appendChild(element(tag, attrs, text));
    add('text', {x: 12, y: 22, class: 'plot-title'}, title);
    yticks.forEach(v => {
      add('line', {x1:51,y1:y(v),x2:354,y2:y(v),class:'grid'});
      add('text', {x:42,y:y(v)+5,'text-anchor':'end'}, String(v));
    });
    xticks.forEach(v => add('text', {x:x(v),y:207,'text-anchor':'middle'}, String(v)));
    add('line', {x1:51,y1:184,x2:354,y2:184,class:'axis'});
    add('text', {x:205,y:232,'text-anchor':'middle'}, xlabel);
    function line(points, cls, extra = {}) {
      return add('polyline', {points:points.map(([a,b])=>`${x(a)},${y(b)}`).join(' '),class:cls,...extra});
    }
    function dot(a,b,cls) { add('circle',{cx:x(a),cy:y(b),r:5.5,class:cls}); }
    return {svg,x,y,add,line,dot};
  }
  function inventory() {
    const w = state.flight, rate = Math.min(10,w/.05), q = Math.max(0,w-.5), rtt = 50+q/10*1000;
    set('flight-value', `${w.toFixed(2)} MB`);
    set('delivered', `${clean(rate)} MB/s`); set('queued',`${q.toFixed(2)} MB`); set('round-trip',`${clean(rtt)} ms`);
    set('inventory-explanation', w < .5 ? `Only ${clean(rate/10*100)}% of the bottleneck is used. There is no queue; more flight can still buy throughput.` : Math.abs(w-.5)<1e-8 ? 'At 0.50 MB, the path is fully utilized with no standing queue in this idealized model.' : `The extra ${q.toFixed(2)} MB adds ${clean(rtt-50)} ms of waiting and no throughput.`);
    const shared={xmax:1.5,xticks:[0,.5,1,1.5],xlabel:'Data in flight · MB'};
    const c=chart('throughput-plot',{...shared,title:'Delivery · MB/s',ymax:12,yticks:[0,5,10]});
    c.add('line',{x1:c.x(.5),x2:c.x(.5),y1:45,y2:184,class:'knee'});
    c.line([[0,0],[.5,10],[1.5,10]],'blue-line');c.dot(w,rate,'blue-dot');
    c.add('text',{x:c.x(.5)+8,y:43,class:'blue-text'},'BDP = 0.50');
    const d=chart('rtt-plot',{...shared,title:'Round trip · ms',ymax:160,yticks:[0,50,100,150]});
    d.add('line',{x1:d.x(.5),x2:d.x(.5),y1:45,y2:184,class:'knee'});
    d.line([[0,50],[.5,50],[1.5,150]],'red-line');d.dot(w,rtt,'red-dot');
    d.svg.setAttribute('aria-label',`For ${w.toFixed(2)} megabytes in flight, RTT is ${clean(rtt)} milliseconds and queue is ${q.toFixed(2)} megabytes.`);
    c.svg.setAttribute('aria-label',`For ${w.toFixed(2)} megabytes in flight, delivery is ${clean(rate)} megabytes per second. The knee is at half a megabyte.`);
  }
  function probe() {
    const t=state.time, cap=state.capacity, deliveredRate=Math.min(cap,12.5), q=(12.5-deliveredRate)*t/1000, delay=q/cap*1000;
    set('probe-time-value',`${t} ms`); set('probe-sent',`${(12.5*t/1000).toFixed(3)} MB`);set('probe-delivered',`${(deliveredRate*t/1000).toFixed(3)} MB`);set('probe-delay',`${clean(delay)} ms`);
    set('probe-explanation',t===0?'The probe is about to begin. No additional bytes have arrived and no queue has accumulated.':cap===10?`The extra rate produced ${q.toFixed(3)} MB of queue. Delivery stayed at 10 MB/s. Returning to 10 MB/s would preserve this queue.`:`All offered data was delivered without a standing queue. The probe demonstrates 12.5 MB/s, not the full 15 MB/s that happens to be available.`);
    const shared={xmax:50,xticks:[0,25,50],xlabel:'Time at bottleneck · ms'};
    const c=chart('rate-plot',{...shared,title:'Offered & delivered · MB/s',ymax:16,yticks:[0,5,10,15]});
    c.line([[0,12.5],[50,12.5]],'red-line',{'stroke-dasharray':'5 4','stroke-opacity':'.25'});
    if(t>0){c.line([[0,deliveredRate],[t,deliveredRate]],'blue-line');c.line([[0,12.5],[t,12.5]],'red-line',{'stroke-dasharray':'5 4'});}
    c.dot(t,deliveredRate,'blue-dot');
    c.add('text',{x:55,y:42,class:'red-text'},'offered');c.add('text',{x:218,y:42,class:'blue-text'},'delivered');
    const d=chart('queue-plot',{...shared,title:'Accumulated queue · kB',ymax:150,yticks:[0,50,100,150]});
    const qk=q*1000;
    d.add('polygon',{points:`${d.x(0)},${d.y(0)} ${d.x(t)},${d.y(qk)} ${d.x(t)},${d.y(0)}`,class:'area'});
    d.line([[0,0],[t,qk]],'red-line');d.dot(t,qk,'red-dot');
    c.svg.setAttribute('aria-label',`Offered rate is 12.5 megabytes per second. Delivered rate is ${deliveredRate} megabytes per second during this probe. ${cap===15?'The lines overlap because every offered byte is served.':''}`);
    d.svg.setAttribute('aria-label',`After ${t} milliseconds the accumulated queue is ${clean(qk)} kilobytes.`);
  }
  $('flight').addEventListener('input',e=>{state.flight=Number(e.target.value);inventory();});
  document.querySelectorAll('[data-flight]').forEach(b=>b.addEventListener('click',()=>{state.flight=Number(b.dataset.flight);$('flight').value=String(state.flight);inventory();}));
  $('probe-time').addEventListener('input',e=>{state.time=Number(e.target.value);probe();});
  document.querySelectorAll('[name=capacity]').forEach(r=>r.addEventListener('change',()=>{state.capacity=Number(r.value);probe();}));
  let saved;try{saved=localStorage.getItem('notes-bbr-theme');}catch{}
  let dark=saved?saved==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
  function theme(){document.documentElement.dataset.theme=dark?'dark':'light';set('theme',dark?'Light':'Dark');$('theme').setAttribute('aria-label',`Switch to ${dark?'light':'dark'} theme`);}
  $('theme').addEventListener('click',()=>{dark=!dark;theme();try{localStorage.setItem('notes-bbr-theme',dark?'dark':'light');}catch{}});
  function progress(){const length=document.documentElement.scrollHeight-innerHeight;$('progress').style.width=`${length>0?Math.min(100,scrollY/length*100):0}%`;}
  addEventListener('scroll',progress,{passive:true});addEventListener('resize',progress);
  theme();inventory();probe();progress();
})();
