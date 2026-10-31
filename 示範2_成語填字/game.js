'use strict';
const $ = s => document.querySelector(s);
const shuffle = a => { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b; };
let rounds=[], current=0, score=0, mistakes=0, selected=null, drag=null, suppressClickUntil=0;
const numerals=['一','二','三','四','五','六','七','八','九','十'];
const extraChars=[...new Set(IDIOMS.flatMap(x=>[...x.word]))];
function start(){
 cancelDrag(); rounds=shuffle(IDIOMS).slice(0,10).map(q=>({...q, blanks:shuffle([0,1,2,3]).slice(0,2).sort(), solved:[], failed:[], errors:0, points:0}));
 current=0;score=0;mistakes=0;$('#result').hidden=true;$('#play').hidden=false;render();
}
function render(){
 selected=null;const q=rounds[current];$('#score').textContent=score;$('#progress-label').textContent=`${String(current+1).padStart(2,'0')} / 10`;
 $('#progress').innerHTML=rounds.map((_,i)=>`<span class="${i<current?'done':i===current?'current':''}"></span>`).join('');
 $('#question-label').textContent=`第 ${numerals[current]} 題`;$('#slots').replaceChildren();$('#cards').replaceChildren();
 [...q.word].forEach((char,index)=>{
 const blank=q.blanks.includes(index),el=document.createElement(blank?'button':'span');el.className='slot';el.dataset.index=index;
 if(blank){el.type='button';el.setAttribute('aria-label',`第${index+1}字空格`);el.addEventListener('click',()=>{if(selected)attempt(selected,index);else feedback('請先選一張字卡，再點這個空格。');});}
 else el.textContent=char;$('#slots').append(el);
 });
 const answers=q.blanks.map(i=>q.word[i]);const distractors=shuffle(extraChars.filter(c=>!answers.includes(c))).slice(0,4);
 shuffle([...answers,...distractors]).forEach((char,i)=>{const card=document.createElement('button');card.type='button';card.className='card';card.textContent=char;card.dataset.char=char;card.style.setProperty('--tilt',`${[-3,2,-1,3,-2,1][i]}deg`);card.setAttribute('aria-label',`字卡：${char}`);card.setAttribute('aria-pressed','false');card.addEventListener('click',()=>{if(Date.now()<suppressClickUntil)return;select(card);});card.addEventListener('pointerdown',beginDrag);$('#cards').append(card);});
 $('#clue-text').textContent=q.meaning;$('#clue').hidden=false;$('#reveal').hidden=true;$('#next').hidden=true;feedback('也可以先點字卡，再點空格。');
}
function feedback(text,type=''){ $('#feedback').textContent=text;$('#feedback').className=`feedback ${type}`; }
function select(card){if(card.disabled)return;document.querySelectorAll('.card').forEach(c=>{c.classList.remove('selected');c.setAttribute('aria-pressed','false');});selected=card;card.classList.add('selected');card.setAttribute('aria-pressed','true');feedback(`已選「${card.dataset.char}」，請點選一個空格。`);}
function attempt(card,index){
 const q=rounds[current];if(!q||!q.blanks.includes(index)||q.solved.includes(index)||card.disabled)return;
 const slot=$(`#slots [data-index="${index}"]`);
 if(card.dataset.char!==q.word[index]){q.errors++;mistakes++;if(!q.failed.includes(index))q.failed.push(index);feedback(`「${card.dataset.char}」不適合這一格，字卡已退回，再想一想！`,'error');slot.classList.remove('shake');void slot.offsetWidth;slot.classList.add('shake');card.classList.remove('selected');card.setAttribute('aria-pressed','false');selected=null;return;}
 q.solved.push(index);if(!q.failed.includes(index)){score+=5;q.points+=5;}$('#score').textContent=score;
 slot.textContent=card.dataset.char;slot.classList.add('locked');slot.disabled=true;slot.setAttribute('aria-label',`第${index+1}字：${card.dataset.char}，已答對`);
 const seal=document.createElement('img');seal.src='assets/images/seal.png';seal.alt='正確紅章';seal.className='stamp';slot.append(seal);
 card.disabled=true;card.classList.add('used');card.classList.remove('selected');selected=null;feedback('落字正確，蓋章！再完成另一格。','success');
 if(q.solved.length===2){$('#full-word').textContent=q.word;$('#meaning').textContent=q.meaning;$('#reveal').hidden=false;$('#clue').hidden=true;$('#next').hidden=false;$('#next').innerHTML=current===9?'完成修習 · 查看成績':'收好這句，下一題 <span aria-hidden="true">→</span>';feedback(`「${q.word}」完成！本題獲得 ${q.points} 分。`,'success');}
}
function beginDrag(e){if(e.button!==0||e.currentTarget.disabled)return;const card=e.currentTarget;drag={card,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,ghost:null};card.setPointerCapture(e.pointerId);}
function moveDrag(e){if(!drag||drag.id!==e.pointerId)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;
 if(!drag.moved){drag.moved=true;drag.ghost=drag.card.cloneNode(true);drag.ghost.className='card drag-ghost';drag.ghost.removeAttribute('id');drag.ghost.setAttribute('aria-hidden','true');document.body.append(drag.ghost);drag.card.classList.add('drag-source');}
 e.preventDefault();drag.ghost.style.left=`${e.clientX-34}px`;drag.ghost.style.top=`${e.clientY-38}px`;
 document.querySelectorAll('.slot.target').forEach(s=>s.classList.remove('target'));const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('button.slot:not(:disabled)');if(target)target.classList.add('target');
}
function endDrag(e){if(!drag||drag.id!==e.pointerId)return;const d=drag;if(d.moved){suppressClickUntil=Date.now()+400;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('button.slot:not(:disabled)');cancelDrag();if(target)attempt(d.card,Number(target.dataset.index));else feedback('字卡已回到拾字盤，請放入空格。');}else cancelDrag();}
function cancelDrag(){if(!drag)return;drag.ghost?.remove();drag.card.classList.remove('drag-source');if(drag.card.hasPointerCapture?.(drag.id))drag.card.releasePointerCapture(drag.id);drag=null;document.querySelectorAll('.slot.target').forEach(s=>s.classList.remove('target'));}
document.addEventListener('pointermove',moveDrag,{passive:false});document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',cancelDrag);window.addEventListener('blur',cancelDrag);document.addEventListener('keydown',e=>{if(e.key==='Escape'){cancelDrag();selected?.classList.remove('selected');selected?.setAttribute('aria-pressed','false');selected=null;feedback('已取消選取。');}});
$('#next').addEventListener('click',()=>{if(rounds[current].solved.length!==2)return;cancelDrag();if(current<9){current++;render();$('#question-label').scrollIntoView({block:'nearest',behavior:'smooth'});}else finish();});
function finish(){
 $('#play').hidden=true;$('#result').hidden=false;$('#final-score').textContent=score;$('#result-message').textContent=score===100?'字字到位，今日的成語高手就是你！':score>=70?'墨香漸濃！把不熟悉的成語再讀一次，下回會更進步。':'十句成語都完成了！多讀幾遍解釋，讓新知識慢慢累積。';
 $('#summary').textContent=`完成 10 / 10 題 · 首次答對 ${score/5} / 20 格 · 嘗試錯誤 ${mistakes} 次`;
 $('#review').replaceChildren();rounds.forEach(q=>{const li=document.createElement('li'),strong=document.createElement('strong'),p=document.createElement('div'),s=document.createElement('small');strong.textContent=q.word;p.textContent=q.meaning;s.textContent=`本題 ${q.points} / 10 分 · 答錯 ${q.errors} 次`;li.append(strong,p,s);$('#review').append(li);});$('#result').scrollIntoView({block:'start',behavior:'smooth'});
}
$('#restart').addEventListener('click',start);$('#again').addEventListener('click',()=>{start();window.scrollTo({top:0,behavior:'smooth'});});start();
