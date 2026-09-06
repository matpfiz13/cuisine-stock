'use strict';

const STORAGE_KEY = 'cuisineStock.v1';
const dayNames = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const mealSlots = [{key:'lunch',label:'Midi'},{key:'dinner',label:'Soir'}];

const seedState = {
  version: 1,
  weekStart: '2026-09-07',
  meals: [
    {lunch:{recipe:'Pâtes bolognaise',people:2,consumed:false},dinner:{recipe:'Salade César',people:2,consumed:false}},
    {lunch:{recipe:'Poulet curry',people:2,consumed:false},dinner:{recipe:'Croque-monsieur',people:2,consumed:false}},
    {lunch:{recipe:'Restes',people:2,consumed:false},dinner:{recipe:'Saumon / riz',people:2,consumed:false}},
    {lunch:{recipe:'Lasagnes',people:2,consumed:false},dinner:{recipe:'Omelette',people:2,consumed:false}},
    {lunch:{recipe:'',people:2,consumed:false},dinner:{recipe:'Pizza maison',people:2,consumed:false}},
    {lunch:{recipe:'Poulet rôti',people:2,consumed:false},dinner:{recipe:'Restes',people:2,consumed:false}},
    {lunch:{recipe:'Tartiflette',people:2,consumed:false},dinner:{recipe:'Soupe',people:2,consumed:false}}
  ],
  recipes: {
    'Pâtes bolognaise': {portions:2, ingredients:[['Pâtes',250,'g'],['Steak haché',250,'g'],['Sauce tomate',1,'pot'],['Oignon',1,'pièce']]},
    'Salade César': {portions:2, ingredients:[['Salade',1,'pièce'],['Poulet',250,'g'],['Parmesan',50,'g'],['Croûtons',100,'g']]},
    'Poulet curry': {portions:2, ingredients:[['Poulet',300,'g'],['Riz',200,'g'],['Lait de coco',1,'boîte'],['Curry',10,'g']]},
    'Croque-monsieur': {portions:2, ingredients:[['Pain de mie',8,'tranche'],['Jambon',4,'tranche'],['Fromage',4,'tranche']]},
    'Saumon / riz': {portions:2, ingredients:[['Saumon',300,'g'],['Riz',200,'g']]},
    'Lasagnes': {portions:2, ingredients:[['Pâtes à lasagnes',250,'g'],['Steak haché',400,'g'],['Sauce tomate',1,'pot'],['Fromage râpé',150,'g']]},
    'Omelette': {portions:2, ingredients:[['Œufs',6,'pièce'],['Fromage râpé',80,'g']]},
    'Pizza maison': {portions:2, ingredients:[['Farine',300,'g'],['Levure',1,'sachet'],['Sauce tomate',1,'pot'],['Mozzarella',2,'boule']]},
    'Poulet rôti': {portions:2, ingredients:[['Poulet entier',1,'pièce'],['Pommes de terre',800,'g']]},
    'Tartiflette': {portions:2, ingredients:[['Pommes de terre',1000,'g'],['Reblochon',1,'pièce'],['Lardons',200,'g'],['Oignon',2,'pièce']]},
    'Soupe': {portions:2, ingredients:[['Pommes de terre',400,'g'],['Carottes',400,'g'],['Poireaux',2,'pièce'],['Oignon',1,'pièce']]},
    'Restes': {portions:2, ingredients:[]}
  },
  stocks: {
    'Pâtes':['Féculents','g',1000,500], 'Riz':['Féculents','g',750,500], 'Poulet':['Viande','g',800,300],
    'Poulet entier':['Viande','pièce',1,1], 'Steak haché':['Viande','g',700,250], 'Saumon':['Poisson','g',500,300],
    'Jambon':['Charcuterie','tranche',8,4], 'Lardons':['Charcuterie','g',400,200], 'Sauce tomate':['Épicerie','pot',4,2],
    'Lait de coco':['Épicerie','boîte',2,1], 'Curry':['Épicerie','g',50,20], 'Œufs':['Frais','pièce',12,6],
    'Fromage râpé':['Frais','g',400,150], 'Fromage':['Frais','tranche',12,4], 'Mozzarella':['Frais','boule',3,2],
    'Parmesan':['Frais','g',150,50], 'Reblochon':['Frais','pièce',1,1], 'Pommes de terre':['Légumes','g',2500,1000],
    'Carottes':['Légumes','g',800,400], 'Poireaux':['Légumes','pièce',4,2], 'Oignon':['Légumes','pièce',8,3],
    'Salade':['Légumes','pièce',2,1], 'Croûtons':['Épicerie','g',200,100], 'Pain de mie':['Boulangerie','tranche',16,8],
    'Farine':['Épicerie','g',1000,500], 'Levure':['Épicerie','sachet',3,1], 'Pâtes à lasagnes':['Féculents','g',500,250]
  }
};

let state = loadState();
let activeScreen = 'home';
let stockFilter = 'Tous';
let stockQuery = '';
let recipeQuery = '';
let toastTimer = null;

const content = document.getElementById('content');
const screenTitle = document.getElementById('screenTitle');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const toastEl = document.getElementById('toast');
const importFile = document.getElementById('importFile');

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return clone(seedState);
    const parsed = JSON.parse(raw);
    if(!parsed || !parsed.meals || !parsed.recipes || !parsed.stocks) throw new Error('Données invalides');
    return parsed;
  }catch(e){ return clone(seedState); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function esc(s=''){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function fmtQty(n){
  const value = Math.round((Number(n)||0)*100)/100;
  return Number.isInteger(value) ? String(value) : value.toLocaleString('fr-FR',{maximumFractionDigits:2});
}
function dateFromISO(iso){ const [y,m,d]=iso.split('-').map(Number); return new Date(y,m-1,d,12); }
function isoFromDate(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function addDays(iso, days){ const d=dateFromISO(iso); d.setDate(d.getDate()+days); return isoFromDate(d); }
function prettyDate(iso, opts={day:'numeric',month:'short'}){ return dateFromISO(iso).toLocaleDateString('fr-FR',opts); }
function capitalize(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }
function currentDayIndex(){
  const today = new Date(); today.setHours(12,0,0,0);
  const start = dateFromISO(state.weekStart);
  const diff = Math.round((today-start)/86400000);
  return diff>=0 && diff<7 ? diff : -1;
}
function getRecipeNames(){ return Object.keys(state.recipes).sort((a,b)=>a.localeCompare(b,'fr')); }

function usageByStatus(status){
  const sums = {};
  state.meals.forEach(day => mealSlots.forEach(slot => {
    const meal = day[slot.key];
    if(!meal || !meal.recipe || !state.recipes[meal.recipe]) return;
    if(status==='consumed' && !meal.consumed) return;
    if(status==='future' && meal.consumed) return;
    const recipe = state.recipes[meal.recipe];
    const factor = (Number(meal.people)||0)/(Number(recipe.portions)||1);
    recipe.ingredients.forEach(([product,qty]) => sums[product]=(sums[product]||0)+(Number(qty)||0)*factor);
  }));
  return sums;
}
function stockRows(){
  const consumed = usageByStatus('consumed');
  const future = usageByStatus('future');
  return Object.entries(state.stocks).map(([product,data]) => {
    const [category,unit,base,min] = data;
    const actual = (Number(base)||0)-(consumed[product]||0);
    const need = future[product]||0;
    const projected = actual-need;
    const buy = Math.max(0, need+(Number(min)||0)-actual);
    return {product,category,unit,base:Number(base)||0,min:Number(min)||0,actual,need,projected,buy};
  }).sort((a,b)=>a.product.localeCompare(b.product,'fr'));
}
function ensureIngredientStocks(){
  Object.values(state.recipes).forEach(r=>r.ingredients.forEach(([product,qty,unit])=>{
    if(!state.stocks[product]) state.stocks[product]=['Autre',unit||'unité',0,0];
  }));
}
function summary(){
  const allMeals = state.meals.flatMap(d=>mealSlots.map(s=>d[s.key]));
  const planned = allMeals.filter(m=>m.recipe).length;
  const consumed = allMeals.filter(m=>m.recipe && m.consumed).length;
  const rows = stockRows();
  return {planned,consumed,toBuy:rows.filter(r=>r.buy>0.0001).length,low:rows.filter(r=>r.projected<r.min-0.0001).length};
}
function stockClass(row){
  if(row.projected < 0) return 'danger';
  if(row.projected < row.min) return 'warn';
  return 'ok';
}
function stockProgress(row){
  const target = Math.max(row.min*2, row.need+row.min, 1);
  return Math.max(0, Math.min(100,(row.actual/target)*100));
}
function showToast(msg){
  clearTimeout(toastTimer); toastEl.textContent=msg; toastEl.classList.remove('hidden');
  toastTimer=setTimeout(()=>toastEl.classList.add('hidden'),2200);
}
function openModal(title, html){ modalTitle.textContent=title; modalBody.innerHTML=html; modal.classList.remove('hidden'); }
function closeModal(){ modal.classList.add('hidden'); modalBody.innerHTML=''; }
function navTo(screen){
  activeScreen=screen;
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.screen===screen));
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}
function render(){
  const titles={home:'Accueil',week:'Semaine',stocks:'Stocks',recipes:'Recettes',shopping:'Courses'};
  screenTitle.textContent=titles[activeScreen]||'Cuisine Stock';
  content.innerHTML = activeScreen==='home' ? renderHome() : activeScreen==='week' ? renderWeek() : activeScreen==='stocks' ? renderStocks() : activeScreen==='recipes' ? renderRecipes() : renderShopping();
  bindScreenEvents();
}

function renderHome(){
  const s=summary();
  const todayIndex=currentDayIndex();
  const focusIndex=todayIndex>=0?todayIndex:0;
  const todayMeals=state.meals[focusIndex];
  const focusLabel=todayIndex>=0?"Aujourd’hui":dayNames[0];
  const buyRows=stockRows().filter(r=>r.buy>0.0001).sort((a,b)=>b.buy-a.buy).slice(0,4);
  return `
    <section class="hero">
      <div class="kicker">Semaine du ${prettyDate(state.weekStart,{day:'numeric',month:'long'})}</div>
      <h2>Tout ce qu’il faut pour cuisiner, sans perdre le fil.</h2>
      <p>Planifie les repas, valide ce qui a été mangé et laisse l’appli calculer les stocks et les courses.</p>
      <div class="hero-actions"><button class="btn hero-btn" data-go="week">Planifier la semaine</button><button class="btn hero-btn" id="installHelpBtn">Installer sur iPhone</button></div>
    </section>
    <section class="grid-2">
      <div class="stat-card"><div class="stat-icon">▦</div><div class="stat-value">${s.planned}</div><div class="stat-label">repas planifiés</div></div>
      <div class="stat-card"><div class="stat-icon">✓</div><div class="stat-value">${s.consumed}</div><div class="stat-label">repas consommés</div></div>
      <div class="stat-card"><div class="stat-icon">◫</div><div class="stat-value">${s.toBuy}</div><div class="stat-label">produits à acheter</div></div>
      <div class="stat-card"><div class="stat-icon">!</div><div class="stat-value">${s.low}</div><div class="stat-label">stocks sous le minimum</div></div>
    </section>
    <section class="section">
      <div class="section-head"><div><h2>${focusLabel}</h2><p>${prettyDate(addDays(state.weekStart,focusIndex),{weekday:'long',day:'numeric',month:'long'})}</p></div><button class="btn small secondary" data-go="week">Modifier</button></div>
      <div class="card">
        ${mealSlots.map(slot=>{const m=todayMeals[slot.key];return `<div class="meal-mini"><div><strong>${esc(m.recipe||'À définir')}</strong><small>${slot.label} · ${m.people} pers.</small></div>${m.recipe?`<span class="badge ${m.consumed?'ok':''}">${m.consumed?'✓ Mangé':'Prévu'}</span>`:''}</div>`}).join('')}
      </div>
    </section>
    <section class="section">
      <div class="section-head"><div><h2>À acheter en priorité</h2><p>Selon les repas et le stock mini</p></div><button class="btn small secondary" data-go="shopping">Voir tout</button></div>
      ${buyRows.length?`<div class="card">${buyRows.map(r=>`<div class="meal-mini"><div><strong>${esc(r.product)}</strong><small>${esc(r.category)}</small></div><span class="badge warn">${fmtQty(r.buy)} ${esc(r.unit)}</span></div>`).join('')}</div>`:`<div class="empty"><div class="emoji">✓</div><strong>Rien à acheter</strong>Les stocks couvrent les repas prévus.</div>`}
    </section>`;
}

function recipeOptions(selected){
  return `<option value="">À définir</option>${getRecipeNames().map(name=>`<option value="${esc(name)}" ${name===selected?'selected':''}>${esc(name)}</option>`).join('')}`;
}
function renderWeek(){
  const end=addDays(state.weekStart,6); const todayIdx=currentDayIndex();
  return `
    <div class="week-toolbar"><div><div class="week-range">${prettyDate(state.weekStart,{day:'numeric',month:'short'})} → ${prettyDate(end,{day:'numeric',month:'short',year:'numeric'})}</div><div class="week-sub">Le stock réel ne bouge que quand “Mangé” est activé.</div></div><button class="btn small secondary" id="changeWeekBtn">Changer</button></div>
    ${state.meals.map((day,i)=>`<section class="day-card ${i===todayIdx?'today':''}">
      <div class="day-head"><div class="day-name">${dayNames[i]}</div><div class="day-date">${prettyDate(addDays(state.weekStart,i),{day:'numeric',month:'long'})}${i===todayIdx?' · Aujourd’hui':''}</div></div>
      ${mealSlots.map(slot=>{const m=day[slot.key];return `<div class="meal-row"><div class="meal-label">${slot.label}</div><div class="meal-controls"><select class="select meal-select" data-day="${i}" data-slot="${slot.key}">${recipeOptions(m.recipe)}</select><input class="people-input" type="number" inputmode="numeric" min="1" max="20" data-day="${i}" data-slot="${slot.key}" value="${Number(m.people)||2}" aria-label="Nombre de personnes"></div><div class="meal-actions"><span class="badge ${m.recipe?'':'warn'}">${m.recipe?`${Number(m.people)||2} pers.`:'À planifier'}</span><label class="toggle">Mangé <input class="consumed-toggle" type="checkbox" data-day="${i}" data-slot="${slot.key}" ${m.consumed?'checked':''} ${!m.recipe?'disabled':''}></label></div></div>`}).join('')}
    </section>`).join('')}`;
}

function renderStocks(){
  const rows=stockRows();
  const cats=['Tous',...new Set(rows.map(r=>r.category))];
  const filtered=rows.filter(r=>(stockFilter==='Tous'||r.category===stockFilter)&&(!stockQuery||r.product.toLowerCase().includes(stockQuery.toLowerCase())));
  return `
    <div class="searchbar"><input id="stockSearch" type="text" placeholder="Rechercher un produit…" value="${esc(stockQuery)}"></div>
    <div class="filter-row">${cats.map(c=>`<button class="chip ${c===stockFilter?'active':''}" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    ${filtered.length?filtered.map(r=>`<article class="stock-card">
      <div><div class="stock-title">${esc(r.product)}</div><div class="stock-meta">${esc(r.category)} · ${esc(r.unit)}</div>
      <div class="stock-numbers"><div class="stock-num"><small>Réel</small><strong>${fmtQty(r.actual)} ${esc(r.unit)}</strong></div><div class="stock-num"><small>Après menus</small><strong>${fmtQty(r.projected)}</strong></div><div class="stock-num"><small>Mini</small><strong>${fmtQty(r.min)}</strong></div></div>
      <div class="progress"><span class="${stockClass(r)==='danger'?'critical':stockClass(r)==='warn'?'low':''}" style="width:${stockProgress(r)}%"></span></div></div>
      <div class="stock-actions"><button class="round-btn" data-stock-add="${esc(r.product)}" aria-label="Ajouter du stock">+</button><button class="round-btn" data-stock-edit="${esc(r.product)}" aria-label="Modifier">⋯</button></div>
    </article>`).join(''):`<div class="empty"><div class="emoji">⌕</div><strong>Aucun produit</strong>Essaie une autre recherche.</div>`}
    <button class="fab" id="addStockBtn" aria-label="Ajouter un produit">+</button>`;
}

function renderRecipes(){
  const names=getRecipeNames().filter(n=>n!=='Restes'&&(!recipeQuery||n.toLowerCase().includes(recipeQuery.toLowerCase())));
  return `<div class="searchbar"><input id="recipeSearch" type="text" placeholder="Rechercher une recette…" value="${esc(recipeQuery)}"></div>
    ${names.length?names.map(name=>{const r=state.recipes[name];return `<article class="recipe-card"><div class="recipe-head"><div><div class="recipe-title">${esc(name)}</div><div class="recipe-meta">Base ${r.portions} personnes · ${r.ingredients.length} ingrédients</div></div><button class="btn small secondary" data-recipe-edit="${esc(name)}">Modifier</button></div><ul class="ingredient-list">${r.ingredients.map(([p,q,u])=>`<li><span>${esc(p)}</span><span>${fmtQty(q)} ${esc(u)}</span></li>`).join('')}</ul></article>`}).join(''):`<div class="empty"><div class="emoji">♨</div><strong>Aucune recette</strong>Ajoute ton premier plat.</div>`}
    <button class="fab" id="addRecipeBtn" aria-label="Ajouter une recette">+</button>`;
}

function renderShopping(){
  const rows=stockRows().filter(r=>r.buy>0.0001).sort((a,b)=>a.category.localeCompare(b.category,'fr')||a.product.localeCompare(b.product,'fr'));
  const totalItems=rows.length;
  return `<div class="notice">La quantité proposée garde ton <strong>stock minimum</strong> après tous les repas encore prévus.</div>
    <div class="section-head"><div><h2>${totalItems} produit${totalItems>1?'s':''}</h2><p>Liste générée automatiquement</p></div>${rows.length?'<button class="btn small" id="buyAllBtn">Tout ajouter au stock</button>':''}</div>
    ${rows.length?rows.map(r=>`<article class="shopping-card"><div><strong>${esc(r.product)}</strong><small>${esc(r.category)} · stock réel ${fmtQty(r.actual)} ${esc(r.unit)}</small></div><div><div class="shopping-qty">${fmtQty(r.buy)} ${esc(r.unit)}</div><button class="btn small secondary" data-buy-one="${esc(r.product)}">Acheté ✓</button></div></article>`).join(''):`<div class="empty"><div class="emoji">✓</div><strong>Liste vide</strong>Tu as assez de stock pour les menus planifiés et la réserve minimum.</div>`}`;
}

function bindScreenEvents(){
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.go)));
  const install=document.getElementById('installHelpBtn'); if(install) install.addEventListener('click',showInstallHelp);
  if(activeScreen==='week') bindWeek();
  if(activeScreen==='stocks') bindStocks();
  if(activeScreen==='recipes') bindRecipes();
  if(activeScreen==='shopping') bindShopping();
}
function bindWeek(){
  document.querySelectorAll('.meal-select').forEach(el=>el.addEventListener('change',e=>{
    const m=state.meals[+e.target.dataset.day][e.target.dataset.slot]; m.recipe=e.target.value; if(!m.recipe)m.consumed=false; saveState(); render();
  }));
  document.querySelectorAll('.people-input').forEach(el=>el.addEventListener('change',e=>{
    state.meals[+e.target.dataset.day][e.target.dataset.slot].people=Math.max(1,Math.min(20,Number(e.target.value)||2)); saveState(); render();
  }));
  document.querySelectorAll('.consumed-toggle').forEach(el=>el.addEventListener('change',e=>{
    state.meals[+e.target.dataset.day][e.target.dataset.slot].consumed=e.target.checked; saveState(); render(); showToast(e.target.checked?'Repas décompté du stock':'Repas remis en prévision');
  }));
  document.getElementById('changeWeekBtn').addEventListener('click',()=>openModal('Changer de semaine',`<div class="field"><label>Lundi de la semaine</label><input id="weekDateInput" type="date" value="${state.weekStart}"></div><div class="notice warn">Changer la date conserve les plats actuels. Tu peux ensuite les remplacer pour la nouvelle semaine.</div><div class="modal-actions"><button class="btn secondary" id="clearWeekBtn">Vider les menus</button><button class="btn" id="saveWeekBtn">Enregistrer</button></div>`));
}
function bindStocks(){
  const search=document.getElementById('stockSearch'); search.addEventListener('input',e=>{stockQuery=e.target.value; render(); const input=document.getElementById('stockSearch'); input.focus(); input.setSelectionRange(input.value.length,input.value.length);});
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{stockFilter=b.dataset.filter;render();}));
  document.querySelectorAll('[data-stock-add]').forEach(b=>b.addEventListener('click',()=>stockAddModal(b.dataset.stockAdd)));
  document.querySelectorAll('[data-stock-edit]').forEach(b=>b.addEventListener('click',()=>stockEditModal(b.dataset.stockEdit)));
  document.getElementById('addStockBtn').addEventListener('click',()=>stockEditModal(''));
}
function bindRecipes(){
  const search=document.getElementById('recipeSearch'); search.addEventListener('input',e=>{recipeQuery=e.target.value; render(); const input=document.getElementById('recipeSearch'); input.focus(); input.setSelectionRange(input.value.length,input.value.length);});
  document.querySelectorAll('[data-recipe-edit]').forEach(b=>b.addEventListener('click',()=>recipeModal(b.dataset.recipeEdit)));
  document.getElementById('addRecipeBtn').addEventListener('click',()=>recipeModal(''));
}
function bindShopping(){
  document.querySelectorAll('[data-buy-one]').forEach(b=>b.addEventListener('click',()=>buyProduct(b.dataset.buyOne)));
  const all=document.getElementById('buyAllBtn'); if(all) all.addEventListener('click',()=>{stockRows().filter(r=>r.buy>0.0001).forEach(r=>state.stocks[r.product][2]+=r.buy);saveState();render();showToast('Courses ajoutées au stock');});
}

function stockAddModal(product){
  const row=stockRows().find(r=>r.product===product); if(!row)return;
  openModal(`Ajouter · ${product}`,`<div class="field"><label>Quantité achetée / ajoutée (${esc(row.unit)})</label><input id="stockAddQty" type="number" inputmode="decimal" min="0" step="any" placeholder="0"></div><div class="modal-actions"><button class="btn secondary" id="cancelStockAdd">Annuler</button><button class="btn" id="confirmStockAdd">Ajouter au stock</button></div>`);
  setTimeout(()=>document.getElementById('stockAddQty')?.focus(),50);
}
function stockEditModal(product){
  const existing=product?state.stocks[product]:['Autre','unité',0,0];
  openModal(product?'Modifier le produit':'Nouveau produit',`<div class="field"><label>Produit</label><input id="stockName" type="text" value="${esc(product)}" ${product?'readonly':''}></div><div class="form-grid"><div class="field"><label>Catégorie</label><input id="stockCategory" type="text" value="${esc(existing[0])}"></div><div class="field"><label>Unité</label><input id="stockUnit" type="text" value="${esc(existing[1])}"></div></div><div class="form-grid"><div class="field"><label>Stock de référence</label><input id="stockBase" type="number" step="any" value="${existing[2]}"></div><div class="field"><label>Stock minimum</label><input id="stockMin" type="number" step="any" value="${existing[3]}"></div></div><div class="modal-actions">${product?'<button class="btn danger" id="deleteStockBtn">Supprimer</button>':'<button class="btn secondary" id="cancelStockEdit">Annuler</button>'}<button class="btn" id="saveStockBtn">Enregistrer</button></div>`);
}
function buyProduct(product){
  const row=stockRows().find(r=>r.product===product); if(!row||row.buy<=0)return;
  state.stocks[product][2]+=row.buy; saveState(); render(); showToast(`${product} ajouté au stock`);
}

function ingredientEditorRow(item=['',0,'g']){
  return `<div class="ingredient-editor"><div class="field"><label>Ingrédient</label><input class="ing-name" type="text" value="${esc(item[0])}" placeholder="Ex. Pâtes"></div><div class="form-grid"><div class="field"><label>Quantité</label><input class="ing-qty" type="number" step="any" min="0" value="${item[1]||''}"></div><div class="field"><label>Unité</label><input class="ing-unit" type="text" value="${esc(item[2]||'g')}"></div></div><button class="remove-line" type="button">Supprimer cet ingrédient</button></div>`;
}
function recipeModal(name){
  const recipe=name?state.recipes[name]:{portions:2,ingredients:[['',0,'g']]};
  openModal(name?'Modifier la recette':'Nouvelle recette',`<div class="field"><label>Nom du plat</label><input id="recipeName" type="text" value="${esc(name)}" ${name==='Restes'?'readonly':''}></div><div class="field"><label>Nombre de portions de référence</label><input id="recipePortions" type="number" min="1" max="20" value="${recipe.portions||2}"></div><div class="separator"></div><div class="section-head"><div><h2>Ingrédients</h2><p>Quantités pour les portions ci-dessus</p></div><button class="btn small secondary" id="addIngredientLine">+ Ingrédient</button></div><div id="ingredientsEditor">${recipe.ingredients.map(ingredientEditorRow).join('')}</div><div class="modal-actions">${name&&name!=='Restes'?'<button class="btn danger" id="deleteRecipeBtn">Supprimer</button>':'<button class="btn secondary" id="cancelRecipeBtn">Annuler</button>'}<button class="btn" id="saveRecipeBtn">Enregistrer</button></div>`);
  bindIngredientRemove();
}
function bindIngredientRemove(){ document.querySelectorAll('.remove-line').forEach(b=>b.onclick=()=>b.closest('.ingredient-editor').remove()); }
function collectRecipeIngredients(){
  return [...document.querySelectorAll('.ingredient-editor')].map(row=>[row.querySelector('.ing-name').value.trim(),Number(row.querySelector('.ing-qty').value)||0,row.querySelector('.ing-unit').value.trim()||'unité']).filter(i=>i[0]&&i[1]>0);
}

function showInstallHelp(){
  openModal('Installer sur l’iPhone',`<div class="notice"><strong>Une fois la PWA mise en ligne en HTTPS</strong>, elle peut s’ouvrir en plein écran comme une app et fonctionner hors ligne après la première ouverture.</div><ol class="install-steps"><li>Ouvre l’adresse de l’appli dans <strong>Safari</strong>.</li><li>Touche <strong>Partager</strong> puis <strong>Sur l’écran d’accueil</strong>.</li><li>Active <strong>Ouvrir comme app web</strong>.</li><li>Touche <strong>Ajouter</strong>. L’icône Cuisine Stock apparaît sur l’écran d’accueil.</li></ol>`);
}
function showSettings(){
  openModal('Données & réglages',`<div class="settings-list"><div class="settings-row"><div><strong>Exporter une sauvegarde</strong><small>Télécharge menus, recettes et stocks dans un fichier JSON.</small></div><button class="btn small secondary" id="exportBtn">Exporter</button></div><div class="settings-row"><div><strong>Restaurer une sauvegarde</strong><small>Réimporte un fichier JSON précédemment exporté.</small></div><button class="btn small secondary" id="importBtn">Importer</button></div><div class="settings-row"><div><strong>Installation iPhone</strong><small>Afficher les étapes pour l’ajouter à l’écran d’accueil.</small></div><button class="btn small secondary" id="installSettingsBtn">Voir</button></div><div class="settings-row"><div><strong>Réinitialiser la démo</strong><small>Remet les menus et stocks de la première version Excel.</small></div><button class="btn small danger" id="resetBtn">Réinitialiser</button></div></div>`);
}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`cuisine-stock-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); showToast('Sauvegarde exportée');
}

// Global navigation / modal actions

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.screen)));
document.getElementById('settingsBtn').addEventListener('click',showSettings);
document.getElementById('closeModalBtn').addEventListener('click',closeModal);
modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});

modalBody.addEventListener('click',e=>{
  if(e.target.id==='saveWeekBtn'){
    const iso=document.getElementById('weekDateInput').value; if(iso){state.weekStart=iso;saveState();closeModal();render();}
  }
  if(e.target.id==='clearWeekBtn'){
    state.meals=Array.from({length:7},()=>({lunch:{recipe:'',people:2,consumed:false},dinner:{recipe:'',people:2,consumed:false}}));saveState();closeModal();render();showToast('Menus vidés');
  }
  if(e.target.id==='cancelStockAdd'||e.target.id==='cancelStockEdit'||e.target.id==='cancelRecipeBtn') closeModal();
  if(e.target.id==='confirmStockAdd'){
    const qty=Math.max(0,Number(document.getElementById('stockAddQty').value)||0); const title=modalTitle.textContent; const product=title.replace('Ajouter · ',''); if(qty>0&&state.stocks[product]){state.stocks[product][2]+=qty;saveState();closeModal();render();showToast('Stock mis à jour');}
  }
  if(e.target.id==='saveStockBtn'){
    const name=document.getElementById('stockName').value.trim(); if(!name){showToast('Indique un nom de produit');return;}
    state.stocks[name]=[document.getElementById('stockCategory').value.trim()||'Autre',document.getElementById('stockUnit').value.trim()||'unité',Math.max(0,Number(document.getElementById('stockBase').value)||0),Math.max(0,Number(document.getElementById('stockMin').value)||0)]; saveState();closeModal();render();showToast('Produit enregistré');
  }
  if(e.target.id==='deleteStockBtn'){
    const name=document.getElementById('stockName').value.trim(); delete state.stocks[name];saveState();closeModal();render();showToast('Produit supprimé');
  }
  if(e.target.id==='addIngredientLine'){
    document.getElementById('ingredientsEditor').insertAdjacentHTML('beforeend',ingredientEditorRow());bindIngredientRemove();
  }
  if(e.target.id==='saveRecipeBtn'){
    const input=document.getElementById('recipeName'); const newName=input.value.trim(); if(!newName){showToast('Indique un nom de recette');return;}
    const oldName = modalTitle.textContent==='Modifier la recette' ? [...Object.keys(state.recipes)].find(n=>n===input.defaultValue) : '';
    const ingredients=collectRecipeIngredients(); const portions=Math.max(1,Number(document.getElementById('recipePortions').value)||2);
    if(oldName && oldName!==newName){ delete state.recipes[oldName]; state.meals.forEach(d=>mealSlots.forEach(s=>{if(d[s.key].recipe===oldName)d[s.key].recipe=newName;})); }
    state.recipes[newName]={portions,ingredients};ensureIngredientStocks();saveState();closeModal();render();showToast('Recette enregistrée');
  }
  if(e.target.id==='deleteRecipeBtn'){
    const name=document.getElementById('recipeName').value.trim(); delete state.recipes[name]; state.meals.forEach(d=>mealSlots.forEach(s=>{if(d[s.key].recipe===name){d[s.key].recipe='';d[s.key].consumed=false;}})); saveState();closeModal();render();showToast('Recette supprimée');
  }
  if(e.target.id==='exportBtn') exportData();
  if(e.target.id==='importBtn') importFile.click();
  if(e.target.id==='installSettingsBtn'){closeModal();setTimeout(showInstallHelp,100);}
  if(e.target.id==='resetBtn'){
    state=clone(seedState);saveState();closeModal();render();showToast('Données de démonstration restaurées');
  }
});

importFile.addEventListener('change',async e=>{
  const file=e.target.files?.[0]; if(!file)return;
  try{const parsed=JSON.parse(await file.text()); if(!parsed.meals||!parsed.recipes||!parsed.stocks)throw new Error(); state=parsed;ensureIngredientStocks();saveState();closeModal();render();showToast('Sauvegarde restaurée');}catch(err){showToast('Fichier de sauvegarde invalide');}
  e.target.value='';
});

if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
ensureIngredientStocks();saveState();render();
