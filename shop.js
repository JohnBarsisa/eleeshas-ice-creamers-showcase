const cards = [...document.querySelectorAll('.card')];
const menu = cards.map(card => ({name: card.querySelector('strong').textContent, image: card.querySelector('img').getAttribute('src')}));
const sizes = {Regular:3500, Large:4500, Share:15000};
const toppings = ['Cookie crumble', 'Chocolate sauce', 'Sprinkles', 'Caramel drizzle'];
const money = value => '₦' + value.toLocaleString('en-NG');
const unit = line => sizes[line.size] + 500 * line.extras.length;
const total = () => basket.reduce((sum, line) => sum + unit(line) * line.qty, 0);
const modal = document.querySelector('#modal');
const content = document.querySelector('#content');
const storageKey = 'eleeshas-basket-v1';
const whatsapp = message => 'https://wa.me/?text=' + encodeURIComponent(message);
let basket = [];
let toastTimer;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) basket = saved.filter(line => line && Number.isInteger(line.id) && menu[line.id] && Object.hasOwn(sizes,line.size) && Array.isArray(line.extras) && line.extras.every(x=>toppings.includes(x)) && Number.isSafeInteger(line.qty) && line.qty>0 && line.qty<=99);
} catch {}
function updateCount() {
  document.querySelector('#count').textContent = basket.reduce((sum,line)=>sum+line.qty,0);
}
function persist() {
  updateCount();
  try { localStorage.setItem(storageKey, JSON.stringify(basket)); } catch {}
}
function show() { if (!modal.open) modal.showModal(); }
function product(id) {
  const item = menu[id];
  content.innerHTML = `<img class="scoop-img" alt="" src="${item.image}"><h2 id="dialog-title">${item.name}</h2><form id="choose"><label>Size<select name="size">${Object.entries(sizes).map(([name,price])=>`<option value="${name}">${name==='Share'?'Family share':name} · ${money(price)}</option>`).join('')}</select></label><fieldset><legend>Toppings · ₦500 each</legend><div class="toppings">${toppings.map(x=>`<label><input type="checkbox" name="extra" value="${x}">${x}</label>`).join('')}</div></fieldset><fieldset><legend>Quantity</legend><div class="stepper qty"><button type="button" id="less" aria-label="Decrease scoop quantity">−</button><input aria-label="Quantity" type="number" name="qty" value="1" min="1" max="99" required><button type="button" id="more" aria-label="Increase scoop quantity">+</button></div></fieldset><button class="action" id="add"></button><p role="status" id="limit"></p></form>`;
  const form = content.querySelector('#choose');
  function selection() {
    const data = new FormData(form);
    return {id, size:data.get('size'), extras:data.getAll('extra'), qty:Number(data.get('qty'))};
  }
  function recalc() {
    const line = selection();
    content.querySelector('#add').textContent = form.checkValidity() ? 'Add to basket · ' + money(unit(line)*line.qty) : 'Add to basket';
  }
  for (const [id,delta] of [['less',-1],['more',1]]) {
    form.querySelector('#'+id).onclick=()=>{
      form.elements.qty.value=Math.max(1,Math.min(99,(Number(form.elements.qty.value)||0)+delta));
      recalc();
    };
  }
  form.oninput = recalc;
  form.onsubmit = event => {
    event.preventDefault();
    const line = selection();
    const same = basket.find(x=>x.id===id && x.size===line.size && x.extras.join('|')===line.extras.join('|'));
    if (same && same.qty+line.qty>99) {
      content.querySelector('#limit').textContent='You can add up to 99 of this selection.';
      return;
    }
    if (same) same.qty+=line.qty;
    else basket.push(line);
    persist(); modal.close();
    const toast=document.querySelector('#toast');
    toast.textContent=line.qty+' × '+item.name+' added to basket. ';
    const view=document.createElement('button');
    view.textContent='View basket'; view.onclick=showBasket; toast.append(view);
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.replaceChildren(),6000);
  };
  recalc(); show();
}
function showBasket() {
  document.querySelector('#toast').replaceChildren();
  content.innerHTML = '<h2 id="dialog-title" tabindex="-1">Your basket</h2>';
  if (basket.length) {
    basket.forEach((line,i)=>{
      const row = document.createElement('div');
      row.className='basket-line';
      row.innerHTML=`<img src="${menu[line.id].image}" alt=""><div><strong>${menu[line.id].name}</strong><p>${[line.size==='Share'?'Family share':line.size,...line.extras].join(' · ')}</p><b>${money(unit(line)*line.qty)}</b><div class="stepper"><button aria-label="Decrease quantity">−</button><span>${line.qty}</span><button aria-label="Increase quantity">+</button><button>Remove</button></div></div>`;
      const [minus,plus,remove]=row.querySelectorAll('button');
      const change=qty=>{if(qty===0)basket.splice(i,1);else line.qty=qty; persist();showBasket();};
      minus.onclick=()=>change(line.qty-1);plus.onclick=()=>change(line.qty+1);plus.disabled=line.qty>=99;remove.onclick=()=>change(0);
      content.append(row);
    });
    content.insertAdjacentHTML('beforeend',`<p class="total"><strong>Total</strong><b>${money(total())}</b></p><button class="action" id="checkout">Go to checkout →</button></p>`);
    content.querySelector('#checkout').onclick=checkout;
  } else content.insertAdjacentHTML('beforeend','<p>Your basket is empty. Pick a flavour to start your order.</p>');
  const back=document.createElement('button');back.className='secondary';back.textContent='Keep browsing';
  back.onclick=()=>{modal.close();document.querySelector('#menu').scrollIntoView();};content.append(back);show();content.querySelector('h2').focus();
}
cards.forEach((card,i)=>card.onclick=()=>product(i));
document.querySelector('#open-basket').onclick=showBasket;
for (const button of document.querySelectorAll('[data-filter]')) button.onclick=()=>{
  for (const other of document.querySelectorAll('[data-filter]')) other.setAttribute('aria-pressed',String(other===button));
  cards.forEach(card=>card.hidden=button.dataset.filter!=='all' && button.dataset.filter!==card.dataset.kind);
};
document.querySelector('#contact-form').onsubmit=event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  window.open(whatsapp('Hello Eleeshas, my name is '+data.get('name').trim()+'.\n'+data.get('message').trim()),'_blank','noopener,noreferrer');
};
updateCount();

function checkout() {
  content.innerHTML=`<p class="eyebrow">CHECKOUT</p><h2 id="dialog-title">Delivery details</h2><form id="payment">
    <label>Your name<input name="customer" required maxlength="80" autocomplete="name"></label>
    <label>Phone number<input name="phone" type="tel" required maxlength="24" autocomplete="tel"></label>
    <label>Receive your scoops<select name="method"><option>Delivery</option><option>Collection</option></select></label>
    <label id="address-label">Delivery address<textarea name="address" required rows="2" maxlength="300" autocomplete="street-address"></textarea></label>
    <p id="fee">Demo delivery fee · ₦0</p><p class="total"><strong>Total</strong><b>${money(total())}</b></p>
    <p>This is a demo payment. Use sample details. No money will be taken.</p>
    <button class="action">Pay ${money(total())} · demo</button> <button class="secondary" id="back" type="button">Back to basket</button></form>`;
  const form=content.querySelector('#payment');
  form.elements.method.onchange=()=>{
    const delivery=form.elements.method.value==='Delivery';
    document.querySelector('#address-label').hidden=!delivery;
    form.elements.address.disabled=!delivery;
    document.querySelector('#fee').textContent=delivery?'Demo delivery fee · ₦0':'Collection · ₦0';
  };
  form.querySelector('#back').onclick=showBasket;
  form.onsubmit=event=>{
    event.preventDefault();
    const ref='EL-'+crypto.randomUUID().slice(0,8).toUpperCase();
    const lines=basket.map(line=>line.qty+' × '+menu[line.id].name+' · '+[line.size==='Share'?'Family share':line.size,...line.extras].join(', ')+' · '+money(unit(line)*line.qty));
    const amount=money(total());
    const method=form.elements.method.value;
    const message=['Eleeshas demo order '+ref,...lines,'Demo payment: '+amount,method,'No money was charged.'].join('\n');
    const destination=method==='Delivery'?form.elements.address.value.trim():'Shop collection';
    basket=[];persist();
    content.innerHTML=`<p class="eyebrow">DEMO ORDER · ${ref}</p><h2 id="dialog-title">Payment simulated.</h2><p>Your demo receipt is ready.</p><ul id="receipt-lines"></ul><p class="total"><strong>Demo total</strong><b>${amount}</b></p><p id="destination"></p><a class="action" id="share-receipt" target="_blank" rel="noopener">Continue on WhatsApp ↗</a><small>Choose the shop’s chat to share your demo receipt.</small>`;
    for(const line of lines){const li=document.createElement('li');li.textContent=line;content.querySelector('ul').append(li);}
    content.querySelector('#destination').textContent=method+' · '+destination;
    content.querySelector('#share-receipt').href=whatsapp(message);
    modal.scrollTop=0;
  };
  modal.scrollTop=0;form.elements.customer.focus();
}

const featured=document.querySelector('#featured');
const slides=[6,7,9,11];
let active=0;
let paused=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let touchX=0,touchY=0,swiped=false;
function renderSlide(step) {
  active=(active+step+slides.length)%slides.length;
  const item=menu[slides[active]];
  const image=document.querySelector('#featured-image');
  image.src=active===0?'art/hero-strawberry.jpg':item.image;
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) image.animate([{opacity:.45},{opacity:1}],{duration:350});
  document.querySelector('#featured-name').textContent=item.name+' ↗';
  document.querySelector('#featured-pick').setAttribute('aria-label','Customise featured '+item.name);
  document.querySelector('#slide-count').textContent=(active+1)+' / '+slides.length;
}
function setPause(value){
  paused=value;const btn=document.querySelector('#pause');
  btn.textContent=value?'▷':'Ⅱ';btn.setAttribute('aria-label',value?'Play slideshow':'Pause slideshow');
}
setPause(paused);
document.querySelector('#pause').onclick=()=>setPause(!paused);
function browse(step){setPause(true);renderSlide(step);}
document.querySelector('#next').onclick=()=>browse(1);
document.querySelector('#previous').onclick=()=>browse(-1);
document.querySelector('#featured-pick').onclick=()=>{if(!swiped){setPause(true);product(slides[active]);}swiped=false;};
featured.addEventListener('touchstart',e=>{swiped=false;touchX=e.touches[0].clientX;touchY=e.touches[0].clientY;},{passive:true});
featured.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;
  if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)){swiped=true;browse(dx<0?1:-1);setTimeout(()=>swiped=false,400);}
},{passive:true});
setInterval(()=>{if(!paused&&!modal.open&&!document.hidden&&!featured.matches(':hover,:focus-within')) renderSlide(1);},5500);
