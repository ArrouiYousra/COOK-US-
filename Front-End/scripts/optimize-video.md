# Guide d'optimisation vidéo pour COOK US

## Objectif : Réduire de 22 MB à 2-5 MB maximum

### Option 1 : FFmpeg (Recommandé - Meilleure qualité)

```bash
# Installation FFmpeg (si pas déjà installé)
# Windows : Télécharger depuis https://ffmpeg.org/download.html

# Compression optimale pour web
ffmpeg -i how-it-works-original.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 32 \
  -vf "scale=1280:720" \
  -c:a aac \
  -b:a 64k \
  -movflags +faststart \
  -pix_fmt yuv420p \
  how-it-works.mp4
```

**Paramètres expliqués :**
- `crf 32` : Qualité (18-28 = excellent, 28-32 = bon pour web)
- `scale=1280:720` : Résolution 720p (suffisant pour web)
- `b:a 64k` : Audio très compressé (vidéo muette de toute façon)
- `movflags +faststart` : Permet le streaming progressif

### Option 2 : HandBrake (Interface graphique)

1. Ouvrir HandBrake
2. Charger votre vidéo
3. **Preset** : "Web - Gmail Large 3 Minutes 720p30"
4. **Video Codec** : H.264 (x264)
5. **Quality** : RF 28-32
6. **Resolution** : 1280x720
7. **Framerate** : 30 fps (ou 24 fps si animation)
8. **Audio** : Désactiver ou AAC 64k
9. Exporter

### Option 3 : En ligne (CloudConvert)

1. Aller sur https://cloudconvert.com/mp4-compressor
2. Uploader votre vidéo
3. **Settings** :
   - Resolution: 1280x720
   - Bitrate: 2-3 Mbps
   - Codec: H.264
4. Compresser

### Option 4 : Créer une version WebM (encore plus léger)

```bash
# WebM est souvent 30-50% plus petit que MP4
ffmpeg -i how-it-works-original.mp4 \
  -c:v libvpx-vp9 \
  -crf 32 \
  -b:v 0 \
  -vf "scale=1280:720" \
  -c:a libopus \
  -b:a 64k \
  how-it-works.webm
```

Puis utiliser les deux formats dans le HTML :
```html
<video>
  <source src="/videos/how-it-works.webm" type="video/webm">
  <source src="/videos/how-it-works.mp4" type="video/mp4">
</video>
```

### Option 5 : Créer un poster image (thumbnail)

```bash
# Extraire une frame comme poster
ffmpeg -i how-it-works.mp4 -ss 00:00:02 -vframes 1 how-it-works-poster.jpg
```

## Résultats attendus

- **Original** : 22 MB
- **Après optimisation** : 2-5 MB (720p) ou 5-8 MB (1080p)
- **Temps de chargement** : < 1 seconde sur 4G

## Alternative : Utiliser YouTube/Vimeo (0 MB sur votre serveur)

Si la compression ne suffit pas, héberger sur YouTube en mode "non listé" :

```tsx
<iframe
  src="https://www.youtube.com/embed/VOTRE_VIDEO_ID?autoplay=1&loop=1&mute=1&controls=0&playlist=VOTRE_VIDEO_ID"
  className="w-full h-full"
  allow="autoplay"
/>
```

