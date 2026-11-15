const cards = [...document.querySelectorAll('.card')];
const product = document.querySelector('#product');
const detail = document.querySelector('#detail');
const viewer = document.querySelector('#viewer');
const boards = [...document.querySelectorAll('.zoom')];
let boardIndex = 0;
for (const filter of document.querySelectorAll('[data-filter]')) {
  filter.onclick = () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === filter)));
    cards.forEach(card => card.hidden = filter.dataset.filter !== 'all' && filter.dataset.filter !== card.dataset.kind);
  };
}
function productView(card) {
  const name = card.querySelector('strong').textContent;
  const art = card.querySelector('img').getAttribute('src');
  detail.innerHTML = `<img alt="" src="${art}"><p class="eyebrow">SAMPLE ENQUIRY</p><h2>${name}</h2><b>Ask for price</b><form id="scoop"><label>Size<select name="size"><option>Regular</option><option>Large</option><option>Share size</option></select></label><label>Topping<select name="topping"><option>No topping</option><option>Cookie crumble</option><option>Sprinkles</option><option>Chocolate sauce</option><option>Caramel drizzle</option></select></label><label>Quantity<input type="number" name="qty" min="1" max="99" value="1" required></label><button class="action">Save demo draft</button><small>This sample stays in your browser.</small></form>`;
  product.setAttribute('aria-label', name + ' sample enquiry');
  product.showModal();
  document.querySelector('#scoop').onsubmit = event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const ref = 'DEMO-' + Date.now().toString(36).toUpperCase();
    try {
      localStorage.setItem('eleeshas-showcase-' + ref, JSON.stringify({...data,name,ref}));
      detail.innerHTML = `<p class="eyebrow">MY ENQUIRIES · DEMO</p><h2>Draft saved.</h2><b>${ref}</b><p>${name} × ${data.qty}<br>${data.size} · ${data.topping}</p><b>Ask for price</b><p>Saved in this browser. The shop has not received this request.</p><button class="action">Back to flavours</button>`;
      detail.querySelector('button').onclick = () => product.close();
      detail.querySelector('button').focus();
    } catch { event.target.querySelector('small').textContent = 'Browser storage is unavailable. Your draft could not be saved.'; }
  };
}
cards.forEach(card => card.onclick = () => productView(card));
function showBoard(i) {
  boardIndex = (i + boards.length) % boards.length;
  const article = boards[boardIndex].closest('article');
  const title = article.querySelector('h3').textContent;
  const image = document.querySelector('#full');
  image.src = article.querySelector('a').href;
  image.alt = title;
  document.querySelector('#viewtitle').textContent = title;
  viewer.setAttribute('aria-label',title);
  if (!viewer.open) viewer.showModal();
}
boards.forEach((b,i) => b.onclick = () => showBoard(i));
document.querySelector('#prev').onclick = () => showBoard(boardIndex - 1);
document.querySelector('#next').onclick = () => showBoard(boardIndex + 1);
viewer.addEventListener('keydown',event => {
  if (event.key === 'ArrowLeft') showBoard(boardIndex - 1);
  if (event.key === 'ArrowRight') showBoard(boardIndex + 1);
});

const historyButton = document.createElement('button');
historyButton.className = 'action';
historyButton.textContent = 'My enquiries';
document.querySelector('#flavours .section-title p:last-child:not(.eyebrow)').after(historyButton);

function showDraftHistory() {
  detail.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = 'My enquiries';
  const note = document.createElement('p');
  note.textContent = 'Demo drafts saved in this browser. Staff receive an enquiry only through the connected prototype.';
  detail.append(title, note);
  const prefix = 'eleeshas-showcase-DEMO-';
  const records = [];
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith(prefix)) continue;
      try {
        const record = JSON.parse(localStorage.getItem(key));
        if (record && key === 'eleeshas-showcase-' + record.ref) records.push(record);
      } catch { continue; }
    }
    records.sort((a, b) => b.ref.localeCompare(a.ref));
    for (const record of records) {
      const row = document.createElement('article');
      const heading = document.createElement('h3');
      const summary = document.createElement('p');
      const reference = document.createElement('small');
      heading.textContent = record.name + ' × ' + record.qty;
      summary.textContent = [record.size, record.topping, 'Ask for price'].join(' · ');
      reference.textContent = record.ref;
      row.append(document.createElement('hr'), heading, summary, reference);
      detail.append(row);
    }
    if (!records.length) note.textContent = 'Choose a flavour and save a demo draft. Your reference and scoop choices will appear here.';
  } catch { note.textContent = 'Browser storage is unavailable.'; }
  product.setAttribute('aria-label', 'My enquiries');
  product.showModal();
}
historyButton.addEventListener('click', showDraftHistory);

