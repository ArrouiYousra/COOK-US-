# Configuration des Polices - COOK US

## Police Principale : Cera Pro

### Spécifications
- **Famille** : "Cera Pro", "Trebuchet MS", sans-serif
- **Style** : normal
- **Weight** : 700 (bold)
- **Couleur** : rgb(255, 255, 255)
- **Taille Hero** : 68px
- **Line Height Hero** : 68px

### Installation

#### Option 1 : Via CDN (si disponible)
Ajouter dans `app/globals.css` :
```css
@import url("https://fonts.googleapis.com/css2?family=Cera+Pro:wght@700&display=swap");
```

#### Option 2 : Fichiers locaux
1. Télécharger les fichiers de police Cera Pro (format .woff2 recommandé)
2. Placer dans `public/fonts/cera-pro/`
3. Ajouter dans `app/globals.css` :
```css
@font-face {
  font-family: "Cera Pro";
  font-style: normal;
  font-weight: 700;
  src: url("/fonts/cera-pro/CeraPro-Bold.woff2") format("woff2");
  font-display: swap;
}
```

### Utilisation

#### Dans Tailwind (déjà configuré)
```tsx
<h1 className="font-cera text-hero text-white">
  Votre titre
</h1>
```

#### En CSS direct
```css
.hero-title {
  font-family: "Cera Pro", "Trebuchet MS", sans-serif;
  font-size: 68px;
  line-height: 68px;
  font-weight: 700;
  color: rgb(255, 255, 255);
}
```

### Fallback
Si Cera Pro n'est pas disponible, le navigateur utilisera automatiquement "Trebuchet MS" qui est installé par défaut sur la plupart des systèmes.


