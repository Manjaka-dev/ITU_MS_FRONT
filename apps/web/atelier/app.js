import {api as shopApi, addToCart as shopAddToCart, money as shopMoney} from '/shared.js?v=20261101c';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const state = {template: 'heritage', color: 'bone', size: 'M', side: 'front',
  svg: '', filename: 'Illustration d’origine', scale: 100, horizontal: 50, vertical: 50};
let garmentColors = {};
let result = null, approved = null, revision = 0, timer = null, previewUrl = null, busy = false;
const labels = {heritage: 'Heritage', blueprint: 'Blueprint', bone: 'Blanc cassé', navy: 'Bleu nuit'};

function showError(message = '') {
  $('#error').textContent = message;
  $('#error').hidden = !message;
}
function setBusy(value) {
  busy = value;
  document.body.classList.toggle('is-busy', value);
  $('#approve').disabled = value || !result;
}
function invalidate() {
  clearTimeout(timer);
  revision++;
  result = null;
  approved = null;
  $('#approval-dialog').close();
  setBusy(true);
  return revision;
}
function paintShirt(svg, garment) {
  const front = garment.side === 'front';
  const palette = garmentColors[garment.color];
  if (!palette) return;
  const dark = palette.dark;
  const rgb = palette.hex.match(/[a-f0-9]{2}/gi).map(value => parseInt(value,16));
  const shade = ratio => '#' + rgb.map(value => Math.max(0,Math.min(255,Math.round(value*ratio))).toString(16).padStart(2,'0')).join('');
  const find = selector => svg.querySelector(selector);
  svg.classList.toggle('navy-shirt', dark);
  const colors = [.78,.96,1.12,.95,.76].map(shade);
  svg.querySelectorAll('#fabric stop').forEach((stop, i) => stop.setAttribute('stop-color', colors[i]));
  const outline = `M264 76 Q350 ${front ? 126 : 101} 436 76 C460 81 484 91 511 100 L558 117 Q573 125 582 142 L654 268 Q657 274 651 278 L559 326 Q552 329 547 321 L526 284 C525 397 527 547 536 708 Q535 719 522 721 Q350 740 178 721 Q165 719 164 708 C173 547 175 397 174 284 L153 321 Q148 329 141 326 L49 278 Q43 274 46 268 L118 142 Q127 125 142 117 L189 100 Q230 83 264 76 Z`;
  find('#shirt-body').setAttribute('d', outline);
  find('#shirt-outline').setAttribute('d', outline);
  find('#shirt-body').setAttribute('stroke', shade(.72));
  find('#neck-inner').setAttribute('fill', shade(.63));
  find('#neck-inner').setAttribute('visibility', front ? 'visible' : 'hidden');
  find('#collar').setAttribute('d', front ? 'M264 76 Q350 126 436 76 L429 91 Q350 145 271 91Z' : 'M264 76 Q350 101 436 76 L431 89 Q350 116 269 89Z');
  find('#collar').setAttribute('fill', shade(.88));
  find('#collar').setAttribute('stroke', shade(.69));
  find('#collar-stitch').setAttribute('d', front ? 'M269 83 Q350 135 431 83' : 'M269 83 Q350 108 431 83');
  find('#collar-stitch').setAttribute('opacity', dark ? '.12' : '.35');
  find('#fabric-light stop').setAttribute('stop-opacity', dark ? '.08' : '.36');
  svg.querySelectorAll('path[fill="url(#fold-light)"]').forEach(el => el.setAttribute('opacity', dark ? '.18' : '.45'));
  for (const image of svg.querySelectorAll('#chest-logo,#back-symbol')) {
    image.setAttribute('style', dark ? 'filter:invert(1);mix-blend-mode:screen' : 'mix-blend-mode:multiply');
  }
}
function renderShirt() {
  const heritage = state.template === 'heritage';
  const onPrintSide = state.side === (heritage ? 'front' : 'back');
  paintShirt($('#shirt'), state);
  $('#shirt-title').textContent = `Aperçu du t-shirt ${labels[state.template]}, ${state.side === 'front' ? 'devant' : 'dos'}`;
  $('#chest-logo').setAttribute('visibility', state.side === 'front' ? 'visible' : 'hidden');
  for (const [key, value] of Object.entries(heritage ? {x: 275, y: 177, width: 150, height: 85} : {x: 375, y: 185, width: 112, height: 63})) $('#chest-logo').setAttribute(key, value);
  $('#back-symbol').setAttribute('visibility', heritage && state.side === 'back' ? 'visible' : 'hidden');
  const rect = heritage ? {x: 181, y: 452, width: 338, height: 224} : {x: 191, y: 264, width: 318, height: 214};
  for (const target of ['#print', '#print-zone']) for (const [key, value] of Object.entries(rect)) $(target).setAttribute(key, value);
  $('#print').setAttribute('visibility', onPrintSide ? 'visible' : 'hidden');
  $('#print-zone').setAttribute('visibility', onPrintSide && $('#zone-toggle').getAttribute('aria-pressed') === 'true' ? 'visible' : 'hidden');
  $('#front').setAttribute('aria-pressed', String(state.side === 'front'));
  $('#back').setAttribute('aria-pressed', String(state.side === 'back'));
  $('#view-label').textContent = state.side === 'front' ? 'VUE DE FACE' : 'VUE DE DOS';
  $('#preview-template').textContent = heritage ? 'HERITAGE' : 'BLUEPRINT';
  $('#dimensions').textContent = heritage ? '30 × 19,9 cm' : '34 × 22,9 cm';
  $('#color-label').textContent = labels[state.color];
  $$('.swatch').forEach(el => { el.classList.toggle('active', el.dataset.color === state.color); el.setAttribute('aria-pressed', String(el.dataset.color === state.color)); });
  $$('[data-size]').forEach(el => { el.classList.toggle('active', el.dataset.size === state.size); el.setAttribute('aria-pressed', String(el.dataset.size === state.size)); });
  $$('.template-card').forEach(el => { el.classList.toggle('selected', el.dataset.template === state.template); el.setAttribute('aria-pressed', String(el.dataset.template === state.template)); });
}
async function composeAt(current) {
  if (!state.svg) return;
  const payload = {svg: state.svg, template: state.template, scale: state.scale, horizontal: state.horizontal, vertical: state.vertical};
  try {
    const response = await fetch('/api/compose', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
    const data = await response.json();
    if (current !== revision) return;
    if (!response.ok) throw new Error(data.error || 'Le fichier n’a pas pu être vérifié.');
    result = data;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(new Blob([result.svg], {type: 'image/svg+xml'}));
    $('#print').setAttribute('href', previewUrl);
    $('#file-label').textContent = state.filename;
    $('#restore').hidden = state.filename === 'Illustration d’origine';
    showError();
    setBusy(false);
    renderShirt();
  } catch (error) {
    if (current !== revision) return;
    result = null;
    $('#print').removeAttribute('href');
    $('#file-label').textContent = 'Fichier non accepté';
    showError(error.message === 'Failed to fetch' ? 'Le serveur est inaccessible. Relancez le prototype puis réessayez.' : error.message);
    setBusy(false);
  }
}
function scheduleComposition() {
  const current = invalidate();
  clearTimeout(timer);
  timer = setTimeout(() => composeAt(current), 110);
}
async function useSource(text, name) {
  state.svg = text;
  state.filename = name;
  state.side = state.template === 'heritage' ? 'front' : 'back';
  resetSettings();
  renderShirt();
  const current = invalidate();
  clearTimeout(timer);
  await composeAt(current);
}
async function loadOriginal() {
  const current = invalidate();
  clearTimeout(timer);
  try {
    const response = await fetch(`/assets/configurator/${state.template}-original.svg`);
    if (!response.ok) throw new Error('Illustration d’origine indisponible.');
    const svg = await response.text();
    if (current !== revision) return;
    await useSource(svg, 'Illustration d’origine');
  } catch (error) {
    if (current !== revision) return;
    setBusy(false); showError(error.message);
  }
}
function resetSettings() {
  for (const [key, value] of Object.entries({scale: 100, horizontal: 50, vertical: 50})) {
    state[key] = value; $(`#${key}`).value = value; $(`#${key}-value`).textContent = `${value} %`;
  }
}
async function importFile(file) {
  if (!file) return;
  // Invalider immédiatement l'ancien visuel, même si le nouveau fichier est refusé.
  const current = invalidate();
  clearTimeout(timer);
  $('#print').removeAttribute('href');
  if (!file.name.toLowerCase().endsWith('.svg') || file.size > 1_000_000) {
    state.svg = ''; $('#file-label').textContent = 'Fichier non accepté';
    showError('Choisissez un fichier .svg de moins de 1 Mo.'); setBusy(false); return;
  }
  try {
    const text = await file.text();
    if (current !== revision) return;
    await useSource(text, file.name);
  } catch { if (current === revision) { showError('Impossible de lire ce fichier.'); setBusy(false); } }
}
$('#svg-file').addEventListener('change', event => { importFile(event.target.files[0]); event.target.value = ''; });
for (const name of ['dragover', 'dragenter']) $('#drop-zone').addEventListener(name, event => { event.preventDefault(); $('#drop-zone').classList.add('dragging'); });
for (const name of ['dragleave', 'drop']) $('#drop-zone').addEventListener(name, event => { event.preventDefault(); $('#drop-zone').classList.remove('dragging'); });
$('#drop-zone').addEventListener('drop', event => importFile(event.dataTransfer.files[0]));
$('#try-sample').addEventListener('click', async () => {
  const current = invalidate();
  try {
    const response = await fetch('/assets/configurator/coupe-exemple.svg');
    if (!response.ok) throw new Error('Exemple indisponible.');
    const text = await response.text();
    if (current === revision) await useSource(text, 'Coupé de démonstration');
  } catch (error) { if (current === revision) { showError(error.message); setBusy(false); } }
});
$('#restore').addEventListener('click', loadOriginal);
$$('.template-card').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.template === state.template) return;
  const wasOriginal = state.filename === 'Illustration d’origine';
  state.template = button.dataset.template;
  state.side = state.template === 'heritage' ? 'front' : 'back';
  state.color = state.template === 'heritage' ? 'bone' : 'black';
  renderShirt();
  if (wasOriginal || !state.svg) loadOriginal(); else scheduleComposition();
}));
for (const side of ['front', 'back']) $(`#${side}`).addEventListener('click', () => { state.side = side; renderShirt(); });
$('#zone-toggle').addEventListener('click', () => { const button = $('#zone-toggle'); button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true')); renderShirt(); });
for (const key of ['scale', 'horizontal', 'vertical']) $(`#${key}`).addEventListener('input', event => {
  state[key] = Number(event.target.value); $(`#${key}-value`).textContent = `${state[key]} %`; scheduleComposition();
});
$('#reset').addEventListener('click', () => { resetSettings(); scheduleComposition(); });
$$('.swatch').forEach(button => button.addEventListener('click', () => { state.color = button.dataset.color; approved = null; renderShirt(); }));
$$('[data-size]').forEach(button => button.addEventListener('click', () => { state.size = button.dataset.size; approved = null; renderShirt(); }));

function download(content, type, filename) {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], {type}));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
$('#approve').addEventListener('click', () => {
  if (!result || busy) return;
  // Conserver la même composition et la même version pour tous les exports.
  approved = {result, state: {...state}, revision};
  $('#approved-print').src = previewUrl;
  $('.approved-preview').classList.toggle('navy', Boolean(garmentColors[state.color]?.dark));
  $('#recap').replaceChildren();
  for (const [label, value] of Object.entries({Modèle: labels[state.template], Vêtement: `${labels[state.color]} · ${state.size}`})) {
    const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = value;
    $('#recap').append(dt, dd);
  }
  $('#export-error').hidden = true;
  $('#approval-dialog').showModal();
});
$('#export-svg').addEventListener('click', () => {
  if (approved?.revision !== revision) return;
  download(approved.result.svg, 'image/svg+xml', `itums-${approved.state.template}-motif.svg`);
});
$('#export-json').addEventListener('click', () => {
  if (approved?.revision !== revision) return;
  const {result: saved, state: chosen} = approved;
  download(JSON.stringify({version: 1, prototype: true, createdAt: new Date().toISOString(), template: chosen.template,
    color: chosen.color, size: chosen.size, filename: chosen.filename, settings: saved.settings,
    sourceSvg: saved.normalized, sourceHash: saved.sourceHash, printSvg: saved.svg, printHash: saved.sha256,
    widthMm: saved.template.widthMm, heightMm: saved.template.heightMm}, null, 2), 'application/json', `itums-${chosen.template}-composition.json`);
});
$('#export-png').addEventListener('click', async () => {
  if (approved?.revision !== revision) return;
  const button = $('#export-png'); button.disabled = true;
  const currentApproval = approved;
  try {
    const clone = $('#shirt').cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', '1400'); clone.setAttribute('height', '1600');
    const heritage = currentApproval.state.template === 'heritage';
    const dark = Boolean(garmentColors[currentApproval.state.color]?.dark);
    paintShirt(clone, {...currentApproval.state, side: heritage ? 'front' : 'back'});
    clone.querySelector('#print-zone').setAttribute('visibility', 'hidden');
    // L'export montre toujours la face personnalisée, même si l'autre face était consultée.
    clone.querySelector('#print').setAttribute('visibility', 'visible');
    clone.querySelector('#chest-logo').setAttribute('visibility', heritage ? 'visible' : 'hidden');
    clone.querySelector('#back-symbol').setAttribute('visibility', 'hidden');
    for (const img of clone.querySelectorAll('image')) {
      const url = img.getAttribute('href');
      if (!url) { img.remove(); continue; }
      if (img.id === 'print') {
        img.setAttribute('href', 'data:image/svg+xml;base64,' + bytesToBase64(new TextEncoder().encode(currentApproval.result.svg)));
      } else {
        const response = await fetch(url); if (!response.ok) throw new Error('Logo indisponible.');
        img.setAttribute('href', 'data:image/png;base64,' + bytesToBase64(new Uint8Array(await response.arrayBuffer())));
        img.setAttribute('style', dark ? 'filter:invert(1);mix-blend-mode:screen' : 'mix-blend-mode:multiply');
      }
    }
    const dataUrl = 'data:image/svg+xml;base64,' + bytesToBase64(new TextEncoder().encode(new XMLSerializer().serializeToString(clone)));
    const image = new Image(); await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = dataUrl; });
    const canvas = document.createElement('canvas'); canvas.width = 1400; canvas.height = 1600;
    const context = canvas.getContext('2d'); context.fillStyle = '#edece6'; context.fillRect(0, 0, 1400, 1600); context.drawImage(image, 0, 0);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Export indisponible.');
    download(blob, 'image/png', `itums-${currentApproval.state.template}-apercu.png`);
  } catch { $('#export-error').textContent = 'L’aperçu PNG n’a pas pu être exporté. Le motif SVG reste disponible.'; $('#export-error').hidden = false; }
  finally { button.disabled = false; }
});
function bytesToBase64(bytes) {
  let binary = ''; for (let start = 0; start < bytes.length; start += 8192) binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
  return btoa(binary);
}
async function initializeConfigurator() {
  let shop;
  try {
    shop = await shopApi('/settings');
    garmentColors = shop.garment_colors;
    if (!garmentColors) throw new Error('Palette des vêtements indisponible.');
    for (const [code, color] of Object.entries(garmentColors)) labels[code] = color.label;
    renderColorOptions(new Set(Object.values(garmentColors).filter(c=>c.categories.includes('tshirt')).map(c=>c.label)));
  } catch(error) { showError(error.message); return; }
  const slug = new URLSearchParams(location.search).get('produit');
  if (slug) {
    try {
      const product = await shopApi('/products/' + encodeURIComponent(slug));
      if (!product.customization_template) throw new Error('Ce produit ne propose pas de personnalisation.');
      state.template = product.customization_template;
      state.side = state.template === 'heritage' ? 'front' : 'back';
      state.color = Object.keys(garmentColors).find(code => product.variants.some(v => v.color === garmentColors[code].label || (garmentColors[code].aliases||[]).includes(v.color))) || 'white';
      const allowedColors = new Set(product.variants.map(v => v.color));
      const allowedSizes = new Set(product.variants.map(v => v.size));
      $$('.template-card').forEach(el => el.hidden = el.dataset.template !== state.template);
      renderColorOptions(allowedColors);
      const sizeGroup = $('.sizes > div');
      sizeGroup.replaceChildren();
      const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      [...allowedSizes].sort((a,b)=>(sizeOrder.indexOf(a)<0?99:sizeOrder.indexOf(a))-(sizeOrder.indexOf(b)<0?99:sizeOrder.indexOf(b))||a.localeCompare(b)).forEach(size => {
        const option = document.createElement('button'); option.dataset.size = size; option.textContent = size;
        option.setAttribute('aria-pressed', String(state.size === size));
        option.addEventListener('click', () => { state.size = size; approved = null; renderShirt(); });
        sizeGroup.append(option);
      });
      if (!allowedSizes.has(state.size)) state.size = product.variants[0]?.size || 'M';
      $('.page-footer > span:last-child').textContent = 'Simulation de placement';
      const back = document.createElement('a'); back.href = '/produit/' + product.slug; back.className = 'back-to-product'; back.textContent = '← La fiche produit';
      $('.topbar').append(back);
      const add = document.createElement('button'); add.id = 'add-to-shop'; add.className = 'primary-button';
      add.textContent = shop.store_open ? 'Ajouter au panier' : 'Commandes bientôt ouvertes';
      add.disabled = !shop.store_open || !product.active || !product.price;
      $('.export-actions').prepend(add);
      add.addEventListener('click', () => {
        if (!approved || approved.revision !== revision) return;
        const chosen = approved.state;
        const color = garmentColors[chosen.color];
        const variant = product.variants.find(v => v.size === chosen.size && (v.color === color.label || (color.aliases||[]).includes(v.color)) && v.active);
        if (!variant || variant.stock === 0) { showExportError('Cette taille/couleur n’est plus disponible.'); return; }
        const customized = chosen.filename !== 'Illustration d’origine' || chosen.scale !== 100 || chosen.horizontal !== 50 || chosen.vertical !== 50;
        try {
          shopAddToCart({variant_id: variant.id, product_id: product.id, slug: product.slug, name: product.name,
            photo: product.photo, size: variant.size, color: variant.color, quantity: 1,
            unit_price: product.price + (customized ? product.customization_price : 0),
            customization: customized ? {svg: approved.result.normalized, ...approved.result.settings} : null});
          location.href = '/panier';
        } catch (error) { showExportError(error.message); }
      });
      $('#approve').addEventListener('click', () => {
        if (!approved) return;
        const custom = approved.state.filename !== 'Illustration d’origine' || approved.state.scale !== 100 || approved.state.horizontal !== 50 || approved.state.vertical !== 50;
        if (shop.store_open && product.active && product.price) add.textContent = 'Ajouter au panier · ' + shopMoney(product.price + (custom ? product.customization_price : 0));
      });
    } catch (error) { showError(error.message); $('#approve').disabled = true; return; }
  }
  renderShirt();
  await loadOriginal();
}
function renderColorOptions(allowed) {
  const container = $('.swatches'); container.replaceChildren();
  for (const [code, color] of Object.entries(garmentColors)) {
    if (!allowed.has(color.label) && !(color.aliases||[]).some(label=>allowed.has(label))) continue;
    const button = document.createElement('button'); button.className = 'swatch'; button.dataset.color = code;
    button.setAttribute('aria-label',color.label); button.title = color.label;
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('viewBox','0 0 32 32'); svg.setAttribute('aria-hidden','true');
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle'); circle.setAttribute('cx','16'); circle.setAttribute('cy','16'); circle.setAttribute('r','15'); circle.setAttribute('fill',color.hex); svg.append(circle); button.append(svg);
    button.addEventListener('click',()=>{state.color=code;approved=null;renderShirt();});
    container.append(button);
  }
}
function showExportError(message) { $('#export-error').textContent = message; $('#export-error').hidden = false; }
initializeConfigurator();
