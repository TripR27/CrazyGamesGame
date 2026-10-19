# Indienen bij Poki

Het indienpakket voor de Poki-versie van Brewmaster's Tavern (stap 25). CrazyGames keurde de game af (gemeld door de eigenaar op 2026-10-19); deze versie speelt precies hetzelfde, met Poki's SDK en Poki's regels voor ads. De eisen zelf staan in [SPECS.md](SPECS.md), hoofdstuk 2b. De teksten die je in het formulier plakt, zijn Engels; de rest van dit bestand is Nederlands.

## 1. Kosten en voorwaarden (nagekeken op 2026-10-19)

- **Indienen is gratis.** Poki verdient aan de advertenties en deelt die opbrengst.
- **Opbrengst:** spelers via Poki.com of Poki's marketing: 50/50. Spelers die jij zelf meebrengt (je eigen link, je community): 100% voor jou.
- **Alleen op Poki op het web:** de game mag op geen ander webportaal of andere aggregator staan (dus niet meer op CrazyGames, itch.io in de browser, GameDistribution enzovoort). Steam, app-stores en consoles mogen wel. Er bestaat ook een niet-exclusieve deal met een eenmalig bedrag, maar dan zonder opbrengstdeling en marketing.
- **Geen open upload:** Poki kiest. Elke game wordt door mensen bekeken en daarna getest met echte spelers (Player Fit Test, dan Web Fit Test van een paar dagen), dan een soft release en, als de cijfers goed zijn, de wereldwijde release. Reken op een maand of meer.
- **Waar Poki op afwijst** (volgens ontwikkelaars): zwakke eerste drie minuten, een te grote download (onze 1,35 MB is ruim goed), slecht op mobiel, ingewikkelde besturing, onaf gevoel.

Bronnen: developers.poki.com (Working with Poki, Requirements & Quality, HTML5 SDK, Share your game).

## 2. Wat klaarstaat

| Onderdeel | Waar | Hoe opnieuw maken |
|---|---|---|
| Game-bestanden voor Poki (zip, `index.html` bovenaan, 16 bestanden, 1,35 MB) | `release/brewmasters-tavern-poki.zip` (niet in git) | `npm run build:poki` en dan `npm run zip:poki` |
| Vierkante thumbnail (Poki vraagt minstens 628×628, zonder ronde hoeken) | `art/covers/cover-square.png` (800×800) | zie [SUBMISSION.md](SUBMISSION.md) |
| Bewegende thumbnail / gameplay-video | `release/trailer-landscape.mp4` (niet in git) | `npm run trailer` |
| Beschrijving en besturing | paragraaf 4 | |

Lokaal proberen met Poki's SDK: `npm run dev:poki` (de SDK draait dan in zijn testmodus, met test-ads, en logt elke aanroep in de console).

## 3. Stappen (door de eigenaar)

1. Ga naar developers.poki.com en kies **Share your game** (het formulier op `/guide/share`).
2. Vul je gegevens in (naam, e-mail, of je een bedrijf hebt, land, teamgrootte) en kies "This is our first game" als je nog niets uitbracht.
3. Titel, korte beschrijving en engine: zie paragraaf 4 (engine: **Phaser**, HTML5).
4. **Speelbare versie of gameplay-video.** Poki wil een browserversie zonder inlog. Het makkelijkst: upload de zip in de **Poki Inspector** (inspector.poki.dev) en gebruik die link, of geef de gameplay-video (`release/trailer-landscape.mp4`). Zet de game niet publiek op een ander portaal: dat breekt de web-exclusiviteit.
5. **Drie screenshots** van het spel (PNG, JPEG of WebP, elk hooguit 5 MB). Bijvoorbeeld: een volle taverne, het receptenboek of de winkel, en een held met het baasgevecht. Maak ze met `Win+Shift+S` in een groot venster.
6. Waarom de game bij Poki past: zie paragraaf 4.
7. Al eerder uitgebracht? **Nee** (CrazyGames keurde hem af, hij heeft nergens online gestaan).
8. Lees de Content & Brand Guidelines, vink ze aan en dien in.
9. Zegt Poki ja, dan test je eerst zelf in de Inspector (paragraaf 5) en vraag je daar de review aan. Daarna volgen de spelerstests.

## 4. Teksten om te plakken (Engels)

**Title:** Brewmaster's Tavern

**Short description:**
Brew absurd potions, serve picky knights, elves and dwarves, and turn a shabby shack into a legendary tavern.

**Description, controls and tags:** dezelfde als in [SUBMISSION.md](SUBMISSION.md), paragraaf 3. Voor Poki bij de besturing: "Mouse or touch."

**Why is your game a good fit for Poki players?**
It is easy to start and hard to put down: you are brewing and serving within seconds, with a grumpy talking cauldron that teaches by doing instead of walls of text. Every few minutes something new opens up (a recipe to discover, a room, a hire, a hero trip with a boss fight), and the tavern keeps earning while you look at the shop, so short and long sessions both work. Rewarded ads are always the player's choice (a peddler with a treat, a top-up in the shop), never needed to progress. It is small (1.4 MB), loads fast and plays with mouse or touch.

## 5. Nakijken in de Poki Inspector

- De game start meteen in de taverne; de tutorial is over te slaan.
- Events: `gameLoadingFinished` na het laden, `gameplayStart` pas bij de eerste klik, `gameplayStop` bij het openen van het menu of de instellingen, bij een verborgen tab en tijdens een ad. Nooit twee keer hetzelfde event na elkaar.
- **Midgame-ad (`commercialBreak`):** bij het sluiten van het menu of de instellingen, als een held terugkomt en na een nieuw niveau. Nooit tijdens een tutorial-les, een keuzekaartje of een baasgevecht. Hoe vaak er echt een ad komt, bepaalt Poki; de game heeft geen eigen timer.
- **Rewarded (`rewardedBreak`):** de 🎬-knoppen (marskramer, winkel, welkom-venster) geven alleen na een volledig bekeken video iets. "No thanks" of de gewone knop staat erboven en is even groot; geen enkele ad-knop is groen.
- **Geluid** gaat uit zodra een ad begint en weer aan erna.
- **Adblocker:** de 🎬-knoppen en de marskramer verdwijnen, zonder eigen melding (Poki toont zijn eigen).
- **Incognito:** de game speelt ook als opslaan niet kan (dan alleen zonder save).
- **Pijltjes, spatie en scrollwiel** laten de Poki-pagina niet bewegen; de lijsten in het menu scrollen wel.
- **Telefoon:** staand verschijnt "Turn your device sideways to play."; liggend speelt de game (tikken werkt zoals klikken).

## 6. Aandachtspunten

- **Mobiel scherm vullen:** Poki wil dat de game op een telefoon het hele scherm vult. De game is 16:9 en schaalt mee; op een telefoon die breder is dan 16:9 blijven links en rechts smalle donkere balken (in de kleur van de taverne). Keurt Poki dat af, dan is een aparte stap nodig waarin de achtergrond tot de rand doorloopt.
- **Staand spelen** kan niet; de game vraagt om de telefoon te draaien. Poki staat landscape alleen toe.
- **Leesbaarheid op een telefoon:** de tekst groeit mee in kleine schermen (stap 22f), maar is nog niet op een echte telefoon bekeken.
- **Thumbnails:** Poki wil voor de wereldwijde release een stilstaande én een bewegende thumbnail. De vierkante cover en de trailer zijn een begin; volg Poki's thumbnail-gids voor de precieze maten zodra je in het portaal zit.
- **Saves:** op Poki staat de save in de browser (localStorage), niet in een account. Export en import in de instellingen blijven het vangnet.
