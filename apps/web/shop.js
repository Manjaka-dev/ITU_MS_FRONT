import {APP,$,$$,escape as e,money,date,api,readCart,writeCart,addToCart,updateCartCount,toast,errorBox,download,svgImage,onSubmit,orderLabels,paymentLabels,productImage} from '/shared.js?v=20261108';
const root=$('#app');
let shop;
const button=(label,href,secondary=false)=>`<a class="button${secondary?' secondary':''}" href="${e(href)}">${e(label)} <span>↗</span></a>`;
const heading=(small,title,extra='')=>`<div class="page-heading"><p class="eyebrow">${e(small)}</p><h1>${e(title)}</h1>${extra}</div>`;
const empty=(title,text,link='/boutique')=>`<section class="empty-state"><p class="eyebrow">ITU MOTORS SOCIETY</p><h1>${e(title)}</h1><p>${e(text)}</p>${button('Voir la collection',link)}</section>`;
const card=p=>`<article class="product-card"><a href="/produit/${e(p.slug)}" class="product-image">${productImage(p.photo,p.name)}${p.customization_template?'<span class="product-tag">Personnalisable</span>':''}</a><a href="/produit/${e(p.slug)}" class="product-info"><div><h3>${e(p.name)}</h3><span>${p.category==='tshirt'?'T-shirt':'Sweat'} · ITUMS</span></div><strong>${money(p.price)}</strong></a></article>`;

async function collection(home=false){
  const category=new URLSearchParams(location.search).get('categorie')||'';
  const page=Number(new URLSearchParams(location.search).get('page')||1);
  const result=await api(`/products?page=${page}&page_size=12${category?'&category='+encodeURIComponent(category):''}`,{raw:true});
  const products=result.data;
  root.innerHTML=(home?`<section class="hero"><div><p class="eyebrow">ITU MOTORS SOCIETY · COLLECTION 01</p><h1>L’automobile,<br>à porter<span>.</span></h1><p>Des pièces pour ceux qui vivent leur passion jusque dans les détails.</p>${button('Découvrir la collection','#collection')}<span class="hero-footnote">T-SHIRTS / SWEATS / VOTRE SIGNATURE</span></div><a class="hero-image" href="/produit/tshirt-megane">${productImage('/assets/blueprint.png','T-shirt Blueprint ITU Motors Society, devant et dos','(max-width: 760px) 100vw, 55vw',true)}<span>BLUEPRINT — ITUMS</span></a></section>`:heading('LA COLLECTION','Des pièces qui vous ressemblent.'))+
    `<section id="collection" class="collection"><div class="collection-bar"><h2>${home?'La collection':'Toutes les pièces'} <small>${result.meta_data.total}</small></h2><nav aria-label="Catégories"><a class="${!category?'selected':''}" href="/boutique">Tout</a><a class="${category==='tshirt'?'selected':''}" href="/boutique?categorie=tshirt">T-shirts</a><a class="${category==='sweat'?'selected':''}" href="/boutique?categorie=sweat">Sweats</a></nav></div><div class="product-grid">${products.map(card).join('')||'<p>La collection arrive prochainement.</p>'}</div>${pagination(result.meta_data,p=>`/boutique?categorie=${e(category)}&page=${p}`)}</section>`+
    `<section class="personalize-band"><div><p class="eyebrow">VOTRE VOITURE, VOTRE SIGNATURE</p><h2>La vôtre mérite sa place.</h2><p>Ajoutez votre illustration aux compositions Heritage et Blueprint. Le résultat s’affiche avant de commander.</p></div>${button('Créer mon t-shirt','/produit/tshirt-bmw-e36',true)}</section>`;
}

export function pagination(meta,href){return meta.total>meta.page_size?`<nav class="pagination" aria-label="Pagination">${meta.page>1?button('Précédent',href(meta.page-1),true):'<span></span>'}<span>Page ${meta.page} / ${Math.ceil(meta.total/meta.page_size)}</span>${meta.page*meta.page_size<meta.total?button('Suivant',href(meta.page+1),true):'<span></span>'}</nav>`:'';}

async function product(slug){
  const p=await api('/products/'+encodeURIComponent(slug));
  if(!root.dataset.pageStatus)document.title=p.name+' — ITU Motors Society';
  const colors=[...new Set(p.variants.map(v=>v.color))];
  const sizeOrder=['XXS','XS','S','M','L','XL','XXL','XXXL'];
  const sizes=[...new Set(p.variants.map(v=>v.size))].sort((a,b)=>(sizeOrder.indexOf(a)<0?99:sizeOrder.indexOf(a))-(sizeOrder.indexOf(b)<0?99:sizeOrder.indexOf(b))||a.localeCompare(b));
  let color=colors[0],size=sizes.includes('M')?'M':sizes[0];
  root.innerHTML=`<a class="back-link" href="/boutique">← La collection</a><section class="product-detail"><div class="detail-image">${productImage(p.photo,p.name,'(max-width: 760px) 100vw, 55vw',true)}</div><div class="detail-content"><p class="eyebrow">COLLECTION 01 / ${p.category==='tshirt'?'T-SHIRT':'SWEAT'}</p><h1>${e(p.name)}</h1><p class="detail-price">${money(p.price)}</p><p class="description">${e(p.description)}</p><div class="product-options"><fieldset><legend>Couleur</legend><div class="option-buttons">${colors.map(c=>`<button data-color="${e(c)}" aria-pressed="${c===color}">${e(c)}</button>`).join('')}</div></fieldset><fieldset><legend>Taille</legend><div class="option-buttons">${sizes.map(s=>`<button data-size="${e(s)}" aria-pressed="${s===size}">${e(s)}</button>`).join('')}</div></fieldset></div><p id="availability" class="muted"></p><button id="add-standard" class="button full">Ajouter au panier <span>+</span></button>${p.customization_template?`<a class="button secondary full" href="/atelier/?produit=${e(p.slug)}">Personnaliser avec ma voiture <span>↗</span></a><p class="small muted">Votre SVG, intégré automatiquement.${p.customization_price?' Supplément : '+money(p.customization_price)+'.':''}</p>`:''}<div class="detail-notes"><p>Acompte de 50 % · Solde à la livraison</p>${p.lead_time?`<p>${e(p.lead_time)}</p>`:''}<a href="/livraison">Livraison & retours ↗</a></div></div></section>`;
  function selected(){return p.variants.find(v=>v.color===color && v.size===size && v.active);}
  function refresh(){
    $$('[data-color]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.color===color)));
    $$('[data-size]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.size===size)));
    const variant=selected(),available=p.active&&p.price&&variant&&(variant.stock==null||variant.stock>0);
    $('#add-standard').disabled=!available||!shop.store_open;
    $('#add-standard').firstChild.textContent=!shop.store_open?'Commandes bientôt ouvertes ':available?'Ajouter au panier ':'Indisponible ';
    $('#availability').textContent=!p.active||!p.price?'Cette pièce sera bientôt disponible.':!variant?'Cette combinaison n’est pas disponible.':variant.stock===0?'Cette variante est épuisée.':variant.stock==null?'Fabriqué à la commande':'Disponible';
  }
  $$('[data-color]').forEach(el=>el.addEventListener('click',()=>{color=el.dataset.color;refresh();}));
  $$('[data-size]').forEach(el=>el.addEventListener('click',()=>{size=el.dataset.size;refresh();}));
  $('#add-standard').addEventListener('click',()=>{
    try{const v=selected();addToCart({variant_id:v.id,product_id:p.id,slug:p.slug,name:p.name,photo:p.photo,size:v.size,color:v.color,quantity:1,unit_price:p.price,customization:null});toast('Votre pièce a été ajoutée au panier.');}
    catch(error){toast(error.message);}
  });refresh();
}

async function currentCart(){
  const items=readCart();
  const products=await Promise.all([...new Set(items.map(x=>x.slug))].map(async slug=>{try{return await api('/products/'+encodeURIComponent(slug));}catch(error){if(error.status===404)return {slug,active:false,variants:[]};throw error;}}));
  return items.map(item=>{const p=products.find(p=>p.slug===item.slug),v=p?.variants.find(v=>v.id===item.variant_id);return {...item,unit_price:p?.price!=null?p.price+(item.customization?p.customization_price:0):null,available:!!(p?.active&&v?.active&&(v.stock==null||v.stock>=item.quantity)),stock:v?.stock};});
}

function cartLines(items,editable=false){return items.map(item=>`<article class="cart-item"><img src="${e(item.photo)}" alt="${e(item.name)}"><div><a href="/produit/${e(item.slug)}"><h3>${e(item.name)}</h3></a><p>${e(item.color)} · ${e(item.size)}${item.customization?' · Personnalisé':''}</p>${!item.available?'<p class="stock-warning">Quantité ou variante indisponible</p>':''}${editable?`<div class="quantity"><button data-quantity="${e(item.key)}" data-step="-1" aria-label="Réduire la quantité de ${e(item.name)}">−</button><span>${item.quantity}</span><button data-quantity="${e(item.key)}" data-step="1" aria-label="Augmenter la quantité de ${e(item.name)}">+</button><button class="remove-item" data-remove="${e(item.key)}">Retirer</button></div>`:`<p>Quantité : ${item.quantity}</p>`}</div><strong>${item.unit_price==null?money(null):money(item.unit_price*item.quantity)}</strong></article>`).join('');}

async function cart(){
  const items=await currentCart();
  if(!items.length){root.innerHTML=empty('Votre panier vous attend.','Choisissez une pièce de la collection pour commencer.');return;}
  const total=items.reduce((n,x)=>n+(x.unit_price||0)*x.quantity,0);
  root.innerHTML=heading('VOTRE SÉLECTION','Le panier.')+`<div class="checkout-layout"><section>${cartLines(items,true)}</section><aside class="order-summary"><h2>Votre sélection</h2><div class="summary-row"><span>Sous-total</span><strong>${money(total)}</strong></div><p class="small muted">Livraison à convenir par message auprès du bureau. Les frais non chiffrés sont exclus du total.</p><div class="summary-row"><span>Acompte</span><span>50 % du total</span></div>${shop.store_open&&items.every(x=>x.available&&x.unit_price)?button('Passer commande','/commander'):'<p class="notice">'+(shop.store_open?'Ajustez les articles indisponibles avant de continuer.':'Les commandes ouvriront prochainement.')+'</p>'}<a class="text-link" href="/boutique">Continuer la sélection</a></aside></div>`;
  $$('[data-quantity]').forEach(el=>el.addEventListener('click',async()=>{const saved=readCart(),item=saved.find(x=>x.key===el.dataset.quantity);item.quantity=Math.max(1,Math.min(10,item.quantity+Number(el.dataset.step)));writeCart(saved);await cart();}));
  $$('[data-remove]').forEach(el=>el.addEventListener('click',async()=>{writeCart(readCart().filter(x=>x.key!==el.dataset.remove));await cart();}));
}

async function checkout(){
  const items=await currentCart();
  if(!items.length){location.href='/panier';return;}
  if(!shop.store_open||!items.every(x=>x.available&&x.unit_price)){root.innerHTML=empty('Encore un instant.','Les commandes sont fermées ou un article doit être ajusté.','/panier');return;}
  const subtotal=items.reduce((n,x)=>n+x.unit_price*x.quantity,0);
  root.innerHTML=heading('DERNIÈRE LIGNE DROITE','Votre commande.')+`<div class="checkout-layout"><form id="checkout-form" class="form-panel"><h2>Vos coordonnées</h2><div class="field-grid"><label>Nom complet<input name="customer_name" autocomplete="name" minlength="2" maxlength="150" required></label><label>Téléphone<input name="phone" type="tel" autocomplete="tel" minlength="8" maxlength="50" required></label></div>${shop.email_enabled?'<label>E-mail <span class="muted">(facultatif)</span><input name="email" type="email" autocomplete="email" maxlength="254"></label>':''}<h2>La livraison</h2><label>Zone<select name="delivery_id" id="delivery-zone">${shop.delivery_zones.map(z=>`<option value="${e(z.id)}">${e(z.name)} — ${z.price_pending?'frais à convenir':money(z.price)}</option>`).join('')}</select></label><p class="small muted" id="delivery-description"></p><label>Adresse et indications<textarea name="address" autocomplete="street-address" minlength="4" maxlength="1000" required></textarea></label><label>Un détail à nous transmettre ? <span class="muted">(facultatif)</span><textarea name="note" maxlength="500"></textarea></label><label class="checkbox-row"><input type="checkbox" name="accept_terms" required><span>J’accepte les <a href="/conditions" target="_blank" rel="noopener">conditions de vente</a> et j’ai lu les informations de <a href="/confidentialite" target="_blank" rel="noopener">confidentialité</a>.</span></label><p class="small muted">Pour un motif personnalisé, l’administration doit d’abord valider la demande. Les instructions de paiement apparaîtront ensuite dans le suivi.</p><button type="submit" class="button full">Confirmer ma commande <span>↗</span></button></form><aside class="order-summary"><h2>Le récapitulatif</h2>${items.map(x=>`<div class="summary-row"><span>${e(x.name)} × ${x.quantity}</span><strong>${money(x.unit_price*x.quantity)}</strong></div>`).join('')}<div class="summary-row"><span>Livraison</span><span id="shipping-price"></span></div><div class="summary-row total"><span id="total-label">Total</span><strong id="order-total"></strong></div><div class="deposit-box"><span>Acompte de 50 %</span><strong id="order-deposit"></strong><small>Le reste à la livraison : <span id="order-balance"></span></small></div></aside></div>`;
  let total=0;
  function refresh(){const zone=shop.delivery_zones.find(z=>z.id===$('#delivery-zone').value);total=subtotal+zone.price;$('#shipping-price').textContent=zone.price_pending?'À convenir · hors total':money(zone.price);$('#order-total').textContent=money(total);$('#total-label').textContent=zone.price_pending?'Total hors livraison':'Total';$('#order-deposit').textContent=money(Math.ceil(total/2));$('#order-balance').textContent=money(Math.floor(total/2));$('#delivery-description').textContent=zone.description;}
  $('#delivery-zone').addEventListener('change',refresh);refresh();
  onSubmit($('#checkout-form'),async data=>{
    const body={customer_name:data.get('customer_name'),phone:data.get('phone'),email:data.get('email')||'',address:data.get('address'),note:data.get('note'),delivery_id:data.get('delivery_id'),terms_version:shop.terms_version,accept_terms:true,expected_total:total,
      items:items.map(x=>({variant_id:x.variant_id,quantity:x.quantity,customization:x.customization||null}))};
    const fingerprint=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(body))))].map(x=>x.toString(16).padStart(2,'0')).join('');let submission;
    try{submission=JSON.parse(sessionStorage.getItem(APP.checkoutKey)||'null');}catch{console.warn('Ancienne soumission locale illisible.');}
    if(!submission||submission.fingerprint!==fingerprint){submission={fingerprint,key:crypto.randomUUID()+crypto.randomUUID()};sessionStorage.setItem(APP.checkoutKey,JSON.stringify(submission));}
    const result=await api('/orders',{method:'POST',body:{...body,idempotency_key:submission.key}});
    sessionStorage.setItem(APP.lastOrderKey,JSON.stringify(result));writeCart([]);location.href='/confirmation';
  });
}

function paymentInstructions(order){return `<section class="payment-instructions"><p class="eyebrow">ACOMPTE DE 50 %</p><h2>${money(order.deposit)}</h2><p>Effectuez votre transfert vers l’un des numéros ci-dessous, puis renseignez sa référence.</p><div class="payment-methods">${shop.payment_methods.map(m=>`<div><strong>${e(m.name)}</strong><span>${e(m.number)}</span><small>${e(m.beneficiary)}</small></div>`).join('')}</div>${shop.payment_instructions?`<p>${e(shop.payment_instructions)}</p>`:''}</section>`;}

function transferForm(order,code){
  if(order.paid>=order.deposit||order.status==='cancelled')return '';
  if(!order.payment_allowed)return '<p class="notice">Votre personnalisation doit être approuvée par l’administration avant tout paiement. Consultez le suivi avec votre code ; les instructions MVola y apparaîtront après validation.</p>';
  return paymentInstructions(order)+`<form id="transfer-form" class="form-panel"><h2>Déclarer le transfert</h2><label>Opérateur<select name="operator">${shop.payment_methods.map(m=>`<option value="${e(m.id)}">${e(m.name)}</option>`).join('')}</select></label><div class="field-grid"><label>Référence du transfert<input name="reference" minlength="3" maxlength="120" required autocomplete="off"></label><label>Montant envoyé (Ar)<input name="amount" type="number" min="1" step="1" value="${order.deposit-order.paid}" required></label></div><p class="small muted">La référence sera vérifiée avant confirmation de l’acompte.</p><button type="submit" class="button full">Envoyer la référence <span>↗</span></button></form>`;
}

function wireTransfer(order,code,render){const form=$('#transfer-form');if(form)onSubmit(form,async data=>{const updated=await api('/tracking/transfer',{method:'POST',body:{code,operator:data.get('operator'),reference:data.get('reference'),amount:Number(data.get('amount'))}});render(updated);toast('Votre référence est transmise pour vérification.');});}

function confirmation(){
  let result;try{result=JSON.parse(sessionStorage.getItem(APP.lastOrderKey)||'null');}catch{console.warn('Confirmation locale indisponible.');}
  if(!result){root.innerHTML=empty('Retrouvez votre commande.','Utilisez votre code sur la page de suivi.','/suivi');return;}
  const {order,tracking_code:code}=result;
  function render(current){sessionStorage.setItem(APP.lastOrderKey,JSON.stringify({order:current,tracking_code:code}));root.innerHTML=`<section class="confirmation-heading"><p class="eyebrow">COMMANDE ${e(current.number)}</p><h1>Merci. La suite s’écrit avec vous.</h1><p>Conservez votre code : il permet de suivre votre commande sans créer de compte.</p><div class="secret-code"><code>${e(code)}</code><button id="copy-code" class="text-button">Copier</button></div><div class="inline-actions"><button id="save-receipt" class="text-button">Enregistrer ma confirmation</button><a href="/suivi" class="text-link">Suivre ma commande ↗</a></div></section><div class="checkout-layout"><section>${current.payment_status==='deposit_review'?'<p class="notice">Votre référence est transmise. L’acompte est en cours de vérification.</p>':transferForm(current,code)||'<p class="notice">'+e(paymentLabels[current.payment_status])+'</p>'}</section><aside class="order-summary"><h2>${e(current.number)}</h2><div class="summary-row"><span>${current.shipping_pending?'Total hors livraison':'Total'}</span><strong>${money(current.total)}</strong></div><div class="summary-row"><span>Acompte attendu</span><strong>${money(current.deposit)}</strong></div><div class="summary-row"><span>Solde à la livraison</span><strong>${money(current.total-current.deposit)}</strong></div></aside></div>`;
    $('#copy-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(code);toast('Code copié.');}catch{toast('Sélectionnez le code pour le copier.');}});
    $('#save-receipt').addEventListener('click',()=>download(`ITU MOTORS SOCIETY\nCommande ${current.number}\nCode de suivi : ${code}\nTotal : ${money(current.total)}\nAcompte : ${money(current.deposit)}\nSolde à la livraison : ${money(current.total-current.deposit)}\n\nSuivi : ${location.origin}/suivi\n`,'text/plain',current.number+'.txt'));
    wireTransfer(current,code,render);
  }render(order);
  api('/tracking',{method:'POST',body:{code}}).then(render).catch(()=>console.warn('Actualisation du suivi indisponible ; la confirmation conservée reste affichée.'));
}

function tracking(){
  root.innerHTML=heading('SANS COMPTE CLIENT','Suivre ma commande.')+`<form id="tracking-form" class="tracking-form"><label>Votre code de suivi<input name="code" minlength="32" maxlength="128" autocomplete="off" spellcheck="false" required placeholder="Le code reçu à la confirmation"></label><button type="submit" class="button">Retrouver ma commande <span>↗</span></button></form><div id="tracking-result"></div>`;
  onSubmit($('#tracking-form'),async data=>{const code=data.get('code').replace(/[\s-]/g,'').toUpperCase();const order=await api('/tracking',{method:'POST',body:{code}});renderTracking(order,code);});
}

function renderTracking(order,code){
  $('#tracking-result').innerHTML=`<section class="tracking-heading"><div><p class="eyebrow">${e(order.number)}</p><h2>${e(orderLabels[order.status])}</h2></div><span class="badge ${order.payment_status==='deposit_review'?'warm':''}">${e(paymentLabels[order.payment_status])}</span></section><div class="checkout-layout"><section><div class="order-lines">${order.items.map(item=>`<article class="tracking-item"><img src="${e(item.product_photo)}" alt="${e(item.product_name)}"><div><h3>${e(item.product_name)}</h3><p>${e(item.color)} · ${e(item.size)} · Qté ${item.quantity}</p><strong>${money(item.unit_price*item.quantity)}</strong></div></article>${item.design?`<div class="customer-design">${svgImage(item.design.print_svg,'Votre motif personnalisé')}<p class="small">${item.design.approved?'Aperçu accepté par vous.':'Un nouvel aperçu attend votre accord.'} ${e({pending:'Vérification admin en attente.',approved:'Approuvé par l’administration.',rejected:'Correction demandée par l’administration.'}[item.design.admin_review]||'')} ${e(item.design.admin_note||'')}</p>${!item.design.approved?`<button class="button approve-design" data-item="${e(item.id)}" data-version="${e(item.design.version)}">Valider cet aperçu <span>✓</span></button>`:''}</div>`:''}`).join('')}</div>${order.transfers.length?`<section class="section-box"><h3>Vos déclarations</h3>${order.transfers.map(t=>`<div class="transfer-line"><span>Référence ${e(t.reference)} · ${money(t.amount)}</span><strong>${e({pending:'À vérifier',confirmed:'Confirmée',rejected:'À corriger'}[t.state])}</strong>${t.note?`<p>${e(t.note)}</p>`:''}</div>`).join('')}</section>`:''}${order.payment_status==='deposit_review'?'<p class="notice">Votre référence est en cours de vérification. Vous pourrez suivre sa confirmation ici.</p>':transferForm(order,code)}<section class="timeline"><h3>Le suivi</h3>${order.events.slice().reverse().map(ev=>`<div><span></span><p>${e(ev.message)}<small>${date(ev.created_at)}</small></p></div>`).join('')}</section></section><aside class="order-summary"><h3>Votre commande</h3><div class="summary-row"><span>${order.shipping_pending?'Total hors livraison':'Total'}</span><strong>${money(order.total)}</strong></div><div class="summary-row"><span>Acompte prévu</span><span>${money(order.deposit)}</span></div><div class="summary-row"><span>Montant reçu</span><span>${money(order.paid)}</span></div>${order.refunded?`<div class="summary-row"><span>Remboursé</span><span>${money(order.refunded)}</span></div>`:''}<div class="summary-row total"><span>Solde restant</span><strong>${order.status==='cancelled'?'—':money(order.balance)}</strong></div><p class="small muted">${e(order.delivery_name)}</p>${order.tracking_carrier||order.tracking_reference?`<p class="small">${e(order.tracking_carrier)}<br>${e(order.tracking_reference)}</p>`:''}</aside></div>`;
  wireTransfer(order,code,updated=>renderTracking(updated,code));
  $$('.approve-design').forEach(el=>el.addEventListener('click',async()=>{el.disabled=true;try{const updated=await api('/tracking/approve-design',{method:'POST',body:{code,item_id:el.dataset.item,version:el.dataset.version}});renderTracking(updated,code);}catch(error){toast(error.message);el.disabled=false;}}));
}

function legal(kind){
  const mapping={conditions:['Conditions générales de vente',shop.terms],confidentialite:['Confidentialité',shop.privacy],livraison:['Livraison & retours',[shop.delivery_policy,shop.returns_policy].filter(Boolean).join('\n\n')]};
  const [title,text]=mapping[kind];
  root.innerHTML=heading('INFORMATIONS',title)+`<article class="legal-content">${text?`<div class="plain-text">${e(text)}</div>`:'<p>Ces informations seront publiées avant l’ouverture des commandes.</p>'}${shop.seller_name?`<h2>Le vendeur</h2><p>${e(shop.seller_name)}</p><p class="plain-text">${e(shop.seller_address)}</p>`:''}${shop.contact_phone||shop.contact_email?`<h2>Nous contacter</h2><p>${e(shop.contact_phone)}<br>${e(shop.contact_email)}</p>`:''}</article>`;
}

async function start(){
  updateCartCount();
  if(root.dataset.pageStatus==='404')return;
  if(location.pathname.startsWith('/admin')){const {renderAdmin}=await import('/admin.js?v=20261108');await renderAdmin();return;}
  shop=await api('/settings');
  const socialNav=$('footer nav');
  for(const [label,url] of [['Facebook',shop.social_url],['Instagram',shop.instagram_url]]){if(url){const a=document.createElement('a');a.href=url;a.textContent=label;a.target='_blank';a.rel='noopener noreferrer';socialNav.append(a);}}
  const message=shop.announcement||(!shop.store_open?'La collection se prépare. Les commandes ouvriront prochainement.':'');
  if(message){$('#announcement').textContent=message;$('#announcement').hidden=false;}
  const path=location.pathname.replace(/\/$/,'')||'/';
  if(root.dataset.publicPage==='static')return;
  if(path==='/')await collection(true);
  else if(path==='/boutique')await collection();
  else if(path.startsWith('/produit/'))await product(decodeURIComponent(path.split('/')[2]));
  else if(path==='/panier')await cart();
  else if(path==='/commander')await checkout();
  else if(path==='/confirmation')confirmation();
  else if(path==='/suivi')tracking();
  else if(['conditions','confidentialite','livraison'].includes(path.slice(1)))legal(path.slice(1));
  else root.innerHTML=empty('Cette page a pris une autre route.','Retrouvez les pièces de la collection.');
}
start().catch(error=>{root.innerHTML=empty('Un instant…',error.message);});
