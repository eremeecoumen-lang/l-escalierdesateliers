# Mettre l'escalier textuel en ligne

Ce site fonctionne maintenant avec un petit serveur Node.js :

- les eleves publient depuis la page principale ;
- les textes sont visibles par tout le monde ;
- la moderation se fait sur une page separee, protegee par un mot de passe ;
- les textes publies sont stockes dans un fichier `texts.json`.

## 1. Tester sur ton ordinateur

Dans PowerShell :

```powershell
cd C:\Users\rloss\Documents\Codex\2026-04-29\penses-tu-possible-de-coder-un
$env:ADMIN_PASSWORD="choisis-un-vrai-mot-de-passe"
npm start
```

Ouvre ensuite :

- site public : `http://localhost:3000/`
- moderation : `http://localhost:3000/admin.html`

Tu peux poster un texte depuis le site public, puis aller dans l'administration pour le masquer, le republier ou le supprimer.

## 2. Creer un depot GitHub

1. Cree un compte sur GitHub si necessaire.
2. Cree un nouveau depot, par exemple `archives-textuelles`.
3. Dans PowerShell, depuis le dossier du site :

```powershell
git init
git add .
git commit -m "Publier l'escalier textuel"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/archives-textuelles.git
git push -u origin main
```

Remplace `TON-COMPTE` par ton identifiant GitHub.

Le fichier `.gitignore` evite d'envoyer sur GitHub les donnees locales, l'ancien recueil importe, les captures de verification, les dependances et les mots de passe.

## 3. Creer le service sur Render

1. Cree un compte sur Render.
2. Clique sur `New`, puis `Web Service`.
3. Connecte ton compte GitHub.
4. Choisis le depot `archives-textuelles`.
5. Configure le service :

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
```

6. Dans `Environment`, ajoute :

```text
ADMIN_PASSWORD = ton-mot-de-passe-de-moderation
DATA_DIR = /var/data
```

7. Dans les options avancees, ajoute un disque persistant :

```text
Mount path: /var/data
Size: la plus petite taille disponible
```

Le disque persistant est important : sans lui, les textes peuvent disparaitre au prochain redeploiement ou redemarrage.

Le fichier `render.yaml` present dans ce dossier contient deja cette configuration de base. Tu peux l'utiliser avec les Blueprints Render, ou simplement suivre les etapes ci-dessus depuis l'interface Render.

## 4. Utiliser le site en ligne

Une fois le deploiement termine, Render te donnera une adresse du type :

```text
https://archives-textuelles.onrender.com
```

Les eleves iront sur :

```text
https://archives-textuelles.onrender.com/
```

Toi, pour moderer :

```text
https://archives-textuelles.onrender.com/admin.html
```

Entre le mot de passe defini dans `ADMIN_PASSWORD`.

## 5. Points importants

- Les textes publies apparaissent tout de suite sur le site public.
- Depuis l'administration, tu peux masquer un texte, le republier ou le supprimer.
- Un texte supprime est supprime definitivement.
- Change le mot de passe dans Render si tu penses qu'il a circule.
- Ne partage pas l'adresse d'administration avec les eleves.
- Les textes sont publics : il vaut mieux demander aux eleves de ne pas mettre d'information personnelle.

## 6. Sauvegardes

Sur Render, les textes sont stockes dans :

```text
/var/data/texts.json
```

Render fait des instantanes du disque persistant, mais pour un usage scolaire il est prudent de telecharger regulierement une sauvegarde de ce fichier depuis l'interface Render.

## 7. Variante possible

Actuellement, les textes sont publies immediatement puis moderables apres coup. On peut aussi transformer le site pour que chaque texte arrive d'abord en attente de validation, puis devienne visible seulement apres ton accord.
