# Indienen bij CrazyGames

Het indienpakket voor Brewmaster's Tavern (stap 23). De eisen zelf staan in [SPECS.md](SPECS.md), hoofdstuk 2. De teksten die je in het Developer Portal plakt, zijn Engels; de rest van dit bestand is Nederlands.

## 1. Wat klaarstaat

| Onderdeel | Waar | Hoe opnieuw maken |
|---|---|---|
| Game-bestanden (zip, `index.html` bovenaan, 16 bestanden, 1,35 MB) | `release/brewmasters-tavern.zip` (niet in git) | `npm run build` en dan `npm run zip` |
| Cover landscape 1920×1080 | `art/covers/cover-landscape.png` | `npm run pixel:preview` en dan `python scripts/covers/make_covers.py` |
| Cover vierkant 800×800 | `art/covers/cover-square.png` | idem |
| Cover staand 800×1200 | `art/covers/cover-portrait.png` | idem |
| Beschrijving en besturing | hieronder (paragraaf 3) | |
| Trailer landscape 1920×1080, 20 s, MP4 (H.264), zonder geluid | `release/trailer-landscape.mp4` (niet in git) | `npm run trailer` (paragraaf 4) |
| Trailer portrait 1080×1620 (2:3), 20 s, MP4 (H.264), zonder geluid | `release/trailer-portrait.mp4` (niet in git) | idem |

## 2. Stappen (door de eigenaar)

1. Maak een developer-account op developer.crazygames.com.
2. Kies daar een nieuwe game toevoegen (HTML5). Vul titel, beschrijving en besturing in (paragraaf 3).
3. Upload de zip. Kies **landscape** als oriëntatie en **alleen desktop** als platform (de game is niet getest op telefoons en tablets).
4. Upload de drie covers en de twee trailers (`release/trailer-landscape.mp4` en `release/trailer-portrait.mp4`).
5. Draai de **QA-tool** in het portal en loop de lijst in paragraaf 5 af.
6. Dien in. Het QA-team speelt de game; daarna start de **Basic Launch** (ads staan dan uit, zie paragraaf 6).
7. Een update later: `npm run build`, `npm run zip`, de nieuwe zip uploaden en ter goedkeuring indienen (meestal dezelfde werkdag verwerkt).

## 3. Teksten om te plakken (Engels)

**Title:** Brewmaster's Tavern

**Short description:**
Brew absurd potions, serve picky knights, elves and dwarves, and turn a shabby shack into a legendary tavern.

**Description:**
Your tavern is a shabby shack with one stool and a grumpy talking cauldron. Time to change that.

Toss ingredients into the cauldron, brew what your customers ask for and serve it before they lose their patience. Mix new combinations to discover secret recipes (21 in all), each with its own effect: big spenders, quick drinkers, lucky tips or a charmed crowd. Every customer has favourites, and the right drink counts double.

Spend your gold on faster cauldrons, extra seats, new ingredients, rooms upstairs and fancy decorations. Hire a brewer and a waitress who keep the tavern running, even while you are away. Build a guild hall, send your heroes into the Swamp with potions you brewed yourself, pick their path on the way and help them beat the Bog Witch in a timing fight. When your tavern is legendary, sell it for Golden Hops and start again with permanent bonuses.

Trophies, a daily bonus and a peddler with the odd treat keep every visit worth it. Your progress is saved automatically.

**Controls / instructions:**
Mouse only.
- Click ingredients on the shelf to drop them into the cauldron. The right combination brews a drink.
- Click a finished drink on the bar, then click the customer who ordered it.
- Menu (top right) opens the shop, the recipe book, your heroes, the legacy and your trophies.
- The cog opens the settings; the speaker turns the sound off.
- The cauldron explains everything as you play. You can skip it any time.

**Tags (voorstel):** Idle, Clicker, Tycoon, Management, Fantasy, Pixel, Casual.

## 4. Trailer (preview-video)

Eisen (CrazyGames, 2026-10-12): 15 tot 20 seconden, hooguit 50 MB, **geen geluid**, niet versneld, de cover als eerste beeld, geen zwarte balken, **geen muiscursor zichtbaar**, geen "Play now" of andere tekst, geen logo-animaties. Twee versies: **landscape 1080p (16:9)** en **portrait 1080p (2:3)**.

**Klaar:** `npm run trailer` maakt beide (ongeveer 4 minuten; Chrome moet geïnstalleerd zijn, anders `CHROME=<pad naar chrome.exe>`). Wat erin zit: 1 s de cover, dan 19 s een volle taverne (de save van de simulator na 70 minuten): klanten, personeel, munten, de speler brouwt een drankje en ontdekt het legendarische Bog Royale (sterretjes en schermschud), en daarna bestellen de VIP-koningen het. Portrait is de strook rond de ketel. Beide: 20,00 s, 30 fps, H.264, zonder geluidsspoor, zonder cursor, 7 tot 10 MB.

Hoe het werkt (`scripts/trailer/`): Vite serveert het spel, headless Chrome neemt het op terwijl de klok van de pagina op een vijfde loopt (zo zijn er genoeg beelden voor een vloeiende video, ook op een trage computer), en Chrome's eigen encoder (WebCodecs) maakt er beeld voor beeld H.264 van; het script schrijft de MP4. Geen extra programma's of pakketten. Wil je een andere scène of andere klikken, pas dan `SCRIPT` en `loadSave` in `scripts/trailer/record.mjs` aan.

Liever zelf opnemen? Dat kan met de Xbox Game Bar (`Win+Alt+R`) en Clipchamp: knip naar 15-20 s, cover als eerste beeld, geluid weg, export 1080p; voor portrait een project in 2:3.

## 5. Nakijken in de QA-tool

- De game start meteen in de taverne (geen menu); de tutorial is over te slaan.
- `gameplayStart` / `gameplayStop` en `loadingStart` / `loadingStop` komen door (de tool laat ze zien).
- De save gaat naar de data-module: speel even, herlaad, en de voortgang is er nog (ook ingelogd en uitgelogd).
- Ads: een midgame-ad komt pas na 5 minuten spelen (bij een held die terugkomt of een nieuw niveau), nooit tijdens een tutorial-les. De 🎬-knoppen (sinds stap 25; eerst 📺) (marskramer, winkel, welkom-venster) geven alleen na een hele ad een beloning. Met een adblocker verdwijnen ze en staat de uitleg in de instellingen.
- Leesbaarheid in het kleine venster (821×462) en op volledig scherm.
- Als het kan: even op een Chromebook spelen (moet vlot lopen met 4 GB).
- Twee punten om bewust naar te kijken (zie SPECS hoofdstuk 2): de rewarded knoppen staan in het spelscherm (in een idle-game is dat altijd zo), en de power-ups van de marskramer zijn alleen via een ad te krijgen. Keurt de QA ze af, dan krijgen de power-ups een goudprijs.
- De naam: "Brewmastery: Tavern Simulator" (Steam) lijkt erop. CrazyGames wil geen namen die makkelijk met een andere game te verwarren zijn; als de QA erover begint, is een kleine naamswijziging nodig.

## 6. Basic Launch en daarna

- Basic Launch duurt minstens 7 dagen en 500 plays (hooguit 21 dagen). Ads staan uit; de game verbergt dan zelf de rewarded knoppen.
- CrazyGames kijkt naar de gemiddelde speeltijd (goed: 10+ minuten), dag-1-retentie (goed: 10-15%) en conversie (wie langer dan een minuut speelt; goed: 80%+). De cijfers staan in het Developer Dashboard.
- Is het goed genoeg, dan nodigt CrazyGames uit voor **Full Launch**: dan gaan de ads aan (ze zitten er al in) en telt de account-koppeling (zit er al in via de data-module).
- Ideeën voor na de lancering staan in SPECS hoofdstuk 12 (stap 24 en verder, voorstellen) en in [IDEAS.md](IDEAS.md).
