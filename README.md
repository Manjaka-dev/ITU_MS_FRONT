# ITU_MS_FRONT

Sources de la boutique et du configurateur ITUMS : `apps/web`.

- Build : `npm run build` (Node.js 20 ou ultérieur), sortie `dist`.
- Les appels `/api/*` utilisent l’API du dépôt ITU_MS_backend, sur la même origine.
- Pour le déploiement gratuit retenu, le backend sert aussi une copie de ces fichiers statiques ; aucun abonnement Vercel n’est nécessaire.
- Le backend embarque cette version du front pour garder une seule adresse et les cookies administrateur sur la même origine. Republier son instantané à chaque évolution du front.
- `vercel.json` reste disponible pour une offre Vercel autorisant le commerce ; Hobby ne doit pas héberger cette boutique.

Aucun accès administrateur, clé privée, base locale ou donnée client n’est publié ici.
