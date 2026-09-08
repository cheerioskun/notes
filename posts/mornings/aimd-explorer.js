/* Teaching model: equal fixed RTTs, +1 per RTT, shared immediate cut at total 48. */
(function () {
  'use strict';
  function model(cycles = 8) {
    const states = [{ a: 4, b: 20, t: 0, cuts: 0, phase: 'Initial allocation' }];
    let a = 4, b = 20, t = 0;
    for (let cuts = 0; cuts < cycles; cuts++) {
      for (let round = 1; round <= 12; round++) {
        a++; b++; t++;
        states.push({ a, b, t, cuts, phase: round === 12 ? 'At the threshold, before the cut' : 'Additive growth' });
      }
      a /= 2; b /= 2;
      states.push({ a, b, t, cuts: cuts + 1, phase: 'Immediately after a shared cut' });
    }
    return states;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { model };
  if (typeof document === 'undefined') return;
  const states = model(), $ = id => document.getElementById(id);
  const range = $('step');
  const fmt = n => Number(n.toFixed(5)).toString();
  const line = (x1,y1,x2,y2,extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="axis" ${extra}/>`;
  const label = (x,y,s,extra='') => `<text x="${x}" y="${y}" ${extra}>${s}</text>`;
  const path = (points,color,extra='') => `<polyline points="${points}" class="trace" stroke="${color}" ${extra}/>`;
  const dot = (x,y,color) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${color}" stroke="var(--bg)" stroke-width="1.5"/>`;
  function render() {
    const index = Number(range.value), s = states[index], visited = states.slice(0,index+1);
    $('state').textContent = `${s.phase}. Time: ${s.t} RTTs; cuts: ${s.cuts}. A: ${fmt(s.a)} packets; B: ${fmt(s.b)} packets. Total: ${fmt(s.a+s.b)}; gap: ${fmt(s.b-s.a)}.`;
    $('next').disabled = $('next-cut').disabled = index === states.length - 1;
    $('reset').disabled = index === 0;
    const tx = n => 48 + n / 96 * 548, ty = n => 218 - n / 48 * 180;
    let time = '';
    for (const n of [0,12,24,36,48]) time += line(48,ty(n),596,ty(n)) + label(38,ty(n)+4,n,'text-anchor="end"');
    for (const n of [0,24,48,72,96]) time += label(tx(n),239,n,'text-anchor="middle"');
    time += label(48,18,'Packets') + label(596,258,'Time (RTTs)','text-anchor="end"');
    const curves = [['a','var(--accent)',''],['b','var(--other)','stroke-dasharray="7 4"'],['total','var(--ink)','stroke-dasharray="2 5"']];
    for (const [key,color,extra] of curves) {
      const value = p => key === 'total' ? p.a+p.b : p[key];
      time += path(visited.map(p=>`${tx(p.t)},${ty(value(p))}`).join(' '),color,extra);
      time += dot(tx(s.t),ty(value(s)),color);
    }
    $('time-drawing').innerHTML = time;
    $('time-desc').textContent = `Trace through ${s.t} RTTs and ${s.cuts} cuts. ${$('state').textContent} The total grows from 24 to 48 and halves at each event. Blue solid is A, orange dashed is B, dotted is their total.`;
    // Equal scales on both allocation axes: 5.5 display units per packet.
    const px = n => 58+n*5.5, py = n => 302-n*5.5;
    let alloc = '';
    for (const n of [0,12,24,36,48]) alloc += line(px(n),py(0),px(n),py(48)) + line(px(0),py(n),px(48),py(n)) + label(px(n),323,n,'text-anchor="middle"') + label(48,py(n)+4,n,'text-anchor="end"');
    alloc += `<path d="M ${px(0)} ${py(48)} L ${px(48)} ${py(0)}" stroke="var(--other)" stroke-width="1.5" stroke-dasharray="6 4" fill="none"/>`;
    alloc += `<path d="M ${px(0)} ${py(0)} L ${px(48)} ${py(48)}" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 4" fill="none"/>`;
    alloc += label(58,18,'B window (packets)') + label(322,348,'A window (packets)','text-anchor="end"');
    alloc += label(333,47,'B = A') + label(333,69,'Equal') + label(333,87,'windows');
    alloc += label(145,205,'A + B = 48',`transform="rotate(45 145 205)"`);
    alloc += path(visited.map(p=>`${px(p.a)},${py(p.b)}`).join(' '),'var(--ink)');
    alloc += `<circle cx="${px(4)}" cy="${py(20)}" r="4" fill="var(--bg)" stroke="var(--ink)" stroke-width="1.5"/>` + label(px(4)+7,py(20)-9,'Start');
    alloc += dot(px(s.a),py(s.b),'var(--accent)');
    $('allocation-drawing').innerHTML = alloc;
    $('allocation-desc').textContent = `Allocation begins at A 4, B 20. Additive growth moves up and right; cuts halve both coordinates. Current point: A ${fmt(s.a)}, B ${fmt(s.b)}. The path approaches B equals A across cycles.`;
  }
  range.addEventListener('input',render);
  $('reset').addEventListener('click',()=>{range.value=0;render();});
  $('next').addEventListener('click',()=>{range.value=Math.min(states.length-1,Number(range.value)+1);render();});
  $('next-cut').addEventListener('click',()=>{range.value=Math.min(states.length-1,(Math.floor(Number(range.value)/13)+1)*13);render();});
  render(); $('explorer').hidden=false;
  const theme=$('theme'); theme.hidden=false;
  theme.addEventListener('click',()=>{
    const current=document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    document.documentElement.dataset.theme=current==='dark'?'light':'dark';
  });
})();
