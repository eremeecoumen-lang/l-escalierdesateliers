# Recette simple : site gratuit avec GitHub Pages

Dans cette version, les eleves ne publient pas directement.
Toi, tu ajoutes leurs textes dans le fichier `textes-eleves.js`, puis GitHub met le site a jour.

## 1. Le dossier a envoyer

Utilise le dossier :

```text
C:\Users\rloss\Documents\Codex\2026-04-29\penses-tu-possible-de-coder-un\site-statique-a-mettre-sur-github
```

Glisse tout son contenu dans ton depot GitHub.

## 2. Activer GitHub Pages

Dans ton depot GitHub :

1. Clique sur `Settings`.
2. Dans la colonne de gauche, clique sur `Pages`.
3. Dans `Build and deployment`, choisis `Deploy from a branch`.
4. Dans `Branch`, choisis `main`.
5. Dans le dossier, choisis `/ (root)`.
6. Clique sur `Save`.

GitHub donnera ensuite une adresse du type :

```text
https://TON-COMPTE.github.io/archives-textuelles/
```

## 3. Ajouter un texte

Dans GitHub, ouvre le fichier :

```text
textes-eleves.js
```

Clique sur le crayon pour modifier.

Ajoute un bloc comme ceci entre les crochets :

```js
{
  title: "Titre facultatif",
  createdAt: "2026-05-01T10:00:00.000Z",
  text: `Le texte de l'eleve va ici.

On peut garder les retours a la ligne.`
}
```

Pour plusieurs textes :

```js
window.ARCHIVES_TEXTUELLES = [
  {
    title: "Texte le plus recent",
    createdAt: "2026-05-01T10:00:00.000Z",
    text: `Premier texte.`
  },
  {
    title: "Texte plus ancien",
    createdAt: "2026-04-30T10:00:00.000Z",
    text: `Deuxieme texte.`
  }
];
```

Important :

- le texte le plus recent doit etre en haut ;
- il faut une virgule entre deux blocs ;
- il ne faut pas de virgule apres le dernier bloc ;
- le texte doit rester entre deux accents graves : `` `texte` ``.

## 4. Publier la modification

En bas de la page GitHub :

1. Clique sur `Commit changes`.
2. Attends une ou deux minutes.
3. Recharge l'adresse du site.

Le nouvel escalier apparaitra avec les textes ajoutes.
