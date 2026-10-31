'use strict';
(() => {
  // 第3族採 La/Ac 排法；Ce–Lu、Th–Lr 在下方完整列出。
  const rows = [
    ['H',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'He'],
    ['Li','Be',null,null,null,null,null,null,null,null,null,null,'B','C','N','O','F','Ne'],
    ['Na','Mg',null,null,null,null,null,null,null,null,null,null,'Al','Si','P','S','Cl','Ar'],
    'K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr'.split(' '),
    'Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe'.split(' '),
    'Cs Ba La Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn'.split(' '),
    'Fr Ra Ac Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ')
  ];
  const sequence = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
  const elements=[];
  rows.forEach((row,p)=>row.forEach((s,g)=>{if(s)elements.push({s,z:sequence.indexOf(s)+1,p:p+1,g:g+1,type:g<2||g>11?'a':'b',row:p+2,col:g+2});}));
  ['Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu','Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr'].forEach((list,i)=>list.split(' ').forEach((s,j)=>elements.push({s,z:sequence.indexOf(s)+1,p:i+6,g:0,type:'f',row:i+10,col:j+5})));
  elements.sort((a,b)=>a.z-b.z);
  const bySymbol = new Map(elements.map(e=>[e.s,e]));
  const $=id=>document.getElementById(id);
  const groupNames=['IA','IIA','IIIB','IVB','VB','VIB','VIIB','VIIIB','VIIIB','VIIIB','IB','IIB','IIIA','IVA','VA','VIA','VIIA','VIIIA'];
  let active=[],matched=new Set(),order=[],selected=null,attempts=0,won=false,drag=null;
  const scope=$('scope');
  scope.add(new Option('完整挑戰 · 全部 118 元素','all'));
  for(let g=1;g<=18;g++)scope.add(new Option(`第 ${g} 族（${groupNames[g-1]}）· 全族元素`,`g${g}`));
  for(let p=1;p<=7;p++)scope.add(new Option(`第 ${p} 週期 · 全週期元素`,`p${p}`));
  scope.add(new Option('鑭系 · La–Lu（15 個）','lanthanides'));
  scope.add(new Option('錒系 · Ac–Lr（15 個）','actinides'));
  function shuffled(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function feedback(message,type=''){$('feedback').textContent=message;$('feedback').className=`feedback ${type}`;}
  function getActive(){const v=scope.value;return elements.filter(e=>v==='all'||(v[0]==='g'&&e.g===Number(v.slice(1)))||(v[0]==='p'&&e.p===Number(v.slice(1)))||(v==='lanthanides'&&e.z>=57&&e.z<=71)||(v==='actinides'&&e.z>=89&&e.z<=103));}
  function makeTable(){
    const table=$('periodic-table');table.replaceChildren();
    groupNames.forEach((name,i)=>{const label=document.createElement('div');label.className='group-label';label.style.gridColumn=i+2;label.style.gridRow=1;label.innerHTML=`<strong>${name}</strong><span>${i+1}</span>`;table.append(label);});
    for(let p=1;p<=7;p++){const label=document.createElement('div');label.className='period-label';label.textContent=p;label.style.gridColumn=1;label.style.gridRow=p+1;table.append(label);}
    const note=document.createElement('div');note.className='table-note';note.innerHTML='<strong>Discover the elements.</strong><p>由原子序找到位置<br>把符號放回屬於它的座標</p>';table.append(note);
    [10,11].forEach((row,i)=>{const label=document.createElement('div');label.className='series-label';label.style.gridRow=row;label.style.gridColumn='2 / 5';label.textContent=i?'錒系其餘元素 90–103':'鑭系其餘元素 58–71';table.append(label);});
    const allowed=new Set(active.map(e=>e.s));
    elements.forEach(e=>{const cell=document.createElement('button');cell.type='button';cell.className=`slot ${e.type}${allowed.has(e.s)?'':' inactive'}`;cell.dataset.symbol=e.s;cell.style.gridColumn=e.col;cell.style.gridRow=e.row;cell.disabled=!allowed.has(e.s);cell.setAttribute('aria-label',`原子序 ${e.z}，${e.g?`第 ${e.g} 族，`:''}第 ${e.p} 週期，尚未配對`);cell.innerHTML=`<span class="number">${e.z}</span>`;cell.addEventListener('click',()=>{if(selected)attempt(selected,e.s);else feedback('請先從元素卷軸選取一個符號。');});table.append(cell);});
  }
  function renderCards(){const cards=$('cards');cards.replaceChildren();const query=$('search').value.trim().toLowerCase();let visible=0;order.forEach(s=>{if(matched.has(s)||!s.toLowerCase().includes(query))return;visible++;const card=document.createElement('button');card.type='button';card.className=`element-card${selected===s?' selected':''}`;card.textContent=s;card.dataset.symbol=s;card.setAttribute('aria-label',`元素符號 ${s}，可拖曳或點選`);card.setAttribute('aria-pressed',String(selected===s));card.addEventListener('pointerdown',startDrag);card.addEventListener('click',event=>{if(event.detail===0)selectCard(s);});cards.append(card);});$('empty-bank').hidden=visible>0;}
  function selectCard(s){selected=selected===s?null:s;renderCards();feedback(selected?`已選取 ${s}，請點選它在週期表的位置。`:'已取消選取。');}
  function update(){const a=active.filter(e=>e.type==='a'),b=active.filter(e=>e.type==='b');const ac=a.filter(e=>matched.has(e.s)).length,bc=b.filter(e=>matched.has(e.s)).length;const bGoal=scope.value==='all'?10:b.length;$('a-count').textContent=`${ac} / ${a.length}`;$('b-count').textContent=`${bc} / ${bGoal}`;$('a-progress').max=a.length||1;$('a-progress').value=ac;$('b-progress').max=bGoal||1;$('b-progress').value=bc;$('total-count').textContent=`${matched.size} / ${active.length}`;$('remaining').textContent=`剩餘 ${active.length-matched.size} 張`;$('accuracy').textContent=attempts?`配對正確率 ${Math.round(matched.size/attempts*100)}%`:'準備開始探索';const complete=scope.value==='all'?ac===a.length&&bc>=10:matched.size===active.length;if(complete&&!won){won=true;$('win-detail').textContent=scope.value==='all'?`A 族 ${ac} 個全部配對，B 族已完成 ${bc} 個。你已達成過關條件，還可以繼續挑戰全部 118 個元素！`:`本次範圍的 ${active.length} 個元素已全數配對。換個族或週期，繼續探索吧！`;$('win').showModal();}}
  function attempt(s,target){if(!bySymbol.has(s)||!active.some(e=>e.s===s)||matched.has(s))return;const cell=document.querySelector(`.slot[data-symbol="${target}"]`);if(!cell||cell.disabled)return;attempts++;if(s===target){matched.add(s);selected=null;cell.classList.add('matched');cell.disabled=true;cell.setAttribute('aria-label',`${s}，原子序 ${bySymbol.get(s).z}，配對正確並鎖定`);const symbol=document.createElement('span');symbol.className='symbol';symbol.textContent=s;const stamp=document.createElement('span');stamp.className='stamp';stamp.textContent='正確';cell.append(symbol,stamp);feedback(`${s} 配對正確！原子序 ${bySymbol.get(s).z}，已蓋章鎖定。`,'success');renderCards();}else{selected=null;cell.classList.remove('wrong');void cell.offsetWidth;cell.classList.add('wrong');feedback(`${s} 不在原子序 ${bySymbol.get(target).z} 的位置，卷軸已退回，再試一次！`,'error');renderCards();}update();}
  function start(){cancelDrag();if($('win').open)$('win').close();active=getActive();matched=new Set();selected=null;attempts=0;won=false;$('search').value='';order=shuffled(active.map(e=>e.s));$('goal').textContent=scope.value==='all'?'過關目標：A 族全數配對 ＋ B 族至少 10 個':`練習目標：完成本範圍全部 ${active.length} 個元素`;$('table-scroll').scrollTo(0,0);makeTable();renderCards();$('cards').scrollTop=0;update();feedback('從右側選一張卷軸，開始配對吧！');}
  function startDrag(event){if(event.button!==0||drag)return;const card=event.currentTarget;drag={id:event.pointerId,s:card.dataset.symbol,card,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,moving:false,ghost:null,raf:null,hover:null};card.setPointerCapture(event.pointerId);card.addEventListener('pointermove',moveDrag);card.addEventListener('pointerup',endDrag);card.addEventListener('pointercancel',cancelDrag);}
  function moveDrag(event){if(!drag||event.pointerId!==drag.id)return;drag.x=event.clientX;drag.y=event.clientY;if(!drag.moving&&Math.hypot(drag.x-drag.startX,drag.y-drag.startY)>6){drag.moving=true;selected=null;drag.card.classList.add('drag-source');drag.ghost=drag.card.cloneNode(true);drag.ghost.className='element-card drag-ghost';drag.ghost.removeAttribute('id');drag.ghost.setAttribute('aria-hidden','true');document.body.append(drag.ghost);drag.raf=requestAnimationFrame(dragFrame);}if(drag.moving){event.preventDefault();positionGhost();}}
  function positionGhost(){if(drag?.ghost){drag.ghost.style.left=`${drag.x-drag.ghost.offsetWidth/2}px`;drag.ghost.style.top=`${drag.y-drag.ghost.offsetHeight/2}px`;}}
  function dragFrame(){if(!drag?.moving)return;const scroller=$('table-scroll'),r=scroller.getBoundingClientRect();if(drag.y>r.top&&drag.y<r.bottom){if(drag.x<r.left+38&&drag.x>=r.left)scroller.scrollLeft-=12;if(drag.x>r.right-38&&drag.x<=r.right)scroller.scrollLeft+=12;if(drag.y<r.top+30)scroller.scrollTop-=9;if(drag.y>r.bottom-30)scroller.scrollTop+=9;}const height=window.innerHeight;if(drag.y<60)window.scrollBy(0,-13);if(drag.y>height-60)window.scrollBy(0,13);const slot=document.elementFromPoint(drag.x,drag.y)?.closest('.slot:not(:disabled)');if(drag.hover!==slot){drag.hover?.classList.remove('drop-hover');slot?.classList.add('drop-hover');drag.hover=slot;}drag.raf=requestAnimationFrame(dragFrame);}
  function cancelDrag(){if(!drag)return;cancelAnimationFrame(drag.raf);drag.ghost?.remove();drag.hover?.classList.remove('drop-hover');drag.card.classList.remove('drag-source');drag.card.removeEventListener('pointermove',moveDrag);drag.card.removeEventListener('pointerup',endDrag);drag.card.removeEventListener('pointercancel',cancelDrag);if(drag.card.hasPointerCapture(drag.id))drag.card.releasePointerCapture(drag.id);drag=null;}
  function endDrag(event){if(!drag||event.pointerId!==drag.id)return;const {s,moving}=drag;const slot=document.elementFromPoint(event.clientX,event.clientY)?.closest('.slot:not(:disabled)');cancelDrag();if(moving){if(slot)attempt(s,slot.dataset.symbol);else feedback(`${s} 卷軸已退回；請放到本次範圍的空白格。`);}else selectCard(s);}
  $('restart').addEventListener('click',start);scope.addEventListener('change',start);$('search').addEventListener('input',renderCards);$('shuffle').addEventListener('click',()=>{order=shuffled(order);renderCards();});$('help').addEventListener('click',()=>{const open=$('instructions').hidden;$('instructions').hidden=!open;$('help').setAttribute('aria-expanded',String(open));});$('continue').addEventListener('click',()=>$('win').close());$('play-again').addEventListener('click',start);window.addEventListener('blur',cancelDrag);start();
})();
