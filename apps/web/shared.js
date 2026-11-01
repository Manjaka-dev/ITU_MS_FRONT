export const APP = Object.freeze({api:'/api/v1',cartKey:'itums_cart_v1',lastOrderKey:'itums_last_order_v1',checkoutKey:'itums_checkout_v1',maxCartBytes:4000000});
export const $ = (s, root=document) => root.querySelector(s);
export const $$ = (s, root=document) => [...root.querySelectorAll(s)];
export const escape = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
export const money = value => value == null ? 'Prix à venir' : new Intl.NumberFormat('fr-MG',{maximumFractionDigits:0}).format(value)+' Ar';
export const date = value => new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short',timeZone:'Indian/Antananarivo'}).format(new Date(value*1000));
export const orderLabels = {received:'Commande reçue',preparing:'En préparation',shipped:'Expédiée',delivered:'Livrée',cancelled:'Annulée'};
export const paymentLabels = {design_review:'Personnalisation à vérifier',deposit_due:'Acompte attendu',deposit_review:'Acompte à vérifier',deposit_correction:'Référence à corriger',deposit_confirmed:'Acompte confirmé',paid:'Soldée',refund_due:'Remboursement à traiter',refunded:'Remboursée',cancelled:'Annulée'};
export let csrf = '';
export function setCsrf(value){csrf=value;}
export async function api(path, {method='GET',body,admin=false,raw=false}={}){
  const headers={};
  if(body && !(body instanceof FormData))headers['Content-Type']='application/json';
  if(admin && method!=='GET')headers['X-CSRF-Token']=csrf;
  const response=await fetch(APP.api+path,{method,headers,credentials:'same-origin',body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({error:{message:'Le serveur ne répond pas correctement.'}}));
  if(!response.ok){const e=new Error(data.error?.message||'Une erreur est survenue.');e.code=data.error?.code;e.status=response.status;throw e;}
  return raw?data:data.data;
}
export function readCart(){
  try{const data=JSON.parse(localStorage.getItem(APP.cartKey)||'[]');return Array.isArray(data)?data:[];}
  catch(error){console.warn('Panier local illisible ; un panier vide est affiché.');return [];}
}
export function writeCart(items){
  const data=JSON.stringify(items);
  if(items.length>20||new TextEncoder().encode(data).length>APP.maxCartBytes)throw new Error('Le panier est trop volumineux. Réduisez le nombre de visuels personnalisés.');
  try{localStorage.setItem(APP.cartKey,data);}catch{throw new Error('Impossible de conserver ce panier. Libérez de l’espace dans le navigateur ou réduisez les visuels.');}
  updateCartCount();
}
export function addToCart(item){
  const items=readCart();
  const same=items.find(x=>x.variant_id===item.variant_id && JSON.stringify(x.customization||null)===JSON.stringify(item.customization||null));
  if(same){if(same.quantity+item.quantity>10)throw new Error('La quantité maximale par variante est de 10.');same.quantity+=item.quantity;}
  else items.push({...item,key:crypto.randomUUID()});
  writeCart(items);
}
export function updateCartCount(){const el=$('#cart-count');if(el)el.textContent=readCart().reduce((n,x)=>n+x.quantity,0);}
export function toast(text){const el=$('#toast');if(!el)return;el.textContent=text;el.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.hidden=true,4500);}
export function errorBox(text){return `<p class="form-error" role="alert">${escape(text)}</p>`;}
export function download(data,type,name){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
export function svgImage(svg,alt='',classes=''){return `<img class="${escape(classes)}" src="data:image/svg+xml;charset=utf-8,${escape(encodeURIComponent(svg))}" alt="${escape(alt)}">`;}
export async function busy(button, action){const text=button.textContent;button.disabled=true;button.textContent='Un instant…';try{return await action();}finally{button.disabled=false;button.textContent=text;}}
export function onSubmit(form, handler){form.addEventListener('submit',async event=>{event.preventDefault();const old=$('.form-error',form);if(old)old.remove();try{await busy($('[type=submit]',form),()=>handler(new FormData(form)));}catch(error){form.insertAdjacentHTML('beforeend',errorBox(error.message));}});}
export function formObject(form){return Object.fromEntries(form.entries());}
