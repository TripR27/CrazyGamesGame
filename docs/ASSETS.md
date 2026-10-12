# Assets: herkomst en licentie

Elke gebruikte asset staat hier met bron en licentie (SPECS.md, hoofdstuk 4, Assets).

## Pixel art (in de code)

Alle sprites en de achtergrond zijn tekstrasters met een palet in de TypeScript-code (`src/**/*-art.ts`), zelf gemaakt voor dit spel en vrij te gebruiken. Er zijn geen beeldbestanden: het spel maakt de textures bij het starten. Voorbeelden: `npm run pixel:preview` (schrijft naar `art/pixel/`).

## Covers voor CrazyGames (`art/covers/`, niet in de game)

`cover-landscape.png` (1920×1080), `cover-square.png` (800×800) en `cover-portrait.png` (800×1200): de eigen taverne-art uit `npm run pixel:preview` met de titel in Pixelify Sans (zie hieronder, OFL staat gebruik in afbeeldingen toe), gemaakt met `scripts/covers/make_covers.py` (stap 23). Vrij te gebruiken.

## Lettertype (`public/fonts/`)

| bestand | grootte | herkomst en licentie |
|---|---|---|
| `PixelifySans.ttf` | 79 KB | Pixelify Sans (variabel, gewicht 400-700), Copyright 2021 The Pixelify Sans Project Authors; uit de Google Fonts-repository (github.com/google/fonts, `ofl/pixelifysans`); SIL Open Font License 1.1, tekst in `PixelifySans-OFL.txt` |

## Audio (`public/audio/`)

| bestand | duur | grootte | herkomst en licentie |
|---|---|---|---|
| `plop.ogg` | 0.16 s | 4.9 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
| `bubble.ogg` | 0.36 s | 5.8 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
| `coin.ogg` | 0.26 s | 5.7 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
| `buzz.ogg` | 0.26 s | 5.0 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
| `buy.ogg` | 0.36 s | 5.9 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
| `eureka.ogg` | 0.78 s | 10.4 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
| `fanfare.ogg` | 1.06 s | 13.9 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
| `horn.ogg` | 0.62 s | 7.5 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
| `hit.ogg` | 0.22 s | 5.4 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
| `miss.ogg` | 0.26 s | 6.4 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
| `music_tavern.ogg` | 90.00 s | 844.8 KB | zelf gegenereerd met code (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`), vrij te gebruiken |
