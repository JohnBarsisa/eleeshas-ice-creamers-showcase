const cards = [...document.querySelectorAll('.card')];
const menu = cards.map(card => ({name: card.querySelector('strong').textContent, image: card.querySelector('img').getAttribute('src')}));
const sizes = {Regular:3500, Large:4500, Share:5000};
const toppings = ['Cookie crumble', 'Chocolate sauce', 'Sprinkles', 'Caramel drizzle'];
const money = value => '₦' + value.toLocaleString('en-NG');
const unit = line => sizes[line.size] + 500 * line.extras.length;
const total = () => basket.reduce((sum, line) => sum + unit(line) * line.qty, 0);
const modal = document.querySelector('#modal');
const content = document.querySelector('#content');
const storageKey = 'eleeshas-basket-v1';
const whatsapp = message => 'https://wa.me/?text=' + encodeURIComponent(message);
let basket = [];
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
  content.innerHTML = `<img class="scoop-img" alt="" src="${item.image}"><h2 id="dialog-title">${item.name}</h2><form id="choose"><label>Size<select name="size">${Object.entries(sizes).map(([name,price])=>`<option value="${name}">${name} · ${money(price)}</option>`).join('')}</select></label><fieldset><legend>Toppings · ₦500 each</legend><div class="toppings">${toppings.map(x=>`<label><input type="checkbox" name="extra" value="${x}">${x}</label>`).join('')}</div></fieldset><label>Quantity<input type="number" name="qty" value="1" min="1" max="99" required></label><button class="action" id="add"></button><p role="status" id="limit"></p></form>`;
  const form = content.querySelector('#choose');
  function selection() {
    const data = new FormData(form);
    return {id, size:data.get('size'), extras:data.getAll('extra'), qty:Number(data.get('qty'))};
  }
  function recalc() {
    const line = selection();
    content.querySelector('#add').textContent = form.checkValidity() ? 'Add to basket · ' + money(unit(line)*line.qty) : 'Add to basket';
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
    persist(); showBasket();
  };
  recalc(); show();
}
function summary() {
  return ['Hello Eleeshas! I would like to order:', ...basket.map(line=>line.qty+' × '+menu[line.id].name+' ('+[line.size,...line.extras].join(', ')+') — '+money(unit(line)*line.qty)), 'Basket total: '+money(total()), 'Please confirm availability and collection details.'].join('\n');
}
function showBasket() {
  content.innerHTML = '<h2 id="dialog-title" tabindex="-1">Your basket</h2>';
  if (basket.length) {
    basket.forEach((line,i)=>{
      const row = document.createElement('div');
      row.className='basket-line';
      row.innerHTML=`<img src="${menu[line.id].image}" alt=""><div><strong>${menu[line.id].name}</strong><p>${[line.size,...line.extras].join(' · ')}</p><b>${money(unit(line)*line.qty)}</b><div class="stepper"><button aria-label="Decrease quantity">−</button><span>${line.qty}</span><button aria-label="Increase quantity">+</button><button>Remove</button></div></div>`;
      const [minus,plus,remove]=row.querySelectorAll('button');
      const change=qty=>{if(qty===0)basket.splice(i,1);else line.qty=qty; persist();showBasket();};
      minus.onclick=()=>change(line.qty-1);plus.onclick=()=>change(line.qty+1);plus.disabled=line.qty>=99;remove.onclick=()=>change(0);
      content.append(row);
    });
    content.insertAdjacentHTML('beforeend',`<p class="total"><strong>Total</strong><b>${money(total())}</b></p><div class="basket-actions"><a class="action" target="_blank" rel="noopener" id="order">Continue on WhatsApp ↗</a><button class="secondary" id="copy">Copy order</button></div><p>Choose the shop’s chat and tap Send. Eleeshas will confirm availability and collection.</p><p>You can also copy your order and message <a href="https://www.instagram.com/eleeshas_icecreamers/" target="_blank" rel="noopener">@eleeshas_icecreamers</a>.</p>`);
    content.querySelector('#order').href=whatsapp(summary());
    content.querySelector('#copy').onclick=async event=>{
      const button=event.currentTarget;
      try { await navigator.clipboard.writeText(summary()); button.textContent='Order copied'; }
      catch { const field=document.createElement('textarea'); field.value=summary();field.readOnly=true;field.setAttribute('aria-label','Order to copy');button.replaceWith(field);field.select(); }
    };
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
