# SPEC: Brewmaster's Tavern (technische specificatie)

> Dit document hoort bij [GAME_ANALYSE.md](GAME_ANALYSE.md) (het "wat"). Dit is het "hoe". Ideeën die nog niet in het plan zitten (weekly leaderboard, punten voor de art-pass) staan in [IDEAS.md](IDEAS.md).
> **Regel voor Claude:** lees dit bestand volledig vóór je code schrijft of wijzigt. Werk één stap tegelijk af (hoofdstuk 12) en stop daarna.

---

## Voortgangsoverzicht

*Wordt na elke stap bijgewerkt. Details per stap: logboek (hoofdstuk 14). Uitleg per stap: hoofdstuk 12.*

**Nu bezig:** niets. Alles tot en met stap 21e staat op `main` (de eigenaar mergede 21a t/m 21e zelf op 2026-10-12 en vond de art "top"). **Laatst afgerond stap:** 21e (panelen in hout en pixel-iconen). **Volgende stap:** 22a (winkel geleidelijk en uitverkocht weg). Na de art-pass gaf de eigenaar gameplay-feedback (2026-10-12): die staat in hoofdstuk 4, "Gameplay-ronde na de art-pass", en is verdeeld over de nieuwe stappen 22a, 22b en 22c; de oude stap 22 (Performance, QA en indienklaar) heet nu 22e. Daarna wilde de eigenaar meer advertenties en rewarded beloningen: hoofdstuk 4, "Meer advertenties en rewarded beloningen", stap 22d. Idle zit nu op gemiddeld 34,7%; het doel gaat in 22c omhoog (zie hoofdstuk 4).

Status: ⬜ te doen · 🔄 bezig · ✅ klaar

| # | Stap | Status | Branch |
|---|---|---|---|
| 1 | Project opzetten | ✅ | `step-01-project-setup` |
| 2 | Core (getallen, state, tick) | ✅ | `step-02-core` |
| 3 | Save-systeem | ✅ | `step-03-save-system` |
| 4 | i18n + data-schema | ✅ | `step-04-i18n-data-schema` |
| 5 | Taverne-scene (placeholder) | ✅ | `step-05-tavern-scene` |
| 6 | Klanten | ✅ | `step-06-customers` |
| 7 | Brouwen en serveren | ✅ | `step-07-brew-and-serve` |
| 8 | Interactieve tutorial (basis) | ✅ | `step-08-tutorial` |
| 9 | Economie en upgrades | ✅ | `step-09-economy-upgrades` |
| 10a | Personeel (brouwer en serveerster) | ✅ | `step-10a-staff` |
| 10b | Offline-voortgang | ✅ | `step-10b-offline` |
| 11a | Plekken en geleidelijke klanten | ✅ | `step-11a-seats` |
| 11b | Voorkeuren en drankeffecten | ✅ | `step-11b-effects` |
| 11c | Reputatieniveaus, gates en VIP-klanten | ✅ | `step-11c-reputation` |
| 12 | Receptenontdekking + receptenboek | ✅ | `step-12-recipe-book` |
| 13 | Balans-simulator | ✅ | `step-13-balance-simulator` |
| 13b | Speelbaarheid (UX-ronde 1) | ✅ | `step-13b-ux` |
| 13c | Ingrediënten in de winkel | ✅ | `step-13c-ingredients` |
| 14a | Kamers (bovenverdieping) | ✅ | `step-14a-rooms` |
| 14b | Decoraties (goud-sink) | ✅ | `step-14b-decorations` |
| 14c | Legenda van effecten in het receptenboek | ✅ | `step-14c-effect-legend` |
| 14d | Night Shift: offline verdienen kopen | ✅ | `step-14d-night-shift` |
| 15a | Gildekamer, helden en eerste expeditie | ✅ | `step-15a-guild-heroes` |
| 15b | Kerker-ingrediënten als voorraad en nieuwe recepten | ✅ | `step-15b-dungeon-ingredients` |
| 15c | Uitrusting | ✅ | `step-15c-gear` |
| 16 | Heldenketel, drankjes meegeven en keuzekaartjes | ✅ | `step-16-hero-cauldron-cards` |
| 16b | Baasgevecht (timing-minigame) | ✅ | `step-16b-boss-fight` |
| 16c | Quartermaster: helden op auto en offline | ✅ | `step-16c-quartermaster` |
| 17 | Prestige | ✅ | `step-17-prestige` |
| 18a | Statistieken en achievements | ✅ | `step-18a-achievements` |
| 18b | Dagelijkse bonus | ✅ | `step-18b-daily-bonus` |
| 18c | Instellingen | ✅ | `step-18c-settings` |
| 19 | Audio | ✅ | `step-19-audio` |
| 20 | CrazyGames SDK | ✅ | `step-20-crazygames-sdk` |
| 19b | Audio-bestanden (echte geluiden en muziek) | ✅ | `step-19b-audio-files` |
| 21a | Pixel-art: pijplijn, achtergrond en ketel | ✅ | `step-21a-pixel-pipeline` |
| 21b | Pixel-art: klanten met animaties | ✅ | `step-21b-customers` |
| 21c | Pixel-art: ingrediënten, helden, kamers en decoraties | ✅ | `step-21c-items-heroes-rooms` |
| 21d | Pixel-art: effecten, lettertype, wolkjes en mascotte | ✅ | `step-21d-effects-style` |
| 21e | Panelen restylen en pixel-iconen in plaats van emoji | ✅ | `step-21e-panels-icons` |
| 22a | Winkel geleidelijk en uitverkocht weg | ⬜ | |
| 22b | Eigen ketel voor de brouwer en drankjes weggooien | ⬜ | |
| 22c | Sneller personeel (balans) | ⬜ | |
| 22d | Meer advertenties en rewarded beloningen | ⬜ | |
| 22e | Performance, QA, indienklaar (was 22) | ⬜ | |
| 23 | Indienen en na-lancering | ⬜ | |

---

## 1. Harde regels (altijd van toepassing)

1. **Bestandsgrootte: richtlijn 150 tot 300 regels** per bestand in `src/`, `tests/` en `scripts/` (geteld als ruwe regels), zolang de functies in het bestand bij elkaar horen. ESLint waarschuwt vanaf 300 regels en `scripts/check-lines.mjs` faalt vanaf 350. Splits pas als een bestand twee echt verschillende redenen heeft om te veranderen, niet om de regeltelling. Maak geen nieuw bestand of nieuwe map voor minder dan ~50 regels. Uitgezonderd: config in de projectroot, lockfiles, `.md`-bestanden en stylesheets (`.css`).
2. **Plat en per feature (zie hoofdstuk 4 en 9).** Een feature is één map met logica, data en view; geen `index.ts`-barrels, geen wiring-, dispatcher- of manager-lagen, geen interface met één implementatie (behalve tijd, RNG, opslag en platform). Pragmatisch SOLID: één reden om te veranderen per feature-bestand, uitbreiden via data.
3. **Eén stap per keer.** Geen code buiten de scope van de gevraagde stap.
4. **Een stap is pas klaar als `npm run check` slaagt** (typecheck + lint + regelgrens + tests) en de "Klaar wanneer"-punten van de stap kloppen.
5. **Geen nieuwe dependencies zonder te vragen.** De toegestane lijst staat in hoofdstuk 3.
6. **Alleen `*-view.ts`, `*-scene.ts` en `main.ts` kennen Phaser en DOM.** Alle andere bestanden zijn puur TypeScript (zie hoofdstuk 4).
7. **Alle tekst die een speler ziet** staat in i18n-bestanden, nooit hardcoded in logica of UI.
8. **Geen externe links, geen externe advertenties, geen externe login, geen externe fonts/CDN-requests** in de game (CrazyGames-regel + laadtijd). Enige uitzondering: het SDK-script van CrazyGames.
9. **Na elke stap wordt SPECS.md bijgewerkt** (voortgangsoverzicht bovenaan, vinkje in hoofdstuk 12, logboek in hoofdstuk 14 met wat/waarom/wat nog). Zonder die update is de stap niet klaar (hoofdstuk 10).
10. **Git:** één branch per stap, een paar logische commits (ongeveer 2 tot 3), mergen naar `main` pas na jouw akkoord; de eigen branch committen en pushen mag zonder te vragen (besluit 2026-10-12, hoofdstuk 11).

### Hoe dwing je dit af (voor jou)
- **`CLAUDE.md`** in de projectroot (wordt in stap 1 gemaakt, en ik maak hem nu al aan) wordt automatisch bij elke sessie geladen en verwijst hiernaar. Dat is de betrouwbaarste manier.
- **`npm run check`** bewaakt de regelrichtlijn: ESLint waarschuwt vanaf 300 regels, `scripts/check-lines.mjs` waarschuwt vanaf 301 en **faalt vanaf 351 regels**, en `scripts/check-cycles.mjs` faalt op importkringen tussen bestanden. Wat niet door de check komt, is niet klaar.
- Optioneel in stap 1: een hook in Claude Code-instellingen die na elke bestandswijziging de regelcheck draait (kan via de `update-config` skill; vraag erom).
- Jij kunt altijd zeggen: "Doe stap N", en ik lees eerst dit bestand.

---

## 2. Geverifieerde CrazyGames-eisen

Gecontroleerd op 2026-10-06 in de officiële docs (docs.crazygames.com). Opnieuw checken vlak voor indienen (stap 22e).

| Eis | Waarde | Gevolg voor ons |
|---|---|---|
| Initiële download | **≤ 50 MB** (≤ 20 MB voor mobiele homepage) | Streefdoel: **< 8 MB totaal**. Geen grote audio/afbeeldingen. |
| Totale grootte | max 250 MB (50 MB zonder SDK) | Geen probleem |
| Aantal bestanden | max 1500 | Spritesheets/atlassen gebruiken |
| Paden | alleen **relatief** | Vite `base: './'` |
| Browsers | Chrome en Edge verplicht | Testen in beide |
| Hardware | moet vlot draaien op **Chromebook, 4 GB RAM** | Lage geheugen-/CPU-footprint, geen zware shaders |
| Oriëntatie | landscape op desktop | 16:9 ontwerp |
| Content | PEGI 12 | Absurde humor prima, geen geweld/gokken met echt geld. Casino-hoek = nep-munten, mild houden |
| Basic Launch | SDK optioneel, **monetisatie uit** | Eerste lancering kan zonder SDK |
| Full Launch | SDK verplicht, ads via SDK, werkt met AdBlock, speler **landt direct in gameplay**, voortgang gekoppeld aan CrazyGames-account | Zie SDK-eisen hieronder |
| SDK-script | `https://sdk.crazygames.com/crazygames-sdk-v3.js`, daarna `await window.CrazyGames.SDK.init()` | Wrapper in `src/platform/` |
| Gameplay-events | `game.gameplayStart()` bij spelen/hervatten, `game.gameplayStop()` bij elke onderbreking (menu, pauze, ad). `game.loadingStart()`/`loadingStop()` rond laden | Gekoppeld aan focus/panel/ad-state |
| Ads | `ad.requestAd("midgame" \| "rewarded", { adStarted, adFinished, adError })`. **Spel pauzeren en geluid dempen bij `adStarted`**, hervatten bij finished/error. **Min. 3 minuten** tussen midgame ads. Foutcodes: `adsDisabledBasicLaunch`, `unfilled`, `adblock`, `adCooldown`, `other` | Alleen op natuurlijke momenten. Bij `adblock`/`unfilled`: gewoon doorspelen, bij rewarded geen beloning. `ad.hasAdblock()` beschikbaar |
| Data-module | zelfde API als localStorage (`getItem/setItem/removeItem/clear`), **1 MB limiet**, debounce 1 s, niet-ingelogd = localStorage en later gesynct | Save-bestand klein houden (< 200 KB) |
| Geluid | `game.addSettingsChangeListener` met `muteAudio` (heeft **voorrang** op onze eigen instelling); iOS-eis niet relevant (alleen desktop), maar AudioContext pas starten na eerste klik | Audio-laag luistert hiernaar |
| Taal | `user.systemInfo.locale` kan taal bepalen | Standaard Engels; alleen auto-kiezen als vertaling bestaat |
| Gebruiker | `user.getUser()`, `isUserAccountAvailable`, `showAuthPrompt()` | Gebruikersnaam kleine HUD-weergave; geen eigen login |
| Privacy | melding nodig als we extra persoonsdata verzamelen | We verzamelen niets extra |

**Nog niet gecontroleerd (doen in stap 22e):** exacte thumbnail-formaten, de CrazyGames QA/preview-tool, beoordelingscriteria voor Basic → Full Launch, en of een externe analytics-oplossing is toegestaan (standaard: **geen analytics**).

---

## 3. Tech stack

| Onderdeel | Keuze | Versie (npm, 2026-10-06) | Opmerking |
|---|---|---|---|
| Taal | TypeScript, `strict: true`, geen `any` | **6.0.3** (niet 7.x) | `typescript-eslint` ondersteunt alleen TypeScript < 6.1. Pas upgraden als dat verandert. |
| Engine | **Phaser 4** | 4.2.x (stabiel sinds april 2026) | Fallback: Phaser 3.90. Check bundlegrootte in stap 1. |
| Build/dev | Vite | 8.x | `base: './'`, productiebuild naar `dist/` |
| Grote getallen | `break_infinity.js` | 2.2.x | Opslaan als string in save |
| Tests | Vitest | 5.x | Voor alle pure logica (alles behalve `*-view.ts`/`*-scene.ts`) |
| Lint | ESLint (flat config) + `typescript-eslint` | 10.x | Waarschuwing `max-lines: 300`, fout `max-lines-per-function: 60` |
| UI | **Vanilla TypeScript + DOM** voor HUD/menu's, Phaser-canvas voor de taverne | n.v.t. | Geen React/Vue (bundlegrootte, eenvoud) |
| Opslag | via `Storage`-adapter: SDK data-module of `localStorage` | n.v.t. | |
| Audio | Web Audio API (geen Phaser-audio, geen Howler) | n.v.t. | *Sinds stap 19b:* de effecten en de muziek zijn OGG-bestanden in `public/audio/`, door de browser gedecodeerd en afgespeeld met de Web Audio API (zie hoofdstuk 4, Audio) |

Alles buiten deze lijst: eerst vragen.

**Waarom niet Unity/Godot:** grotere downloads en laadtijd, terwijl ≤ 50 MB en snel laden harde eisen zijn.

---

## 4. Architectuur

### Lagen en mappen (plat, per feature; besluit 2026-10-07)

```
main.ts
   ↓
app/              world.ts (createWorld), Phaser-scene, DOM-schil
   ↓
features          customers/ brewing/ recipes/ serving/ staff/ economy/ rooms/ decor/
                  reputation/ offline/ tutorial/ heroes/ prestige/ achievements/ daily/ settings/ audio/ platform/
   ↓
shared/           state, events, time, numbers, random, pool, targets, content, purchases, save, browser
```

- Afhankelijkheid gaat van boven naar beneden. Features mogen elkaar importeren, maar **nooit in een kring tussen bestanden**: `npm run cycles` (`scripts/check-cycles.mjs`, onderdeel van `npm run check`) faalt erop. Type-only imports (`import type`) tellen niet mee, dus een feature-bestand mag `World` uit `app/world.ts` als type importeren.
- **Alleen `*-view.ts`, `*-scene.ts` en `main.ts` importeren `phaser` of gebruiken `document`/`window`.** Alle andere bestanden (ook `app/world.ts`) zijn puur, dus testbaar met Vitest, bruikbaar door de simulator en geschikt voor de offline-berekening. Pure logica importeert nooit een `-view`-bestand. ESLint bewaakt dit met `no-restricted-imports` en `no-restricted-globals` op bestandsnaam. Uitzondering buiten de views: `shared/browser.ts` (loop-driver, autosave, localStorage en debug-commando's), want dat is de enige plek waar `core`-code de browser raakt.
- Views lezen de state en roepen **feature-functies** aan (`clickCustomer(world, id)`, `buyUpgradeById(world, id, amount)`). Ze berekenen zelf geen spelregels. Meldingen aan de tutorial die alleen een UI-feit zijn (`shop:opened`, `book:closed`) zenden de views zelf uit met `world.bus.emit`.
- Services als `platform/`, `audio/` en `i18n/` mogen door views gebruikt worden; pure logica gebruikt `platform/` alleen via een interface.

```
crazyGamesGame/
  CLAUDE.md               (blijft in de hoofdmap: Claude Code laadt hem automatisch)
  docs/                   SPECS.md, GAME_ANALYSE.md, IDEAS.md, later ASSETS.md
  index.html  package.json  vite.config.ts  tsconfig.json  eslint.config.js
  scripts/        check-lines.mjs, check-cycles.mjs, simulate.mjs (start de balans-simulator uit src/dev/), pixel/
  public/         assets (svg, spritesheets, audio)
  src/
    main.ts  config.ts      opstart (kort!)
    shared/                 state.ts (GameState + store), events.ts (bus, GameEvents, debug), time.ts (clock, ticker),
                            numbers.ts (Decimal, format), random.ts (rng + vrolijke meldingen), pool.ts, targets.ts,
                            content.ts (Rarity, Effect, textKey), purchases.ts (eenmalige aankopen), save.ts (+ storage),
                            browser.ts (loop-driver, autosave, localStorage; de enige browser-koppeling)
    app/                    world.ts (createWorld), tavern-scene.ts (Phaser), backdrop-view.ts, layout.ts, ui-model.ts,
                            hud-view.ts, panels-view.ts, viewport-view.ts (DOM-schil)
    customers/  brewing/  recipes/  serving/  staff/  economy/  rooms/  decor/  reputation/  offline/  tutorial/  heroes/  prestige/
    achievements/  daily/  settings/  audio/  platform/
                            per feature: <feature>.ts (regels) en *-view.ts (Phaser of DOM); daarnaast alleen als het
                            echt groot of cyclus-brekend is: *-data.ts (recepten, upgrades, tutorialstappen, klanten) en
                            *-model.ts (pure view-models, bijv. economy/shop-model.ts)
    i18n/                   translator.ts, en.ts (met en-shop.ts, en-heroes.ts en en-achievements.ts per gebied; later nl.ts)
    dev/                    simulator.ts, simulator-report.ts
  tests/                    één bestand per feature (spiegelt de featuremappen); flows/ (spelen in de echte `World`), content/ (validatie van de data-tabellen), fixtures.ts
```

Bestandsnamen: `kebab-case.ts`. Regelrichtlijn en anti-over-engineering-regels: hoofdstuk 1 en 9.

### World

`createWorld({ store, bus, rng, clock, content })` in `app/world.ts` bouwt alles één keer: `{ store, bus, rng, clock, content, floor, station, selection, targets, tutorial, offline }`. `content` bundelt de data-tabellen (recepten, klanttypes, upgrades, kamers, decoraties, ingrediënten) en is in tests te vervangen door een kleine catalogus. Spelersacties en dingen die de views nodig hebben zijn gewone functies per feature die `world` krijgen (of met `Pick<World, ...>` alleen de delen die ze gebruiken, zodat tests geen volledige wereld hoeven te bouwen): `clickIngredient`, `buyUpgradeById`, `clickCustomer`, `shelfIds`, `roomOfferById`. Rekenfuncties (prijs, kosten, niveau, `matchRecipe`) blijven puur en nemen waarden.

**Tick-volgorde:** `createWorld` start de tick-systemen in vaste volgorde en die volgorde van de aanroepen is de volgorde waarin ze draaien: tutorial (binnen `createTutorial`), klanten, brouwen, personeel, helden (sinds stap 15a), Auto van de helden (sinds stap 16c). De RNG-aanroepvolgorde hangt daar vanaf; de simulator (`npm run simulate -- 60 1`) moet voor en na een wijziging byte-identiek zijn.

Views krijgen de wereld in `main.ts` (`createGame('game', world)`, `mountUi(root, world, ...)`). De views lezen de echte `content`-tabellen uit de feature-bestanden; `world.content` is bedoeld voor logica en tests.

### State

- **Eén** `GameState`-object, volledig JSON-serialiseerbaar (Decimal als string bij opslaan).
- Wijzigingen alleen via acties in de features (`(world, params) => void`). Na wijziging roept de store `notify()` aan; UI abonneert zich.
- **Niet in de state:** wie er op dit moment in de taverne zit (`CustomerFloor` in `customers/`) is runtime en wordt niet opgeslagen; de taverne begint bij elk laden leeg.
- State bevat o.a.: `meta` (versie, laatst-gezien-tijd), `currencies`, `reputation`, `recipesDiscovered`, `ingredients`, `upgrades`, `staff`, `rooms`, `heroes` (per klasse, met de lopende expeditie en haar absolute eindtijd; sinds stap 15a), `ingredientStock` (kerker-ingrediënten; sinds stap 15a), `prestige`, `achievements`, `settings`, `stats`.

### Tijd en tick

- Vaste simulatiestap van **100 ms**, losgekoppeld van framerate.
- Tijd wordt altijd gemeten met `Date.now()`-verschil (accumulator), niet met "aantal ticks", omdat achtergrondtabs door de browser worden afgeknepen.
- Bij terugkeren (visibilitychange of laden) wordt het gemiste tijdsverschil verwerkt door `offline/` met **formules** (niet door alle ticks te simuleren). Bovengrens = offline-limiet (basis 2 uur, uitbreidbaar via de stat `offlineHours`). Sinds stap 14d telt afwezigheid alleen met Night Shift (stat `offlineShare`, zie Besluiten uit de ideeënronde). Gebouwd in stap 10b: een gat in dezelfde sessie (de ticker meldt het via `onGap`) en de tijd sinds de laatste save lopen door dezelfde functie, `handleAway` in `offline/offline.ts`.
- Expedities slaan een absolute `endsAt` op en worden bij laden direct afgehandeld (sinds stap 15a: bij de eerste tick na het laden, `returnHeroes` in `heroes/heroes.ts`).

### Save

- Sleutel `bt_save`, inhoud: `{ version, savedAt, state }` als JSON-string.
- `migrate(save)` voert versie-stappen uit (`v1 → v2 → ...`), zodat updates nooit voortgang breken.
- Autosave elke 30 s, bij belangrijke acties (aankoop, prestige: via de event `saveRequested`) en bij `visibilitychange`/`beforeunload`. Elke autosave zet eerst `meta.lastSeenAt` (nodig voor offline-voortgang in stap 10).
- Een onleesbare of te nieuwe save wordt **niet** weggegooid: de ruwe tekst gaat naar `bt_save_backup` en er start een nieuw spel (`status: recovered`).
- Bij laden wordt de save samengevoegd met de defaults (`reconcile`): ontbrekende velden krijgen een default, onbekende velden vallen weg, velden van het verkeerde type vallen terug op de default. **Regel:** een leeg object in de default-state (`{}`) betekent een open lijst (bijv. upgrade-niveaus per id); de opgeslagen inhoud blijft dan volledig behouden.
- Handmatige **export/import** als tekst (base64) in Settings, als vangnet (gebouwd in stap 18c).
- Grootte bewaken: < 200 KB (SDK-limiet is 1 MB).
- Alle opslag via een `StorageAdapter`-interface: `localStorageAdapter` (dev/Basic Launch) en `crazyGamesAdapter` (SDK data-module).

### Tutorial (interactief)

Doel: een nieuwe speler leert de basis **door het te doen**, in de echte game, zonder tekstmuur en zonder apart scherm (past bij "land direct in gameplay" van CrazyGames).

- **Statemachine in `tutorial/tutorial.ts`** (puur TS, getest met Vitest). Stappen zijn data in `tutorial/tutorial-steps.ts` (sinds stap 15b staan de lessen voor later in een run, kamer tot en met buit, in `tutorial/tutorial-later-steps.ts`): `{ id, lesson, startWhen?, target, completeOn, needsLiveState? }`. De tekst is de i18n-sleutel `tutorial.<id>.text` (geen `textKey`-veld; dezelfde conventie als andere content).
  - `startWhen`/`completeOn` luisteren naar **echte spel-events** uit de event-bus (bijv. `ingredient:clicked`, `brew:done`, `customer:served`, `upgrade:bought`) of naar een state-conditie (bijv. "genoeg goud voor eerste upgrade").
  - De speler klikt dus nooit op "volgende"; de tutorial gaat verder wanneer de speler de actie echt uitvoert.
- **Registry van doelen (`target`):** `shared/targets.ts`. DOM-elementen en Phaser-objecten melden zich aan met een id en een functie die hun huidige positie in ontwerp-pixels geeft (`ingredient:<id>`, `customer:<id>`, `cauldron`, `hud-gold`, later `shop-button`). Bewegende doelen worden gevolgd. Een stap kan ook een **gids-alias** als doel hebben (`guide-ingredient`, `guide-customer`) die `tutorial/tutorial-guide.ts` tijdens het spelen omzet naar het juiste doel, zodat de tutorial altijd het drankje van een echt wachtende klant uitlegt.
- **Tijdens een les:** maximaal **één klant** in de taverne en het **geduld staat stil** (de balk blijft vol), zodat niemand midden in de les vertrekt. Daarna loopt alles normaal. Dit geldt alleen zolang een stap **zichtbaar** is: een les die nog op haar moment wacht (de upgrade-hint wacht op genoeg goud) houdt het spel niet tegen.
- **UI in `tutorial/tutorial-view.ts`:** gedimde overlay met een "spotlight"-gat om het doel, een pulserende pijl en een korte spraakbel van een mascotte. Maximaal 1 à 2 korte zinnen per stap, in humoristische toon (i18n-sleutels).
- **Mascotte (werktitel):** een chagrijnige pratende ketel. Placeholder tot stap 21.
- **Nooit blokkerend of vervelend:**
  - Altijd een zichtbare "Skip"-knop.
  - De rest van de game blijft bedienbaar; een verkeerde klik breekt niets.
  - Doet de speler de actie van een latere stap al, dan wordt die stap (en elke eerdere) automatisch afgevinkt.
  - Hoort tot `gameplayStart`-tijd (geen aparte "pauze").
- **Opslaan:** voortgang staat in `state.tutorial` (`completedSteps`, `skipped`) en overleeft herladen.
- **Opnieuw afspelen:** via Settings (stap 18), tot dan via debug-commando.
- **Volgorde van de lessen (nu):** basis, voorkeur (♥), upgrade, trophy (sinds stap 18a), dagbonus (sinds stap 18b), plekken, receptenboek, ingrediënt (sinds stap 13c), personeel, instellingen (sinds stap 18c), VIP, kamer (sinds stap 14a), decoratie (sinds stap 14b), held (sinds stap 15a), buit (sinds stap 15b), uitrusting (sinds stap 15c), heldendrankje en keuzekaartje (sinds stap 16), baas (sinds stap 16b), Auto (sinds stap 16c), prestige (sinds stap 17). Ze lopen één voor één.
- **Navigatiestappen (sinds stap 13b):** een stap met `onlyWhenShown` (het paneel naar een tabblad openen, de ♥-klant bedienen) wordt alleen afgevinkt door zijn event terwijl hij zelf in beeld is; hij vinkt dus nooit vooruit (en daarmee eerdere lessen) af. Staat de speler al waar de stap om vraagt zodra hij verschijnt (tabblad al open), dan is hij meteen klaar (via `alreadyHolds`, ook voor `shop:opened` en `book:opened`). Zonder deze regel sloeg het vroeg openen van het tabblad Recipes de upgrade- en plekkenlessen over.
- **In beeld scrollen (sinds stap 14b):** een doel in een scrollende lijst (een koopknop in de winkel) geeft bij het aanmelden ook een `reveal`-functie mee (`shared/targets.ts`). Zodra de pijl naar een nieuw doel springt, roept `tutorial/tutorial-view.ts` die één keer aan; de winkel scrolt de knop dan in beeld (`scrollIntoView`, alleen zo ver als nodig). Zonder dit wees de pijl onder het paneel zodra de winkel langer werd dan het paneel.
- **Doelen in het paneel (sinds stap 13b):** `panel-button` (de uitklapknop), `tab:<id>` (een tabblad), en de gids-aliassen `guide-shop` en `guide-book`: eerst de knop, dan het tabblad. De winkel-aliassen (`guide-upgrade`, `guide-seats`, `guide-staff`) wijzen eerst de weg naar het Shop-tabblad. Op de bar: `drink:<slot>` en de alias `guide-drink`.
- **Fasering:** basis-tutorial (ingrediënt → ketel → wachten → serveren → eerste goud) in **stap 8**. Elke latere stap met een nieuwe functie levert een **korte contextuele hint** die pas verschijnt zodra de functie voor het eerst beschikbaar is (eerste upgrade, eerste medewerker, eerste ontdekking, eerste held, enz.). Een les kan starten op een **toestand** door een event uit te zenden zodra die toestand ontstaat (bijv. `upgrade:affordable`); een toestand die al geldt bij laden telt via `alreadyHolds` als gestart.
- **Tests:** stappen volgen elkaar correct op, overslaan werkt, out-of-order acties lopen niet vast, herladen hervat op de juiste stap.

### Economie (code-kant)

- Upgradekosten: `kosten(n) = round(basis × groeifactor^n)` (hele munten), groeifactor per upgrade in `economy/upgrade-data.ts`. Een pakket van k niveaus kost de geometrische som in één formule (`economy/upgrades.ts`), zodat de getoonde prijs voor x10 en max exact is wat er afgaat. Niveaus staan in `state.upgrades` (open map id → niveau).
- Multipliers worden samengevoegd in één functie `getMultipliers(state)` (`economy/upgrades.ts`) zodat bronnen (prestige, upgrades, achievements, events) op één plek optellen/vermenigvuldigen. Eerst telt 'add', dan 'multiply'. Basiswaarden per stat staan in `economy/upgrade-data.ts`; de bar en de ketel lezen hun waarden via `app/world.ts`.
- Alle balansgetallen staan in de `*-data.ts`-bestanden of als constanten bovenaan een feature-bestand, nooit midden in logica.

### Klanteninstroom en plekken (besluit eigenaar, 2026-10-06; gebouwd in stap 11a)

- Klanten komen **geleidelijk**: aan het begin niet meteen veel en niet snel achter elkaar. De eerste klant komt na 3 seconden (`SPAWNING.firstDelayMs`), daarna gemiddeld elke 12 seconden, korter met reputatie (2% van de basis per punt, nooit onder 3 s). Een vrijgekomen plek wordt niet meteen gevuld: de volgende klant heeft minstens `refillDelayMs` (2,5 s) nodig om binnen te lopen.
- De speler begint met **1 plek**: maximaal **1 klant tegelijk** in de taverne. Extra plekken worden gekocht met de upgrade **Extra Seat** (stat `seats`, basis 1, +1 per niveau, kosten 40 met groei 1,8, max 6 niveaus). De 7 klantplekken beneden (`CUSTOMER_SLOTS`) zijn de bovengrens van Extra Seat; een test bewaakt dat. Kamers (stap 14a) zetten er plekken bóven bij (zie Kamers).
- `maxCustomers = min(plekken, tutorialgrens)` staat in `app/world.ts` (`customerContext`); alle getallen staan in `customers/customer-data.ts` en `economy/upgrade-data.ts`, en zijn placeholders (stap 13).
- De offline-berekening (stap 10b) gebruikt dezelfde gemiddelde klantinterval (`meanSpawnIntervalMs`), maar houdt nog geen rekening met het aantal plekken; bij het afstellen in stap 13 meenemen.

### Drankeffecten en voorkeuren (besluit eigenaar, 2026-10-06; gebouwd in stap 11b)

- Elk drankje heeft één effect, en dat effect **werkt altijd**. Zit het effect in de voorkeur (`likes`) van de klant, dan telt het **dubbel** (`EFFECT_POWER.likedFactor`). De bestelling krijgt dan een ♥ in de bubbel.
- **Kracht:** de klant betaalt 25% meer (voorkeur 50%), verwerkt in `computePayout`. **Snelheid:** de klant drinkt 40% korter (voorkeur 80%), dus de plek komt sneller vrij. **Geluk:** 25% kans op een fooi van de helft van de prijs (voorkeur 50% kans). **Charme:** +1 reputatie bovenop de gewone reputatie per bediening (voorkeur +2).
- **Drinkfase:** een bediende klant vertrekt niet meteen, maar blijft `SERVING.drinkMs` (5 s) zitten met een kroes. Hij wacht niet meer (geen geduld, geen bubbel, klikken doet niets) maar houdt zijn plek bezet. Het drinken loopt ook door tijdens een les, anders zou de enige plek bezet blijven.
- **Bestellen:** een klant bestelt een drankje dat hij lekker vindt twee keer zo vaak als een ander bekend drankje (`LIKED_ORDER_WEIGHT`). Voorkeuren nu: ridder snelheid en geluk, elf charme, dwerg kracht.
- Code: getallen in `serving/effects.ts` en `brewing/brewing.ts`; één regel per effect in `serving/effects.ts` (een nieuw effect is één regel erbij); de fooi in `tip.ts`. Alle getallen zijn placeholders (stap 13).
- Offline (stap 10b) telt kracht, de verwachte fooi en charme mee, en weegt de bestellingen zoals de klanten ze kiezen. De drinkfase en het aantal plekken tellen offline nog niet mee.

### Reputatieniveaus en VIP-klanten (besluit eigenaar, 2026-10-06; gebouwd in stap 11c)

- **6 niveaus** (`reputation/reputation.ts`, namen in i18n `reputation.<id>.name`): Shabby Shack (0), Local Haunt (10), Cozy Inn (25), Popular Pub (50), Famous Tavern (100), Legendary Hall (200). Niveau 1 is het eerste. `levelFor`, `levelProgress` en `recipesTaughtUpTo` staan in `reputation/reputation.ts`.
- **Gates:** klanttypes hebben `minLevel` (elf 2, dwerg 3, koning 3). Een niveau maakt recepten ontdekbaar (`unlocks`, sinds stap 12; in 11c leerde het ze direct). Welke recepten bij welk niveau horen, staat in hoofdstuk 4, Receptenboek, en in het logboek van stap 12. Kamers (stap 14a) hebben ook een niveau-eis.
- **Bewaker** (`reputation/reputation.ts`): leert bij een nieuw niveau de recepten en meldt `reputation:levelUp` (één keer per niveau, ook na een grote sprong, bijvoorbeeld offline). Een save die al voorbij een niveau is, krijgt de recepten stil bij het laden.
- **HUD:** naast de reputatie de naam van het niveau en een balkje naar het volgende. Bij een nieuw niveau verschijnt 4,5 s een melding met wat erbij komt (nieuwe klant, nieuw recept) (`reputation/level-up-view.ts`).
- **VIP-klanten:** gewone klanttypes met `vip: true` en een eigen `reputationBonus` (nu King Grumblebeard: niveau 3, betaalt 3x, +3 reputatie, 30 s geduld). Zodra een VIP open is, is elke nieuwe klant met kans `VIP_SPAWN.chance` (10%) een VIP (`customers/customers.ts`). Een VIP bestelt het **duurste bekende drankje**, heeft een kroon in de bubbel en een gouden kleur. Boos vertrekken kost niets. Een nieuwe VIP is alleen data.
- **Offline** telt niveaus en VIP's mee: de gewone klanten van het niveau en de VIP's naar hun kans.
- Alle getallen zijn placeholders (stap 13).

### Speelbaarheid na de eerste speeltest (besluit eigenaar, 2026-10-06; stap 13b en 13c)

De eigenaar speelde t/m stap 13 en vond het spel goed, met vier punten:

1. **Effecten waren niet duidelijk.** De voorkeursles noemt kracht, snelheid, geluk en charme tegelijk; wat ze doen ontdekte de eigenaar pas via het receptenboek. **Besluit: effect-iconen** (stap 13b): elk effect krijgt een icoon (💪 kracht, ⚡ snelheid, 🍀 geluk, 💖 charme; emoji als placeholder tot stap 21) in de bestelbubbel, in het receptenboek en in de zwevende tekst na het serveren (bijv. "⚡ quick drinker"). Een voorkeur toont het icoon met een ♥. De voorkeursles noemt alleen het effect van het drankje dat de klant bestelt, met icoon, en de afsluitzin verwijst naar het boek voor de rest. De legenda komt in stap 14c; de andere ideeën (uitleg per effect bij de eerste keer, klantkaartje) staan in IDEAS.md, punt 5.
2. **Serveren vanuit het drankje.** **Besluit: eerst het drankje, dan de klant** (stap 13b): klik een drankje op de bar; het licht op en de klanten die het besteld hebben krijgen een markering. Klik dan een klant om het te geven (verkeerde klant = de bekende weigering, het drankje blijft geselecteerd). Opnieuw op het drankje klikken of op een lege plek heft de selectie op. Direct een klant klikken zonder selectie blijft werken zoals nu. De basisles wijst het drankje en daarna de klant aan.
3. **Eén knop voor de panelen.** In plaats van de knoppen Recipes, Shop en Close: **één knop die het zijpaneel uitklapt en weer inklapt** (stap 13b), met bovenin het paneel **tabbladen** (Shop | Recipes; later ook Settings, Heroes). Het paneel opent op het laatst gebruikte tabblad. Technisch: `app/panels-view.ts` wordt een paneel met tabbladen in plaats van losse panelen; de tutorial wijst de uitklapknop aan en daarna het juiste tabblad (doelen `panel-button` en `tab:<id>`).
4. **Niveau 2 bracht te veel tegelijk** (alle drie de tier-2-ingrediënten op het schap, ook voor recepten van latere niveaus). **Besluit: ingrediënten koop je in de winkel** (stap 13c): een niveau maakt een ingrediënt koopbaar (eenmalige aankoop, groep "Ingredients" in de winkel). Pas na de aankoop staat het op het schap. Een recept is ontdekbaar als zijn niveau bereikt is **én** de speler alle ingrediënten heeft. Voorstel: niveau 2 Fire Pepper, niveau 3 Moon Grape, niveau 4 Troll Sweat (recepten per niveau daarop afstemmen). Ingrediënten blijven per gebruik gratis.

Ter verduidelijking (al zo gebouwd): klanten bestellen alleen recepten die de speler **ontdekt** heeft; een ontdekbaar recept bestelt niemand.

**Gebouwd in stap 13c (punt 4):**
- **Data:** een winkelingrediënt kan `buy: { level, cost }` hebben (`brewing/ingredients.ts`); zonder `buy` is het een basisingrediënt dat vanaf het begin op het schap staat. Nu: Fire Pepper op niveau 2 voor 40 goud, Moon Grape op 3 voor 150, Troll Sweat op 4 voor 600. De recepten per niveau pasten al bij dit voorstel (niveau 2: Bog Lantern, Dragon's Hiccup, Swamp Fire; 3: Moonlight Merlot, Honeyed Moon; 4: Troll's Toll, Gym Sock Mead, Spicy Spores); een test bewaakt dat een niveau geen recept opent waarvan een ingrediënt pas later te koop is.
- **State:** `ingredientsBought` (lijst ids; oude saves krijgen via `reconcile` een lege lijst).
- **Bezit** (`brewing/ingredients.ts`): basis, plus gekocht, plus alles wat een **bekend** recept gebruikt. Dat laatste houdt oude saves (die tier-2-recepten al kenden) brouwbaar zonder migratie. Het schap toont precies het bezit; de oude regel "tot de hoogste tier van bekende en ontdekbare recepten" (die in de schap-code) is weg.
- **Ontdekken:** een recept is ontdekbaar met niveau én alle ingrediënten in bezit (`discoverableRecipes(state, recipes, owned)`).
- **Winkel:** groep "Ingredients" bovenaan het Shop-tabblad, per ingrediënt "Unlocks at <niveau>" of "Buy · <prijs>" (`economy/shop-view.ts`). **Een gekocht ingrediënt verdwijnt uit de winkel** (wens eigenaar: overzichtelijker); is alles gekocht, dan verdwijnt ook de kop. Actie `buyIngredient(id)`, event `ingredient:bought`; `ingredients:affordable` meldt wanneer er iets te kopen valt.
- **Melding en boek:** de niveaumelding zegt "New in the shop: <ingrediënt>"; een ontdekbaar recept waarvoor nog een ingrediënt ontbreekt, zegt in het boek "Needs <ingrediënt> from the shop".
- **Tutorial-hint** (les `ingredient`, na het boek, vóór personeel): start zodra een ingrediënt te koop én betaalbaar is (of meteen als dat al zo is), wijst Menu, tabblad Shop en de koopknop aan (alias `guide-ingredient-buy`), en daarna het nieuwe ingrediënt op het schap (`guide-new-ingredient`).

**Gebouwd in stap 13b (punten 1 t/m 3; keuzes van de eigenaar via vragen):**
- **Iconen:** in i18n (`effects.<id>.icon`, plus `short`, `does` en `served` per effect). Bubbel "⚡ Glowcap Stout", voorkeur "♥⚡ …", VIP "👑 …". Boek: "⚡ Speed: drinks faster" (sinds stap 14c alleen het icoon, met een legenda bovenaan het boek). Na het serveren zweeft **altijd een effectregel**: 💪 "Big spender!", ⚡ "Quick drinker!", 🍀 "+N tip!" of "No tip this time", 💖 "+N reputation"; met "♥x2" erachter bij een voorkeur, en de reputatiebonus van een VIP als aparte regel (één regel per effect in `serving/serving-view.ts`).
- **Serveren:** `DrinkSelection` (`serving/serving.ts`) onthoudt het opgepakte **soort** drankje; het vervalt vanzelf als dat drankje niet meer op de bar staat (bijv. de serveerster nam het). Acties `clickReadyDrink(slot)` en `cancelSelection()` (`serving/serving.ts`); `serveCustomer` krijgt het aangeboden drankje mee. Het opgepakte drankje wordt geel en komt iets omhoog; klanten die het besteld hebben krijgen een **groene bubbel met een ▼**. Na het geven vervalt de selectie. Event `drink:picked`; de basisles heeft een stap `basics_pick`.
- **Paneel:** één knop "☰ Menu" / "✕" rechtsboven in het spel; bovenin het paneel tabbladen Shop | Recipes (`app/panels-view.ts`, logica zonder DOM in `app/ui-model.ts`). Het paneel opent op het laatst gebruikte tabblad, **alleen binnen de sessie** (na herladen weer Shop). De tutorial volgt welk tabblad open is via `tutorial/tutorial-context.ts`.

### Kamers (besluit eigenaar, 2026-10-06; gebouwd in stap 14a)

- **Bovenverdieping:** boven de taverne staan vier kamervakken naast elkaar (`app/layout.ts`; drie tot stap 15a, de gildekamer is de vierde). Niet gebouwd: dichtgetimmerd met een bordje ("Unlocks at <niveau>" of "Build in the shop: <prijs>"); klikken opent het zijpaneel op Shop (event `shop:requested`). Gebouwd: ingericht met placeholder-meubels (`rooms/rooms-view.ts`, één tekenfunctie per kamer), en klanten zitten er. Klanten lopen voorlopig in een rechte lijn naar boven (echte animaties in stap 21).
- **De kamers** (`rooms/rooms.ts`, placeholder-prijzen afgesteld met de simulator):
  - **Extension** (niveau 3, 1.500): +3 plekken boven.
  - **Alchemy Lab** (niveau 4, 8.000): ketel 25% sneller, +1 drankje op de bar (de bar heeft nu 6 plekken in de scene).
  - **VIP Lounge** (niveau 5, 30.000): VIP-kans ×2 (nieuwe stat `vipChance`, basis 10%), +2 plekken boven.
  - **Guild Hall** (niveau 5, 15.000; stap 15a): geen plekken of bonus, maar de helden (zie Helden).
- **Plekken:** stoelnummers zijn eerst de 7 beneden, dan per kamer (`rooms/rooms.ts`). Open zijn de gekochte plekken beneden (Extra Seat) plus alle plekken van gebouwde kamers; klanten kiezen alleen open plekken (`openSeats` in de klantcontext).
- **Bonussen:** kamers gebruiken dezelfde effecten als upgrades en tellen mee in `getMultipliers` (één keer per gebouwde kamer). Offline telt de VIP-kans mee.
- **Kopen:** groep "Rooms" in het Shop-tabblad; een gebouwde kamer verdwijnt eruit. Ingrediënten en kamers delen één module voor eenmalige aankopen (`shared/purchases.ts`) en één winkelonderdeel (`economy/shop-view.ts`).
- **State:** `roomsBuilt` (lijst ids).
- **Tutorial-hint** (les `room`, na de VIP-les): start zodra een kamer te bouwen én betaalbaar is; wijst Menu, Shop en de bouwknop aan, en daarna de nieuwe kamer.
- **Decoraties:** zie Decoraties hieronder (stap 14b).

### Decoraties (gebouwd in stap 14b)

- **Wat:** zes decoraties beneden in de taverne, elk **één keer** te kopen in de winkel (keuze eigenaar: eenmalig, geen niveaus), als goud-sink met een **kleine bonus** op een stat die al bestaat (keuze eigenaar: geen nieuwe stat). Data, logica en de actie `buyDecorById` in `decor/decor.ts`; de tekeningen in `decor/decor-view.ts`.
- **De decoraties** (placeholder-prijzen, afgesteld met de simulator):

| Decoratie | Soort | Niveau | Prijs | Bonus |
|---|---|---|---|---|
| Wall Torch | fakkel | 2 | 300 | drankjes +3% duurder |
| Woven Rug | tapijt | 3 | 1.000 | ketel +5% sneller |
| Boar Trophy | trofee | 3 | 2.500 | drankjes +4% duurder |
| Everburning Torch | fakkel | 4 | 6.000 | ketel +5% sneller |
| Royal Carpet | tapijt | 5 | 20.000 | VIP-kans +25% |
| Golden Tankard | trofee | 6 | 60.000 | drankjes +8% duurder |

- **Bonussen:** tellen mee in `getMultipliers` (één keer per gekochte decoratie, net als kamers), dus ook offline.
- **Kopen:** groep "Decorations" in het Shop-tabblad, onder Rooms; een gekochte decoratie verdwijnt eruit. Zelfde module voor eenmalige aankopen (`shared/purchases.ts`) en hetzelfde winkelonderdeel als ingrediënten en kamers. Event `decor:bought`; `decor:affordable` meldt wanneer er iets te kopen valt.
- **Scene:** fakkels en trofeeën aan de achterwand, tapijten op de vloer, op vaste plekken (`DECOR_SPOTS` in `app/layout.ts`; een test bewaakt dat ze het schap, de deur, de bar en de ketel niet raken). Alleen zichtbaar na aankoop. De view tekent alles op één Graphics-object en tekent alleen opnieuw als het aantal gekochte decoraties verandert (geen allocaties per frame). De stoelmarkeringen liggen bovenop, zodat een tapijt ze niet bedekt.
- **State:** `decorBought` (lijst ids; oude saves krijgen via `reconcile` een lege lijst).
- **Tutorial-hint** (les `decor`, na de kamerles): start zodra een decoratie te koop én betaalbaar is; wijst Menu, Shop en de koopknop aan (alias `guide-decor-buy`), en daarna de nieuwe decoratie in de taverne (`guide-new-decor`). Decoraties zijn al vanaf niveau 2 te koop, dus ver vóór deze les aan de beurt is. Daarom telt de koopstap alleen als hij in beeld is (`onlyWhenShown`); anders zou een vroege aankoop via "een latere actie al gedaan" de personeels-, VIP- en kamerles afvinken. Heeft de speler al een decoratie zodra de les aan de beurt is, dan verschijnt alleen de afsluitzin.

### Besluiten uit de ideeënronde (eigenaar, 2026-10-06)

Alle punten uit IDEAS.md zijn samen doorgenomen. Wat in het plan komt:

- **Legenda van effecten (stap 14c):** bovenaan het receptenboek een legenda met de vier effecten (icoon, naam en wat het doet). Bij elk recept staat dan alleen nog het icoon, niet meer de tekst "Speed: drinks faster". Klantkaartje bij hover en uitleg bij de eerste keer zijn niet gekozen.
  *Gebouwd in stap 14c:* een vak "What drinks do" tussen de kop van het boek en de kaartjes, met per effect het icoon, de naam en wat het doet ("⚡ Speed: they drink faster and free the seat sooner"; de bestaande i18n-sleutels `effects.<id>.icon`, `.name` en `.does`), en een regel over de ♥ (telt dubbel). Een receptkaartje toont nu "4s brew · 8 gold · 💖". De legenda komt uit `effectLegend()` in `serving/effects.ts` en wordt één keer gebouwd (`recipes/recipe-book-view.ts`); `effects.<id>.name` is nu alleen de naam ("Speed"), de oude `effectName` is weg.
- **Night Shift, offline verdienen kopen (stap 14d):** offline verdienen gebeurt niet meer vanzelf. Zodra de speler een eerste medewerker heeft, staat "Night Shift" (werknaam) in de winkel als eenmalige aankoop; daarna komen upgrades voor het offline-aandeel (nu vast 50%, wordt een stat) en de duur (stat `offlineHours`). Zonder aankoop telt afwezig niets, maar het welkom-venster toont wat het personeel had kunnen verdienen ("Your staff could have earned 1.2K…") met een verwijzing naar de winkel. Prijs met de simulator afstellen. Later kan een rewarded ad (stap 20) de opbrengst verdubbelen.
  *Gebouwd in stap 14d (prijzen gekozen door Claude, op verzoek van de eigenaar):*
  - **Nieuwe stat `offlineShare`** (basis 0): het deel van het tempo van het personeel dat telt terwijl de speler weg is. Was een vaste 50% (`OFFLINE.efficiency`); zonder aankoop is het nu 0, dus afwezig levert niets op.
  - **Drie upgrades in een eigen groep "Night Shift"** (`nightShiftUpgrades` in `economy/upgrade-data.ts`): **Night Shift** (150 goud, eenmalig: `offlineShare` +50%), **Night Owls** (500, groei 1,8, max 6: +5% per niveau, tot 80%) en **Long Night** (800, groei 2, max 6: `offlineHours` +1 per niveau, tot 8 uur).
  - **Vrijgeven:** een upgrade kan `unlockedBy` hebben (ids): pas te koop als de speler een niveau van een daarvan heeft. Night Shift na de brouwer of de serveerster, Night Owls en Long Night na Night Shift. `quoteFor` geeft voor een vergrendelde upgrade niets te kopen, dus ook de tutorial en de simulator kopen hem niet te vroeg. De winkel toont een vergrendelde upgrade niet, en een upgrade met `maxLevel: 1` verdwijnt na de aankoop (zoals ingrediënten, kamers en decoraties); een kop zonder zichtbare rijen verdwijnt ook.
  - **Welkom-venster:** met personeel maar zonder Night Shift: "Your staff went home. With Night Shift they could have earned 1.2K gold." en "Buy Night Shift in the shop…" (`offlineWithMissed` in `offline/offline.ts` rekent het bedrag uit met het aandeel van Night Shift). Zonder volledige bezetting blijft de oude zin, nu met Night Shift erbij.
  - **Tutorial-hint:** de afsluitzin van de personeelsles noemt Night Shift ("Buy Night Shift in the Shop tab and they even work while you are away"); de oude zin beloofde dat het personeel altijd doorwerkt.
  - **Weergave:** een stat die een aandeel is (`offlineShare`) toont een toegevoegd bedrag als percentage ("+5%").
- **Helden (stap 15a t/m 16c), zie ook Helden hieronder.**
- **Achievements (stap 18):** zoals gepland.
- **Niet in het plan:** het weekly leaderboard (pas als CrazyGames ons uitnodigt, zie IDEAS.md punt 1), de punten over de schermindeling (checklist voor stap 21 en 22, IDEAS.md punt 2), en de poster (vervallen).

### Helden (besluit eigenaar, 2026-10-06; uitgewerkt 2026-10-07; stap 15a, 15b, 15c, 16, 16b en 16c)

- **Niet alleen idle:** de eigenaar wil bij de helden echte gameplay. Actief meespelen levert duidelijk meer op; idle blijft mogelijk (standaardkeuzes, ook offline) en levert minder, net als bij brouwen (idle ongeveer 30-40% van actief).
- **Zichtbaar:** de helden wonen in een **gildekamer** op de bovenverdieping (een vierde kamer, te bouwen zoals de andere; de indeling van de bovenverdieping moet daarvoor opnieuw verdeeld worden). Je ziet ze vertrekken en terugkomen.
- **Actieve onderdelen (alle vier gekozen):**
  1. **Uitrusting zelf kiezen** (zwaard, schild, helm, amulet), met keuzes per kerker (stap 15c).
  2. **Drankjes meegeven als keuze:** de speler brouwt zelf wat de held meeneemt; het effect (kracht, snelheid, geluk, charme) helpt in bepaalde kerkers (stap 16).
  3. **Keuzes onderweg:** tijdens een expeditie korte keuzekaartjes (pad links of rechts, vechten of sluipen, welk drankje nu drinken) met invloed op buit en duur (stap 16).
  4. **Baasgevecht:** een korte **timing-klik**-minigame aan het eind van een kerker (stap 16b).
- **Klein beginnen:** 2 klassen en 1 kerker in de eerste versie; meer klassen en kerkers als data zodra het leuk blijkt. Helden kunnen niet sterven (gewond = cooldown).

**Uitwerking (vragen aan de eigenaar, 2026-10-07).** De keuzes zijn van de eigenaar. Getallen en namen gemarkeerd met *(voorstel)* komen van Claude; het zijn placeholders die in de stap zelf met de simulator worden afgesteld.

- **Klassen:** **krijger** en **magiër**, één van elk (dus 2 helden). Elk heeft een naam, een level en eigen uitrusting; ze gaan los op pad. De krijger is sterker tegen de baas en bij vechten. De magiër haalt meer uit meegegeven drankjes *(voorstel: +50% drankeffect)* en is zwakker tegen de baas. Meer plekken of klassen kunnen later (prestige, upgrade, data).
- **Gildekamer:** te bouwen vanaf **niveau 5 (Famous Tavern)**, rond minuut 13 in de simulator, als vierde kamer. De bovenverdieping wordt verdeeld in vier vakken *(voorstel: prijs 15.000; de krijger komt mee met de kamer, de magiër huur je erbij voor 8.000)*. Je ziet de helden er wonen, vertrekken en terugkomen. In het zijpaneel komt een tabblad **Heroes**.
- **Kerker: het Moeras.** Thema: kikkers, modder en een chagrijnige moerasheks als baas. Een expeditie duurt **1 tot 3 minuten** (snelheid en keuzes verkorten of verlengen). De tijd loopt als absolute eindtijd en loopt ook door als het spel dicht is.
- **Beloning: kerker-ingrediënten** (hoofdzaak), daarnaast XP en soms uitrusting *(voorstel: Bog Pearl en Witch Moss)*. Kerker-ingrediënten zijn een **voorraad die opraakt**: elk drankje ermee kost er één. Zo blijven de helden nodig en hangen beide loops aan elkaar.
  - Recepten met kerker-ingrediënten zijn duur *(voorstel: 3 tot 4 nieuwe recepten op niveau 5 en 6)*. Klanten bestellen ze alleen als er voorraad is. De brouwer gebruikt ze alleen voor zo'n bestelling.
  - Het schap toont een kerker-ingrediënt met het aantal erop, en grijs bij 0. In het receptenboek staat een nog nooit gevonden ingrediënt als "?".
  - Offline telt de voorraad niet mee: de offline-formule rekent alleen met recepten zonder kerker-ingrediënten.
- **Groei:** expedities geven **XP**, en XP maakt **levels**. Een hoger level maakt de held sterker (minder kans gewond, meer schade tegen de baas) en opent later diepere kerkers *(voorstel: max level 10, Moeras aanbevolen vanaf level 1)*. Levels resetten bij prestige (GAME_ANALYSE 5.7).
- **Uitrusting:** vier vakken, **elk met een eigen rol**:
  - **Zwaard:** meer buit bij vechten.
  - **Schild:** minder kans om gewond te raken.
  - **Helm:** sneller terug.
  - **Amulet:** meegegeven drankjes werken sterker.

  Per kerker is iets anders handig, dus kiezen loont. Een simpel stuk per vak koop je met goud in het tabblad Heroes (ook een goud-sink). Betere en zeldzame stukken vind je als buit. Een stuk draagt telkens één held; wisselen kan als de held thuis is.
- **Drankjes meegeven: de heldenketel.** In de gildekamer staat een **tweede ketel** (wens eigenaar). Zo blijft de taverneketel met de brouwer gewoon doorwerken (idle staat niet stil), en het personeel of een volle bar kan het heldendrankje niet afpakken of blokkeren.
  - Klik de heldenketel: die licht op en de volgende ingrediënten van het schap gaan erin. Zodra hij brouwt, springt het schap vanzelf terug naar de taverneketel.
  - Wat klaar is, gaat direct in de **rugzak** van de held die thuis klaarstaat (maximaal **2 drankjes**) en komt nooit op de bar. De brouwer raakt de heldenketel nooit aan.
  - Een drankje dat al op de bar staat, kun je ook oppakken en aan de held geven (hetzelfde gebaar als bij een klant).
- **Drankeffecten op expeditie** (dezelfde iconen als in de taverne):
  - **Kracht:** sterker in gevechten en tegen de baas.
  - **Snelheid:** sneller terug.
  - **Geluk:** meer of zeldzamere buit.
  - **Charme:** betere uitkomst bij figuren onderweg (bijv. de heks die om een drankje vraagt).
- **Keuzekaartjes:** **2 per expeditie**, met voorbeelden *(voorstel)*:
  - pad door de modder (sneller) of over de vlonders (veiliger);
  - een reuzenkikker: vechten (meer buit, kans gewond) of sluipen (veilig);
  - nu een drankje drinken;
  - een figuur die om een drankje vraagt.

  Een kaartje blokkeert niets. Wie niet binnen ~10 seconden kiest, krijgt de **veilige standaardkeuze**; offline is het altijd de standaard. Actief kiezen levert meer op.
- **Baasgevecht (16b): een timing-balk met 3 slagen.** Een wijzer zwaait heen en weer; klik als hij in het groene vak staat. Elke goede slag doet schade, en kracht-drankjes maken het groene vak groter. Werkt met muis en touch. Wie niet meespeelt, krijgt de standaarduitkomst; actief winnen geeft baas-buit.
- **Gewond:** een gewonde held rust kort in de gildekamer *(voorstel: 90 seconden)*. Dat kost geen buit en geen XP. Geef je hem een drankje (uit de heldenketel of van de bar), dan is hij meteen weer fit.
- **Idle (16c): na een aankoop** *(werknaam: Quartermaster)* krijgt **elke held een knop "Auto"** die je **op elk moment** aan of uit zet.
  - Op Auto vertrekt de held vanzelf opnieuw, met standaardkeuzes en de standaarduitkomst tegen de baas, ook offline (binnen de offline-limiet).
  - Kies je toch zelf een kaartje of speel je de baas, dan telt jouw keuze.
  - Zet je Auto uit, dan maakt de held de lopende expeditie af en wacht daarna op jou.
  - Doel, zoals bij brouwen: idle levert ongeveer 30-40% van actief spelen.

**Gebouwd in stap 15a (Gildekamer, helden en eerste expeditie; de getallen zijn placeholders, gekozen door Claude):**
- **Opsplitsing (keuze eigenaar, 2026-10-08):** de oude stap 15a was te groot (twee losse lussen). 15a werd de gildekamer, de helden en de expeditie; de voorraad kerker-ingrediënten op het schap, het verbruik bij brouwen en de nieuwe recepten zijn stap 15b. De uitrusting heet nu stap 15c.
- **Feature-map `heroes/`:** `heroes.ts` (data, rekenregels, acties en het tick-systeem `startHeroes`, één regel in `createWorld` na het personeel), `heroes-model.ts` (pure view-models voor het tabblad), `heroes-view.ts` (tabblad Heroes, DOM), `guild-view.ts` (de helden in de gildekamer, Phaser) en `heroes.css`.
- **Gildekamer:** vierde kamer `guild_hall` in `rooms/rooms.ts` (niveau 5, 15.000, geen plekken of bonus; de validator staat dat alleen voor de gildekamer toe). De bovenverdieping is verdeeld in vier vakken van 284 ontwerp-pixels (`app/layout.ts`); de stoelen van de uitbouw en de lounge en de meubels van het lab zijn opgeschoven. De gildekamer heeft een banier, een wapenrek en een stapelbed, en per held een plek (`HERO_SPOTS`).
- **Helden:** `HERO_CLASSES` met `hire`: de krijger (Brakka) komt mee met de kamer (`recruitGuildHeroes`, bij `room:built` en bij het laden), de magiër (Mildred) huur je in het tabblad voor 8.000 zodra de gildekamer staat (`hireHeroById`). In 15a verschillen de klassen alleen in hoe je ze krijgt; kracht tegen de baas en meer uit drankjes komen in 16 en 16b.
- **State:** `heroes` (open map per klasse: `{ level, xp, injuredUntil, expedition: { dungeon, endsAt } | null }`) en `ingredientStock` (open map ingrediënt → aantal). Oude saves krijgen via `reconcile` lege maps.
- **Expeditie naar het Moeras** (`DUNGEONS`): 120 s, 40 XP, 3 trekkingen buit (Bog Pearl gewicht 3, Witch Moss gewicht 2, elk 1 stuk). `sendHero` zet een absolute eindtijd (de klok uit `world.clock`); `returnHeroes` op de tick brengt elke held terug van wie de tijd om is, dus ook na herladen of een lange afwezigheid. Buit gaat in `ingredientStock`, XP in levels.
- **Levels:** XP van niveau 1 naar 2 is 100, daarna steeds ×1,5; maximaal niveau 10. Een hoger niveau maakt de kans op gewond kleiner: 30% op niveau 1, 2,5 procentpunt minder per niveau, nooit onder 5%.
- **Gewond:** een gewonde held rust 90 s, gerekend vanaf het moment dat hij terug was (wie lang weg was, vindt hem al uitgerust). Gewond kost geen buit en geen XP. Pak een drankje van de bar en klik de held: hij drinkt het en is meteen fit (`clickHero`, event `hero:healed`). Zonder drankje opent een klik op een held het tabblad Heroes (`heroes:requested`).
- **Tabblad Heroes** (derde tabblad): zonder gildekamer één zin waar je hem bouwt; daarna de buit ("Bog Pearl ×2") en per held een kaartje met naam en klasse, level met XP-balk, waar hij is ("In the Swamp, back in 1:30.") en een knop (Send to the Swamp, Hire · 8K, of uitgegrijsd tijdens een tocht of rust). De afteltijd loopt mee zolang het tabblad open is.
- **In de scene:** een held staat thuis in de gildekamer, loopt bij vertrek naar links weg en komt bij terugkeer weer binnen, met zwevende tekst voor de buit, de XP, een nieuw level en een verwonding. Tijdens een tocht staat er een bordje met de afteltijd (🗺 1:23), een gewonde held is grijs met 🤕 en zijn rusttijd; met een drankje in de hand krijgt hij een groen ▼.
- **Kerker-ingrediënten in 15a:** alleen buit-id's in de kerkerdata met een naam in i18n (`ingredients.bog_pearl.name`); ze staan nog niet in de ingrediëntentabel en niet op het schap (dat is stap 15b).
- **Tutorial-hint** (les `hero`, na de decoratieles): start zodra de krijger intrekt (`hero:recruited`), wijst Menu, het tabblad Heroes en de knop Send to the Swamp aan (alias `guide-hero-send`), en daarna de gildekamer met de afsluitzin. Versturen telt alleen als de hint in beeld is (`onlyWhenShown`), zodat een vroege tocht geen eerdere lessen afvinkt; wie al een held op pad stuurde, krijgt alleen de afsluitzin.
- **Simulator:** de bot bouwt de gildekamer zoals de andere kamers, maar stuurt geen helden (de buit levert in 15a nog niets op); de tijdlijn toont "hero Brakka joined".

**Gebouwd in stap 15b (Kerker-ingrediënten als voorraad en nieuwe recepten; getallen gekozen door Claude):**
- **Ingrediënten:** Bog Pearl en Witch Moss staan in de ingrediëntentabel met bron `dungeon:swamp` (`brewing/ingredients.ts`, `dungeonIngredients`). Ze zijn "in bezit" zodra ze één keer gevonden zijn (de id staat in `ingredientStock`), ook als de voorraad op is.
- **Schap:** acht plekken (`app/layout.ts`: schap van x 236 tot 780, 68 pixels uit elkaar). Een kerker-ingrediënt toont zijn aantal ("×2") en wordt grijs bij 0. Klikken op een leeg kerker-ingrediënt doet niets behalve een zin (nieuwe melding `empty`, "Out of that one. Send a hero to the swamp for more."). De teller wordt per frame bijgewerkt zonder het schap opnieuw op te bouwen.
- **Verbruik:** elk drankje dat begint te brouwen, van de speler of de brouwer, verbruikt één van elk kerker-ingrediënt erin (`watchStockUse` op `brew:started`, één regel in `createWorld`). Ontdekken kan alleen met voorraad (`usableIngredientIds`).
- **Bestellen:** klanten (ook VIP's) bestellen zo'n drankje alleen als de voorraad het dekt, bovenop de bestellingen die al wachten op een drankje met hetzelfde ingrediënt (`orderableRecipeIds`), zodat de voorraad niet twee keer beloofd wordt. Zonder kerkervoorraad is het gewoon de lijst bekende recepten (geen extra werk per tick).
- **Brouwer:** brouwt zo'n drankje alleen met voorraad (`brewableRecipes`); hij brouwt sowieso alleen bestellingen.
- **Offline:** recepten met kerker-ingrediënten tellen niet mee in de offline-formule.
- **Recepten** (tier 3, `tier03DungeonRecipes` in `recipes/recipe-data.ts`): niveau 5 Pearl Mead (Bog Pearl + Wild Honey, geluk, 150, 14 s) en Witch's Kiss (Witch Moss + Moon Grape, charme, 170, 15 s); niveau 6 Mossy Grog (Witch Moss + Troll Sweat, kracht, 200, 15 s) en Bog Royale (Bog Pearl + Witch Moss + Fire Pepper, snelheid, 260, 18 s, legendarisch). Allemaal duurder dan het duurste gewone drankje (85).
- **Receptenboek:** een ontdekbaar recept met een nooit gevonden kerker-ingrediënt zegt "Needs ? from a dungeon".
- **Tutorial-hint** (les `loot`, na de heldenles): zodra een held voor het eerst buit thuisbrengt (`hero:returned`, of meteen als er al buit is), wijst de ketel het ingrediënt op het schap aan en legt de teller en het verbruik uit, met een verwijzing naar het boek (alias `guide-loot`, 8 s).
- **Simulator:** de bot stuurt een held die thuis en fit is op pad (één klik), huurt de magiër zodra die binnen zijn budget past, en brouwt een kerkerdrankje alleen met voorraad. De tijdlijn toont "Brakka back from the swamp".

**Gebouwd in stap 15c (Uitrusting; getallen gekozen door Claude):**
- **Code:** `heroes/gear.ts` (data, regels en acties), de effecten in `heroes/heroes.ts`, de vakken en de winkel in het tabblad (`heroes-model.ts`, `heroes-view.ts`). `GUILD_ROOM_ID` staat nu in `rooms/rooms.ts` (zo importeren helden en uitrusting hem zonder kring).
- **Vier vakken, elk met een rol** (`gearPower`): **zwaard** = meer buit (het aantal trekkingen ×(1 + kracht); het deel van een trekking dat overblijft is de kans op nog één), **schild** = minder kans op gewond (×(1 − kracht)), **helm** = kortere tocht (×(1 − kracht)), **amulet** = meegegeven drankjes werken sterker (werkt vanaf stap 16, als er drankjes meegaan).
- **Stukken** (`GEAR`): te koop voor 4.000 elk zodra de gildekamer staat: Rusty Sword (+25% buit), Wooden Shield (30% minder kans op gewond), Leather Cap (tocht 15% korter), Lucky Charm (drankjes 25% sterker). Alleen als buit: Swamp Cleaver (+60%), Frog-Skin Shield (60%), Mudwalker Helm (30%), Witch's Eye (60%). Elk stuk één keer; een gekocht stuk verdwijnt uit de winkel.
- **Buit:** het Moeras geeft per tocht 6% kans op een stuk dat de speler nog niet heeft (`gearChance`, `gearDrops` met gewichten). In de scene zweeft "Found: Swamp Cleaver!".
- **Dragen:** per held per vak een keuzelijst in het tabblad (`equipGear`). Een stuk draagt één held; kies je het voor een andere held die thuis is, dan schuift het over. Een held op tocht houdt zijn uitrusting, en zijn stukken worden de anderen niet aangeboden. Wisselen kan alleen thuis (ook gewond).
- **State:** `gearOwned` (lijst) en per held `gear` (vak → stuk). Een held uit een oudere save krijgt de ontbrekende velden bij het starten (`completeHeroes`), omdat `reconcile` een open map zoals `heroes` ongemoeid laat.
- **Tutorial-hint** (les `gear`, na de buitles): start zodra een stuk te koop én betaalbaar is; wijst Menu, het tabblad Heroes en de koopknop aan, daarna de keuzelijst van het vak bij een held thuis (aliassen `guide-gear-buy` en `guide-gear-equip`). Beide stappen tellen alleen in beeld (uitrusting is te koop voordat de les aan de beurt is); wie al iets kocht of droeg, is meteen klaar.
- **Simulator:** de bot koopt een stuk als het binnen zijn budget past (na de kamers en het huren) en trekt een stuk aan als een held thuis een leeg of zwakker vak heeft (`gearToWear`: nooit heen en weer wisselen). De tijdlijn toont "bought Rusty Sword" en "found Swamp Cleaver".

**Gebouwd in stap 16 (Heldenketel, drankjes meegeven en keuzekaartjes; getallen gekozen door Claude):**
- **Code:** eerst ongewijzigd verplaatst (simulator byte-identiek): de kerker en de tochten naar `heroes/expedition.ts`, het klikken op een held naar `heroes/hero-brewing.ts`; `heroes/heroes.ts` houdt klassen, groei en huren. Nieuw: `heroes/trip-cards.ts` (drankeffecten op tocht en de keuzekaartjes), `heroes/cards-view.ts` (het kaartje in beeld) en `dev/bot.ts` (de bot, uit `simulator.ts`, dat anders boven 300 regels kwam).
- **Heldenketel** (`hero-brewing.ts`, `world.guild`): een tweede ketel midden in de gildekamer. Klik hem aan: hij licht op en de volgende ingrediënten van het schap gaan erin (`clickShelf`); zodra hij brouwt, gaat het schap terug naar de taverneketel. Hij brouwt op de snelheid van de taverneketel, verbruikt kerker-ingrediënten zoals de taverne, en een ontdekking telt ook. Een klaar drankje gaat meteen naar een held thuis: eerst een gewonde (die is dan fit), anders een met ruimte in de **rugzak (max 2)**; het komt nooit op de bar en de brouwer raakt de ketel niet aan. Kan niemand een drankje aannemen, dan gaat de ketel niet aan ("No hero at home with room in the bag", melding `nohero`).
- **Van de bar:** pak een drankje op en klik een held: gewond = genezen (zoals in 15a), thuis en fit = in de rugzak zolang er ruimte is.
- **Drankjes op tocht:** bij vertrek gaat de rugzak mee (`expedition.drinks`). Per drankje, met kracht p (1, de magiër 1,5, keer 1 + amulet): **snelheid** maakt de tocht korter (×(1 − 0,15p), minstens de helft), **geluk** geeft meer buit (+15% p) en iets meer kans op gear (+1% p), **kracht** maakt taaier (−5% p kans op gewond), **charme** helpt bij de heks.
- **Keuzekaartjes** (`CARDS`): 2 per tocht, verschillend, gelijk verdeeld over de tocht (`scheduleCards`, met de RNG bij vertrek). Het **pad** (modder: rest van de tocht 25% korter, +8% kans op gewond; of de vlonders), de **reuzenkikker** (vechten: +30% buit en +15% kans op gewond, kracht maakt het beter: +15% buit en −10% gewond per p; of sluipen) en de **moerasheks** (geef haar een drankje: +1 Witch Moss, met charme nog +p Witch Moss en +4% p kans op gear; of doorlopen). Het kaartje staat 10 s in beeld (links in het spel, met een aftelbalk); wie niet kiest, krijgt de veilige standaard, en terwijl de speler weg is altijd de standaard. De modder kort de eindtijd meteen in; de rest telt bij terugkomst. Events `card:opened` en `card:resolved` (met `picked`).
- **Recepten:** vier nieuwe kerkerrecepten (21 in totaal): Frog Fizz (Bog Pearl + Swamp Slime, snelheid, 140) en Hex Glow (Witch Moss + Glowcap, geluk, 160) op niveau 5, Pearly Moon (Bog Pearl + Moon Grape, charme, 190) en Witch Honey (Witch Moss + Wild Honey, kracht, 180) op niveau 6. Combinaties van alleen winkelingrediënten waren op: elke vrije combinatie hoort bij Troll's Toll (een recept mag geen deel van een groter recept zijn).
- **Tabblad Heroes:** per held de rugzak ("🎒 Slime Sap", leeg met uitleg, of "Took along: …" tijdens een tocht) en bovenaan een regel over wat drankjes op tocht doen.
- **State:** per held `bag`; per tocht `drinks` en `cards` (`{ id, at, choice, drink? }`). Oudere helden en tochten krijgen de nieuwe velden bij het starten (`completeHeroes`).
- **Tutorial-hints** (na de uitrustingsles): les `hero_brew` wijst de heldenketel aan en daarna een ingrediënt voor een drankje (alias `guide-hero-drink`), klaar zodra het in een rugzak zit; les `card` wijst bij het eerste open kaartje de gewaagde optie aan (alias `guide-card`) en sluit af met de uitleg over de standaardkeuze. De actiestappen tellen alleen in beeld.
- **Simulator:** de bot kiest bij een open kaartje de gewaagde optie, brouwt in de heldenketel een gelukdrankje zonder kerker-ingrediënten zolang een held thuis ruimte heeft, en stuurt een held pas op pad met een volle rugzak.

**Gebouwd in stap 16b (Baasgevecht; getallen gekozen door Claude):**
- **Code:** `heroes/boss-fight.ts` (de baas per kerker, de balk, de uitkomst, de actie `strikeBoss` en `runBoss`, dat in het tick-systeem van de helden draait, na de kaartjes) en `heroes/boss-view.ts` (het vak in beeld, DOM). De uitkomst telt bij terugkomst mee als extra tochtmods (`bossMods`), naast de drankjes en de kaartjes.
- **De baas:** `BOSSES` per kerker-id; het Moeras heeft de **Bog Witch** (3 levenspunten). Een nieuwe kerker krijgt zijn baas als één regel erbij.
- **Wanneer:** de baas verschijnt **15 s vóór het eind** van een tocht (`BOSS.windowMs`), gerekend vanaf de eindtijd (die de modder of de helm al korter kon maken). Event `boss:opened`.
- **De balk:** een wijzer zwaait heen en weer; drie slagen, elke slag sneller (1,6 s, 1,3 s en 1 s per oversteek). Het groene vak in het midden is 18% van de balk, **+6% per kracht-drankje** (keer de drankkracht, dus de magiër en het amulet tellen mee), hooguit 40%. Klik op Strike! of op de balk (pointer-events: muis en touch). Een slag in de laatste seconden houdt de held nog 4 s bij de baas (`graceMs`), zodat een gevecht nooit halverwege afbreekt.
- **Schade:** een goede slag doet `bossPower` (krijger 1,5, magiër 1) ×(1 + 10% per level boven 1). De krijger wint dus met 2 van de 3 treffers, de magiër op level 1 pas met 3 (vanaf level 6 met 2).
- **Uitkomst:** gewonnen = **baas-buit** bovenop de tocht: +1 Witch Moss, +1 Bog Pearl en +3% kans op gear. Verloren = niets erbij en niets eraf ("The Bog Witch cackles and flies off. No harm done."). Wie niet slaat, of wiens held terug is vóór de laatste slag, krijgt de **standaarduitkomst**: geen baas-buit, geen straf (niet geslagen slagen tellen als missers). Offline is het altijd de standaard. Event `boss:resolved` (`won`, `lost` of `null`); `hero:returned` meldt de uitkomst ook (`boss`).
- **In beeld:** een paars vak naast het kaartje en naast de taverneketel (nooit over de bar of de ketel), met "Brakka vs. the Bog Witch!", de balk, per slag 💥, ✖ of ○, en de knop. De uitslag blijft 2,5 s staan. Bij terugkomst zweeft "👑 Beat the Bog Witch!" of "The Bog Witch got away". Het vak blokkeert niets; het spel loopt door.
- **State:** per tocht `boss` (`{ hits, lastAt }`), pas na de eerste slag. Geen migratie nodig (optioneel veld).
- **Tutorial-hint** (les `boss`, na de kaartjesles): bij de eerste baas wijst de ketel de knop Strike! aan (doel `boss-strike`), daarna een afsluitzin over de standaarduitkomst en kracht-drankjes. De actiestap telt alleen in beeld en is ook klaar als de held terugkomt zonder gevecht, zodat de les nooit blijft hangen.
- **Simulator:** de bot slaat zodra de wijzer binnen 1,6× het groene vak staat (ongeveer 60% treffers, zoals een speler); de tijdlijn toont "Brakka beat the boss".

**Gebouwd in stap 16c (Quartermaster: helden op auto en offline; getallen gekozen door Claude):**
- **Code:** `heroes/auto.ts` (de aankoop, de knop, `startAuto` op de tick na de helden, en `catchUpTrips` voor de tijd weg). `heroes/expedition.ts` kreeg `startTrip` (een tocht laten beginnen op een gegeven tijd, zonder melding) en `returnHero` meldt optioneel niets. `offline/offline.ts` roept `catchUpTrips` aan in `handleAway` en krijgt nu de wereld (`store`, `bus`, `rng`, `clock`, `content`) in plaats van een eigen `OfflineDeps`.
- **Quartermaster:** een eenmalige aankoop van **12.000** bovenaan het tabblad Heroes, te koop zodra de gildekamer staat; daarna verdwijnt de rij. State: `quartermaster` (boolean).
- **Auto:** daarna heeft elke gehuurde held op zijn kaartje een knop "Auto: off" / "🔁 Auto: on", op elk moment aan of uit te zetten (`setHeroAuto`, event `hero:auto`). State: per held `auto`.
- **Online:** een held op Auto die thuis en fit is, vertrekt na **10 s** opnieuw (`QUARTERMASTER.homeMs`), zodat de speler hem nog drankjes kan geven; met een volle rugzak meteen. Een gewonde held vertrekt pas als hij fit is. Kaartjes en baas lopen zoals altijd: wie niet kiest, krijgt de veilige standaard en de standaarduitkomst; kiest de speler zelf, dan telt die keuze. Auto uit: de held maakt de tocht af en wacht thuis.
- **Offline:** bij terugkomst (laden, of een tab die sliep) speelt `catchUpTrips` de tochten van de helden op Auto na: elke tocht begint als de vorige klaar was (plus rust bij gewond en de 10 s thuis), met de standaardkeuzes. Een tocht begint alleen binnen de **offline-limiet** (stat `offlineHours`, vanaf het moment van weggaan); Night Shift is daarvoor niet nodig. De laatste tocht kan nog lopen. Er komt geen melding per tocht (geen zwevende tekst); helden die niet op Auto staan, komen zoals vroeger terug op de volgende tick.
- **Welkom-venster:** "Your heroes on Auto made 12 trips and brought home Bog Pearl ×21, Witch Moss ×15." (`trips` en `heroLoot` in het offline-rapport).
- **Tutorial-hint** (les `auto`, na de baasles): start zodra de Quartermaster te koop én betaalbaar is; wijst Menu, het tabblad Heroes en de koopknop aan (alias `guide-quartermaster-buy`), daarna de Auto-knop van de eerste held die nog niet op Auto staat (`guide-hero-auto`), en sluit af bij de gildekamer: "On Auto they take the safe choices. Pick a card or fight the boss yourself and your choice counts." Beide acties tellen alleen in beeld.
- **Simulator:** de bot koopt de Quartermaster als die in zijn budget past (na huren, vóór uitrusting) en zet daarna elke held op Auto. De tijdlijn toont "bought the Quartermaster" en "Brakka on Auto". In het idle-deel (de laatste 10 minuten niets doen) blijven de helden op Auto dus op tocht gaan.

### Prestige: de taverne verkopen (gebouwd in stap 17; uitwerking door Claude op basis van GAME_ANALYSE hoofdstuk 7)

De eigenaar liet de uitwerking aan Claude ("ga maar gewoon verder"). Alle getallen zijn placeholders, afgesteld met de simulator; de keuzes zijn hieronder en in het logboek te herzien.

- **Code:** `prestige/prestige.ts` (getallen, de Legacy, `canSell`, `sellTavern`, `buyLegacy`, het tellen van het verdiende goud in `startPrestige`, één regel in `createWorld`, en het view-model `toLegacyView`) en `prestige/prestige-view.ts` met `prestige.css` (het tabblad Legacy). De bonussen tellen mee in `getMultipliers` (`prestigeBonuses`), dus ook offline.
- **Golden Hop** (🌼): verkopen geeft `floor(√(goud verdiend in deze taverne / 250.000))`. Verdiend telt alles wat klanten betalen (prijs en fooi, ook via het personeel) en het offline-loon (event `offline:paid`); uitgeven telt niet af.
- **Wanneer:** vanaf **Legendary Hall** (niveau 6) en met minstens **4 Golden Hop** (4M goud verdiend). Verkopen voor minder is nooit de moeite van een nieuwe start; de les zou anders al rond minuut 35 aandringen. Event `prestige:available` zodra het kan.
- **Wat het oplevert:** elke Golden Hop die je ooit verdiende maakt drankjes **+10%** duurder, voor altijd (`totalHops`, telt op bij de basisprijs). Daarnaast besteed je ze in de **Brewery Legacy**: blijvende bonussen met niveaus, niveau n+1 kost basisprijs × (n+1):

| Bonus | Prijs (🌼) | Max | Wat |
|---|---|---|---|
| Grandma's Copper Kettle | 1, 2, 3… | 5 | ketel +10% sneller per niveau |
| Seed Money | 1, 2, 3… | 5 | elke nieuwe taverne start met +1.000 goud per niveau |
| Staff Handbook | 2, 4, 6… | 5 | personeel brouwt en serveert +15% sneller per niveau |
| Night Watch | 2, 4, 6… | 4 | offline-limiet +1 uur per niveau (personeel én helden op Auto) |

- **Wat blijft:** de ontdekte recepten (en dus het receptenboek), de tutorial, de Golden Hop en de Legacy, en de begindatum. **Wat opnieuw begint:** goud (op de Seed Money na), reputatie, upgrades en personeel, Night Shift, kamers, decoraties, gekochte ingrediënten, helden (ook hun levels), uitrusting, kerkervoorraad en de Quartermaster. Omdat de recepten blijven, staan hun ingrediënten meteen op het schap en bestellen klanten ook de dure drankjes al vanaf het begin; dat maakt elke volgende taverne sneller.
- **Tabblad Legacy** (vierde tabblad): het aantal Golden Hop, de prijsbonus tot nu toe, wat verkopen nu oplevert of nog nodig heeft, de knop "Sell the tavern · 🌼 4" (**twee klikken**: de eerste vraagt "Sure? Click again to sell", 4 s geldig) en de vier bonussen. Na het verkopen laadt de pagina opnieuw, zodat de scène en alles wat niet opgeslagen is ook vers begint.
- **State:** `prestige: { hops, totalHops, runs, runEarned, legacy }` (oude saves krijgen via `reconcile` de default). De reputatiebewaker zakt mee na een verkoop, zodat de niveaus in de nieuwe taverne weer gemeld worden.
- **Tutorial-hint** (les `prestige`, na de Auto-les): zodra verkopen kan, wijst de ketel Menu, het tabblad Legacy en de verkoopknop aan (alias `guide-prestige-sell`); na de verkoop (en het herladen) een bonus om de Golden Hop aan uit te geven (`guide-legacy-buy`). Beide stappen tellen alleen in beeld.
- **Simulator:** de bot verkoopt zodra het kan en koopt dan de eerste betaalbare bonus. Na een verkoop begint de tijdlijn opnieuw met "eerste keer" (zo zie je de mijlpalen van de nieuwe taverne). Met `npm run simulate -- 240 1` zie je meerdere cycli.

### Statistieken en achievements (gebouwd in stap 18a; uitwerking door Claude)

Besluit eigenaar (2026-10-06): achievements zoals gepland, met kleine permanente bonussen; `happytime()` alleen bij de grote momenten. De rest koos Claude (de eigenaar zei door te gaan zonder te stoppen).

- **Code:** `achievements/achievements.ts` (de statistieken bijhouden, de achievements en hun bonussen, de view-models; `startAchievements` is één regel in `createWorld`) en `achievements/achievements-view.ts` met `achievements.css` (het tabblad Trophies). De bonussen tellen mee in `getMultipliers` (`achievementBonuses`), dus ook offline.
- **Statistieken** (`state.stats`, blijven bij het verkopen van de taverne): klanten bediend, VIP's bediend, goud verdiend (prijs en fooi, plus het offline-loon), heldentochten en gewonnen baasgevechten. Recepten en verkochte tavernes komen uit de state die er al was. Tochten die helden op Auto inhalen terwijl de speler weg is (stap 16c), tellen niet mee: daar komt geen melding van.
- **14 achievements** (`ACHIEVEMENTS`, data; een doel is een statistiek en een getal, de bonus werkt als een upgrade-niveau):

| Achievement | Doel | Bonus |
|---|---|---|
| First Pint | 1 klant | drankjes +1% |
| The Regulars | 100 klanten | drankjes +2% |
| Packed House | 1.000 klanten | ketel +3% |
| Royal Treatment | 10 VIP's | VIP-kans ×1,05 |
| Pocket Money | 10K goud verdiend | drankjes +1% |
| Gold Rush | 1M goud verdiend | drankjes +3% |
| Curious Brewer | 5 recepten | ketel +2% |
| Recipe Hoarder (groot) | alle 21 recepten | drankjes +5% |
| Legend in a Glass (groot) | een legendarisch recept | drankjes +3% |
| Adventurer | 10 tochten | ketel +2% |
| Swamp Veteran | 100 tochten | ketel +3% |
| Witch Hunter | de baas 1 keer verslagen | drankjes +2% |
| Legend of the Swamp | de baas 25 keer verslagen | drankjes +3% |
| Under New Management (groot) | de taverne verkocht | drankjes +5% |

- **Behalen:** bij elke wijziging van de state kijkt het spel of een doel gehaald is; een save die een doel al haalde, krijgt het meteen bij het laden. Event `achievement:unlocked` met `big` (de drie "grote" momenten); `happytime()` daarvoor komt met de SDK in stap 20. State: `achievements` (lijst ids, blijft bij verkopen).
- **Melding:** dezelfde melding bovenin als bij een nieuw reputatieniveau: "🏆 The Regulars!", de bonus, en "All trophies are in the Trophies tab."
- **Tabblad Trophies** (vijfde tabblad; de tabbladen zijn smaller gemaakt zodat er vijf passen): "2/14 reached", per achievement 🏆 of 🔒 met naam, doel en bonus ("Serve 100 customers · Drinks +2% pricier") en de voortgang ("37/100"), en onderaan de statistieken.
- **Tutorial-hint** (les `trophy`, na de upgradeles, omdat de speler dan het paneel en de tabbladen kent; de eerste achievement komt al met de eerste klant): wijst Menu en het tabblad Trophies aan (alias `guide-trophies`), daarna de kop van de lijst (doel `trophies-panel`) met een afsluitzin. De eerste stap telt alleen in beeld.

### Dagelijkse bonus (gebouwd in stap 18b; uitwerking door Claude)

- **Code:** `daily/daily.ts` (getallen, de lokale dag, `dailyOffer`, `claimDaily`, en `startDaily` dat één keer per minuut kijkt of er een nieuwe dag begon; één regel in `createWorld`) en `daily/daily-view.ts` met `daily.css` (het kaartje).
- **Wanneer:** één keer per **kalenderdag van de speler** (lokale middernacht). Een nieuwe speler krijgt dag 1 meteen, zodat de les nooit een dag wacht en de lessen erna niet tegenhoudt.
- **Reeks:** elke dag op rij is één stap verder, tot dag 7 (daarna blijft het dag 7). Een gemiste dag begint weer bij dag 1.
- **Beloning:** goud, afhankelijk van het reputatieniveau (dag 1: 50 / 200 / 800 / 3.000 / 10.000 / 30.000 op niveau 1 t/m 6), keer 1 / 1,5 / 2 / 2,5 / 3 / 4 / 6 voor dag 1 t/m 7. Zo blijft de bonus de moeite waard na een verkoop van de taverne (het niveau begint dan opnieuw).
- **Kaartje:** linksboven onder de HUD: "🎁 Daily bonus · Day 3 of 7: +1.6K gold" met een knop Claim; daarna 3 s "Come back tomorrow for day 4!". Het kaartje wacht zolang een andere tutorial-les in beeld is.
- **State:** `daily: { lastDay, streak }` (blijft bij het verkopen van de taverne). Events `daily:available` (een nieuwe dag begon terwijl het spel open is) en `daily:claimed`.
- **Tutorial-hint** (les `daily`, na de trophy-les): wijst de knop Claim aan (doel `daily-claim`), daarna een afsluitzin over de reeks. Wie al eens claimde, krijgt alleen de afsluitzin.
- **Simulator:** de bot claimt niets (een run duurt minder dan een dag), dus de balans blijft gelijk.

### Instellingen (gebouwd in stap 18c)

- **Code:** `settings/settings.ts` (de acties `setVolume`, `setLanguage`, `resetGame` en `importGame`; de talen in `LANGUAGES`) en `settings/settings-view.ts` met `settings.css` (de knop en het venster). `main.ts` geeft de export- en importfunctie van de save-manager door aan `mountUi` (`SaveCodes`).
- **Knop:** een ronde ⚙ links van de Menu-knop, rechtsboven in het spel. Hij opent een venster over het spel (✕ sluit het).
- **In het venster:**
  - **Volume:** een schuifje (0-100%), bewaard als `settings.volume` (0 tot 1). Geluid komt in stap 19; tot dan staat er "Sound arrives in a later update."
  - **Taal:** een keuzelijst met alleen English (`settings.language`); een nieuwe taal is een id in `LANGUAGES` plus een i18n-bestand.
  - **Tutorial:** "Play it again" begint de tutorial opnieuw (dezelfde functie als het debug-commando) en sluit het venster.
  - **Save:** Export zet de save als tekst (base64, de bestaande `exportString`) in een tekstvak met de melding om die te bewaren; Import leest geplakte tekst (`importString`, met migratie en `reconcile`) en vervangt het spel, of zegt "That is not a save this game can read."
  - **Opnieuw beginnen:** "Delete everything" vraagt met een tweede klik ("Sure? Click again to delete", 4 s) en begint een nieuw spel; alleen de instellingen blijven.
- **Na import of opnieuw beginnen** (event `game:replaced`) wordt de save meteen geschreven en laadt de pagina opnieuw, zodat alles wat niet opgeslagen is ook bij het nieuwe spel hoort.
- **State:** `settings: { volume, language }` (blijft bij het verkopen van de taverne en bij opnieuw beginnen).
- **Tutorial-hint** (les `settings`, na de personeelsles, zonder startvoorwaarde): de ketel wijst 5,5 s de ⚙ aan: "Volume, language and a copy of your save are behind the cog."

### Audio (gebouwd in stap 19; echte bestanden sinds stap 19b)

- **Code:** `audio/audio.ts` (de geluids-ids, welke game-event welk geluid speelt, de muziek, `effectiveVolume` en `toggleMute`) en `audio/audio-view.ts` met `audio.css` (laden, afspelen en de luidsprekerknop).
- **Geluiden** (`SOUND_IDS`, elk een bestand `public/audio/<id>.ogg`): tien korte effecten: `plop` (ingrediënt), `bubble` (drankje klaar), `coin` (klant betaalt, ook via personeel; dagbonus), `buzz` (weigering), `buy` (aankoop van upgrade, ingrediënt, kamer, decoratie of uitrusting), `eureka` (ontdekking), `fanfare` (nieuw niveau, achievement, taverne verkocht), `horn` (held terug), `hit` en `miss` (slag tegen de baas). Ze zijn met code gegenereerd (`scripts/audio/make_audio.py`, review in `scripts/audio/REVIEW.md`, herkomst en groottes in `docs/ASSETS.md`). Na de eerste klik haalt `audio-view.ts` ze op en decodeert ze (`decodeAudioData`); een bestand dat niet laadt laat alleen dat geluid stil. Hetzelfde geluid start nooit twee keer binnen 60 ms. Een nieuw geluid is een bestand plus een id in `SOUND_IDS`.
- **Haken** (`SOUND_EVENTS`): per game-event een geluid, of een functie die er een kiest (de baas: raak of mis). Een nieuw geluid is één regel.
- **Muziek:** `music_tavern.ogg` (90 s, 845 KB; `MUSIC` in `audio.ts`) speelt als gapless loop van een gedecodeerde buffer, op de helft van het volume (`MUSIC.share`). Het volume volgt het volume, dempen en ads (elke 300 ms en bij elke state-wijziging).
- **Volume en dempen:** het volume uit de instellingen (stap 18c) en een **luidsprekerknop** 🔊/🔇 links van de ⚙ (`settings.muted`). `effectiveVolume` neemt ook "gedempt door het platform" mee: `muteAudio` van de CrazyGames-SDK gaat voor (aansluiten in stap 20).
- **Browsers:** er wordt pas geluid gemaakt na de eerste klik van de speler (AudioContext pas dan).
- **Tutorial-hint:** de instellingenhint (stap 18c) noemt nu ook de luidspreker: "Psst. The speaker turns the sound off. Volume, language and a copy of your save are behind the cog."

### Receptenboek (wens eigenaar, 2026-10-06; gebouwd in stap 12)

- De speler moet altijd kunnen **terugkijken hoe hij een drankje maakt**. Het receptenboek is een zijpaneel (zoals de winkel, via `app/ui-model.ts`; sinds stap 13b het tabblad Recipes van het ene zijpaneel) met een grid van alle drankjes.
- **Ontdekt recept:** naam, ingrediënten (met hun plaatje of kleur), brouwtijd, prijs, effect en zeldzaamheid. Zo hoeft de speler niets te onthouden en kan hij het recept zonder gokken opnieuw brouwen.
- **Onontdekt recept:** een silhouet met een korte hint (`recipes.<id>.hint`), en bovenaan de voortgang X/N.
- Ingrediënten die de speler nog niet kent (die uit kerkers komen) staan als "?" tot hij ze heeft gehad (gebouwd in stap 15b: "Needs ? from a dungeon").
- ~~Poster op de muur~~: **vervallen** (besluit eigenaar, 2026-10-06, ideeënronde): het receptenboek in het menu is genoeg.
- **Gebouwd in stap 12 (keuzes van Claude, de eigenaar liet de aanbevolen keuze over):**
  - **Ontdekken:** een niveau maakt recepten *ontdekbaar* (`unlocks` in `reputation/reputation.ts`), niet bekend. Past de inhoud van de ketel precies op een ontdekbaar recept, dan komt er "Eureka! <drankje>!" en begint het meteen te brouwen; het recept is vanaf dan bekend (`recipes/recipes.ts`, event `recipe:discovered`). Een combinatie die op geen bekend of ontdekbaar recept kan uitkomen, mislukt zoals voorheen. Klanten bestellen alleen bekende recepten.
  - **Niveau 1 maakt niets ontdekbaar:** in tier 1 is elke combinatie van twee ingrediënten een recept, en een nieuwe speler zou tijdens de basisles per ongeluk iets kunnen brouwen wat niemand besteld heeft. De eerste ontdekkingen komen op niveau 2.
  - **Het schap** toonde de ingrediënten tot de hoogste tier van de bekende én ontdekbare recepten. *Sinds stap 13c:* het schap toont de basisingrediënten plus de gekochte (zie Speelbaarheid, "Gebouwd in stap 13c").
  - **Paneel en knop:** een zijpaneel met een eigen knop "Recipes" links van Shop. Er is steeds maar één paneel open (`app/panels-view.ts`; opent de speler het ene, dan sluit het andere). Per recept een kaartje: **bekend** (naam, zeldzaamheid, ingrediënten met hun kleur van het schap, brouwtijd, prijs en effect), **ontdekbaar** (silhouet "???" met zeldzaamheid en hint) of **op slot** ("Unlocks at <niveau>"). Bovenaan X/N. De melding bij een nieuw niveau noemt het aantal nieuwe recepten, niet de namen.
  - **Poster op de muur:** niet gebouwd en later vervallen (ideeënronde 2026-10-06).
  - **Tutorial-hint:** een les `book` (na de plekken-les, vóór personeel) die start bij het eerste nieuwe niveau (`reputation:levelUp`, of meteen als het niveau al bereikt is): de ketel wijst de knop aan en daarna de kop van het open boek.

- **Balans-simulator** (gebouwd in stap 13): `npm run simulate [-- minuten [seed]]` (standaard 60 minuten, seed 1). `scripts/simulate.mjs` laat de bestaande Vite de TypeScript-code laden (`ssrLoadModule`, geen nieuwe dependency); de logica staat in `src/dev/`: een speler-bot (`bot.ts`, sinds stap 16 weer een eigen bestand: serveert klaarstaande drankjes, probeert eerst nieuwe recepten, brouwt dan bestellingen, speelt de helden (kaartjes, heldendrankjes, tochten) en winkelt; één klik per 0,7 s), de tijdlijn en de runner (`simulator.ts`: het echte spel via `createWorld`, vaste seed, gesimuleerde klok, tutorial overgeslagen) en het rapport (`simulator-report.ts`). Het rapport toont de eerste keer van elke mijlpaal, een tabel per minuut en de tempodoelen uit GAME_ANALYSE.md hoofdstuk 6. **Idle versus actief:** dezelfde run (zelfde seed) waarin de speler de laatste 10 minuten niets doet; doel 30-40%. Doel later: eerste prestige na ~1 tot 2 uur (prestige komt in stap 17).

### Gameplay-ronde na de art-pass (wensen eigenaar, 2026-10-12; uitwerking Claude, stap 22a, 22b en 22c)

De eigenaar speelde de game na stap 21 en gaf zes punten. De wens zelf is van de eigenaar; de uitwerking en de getallen gemarkeerd met *(voorstel)* zijn van Claude en worden in de stap zelf nagemeten of aan de eigenaar voorgelegd.

**1. De winkel toont geleidelijk, niet alles in één keer (stap 22a).** Nu staan vanaf de start alle upgrades in de winkel, plus alle ingrediënten, kamers en decoraties met "Unlocks at …". Dat is overweldigend en verraadt alles.
- **In zicht komen:** een aanbod (upgrade, ingrediënt, kamer, decoratie; in het tabblad Heroes de uitrusting; in de Legacy de bonussen) komt in de lijst zodra (a) het reputatieniveau ervan bereikt is en (b) de speler in deze taverne ooit minstens **de helft** van de prijs van het eerste niveau tegelijk had *(voorstel: 50%)*. Uitzondering: Swift Cauldron staat er vanaf de start, zodat de winkel nooit leeg is.
- **Blijft staan:** wat eenmaal getoond is, blijft staan (ook als het goud weer zakt), tot het uitverkocht is. De state onthoudt dat (`shopSeen`: ids per soort, of één lijst met voorvoegsel); bij het verkopen van de taverne gaat die terug naar leeg (de Legacy-lijst niet, die hoort bij de blijvende voortgang).
- **Teaser:** per groep (Cauldron, Tavern, Staff, Night, Ingredients, Rooms, Decorations, Gear) staat hoogstens **één** item dat nog niet in zicht is, grijs, met naam en "Unlocks at <niveau>" of "Save up to see it" *(voorstel)*, zodat de speler weet dat er meer komt. Een groep zonder zichtbaar of teaser-item heeft geen kopje.
- **Nieuw:** een item dat net in zicht kwam, krijgt een label "New!" tot het tabblad open is geweest; de Menu-knop en het tabblad krijgen een bolletje zolang er iets nieuws is.
- **Tutorial:** de bestaande lessen starten pas als iets betaalbaar is, en dan staat het al in de winkel (50% < 100%), dus ze blijven kloppen. Nieuwe hint: de eerste keer dat er iets nieuws is terwijl het menu dicht is, wijst de ketel het bolletje aan ("Something new in the shop.").

**2. Uitverkocht verdwijnt uit de winkel (stap 22a).** Wat de speler niet meer kan kopen, staat niet meer in de lijst: upgrades op hun hoogste niveau (nu nog met "Maxed"), Legacy-bonussen op hun hoogste niveau, gekochte uitrusting. (Gekochte ingrediënten, kamers en decoraties en eenmalige upgrades verdwijnen al.) Upgrades zonder maximum blijven altijd staan.

**3. Zelf blijven brouwen terwijl de brouwer werkt: een eigen ketel voor de brouwer (stap 22b).** Nu gebruikt de brouwer-assistent dezelfde ketel als de speler: zolang hij brouwt, kan de speler niets ("busy"), ook geen nieuwe recepten proberen. Gekozen oplossing *(voorstel; het patroon bestaat al bij de heldenketel)*:
- De brouwer-assistent krijgt een **eigen ketel** met een pixel-art figuur (de brouwer) ernaast. Plek *(voorstel)*: achter of naast de bar, zodat zijn drankjes zichtbaar naar de bar gaan; de precieze plek bepaalt de stap in `layout.ts` (de plekken op de bar mogen daarvoor schuiven).
- De taverneketel is dan **alleen van de speler**: de brouwer raakt hem nooit aan. De regel dat de brouwer na 15 s een half gevulde ketel van de speler leeggooit (`staleCauldronMs`, `createStaleWatch`) vervalt.
- De brouwerketel brouwt de bestelling van de oudste wachtende klant die nog niet op de bar staat (zoals nu), met de normale brouwtijd (Swift Cauldron telt mee). Het drankje komt op dezelfde bar; staat die vol, dan wacht de brouwer. Kerker-ingrediënten worden net zo verbruikt als nu.
- Wat de speler ziet: de brouwer roert, zijn ketel pruttelt en kookt (dezelfde animaties als de grote ketel, kleiner), en een drankje vliegt naar de bar.
- Tutorial: de personeelsles noemt de eigen ketel ("Your brewer has their own kettle, so yours stays free for new recipes.").

**4. Drankjes weggooien, zodat de bar nooit vastloopt (stap 22b).** Nu kan een volle bar met drankjes die niemand bestelt (bijvoorbeeld na het uitproberen van recepten) de speler en de brouwer blokkeren: nieuwe drankjes kunnen er niet bij ("full"), en klanten vertrekken.
- **Slopemmer:** naast de bar staat een emmer (pixel art). Pak een drankje op (klikken, zoals nu) en klik op de emmer: het drankje is weg (een plons-effect en een grappige regel). Geen geld terug. Een opgepakt drankje terugzetten blijft zoals nu (op een lege plek klikken).
- **Personeel ruimt op:** staat de bar vol en wil geen enkele wachtende klant een van de drankjes, dan gooit de serveerster na een tijdje *(voorstel: 20 s)* het oudste drankje dat niemand wil weg. Zo loopt idle nooit vast.
- **Tutorial-hint** (nieuwe les `slop`, onlyWhenShown): de eerste keer dat de bar vol staat met een drankje dat niemand wil, wijst de ketel eerst het drankje en dan de emmer aan: "Nobody wants that one. Pick it up and tip it in the bucket." Klaar bij het eerste weggegooide drankje.
- Event `drink:discarded` (voor de les, het geluid en het effect); een geluid kan een bestaand effect zijn (`buzz`) of later een eigen bestand.

**5. Automatisering sneller, zodat de speler eerder andere dingen doet (stap 22c).** Nu start een brouwer op niveau 1 een drankje elke ~33 s (0,03 per s) en serveert een serveerster op niveau 1 elke 25 s (0,04 per s); dat voelt te traag.
- **Begin** *(voorstel)*: niveau 1 ongeveer 2,5 keer zo snel: de brouwer elke ~12 s (0,08 per s), de serveerster elke ~10 s (0,1 per s). De prijzen van het personeel mogen omhoog als dat nodig is voor de balans.

**6. Automatisering op het einde snel genoeg dat niemand meer zonder drankje vertrekt (stap 22c).**
- **Volledig getraind** (niveau 7) houdt het personeel de drukste instroom bij (alle plekken, inclusief de kamers, en de kortste wachttijd tussen klanten). Om dat te halen brouwt de brouwerketel op hogere niveaus **meerdere drankjes tegelijk** *(voorstel: 2 vanaf niveau 4, 3 op niveau 7)*, en het tempo per niveau groeit sneller dan nu.
- **Nieuwe meetdoelen** *(voorstel, de eigenaar bevestigt bij stap 22c)*, met `npm run simulate` over seeds 1 t/m 9:
  - idle (de laatste 10 minuten niets doen, met het personeel dat de bot dan heeft) levert **50 tot 70%** van actief spelen (was 30 tot 40%: de eigenaar wil dat de automatisering meer doet; actief spelen blijft het meest opleveren);
  - met volledig getraind personeel vertrekt **hoogstens 5%** van de klanten zonder drankje (het rapport krijgt daarvoor een regel);
  - de tempodoelen uit GAME_ANALYSE.md hoofdstuk 6 (eerste personeel, eerste kamer, eerste prestige) blijven gelden.
- De offline-formules volgen vanzelf (ze rekenen met het tempo van het personeel); de Night Shift-getallen worden nagemeten.

### Meer advertenties en rewarded beloningen (wens eigenaar, 2026-10-12; uitwerking Claude, stap 22d)

De eigenaar wil iets meer advertenties: **tussendoor iets meer (niet te veel)**, en vooral dat spelers **zelf een ad kunnen kijken** voor iets nuttigs: een power-up, meer goud, of iets in de winkel sneller kopen. De wens is van de eigenaar; de uitwerking en de getallen met *(voorstel)* zijn van Claude en worden bij stap 22d aan de eigenaar voorgelegd.

**Nu (stap 20):** een midgame-ad alleen als een held terugkomt (hooguit elke 3 minuten, `ADS.gapMs`), en één rewarded ad: het offline-loon verdubbelen in het welkom-venster. Vóór de gildekamer (niveau 5, ongeveer minuut 13) ziet een speler dus nooit een ad.

**1. Midgame iets vaker, op natuurlijke momenten.**
- Extra momenten *(voorstel)*: een nieuw reputatieniveau (na de melding), een kamer gebouwd, en het sluiten van het welkom-venster. De held die terugkomt blijft.
- Grenzen *(voorstel)*: minstens **4 minuten** tussen twee ads (CrazyGames eist minstens 3), geen midgame-ad in de **eerste 5 minuten** van een nieuwe speler, en nooit terwijl een tutorial-les in beeld is, een baasgevecht loopt of een kaartje open staat. Een rewarded ad telt mee voor de wachttijd (zoals nu).

**2. Rewarded ads: de speler kiest zelf** (altijd opt-in, met een duidelijke knop "📺 Watch an ad"; bij `adblock`, `unfilled` of een fout: geen ad, geen beloning, gewoon doorspelen, zoals nu).
- **Goudbuidel** *(voorstel)*: goud gelijk aan ongeveer **3 minuten** van wat de speler nu verdient (gemeten over de laatste minuten, minimaal een vast bedrag per reputatieniveau, zoals de dagbonus).
- **Power-ups** *(voorstel, één tegelijk, elk een paar minuten)*: **Happy Hour** (drankjes 2× zo duur, 3 min), **Extra handen** (personeel 2× zo snel, 5 min), **Haast** (ketel 2× zo snel, 3 min). Ze tellen mee in `getMultipliers` als tijdelijke bron, met een balkje en aftelling in de HUD.
- **Sneller kopen in de winkel** *(voorstel)*: een rij in de winkel die de speler nog niet kan betalen maar waarvan hij al **minstens 70%** heeft, krijgt een knopje 📺: na de ad betaalt de speler alleen wat hij heeft en is het item gekocht (het tekort is gratis). Hooguit één keer per **5 minuten** *(voorstel)*.
- **Helden** *(voorstel, optioneel)*: een held die rust meteen fit maken, of een lopende tocht meteen laten eindigen.
- **Bestaand:** het offline-loon verdubbelen blijft.
- **Hoe de speler het ziet** *(voorstel)*: een rondtrekkende **marskramer** komt af en toe (ongeveer elke 5 minuten, niet tijdens een les) de taverne binnen met één aanbod (goud of een power-up) en gaat na 30 s weer weg; klikken toont het aanbod met de ad-knop. Het winkelknopje 📺 staat gewoon bij de rij. Zo is een rewarded ad nooit opdringerig en altijd een keuze.
- **Grenzen:** geen pay-to-win en niets wat alleen via ads kan (ontwerppijler 5 in GAME_ANALYSE); de beloning is altijd iets wat de speler ook door spelen haalt, alleen sneller.
- **Tutorial-hint:** de eerste keer dat de marskramer komt, wijst de ketel hem aan ("A peddler! Watch an ad for a treat, or ignore him.").
- **Simulator:** de bot kijkt geen ads, dus de balans blijft gelijk; de beloningen schalen met het eigen tempo van de speler.

### Rendering

- Phaser `Scale.FIT`, vaste ontwerpresolutie **1280×720**, gecentreerd, `pixelArt: false`.
- **Besluit (2026-10-06): de eindstijl wordt pixel art.** Oorspronkelijk plan: ontwerpresolutie 320×180 met `pixelArt: true`.
- **Uitwerking (stap 21a, 2026-10-12, keuze van Claude na "ga verder" van de eigenaar):** het canvas en alle coördinaten in `layout.ts` blijven **1280×720**; de art wordt getekend op een kwart (één art-pixel = `PIXEL` = 4 ontwerp-pixels, de achtergrond is 320×180) en per texture met nearest-neighbour opgeschaald. Geen globale `pixelArt: true`, omdat die de tekst in het canvas (bestellingen, labels, zwevende tekst) blokkerig maakt; wel `roundPixels: true`. Zo hoeven `layout.ts`, de tutorial-doelen en de UI-schaling niet mee te veranderen.
- **Pijplijn (stap 21a):** sprites zijn tekstrasters met een palet in de eigen feature (`<feature>/<feature>-art.ts`, puur, dus testbaar); `shared/pixels.ts` heeft de tekenhulpjes (spiegelen, pixels zetten, frames naast elkaar) en `app/textures-view.ts` maakt er bij het starten Phaser-textures en animaties van. Er zijn dus geen beeldbestanden om te laden. De statische achtergrond (muren, vloer, deur, raam, haard, plank, tafels, bar en krukjes) is één beeld uit `app/backdrop-art.ts`. `npm run pixel:preview` schrijft PNG-voorbeelden naar `art/pixel/` (via Vite, zoals de simulator); `src/dev/art-preview.ts` houdt de lijst `ART` van alle sprites bij, die de tests ook nalopen.
- **Klanten (stap 21b):** `customers/customer-art.ts` tekent de ridder, de elf, de dwerg en de koning (VIP) op 14×22 art-pixels uit een hoofd en romp per type op gedeelde benen, met tien frames: staan, knipperen, twee loopframes, zitten, zitten met knipperen, drinken (pul opzij en aan de mond), juichen en boos (wenkbrauwen en een rood hoofd). `customers-view.ts` speelt per toestand een animatie (`POSE_FRAMES`): lopen naar de plek en terug, zitten op de kruk met af en toe knipperen, boos zitten zodra het geduld onder 25% komt, juichen met een sprongetje bij het serveren en daarna drinken tot het drankje op is, kort boos kijken (en schudden) bij een weigering. Wie te lang wachtte, loopt rood aangelopen weg. Een klanttype zonder eigen uiterlijk wordt als ridder getekend.
- **Ingrediënten, helden, kamers en decoraties (stap 21c):** `brewing/ingredient-art.ts` (acht ingrediënten van 10×11: een pot slijm, een honingpot, een lichtgevende paddenstoel, een peper, druiven, een stinkend flesje, een parel in een schelp en mos in een kommetje; een ingrediënt zonder art is een gewone pot). Ze staan op de plank (groter bij aanwijzen, grijs als een kerker-ingrediënt op is) en verkleind in de ketels. `heroes/hero-art.ts`: de krijger (hoornhelm, zwaard) en de magiër (puntmuts, staf met bol) zijn figuren met dezelfde benen en poses als de klanten; ze staan met af en toe knipperen, lopen bij vertrek en terugkomst, en zijn grijs als ze rusten. De heldenketel pruttelt en kookt. `rooms/rooms-art.ts`: elke kamer is één beeld van 71×36 (de uitbreiding met lange tafel, krukjes en lantaarns; het alchemielab met planken vol flesjes en een paarse ketel; de VIP-lounge met donkerrode muur, schilderij, fauteuils en rode loper; de gildekamer met banier, wapenrek en stapelbed), of dichtgetimmerd met planken. `decor/decor-art.ts`: fakkels met flakkerend vuur (drie frames, de eeuwige fakkel blauw) en een zacht ademende gloed, de everzwijnkop en de gouden pul op een schildvormig bord, en tapijten op maat van hun plek. De ruimte tussen de kamers is 8 in plaats van 10 ontwerp-pixels, zodat ze op het pixelraster vallen.
- **Lettertype (stap 21d):** Pixelify Sans (SIL OFL, `public/fonts/PixelifySans.ttf`, 79 KB, uit de Google Fonts-repository) voor alle tekst: in de DOM via `--font` in `index.html`, in het canvas via `FONT` in `config.ts`. `main.ts` wacht hooguit 1,5 s op het lettertype voordat het canvas tekst tekent.
- **Wolkjes, bordjes en kaders (stap 21d):** `app/ui-art.ts` tekent op maat: een spraakwolkje met staartje (de bestelling; groene rand als de klant het opgepakte drankje wil), houten bordjes met planken, nerf, dikte en spijkertjes, een touw, en 9×9-kaders voor de DOM (`--frame-parchment`, `--frame-wood`, `--frame-dark`, via `app/pixel-dom-view.ts` als CSS-variabelen, voor `border-image`). De dichtgetimmerde kamers hebben een houten bord aan twee touwen dat meestal stil hangt en af en toe even uitwiebelt (per bord op een eigen moment, soms niet). De namen onder de ingrediënten staan op houten plankjes aan twee touwtjes, met lichte letters. Het aftellen van een held staat op een perkamenten plaatje.
- **Mascotte (stap 21d):** de tutorial-wolk heeft het perkamenten pixelkader en de ketel uit het spel, die pruttelt (vier frames als CSS-animatie).
- **Effecten (stap 21d, `app/juice-view.ts` en `app/juice-art.ts`):** Phaser-partikels (eenmalig gemaakt, per effect alleen een uitbarsting): draaiende munten die opspringen en vallen als een klant betaalt en bij de dagbonus, sterretjes bij een ontdekking, een nieuw niveau en een terugkerende held, stoomwolkjes als een drankje klaar is en rode wolkjes bij een weigering. Een legendarisch drankje ontdekken geeft meer sterretjes, een schermschud en een warme flits. De hoeveelheden staan in `JUICE`.
- **Panelen en vensters (stap 21e):** alles in hout, zoals een winkel: het zijpaneel en de vensters (instellingen, welkom terug, tochtkaartjes) zijn een donkere houten wand (`--wood`, een tegel van planken) in een houten lijst (`--frame-panel`), met lichte letters en gouden titels. Kaarten in de lijsten (winkel, helden, recepten, Trophies) zijn houten planken (`--frame-plank`); bereikte trophies zijn goud. Knoppen hebben pixelkaders: groen om te kopen of te doen, goud voor geld en Legacy, hout voor keuzes en tabbladen (het open tabblad is goud), rood voor gevaar (alles wissen, de baas slaan), grijs als iets niet kan. De HUD staat op donkere houten plaatjes, de dagbonus op een goudgerand briefje, het niveau-bericht op een donker plaatje, het baasgevecht op paars. De legenda in het receptenboek blijft een perkamenten briefje. Alle kaderstijlen staan in `FRAME_STYLES` (`app/ui-art.ts`) en komen als `--frame-<stijl>` in de CSS.
- **Pixel-iconen (stap 21e):** `app/icon-art.ts` heeft 28 iconen van 8×8 (hartje, de vier effecten, kroon, rugzak, Golden Hop, trophy, slot, cadeau, kaart, pleister, herhalen, zwaarden, schild, helm, amulet, menu, ad, sluiten, tandwiel, luidspreker aan/uit, raak, mis, nog te gaan, pijl). De teksten (i18n) houden de emoji; in de DOM vervangt `installPixelIcons` (`app/pixel-dom-view.ts`) ze door pixelplaatjes zodra een tekst verschijnt of verandert (niet in tekstvakken); in het canvas zet `createIconText` (`app/icon-text-view.ts`) woorden en iconen naast elkaar (bestelwolkjes, zwevende tekst, het heldenplaatje). Het groene pijltje boven een klant of held is ook een icoon. Een nieuw icoon is één regel in `ICONS`.
- **Thumbnails (stap 21d):** `npm run pixel:preview` schrijft ook `art/pixel/thumbnail-landscape.png` (1920×1080), `thumbnail-square.png` (800×800) en `thumbnail-portrait.png` (800×1200): ruw materiaal voor de CrazyGames-covers; titel en logo komen er later in een beeldprogramma op.
- Doorsnede-taverne: kamers als vaste "slots" in één scene; nieuwe kamer = nieuwe slot zichtbaar maken, geen camerabeweging. De bovenverdieping heeft 4 kamervakken (3 in stap 14a; de gildekamer kwam er in stap 15a bij).
- Objectpools voor klanten, muntjes en partikels. Maximaal ~30 gelijktijdige klanten-sprites.
- DOM-overlay (`#ui-root`) bovenop het canvas voor HUD, knoppen en tutorial. Zijpanelen (winkel en receptenboek; vanaf stap 13b één paneel met tabbladen, later ook instellingen en helden) staan **rechts van het spel binnen dezelfde overlay**: `app/ui-model.ts` houdt hun breedte bij (ontwerp-pixels), en spel plus paneel samen vormen één kader dat in het venster past (`fit-root.ts`; `game-viewport.ts` zet het canvas op het spel-deel). Het paneel is dus even hoog als het spel, schaalt mee en loopt nooit door de lege balken van een venster dat niet 16:9 is. Het spel blijft bedienbaar (serveren) terwijl een paneel open staat. Die lege balken gebruiken we nergens voor.
- Doel: 60 FPS op gemiddelde laptop, speelbaar op Chromebook (4 GB).

### Assets

- **Eerlijke kanttekening:** ik kan geen geschilderde/AI-afbeeldingen genereren. Wel kan ik **pixel-art-sprites schrijven als tekstrasters met een palet** (zie `scripts/pixel/` en `art/pixel/`; een script maakt er PNG's van, zonder dependencies) en **CC0/vrije assets opzoeken** (bijv. Kenney.nl, OpenGameArt; per asset de licentie checken). Downloaden doe ik alleen na jouw akkoord per bestand. Ingewikkelde sprites (zeldzame klanten, helden, gebouwen) kun je beter via een beeldtool of CC0-pakket laten maken; eenvoudige klanten, ingrediënten en meubels lukken in dit formaat.
- Stap 1 t/m 20: **placeholders** (gekleurde vormen + emoji) zodat spelen niet op art wacht. Sinds stap 21a wordt de art in code getekend (zie Rendering); sinds stap 21e worden ook de emoji als pixel-iconen getekend.
- Stap 21: volledige styling-stap in pixel art, met animaties (zie stap 21 in hoofdstuk 12).
- Elke gebruikte externe asset komt met bron en licentie in `docs/ASSETS.md`.
- Budget: alle assets samen < 5 MB. Muziek: korte loopbare mp3/ogg (jij levert), < 2 MB per track.

### i18n

- `t('sleutel')` met sleutels per domein (`recipes.slime_sap.name`). Basis: **Engels**. Nederlands later als vertaalbestand + taalknop in Settings.
- Spelers-zichtbare getallen/tekst nooit samenstellen met losse string-plakkerij; gebruik parameters (`t('toast.gold', { n })`).
- **Bestanden:** `i18n/en.ts` voegt alle domeinen samen (één spread per domein). Sinds stap 15a staan de winkel, upgrades, kamers en decoraties in `i18n/en-shop.ts` en de helden en kerkers in `i18n/en-heroes.ts` (`en.ts` zat op 297 regels). Een nieuw gebied met veel tekst krijgt een eigen `en-<gebied>.ts`.

---

## 5. Datamodel (schetsen)

```ts
Ingredient { id, tier, rarity, source: 'shop' | 'dungeon:<id>', buy?: { level, cost } }   // zonder buy: basisingrediënt
Recipe     { id, tier, rarity, ingredients: id[2..3], brewSeconds, basePrice,
             effect: 'strength' | 'speed' | 'luck' | 'charm' }   // naam en hint: i18n-sleutels recipes.<id>.name/.hint
Customer   { id, minLevel, patienceSeconds, spendMultiplier, likes: effect[], vip?, reputationBonus? }
ReputationLevel { id, minReputation, teaches?: recipe id[] }
Upgrade    { id, kind, baseCost, growth, effect, maxLevel? }
Room       { id, buy: { level, cost }, seats, effects: UpgradeEffect[] }   // stap 14a; tekst rooms.<id>.name/.description
Decor      { id, buy: { level, cost }, effects: UpgradeEffect[] }          // stap 14b; tekst decor.<id>.name/.description
HeroClass  { id, hire: { cost } | 'withGuildRoom', potionPower, bossPower }   // stap 15a, potionPower in 16, bossPower in 16b; tekst heroes.<id>.name/.class/.tagline
Gear       { id, slot: 'sword' | 'shield' | 'helmet' | 'amulet', power, buy?: { cost } }   // stap 15c (gebouwd); zonder buy: alleen buit; tekst gear.<id>.name
Dungeon    { id, recommendedLevel, durationSeconds, xp, lootRolls, drops: { ingredient, weight, amount }[], gearChance, gearDrops: { gear, weight }[], cards: Card[] }   // 15a, 15c (gearChance, gearDrops) en 16
Boss       { id, hp, loot: TripMods }   // stap 16b, in BOSSES per kerker-id; tekst bosses.<id>.name
Card       { id, options: { id, default?, needsDrink?, mods, boost?: { effect, mods(p) } }[] }   // stap 16 (gebouwd); mods: duur, buit, kans gewond, kans op gear, extra buit
// State: heroes per klasse { level, xp, injuredUntil, expedition: { dungeon, endsAt, drinks, cards: { id, at, choice, drink? }[], boss?: { hits, lastAt } } | null, gear, bag, auto } (15a, gear 15c, bag/drinks/cards 16, boss 16b, auto 16c), quartermaster: boolean (16c),
// ingredientStock: { [kerker-ingrediënt]: aantal } (15a), gearOwned: id[] (15c)
LegacyDef  { id, baseCost, maxLevel, effects: UpgradeEffect[], startGold? }   // stap 17; tekst legacy.<id>.name/.description
// State: prestige: { hops, totalHops, runs, runEarned (Decimal), legacy: { [id]: niveau } } (17)
AchievementDef { id, stat, goal, bonus: UpgradeEffect, big? }   // stap 18a; tekst achievements.<id>.name
// State: stats: { served, vipServed, goldEarned (Decimal), trips, bossWins }, achievements: id[] (18a; blijven bij verkopen)
// State: daily: { lastDay (lokaal dagnummer), streak } (18b; blijft bij verkopen), settings: { volume (0-1), muted, language } (18c, muted 19)
```

Contentomvang MVP: ~30 recepten, ~25 ingrediënten, 8 klanttypes, 3 kamers, 4 heldenklassen, 3 kerkers, ~40 upgrades.

---

## 6. Platform-laag (CrazyGames)

`src/platform/` is de **enige** plek die `window.CrazyGames` aanraakt. *Gebouwd in stap 20 (API gecontroleerd op docs.crazygames.com op 2026-10-12, SDK v3.8.0 in de lokale test):*

- **Interface `Platform`** (`platform/platform.ts`, een echte naad zoals tijd en opslag): `environment`, `storage`, `loadingStart/Stop()`, `gameplayStart/Stop()`, `happytime()`, `requestAd(type, onStart)` (geeft `finished` of `failed`), `muted()` en `username()`.
- **`platform/crazygames.ts`** (in de ESLint-uitzondering voor browsercode, naast `shared/browser.ts`): `createCrazyGamesPlatform()` laadt niets zelf; het script staat in `index.html` (de enige externe request, hoofdstuk 1 regel 8). Zonder script, als `init()` faalt of in de omgeving `disabled` geeft het `null` en gebruikt het spel `createMockPlatform()` (logt, en een ad "speelt" meteen tot het eind, zodat de flows lokaal te proberen zijn). Op `localhost` draait de SDK in de omgeving `local` (ads zijn een tekst-overlay).
- **Opslag:** op CrazyGames (`environment === 'crazygames'`) gaat de save naar de data-module (zelfde API als localStorage, gesynct met het account, limiet 1 MB); een save die nog in localStorage stond, gaat één keer mee. Elders blijft het localStorage. `main.ts` wacht op de SDK voor het laden van de save.
- **Laden en spelen:** `loadingStart` voor het laden, `loadingStop` als de UI staat; `createGameplay` stuurt `gameplayStart/Stop` op redenen om te pauzeren ("loading" bij de start, "hidden" bij een verborgen tab, "ad" tijdens een advertentie) en geeft alleen wijzigingen door.
- **Ads** (`createAds`): tijdens een ad is het spel gepauzeerd (de ticker slaat die tijd over met `skip()`) en stil. **Midgame:** als een held terugkomt (een natuurlijk moment), hooguit elke 3 minuten (`ADS.gapMs`; ook een rewarded ad telt). Niet bij het verkopen van de taverne: daarna laadt de pagina opnieuw. **Rewarded:** alleen als de speler kiest: "📺 Double it (watch an ad)" in het welkom-venster betaalt het offline-loon nog een keer uit (`payOfflineAgain`). Elke fout (`unfilled`, `adblock`, `adCooldown`, `adsDisabledBasicLaunch`) = gewoon doorspelen, geen beloning.
- **Happytime** bij de drie grote achievements (`big`: alle recepten, een legendarisch drankje, de taverne verkocht).
- **Geluid:** `muted()` van de SDK (`game.settings.muteAudio`) gaat voor de eigen instelling; tijdens een ad is alles stil.
- **Gebruiker:** met een CrazyGames-account staat in de instellingen een regel dat de voortgang in het account is opgeslagen.
- **Direct in gameplay:** er is geen hoofdmenu. De speler staat meteen in de taverne met de eerste klant; instellingen via een tandwiel.

---

## 7. Teststrategie

- **Vitest** voor alle pure logica (`shared/` en de feature-bestanden zonder `-view`): kosten-formules, offline-berekening, save/migratie, prestige-berekening, receptontdekking.
- **Handmatig in browser** (ik gebruik de ingebouwde browser) na elke visuele stap: laden, geen console-errors, framerate-indruk.
- **Balans-simulator** vanaf stap 13. Sinds de vlakke architectuur ook het regressie-orakel bij refactors: `npm run simulate -- 60 1` is deterministisch en moet voor en na een refactor byte-identiek zijn.
- **Save-compatibiliteitstest:** een vastgezette oude save moet na elke versie laden (fixture in `tests/fixtures/`).

---

## 8. Performance- en groottebudget

| Meting | Doel |
|---|---|
| Initiële download | < 8 MB (limiet 50 MB) |
| JS-bundle (gzip) | < 1,5 MB |
| Assets totaal | < 5 MB |
| Tijd tot eerste speelbaar beeld | < 3 s op gewone verbinding |
| FPS | 60 op laptop, ≥ 30 op Chromebook |
| Geheugen | < 300 MB tab |
| Saves | < 200 KB |

---

## 9. Code-conventies

- `strict` TypeScript, geen `any`, geen `// @ts-ignore`.
- **Pragmatisch SOLID, plat en per feature** (besluit 2026-10-07, na een te ver doorgeslagen eerste opzet):
  - **S:** één reden om te veranderen per **feature-bestand** (een feature hoort bij elkaar in één map). Niet: één functie per bestand.
  - **O:** uitbreiden via data of een tabel/registry, geen `if`-ketens op type. Een nieuw recept, klanttype, upgrade of kamer is nieuwe data.
  - **L en D:** alleen bij echte naden: tijd (`Clock`), willekeur (`Rng`), opslag (`StorageAdapter`: localStorage, geheugen, later de SDK) en later het platform. Die worden ingespoten via `World`, zodat tests en de simulator deterministisch zijn. Geen interface, factory of adapter met maar één implementatie.
  - **I:** rekenfuncties nemen alleen de waarden die ze nodig hebben (`computePayout(recipe, type, multiplier)`); acties en tick-updates nemen `world`. Geen eigen `XStore`/`XDeps`-interfaces met optionele velden.
- **Anti-over-engineering:** geen `index.ts`-barrels; geen wiring-, dispatcher-, manager-, facade- of actions-laag die alleen doorgeeft; geen nieuw bestand of nieuwe map voor minder dan ~50 regels; geen abstractie "voor later". Een nieuwe feature = een map plus één regel in `app/world.ts`.
- **Zero-allocation in de game-loop:** `shared/pool.ts` blijft voor klant-sprites, zwevende tekst en partikels. In `update()` van views en in tick-handlers geen nieuwe arrays, objecten, closures of spreads per frame/tick als het te vermijden is. Bij een refactor worden algoritmes verplaatst, niet herschreven (ook de volgorde van RNG-aanroepen blijft gelijk).
- Functies overzichtelijk (lint: max 60 regels), liever pure functies dan klassen. Klassen alleen waar Phaser het vraagt (Scenes).
- Geen magische getallen in logica: naar een `*-data.ts`-bestand of constanten.
- Geen commentaar dat herhaalt wat de code doet; wel één regel *waarom* bij niet-voor-de-hand-liggende keuzes.
- Imports met pad-alias `@/` naar `src/`.
- Geen `console.log` in productie (een `debug()`-helper die in de build verdwijnt).

---

## 10. Definition of Done (per stap)

1. De stap-beschrijving is volledig uitgevoerd, niets extra's.
2. `npm run check` slaagt (typecheck, lint, regelgrens, tests).
3. Visuele stappen: in de browser gecontroleerd, geen console-fouten.
4. Geen bestand > 350 regels; bestanden boven 300 regels zijn bewust (en gemeld) of worden gesplitst. Geen onnodige abstractielagen toegevoegd (hoofdstuk 9).
5. Heeft de stap een nieuwe speler-functie? Dan hoort daar een korte **tutorial-hint** bij (zie hoofdstuk 4, Tutorial).
6. **SPECS.md is bijgewerkt (verplicht, laatste commit van de stap):**
   - Voortgangsoverzicht bovenaan: status van de stap, branch, wat de volgende stap is.
   - Stap afgevinkt in hoofdstuk 12.
   - Logboek (hoofdstuk 14): nieuwe entry met *wat er gedaan is*, *waarom* (gemaakte keuzes), *afwijkingen van het plan*, *wat je nu kunt proberen* en *wat er nog moet gebeuren*.
   - Zijn er door de stap nieuwe inzichten, risico's of aangepaste eisen? Dan ook de relevante hoofdstukken (en zo nodig GAME_ANALYSE.md) aanpassen en dat melden.
7. Korte samenvatting aan jou in de chat: wat is er, wat kun je proberen, wat is de volgende stap.

Een stap is **niet** klaar als punt 6 ontbreekt.

---

## 11. Werkafspraken voor Claude

- Begin elke codeer-sessie met het lezen van dit bestand en `CLAUDE.md`.
- Vraag bij twijfel over een speelkeuze (balans, humor, volgorde); neem technische standaardkeuzes zelf en meld ze.
- Houd bestanden tussen 150 en 300 regels met bij elkaar horende functies; krijgt een bestand twee echt verschillende redenen om te veranderen of komt het boven 300 regels, splits het dan. Voeg kleine dingen toe aan het feature-bestand in plaats van een nieuw bestand te maken.
- Als een stap te groot blijkt: stop, stel een opsplitsing voor.

### Git-werkwijze (per stap)
Jij maakt de repository en de GitHub-koppeling zelf aan. Daarna werkt het zo:

1. **Branch per stap:** `step-NN-korte-naam` (bijv. `step-07-brew-and-serve`), aangemaakt vanaf een bijgewerkte `main`.
2. **Een paar logische commits per stap (ongeveer 2 tot 3)**, niet overdrijven (bij een grote refactor één commit per fase, elk een groen terugvalpunt). Bijvoorbeeld: één commit voor de code met bijbehorende tests, één voor de SPEC-update, en alleen extra commits als de stap echt uit losse delen bestaat. Berichten in het Engels, korte imperatieve zin.
3. **Laatste commit van de stap** is de SPECS.md-update (hoofdstuk 10, punt 6).
4. **Terug mergen naar `main`:** alleen nadat jij het resultaat hebt bekeken en zegt dat het mag ("merge stap N"). Standaard `--no-ff`, zodat elke stap als blok in de geschiedenis zichtbaar blijft.
5. **Pushen en mergen:** de eigen branch (`step-…` of `chore-…`) committen en pushen mag zonder te vragen (besluit 2026-10-12; daarvoor: nooit pushen tenzij gevraagd). Mergen naar `main` alleen als jij het **per stap** zegt; een eerdere toestemming geldt niet automatisch voor de volgende stap. Na een afgeronde stap of een merge stop ik tot jij zegt verder te gaan, en ik begin geen nieuwe stap zonder jouw woord. Geen force-push, geen herschrijven van geschiedenis op `main`.
6. **Auteur:** commits gebruiken de `user.name` en `user.email` uit jouw git-configuratie, dus jij staat als auteur. **Besluit: geen enkele vermelding van Claude of AI in git of GitHub.** Dus geen `Co-Authored-By`-regel, geen "Generated with Claude Code" in commitberichten, PR-beschrijvingen of branchnamen, en geen `--author`-override. Alleen jouw naam staat erin. Gebruik `git config` nooit aanpassen om een andere identiteit in te stellen.
7. Geen commit zonder dat `npm run check` slaagt (behalve een expliciete "work in progress"-commit die ik als zodanig benoem).

---

## 12. Stappenplan

Zeg: "Doe stap N". Elke stap is los te testen. Stappen bouwen op elkaar, dus volgorde aanhouden. De status per stap staat in het Voortgangsoverzicht bovenaan; hieronder staat wat elke stap inhoudt.

### Fase A: Fundament
- [x] **Stap 1: Project opzetten.** Vite + TypeScript (strict) + Phaser + Vitest + ESLint. `npm run dev|build|check|test`. `scripts/check-lines.mjs`, ESLint `max-lines`, lagen-regels via `no-restricted-imports`. `.gitignore`. Lege Phaser-scene (1280×720, FIT) toont "Hello tavern". Productiebuild bundlegrootte rapporteren.
  *Klaar wanneer:* `npm run check` en `npm run build` slagen, pagina laadt zonder fouten, bundlegrootte genoteerd.
- [x] **Stap 2: Core.** Decimal-wrapper + getalformattering (K/M/B/T/aa…), `GameState`-type, store met subscribe, event-bus, vaste 100 ms-tick op `Date.now()`-delta, debug-helper. Tests.
  *Klaar wanneer:* tests voor formattering en tick slagen (incl. grote delta's).
- [x] **Stap 3: Save-systeem.** Serialize/deserialize (Decimal↔string), versie + migratie, `StorageAdapter` + `localStorageAdapter`, autosave, export/import-string. Tests incl. fixture.
  *Klaar wanneer:* state overleeft herladen; oude fixture laadt; kapotte save valt netjes terug op nieuwe game.
- [x] **Stap 4: i18n + data-schema.** `t()` met `en`, typen voor ingredient/recipe/customer/upgrade, eerste 5 recepten + 6 ingrediënten + 3 klanttypes als data.
  *Klaar wanneer:* data valideert via een test (unieke ids, bestaande ingrediënt-verwijzingen, vertaalsleutels aanwezig).

### Fase B: Eerste speelbare loop
- [x] **Stap 5: Taverne-scene (placeholder).** Boot-scene + taverne-doorsnede met gekleurde vormen: bar, ketel, tafels, plek voor klanten. DOM-overlay `#ui-root` met lege HUD (goud, reputatie).
  *Klaar wanneer:* scene schaalt correct in venster, HUD toont state-waarden.
- [x] **Stap 6: Klanten.** `systems/customers` (spawn-ritme, geduld, bestelling kiezen op basis van ontgrendelde recepten) + sprites die binnenlopen, bestelling tonen, wegfeesten/vertrekken. Objectpool.
  *Klaar wanneer:* klanten komen en gaan; tests voor spawn en geduld.
- [x] **Stap 7: Brouwen en serveren (eerste speelbare versie).** Klik op ingrediënten → ketel → brouwbalk → serveren aan wachtende klant → goud + reputatie + zwevende "+goud". Absurde klantreacties (i18n).
  *Klaar wanneer:* alle handelingen werken. **Mijlpaal: is dit leuk?** (De uitleg komt in stap 8.)
- [x] **Stap 8: Interactieve tutorial (framework + basis).** Zie hoofdstuk 4, Tutorial. Tutorial-statemachine (`systems/tutorial`), target-register, spotlight/pijl/spraakbel-UI, eerste tutorial: ingrediënt klikken → ketel → wachten → serveren → eerste goud. Overslaan-knop, opslaan van voortgang, opnieuw afspelen via debug-commando (Settings-knop komt in stap 18).
  *Klaar wanneer:* een nieuwe speler die niets weet, kan zonder tekstmuur of apart scherm de basis doen; tutorial overleeft herladen; vastlopen is onmogelijk (verkeerde volgorde of overslaan breekt niets); tests voor de statemachine.
- [x] **Stap 9: Economie en upgrades.** Kostenformule, `getMultipliers`, winkelpaneel (DOM) met koop x1/x10/max, eerste upgrades (ketel-snelheid, prijs, opslag). Tutorial-hint: eerste upgrade kopen.
  *Klaar wanneer:* upgrades werken, kosten stijgen, tests slagen.
- [x] **Stap 10a: Personeel.** Brouwer-assistent en serveerster automatiseren brouwen en serveren; inhuren met niveaus in de winkel (idle-inkomen mikt op ≈ 30 tot 40% van actief spelen, te meten in stap 13). Tutorial-hint: eerste medewerker inhuren. De barman volgt later (bijv. fooien of geduld).
  *Klaar wanneer:* ingehuurd personeel brouwt en serveert zonder dat de speler iets doet, hoger niveau werkt sneller, tests slagen.
- [x] **Stap 10b: Offline-voortgang.** `systems/offline` rekent met formules uit wat het personeel in de tijd weg verdiende (limiet 2 uur, uitbreidbaar), plus een "welkom terug"-venster. De ticker meldt grote gaten al via `onGap`.
  *Klaar wanneer:* tabblad 5 min weg of sluiten/openen levert correcte offline-opbrengst; tests voor `systems/offline`.

### Fase C: Diepte
- [x] **Stap 11a: Plekken en geleidelijke klanten.** De speler begint met 1 plek en koopt er bij (upgrade Extra Seat); klanten komen rustig, met een korte wachttijd tussen vertrek en volgende aankomst. Tutorial-hint: eerste extra plek.
  *Klaar wanneer:* een nieuw spel heeft één klant tegelijk, elke plek is één klant extra, de hint start bij genoeg goud, tests slagen.
- [x] **Stap 11b: Voorkeuren en drankeffecten.** Klantvoorkeuren (`likes`) en de vier effecten (kracht: meer betaald; snelheid: klant is sneller klaar en maakt de plek vrij; geluk: kans op fooi; charme: extra reputatie). Een effect werkt altijd; zit het in de voorkeur van de klant, dan is het dubbel zo sterk. Tutorial-hint: klantvoorkeur.
  *Klaar wanneer:* elk effect is merkbaar bij serveren, een voorkeur verdubbelt het en is zichtbaar (♥), een bediende klant drinkt eerst en maakt dan de plek vrij, de hint start bij de eerste ♥-bestelling, tests slagen.
- [x] **Stap 11c: Reputatieniveaus, gates en VIP-klanten.** Reputatieniveaus ontgrendelen klanten, recepten en kamers; VIP-klanten die veel betalen en een specifiek duur drankje vragen. Tutorial-hint: eerste VIP.
  *Klaar wanneer:* niveaus staan in de HUD met een melding bij elk nieuw niveau, klanten en recepten komen per niveau, VIP's verschijnen vanaf hun niveau en vragen het duurste drankje, de hint start bij de eerste VIP, tests slagen.
- [x] **Stap 12: Receptenontdekking en receptenboek.** Combineren in ketel → nieuw recept ("Eureka!"), silhouetten van onontdekte recepten, receptenboek-paneel met X/N voortgang. Het receptenboek laat per ontdekt drankje zien **hoe je het maakt** (ingrediënten, brouwtijd, prijs, effect); zie hoofdstuk 4, Receptenboek. Content uitbreiden naar ~15 recepten. Tutorial-hint: eerste ontdekking.
- [x] **Stap 13: Balans-simulator.** `scripts/simulate.ts` simuleert een speler; rapporteert mijlpaaltijden. Eerste tuning van getallen in `data/`.
  *Klaar wanneer:* simulator draait via `npm run simulate` en toont een duidelijke tijdlijn.
- [x] **Stap 13b: Speelbaarheid (UX-ronde 1).** Effect-iconen in bubbel, boek en zwevende tekst; voorkeursles noemt alleen het effect van dat drankje; serveren door eerst het drankje en dan de klant te kiezen (direct de klant klikken blijft werken); één uitklapknop met een zijpaneel met tabbladen (Shop | Recipes) in plaats van losse knoppen en Close. Tutorial-hints aanpassen (basisles: drankje, dan klant; upgrade-, plekken-, personeels- en boeklessen: uitklapknop, dan tabblad). Zie hoofdstuk 4, Speelbaarheid na de eerste speeltest.
  *Klaar wanneer:* een nieuwe speler ziet aan de bubbel wat een drankje doet, kan een drankje selecteren en aan een klant geven, en opent winkel en boek met één knop en tabbladen; alle lessen werken met de nieuwe bediening; tests slagen.
- [x] **Stap 13c: Ingrediënten in de winkel.** Een niveau maakt een ingrediënt koopbaar (eenmalig, groep Ingredients); het schap toont de basisingrediënten plus de gekochte; recepten zijn ontdekbaar met niveau én ingrediënten; de niveaumelding noemt het nieuwe ingrediënt. Tutorial-hint: eerste ingrediënt kopen. Daarna `npm run simulate` en de getallen opnieuw afstellen.
  *Klaar wanneer:* niveau 2 brengt één nieuw ingrediënt in de winkel en geen ongebruikte ingrediënten op het schap, kopen zet het op het schap, de simulator haalt nog steeds de tempodoelen, tests slagen.
- [x] **Stap 14a: Kamers.** Uitbreidingen (uitbouw met extra tafels, alchemielab, VIP-lounge) als kamervakken op een bovenverdieping in de scene, te bouwen in de winkel. Tutorial-hint: eerste kamer. Zie hoofdstuk 4, Kamers. (Stap 14 is op 2026-10-06 gesplitst in 14a en 14b, keuze eigenaar.)
- [x] **Stap 14b: Decoraties.** Decoraties (fakkels, tapijten, trofeeën) als goud-sink met kleine bonussen, zichtbaar in de scene. Tutorial-hint: eerste decoratie. Zie hoofdstuk 4, Decoraties.
- [x] **Stap 14c: Legenda van effecten in het receptenboek.** Bovenaan het receptenboek een legenda met de vier effecten (icoon, naam, wat het doet); bij elk recept alleen nog het icoon in plaats van de tekst. Zie hoofdstuk 4, Besluiten uit de ideeënronde.
  *Klaar wanneer:* de legenda staat bovenaan het boek, recepten tonen alleen het effect-icoon, tests slagen.
- [x] **Stap 14d: Night Shift (offline verdienen kopen).** Offline verdienen is niet meer automatisch: na de eerste medewerker staat "Night Shift" in de winkel (eenmalig), daarna upgrades voor het aandeel en de duur. Zonder aankoop laat het welkom-venster zien wat de speler gemist heeft. Tutorial-hint: de personeelsles of een eigen hint noemt Night Shift. Daarna `npm run simulate`. Zie hoofdstuk 4, Besluiten uit de ideeënronde.
  *Klaar wanneer:* zonder Night Shift levert afwezig zijn niets op en toont het welkom-venster het gemiste bedrag, met Night Shift werkt offline zoals nu, upgrades verhogen aandeel en duur, tests slagen.
*Stap 15 en 16 zijn op 2026-10-07 opgesplitst in 15a, 15b, 16, 16b en 16c (keuze eigenaar). Op 2026-10-08 is 15a nog eens gesplitst in 15a en 15b; de uitrusting werd 15c (keuze eigenaar). De uitwerking staat in hoofdstuk 4, Helden.*
- [x] **Stap 15a: Gildekamer, helden en eerste expeditie.** De gildekamer als vierde kamer (niveau 5); de bovenverdieping wordt verdeeld in vier vakken. De krijger komt mee met de kamer, de magiër is te huren. Tabblad Heroes in het zijpaneel. Eenvoudige expeditie naar het Moeras: vertrekken, een timer met absolute eindtijd (ook offline), terugkomen met kerker-ingrediënten (als voorraad) en XP. Levels, en gewond met korte rust (een drankje van de bar geneest). Tutorial-hint: eerste held op pad sturen.
  *Klaar wanneer:* de gildekamer is te bouwen en toont de helden, een held gaat op expeditie en komt (ook na herladen of offline) terug met ingrediënten en XP, de simulator haalt nog de tempodoelen, tests slagen.
- [x] **Stap 15b: Kerker-ingrediënten als voorraad en nieuwe recepten.** Bog Pearl en Witch Moss in de ingrediëntentabel; het schap toont een kerker-ingrediënt met het aantal (grijs bij 0), brouwen verbruikt er een, klanten bestellen zo'n recept alleen bij voorraad, de brouwer gebruikt ze alleen voor zo'n bestelling, offline telt ze niet mee, en in het boek staat een nooit gevonden ingrediënt als "?". 3-4 nieuwe dure recepten op niveau 5 en 6. Daarna `npm run simulate` (eventueel met een bot die helden stuurt). Tutorial-hint: eerste recept met een kerker-ingrediënt.
  *Klaar wanneer:* een recept met een kerker-ingrediënt verbruikt voorraad en wordt zonder voorraad niet besteld, het schap toont het aantal, de simulator haalt nog de tempodoelen, tests slagen.
- [x] **Stap 15c: Uitrusting.** Vier vakken (zwaard, schild, helm, amulet), elk met een eigen rol. Simpele stukken te koop in het tabblad Heroes; betere stukken als buit uit het Moeras. Aan- en uittrekken als de held thuis is. Tutorial-hint: eerste uitrusting.
  *Klaar wanneer:* elk vak merkbaar zijn rol doet, gekochte en gevonden stukken te dragen zijn, tests slagen.
- [x] **Stap 16: Heldenketel, drankjes meegeven en keuzekaartjes.** De tweede ketel in de gildekamer (ketel aanklikken, dan ingrediënten; het schap springt daarna terug). Drankjes gaan in de rugzak (max 2), of van de bar naar de held. De vier drankeffecten krijgen elk een rol op expeditie; de magiër haalt er meer uit. 2 keuzekaartjes per expeditie met een standaardkeuze na ~10 s. Receptencontent naar ~20 tot 30. Tutorial-hint: eerste heldendrankje en eerste kaartje.
  *Klaar wanneer:* een heldendrankje komt nooit op de bar en de taverneketel en de brouwer werken door, elk effect is merkbaar op expeditie, kaartjes hebben invloed op buit en duur, niet kiezen geeft de standaard, tests slagen.
- [x] **Stap 16b: Baasgevecht.** Aan het eind van een kerker een timing-balk met 3 slagen tegen de moerasheks (muis en touch); kracht-drankjes maken het groene vak groter. Wie niet meespeelt, krijgt de standaarduitkomst; actief winnen geeft baas-buit. Tutorial-hint: eerste baas.
- [x] **Stap 16c: Quartermaster, helden op auto en offline.** Een aankoop geeft elke held een knop Auto (aan/uit, op elk moment). Op Auto vertrekt hij vanzelf opnieuw met standaardkeuzes, ook offline binnen de offline-limiet; zelf kiezen telt altijd. Het offline-rapport noemt de expedities. Daarna `npm run simulate` met helden (idle 30-40% van actief). Tutorial-hint: Auto-knop.
- [x] **Stap 17: Prestige.** "Verkoop de taverne", Gouden Hop-formule, permanente tree, wat reset en wat blijft (recepten blijven). Tests voor de formule en reset. Tutorial-hint: eerste prestige.

### Fase D: Afwerking
*Stap 18 is op 2026-10-12 door Claude gesplitst in 18a, 18b en 18c (vier losse onderdelen; de eigenaar zei door te gaan zonder te stoppen). Hieronder eerst de oorspronkelijke omschrijving.*
- [x] **Stap 18a: Statistieken en achievements.** Een `stats`-sectie, 14 achievements met kleine permanente bonussen, een melding en een tabblad Trophies. Tutorial-hint: eerste trophy. Zie hoofdstuk 4, "Statistieken en achievements".
- [x] **Stap 18b: Dagelijkse bonus.** Een beloning bij de eerste keer spelen op een dag, met een reeks dagen. Tutorial-hint: eerste dagbonus.
- [x] **Stap 18c: Instellingen.** Het instellingenpaneel uit de omschrijving hieronder.
- (oorspronkelijk) **Stap 18: Achievements, dagelijkse bonus, statistieken, instellingen.** Settings-paneel (volume, taalkeuze-mechaniek met alleen EN, save reset/export/import, **tutorial opnieuw afspelen**). Achievements zijn een eigen systeem (de SDK heeft geen achievement-module; alleen `happytime()` voor grote momenten), met een `stats`-sectie in de state. Besluit eigenaar (2026-10-06): zoals gepland, met kleine permanente bonussen; `happytime()` alleen bij de grote momenten (eerste prestige, alle recepten ontdekt, legendarisch drankje). Per CrazyGames-account komt vanzelf via de data-module (cloud-save).
- [x] **Stap 19: Audio.** Sfx-hooks, muziek-hook (jij levert later het bestand), mute-knop, eigen volume; `muteAudio` van de SDK krijgt voorrang.
- [x] **Stap 19b: Audio-bestanden.** De echte geluidsbestanden (10 effecten) en de muzieklus uit een andere chat in `public/audio/` (met de scripts in `scripts/audio/` en de herkomst in `docs/ASSETS.md`); `audio.ts` en `audio-view.ts` laden ze met de Web Audio API in plaats van de placeholder-geluidjes. Gebouwd op stap 20 omdat die al klaar was. Zie hoofdstuk 4, "Audio".
- [x] **Stap 20: CrazyGames SDK.** Platform-laag: init, loading/gameplay-events, data-module als `StorageAdapter`, midgame- en rewarded ads (3 min-regel, adblock-veilig), gebruikersnaam, `happytime()` bij zeldzame achievements. Het weekly leaderboard is **niet** onderdeel van de MVP (alleen voor uitgenodigde games); zie IDEAS.md. Test met mock én met CrazyGames' preview/QA-tool.
*Stap 21 is op 2026-10-12 door Claude gesplitst in 21a t/m 21d (de eigenaar zei door te gaan met alle stappen). Hieronder eerst de oorspronkelijke omschrijving.*
- [x] **Stap 21a: Pijplijn, achtergrond en ketel.** Tekstrasters in de code als bron, textures bij het starten; de achtergrond als één beeld; de ketel (chagrijnig gezicht, pruttelen en koken) en het vuur geanimeerd; de pullen op de bar. Zie hoofdstuk 4, "Rendering".
- [x] **Stap 21b: Klanten.** Vier klanttypes in pixel art met lopen, zitten, drinken, blij en boos. Zie hoofdstuk 4, "Rendering".
- [x] **Stap 21c: Ingrediënten, helden, kamers en decoraties.** Alle overige gekleurde vormen in het canvas. Zie hoofdstuk 4, "Rendering".
- [x] **Stap 21d: Effecten en stijl.** Vallende munten, partikels, schermschud bij legendarisch, de tutorial-mascotte als pixel art, thumbnail-materiaal. Wens van de eigenaar (2026-10-12): een meer meeslepend lettertype (gekozen: Pixelify Sans, OFL, lokaal in `public/fonts/`), mooiere tekstwolkjes, hangende bordjes voor de kamers en mooiere naambordjes onder de ingrediënten. Zie hoofdstuk 4, "Rendering".
- [x] **Stap 21e: Panelen en iconen (wens eigenaar, 2026-10-12).** De DOM-panelen in dezelfde stijl: winkel, receptenboek, helden, Legacy, Trophies, instellingen, menu, HUD en de vensters (welkom, dagbonus, niveau, baas, kaartjes), met de pixelkaders (`--frame-…`) en het lettertype. De emoji in de speltekst worden eigen pixel-iconen (in de DOM als plaatje in de tekst, in de bestelwolkjes in het canvas naast de tekst getekend).
- (oorspronkelijk) **Stap 21: Art-pass in pixel art (volledige styling-stap, met animaties).** Omschakelen naar ontwerpresolutie 320×180 met `pixelArt: true` (`layout.ts`, scene en UI-schaling meenemen). Alle placeholders vervangen door pixel-art-sprites: de pijplijn uit `scripts/pixel/` (tekstrasters naar PNG/spritesheet, uit te breiden met een atlas) en eventueel CC0-assets of extern gemaakte art, na akkoord per bestand. **Animaties:** klanten (lopen, zitten, drinken, blij en boos), ketel (borrelen, vuur), vallende munten, held-animaties, tutorial-mascotte. Juice (partikels, schermschud bij legendarisch), thumbnail-materiaal. `docs/ASSETS.md` bijwerken.
  *Klaar wanneer:* geen gekleurde-vorm-placeholders meer in het spel, alle klantacties hebben een animatie, 60 FPS blijft gehaald, assets blijven binnen het budget (hoofdstuk 8).
*Na de art-pass gaf de eigenaar op 2026-10-12 gameplay-feedback; Claude verdeelde die over 22a, 22b en 22c. De wens voor meer advertenties werd 22d. De oude stap 22 heet nu 22e. Uitwerking: hoofdstuk 4, "Gameplay-ronde na de art-pass".*
- [ ] **Stap 22a: Winkel geleidelijk en uitverkocht weg.** De winkel (en het gear-deel van het tabblad Heroes en de Legacy) toont niet meer alles in één keer: een aanbod verschijnt pas als het in zicht komt, met per groep hoogstens één vergrendelde teaser; wat nieuw is krijgt een "New!"-label en een bolletje op de Menu-knop; wat uitverkocht of op het hoogste niveau is, verdwijnt. Tutorial-hint: de upgrade-les blijft werken (die start pas als iets betaalbaar is, en dan is het al zichtbaar); de eerste keer dat er iets nieuws is, wijst de ketel het bolletje aan.
  *Klaar wanneer:* bij de start staat alleen wat in zicht is in de winkel, items verschijnen één voor één tijdens het spelen, niets dat vol of gekocht is staat er nog, verkopen van de taverne zet het terug, tests voor de zichtbaarheidsregels slagen, de simulator blijft byte-identiek (de winkel is weergave; de bot koopt via de logica).
- [ ] **Stap 22b: Eigen ketel voor de brouwer en drankjes weggooien.** De brouwer-assistent krijgt een eigen ketel (met een pixel-art figuur ernaast), zodat de taverneketel alleen van de speler is en de speler altijd zelf kan brouwen en ontdekken. Een slopemmer naast de bar: een opgepakt drankje erin gooien maakt plek op de bar. Het personeel gooit een drankje dat niemand wil zelf weg als de bar vol staat, zodat idle nooit vastloopt. Tutorial-hint: een les "weggooien" de eerste keer dat de bar vol staat met een drankje dat niemand wil.
  *Klaar wanneer:* de brouwer brouwt in zijn eigen ketel terwijl de speler in de taverneketel brouwt, de speler kan de bar altijd leegmaken, een volle bar met ongewilde drankjes lost zichzelf op met personeel, de oude "stale cauldron"-regel is weg, tests slagen; de simulator verandert (bewust) en wordt opnieuw gemeten (seeds 1 t/m 9).
- [ ] **Stap 22c: Sneller personeel (balans).** Het personeel werkt vanaf het eerste niveau merkbaar sneller, zodat de speler eerder andere dingen kan doen, en volledig getraind zo snel dat (bijna) niemand meer zonder drankje vertrekt. De brouwerketel brouwt op hogere niveaus meerdere drankjes tegelijk. Afstellen met de simulator op de nieuwe doelen uit hoofdstuk 4. Geen nieuwe speler-functie, dus geen nieuwe hint (de personeelsles blijft kloppen).
  *Klaar wanneer:* de nieuwe doelen (hoofdstuk 4) zijn gehaald over seeds 1 t/m 9, de prijzen van het personeel zijn erop aangepast, tests slagen, SPECS en GAME_ANALYSE hebben de gemeten getallen.
- [ ] **Stap 22d: Meer advertenties en rewarded beloningen.** Midgame-ads op een paar extra natuurlijke momenten (met eigen grenzen bovenop de 3-minutenregel), en rewarded ads die de speler zelf kiest: een goudbuidel, tijdelijke power-ups en sneller kopen in de winkel (het tekort gratis bij 70%), aangeboden door een rondtrekkende marskramer en een knopje bij de winkelrij. Tutorial-hint: de eerste marskramer. Zie hoofdstuk 4, "Meer advertenties en rewarded beloningen"; de *(voorstel)*-punten eerst aan de eigenaar voorleggen. Mag in twee delen als hij te groot blijkt (midgame en goud/power-ups, daarna de winkel en de helden).
  *Klaar wanneer:* een midgame-ad komt ook vóór de gildekamer op een natuurlijk moment en nooit vaker dan de grens, elke rewarded beloning werkt alleen na een volledig bekeken ad (met de mock te proberen), adblock of een fout breekt niets, de simulator blijft byte-identiek (de bot kijkt geen ads), tests slagen.
- [ ] **Stap 22e: Performance, QA en indienklaar maken (was stap 22).** Bundel-/assetbudget, Chromebook-test, Chrome + Edge, relatieve paden, aantal bestanden, alle "nog niet gecontroleerd"-punten uit hoofdstuk 2 doornemen, `npm run build` → zip.
- [ ] **Stap 23: Indienen en na-lancering.** Checklist voor Basic Launch, daarna Full Launch (jij maakt het developer-account en dient in). Daarna: events, content, tweede prestige-laag, Nederlandse vertaling.

---

## 13. Risico's (technisch)

| Risico | Mitigatie |
|---|---|
| Phaser 4 is nieuw, minder voorbeelden | Migratiegids zit in het npm-pakket; fallback op 3.90 in stap 1 |
| Browser knijpt timers af op achtergrondtab | Altijd tijdsverschil met `Date.now()`; offline-formules |
| Grote getallen en afrondfouten | Decimal overal in de economie; tests met extreme waarden |
| Saves breken bij update | Versie + migraties + fixture-test |
| Te ver doorgeslagen SOLID leidde tot 245 bestanden van gemiddeld 29 regels (ravioli-code) | Opgelost op 2026-10-07: plat en per feature, 150-300 regels per bestand, geen barrels of wiring-lagen (hoofdstuk 4 en 9) |
| Balans te traag/snel | Simulator (stap 13), alle getallen in `data/` |
| Twee tabs tegelijk overschrijven elkaars save (zelfde `localStorage`) | CrazyGames toont de game normaal in één iframe; de data-module van de SDK (stap 20) synchroniseert per account. Eventueel later: `storage`-event of een tab-lock als dit een probleem blijkt |
| Art-kwaliteit van zelfgeschreven pixel art | Eenvoudige sprites lukken (experiment gelukt); complexe sprites extern laten maken of CC0 gebruiken; thumbnail apart aandacht |
| Tutorial irriteert of loopt vast | Altijd overslaanbaar, beloont echte acties i.p.v. klikken op "volgende", test op vastlopers |

---

## 14. Logboek (wat is er gedaan, waarom, wat nog)

Na elke stap voegt Claude hier bovenaan (nieuwste eerst) een entry toe in dit formaat:

```
### Stap N: titel (datum, branch)
- **Gedaan:** ...
- **Waarom (keuzes):** ...
- **Afwijkingen van het plan:** ...
- **Nu te proberen:** ...
- **Nog te doen / volgende stap:** ...
```

> **Let op bij oude entries:** de logboek-entries hieronder en de stapbeschrijvingen in hoofdstuk 12 noemen de paden van vóór de vlakke architectuur (`systems/`, `wiring/`, `core/`, `data/`, `scene/`, `ui/`, `sim/`). De paden-tabel in de entry "Chore: vlakke architectuur" laat zien waar die nu staan.

### Chore: gameplay-feedback na de art-pass (2026-10-12, `chore-gameplay-feedback`)
- **Aanvulling (zelfde dag):** de eigenaar wil ook meer advertenties: tussendoor iets meer (niet te veel) en vooral rewarded ads voor power-ups, meer goud of sneller kopen in de winkel. Uitgewerkt in hoofdstuk 4 ("Meer advertenties en rewarded beloningen") als nieuwe stap 22d; Performance en QA heet nu 22e. Open voor de eigenaar: de extra momenten en grenzen voor midgame-ads, welke beloningen (goud, Happy Hour, Extra handen, Haast, de winkel bij 70%, helden) en de marskramer.
- **Gedaan:** de wensen van de eigenaar na het spelen uitgewerkt in hoofdstuk 4 ("Gameplay-ronde na de art-pass") en GAME_ANALYSE.md (hoofdstuk 4 en 5.4): de winkel toont geleidelijk, uitverkocht verdwijnt, de brouwer krijgt een eigen ketel zodat de speler altijd zelf kan brouwen, drankjes weggooien in een slopemmer (en het personeel ruimt een volle bar op), sneller personeel vanaf het begin en volledig getraind snel genoeg dat (bijna) niemand zonder drankje vertrekt. Hoofdstuk 12: nieuwe stappen 22a, 22b en 22c; de oude stap 22 heet nu 22d. Geen code veranderd.
- **Waarom (keuzes):** een eigen ketel voor de brouwer (zoals de heldenketel) lost het blokkeren in één keer op en maakt de regel over de half gevulde ketel overbodig. Een slopemmer is één duidelijke handeling die bij het oppakken van drankjes past; het personeel ruimt zelf op zodat idle nooit vastloopt. Het idle-doel gaat omhoog omdat de eigenaar meer automatisering wil; actief spelen moet wel het meest blijven opleveren.
- **Afwijkingen van het plan:** het idle-doel van 30 tot 40% uit GAME_ANALYSE.md hoofdstuk 4 wordt (voorstel) 50 tot 70%; de eigenaar bevestigt dat bij stap 22c.
- **Nog te doen / volgende stap:** stap 22a. Open voor de eigenaar: de 50%-regel voor "in zicht", de 20 s voor het opruimen door het personeel, de nieuwe idle-doelen en de plek van de brouwerketel.

### Stap 21e: Panelen in hout en pixel-iconen (2026-10-12, `step-21e-panels-icons`)
- **Gedaan:** (code in `src/app/icon-art.ts` en `src/app/icon-text-view.ts` (nieuw), `src/app/ui-art.ts` (kaderstijlen, paneelkader, perkament- en houttegel), `src/app/pixel-dom-view.ts` (iconen in de DOM, `--wood`, `--paper`), `src/app/viewport-view.ts`, `src/customers/customers-view.ts`, `src/serving/serving-view.ts`, `src/heroes/guild-view.ts`, `src/dev/art-preview.ts` en alle CSS-bestanden van de panelen en vensters; tests in `tests/pixels.test.ts`)
  - **Panelen, vensters en iconen:** zie hoofdstuk 4, "Rendering".
  - 1 test erbij (548 totaal): tekst splitsen in woorden en iconen, en elk effect heeft een icoon; de iconen staan ook in `ART` (dus gecontroleerd op rijen en kleuren).
- **Waarom (keuzes):** wens van de eigenaar tijdens stap 21: de panelen mooier en meeslepender, en eigen art in plaats van emoji. Een eerste versie had perkament met pixelranden; de eigenaar vond dat "wit met extra pixels" en wilde meer winkelsfeer met hout, dus werd alles hout met lichte letters. De emoji blijven in de i18n-teksten als sleutel, zodat vertalers gewone tekst houden en één plek (de DOM-vervanging en `createIconText`) de iconen tekent.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen. In de browser (met de ontgrendelde save van de eigenaar): het zijpaneel met tabbladen en winkelkaarten, het instellingenvenster, de HUD en de knoppen in de nieuwe stijl; de iconen in de knoppen (luidspreker, tandwiel, sluiten), in de bestelwolkjes en in de zwevende tekst; geen consolefouten.
- **Afwijkingen van het plan:** de keuzelijsten en het volume-schuifje zijn alleen bijgekleurd (de browser tekent ze zelf). Het groene pijltje is een icoon in plaats van tekst.
- **Nu te proberen:** open het menu en loop de tabbladen door; open de instellingen; serveer een drankje dat de klant lekker vindt (hartje en effecticoon in de zwevende tekst).
- **Nog te doen / volgende stap:** feedback van de eigenaar op de art; daarna stap 22. Mergen van 21a t/m 21e naar `main` wacht op de eigenaar.

### Stap 21d: Effecten, lettertype, wolkjes, bordjes en mascotte (2026-10-12, `step-21d-effects-style`)
- **Gedaan:** (code in `src/app/ui-art.ts`, `src/app/pixel-dom-view.ts`, `src/app/juice-art.ts` en `src/app/juice-view.ts` (alle nieuw), `src/app/textures-view.ts` (wolkjes, bordjes, touw), `src/app/tavern-scene.ts`, `src/app/viewport-view.ts`, `src/config.ts` (`FONT`), `src/main.ts` (wachten op het lettertype), `index.html` (`@font-face`, `--font`), de CSS-bestanden (`var(--font)`), `src/tutorial/tutorial.css` (kader en mascotte), `src/customers/customers-view.ts` (wolkje), `src/rooms/rooms-view.ts` (hangend bord), `src/brewing/brewing-view.ts` (naambordjes), `src/heroes/guild-view.ts` (plaatje), `src/serving/serving-view.ts`, `src/dev/art-preview.ts` en `scripts/pixel/preview.mjs` (thumbnails); `public/fonts/` (nieuw); test in `tests/pixels.test.ts`)
  - **Lettertype, wolkjes, bordjes, mascotte, effecten en thumbnails:** zie hoofdstuk 4, "Rendering".
  - 1 test erbij (547 totaal): wolkjes met staart, houten bordjes, touw en 9×9-kaders.
- **Waarom (keuzes):** de eigenaar vroeg tijdens de stap om een meeslepender lettertype (koos Pixelify Sans uit drie voorstellen; het bestand is na akkoord gedownload, gecontroleerd en lokaal gezet, zodat het spel niets van buiten laadt), mooiere tekstwolkjes, hangende kamerbordjes en mooiere naambordjes onder de ingrediënten. Een eerste versie van de kamerbordjes schommelde voortdurend; dat zag er rommelig uit (draaiende pixels), dus het bord hangt nu stil en wiebelt alleen af en toe even. Een tweede versie gaf de kamerbordjes planken en spijkers; de eigenaar bedoelde de ingrediëntbordjes, dus die kregen die stijl en de kamerbordjes gingen terug. Lichtere letters op verzoek. Partikels van Phaser in plaats van eigen pools: ze hergebruiken zelf hun deeltjes.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen; `vite build` slaagt (424 kB gzip, lettertype in `dist/fonts/`). In de browser: het lettertype is geladen (`document.fonts.check`), de wolkjes, kamerbordjes, naambordjes en het heldenplaatje staan goed, de munten springen bij het betalen, de tutorial-wolk toont het kader en de pruttelende ketel; geen consolefouten. **Let op:** bij de audiotest van stap 19b ging het terugzetten van de oorspronkelijke save in het ingebouwde browservenster mis (terugzetten en het blokkeren van het autosaven gebeurden in twee stappen, en het autosaven kwam ertussen). De lokale save van de eigenaar in dat venster is daardoor vervangen door een testsave; op verzoek van de eigenaar staat er nu een save met alles ontgrendeld. Andere browsers en CrazyGames zijn niet geraakt.
- **Afwijkingen van het plan:** geen tutorial-mascotte met eigen animaties per les (alleen pruttelen). De effecten voor een boos vertrekkende klant zijn alleen de rode tint uit 21b. De thumbnails hebben nog geen titel of logo.
- **Nu te proberen:** serveer een drankje (munten), ontdek een recept (sterretjes; een legendarisch drankje schudt het scherm), laat een kamer dicht en kijk af en toe naar het bord.
- **Nog te doen / volgende stap:** 21e, de panelen restylen en pixel-iconen in plaats van emoji.

### Stap 21c: Ingrediënten, helden, kamers en decoraties in pixel art (2026-10-12, `step-21c-items-heroes-rooms`)
- **Gedaan:** (code in `src/brewing/ingredient-art.ts`, `src/heroes/hero-art.ts`, `src/rooms/rooms-art.ts` en `src/decor/decor-art.ts` (alle nieuw), `src/brewing/brewing-view.ts` (plank en ketelinhoud), `src/heroes/guild-view.ts`, `src/rooms/rooms-view.ts`, `src/decor/decor-view.ts`, `src/customers/customer-art.ts` (`figureFrames` gedeeld met de helden), `src/app/layout.ts` (`PALETTE` weg, `ROOM_GAP` 8) en `src/dev/art-preview.ts`; test in `tests/pixels.test.ts`)
  - **Wat er getekend is:** zie hoofdstuk 4, "Rendering". Er staan geen gekleurde vormen meer als voorwerp in het canvas; wat nog vorm is, zijn de bestelbubbels, balkjes (geduld, brouwen) en gloed (fakkels, gekozen heldenketel).
  - 1 test erbij (546 totaal): elk ingrediënt, elke heldenklasse, elke decoratie en elke kamer heeft eigen art.
- **Waarom (keuzes):** kamers en tapijten als één beeld per stuk (op maat getekend in code) zijn eenvoudiger dan losse meubels; alleen wat beweegt (fakkels, ketels, figuren) is een animatie. `ingredientColor` blijft bestaan, omdat het receptenboek (DOM) de kleur gebruikt.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen. In de browser met een testsave laat in een run (alle kamers en decoraties, de krijger thuis, de magiër aan het rusten, 3 Bog Pearl en 0 Witch Moss; de oorspronkelijke save daarna teruggezet): alles staat op zijn plek, de magiër is grijs met de aftelling, Witch Moss is grijs met ×0, de fakkels flakkeren; geen consolefouten. De simulator gebruikt alleen het aantal plekken uit de layout, dus de uitvoer blijft gelijk.
- **Afwijkingen van het plan:** de plank loopt voor de schoorsteen langs (het laatste ingrediënt staat ervoor); dat is zo gelaten. Helden hebben geen eigen animatie voor het baasgevecht (dat speelt in de DOM).
- **Nu te proberen:** bouw een kamer en koop een fakkel; stuur een held weg en kijk hoe hij vertrekt en terugkomt.
- **Nog te doen / volgende stap:** 21d, effecten, de mascotte, het lettertype en de tekstwolkjes.

### Stap 21b: Klanten in pixel art (2026-10-12, `step-21b-customers`)
- **Gedaan:** (code in `src/customers/customer-art.ts` (nieuw) en `src/customers/customers-view.ts`, `src/app/textures-view.ts` (Phaser alleen nog als type, zodat tests die views laden zonder browser blijven werken) en `src/dev/art-preview.ts`; test in `tests/pixels.test.ts`)
  - **Klanten en hun animaties:** zie hoofdstuk 4, "Rendering". Het oude lichaam (rechthoek en cirkel) en de losse pul in de hand zijn weg; de bestelbubbel en de geduldbalk staan hoger, boven het hoofd.
  - 1 test erbij (545 totaal): elk klanttype uit `customer-data.ts` heeft een eigen uiterlijk met alle frames.
- **Waarom (keuzes):** één set poses voor alle types (dezelfde letters voor huid, ogen, mouwen en pul) houdt de art klein: een nieuw klanttype is een hoofd, een romp en een palet. Zitten op de krukjes uit 21a maakt de plekken zichtbaar zonder de oude ovalen.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen. In de browser (een uitsnede van het WebGL-canvas uitvergroot, met een back-up van de save die daarna is teruggezet): de ridder loopt naar de kruk en zit; na het serveren juicht hij met een sprongetje en drinkt daarna uit de pul; geen consolefouten. Geen logica veranderd.
- **Afwijkingen van het plan:** geen zijaanzicht: de klanten kijken altijd naar de speler, ook tijdens het lopen (twee loopframes met het ene en het andere been omhoog). Het boze wegstormen is een rode tint over het loopframe.
- **Nu te proberen:** laat een klant lang wachten (hij wordt boos en loopt rood weg), geef een verkeerd drankje (boos gezicht) en een goed drankje (juichen en drinken).
- **Nog te doen / volgende stap:** 21c, ingrediënten, helden, kamers en decoraties.

### Stap 21a: Pixel-art-pijplijn, achtergrond en ketel (2026-10-12, `step-21a-pixel-pipeline`)
- **Gedaan:** (code in `src/shared/pixels.ts` (nieuw), `src/app/textures-view.ts` (nieuw), `src/app/backdrop-art.ts` (nieuw), `src/app/backdrop-view.ts`, `src/app/tavern-scene.ts`, `src/brewing/brewing-art.ts` (nieuw), `src/brewing/brewing-view.ts`, `src/rooms/rooms-view.ts` (de balk van de bovenverdieping zit nu in de achtergrond), `src/dev/art-preview.ts` (nieuw) en `scripts/pixel/` (preview via Vite; de oude losse sprites en `backdrop.mjs` zijn verhuisd naar de TypeScript-code); tests in `tests/pixels.test.ts` (nieuw))
  - **Pijplijn en resolutie:** zie hoofdstuk 4, "Rendering".
  - **Achtergrond:** muur van planken met balken, de balk van de bovenverdieping, plankenvloer, een deur met ijzeren banden en een zandpad naar buiten, een raam met maan en sterren, een stenen haard met schoorsteen achter de ketel, de plank, tafels met een kaarsje, een bar met panelen en een kruk op elke zitplek (de ovale plek-markeringen zijn weg).
  - **Ketel:** de chagrijnige ketel uit de tutorial (zware wenkbrauwen, scheel), die rustig pruttelt (4 frames) en kookt met opspattende druppels zolang er gebrouwen wordt (3 frames); het vuur eronder flakkert (3 frames). De pullen op de bar zijn een sprite; een opgepakt drankje kleurt geel en komt omhoog.
  - 5 tests erbij (544 totaal): geen sprite met ongelijke rijen of onbekende kleuren, alle frames van een animatie even groot, de tekenhulpjes, en de achtergrond van 320×180 zonder doorzichtige pixels.
- **Waarom (keuzes):** tekstrasters in de code zijn klein (geen beeldbestanden, niets te laden), te testen en makkelijk aan te passen; het experiment uit `chore-pixel-art-experiment` werkte al zo. De resolutie: zie hoofdstuk 4. De ketel kreeg het gezicht van de mascotte, zodat de tutorial-ketel en de spelketel dezelfde zijn.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen. In de browser: de achtergrond, de ketel en het vuur staan op hun plek en bewegen; geen consolefouten na het herladen. Geen logica veranderd, dus de simulator blijft gelijk.
- **Afwijkingen van het plan:** de resolutie (1280×720 met 4× sprites in plaats van 320×180 met `pixelArt: true`, zie hoofdstuk 4). Geen atlas-bestand: de textures worden bij het starten gemaakt.
- **Nu te proberen:** start het spel en brouw een drankje: de ketel gaat koken en wordt weer rustig als het drankje klaar is.
- **Nog te doen / volgende stap:** 21b, de klanten. Ingrediënten, voortgangsbalk en de bolletjes in de ketel volgen in 21c.

### Stap 19b: Audio-bestanden (2026-10-12, `step-19b-audio-files`)
- **Gedaan:** (code in `src/audio/audio.ts` en `audio-view.ts`, `tests/audio.test.ts`, de bestanden in `public/audio/` (10 effecten en `music_tavern.ogg`), `scripts/audio/` (`make_audio.py`, `review_audio.py`, `REVIEW.md`) en `docs/ASSETS.md`)
  - **Bestanden, laden, muziek-loop en volume:** zie hoofdstuk 4, "Audio". De placeholder-geluidjes (`SOUNDS`) en de lege muziekhaak (`MUSIC.src`) zijn weg; `SOUND_IDS` en `MUSIC.id` verwijzen naar de bestanden. Na de eerste klik haalt `audio-view.ts` alle bestanden op en decodeert ze; de muziek start als gapless loop van een buffer. Hoofdstuk 3 (tech stack) is aangepast: audio gaat via de Web Audio API, niet via Phaser.
  - Test aangepast (539 totaal, evenveel als voorheen): elk geluid en de muziek bestaan, de effecten samen < 400 KB, de muziek < 2 MB, en de paden zijn relatief.
- **Waarom (keuzes):** de eigenaar leverde de geluiden en de muziek (met code gegenereerd in een andere chat). Web Audio met gedecodeerde buffers geeft een gapless loop (een `<audio>`-element of Phaser-audio laat een kleine stilte bij het herhalen horen) en korte latency voor de effecten. Een bestand dat niet laadt laat alleen dat geluid stil, zodat het spel nooit op audio blokkeert.
- **Gemeten / gecontroleerd:** `npm run check` slaagt (539 tests), geen bestand boven 300 regels, geen kringen. `public/audio/` is 944 KB (muziek 845 KB, effecten samen ca. 82 KB). In de browser op localhost (testsave met de tutorial klaar; oorspronkelijke save daarna teruggezet): na de eerste klik worden alle 11 bestanden opgehaald zonder consolefouten; de muziek start als loop van 90 s; een klik op een ingrediënt speelt `plop` (0,16 s), een klaar drankje `bubble` (0,36 s), de dagbonus `coin` (0,26 s) en het serveren van het verkeerde drankje een geluid van 0,26 s (waarschijnlijk `buzz`; het goud bleef gelijk); met de luidsprekerknop op 🔇 start er geen nieuw geluid, na 🔊 weer wel.
- **Afwijkingen van het plan:** de geluiden kwamen eerder dan stap 21 (het plan zei: "stap 21, of eerder als de eigenaar ze aanlevert"). De branch is gebouwd op stap 20 en niet op `main`, omdat 16b t/m 20 nog niet gemerged zijn. Een geserveerde klant (`coin` via serveren) is in de browser niet apart gehoord: mijn test gaf een weigering (geen goud erbij), en `coin` is wel bevestigd via de dagbonus; de koppeling event naar geluid staat in `SOUND_EVENTS` en is getest. Het volume van de effecten (nu `volume` uit de instellingen) en de muziek (de helft daarvan) is nog niet door de eigenaar beoordeeld.
- **Nu te proberen:** start het spel, klik ergens (daarna speelt de muziek), klik op een ingrediënt, brouw een drankje en serveer het; zet de luidsprekerknop uit en aan; zet het volume in de instellingen hoger en lager.
- **Nog te doen / volgende stap:** stap 21, Art-pass in pixel art (de eigenaar beslist eerst over de aanpak; zie hoofdstuk 4, "Rendering"). Mergen van 16b t/m 20 en 19b naar `main` wacht op de eigenaar (in die volgorde).

### Stap 20: CrazyGames SDK (2026-10-12, `step-20-crazygames-sdk`)
- **Gedaan:** (code in `src/platform/` (nieuw: `platform.ts`, `crazygames.ts`), `src/main.ts` (wacht op de SDK, save via het platform, gameplay, ads, pauze), `index.html` (het SDK-script), `eslint.config.js` (uitzondering voor `platform/crazygames.ts`), `src/shared/time.ts` (`skip()`), `src/offline/` (`payOfflineAgain`; het welkom-view-model verhuisde naar het nieuwe `welcome-model.ts` omdat `offline.ts` anders boven 300 regels kwam; het welkom-venster kreeg de knop), `src/audio/audio-view.ts` en `src/settings/settings-view.ts` (demping en gebruikersnaam), `src/app/viewport-view.ts` (`UiServices`) en i18n; tests in `tests/platform.test.ts` (nieuw) en de offline-test (import)
  - **Platform, opslag, laden en spelen, ads, happytime, geluid en gebruiker:** zie hoofdstuk 6.
  - 7 tests erbij (539 totaal): gameplay start/stop op redenen en pas na het laden, de 3-minutenregel met pauzeren, belonen alleen na een volledige ad, ads en happytime op de juiste events, de stand-in, en het dubbele offline-loon.
- **Waarom (keuzes):** de SDK-API is eerst gecontroleerd in de officiële documentatie (init, `environment`, game-, ad-, data- en user-module). Midgame alleen bij een terugkerende held: dat is een pauzemoment, terwijl "na prestige" niet kan omdat de pagina dan herlaadt. De rewarded ad verdubbelt het offline-loon (IDEAS.md punt 3); een tijdelijke boost is niet gebouwd. Zonder SDK werkt alles met de stand-in, zodat tests, de simulator en ontwikkelen zonder internet blijven werken.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen; `vite build` slaagt (415 kB gzip). In de browser op localhost (SDK v3.8.0, omgeving `local`; testsave met personeel, Night Shift en 10 minuten weg; daarna de oorspronkelijke save teruggezet): de SDK-log toont loading start, loading stop en gameplay start; het welkom-venster bood "Double it (watch an ad)"; de SDK toonde "A rewarded ad would appear here", met gameplay stop en daarna weer start; het goud ging van 760 naar 1,52K en de knop werd "Doubled!". Geen consolefouten.
- **Afwijkingen van het plan:** testen met de preview/QA-tool van CrazyGames kan pas als de eigenaar de game daar heeft staan (stap 22/23). `onMuteChange` is niet gebouwd: het geluid leest `muted()` op het moment zelf. Geen midgame na prestige (zie boven).
- **Nu te proberen:** laat het spel 10 minuten dicht met Night Shift en kies daarna "Double it".
- **Nog te doen / volgende stap:** stap 21, Art-pass in pixel art. Bij indienen (stap 22/23): de "Progress Save"-schakelaar aanzetten (anders is de data-module uit) en testen in de QA-tool. Mergen van 16b t/m 20 naar `main` wacht op de eigenaar.

### Stap 19: Audio (2026-10-12, `step-19-audio`)
- **Gedaan:** (code in `src/audio/` (nieuw: `audio.ts`, `audio-view.ts`, `audio.css`), `src/app/viewport-view.ts`, `src/shared/state.ts` (`settings.muted`) en `src/i18n/en-achievements.ts`; tests in `tests/audio.test.ts` (nieuw))
  - **Geluiden, haken, muziek, volume, dempen en de hint:** zie hoofdstuk 4, "Audio".
  - 4 tests erbij (532 totaal): het volume (gedempt hier of door het platform), de luidsprekerknop, haken naar bestaande geluiden (en raak of mis bij de baas), en korte, zachte geluidjes zonder muziek tot er een bestand is.
- **Waarom (keuzes):** er zijn nog geen geluidsbestanden, en Claude kan geen audio opnemen; geluidjes die de browser zelf maakt zijn klein (0 bytes aan bestanden) en laten nu al horen waar geluid komt. Phaser's audio speelt alleen bestanden, dus de placeholders gebruiken de Web Audio API rechtstreeks (in de view); met echte bestanden kan het via Phaser of de browser. De eigenaar kreeg een prompt om de geluiden in een andere chat met meerdere agents te laten maken (zelfde ids, OGG, groottegrenzen).
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen. `npm run simulate -- 60 1` byte-identiek (audio doet niets in de simulator). In de browser (testsave; daarna de oorspronkelijke save teruggezet; geluid kan Claude niet horen, dus geteld via de oscillators): na het klikken van ingrediënten werden geluiden gemaakt; de luidspreker ging naar 🔇 en `muted` werd bewaard; gedempt kwam er bij een klik en 6 s spelen geen enkel geluid meer bij. Geen consolefouten.
- **Afwijkingen van het plan:** placeholder-geluiden via de Web Audio API in plaats van bestanden via Phaser (zie boven). De SDK-demping wordt in stap 20 aangesloten.
- **Nu te proberen:** speel met geluid aan; zet het af met de luidspreker en stel het volume in bij de ⚙.
- **Nog te doen / volgende stap:** stap 20, CrazyGames SDK. De echte geluiden en muziek (de eigenaar laat ze maken) koppelen zodra de bestanden er zijn. Mergen van 16b t/m 19 naar `main` wacht op de eigenaar.

### Stap 18c: Instellingen (2026-10-12, `step-18c-settings`)
- **Gedaan:** (code in `src/settings/` (nieuw: `settings.ts`, `settings-view.ts`, `settings.css`), `src/app/viewport-view.ts` en `src/main.ts` (de save-functies doorgeven), `src/prestige/prestige.ts` (instellingen blijven bij verkopen), `src/shared/` (state, events), `src/tutorial/` en `src/i18n/en-achievements.ts`; tests in `tests/settings.test.ts` (nieuw) en de personeelsles-test)
  - **Knop, venster, volume, taal, tutorial, export/import, opnieuw beginnen en tutorial-hint:** zie hoofdstuk 4, "Instellingen".
  - 3 tests erbij (528 totaal): volume en taal binnen de grenzen, opnieuw beginnen (alleen de instellingen blijven, `game:replaced`), en een geëxporteerde save importeren (en onzin weigeren).
- **Waarom (keuzes):** een eigen knop met een venster in plaats van een zesde tabblad, omdat de tabbladen bij het spel horen en de instellingen er even tussendoor zijn. Opnieuw beginnen en importeren laden de pagina opnieuw, net als verkopen (stap 17): zo hoeft geen enkele view zichzelf terug te zetten. Het volume wordt nu al bewaard, zodat stap 19 alleen het geluid hoeft aan te sluiten. De hint staat na de personeelsles, zodat het begin van het spel niet vol meta-lessen staat (trophy en dagbonus staan al vroeg).
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen. `npm run simulate -- 60 1` byte-identiek met 18b. In de browser (testsave met 1.234 goud op Cozy Inn en alle lessen af; daarna de oorspronkelijke save teruggezet): de ⚙ staat links van Menu en opent het venster; Export gaf een tekst van 1.708 tekens met de melding; "Delete everything" twee keer gaf een nieuw spel (0 goud, Shabby Shack, tutorial vanaf het begin); Import met "not a save" gaf de foutmelding, met de geëxporteerde tekst kwamen 1.234 goud, Cozy Inn en de tutorial terug; "Play it again" zette de tutorial terug op nul en sloot het venster. Geen consolefouten.
- **Afwijkingen van het plan:** het volume doet nog niets tot stap 19 (Audio). Verder geen.
- **Nu te proberen:** klik op de ⚙, exporteer je save en bewaar de tekst; speel de tutorial nog eens.
- **Nog te doen / volgende stap:** stap 19, Audio. Mergen van 16b t/m 18c naar `main` wacht op de eigenaar.

### Stap 18b: Dagelijkse bonus (2026-10-12, `step-18b-daily-bonus`)
- **Gedaan:** (code in `src/daily/` (nieuw: `daily.ts`, `daily-view.ts`, `daily.css`), `src/prestige/prestige.ts` (de reeks blijft bij verkopen), `src/app/` (world, viewport-view), `src/shared/` (state, events), `src/tutorial/` en `src/i18n/en-achievements.ts`; tests in `tests/daily.test.ts` (nieuw) en aanpassingen in de flow-tests)
  - **Wanneer, reeks, beloning, kaartje, state en tutorial-hint:** zie hoofdstuk 4, "Dagelijkse bonus".
  - **Flow-tests:** de les `daily` staat na de trophy-les, dus de lijsten "lessen tot en met de plekken" bevatten nu ook `daily_claim` en `daily_done`; in de upgradeles-test volgen na de trophy-les de dagbonus en (met dat goud) meteen de plekkenles.
  - 6 tests erbij (525 totaal): de lokale dag, het aanbod (dag 1 meteen, groeien, opnieuw na een gemiste dag, het maximum, per niveau), één keer per dag claimen, de melding bij een nieuwe dag, de reeks blijft bij verkopen, en de les.
- **Waarom (keuzes):** een beloning in goud die met het niveau meegroeit is eenvoudig en blijft nuttig in elke fase; Golden Hop of kerker-ingrediënten als dagbeloning zouden prestige en de helden te veel versnellen. Dag 1 meteen voor nieuwe spelers, omdat een les die een dag wacht alle lessen erna tegenhoudt (de tutorial loopt les voor les). Een klein kaartje in plaats van een venster: het blokkeert niets.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen. `npm run simulate -- 60 1` byte-identiek met 18a (de bot claimt niets). In de browser (testsave op Cozy Inn met een reeks van 2 tot gisteren; daarna de oorspronkelijke save teruggezet): het kaartje toonde "Day 3 of 7: +1.6K gold" en de les de afsluitzin (er was al eens geclaimd); Claim gaf 1.600 goud, reeks 3 en "Come back tomorrow for day 4!", en het kaartje verdween na 3 s. Geen consolefouten.
- **Afwijkingen van het plan:** geen. Dagelijkse taken (GAME_ANALYSE 5.6) zijn niet gebouwd; dat kan later als data.
- **Nu te proberen:** claim de bonus, en kom morgen terug voor dag 2.
- **Nog te doen / volgende stap:** stap 18c, Instellingen. Mergen van 16b t/m 18b naar `main` wacht op de eigenaar.

### Stap 18a: Statistieken en achievements (2026-10-12, `step-18a-achievements`)
- **Gedaan:** (code in `src/achievements/` (nieuw: `achievements.ts`, `achievements-view.ts`, `achievements.css`), `src/economy/upgrades.ts` (`achievementBonuses`), `src/prestige/prestige.ts` (statistieken en achievements blijven bij verkopen), `src/app/` (world, viewport-view met de gedeelde melding, `panels.css` voor vijf tabbladen), `src/shared/` (state, events, content), `src/tutorial/` en `src/i18n/en-achievements.ts` (nieuw); tests in `tests/achievements.test.ts` (nieuw) en aanpassingen in de flow-tests)
  - **Opsplitsing:** stap 18 had vier losse onderdelen; Claude splitste hem in 18a (dit), 18b (dagelijkse bonus) en 18c (instellingen), zoals eerder bij 15 en 16.
  - **Statistieken, achievements, melding, tabblad en tutorial-hint:** zie hoofdstuk 4, "Statistieken en achievements".
  - **Flow-tests:** de les `trophy` staat na de upgradeles, dus tests die "alle lessen tot en met de plekken" als klaar zetten, zetten nu ook `trophy_open` en `trophy_done`; de upgradeles-test ziet daarna de trophy-les; de offline-test met kerkerdrankjes geeft beide saves dezelfde achievements (meer recepten = meer bonussen); de herlaad-test zet ook de nieuwe Decimal-velden terug.
  - 7 tests erbij (519 totaal): de statistieken, één keer behalen met melding, behalen bij het laden (en welke "groot" zijn), de bonussen in `getMultipliers`, blijven bij verkopen (en Under New Management), teksten en view-models, en de les.
- **Waarom (keuzes):** kleine bonussen (1-5%) zoals de eigenaar besloot, vooral op de drankprijs en de ketel, zodat ze overal meewerken (ook offline). Doelen verspreid over het hele spel, van de eerste klant tot de eerste verkoop. Een tabblad in plaats van een apart venster, zoals de rest van het spel. De melding deelt de plek met de niveaumelding (één melding tegelijk, de nieuwste wint). Statistieken en achievements blijven bij verkopen (GAME_ANALYSE hoofdstuk 7: achievements blijven).
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen. Simulator 60 minuten, seeds 1 t/m 9: eerste personeel ongewijzigd (3:48 tot 5:01); **idle 42 / 32 / 35 / 33 / 35 / 35 / 42 / 25 / 33%, gemiddeld 34,7%** (16c: 34,2%). Simulator 180 minuten (seeds 1/2/3): eerste verkoop op 74:21 / 80:53 / 76:34 (17: 84:37 / 90:13 / 86:04), tweede op 122:28 / 131:25 / 126:02. In de browser (testsave met 99 klanten en personeel, de lessen tot en met de upgradeles af; daarna de oorspronkelijke save teruggezet): First Pint werd bij het laden behaald en de les wees Menu en het tabblad Trophies aan; vijf tabbladen stonden eerst te breed ("Trophies" stak buiten het paneel), na de CSS-fix passen ze; het personeel bediende de 100e klant en de melding "🏆 The Regulars! Drinks +2% pricier" verscheen; het tabblad toont "2/14 reached", de lijst met voortgang en de statistieken. Geen consolefouten.
- **Afwijkingen van het plan:** stap 18 is gesplitst (zie boven). `happytime()` volgt in stap 20.
- **Nu te proberen:** open het tabblad Trophies en kijk hoe ver je bent; bedien een VIP of versla de heks voor de volgende.
- **Nog te doen / volgende stap:** stap 18b, Dagelijkse bonus. Mergen van 16b t/m 18a naar `main` wacht op de eigenaar.

### Stap 17: Prestige (2026-10-12, `step-17-prestige`)
- **Gedaan:** (code in `src/prestige/` (nieuw: `prestige.ts`, `prestige-view.ts`, `prestige.css`), `src/economy/upgrades.ts` (`prestigeBonuses` in `getMultipliers`), `src/reputation/reputation.ts` (bewaker zakt mee), `src/offline/offline.ts` (event `offline:paid`), `src/app/` (world, viewport-view), `src/shared/` (state, events, purchases, content), `src/tutorial/`, `src/i18n/en-shop.ts` en `src/dev/` (bot en tijdlijn); tests in `tests/prestige.test.ts` (nieuw) en de gids-test)
  - **Golden Hop, voorwaarden, Legacy, wat blijft en wat reset, tabblad, state, tutorial-hint en simulator:** zie hoofdstuk 4, "Prestige: de taverne verkopen".
  - Gebouwd op `step-16c-quartermaster` (16b en 16c staan nog niet op `main`).
  - 11 tests erbij (512 totaal): de formule, de voorwaarden (niveau en minimum), de prijsbonus en de Legacy in `getMultipliers`, verkopen (wat reset, wat blijft, start-goud, niet twee keer), niveaumeldingen opnieuw na een verkoop, het tellen van verdiend goud (serveren en offline), `prestige:available`, bonussen kopen (duurder per niveau, maximum, start-goud), het view-model, teksten per bonus, en de les.
- **Waarom (keuzes):** de eigenaar zei door te gaan zonder te stoppen, dus Claude koos de uitwerking binnen GAME_ANALYSE hoofdstuk 7. **+10% per Golden Hop in plaats van +2%:** met een wortelformule krijgt een eerste verkoop maar 4 Hop, en +8% zou niet voelen als een beloning. **Minimum 4 Hop:** anders kon (en zou de les aanraden) al rond minuut 35 verkocht worden voor 1 Hop. **Vier bonussen in een lijst** in plaats van een vertakte boom: eenvoudig, uit te breiden met data; een boom met voorwaarden kan later. Night Watch werkt het idee uit IDEAS.md punt 3 uit (prestige-tak voor offline). **Uitrusting en de Quartermaster resetten mee**, omdat ze bij de helden en de gildekamer horen (GAME_ANALYSE noemde ze niet). **Herladen na verkopen** houdt het simpel: geen code om elke view terug te zetten.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen. `npm run simulate -- 60 1` byte-identiek met stap 16c (verkopen kan pas later). Simulator 240 minuten (seeds 1/2/3): eerste verkoop op 84:37 / 90:13 / 86:04 (doel 1 tot 2 uur), daarna elke ~60, ~50 en ~42 minuten een volgende (de cycli worden korter, zoals GAME_ANALYSE wil); de bot verkoopt telkens bij het minimum van 4 Hop. Verdiend goud in de eerste taverne: ±1,7M op minuut 60, ±4,5M op minuut 90. In de browser (testsave op Legendary Hall met 4,5M verdiend; daarna de oorspronkelijke save teruggezet): de les wees Menu, Legacy en de verkoopknop aan; vier tabbladen passen; de eerste klik gaf "Sure? Click again to sell", de tweede verkocht voor 4 Golden Hop, de pagina laadde opnieuw met 0 goud, Shabby Shack, lege kamers en de recepten nog bekend; de les wees een bonus aan en Seed Money kopen (4 naar 3 Hop, 1/5) rondde haar af; het tabblad toont "Now: +40%". Geen consolefouten.
- **Afwijkingen van het plan:** een lijst van bonussen in plaats van een vertakte boom (zie boven). De dagelijkse/achievement-kant van prestige (bijv. `happytime()` bij de eerste verkoop) komt in stap 18 en 20.
- **Nu te proberen:** speel tot Legendary Hall en 4M verdiend (of gebruik een testsave), open het tabblad Legacy en verkoop de taverne. Koop daarna Seed Money en kijk hoe snel de tweede taverne gaat.
- **Nog te doen / volgende stap:** stap 18, Achievements, dagelijkse bonus, statistieken en instellingen. **Te bekijken door de eigenaar:** de prestige-getallen en -keuzes hierboven (vooral +10% per Hop, het minimum van 4 en wat er reset). Mergen van 16b, 16c en 17 naar `main` wacht op de eigenaar.

### Stap 16c: Quartermaster, helden op auto en offline (2026-10-12, `step-16c-quartermaster`)
- **Gedaan:** (code in `src/heroes/` (nieuw: `auto.ts`; aangepast: `expedition.ts`, `heroes.ts`, `heroes-model.ts`, `heroes-view.ts`, `heroes.css`), `src/offline/offline.ts`, `src/app/world.ts`, `src/shared/` (state, events, purchases), `src/tutorial/`, `src/i18n/` en `src/dev/` (bot en tijdlijn); tests in `tests/auto.test.ts` (nieuw) en kleine aanpassingen in de offline-, gear-, heroes- en gids-tests)
  - **Quartermaster, Auto, online, offline, welkom-venster, tutorial-hint en simulator:** zie hoofdstuk 4, Helden ("Gebouwd in stap 16c").
  - Gebouwd op `step-16b-boss-fight`, omdat de merge van 16b naar `main` werd tegengehouden door de veiligheidscontrole van Claude Code (de eigenaar had akkoord gegeven).
  - 10 tests erbij (501 totaal): de aankoop (op slot zonder gildekamer, één keer), de Auto-knop (alleen met de Quartermaster, in het tabblad), online vertrekken na 10 s en meteen met een volle rugzak, Auto uit laat de held thuis, een eigen keuze op een kaartje blijft staan, offline tochten na elkaar met de laatste nog onderweg en zonder meldingen, geen tochten na de offline-limiet en niets voor helden zonder Auto, het welkom-rapport, en de les.
- **Waarom (keuzes):** de eigenaar liet de details aan Claude. De Quartermaster staat in het tabblad Heroes (daar horen de helden; de winkel is voor de taverne). 12.000 komt na de VIP Lounge en Mildred (rond minuut 29-32 in de simulator). De 10 s thuis geven de speler tijd om de rugzak te vullen, anders vertrekt een held op Auto altijd met lege handen. Offline speelt de tochten echt na (met de RNG), in plaats van een gemiddelde formule: zo kloppen de buit, de XP, de levels en de gevonden uitrusting, en de lopende tocht staat bij terugkomst op de goede plek. Night Shift is niet nodig: de Quartermaster is zelf de aankoop die de helden laat doorwerken. Geen melding per tocht bij het inhalen, anders zouden na een lange afwezigheid tientallen zwevende teksten tegelijk verschijnen.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels (`offline/offline.ts` 296), geen kringen. Simulator 60 minuten, seeds 1 t/m 9: de eerste 20 minuten ongewijzigd; Quartermaster gekocht tussen 28:39 en 32:19; goud op minuut 60 524K / 245K / 389K / 228K / 570K / 201K / 582K / 286K / 219K. **Idle 32 / 39 / 36 / 38 / 30 / 35 / 33 / 32 / 33%, gemiddeld 34,2%** (16b: 25,9%): weer binnen het doel van 30-40%. Gevonden stukken per run 4 / 1 / 4 / 4 / 4 / 2 / 3 / 4 / 4 (16b: samen 24, nu 30), omdat helden op Auto vaker op tocht gaan. In de browser (testsaves; de oorspronkelijke save daarna teruggezet): de les verscheen met de gildekamer en 50K goud en wees Menu, Heroes en "Buy · 12K" aan; kopen (50K naar 38K) haalde de rij weg en toonde "Auto: off" bij Brakka; aanzetten gaf "🔁 Auto: on" en de afsluitzin, en 10 s later stond Brakka "In the Swamp, back in 2:00". Een save van 30 minuten oud met Brakka op Auto gaf het welkom-venster "Your heroes on Auto made 12 trips and brought home Witch Moss ×15, Bog Pearl ×21.", Brakka ging van level 2 naar 4 en was weer onderweg (nog 1:08). Geen consolefouten.
- **Afwijkingen van het plan:** geen. Het idle-besluit uit stap 16 en 16b ("zo laten tot 16c") is hiermee afgehandeld.
- **Nu te proberen:** koop in het tabblad Heroes de Quartermaster en zet Brakka op Auto. Sluit het spel een kwartier en kijk wat het welkom-venster zegt. Kies tussendoor zelf een kaartje: dat telt gewoon.
- **Nog te doen / volgende stap:** stap 17, Prestige. Mergen van 16b en 16c naar `main` wacht op de eigenaar (de veiligheidscontrole houdt een merge door Claude tegen).

### Stap 16b: Baasgevecht (2026-10-12, `step-16b-boss-fight`)
- **Gedaan:** (code in `src/heroes/` (nieuw: `boss-fight.ts`, `boss-view.ts`; aangepast: `expedition.ts`, `heroes.ts` (`bossPower`), `trip-cards.ts`, `guild-view.ts`, `heroes.css`), `src/shared/` (state, events, content), `src/tutorial/`, `src/i18n/en-heroes.ts`, `src/app/viewport-view.ts` en `src/dev/` (bot en tijdlijn); tests in `tests/boss.test.ts` (nieuw) en kleine aanpassingen in de stock- en gids-tests)
  - **Baas, balk, schade, uitkomst, scherm, state, tutorial-hint en simulator:** zie hoofdstuk 4, Helden ("Gebouwd in stap 16b").
  - Twee code-commits: de feature, en na de browsertest een kleine fix (het vak stond over de taverneketel, en zinnen begonnen met "the Bog Witch" met een kleine letter; nu heet de baas "Bog Witch" en zetten de zinnen er "the"/"The" voor). Daarna deze SPEC-update.
  - 10 tests erbij (491 totaal): de wijzer heen en terug, het groene vak (kracht-drankjes, de magiër, de bovengrens), schade per klasse en level, winnen, verliezen en de standaard, de baas op het juiste moment met baas-buit thuis, een slag op het laatste moment (de held blijft) en slagen zonder baas, de standaard zonder te spelen, een baas met naam per kerker, en beide routes van de les.
- **Waarom (keuzes):** de eigenaar liet de details aan Claude. 15 s is genoeg voor drie slagen plus lezen, en kort genoeg om niet te storen. Elke slag sneller geeft spanning zonder extra regels. Verliezen kost niets (helden kunnen niet sterven, hoofdstuk 4), dus de standaarduitkomst is gelijk aan verliezen en meespelen loont altijd. De baas-buit is kerker-ingrediënten, de hoofdbuit van de helden, zodat winnen meteen iets betekent aan de bar. De krijger is sterker tegen de baas (hoofdstuk 4) via `bossPower`; de magiër haalt meer uit kracht-drankjes, dus ook een breder groen vak.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels, geen kringen. `npm run simulate -- 60 1` byte-identiek na de fix (alleen tekst en CSS). Simulator 60 minuten, seeds 1 t/m 9 (tussen haakjes stap 16 op `main`): goud op minuut 60 370K (231K) / 176K (92K) / 397K (251K) / 378K (174K) / 454K (142K) / 210K (69K) / 569K (394K) / 231K (78K) / 242K (383K): actief spelen verdient met de baas-buit flink meer, omdat er meer kerkerdrankjes verkocht worden. Gevonden stukken per run 4 / 0 / 4 / 4 / 4 / 1 / 4 / 0 / 3 (stap 16: 3 / 2 / 4 / 2 / 1 / 1 / 4 / 3 / 3), samen ongeveer gelijk. **Idle 25 / 31 / 24 / 23 / 22 / 30 / 22 / 30 / 26%, gemiddeld 25,9%** (stap 16: 26,7%): nog onder het doel, om dezelfde reden als bij stap 16 (idle stuurt geen helden). In de browser (testsave met Brakka op tocht met een Gym Sock Mead, alle lessen tot en met de kaartjes af; daarna weggehaald, er was geen eerdere save): de baas verscheen 15 s voor het eind met de les op Strike!; zonder te slaan kwam Brakka gewoon terug en rondde de les af; drie getimede slagen gaven 💥💥💥, "Victory!" en thuis 4 Bog Pearl en 1 Witch Moss (vanaf 0, dus de baas-buit kwam mee); drie slagen aan de rand gaven ✖✖✖ en "The Bog Witch cackles and flies off."; de uitslag bleef 2,5 s staan. Geen consolefouten.
- **Afwijkingen van het plan:** geen. Het gevecht staat in een eigen vak in beeld, niet in de gildekamer (de held is dan ver weg in het Moeras).
- **Nu te proberen:** stuur een held naar het Moeras en wacht tot 15 s voor het eind: sla drie keer als de wijzer in het groen staat. Geef de held eerst een kracht-drankje mee (bijv. Gym Sock Mead) en kijk hoe het groene vak groeit.
- **Nog te doen / volgende stap:** stap 16c, Quartermaster (helden op auto en offline). **Besluit nodig van de eigenaar** (nog open uit stap 16): idle zit onder het doel (25,9%). Voorstel blijft: zo laten tot 16c, waar helden ook idle en offline lopen. De baas-buit maakt actief spelen nog iets sterker; tilt 16c idle niet genoeg op, dan is de baas-buit (nu +1/+1) een eenvoudige knop om aan te draaien.

### Chore: werkregel van de eigenaar (2026-10-12, `chore-work-rule`)
- **Gedaan:** de werkregel van de eigenaar vastgelegd bovenaan CLAUDE.md en in hoofdstuk 1 (regel 10) en 11 (Git-werkwijze, punt 5).
- **Waarom (keuzes):** besluit eigenaar: stap per stap werken, de eigen branch committen en pushen mag zonder te vragen, mergen naar `main` alleen na uitdrukkelijke toestemming per keer, en daarna stoppen tot de eigenaar zegt verder te gaan.
- **Afwijkingen van het plan:** geen; alleen docs, geen code.
- **Nog te doen / volgende stap:** ongewijzigd: mergen van 15b, 15c en 16 na akkoord, daarna stap 16b.

### Stap 16: Heldenketel, drankjes meegeven en keuzekaartjes (2026-10-08, `step-16-hero-cauldron-cards`)
- **Gedaan:** (code in `src/heroes/` (nieuw: `expedition.ts`, `hero-brewing.ts`, `trip-cards.ts`, `cards-view.ts`), `src/brewing/brewing.ts` (`clickIngredient` met een ketel naar keuze), `src/app/` (world, layout, tavern-scene, viewport-view), `src/shared/` (state, events, random, content), `src/tutorial/`, `src/recipes/`, `src/reputation/`, `src/i18n/` en `src/dev/` (nieuw: `bot.ts`); tests in `tests/trip.test.ts` (nieuw), aangepaste hero-, gear-, stock- en content-tests, en een kaartjes-tabel in de validator)
  - **Heldenketel, rugzak, drankjes op tocht, keuzekaartjes, recepten, tabblad, state, tutorial-hints en simulator:** zie hoofdstuk 4, Helden ("Gebouwd in stap 16").
  - Drie commits: de verplaatsing (simulator byte-identiek, 468 tests), de feature, en deze SPEC-update.
  - 12 tests erbij (480 totaal): de heldenketel (richten, brouwen, rugzak, nooit op de bar, terug naar de taverne), genezen en "niemand thuis", drankjes mee en korter door snelheid, kracht per klasse en amulet, effecten per drankje, kaartjes plannen, openen, kiezen (modder kort in), de standaard na de tijd en bij afwezigheid, de uitkomst van vechten en de heks, een drankje aan de heks, de rugzak in het tabblad, en beide lessen.
- **Waarom (keuzes):** de eigenaar liet de details aan Claude. Drie kaartjes (pad, kikker, heks) in plaats van vier: "nu een drankje drinken" overlapt met drankjes die al hun effect hebben, dus de heks is het kaartje waar je een drankje gebruikt. Drankjes werken voor de hele tocht en de magiër haalt er 50% meer uit, zoals hoofdstuk 4 voorstelt. De rugzak geeft voorrang aan genezen, zodat een drankje uit de heldenketel een gewonde held meteen helpt. De bot brouwt goedkope gelukdrankjes voor de helden, omdat hij de kerkervoorraad voor klanten bewaart.
- **Bijgesteld na meten:** met geluk +25% buit en +3% gear, vechten +50% buit en een heks die 2 (met charme 4) Witch Moss gaf, vond de bot alle vier de buit-stukken vóór minuut 44 en zakte idle naar gemiddeld 25,4%. Nu geluk +15% en +1%, vechten +30%, de heks 1 (met charme +p).
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels. Simulator 60 minuten (seeds 1/2/3): de eerste 20 minuten zoals voorheen; gildekamer 20:51 / 21:00 / 21:56, eerste tocht terug 22:41 / 22:51 / 24:05, alle 21 recepten rond minuut 25-27, VIP Lounge 27:06 / 25:28 / 26:20, Mildred 31:38 / 30:13 / 30:24, gevonden stukken per run 3 / 2 / 4. **Idle over seeds 1 t/m 9: 27 / 28 / 29 / 26 / 21 / 24 / 31 / 22 / 32%, gemiddeld 26,7%: onder het doel van 30-40%** (15c: 30,7%). De oorzaak is de opzet: actief spelen stuurt helden met drankjes en kiest gewaagd, terwijl idle helemaal geen helden stuurt; dat komt pas met de Quartermaster (16c, helden op auto en offline). `vite build` slaagt (403 kB gzip, was 395). In de browser (testsave met de krijger op tocht met een Bog Lantern en de magiër thuis; oorspronkelijke save daarna teruggezet): de les wees de heldenketel aan; aanklikken en Swamp Slime met Wild Honey gaf een Slime Sap in de rugzak van Mildred en de les rondde af; het kikkerkaartje verscheen ("Brakka: A giant frog!", twee knoppen en een aftelbalk) met de les op "Fight it"; zonder keuze werd na 10 s "sneak" genomen en de les rondde netjes af; bij de heks gaf "Give her Bog Lantern" het drankje weg; Brakka kwam terug met 4 Bog Pearl en 1 Witch Moss extra. Het kaartje stond over de namen van de eerste ingrediënten op het schap en staat nu iets lager. Geen consolefouten.
- **Afwijkingen van het plan:** drie kaartjes in plaats van de vier voorbeelden (zie boven); het amulet werkt nu (meegegeven drankjes). Idle ligt onder het doel tot 16c.
- **Nu te proberen:** klik in de gildekamer op het keteltje en brouw iets (het gaat in de rugzak), of geef een held een drankje van de bar. Stuur hem op pad en kies bij de kaartjes zelf; let op de aftelbalk.
- **Nog te doen / volgende stap:** stap 16b, Baasgevecht. **Besluit nodig van de eigenaar:** idle zit onder het doel. Voorstel: zo laten tot 16c (de Quartermaster laat helden ook idle en offline lopen); anders de kerkerdrankjes goedkoper maken of de bonussen van kaartjes en drankjes verder verlagen.

### Stap 15c: Uitrusting (2026-10-08, `step-15c-gear`)
- **Gedaan:** (code in `src/heroes/gear.ts` (nieuw), `heroes.ts`, `heroes-model.ts`, `heroes-view.ts`, `heroes.css`, `guild-view.ts`, `src/rooms/rooms.ts` (`GUILD_ROOM_ID`), `src/shared/` (state, events, purchases, content), `src/tutorial/`, `src/i18n/en-heroes.ts`, `src/app/world.ts` en `src/dev/simulator.ts`; tests in `tests/gear.test.ts` (nieuw) en de validator in `tests/content/validate-content.ts`)
  - **Vakken, stukken, buit, dragen, state, tutorial-hint en simulator:** zie hoofdstuk 4, Helden ("Gebouwd in stap 15c").
  - **Validator:** een gear-tabel (bestaand vak, kracht positief, bij schild en helm onder 1, prijs positief) en bij een kerker een kans van 0 tot 1 en `gearDrops` die alleen naar buit-stukken wijzen.
  - 10 tests erbij (468 totaal): kopen (niet zonder gildekamer, buit-stukken nooit), dragen, overschuiven en afdoen, niets wijzigen bij een held op tocht, het voorstel voor de bot, oudere helden aanvullen, wat elk vak doet (zwaard, schild, helm), een gevonden stuk, het tabblad (winkel en keuzelijsten) en de les.
- **Waarom (keuzes):** de eigenaar liet de getallen aan Claude. Simpele stukken kosten 4.000: met 2.500 kocht de bot alle vier binnen twee minuten na de gildekamer (onder 10% van de VIP Lounge, waarvoor hij spaart); nu komen ze kort na de lounge. Een vindkans van 15% gaf alle vier de buit-stukken vóór minuut 40; met 6% vindt een run van een uur er meestal één. Het amulet hoort bij drankjes, die pas in stap 16 meegaan; het stuk is er nu al zodat de vier vakken compleet zijn. Een keuzelijst per vak is de eenvoudigste bediening voor twee helden en acht stukken.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels (`heroes/heroes.ts` 284). Simulator 60 minuten (seeds 1/2/3): eerste 20 minuten ongewijzigd; VIP Lounge 25:28 / 25:47 / 26:36; de vier simpele stukken gekocht tussen 26:31 en 29:40; Mildred 30:38 / 30:46 / 31:23; gevonden: Mudwalker Helm 42:02, Swamp Cleaver 53:22, Witch's Eye 40:58; goud op minuut 60 283K / 338K / 105K. Idle over seeds 1 t/m 9: 28 / 30 / 28 / 38 / 37 / 30 / 24 / 30 / 31%, gemiddeld 30,7% (15b: 31,6%), dus nog binnen het doel maar aan de onderkant: met uitrusting brengt actief spelen meer kerkerdrankjes. In de browser (testsave met gildekamer, twee helden en een Swamp Cleaver; oorspronkelijke save daarna teruggezet): het tabblad toont per held de vier vakken en onder de helden "Gear for sale" met vier stukken; Rusty Sword kopen (20K naar 16K) haalde hem uit de winkel; de Swamp Cleaver in de lijst van Mildred kiezen schoof hem van Brakka naar Mildred, en de lijsten tonen "(on Mildred)" en "(on Brakka)". Geen nieuwe consolefouten.
- **Afwijkingen van het plan:** het amulet doet pas iets vanaf stap 16 (drankjes meegeven). "Per kerker is iets anders handig" komt met meer kerkers; met alleen het Moeras helpt elk vak. Verder geen.
- **Nu te proberen:** bouw de gildekamer, koop in het tabblad Heroes een Rusty Sword en kies hem in de lijst Sword van Brakka. Stuur hem op pad en tel de buit.
- **Nog te doen / volgende stap:** stap 16, Heldenketel, drankjes meegeven en keuzekaartjes (daar gaat het amulet werken). Idle zit aan de onderkant van het doel; bij 16c (Quartermaster) meenemen.

### Stap 15b: Kerker-ingrediënten als voorraad en nieuwe recepten (2026-10-08, `step-15b-dungeon-ingredients`)
- **Gedaan:** (code in `src/brewing/ingredients.ts`, `brewing.ts`, `brewing-view.ts`, `src/recipes/` (data en boek), `src/reputation/reputation.ts`, `src/app/` (world, layout, tavern-scene), `src/offline/offline.ts`, `src/tutorial/` (nieuw: `tutorial-later-steps.ts`), `src/shared/` (events, random), `src/i18n/` en `src/dev/simulator.ts`; tests in `tests/flows/stock-flow.test.ts` (nieuw) en aangepaste tests voor content, layout, boek en winkel)
  - **Voorraad, schap, verbruik, bestellen, brouwer, offline, recepten, boek en tutorial-hint:** zie hoofdstuk 4, Helden ("Gebouwd in stap 15b").
  - **Tutorial-bestand gesplitst:** `tutorial/tutorial-steps.ts` kwam met de nieuwe les boven 300 regels; de lessen voor later in een run (kamer, decoratie, held, buit) staan nu in `tutorial/tutorial-later-steps.ts` (234 en 78 regels).
  - **Content-tests:** 8 ingrediënten en 17 recepten; de regel "een niveau opent alleen recepten waarvan de ingrediënten te krijgen zijn" rekent kerker-ingrediënten vanaf het niveau van de gildekamer.
  - 11 tests erbij (458 totaal): bezit en teller op het schap (ook bij 0), klikken bij lege voorraad, ontdekken en verbruiken (ook met drie ingrediënten), de brouwer, bestellen met en zonder voorraad en met wachtende bestellingen, geen bestelling zonder voorraad in het echte spel, de prijzen, "?" in het boek, offline zonder kerkerdrankjes, en de buitles.
- **Waarom (keuzes):** het voorstel uit hoofdstuk 4 aangehouden (de eigenaar liet de details aan Claude). Verbruik op `brew:started` is één plek voor speler en brouwer. Bij bestellen telt Claude de wachtende bestellingen mee, anders bestellen twee klanten het laatste drankje en wacht er één voor niets. Een gevonden ingrediënt blijft op het schap (grijs) als het op is, zodat de speler ziet wat hij mist. Twee recepten op niveau 5 (meteen bruikbaar na de eerste tocht) en twee op niveau 6, elk ingrediënt in minstens twee recepten. De bot stuurt nu helden, anders meet de simulator de nieuwe lus niet.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels. Simulator 60 minuten (seeds 1/2/3): eerste minuten ongewijzigd (16 aankopen in 5 minuten, eerste medewerker 4:26, eerste ontdekking 1:20 bij seed 1); gildekamer 20:51 / 21:00 / 21:56, eerste tocht terug 22:52 / 23:01 / 23:56 en Pearl Mead meteen ontdekt; alle 17 recepten rond minuut 27-30; Mildred gehuurd rond 30:10; VIP Lounge 25:43 / 26:19 / 26:10; goud op minuut 60 183K / 243K / 136K. Idle 30% / 33% / 25%, seeds 4-9 34 / 36 / 34 / 30 / 26 / 36%: gemiddeld 31,6% (15a: 36,6%). Dat is zoals bedoeld lager: actief spelen verdient nu ook met helden en kerkerdrankjes, en wie weg is stuurt niemand op pad; de Quartermaster (16c) brengt idle met helden later terug. Binnen het doel, maar aan de onderkant. In de browser (testsave op Legendary Hall, oorspronkelijke save daarna teruggezet): acht ingrediënten op het schap met een teller op Bog Pearl en Witch Moss; de buitles wees Witch Moss aan; Bog Pearl met Wild Honey gaf "Eureka! Pearl Mead!" en de voorraad ging van 2 naar 1; Witch Moss met Moon Grape gaf Witch's Kiss en Witch Moss werd grijs bij 0. Geen nieuwe consolefouten (twee oude 404's op `heroes.css` kwamen van de tijdelijke stash bij stap 15a).
- **Afwijkingen van het plan:** de tutorial-hint is "eerste buit op het schap" (wijst het ingrediënt aan en verwijst naar het boek) in plaats van "eerste recept met een kerker-ingrediënt": de buit is het moment waarop er iets nieuws te doen is. Verder geen.
- **Nu te proberen:** stuur een held naar het Moeras en kijk na zijn terugkeer naar het schap: de buit staat er met een teller. Probeer Bog Pearl met Wild Honey. Klik een leeg (grijs) ingrediënt aan.
- **Nog te doen / volgende stap:** stap 15c, Uitrusting. Idle zit aan de onderkant van het doel; als dat zo blijft, bij 16c (Quartermaster) meenemen.

### Stap 15a: Gildekamer, helden en eerste expeditie (2026-10-08, `step-15a-guild-heroes`)
- **Gedaan:** (code in `src/heroes/` (nieuw: `heroes.ts`, `heroes-model.ts`, `heroes-view.ts`, `guild-view.ts`, `heroes.css`), `src/i18n/en-shop.ts` en `en-heroes.ts` (nieuw), en kleine aanvullingen in `app/` (world, layout, tavern-scene, viewport-view), `rooms/`, `shared/` (state, events, content), `tutorial/` en `dev/simulator.ts`; tests in `tests/heroes.test.ts`, `tests/flows/heroes-flow.test.ts`, `tests/content/validate-content.ts`, `tests/flows/helpers.ts` (een klok meegeven) en `tests/tutorial-guide.test.ts`)
  - **Opsplitsing:** voor het bouwen voorgesteld en door de eigenaar goedgekeurd: 15a (deze stap), 15b (kerker-ingrediënten als voorraad en nieuwe recepten), 15c (uitrusting, was 15b).
  - **i18n gesplitst** (eerste commit, alleen verplaatsen): winkel, upgrades, kamers en decoraties naar `i18n/en-shop.ts`; de heldenteksten staan in `i18n/en-heroes.ts`. `en.ts` gaat van 297 naar 227 regels.
  - **Gildekamer, helden, expeditie, levels, gewond, tabblad Heroes, scene en tutorial-hint:** zie hoofdstuk 4, Helden ("Gebouwd in stap 15a").
  - **Validator:** nieuwe tabellen voor heldenklassen (tekst `name`, `class`, `tagline`; huurprijs positief) en kerkers (tekst `name`, `description`; 60 tot 180 s, XP, trekkingen en buit met positieve gewichten). Een kamer zonder plekken of bonus mag alleen als het de gildekamer is.
  - 20 tests erbij (447 totaal): groei (XP, meerdere levels, plafond), kans op gewond, buit, status en wachttijd, huren, het tabblad (aftellen, zonder gildekamer, kaartjes), de plekken in de gildekamer, en in het echte spel: de krijger bij het bouwen en de magiër huren, een tocht op de wandklok, terugkomen na het laden van een save, genezen met een drankje van de bar, en de les (de weg naar het tabblad en de knop; een vroege tocht slaat geen eerdere les over).
- **Waarom (keuzes):** de eigenaar liet de getallen aan Claude (de placeholders uit hoofdstuk 4 aangehouden: 15.000, 8.000, 90 s rust, max level 10; een tocht van 2 minuten, het midden van 1 tot 3). De terugkeer zit op de tick en vergelijkt met de absolute eindtijd: één weg voor spelen, herladen en offline, zonder iets in de offline-formule. Het systeem staat als laatste in de tick-volgorde en gebruikt de RNG alleen bij een terugkeer, zodat bestaande runs niet verschuiven. De rust telt vanaf het moment van terugkomen, zodat een speler die lang weg was geen gewonde held aantreft. Een drankje van de bar geneest met hetzelfde gebaar als serveren (oppakken, dan klikken), zoals hoofdstuk 4 voor stap 16 al beschrijft. De kerker-ingrediënten staan nog niet in de ingrediëntentabel: dan zouden ze op het schap of in de validator ("elk ingrediënt in een recept") horen, en dat is 15b. Het tabblad Heroes is er altijd, met vóór de gildekamer één zin waar je hem bouwt.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels (`tutorial/tutorial-steps.ts` 293, `heroes/heroes.ts` 241). Simulator 60 minuten (seeds 1/2/3): tot de gildekamer gelijk aan `main` (de eerste 20 minuten veranderen niet); gildekamer gebouwd op 20:51 / 21:00 / 21:56, VIP Lounge 25:30 / 26:07 / 26:22 (was 23:23 / 24:03 / 24:32), Golden Tankard 44:02 / 42:42 / 43:15 (was 40:36 / 40:10 / 40:52). Aankopen in de eerste 5 minuten, eerste medewerker en eerste ontdekking ongewijzigd (16, 4:26, 1:20 bij seed 1). Idle 36% / 35% / 47%; omdat seed 3 hoog was ook seeds 4 t/m 9 gemeten, op de branch en op `main`: branch 35 / 37 / 37 / 37 / 31 / 34%, `main` 39 / 30 / 35 / 40 / 31 / 33%. Gemiddeld over negen seeds 36,6% (`main` 35,3%), binnen het doel; seed 3 is ruis van het korte meetvenster (zie stap 13c en 14b). `vite build` slaagt (395 kB gzip, was 391). In de browser (testsave op Famous Tavern, oorspronkelijke save daarna teruggezet): vier kamervakken; klikken op de gildekamer opende de winkel, bouwen (40K naar 25K) zette de krijger in de kamer met banier en wapenrek, en de les wees het tabblad Heroes aan, dan "Send to the Swamp", daarna de gildekamer met de afsluitzin en het bordje "🗺 1:59". Na herladen met een verstreken eindtijd was de held terug (2 Bog Pearl, 1 Witch Moss, 40 XP in de save). Een terugkeer tijdens het spelen: binnenlopen met "+40 XP", "+1 Witch Moss", "+2 Bog Pearl". Een gewonde magiër (grijs, "🤕 1:25") was na een Slime Sap van de bar meteen fit ("Good as new!", drankje weg van de bar). De magiër huren: 25K naar 17K, kaartje met XP-balk. Zonder gildekamer toont het tabblad alleen waar je hem bouwt. Geen consolefouten. (Het browservenster tekende tijdens de test geen frames, waardoor tweens alleen bij een screenshot verder liepen; dat ligt niet aan de code.)
- **Afwijkingen van het plan:** de stap is gesplitst (zie boven). In het datamodel heeft `HeroClass` nog geen `bossPower` en `potionPower` (geen abstractie voor later; ze komen in 16 en 16b). `Dungeon` kreeg `xp` en `lootRolls`. De state kent geen apart `expeditions`: de lopende tocht staat bij de held.
- **Nu te proberen:** speel tot Famous Tavern en bouw de Guild Hall (15.000): Brakka trekt in en de ketel wijst het tabblad Heroes aan. Stuur hem naar het Moeras, sluit het spel en kom na twee minuten terug. Komt hij gewond terug, pak dan een drankje van de bar en klik hem aan. Huur Mildred voor 8.000.
- **Nog te doen / volgende stap:** stap 15b, Kerker-ingrediënten als voorraad en nieuwe recepten (de buit krijgt dan een nut; daarna de simulator met een bot die helden stuurt). Open punten: de klassen verschillen nog niet in spel (komt in 16 en 16b); het welkom-venster noemt teruggekeerde helden nog niet (16c).

### Chore: uitwerking van de helden (2026-10-07, `chore-heroes-design`)
- **Gedaan:** met de eigenaar de open vragen over de helden doorgenomen (vijf vragenrondes) en vastgelegd in hoofdstuk 4, Helden ("Uitwerking"), het datamodel (hoofdstuk 5) en het stappenplan. Stap 15 en 16 zijn opgesplitst in 15a, 15b, 16, 16b en 16c. Daarnaast IDEAS.md (punt 4 bijgewerkt) en GAME_ANALYSE.md 5.5 (verwijzing). Geen code.
- **Waarom:** de eigenaar wilde eerst een duidelijk beeld van de heldenlaag voordat er gecodeerd wordt.
- **Keuzes van de eigenaar:**
  - krijger en magiër, één van elk;
  - kerker-ingrediënten als hoofdbeloning, en die vormen een voorraad die opraakt;
  - gildekamer op niveau 5;
  - expedities van 1 tot 3 minuten in het Moeras;
  - uitrusting met een rol per vak, basis te koop en betere stukken als buit;
  - groei via XP en levels;
  - drankjes meegeven zoals serveren, maar via een **tweede ketel in de gildekamer** (voorstel van de eigenaar: zo staat idle niet stil en kunnen het personeel en een volle bar niet in de weg zitten);
  - een rol per drankeffect;
  - 2 keuzekaartjes met een standaardkeuze;
  - een timing-balk met 3 slagen als baasgevecht;
  - gewond is een korte rust, en een drankje geneest;
  - idle na een aankoop, met een Auto-knop per held die je op elk moment omzet (wens eigenaar: makkelijk wisselen tussen idle en zelf spelen).
- **Voorstellen van Claude (placeholders):** prijzen, namen van ingrediënten en recepten, de rusttijd, max level 10 en de voorbeeldkaartjes. Ze worden in de stappen zelf afgesteld.
- **Nog te doen / volgende stap:** stap 15a.

### Stap 14d: Night Shift, offline verdienen kopen (2026-10-07, `step-14d-night-shift`)
- **Gedaan:** (code in `src/economy/upgrade-data.ts`, `src/economy/upgrades.ts`, `src/economy/shop-model.ts`, `src/economy/shop-view.ts`, `src/offline/offline.ts`, `src/i18n/en.ts`; tests in `tests/offline.test.ts`, `tests/shop-model.test.ts`, `tests/flows/world-flow.test.ts`, `tests/content/validate-core.ts`)
  - **Night Shift:** zie hoofdstuk 4, Besluiten uit de ideeënronde ("Gebouwd in stap 14d").
  - **Validator:** `unlockedBy` mag alleen bestaande upgrades noemen.
  - 7 tests erbij (427 totaal); de offline-tests rekenen nu met een aandeel (Night Shift gekocht), de wereldtests met een bemanning met Night Shift.
- **Waarom (keuzes):** de eigenaar liet de prijzen aan Claude over. Night Shift als upgrade van één niveau met een eigen stat, zodat `getMultipliers`, de winkelrij, de koopknoppen en de simulator hergebruikt worden; de nieuwe regel is alleen `unlockedBy` (vrijgeven na een andere aankoop in plaats van na een niveau). Night Shift kost 150: met 300 kocht de bot hem pas na de Extension (rond minuut 9-10), omdat hij vanaf niveau 3 voor die kamer spaart; met 150 komt hij kort na de serveerster en schuift de Extension nauwelijks op. Night Owls en Long Night zijn een goud-sink voor later (samen ongeveer 70K) zonder de actieve speler te verzwakken: ze helpen alleen offline. Geen eigen tutorial-les: de personeelsles is het natuurlijke moment en Night Shift is direct daarna te koop.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels (`i18n/en.ts` staat nu op 297, `offline/offline.ts` op 285). Simulator 60 minuten (seeds 1/2/3): eerste serveerster 5:58 / 5:33 / 5:57, Night Shift 6:55 / 7:27 / 7:36, Night Owls 9:57 / 10:24 / 10:46, Long Night 10:55 / 11:21 / 12:05; Extension 8:43 / 9:10 / 9:15 (was 8:40 / 9:03 / 9:06), VIP Lounge 23:23 / 24:03 / 24:32 (was 20:41 / 22:23 / 22:44); goud op minuut 60 lager door de nieuwe sink (79K / 96K / 35K, was 338K / 287K / 293K). Aankopen in de eerste 5 minuten 16 / 17 / 16, idle 35% / 38% / 37% (doel 30-40%). In de browser (testsaves): een uur weg met brouwer en serveerster zonder Night Shift gaf "Your staff went home. With Night Shift they could have earned 1.64K gold." en het goud bleef gelijk; de winkel toonde de groep Night Shift met "Buy 1x · 150"; na het kopen verdween hij en stonden Night Owls (500) en Long Night (800) er; weer een uur weg leverde 108 klanten en 1.64K goud op. Geen consolefouten. `vite build` slaagt (391 kB gzip).
- **Afwijkingen van het plan:** geen. Opgemerkt: `i18n/en.ts` zit bijna op 300 regels; bij de volgende stap met veel tekst splitsen per domein (bijv. `i18n/en-shop.ts`).
- **Nu te proberen:** huur de brouwer en de serveerster, koop Night Shift in de winkel, sluit het tabblad en kom later terug. Of kom terug zonder Night Shift en lees wat je gemist hebt.
- **Nog te doen / volgende stap:** stap 15, Helden, gildekamer en uitrusting. Eerst met de eigenaar de open vragen uit IDEAS.md punt 4 beslissen (welke 2 klassen, keuzekaartjes en drankeffecten van de eerste kerker). Later (IDEAS.md punt 3): een rewarded ad die de offline-opbrengst verdubbelt (stap 20) en een prestige-tak voor offline (stap 17).

### Stap 14c: Legenda van effecten in het receptenboek (2026-10-07, `step-14c-effect-legend`)
- **Gedaan:** (code in `src/serving/effects.ts` (`effectLegend`), `src/recipes/recipes.ts`, `src/recipes/recipe-book-view.ts`, `src/recipes/recipe-book.css`, `src/i18n/en.ts`; test in `tests/recipes.test.ts`)
  - **Legenda:** zie hoofdstuk 4, Besluiten uit de ideeënronde ("Gebouwd in stap 14c").
  - **Kaartjes:** alleen nog het icoon van het effect na brouwtijd en prijs.
  - **Teksten:** `effects.<id>.name` is ingekort tot de naam (was "Speed: drinks faster"); nieuw zijn `book.legend_title`, `book.legend_does` en `book.legend_liked`.
  - 1 test erbij (421 totaal); de boektest verwacht nu het icoon.
- **Waarom (keuzes):** de bestaande `does`-teksten (ook gebruikt door de voorkeursles) leggen meer uit dan de oude korte naam, dus die staan in de legenda. Geen getallen in de legenda (bijv. "+25%"): die zijn placeholders en de eigenaar vroeg om icoon, naam en wat het doet. De ♥-regel erbij, omdat de bubbel en de les de ♥ gebruiken en het boek de plek is waar de les naar verwijst. Geen nieuwe tutorial-hint: dit is geen nieuwe speler-functie, en de afsluitzin van de voorkeursles verwijst al naar het boek.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels. `npm run simulate -- 60 1` is byte-identiek aan `main` (geen spelregel veranderd). In de browser: tabblad Recipes toont bovenaan "What drinks do" met de vier regels en de ♥-regel, daaronder de kaartjes met "4s brew · 8 gold · 💖". Geen consolefouten.
- **Afwijkingen van het plan:** geen.
- **Nu te proberen:** open het menu en het tabblad Recipes.
- **Nog te doen / volgende stap:** stap 14d, Night Shift (offline verdienen kopen). Als de legenda niet genoeg blijkt: IDEAS.md, punt 5.

### Stap 14b: Decoraties (2026-10-07, `step-14b-decorations`)
- **Gedaan:** (code in `src/decor/decor.ts`, `src/decor/decor-view.ts`, `DECOR_SPOTS` in `src/app/layout.ts`, en kleine aanvullingen in `app/world.ts`, `app/tavern-scene.ts`, `economy/upgrades.ts`, `economy/shop-model.ts`, `economy/shop-view.ts`, `shared/` (state, events, purchases, content, targets), `tutorial/`, `i18n/en.ts` en `dev/simulator.ts`; tests in `tests/decor.test.ts`, `tests/flows/shop-flow.test.ts`, `tests/layout.test.ts`, `tests/content/`, `tests/shared/targets.test.ts`)
  - **Decoraties:** zie hoofdstuk 4, Decoraties. Een nieuwe feature-map `decor/` plus één regel in `createWorld` (`watchDecorShop`) en een tabel in `Content`.
  - **Simulator:** de bot koopt een betaalbare decoratie vóór de goedkoopste upgrade, maar terwijl hij voor een kamer spaart alleen als ze onder 10% van de kamerprijs blijft (net als upgrades); de tijdlijn toont "bought <decoratie>".
  - **Tutorial in een lange winkel:** met zes extra rijen vielen de koopknoppen onderaan de winkel (decoraties, maar ook personeel) buiten het paneel, en wees de pijl onder het paneel. Opgelost met `reveal` in het doelregister: de winkel scrolt de knop in beeld zodra de pijl ernaar wijst (hoofdstuk 4, Tutorial).
  - 13 tests erbij (420 totaal).
- **Waarom (keuzes, afgesproken met de eigenaar):** eenmalig kopen en alleen bestaande stats (de aanbevolen opties), zodat de module voor eenmalige aankopen, de winkelgroep en `getMultipliers` hergebruikt worden en er geen nieuwe regels in klanten of serveren nodig zijn. Twee van elke soort (fakkel, tapijt, trofee) van niveau 2 tot 6, met prijzen die oplopen tot ver na de laatste kamer: een goud-sink voor het midden en het einde van een run. De les staat achteraan in de rij en telt een aankoop alleen in beeld, zodat een vroege aankoop geen eerdere lessen overslaat.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 300 regels. Zonder dat de bot decoraties koopt, was `npm run simulate -- 60 1` byte-identiek aan `main` (de nieuwe code verandert verder niets). Met decoraties, simulator 60 minuten (seeds 1/2/3): Wall Torch op 9:13 / 9:41 / 9:15, Woven Rug 12:50 / 13:27 / 13:55, Boar Trophy 15:38 / 15:19 / 17:06, Everburning Torch 22:22 / 24:11 / 24:13, Royal Carpet 26:30 / 27:34 / 27:49, Golden Tankard 33:50 / 34:27 / 34:25. Kamers ongeveer even vroeg als voorheen (Extension 8:40 / 9:03 / 9:06, VIP Lounge 20:41 / 22:23 / 22:44). Aankopen in de eerste 5 minuten 16 / 17 / 16, eerste medewerker 4:26, eerste ontdekking 1:20 (ongewijzigd). Idle 33% / 41% / 40% (op `main` 28% / 33% / 35%); omdat dat hoger leek, ook seeds 4/5/6 gemeten: 36% / 37% / 33% tegen 37% / 33% / 38% op `main`. Het verschil is ruis van het korte meetvenster van 10 minuten (zie ook stap 13c); gemiddeld over zes seeds 37% (`main` 34%), binnen het doel. In de browser (testsaves): de les verscheen op niveau 4 met 2.000 goud, wees Menu aan, de winkel scrolde naar de groep Decorations en de pijl stond op "Buy · 300"; na het kopen hing de fakkel aan de muur met de pijl erop en de afsluitzin. Met alle decoraties en kamers: fakkels links en naast de ketel, zwijnenkop en gouden kroes boven de bar, blauw kleed onder de tafels, rode loper voor de bar, stoelmarkeringen erbovenop. Geen consolefouten. `vite build` slaagt (390 kB gzip, was 388).
- **Afwijkingen van het plan:** het in beeld scrollen van winkelknoppen voor de tutorial (`reveal`) is mee gebouwd, omdat de hint anders onder het paneel wees; het helpt ook de bestaande lessen. Verder geen.
- **Nu te proberen:** speel tot Local Haunt en spaar 300 goud: de groep Decorations staat in de winkel en de fakkel hangt na het kopen aan de muur. De hint van de ketel komt pas na de kamerles.
- **Nog te doen / volgende stap:** stap 14c, Legenda van effecten in het receptenboek. De winkel wordt lang (ingrediënten, kamers, decoraties, upgrades); groepen inklappen of tabbladen staan al op de checklist in IDEAS.md, punt 2.

### Chore: vlakke architectuur (2026-10-07, `chore-flatten-architecture`)
- **Gedaan:** de eigenaar vond de architectuur te ver doorgeslagen in SOLID (ravioli-code). Voor: 245 bestanden in `src/` van gemiddeld 29 regels (187 van ten hoogste 40 regels), 25 `index.ts`-barrels, een `wiring/`-laag, een `PlayerActions`-facade met 14 deps, een eigen store-interface per systeem en paden tot vier mappen diep. Na: **54 bestanden** (mediaan 104 regels, grootste 265), **0 barrels**, tests van 84 naar 37 bestanden, alle paden `src/<feature>/<bestand>.ts`. Uitgevoerd in fasen, elke fase met `npm run check` groen en `npm run simulate -- 60 1` **byte-identiek** aan de baseline van vóór de refactor:
  0. documentatie (CLAUDE.md, GAME_ANALYSE.md hoofdstuk 11 met Mermaid-diagrammen, SPECS.md hoofdstuk 1, 3, 4, 7, 9, 10, 11, 13);
  1. limieten: 300 (waarschuwing) en 350 (fout) regels, functies 60;
  2. `shared/` (core, save en runtime samen);
  3. reputation, recipes, rooms, `shared/content.ts` en `shared/purchases.ts`;
  4. economy, customers, brewing, serving (met effects) en staff;
  5. offline, tutorial en het ontbinden van `wiring/`;
  6. `app/` (scene en ui-schil), `i18n/en.ts`, `dev/` (simulator) en `tests/content/` (validatie van de data-tabellen);
  7. één `World` (`app/world.ts`, `createWorld`) in plaats van `createServices` en `PlayerActions`; spelersacties zijn functies per feature (`clickIngredient`, `buyUpgradeById`, `clickCustomer`...);
  8. lintregel op bestandsnaam (Phaser/DOM alleen in `*-view.ts`, `*-scene.ts`, `main.ts`, `shared/browser.ts`) en `scripts/check-cycles.mjs` (importkringen); de vier kringen die dat vond zijn opgelost.
  Gecontroleerd in de browser (dev-server): het spel laadt zonder consolefouten, ingrediënt klikken, brouwen, drankje pakken, klant bedienen (goud en reputatie omhoog), tutorial loopt door, menu met Shop-tab opent. `vite build` slaagt, bundel gelijk (388 kB gzip).
- **Waarom:** voor één ontwikkelaar is het mentale model te groot; kleine bestanden en doorgeeflagen kosten meer leesbaarheid dan ze opleveren. Bestanden zijn nu 150 tot 300 regels met bij elkaar horende functies. Gedrag, state, UI en mechanics zijn niet veranderd (simulator identiek, 407 tests ongewijzigd in aantal).
- **Afwijkingen van het voorstel:** (1) de tick-volgorde staat niet in één `bus.on('tick')` maar in de volgorde van de `start…`-aanroepen in `createWorld` (de systemen hebben interne toestand, en de unit tests starten ze los); (2) de kleine structurele `…Store`/`…State`-interfaces van de pure functies (bijv. `UpgradeStore`, `RoomStore`, `LevelStore`, `EconomyStore`) zijn **blijven bestaan**: tests bouwen daarmee kleine toestanden, en alleen de facades en factories zijn weggehaald; (3) `*-data.ts` bestaat alleen waar de data groot is of een importkring breekt (`recipe-data`, `upgrade-data`, `customer-data`, `tutorial-steps`); (4) `reputation/level-up-model.ts` (45 regels) en `shared/random.ts` (rng + vrolijke meldingen) zijn kleine bestanden om kringen te vermijden; (5) `createInitialState` in `shared/state.ts` importeert nog `STARTER_RECIPE_IDS` uit `recipes/recipe-data.ts` (shared kent dus één feature); (6) de views lezen de echte data-tabellen, niet `world.content`; (7) één commit per fase (10 commits) in plaats van 2 tot 3.
- **Bekende prestatiepunten (bestaand, niet veroorzaakt door de refactor, niet aangepast om het gedrag gelijk te houden):** `shelfIds(world)` maakt elke frame een nieuwe array (het schap leest `update()` elke frame) en `roomOfferById` plus `roomSign` bouwen elke frame teksten per kamer. Dat zijn kandidaten voor een aparte opruimstap (cache op state-wijziging) om het zero-allocation-doel te halen.
- **Paden-tabel (oud → nieuw), voor het lezen van oudere logboek-entries:**

| Oud | Nieuw |
|---|---|
| `core/` (state, store, events, game-events, ticker, clock, numbers, format, suffixes, rng, pool, target-registry, debug) | `shared/state.ts`, `events.ts`, `time.ts`, `numbers.ts`, `random.ts`, `pool.ts`, `targets.ts` |
| `save/*`, `runtime/*` | `shared/save.ts` (codec, envelope, migrate, reconcile, manager, storage-interface en geheugenadapter), `shared/browser.ts` (loop-driver, autosave, localStorage, debug-commando's) |
| `data/common.ts`, `data/text-key.ts`, `data/feedback.ts`, `systems/feedback.ts` | `shared/content.ts`, `shared/random.ts` |
| `systems/purchases/` | `shared/purchases.ts` |
| `data/customers/`, `systems/customers/`, `scene/customers/` | `customers/customer-data.ts`, `customers.ts`, `customers-view.ts` |
| `data/brewing.ts`, `systems/brewing/`, `scene/brewing/` | `brewing/brewing.ts` (`SERVING` staat nu in `serving/effects.ts`), `brewing-view.ts` |
| `data/ingredients/`, `systems/ingredients/`, `wiring/ingredient-shelf.ts` | `brewing/ingredients.ts` |
| `data/recipes/`, `systems/recipes/`, `ui/recipe-book/` | `recipes/recipe-data.ts`, `recipes.ts`, `recipe-book-view.ts` |
| `data/effects.ts`, `systems/effects/`, `systems/serving/`, `scene/effects/` | `serving/effects.ts`, `serving.ts`, `serving-view.ts` |
| `systems/staff/` | `staff/staff.ts` |
| `data/upgrades/`, `systems/upgrades/`, `systems/economy/`, `ui/shop/` | `economy/upgrade-data.ts`, `upgrades.ts`, `shop-model.ts`, `shop-view.ts` |
| `data/rooms/`, `systems/rooms/`, `scene/rooms/` | `rooms/rooms.ts`, `rooms-view.ts` |
| `data/reputation/`, `systems/reputation/`, `ui/level-up/` | `reputation/reputation.ts`, `level-up-model.ts`, `level-up-view.ts` |
| `data/offline.ts`, `systems/offline/`, `ui/welcome/`, `wiring/create-offline.ts` | `offline/offline.ts`, `welcome-view.ts` |
| `data/tutorial/`, `systems/tutorial/`, `ui/tutorial/`, `wiring/create-tutorial.ts` e.a. | `tutorial/tutorial-steps.ts`, `tutorial.ts`, `tutorial-guide.ts`, `tutorial-context.ts`, `tutorial-view.ts` |
| `wiring/create-services.ts` (+ start-customers, start-staff, sync-station, watch-shop), `systems/actions/` | `app/world.ts` (`createWorld`); acties staan in de features |
| `scene/` (boot, tavern, layout, palette, sprites), `ui/` (hud, panels, fit, mount), `game.ts` | `app/tavern-scene.ts`, `backdrop-view.ts`, `layout.ts`, `ui-model.ts`, `hud-view.ts`, `panels-view.ts`, `viewport-view.ts` |
| `sim/` | `dev/simulator.ts`, `simulator-report.ts` |
| `data/validate/` | `tests/content/validate-core.ts`, `validate-content.ts` |
| `i18n/en/*.ts`, `i18n/index.ts` | `i18n/en.ts`, `i18n/translator.ts` |
| `tests/<oude map>/…` | `tests/<feature>.test.ts`, `tests/flows/`, `tests/content/` |

- **Nu te proberen:** `npm run dev` (spel speelt als voorheen), `npm run check` (nu ook `npm run cycles`), `npm run simulate -- 60 1`.
- **Nog te doen / volgende stap:** mergen naar `main` als de eigenaar dat zegt; daarna weer verder met stap 14b (Decoraties). Eventueel een aparte opruimstap voor de per-frame-allocaties hierboven en voor de resterende smalle store-interfaces.

### Chore: ideeënronde (2026-10-06, `chore-ideas-review`)
- **Gedaan:** alle punten uit IDEAS.md met de eigenaar doorgenomen (vragen in vier rondes), de besluiten vastgelegd in hoofdstuk 4 ("Besluiten uit de ideeënronde" en "Helden") en in het stappenplan (nieuwe stappen 14c, 14d en 16b; 15 en 16 aangescherpt). IDEAS.md opgeschoond: volledig uitgewerkte ideeën zijn eruit (afspraak eigenaar: wat in SPECS.md staat, gaat uit IDEAS.md); alleen open punten blijven. De hernoeming van SPEC.md naar SPECS.md (door de eigenaar) is vastgelegd, en alle documentatie staat nu in `docs/` (wens eigenaar; CLAUDE.md blijft in de hoofdmap omdat Claude Code hem daar automatisch laadt). Alle verwijzingen zijn bijgewerkt.
- **Waarom:** de eigenaar wilde eerst samen bepalen wat er van de ideeën in het plan komt, voordat er verder gebouwd wordt. Geen code.
- **Nog te doen / volgende stap:** stap 14b, Decoraties.

### Stap 14a: Kamers (2026-10-06, `step-14a-rooms`)
- **Gedaan:** (code in `src/data/rooms/`, `src/systems/rooms/`, `src/systems/purchases/`, `src/systems/actions/room-actions.ts`, `src/scene/layout-rooms.ts`, `src/scene/rooms/`, `src/ui/shop/one-time-*.ts`, `src/ui/shop/room-view-model.ts`, `src/data/tutorial/room.ts`, `src/data/validate/room-table.ts`, `src/sim/shopping.ts`; tests in `tests/systems/rooms/`, `tests/scene/layout-rooms.test.ts`, `tests/ui/room-view-model.test.ts`, `tests/wiring/room-flow.test.ts`, `tests/data/validate-rooms.test.ts`)
  - **Kamers op een bovenverdieping:** zie hoofdstuk 4, Kamers.
  - **Opgeschoond:** ingrediënten gebruiken nu de gedeelde module voor eenmalige aankopen (geen dubbele logica voor kamers); `getMultipliers` telt bronnen (upgrades en kamers) op één manier op.
  - **Simulator:** de bot spaart voor een kamer zodra die te koop is (hij koopt dan alleen upgrades onder 10% van de kamerprijs) en bouwt hem; de tijdlijn toont "built <kamer>" en de kolom seats telt de kamerplekken mee.
  - **Personeel tot niveau 7** (was 5): met meer plekken en VIP's verdient actief spelen meer, waardoor idle zakte naar 22%. Met twee extra trainingsniveaus komt idle weer rond een derde, en er is na minuut 20 weer iets te kopen. Niveau 8 schoot door (43-56%).
  - 16 tests erbij (407 totaal).
- **Waarom (keuzes, afgesproken met de eigenaar via vragen):** 3 kamers (de MVP-omvang), op een bovenverdieping zonder camerabeweging, kopen in de winkel plus klikken in de scene, en de stap gesplitst (decoraties in 14b). Een gebouwde kamer verdwijnt uit de winkel, net als ingrediënten (wens eigenaar uit 13c). Kamerplekken zijn aparte stoelnummers na de 7 beneden, zodat Extra Seat en kamers elkaar niet in de weg zitten en klanten echt in de kamer gaan zitten.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels. Simulator, 60 minuten: Extension op 8:40 / 9:03 / 9:06, Alchemy Lab op 13:12 / 13:29 / 14:03, VIP Lounge op 21:31 / 22:25 / 22:45 (seeds 1/2/3; doel: eerste kamer binnen 30 minuten); idle 28% / 33% / 35% (doel 30-40%; seed 1 net eronder); 16 aankopen in de eerste 5 minuten, eerste medewerker op 4:26, eerste ontdekking op 1:20 (ongewijzigd). In de browser: drie dichtgetimmerde kamers met bordjes; klikken op de Extension opende het paneel op Shop met de groep Rooms; na het bouwen een ingerichte kamer met drie klanten boven; met alle kamers gebouwd: lab met flesjes, lounge met tapijt, lijst en bank, klanten boven en beneden door elkaar. Geen consolefouten.
- **Afwijkingen van het plan:** stap 14 is gesplitst in 14a en 14b (keuze eigenaar). Het personeel kan nu tot niveau 7 trainen (balans, zie boven). Klanten lopen nog dwars door de muur naar boven; dat lost de art-pass op (stap 21).
- **Nu te proberen:** speel tot Cozy Inn en spaar 1.500 goud; de ketel wijst de Extension aan. Klik op een dichtgetimmerde kamer om de winkel te openen.
- **Nog te doen / volgende stap:** stap 14b, Decoraties.

### Stap 13c: Ingrediënten in de winkel (2026-10-06, `step-13c-ingredients`)
- **Gedaan:** (code in `src/data/ingredients/`, `src/systems/ingredients/`, `src/systems/recipes/discovery.ts`, `src/systems/actions/ingredient-actions.ts`, `src/wiring/ingredient-shelf.ts`, `src/ui/shop/ingredient-*.ts`, `src/ui/recipe-book/`, `src/ui/level-up/`, `src/data/tutorial/ingredient.ts`, `src/data/validate/ingredient-table.ts`, `src/sim/`; tests in `tests/systems/ingredients/`, `tests/ui/ingredient-view-model.test.ts`, `tests/wiring/ingredient-flow.test.ts` en aangepaste bestaande tests)
  - **Ingrediënten koop je in de winkel:** zie hoofdstuk 4, Speelbaarheid na de eerste speeltest ("Gebouwd in stap 13c").
  - **Validator:** een `buy` mag alleen bij een winkelingrediënt, op niveau 2 of hoger, met een positieve prijs. De ingrediënttabel staat nu in een eigen bestand (`tables.ts` werd te lang).
  - **Simulator:** de bot koopt een betaalbaar ingrediënt vóór de goedkoopste upgrade (een speler wil nieuwe recepten proberen); de tijdlijn toont "bought <ingrediënt>" en telt het als aankoop.
  - **Werkafspraak** (op verzoek van de eigenaar): mergen en pushen alleen als de eigenaar het per stap zegt; vastgelegd in `CLAUDE.md` en hoofdstuk 11.
  - **Na feedback van de eigenaar:** een gekocht ingrediënt blijft niet als "Owned" in de winkel staan, maar verdwijnt eruit (`isListed` in `ui/shop/ingredient-view-model.ts`); in de browser gecontroleerd: na het kopen van Fire Pepper staan alleen Moon Grape en Troll Sweat nog in de groep.
  - 12 tests erbij (391 totaal; de drie oude schaptests zijn vervangen door tests voor het bezit).
- **Waarom (keuzes):** het voorstel uit hoofdstuk 4 is gevolgd (de eigenaar liet de details aan Claude). Bezit afleiden uit bekende recepten in plaats van een savemigratie: eenvoudiger, en een bekend recept bewijst dat de speler de ingrediënten had. Prijzen: Fire Pepper 40 (net na niveau 2 te betalen), Moon Grape 150, Troll Sweat 600 (met 400 werd het 14 s na niveau 4 gekocht, dus geen doel meer). De les staat na het boek, omdat niveau 2 eerst het boek opent en pas iets later genoeg goud voor de peper geeft.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels. Simulator (seed 1): niveau 2 op 1:19, Fire Pepper gekocht op 2:13, Dragon's Hiccup ontdekt op 2:15; niveau 3 op 4:12, Moon Grape op 4:56; niveau 4 op 7:37, Troll Sweat op 8:17; alle 13 recepten rond minuut 23. Doelen: 16 aankopen in de eerste 5 minuten (doel ~10, was 15), eerste medewerker op 4:26, eerste ontdekking op 1:20, idle 32% (seeds 2 en 3: 33% en 34%) in de standaardrun van 60 minuten. In de browser: de niveaumelding "Level up! Local Haunt" noemt "New in the shop: Fire Pepper"; het boek zegt bij Dragon's Hiccup en Swamp Fire "Needs Fire Pepper from the shop"; de les wees Menu en daarna de koopknop aan; na het kopen stond Fire Pepper op het schap en uit de winkel; Moon Grape en Troll Sweat staan op "Unlocks at Cozy Inn / Popular Pub". Geen consolefouten.
- **Afwijkingen van het plan:** geen. Opgemerkt: in een run van 30 minuten (weglopen op minuut 20) schommelt het idle-aandeel per seed tussen 24% en 32%; dat venster van 10 minuten is te kort om op te sturen, de standaardmeting van 60 minuten blijft binnen het doel. In de winkel worden lange regels zoals "Unlocks at Cozy Inn" naast de naam krap; hoort bij de winkel-layout (IDEAS.md, punt 3).
- **Nu te proberen:** speel tot 10 reputatie: lees de melding, open het boek (Needs Fire Pepper) en koop de peper zodra je 40 goud hebt; de ketel wijst het aan. Probeer daarna Fire Pepper met Wild Honey.
- **Nog te doen / volgende stap:** stap 14, Kamers en visuele groei.

### Stap 13b: Speelbaarheid, UX-ronde 1 (2026-10-06, `step-13b-ux`)
- **Gedaan:** (code in `src/i18n/en/effects.ts`, `src/scene/effects/`, `src/scene/customers/`, `src/scene/brewing/ready-view.ts`, `src/systems/serving/selection.ts`, `src/systems/actions/serve-actions.ts`, `src/ui/side-panels.ts`, `src/ui/side-panel-state.ts`, `src/ui/shop/`, `src/ui/recipe-book/`, `src/data/tutorial/`, `src/systems/tutorial/`, `src/wiring/follow-open-tab.ts`, `src/wiring/tutorial-already-holds.ts`; tests in `tests/scene/effect-text.test.ts`, `tests/systems/actions/serve-actions.test.ts`, `tests/systems/tutorial/resolve-target.test.ts`, `tests/systems/tutorial/machine-only-shown.test.ts`, `tests/ui/side-panel-state.test.ts` en aangepaste wiring-tests)
  - **Effect-iconen, serveren vanuit het drankje en één paneel met tabbladen:** zie hoofdstuk 4, Speelbaarheid na de eerste speeltest ("Gebouwd in stap 13b").
  - **Voorkeursles:** noemt alleen het effect van het bestelde drankje, met icoon en wat het doet ("Glowcap Stout is a ⚡ speed drink: they drink faster and free the seat sooner"); de afsluitzin verwijst naar het boek.
  - **Lessen met de nieuwe bediening:** basisles: drankje (`basics_pick`), dan klant; upgrade-, plekken-, personeels- en boekles: uitklapknop, dan tabblad, dan de knop in het paneel.
  - **Tutorial-fouten opgelost:** (1) het tabblad Recipes of Shop vroeg openen vinkte via "een latere actie al gedaan" hele lessen af (upgrade en plekken), of toonde de koopzin zonder naam ("Buy ."). Nu tellen navigatiestappen alleen als ze in beeld zijn (`onlyWhenShown`, zie hoofdstuk 4, Tutorial). (2) Kreeg de allereerste klant in de basisles een drankje dat hij lekker vond, dan werd de voorkeursles overgeslagen; nu verschijnt die bij de volgende ♥-bestelling. (3) De tutorial-overlay lag onder het zijpaneel, waardoor de spotlight in het paneel onzichtbaar was; de overlay heeft nu z-index 3.
  - **Tekst (op verzoek van de eigenaar):** de koopzin "Buy {upgrade}. Gold only counts when it is spent. That is the whole joke." was raar en kwam uit het niets (door fout 1). Nieuw: "Buy {upgrade}. Upgrades make your tavern faster and richer. Gold is for spending, not for hugging." Zonder betaalbare upgrade zegt hij "an upgrade" in plaats van niets.
  - 26 nieuwe tests (379 totaal).
- **Waarom (keuzes):** de eigenaar koos via vragen steeds de aanbevolen optie: knop "☰ Menu" / "✕", laatst gebruikte tabblad alleen binnen de sessie, altijd een effectregel na het serveren, groene bubbel met ▼ als markering. De selectie onthoudt een soort drankje en geen plek op de bar, omdat de plekken verschuiven als de serveerster een drankje wegneemt. De iconen staan in i18n omdat het spelerstekst is (emoji als placeholder tot stap 21).
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels. `npm run simulate` geeft dezelfde uitkomst als na stap 13 (geen balanswijziging). In de browser (nieuw spel en testsaves): bubbel "♥⚡ Glowcap Stout"; de basisles wijst het drankje op de bar aan en daarna de klant; "+12" en "⚡ Quick drinker! ♥x2" na het serveren; met twee klanten licht het opgepakte drankje op en krijgen de juiste klanten een groene bubbel met ▼; de verkeerde klant weigert en het drankje blijft opgepakt. Vroeg het tabblad Recipes openen laat de basisles staan. Upgrade-les: pijl op Menu, dan op het tabblad Shop (vanaf Recipes) en dan op de koopknop. Boekles: pijl op Menu, dan Recipes, dan de kop van het boek. Geen consolefouten.
- **Afwijkingen van het plan:** de drie tutorial-fouten hierboven zijn mee opgelost, omdat "alle lessen werken met de nieuwe bediening" anders niet klopte (met één knop opent een nieuwe speler het paneel veel sneller). Verder geen.
- **Nu te proberen:** wis Local Storage en speel de basisles: pak het drankje van de bar en geef het aan de klant. Open het menu, wissel tussen Shop en Recipes en sluit het weer; open het opnieuw: het staat op het laatste tabblad. Met meer plekken: pak een drankje op en kijk welke klanten groen worden; geef het aan de verkeerde klant.
- **Nog te doen / volgende stap:** stap 13c, Ingrediënten in de winkel (daarna `npm run simulate` en opnieuw afstellen). Na het spelen beslissen of een van de extra uitlegideeën uit IDEAS.md, punt 7, nodig is.

### Stap 13: Balans-simulator (2026-10-06, `step-13-balance-simulator`)
- **Gedaan:** (code in `src/sim/`, `scripts/simulate.mjs`, `src/systems/staff/stale-cauldron.ts`, getallen in `src/data/`; tests in `tests/sim/` en `tests/systems/staff/stale-cauldron.test.ts`)
  - **Simulator:** zie hoofdstuk 4, Balans-simulator. Twee runs van een uur duren samen ongeveer 7 seconden.
  - **Eerste afstelling** (seed 1, 60 minuten, gecontroleerd met seeds 2 en 3):
    - *Better Prices* had geen maximum en werd elk niveau 15% beter bij maar 25% duurder: na minuut 10 explodeerde het goud (25 miljoen op minuut 60). Prijsgroei 1,25 naar 1,7: nu ongeveer 100K op minuut 60.
    - *Personeel* was volledig getraind sneller dan de klantenstroom, waardoor idle 94% van actief verdiende en de speler later niets toevoegde. Nu: brouwer +0,03/s per niveau en serveerster +0,04/s, maximaal 5 niveaus, prijsgroei 1,8, en goedkoper inhuren (60 en 90, was 100 en 150). Idle verdient nu 32-34% van actief (doel 30-40%).
    - *Niveaus* gingen te snel (Legendary Hall op 11 minuten): drempels 0 / 10 / 40 / 120 / 300 / 650 (was 0 / 10 / 25 / 50 / 100 / 200). Alle 13 recepten nu rond 23-24 minuten (doel ~15 recepten in 30 minuten).
    - Uitkomst tegen de doelen: 15 aankopen in de eerste 5 minuten (doel ~10), eerste medewerker op 4:16 (doel binnen 5 minuten), eerste ontdekking op 1:20 (doel binnen 5 minuten).
  - **Fout gevonden door de simulator en opgelost:** liet de speler één ingrediënt in de ketel liggen en liep hij weg, dan bleef de brouwer eeuwig wachten (hij raakt het werk van de speler niet aan), terwijl er 7 klanten zaten. Nu ruimt een ingehuurde brouwer een ketel op die 15 s onveranderd is (`BREWING.staleCauldronMs`); een speler midden in een combinatie merkt daar niets van.
  - 9 nieuwe tests (353 totaal).
- **Waarom (keuzes):** de eigenaar was weg en liet de aanbevolen keuze over. De runner gebruikt dezelfde bedrading als het spel in de browser, zodat de simulator altijd meeloopt met nieuwe regels. De idle-meting vergelijkt hetzelfde spel met en zonder speler; een eerste versie (stoppen direct na het inhuren) mat oneerlijk laag personeel en gaf 2%.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels. In de browser laadt het spel zonder nieuwe fouten.
- **Afwijkingen van het plan:** het script heet `scripts/simulate.mjs` met de logica in `src/sim/` (in plaats van `scripts/simulate.ts`), zodat de logica getypt, gelint en getest wordt. Na minuut 25 is er niets meer te kopen behalve Better Prices; kamers (stap 14) en prestige (stap 17) moeten daar de doelen vullen. De offline-berekening houdt nog geen rekening met plekken en drinktijd; met de nieuwe personeelsgetallen is het personeel vrijwel altijd de bottleneck, dus het verschil is klein.
- **Nu te proberen:** `npm run simulate`, of `npm run simulate -- 30 7` voor 30 minuten met seed 7. Speel zelf de eerste 10 minuten en vergelijk met de tijdlijn.
- **Nog te doen / volgende stap:** stap 14, Kamers en visuele groei. Bij elke nieuwe stap de simulator opnieuw draaien.

### Stap 12: Receptenontdekking en receptenboek (2026-10-06, `step-12-recipe-book`)
- **Gedaan:** (code in `src/systems/recipes/`, `src/systems/brewing/add-ingredient.ts`, `src/data/recipes/`, `src/data/reputation/levels.ts`, `src/ui/recipe-book/`, `src/ui/side-panels.ts`, `src/data/tutorial/book.ts`, `src/wiring/tutorial-already-holds.ts`, `src/wiring/start-customers.ts`; tests in `tests/systems/recipes/`, `tests/ui/book-view-model.test.ts`, `tests/wiring/discovery-flow.test.ts` en aangepaste bestaande tests)
  - **Ontdekken in de ketel,** het **receptenboek**, de **poster-beslissing** en de **tutorial-hint:** zie hoofdstuk 4, Receptenboek.
  - **Content:** 13 recepten (was 5): Bog Lantern (tier 1, geluk) en in tier 2 Swamp Fire, Honeyed Moon, Gym Sock Mead, Spicy Spores, Troll Torch, en de zeldzame Dusk Sangria en Berserker Brew (`tier02-rare.ts`). Elke combinatie van twee van de 6 ingrediënten is nu een recept, plus Troll's Toll met drie. Niveaus: 2 opent Bog Lantern, Dragon's Hiccup en Swamp Fire; 3 Moonlight Merlot en Honeyed Moon; 4 Troll's Toll, Gym Sock Mead en Spicy Spores; 5 Troll Torch en Dusk Sangria; 6 Berserker Brew.
  - **Niveaus leren niets meer:** `teaches` is `unlocks` geworden en de bewaker uit 11c meldt alleen nog nieuwe niveaus. Wie in 11c al recepten kreeg, houdt ze.
  - **Opgeruimd:** de winkel gebruikt de gedeelde paneelschakelaar (geen eigen `panel-toggle.ts` meer, gedeelde stijl in `side-panels.css`); de voorwaarden "geldt al" van de tutorial zijn een tabel in een eigen bestand in plaats van een if-keten; `startCustomers` staat in een eigen bestand.
  - 13 nieuwe tests (344 totaal).
- **Waarom (keuzes):** de eigenaar was weg en liet de aanbevolen keuze over waar de documentatie niets zei. Ontdekbaar per niveau volgt het plan uit 11c. Pas vanaf niveau 2 ontdekken voorkomt een vastlopende basisles (in tier 1 is elke combinatie een recept). De boek-les start op het eerste nieuwe niveau, zodat hij de upgrade- en plekken-hints niet tegenhoudt.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels. In de browser op Local Haunt: de boek-les wees de knop Recipes aan; het boek toonde 2/13, de twee bekende recepten met gekleurde ingrediënten, brouwtijd, prijs en effect, hints voor de drie ontdekbare en "Unlocks at …" voor de rest. Slijm plus glowcap gaf "Eureka! Bog Lantern!", de ketel begon te brouwen en het boek stond op 3/13. Geen nieuwe consolefouten (alleen oude `?t=`-restanten van tussenversies).
- **Afwijkingen van het plan:** 13 recepten in plaats van ~15: meer kan alleen met extra ingrediënten, en het schap heeft 6 plekken (meer ingrediënten horen bij de kerkers in stap 16, of bij een groter schap in stap 14). De poster is uitgesteld naar stap 21.
- **Nu te proberen:** speel tot 10 reputatie: je krijgt de melding "New recipes to discover: 3" en de ketel wijst het boek aan. Lees de hints en probeer combinaties: Fire Pepper met Wild Honey, Swamp Slime met Glowcap. Open de winkel terwijl het boek open is: het boek sluit vanzelf.
- **Nog te doen / volgende stap:** stap 13, Balans-simulator. Daar ook: drempels, prijzen en brouwtijden van de nieuwe recepten afstellen.

### Stap 11c: Reputatieniveaus, gates en VIP-klanten (2026-10-06, `step-11c-reputation`)
- **Gedaan:** (code in `src/data/reputation/`, `src/data/customers/`, `src/systems/reputation/`, `src/systems/customers/pick-type.ts`, `src/systems/offline/earnings.ts`, `src/ui/hud*.ts`, `src/ui/level-up/`, `src/ui/tutorial/speech.ts`, `src/data/tutorial/vip.ts`, `src/data/validate/reputation-table.ts`; tests in `tests/systems/reputation/`, `tests/systems/customers/vip.test.ts`, `tests/data/validate-reputation.test.ts`, `tests/ui/level-up-view-model.test.ts`, `tests/wiring/vip-flow.test.ts`)
  - **Niveaus, gates en recepten:** zie hoofdstuk 4, Reputatieniveaus en VIP-klanten. Klanttypes hebben `minLevel` in plaats van `minReputation` (de niveaus zijn nu de poort; het datamodel in hoofdstuk 5 is aangepast).
  - **VIP:** King Grumblebeard, met het duurste bekende drankje, 3x de prijs, +3 reputatie en een kroon in de bubbel. Zonder open VIP wordt er geen kans gegooid, dus bestaande seeds geven dezelfde klanten als voorheen.
  - **HUD en melding:** niveaunaam met balkje, plus een melding bij elk nieuw niveau.
  - **Tutorial-hint** (`vip_spot`, `vip_done`, na de personeelsles): start bij de eerste VIP (event `vip:arrived`, of meteen als er al een wacht), wijst hem aan (gids-alias `guide-vip`, tekstparameter `{royal}`), klaar zodra hij zijn drankje krijgt (`vip:served`). Geen aparte les voor niveaus (keuze van de eigenaar); de melding legt het zelf uit.
  - **Validator:** niveaus moeten bij 0 beginnen en stijgen, en mogen alleen bestaande recepten leren; klanten moeten een bestaand niveau hebben en een reputatiebonus van minstens 0.
  - Opgesplitst om onder de grenzen te blijven: `startCustomers` uit `createServices` (functie was 42 regels), de spraaktekst van de mascotte uit `tutorial-view.ts` (`speech.ts`).
  - 24 nieuwe tests (331 totaal).
- **Waarom (keuzes, afgesproken met de eigenaar):** 6 niveaus met de bestaande drempels van elf en dwerg; een niveau leert nu direct een recept, zodat de speler voor stap 12 al iets nieuws krijgt; VIP's mild (geen straf). VIP's als klanttypes met een vlag in plaats van een aparte lijst: geen nieuwe catalogus, en de offline-berekening en de validator gaan vanzelf mee.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels. In de browser: de HUD toont "Local Haunt" met een bijna vol balkje bij 24 reputatie; één Slime Sap (charme) gaf 26 reputatie en de melding "Level up! Cozy Inn" met de dwerg, King Grumblebeard en Dragon's Hiccup; de tier-2-ingrediënten kwamen op het schap. Met 7 plekken kwam de koning in het goud met "👑 Dragon's Hiccup", en de VIP-les wees hem aan. Klanten bestelden daarna een mix van de drie drankjes met ♥ waar het hoort. Geen consolefouten.
- **Afwijkingen van het plan:** het receptenboek en echte ontdekking blijven bij stap 12. Alle tier-2-ingrediënten komen tegelijk op het schap zodra het eerste tier-2-recept bekend is (Troll Sweat staat er dus al voordat Troll's Toll bekend is); dat past bij ontdekken in stap 12.
- **Nu te proberen:** speel tot 10 en 25 reputatie: je ziet de meldingen en de nieuwe klanten. Vanaf Cozy Inn komt af en toe de koning; serveer hem Dragon's Hiccup (Fire Pepper en Wild Honey) voor 90 goud.
- **Nog te doen / volgende stap:** stap 12, Receptenontdekking en receptenboek. Voor stap 13: drempels, VIP-kans en prijzen afstellen.

### Stap 11b: Voorkeuren en drankeffecten (2026-10-06, `step-11b-effects`)
- **Gedaan:** (code in `src/data/effects.ts`, `src/systems/effects/`, `src/systems/customers/drinking.ts`, `src/systems/serving/`, `src/data/tutorial/likes.ts`, `src/scene/customers/`, `src/scene/effects/bonus-lines.ts`, `src/i18n/en/effects.ts`; tests in `tests/systems/effects/`, `tests/systems/customers/drinking.test.ts`, `tests/systems/serving/serve-effects.test.ts`, `tests/wiring/likes-flow.test.ts` en aangepaste bestaande tests)
  - **Vier effecten** die altijd werken, dubbel bij voorkeur (zie hoofdstuk 4, Drankeffecten en voorkeuren): kracht +25% prijs, snelheid 40% korter drinken, geluk 25% kans op een fooi van 50% van de prijs, charme +1 reputatie. `drinkBonus(recipe, customerType)` geeft per drankje een neutrale bonus met daarop de regel van het effect; `serveCustomer` past hem toe en de fooi wordt met de ingespoten RNG gegooid (alleen als er een kans is).
  - **Drinkfase:** een bediende klant blijft 5 s met een kroes zitten en vertrekt dan (`customer:left` met reden `served` komt nu van het klantensysteem, niet meer van het serveren). Wachtende klanten (`waitingCustomers`) zijn de enigen met geduld, en de enigen die personeel, gids en klikken zien.
  - **Voorkeur zichtbaar:** de bubbel toont "♥ drankje" als de klant het effect lekker vindt (`liked` wordt bij aankomst bepaald). Na het serveren zweven "+N tip!" en "+N reputation" onder het goud.
  - **Bestellen met voorkeur:** `pickWeighted` in `core/rng.ts`; een gewenst drankje komt twee keer zo vaak. Met gelijke gewichten kiest hij hetzelfde als `pickRandom`, dus bestaande seeds geven dezelfde uitkomst.
  - **Ridder** houdt nu ook van geluk (snelheid en geluk); elf charme, dwerg kracht.
  - **Offline:** `averagePayout` is `averageReward` geworden (goud en reputatie per drankje, met kracht, verwachte fooi en charme, gewogen zoals klanten bestellen).
  - **Tutorial-hint** (`data/tutorial/likes.ts`, les `likes`, direct na de basisles): start bij de eerste ♥-bestelling (nieuw event `likes:ordered`, of meteen als zo'n klant al wacht), wijst die klant aan (gids-alias `guide-liked`, tekstparameter `{liked}`), is klaar zodra een klant zijn favoriete drankje krijgt (`likes:served`) en sluit af met één zin over de vier effecten.
  - 23 nieuwe tests (307 totaal): effecten neutraal en met voorkeur, fooi, gewogen keuze, drinkfase (vertrek, geen geduld, loopt door in een les), bestellingen met voorkeur, serveren per effect, het offline-gemiddelde, de gids en de les in het echte spel.
- **Waarom (keuzes, afgesproken met de eigenaar):** snelheid had zonder drinkfase niets om te verkorten; met de drinkfase zie je het effect en blijft de plek een echte grens. Gematigde getallen als placeholders. De les staat direct na de basis, zodat de speler de ♥ snapt voordat hij gaat winkelen. Effecten als tabel (één regel per effect) houden het open voor nieuwe effecten (SOLID: O).
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels (`customers-layer.ts` is opgesplitst met `customer-reactions.ts`). In de browser met een save na de basisles: Slime Sap gaf +8 goud en "+1 reputation" (reputatie +2), de klant bleef met een kroes zitten en vertrok daarna; de eerste "♥ Glowcap Stout" startte de les met de spotlight op die klant; serveren gaf +12, de afsluitzin bij het goud, en de klant was binnen 2 s weg. Daarna startte de upgrade-les meteen. Geen consolefouten.
- **Afwijkingen van het plan:** geen. De drinkfase is nieuw ten opzichte van stap 11a: een vrijgekomen plek komt nu pas na het drinken plus de wachttijd (`refillDelayMs`) weer vrij. Bij één plek merk je dat nauwelijks, omdat de klantentimer intussen gewoon doorloopt.
- **Nu te proberen:** wis Local Storage en speel de basisles. Wacht op een ridder met "♥ Glowcap Stout": de ketel legt de voorkeur uit. Let op de zwevende "+1 reputation" bij Slime Sap en hoe snel de ridder na zijn Glowcap vertrekt. Fooien zie je pas met een gelukdrankje (Troll's Toll, nog niet ontdekbaar tot stap 12).
- **Nog te doen / volgende stap:** stap 11c, Reputatieniveaus, gates en VIP-klanten. Voor stap 13: de effectgetallen, `drinkMs` en de bestelweging afstellen, en de drinkfase en de plekken meenemen in de offline-berekening. Open punt: er is nog geen drankje met geluk onder de startrecepten, dus fooien verschijnen pas na ontdekking (stap 12).

### Stap 11a: Plekken en geleidelijke klanten (2026-10-06, `step-11a-seats`)
- **Gedaan:** (code in `src/data/upgrades/`, `src/data/customers/spawning.ts`, `src/systems/customers/update.ts`, `src/systems/upgrades/groups.ts`, `src/data/tutorial/seats.ts`, `src/wiring/`; tests in `tests/wiring/seats-flow.test.ts` en aangepaste bestaande tests)
  - **Plekken als stat:** nieuwe stat `seats` (basis 1) en de upgrade **Extra Seat** (kosten 40, groei 1,8, +1 per niveau, max 6). `maxCustomers = min(plekken, tutorialgrens)`; het spel begint dus met één klant tegelijk en elke gekochte plek is één klant extra, tot de 7 plekken van de scene.
  - **Geleidelijke instroom:** eerste klant na 3 s (was 1,5 s), basisinterval 12 s (was 8 s) en een nieuwe `refillDelayMs` van 2,5 s: terwijl de taverne vol is, zakt de timer niet onder die waarde, dus een vrijgekomen plek wordt niet meteen gevuld. Klanten komen zo niet in een stroom achter elkaar.
  - **Tutorial-hint** (`seats_buy`, `seats_done`): start zodra de speler een plek kan betalen (event `seats:affordable`, via dezelfde `watchAffordable`), wijst eerst de Shop-knop en dan de upgrade (gids-alias `guide-seats`), en sluit af (event `seats:bought`). De hulpfuncties voor de gedeelde logica (`inShop`) en de groepen (`generalOnly`, `seatsOnly`, `staffOnly`) zijn herschikt, zodat elke hint zijn eigen groep upgrades heeft en de eerste-upgrade-hint de plekken en het personeel niet meer meetelt.
  - Bestaande tests aangepast voor de nieuwe tijden en de ene plek (`withSeats()` in de testhulp); nieuwe tests voor plekken (start op één, elke plek één klant extra, grens van de scene), geleidelijke komst (eerste klant, wachttijd na vertrek, nooit meer dan de plekken) en de hint. 284 tests.
- **Waarom (keuzes):** eigenaar wil rustig beginnen; de wachttijd als ondergrens op de timer (in plaats van de timer te verlengen) laat een snelle speler niet langer wachten dan nodig en een trage speler niet sneller bedienen. De volgorde van de lessen (basis, upgrade, plekken, personeel) volgt de prijzen (20, 40, 100 goud).
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels. In de browser: de hint start bij genoeg goud en wijst de Shop-knop aan, de winkel toont Extra Seat onder Tavern, kopen (goud 100 naar 60) maakt een tweede klant mogelijk en de hint sluit af. Eerder meldde de ingebouwde browser fouten die van tussenversies kwamen (zie de opmerking bij stap 9: een `touch` op de gewijzigde bestanden herstelt dat).
- **Afwijkingen van het plan:** stap 11 is gesplitst in 11a, 11b en 11c (afgesproken met de eigenaar). De lessen lopen nog steeds één voor één: een les die zichtbaar blijft (de speler negeert hem) houdt de volgende hint tegen tot hij klaar is of de speler de tutorial overslaat. Dat blijft werken omdat een toestand die al geldt de volgende les meteen start, maar een zichtbare les die de speler negeert, kan de volgende uitstellen. Als dat in de praktijk irriteert, laat de machine lessen onafhankelijk starten.
- **Nu te proberen:** wis Local Storage en begin een nieuw spel: de eerste klant komt na een paar seconden en er is steeds één klant. Haal 40 goud en koop Extra Seat; daarna kunnen er twee klanten zitten. Het offline-aandeel is nog niet gekoppeld aan het aantal plekken.
- **Nog te doen / volgende stap:** stap 11b, Voorkeuren en drankeffecten (de effecten kracht, snelheid, geluk en charme; voorkeur verdubbelt het effect). Daarna 11c (reputatieniveaus en VIP) en stap 12 met het receptenboek.

### Stap 10b: Offline-voortgang (2026-10-06, `step-10b-offline`)
- **Gedaan:** (code in `src/systems/offline/`, `src/data/offline.ts`, `src/wiring/create-offline.ts`, `src/ui/welcome/`, aanpassingen in `main.ts` en `systems/customers/spawn-timing.ts`; tests in `tests/systems/offline/`, `tests/ui/welcome-view-model.test.ts` en `tests/wiring/offline-flow.test.ts`)
  - **Formule, geen simulatie** (`compute.ts`): drankjes per seconde = het langzaamste van het brouwtempo, het serveertempo en de klantstroom; daarvan telt `OFFLINE.efficiency` (50%, placeholder) en alleen tot de offline-limiet. Aantal bediend = afgerond naar beneden (geen toeval, dus testbaar). Goud = aantal × de gemiddelde uitbetaling (`earnings.ts`: elk bekend recept tegen elk klanttype dat op deze reputatie komt, met de verkoopprijsfactor); reputatie loopt mee. Zonder een volledige bezetting (brouwer en serveerster) verdient niemand iets.
  - **Klantstroom als grens:** `meanSpawnIntervalMs(reputation)` is uit `spawn-timing.ts` gehaald (zonder jitter), zodat de offline-berekening automatisch meegaat als de klantstroom later wordt aangepast (geleidelijke instroom, plekken).
  - **Limiet uitbreidbaar:** nieuwe stat `offlineHours` in `UPGRADE_STATS` (basis 2 uur uit `data/offline.ts`). Er is nog geen upgrade voor; prestige of een upgrade kan hem later verhogen zonder code te wijzigen.
  - **Twee ingangen, één functie** (`handleAway(awayMs)`): bij het laden de tijd sinds `meta.lastSeenAt` (alleen als er een save geladen is), en tijdens het spelen elk gat dat de ticker meldt (tab afgeknepen, computer in slaap). De uitkomst wordt direct uitbetaald, `lastSeenAt` gaat naar nu en er komt een save. Dat laatste voorkomt dat dezelfde tijd bij de volgende start nog eens meetelt.
  - **Welkom-terug-venster** (`ui/welcome/`): alleen bij een afwezigheid vanaf een minuut (`OFFLINE.minWelcomeMs`); kortere gaten tellen stil mee. Het toont de tijd weg, bediende klanten en verdiend goud, een regel als de limiet bereikt is, en bij een lege bezetting de uitleg dat de speler een brouwer en een serveerster moet inhuren. De pure opmaak (`welcome-view-model.ts`) is getest. Reports gaan via een inbox (`inbox.ts`), omdat het rapport er al kan zijn voordat de UI is aangemaakt.
  - **Tutorial-hint:** de afsluitende zin van de personeelshint noemt nu dat het personeel ook doorwerkt als de speler het tabblad sluit; het welkom-terug-venster legt zonder personeel uit wat te doen.
  - 23 nieuwe tests (275 totaal): gemiddelde uitbetaling (reputatiegrenzen, vermenigvuldiger, niets te bestellen), de formule (langzaamste schakel, klantstroom, beide medewerkers nodig, limiet en hogere limiet, negatieve tijd, enorme getallen), uitbetalen en de inbox, het venster, en in het echte spel (uitbetalen met rapport, niets zonder personeel, 2-uurs limiet, stille korte gaten, geen dubbele telling).
- **Waarom (keuzes, afgesproken met de eigenaar):** de offline-opbrengst is een deel van wat het personeel in die tijd verdient (50%, nog af te stellen in stap 13), en een rewarded ad die de opbrengst later verdubbelt hoort bij stap 20. Omdat de opbrengst meteen wordt uitgekeerd (geen "ophalen"-stap), kan een ad later gewoon hetzelfde bedrag nogmaals bijschrijven zonder dat er iets verloren gaat als de speler het venster wegklikt.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels. In de browser met een save van 1 uur geleden en beide medewerkers ingehuurd: het venster toonde "away for 1h", 90 klanten en 900 goud (goud 50 naar 950, reputatie 90), sluiten werkt en de opgeslagen `lastSeenAt` stond op nu, dus een herlaad telt dezelfde tijd niet nog eens.
- **Afwijkingen van het plan:** er is geen dubbele-beloning-knop (de SDK komt in stap 20); het venster heeft alleen "Great!". Het spel pauzeert niet terwijl het venster open staat (klanten kunnen intussen geduld verliezen); pauzeren hoort bij de platformlaag (stap 20). Het deel van de klanten en de bar dat tijdens een gat bestond, wordt niet nagebootst: de taverne blijft zoals ze was.
- **Nu te proberen:** huur beide medewerkers in, sluit het tabblad en open het een paar minuten later: het venster laat zien wat ze verdienden. Zonder personeel zie je de uitleg. Wil je een lange afwezigheid testen, zet dan in Local Storage `bt_save` de velden `savedAt` en `state.meta.lastSeenAt` op een tijdstip uren geleden (sluit eerst andere tabs).
- **Nog te doen / volgende stap:** stap 11, Reputatie, gates en drankeffecten (en eventueel de geleidelijke klanteninstroom en de plekken-upgrade uit hoofdstuk 4). Open punt voor de eigenaar: het offline-aandeel (50%) en de limiet van 2 uur zijn placeholders, in stap 13 te tunen met de simulator.

### Stap 10a: Personeel (2026-10-06, `step-10a-staff`)
- **Gedaan:** (code in `src/systems/staff/`, `src/data/upgrades/staff.ts`, `src/data/tutorial/staff.ts`, `src/wiring/start-staff.ts`, `src/wiring/watch-shop.ts`, `src/systems/serving/publish.ts`; tests in `tests/systems/staff/` en `tests/wiring/staff-flow.test.ts`)
  - **Twee medewerkers als upgrades van soort `staff`:** **Brouwer-assistent** (kosten 100, groei 1,5, max 10) en **Serveerster** (kosten 150, groei 1,5, max 10). Niveau 1 is het inhuren, elk volgend niveau is training. Hergebruikt de hele upgrade-machinerie (kosten, x1/x10/max, opslaan). Twee nieuwe stats in `UPGRADE_STATS`: `autoBrew` en `autoServe`, in acties per seconde (basis 0, +0,05 en +0,08 per niveau). `getMultipliers` loopt nu over de lijst van stats, dus een nieuwe stat is data plus één regel.
  - **Brouwer-assistent** (`auto-brew.ts`): start het drankje van de oudste wachtende klant dat nog niet op de bar staat, alleen met een vrije ketel, ruimte op de bar en een lege ketel (nooit tijdens handmatig brouwen van de speler). Brouwt nooit een drankje waar niemand om vraagt.
  - **Serveerster** (`auto-serve.ts`): serveert de oudste klant wiens drankje klaarstaat, via dezelfde regels als een klik: `serveAndPublish` is uit `player-actions.ts` gehaald (één plek voor serveren, gedeeld door speler en serveerster).
  - **Tempo** (`charge.ts`, `system.ts`): elke medewerker bouwt lading op met de tijd; een actie kost een volle lading en de lading is begrensd op één actie, zodat een medewerker zonder werk geen stoot opspaart. Het personeel loopt op de bus-`tick`; de snelheden komen uit `getMultipliers` (`wiring/start-staff.ts`) en een net ingehuurde medewerker begint direct.
  - **Winkel:** de lijst heeft nu kopjes per soort (Cauldron, Tavern, Staff, via `shop.kind_*`).
  - **Tutorial-hint** (`data/tutorial/staff.ts`, 2 stappen): start zodra de speler zijn eerste medewerker kan betalen (nieuw event `staff:affordable`, via dezelfde `watchAffordable` met een eigen eventnaam), wijst de Shop-knop aan als de winkel dicht is en daarna de inhuur-knop (nieuw gids-alias `guide-staff`, de tutorial weet of de winkel open is via `shop:opened` en `shop:closed`), en sluit af. Nieuw event `staff:hired` bij het kopen van een staff-upgrade. De hint voor de eerste winkelupgrade telt staff niet meer mee (`staffOnly` en `withoutStaff`).
  - **Zichtbaarheid:** personeel handelt zonder animatie of sprites; je ziet alleen dat drankjes ontstaan en klanten bediend worden. Sprites en animaties van personeel horen bij stap 21.
  - 17 nieuwe tests (252 totaal): lading, brouwer (wensen, bezette ketel, volle bar, half gevulde ketel), serveerster, personeel aan het werk (niets zonder medewerkers, verdient zelf, trager bij lager tempo) en in het echte spel (verdient zonder spelerhandeling, sneller na training, de hint start op het juiste moment en wijst eerst de knop en dan de inhuur-knop aan).
- **Waarom (keuzes, afgesproken met de eigenaar):** stap 10 is gesplitst in 10a (personeel) en 10b (offline); brouwer en serveerster nu, de barman later; inhuren met niveaus op een vaste tik. Staff als upgrades hergebruikt kosten, winkel en opslag zonder nieuw datamodel (SOLID: O).
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels. In de browser: de hint start bij 100 goud en wijst de Shop-knop aan, de winkel toont de drie kopjes en de twee medewerkers, beide inhuren werkt; daarna steeg het goud van 158 naar 170 en de reputatie van 1 naar 2 in 30 seconden zonder één klik.
- **Afwijkingen van het plan:** het plan noemde ook de barman; die is bewust uitgesteld. Het idle-aandeel (30 tot 40% van actief spelen) is nog niet gemeten; de getallen zijn een schatting op basis van de klantstroom en worden in stap 13 met de simulator afgesteld. De klantenstroom (zie hoofdstuk 4, Klanteninstroom en plekken) bepaalt hoeveel het personeel kan verdienen.
- **Nu te proberen:** wis Local Storage, speel de lessen uit en haal 100 goud. De ketel wijst de Shop aan; huur de brouwer-assistent en de serveerster in en laat het tabblad open: klanten worden vanzelf bediend. Train ze met extra niveaus en kijk of het sneller gaat.
- **Nog te doen / volgende stap:** stap 10b, Offline-voortgang: `systems/offline` rekent met formules uit wat het personeel verdiende terwijl het spel dicht was (limiet 2 uur, uitbreidbaar) en toont een "welkom terug"-venster. Open punten voor de eigenaar: hoe de offline-opbrengst wordt berekend (aandeel van de actieve snelheid, afhankelijk van het personeel), en of een rewarded ad later de opbrengst verdubbelt (stap 20).

### Stap 9: Economie en upgrades (2026-10-06, `step-09-economy-upgrades`)
- **Gedaan:** (code in `src/systems/economy|upgrades/`, `src/data/upgrades/`, `src/ui/shop/`, `src/ui/side-layout.ts`, `src/wiring/sync-station.ts`; tests in `tests/systems/upgrades|economy/`, `tests/ui/` en `tests/wiring/upgrade-flow.test.ts`)
  - **Kosten en kopen** (puur TS): `levelCost` (`round(basis × groei^n)`), `packCost` (de som van k niveaus in één formule), `affordableCount` (max zonder lus, daarna exact bijgesteld), `quote` (x1, x10, max; alles-of-niets voor een vast aantal, max koopt wat kan of toont het volgende niveau), `buyUpgrade` (haalt goud af en verhoogt het niveau; verandert niets en meldt niets als het niet kan).
  - **`getMultipliers(state)`** (`systems/economy`): brewSpeed, sellPrice en storage als `Num`; 'add' telt vóór 'multiply'; onbekende ids en niveaus boven het maximum tellen niet mee. Hier komen later prestige, achievements en events bij.
  - **State en data:** `state.upgrades` (open map id → niveau; oude saves krijgen `{}` via `reconcile`, geen migratie nodig). Drie upgrades als placeholders: **Swift Cauldron** (+10% brouwsnelheid per niveau, kosten 20, groei 1,15, max 15), **Better Prices** (+15% verkoopprijs per niveau, kosten 30, groei 1,25) en **Bigger Bar** (+1 plek voor klare drankjes per niveau, kosten 60, groei 2, max 2). Teksten in `i18n/en/upgrades.ts` en `shop.ts`; de beschrijving vult het effect per niveau in uit de data.
  - **Effecten in het spel:** `BrewStation.speed` (brouwtijd gedeeld door de factor) en `capacity` worden na elke state-wijziging bijgewerkt (`wiring/sync-station.ts`); een lopend brouwsel houdt zijn snelheid. `computePayout` en `serveCustomer` kregen de verkoopprijsfactor. De bar in de scene heeft nu 5 plekken (het maximum) met om-en-om gestaggerde labels.
  - **Acties en events:** `PlayerActions.buyUpgrade(id, amount)` en `openShop()`; nieuwe bus-events `upgrade:bought`, `shop:opened` en `upgrade:affordable` (de laatste door `watchAffordable`, bij elke overgang van "kan niets kopen" naar "kan iets kopen"). Een aankoop vraagt om een save.
  - **Winkel** (`ui/shop/`): een Shop-knop rechtsboven in het spel en een paneel met x1/x10/Max, per upgrade naam, niveau, effect en koopknop met prijs (uitgegrijsd als het niet kan, "Maxed" aan het eind). Het paneel staat **rechts van het spel, in hetzelfde kader** (380 ontwerp-pixels breed): spel en paneel passen samen in het venster, het spel wordt dus kleiner zodra de winkel open gaat en je kunt blijven serveren. Het paneel is even hoog als het spel en loopt niet door de lege balken van een venster dat niet 16:9 is. De pure rij-opmaak (`shop-view-model.ts`) is getest.
  - **Tutorial-hint** (`data/tutorial/upgrade.ts`, 3 stappen): start zodra de speler zijn eerste upgrade kan betalen, wijst de Shop-knop aan, dan de koopknop van de upgrade die hij kan betalen (nieuw gids-alias `guide-upgrade`), en sluit af met een zin bij het goud. Een speler die bij laden al genoeg goud heeft, krijgt hem meteen (`alreadyHolds`).
  - **Een echte bug voorkomen:** `isActive()` blijft waar zolang er stappen open staan; de nieuwe les wacht lang op haar moment en zou de klanten op één en het geduld bevroren hebben. De bedrading beperkt nu alleen als een stap zichtbaar is (`visibleStep() !== null`).
  - Validator: een upgrade moet een positief effect per niveau hebben. 39 nieuwe tests (235 totaal): kosten en offertes (ook met 1e200 goud), kopen, wachten op betaalbaarheid, multipliers, brouwsnelheid en verkoopprijs, acties, de winkelrij, zijlayout, validatie en een volledige upgrade-les in het echte spel.
- **Waarom (keuzes):**
  - **Geometrische som voor packs:** de prijs van x10 en max is exact wat er afgaat en kost geen lus, ook bij enorme getallen.
  - **`getMultipliers` met `Num`:** past bij "Decimal overal in de economie"; de verkoopprijs kan later door prestige groot worden.
  - **De Shop-knop is altijd zichtbaar** (pijler 3: altijd iets te kopen). De tutorial wijst hem pas aan als het zover is.
  - **Ingrediënten blijven gratis.** Ze staan niet in de stapbeschrijving, en met 0 goud bij de start zou betalen de basisles blokkeren. Een keuze voor later (zie "Nog te doen").
  - **Winkel naast het spel, als één kader** (op verzoek van de eigenaar, in twee rondes): eerst een kolom over het venster, daarna binnen het spelkader zodat hij niet door de balken loopt. Phaser leest de grootte van zijn container alleen bij een venster-resize; `main.ts` roept daarom `getParentBounds()` en `refresh()` aan.
  - **Alle getallen zijn placeholders** (balans volgt in stap 13).
- **Wensen van de eigenaar tijdens de stap (vastgelegd, niet gebouwd):** klanten moeten **geleidelijk** komen, niet snel in het begin, en er hoort een upgrade om **plekken in de bar** te kopen (misschien later), met **1 klant tegelijk** als start. Dit staat nu in hoofdstuk 4 (Klanteninstroom en plekken), stap 11 en GAME_ANALYSE.md. De opzet van deze stap (stats via `getMultipliers`) maakt het later alleen data plus een kleine wijziging in de bedrading.
- **Gemeten / gecontroleerd:** `npm run check` slaagt, geen bestand boven 100 regels. In de browser: de hint start zodra goud 20 haalt (spotlight op de Shop-knop, dan op de koopknop, dan de afsluiting); kopen: goud 31 naar 11, niveau 1, volgende prijs 23; Max kocht 16 niveaus voor 4,14K (5000 naar 857, klopt met `packCost`); met Bigger Bar op 2 staan er 5 drankjes op de bar; met de winkel open verkleint het spel, ingrediënten en klanten blijven klikbaar en een klant serveren gaf goud 100 naar 108; sluiten herstelt de volle breedte. **Let op bij testen:** de dev-server van een andere sessie draaide in dezelfde map en bleef een tussenversie van `main.ts` serveren (Vite cachet `?t=`-URL's onbeperkt); een `touch` op de gewijzigde bestanden loste dat op. Console-fouten met oude `?t=`-tijdstempels zijn zulke restanten.
- **Afwijkingen van het plan:** de plekken-upgrade en geleidelijke instroom zijn bewust niet gebouwd. Het winkelpaneel is een zijkolom in plaats van een pop-up (besluit van de eigenaar). Styling blijft placeholder (stap 21): de tutorial-pijl kan op een knop in het paneel liggen en de lege balken van een niet-16:9-venster zijn gewoon leeg. De indeling van de winkel op het scherm moet later nog nagekeken worden (IDEAS.md, punt 3).
- **Nu te proberen:** `npm run dev`, wis Local Storage en speel de basisles uit. Zodra je 20 goud hebt, wijst de ketel de Shop-knop aan. Koop Swift Cauldron en kijk of het brouwen sneller gaat, probeer x10 en Max, en serveer terwijl de winkel open staat. Maak het venster smaller en hoger: spel en winkel schalen samen.
- **Nog te doen / volgende stap:** stap 10, Personeel en idle/offline. Open punten voor de eigenaar: (1) wanneer ingrediëntenkosten komen (nu gratis); (2) wanneer de geleidelijke instroom en de plekken-upgrade gebouwd worden (stap 11 of eerder); (3) de huidige spawn-getallen zijn te snel voor het begin.

### Stap 8: Interactieve tutorial (basis) (2026-10-06, `step-08-tutorial`)
- **Gedaan:** (code in `src/systems/tutorial/`, `src/data/tutorial/`, `src/ui/tutorial/`, `src/core/target-registry.ts`, `src/wiring/create-tutorial.ts`, `src/runtime/debug-commands.ts`; tests in `tests/systems/tutorial/`, `tests/wiring/` en meer)
  - **Statemachine** (`machine.ts`, `progress.ts`): stappen starten en eindigen op echte spel-events (`customer:arrived`, `ingredient:clicked`, `brew:started`, `brew:done`, `customer:served`) of na een tijd (`after`). De speler klikt nooit op "volgende". Een actie van een latere stap vinkt ook alle eerdere af. Overslaan en opnieuw afspelen zijn altijd mogelijk. Voortgang staat in `state.tutorial` (`completedSteps`, `skipped`) en elke wijziging vraagt om een save.
  - **Gids** (`guide.ts`, `resolve-target.ts`): wijst het ingrediënt aan dat nog mist voor het drankje van de oudste wachtende klant (of past bij wat al in de ketel zit), en later de klant wiens drankje klaar staat. Daardoor kan niets vastlopen na een mislukte combinatie of als een klant een ander drankje wil. De tekst gebruikt `{drink}` en `{ingredient}`.
  - **Data** (`data/tutorial/`): de basisles in 5 stappen (`basics_add`, `basics_finish`, `basics_wait`, `basics_serve`, `basics_gold`) met grappige teksten van een chagrijnige pratende ketel in `i18n/en/tutorial.ts`; de validator controleert doelen, timers, vertaalsleutels en dat een les uit aaneengesloten stappen bestaat.
  - **Doelenregister:** plank (`ingredient:<id>`), ketel, klanten (`customer:<id>`, volgt het lopen) en de goud-HUD (`hud-gold`) melden zich aan.
  - **UI** (`ui/tutorial/`): gedimde overlay met spotlight, pulserende pijl, spraakbel met een mascotte (CSS-placeholder) en een **Skip-knop**. De overlay laat alle klikken door; het spel blijft gewoon bedienbaar.
  - **Tijdens de les:** maximaal één klant in de taverne en bevroren geduld (`CustomerContext.maxCustomers` en `freezePatience`). Daarna normaal.
  - **Opnieuw afspelen:** in een dev-build via `bt.replayTutorial()` in de console (de Settings-knop komt in stap 18).
  - Stylesheets (`.css`) tellen niet meer mee voor de regelgrens (`check-lines.mjs`, hoofdstuk 1 en `CLAUDE.md` aangepast).
  - 40 nieuwe tests (196 totaal): machine (volgen, vooruitlopen, timers, overslaan, herstarten, hervatten), gids en doelen, doelenregister, plaatsing van pijl en spotlight, validator, en een hele les in het echte spel (één klant, bevroren geduld, afronden, mislukken, overslaan, herladen, opnieuw afspelen met een zittende klant).
- **Waarom (keuzes):**
  - **Gids op spelsituatie in plaats van vaste ingrediënten:** een vaste "klik slijm, dan honing" loopt vast zodra een klant glowcap wil of de combinatie mislukt.
  - **Één klant en bevroren geduld tijdens de les** (op verzoek van de eigenaar): de speler wordt niet overspoeld en de klant vertrekt niet midden in de uitleg.
  - **Hervatten na herladen:** de ketel en de bar worden niet opgeslagen, dus een les die op zo'n stap stond (`needsLiveState`) begint opnieuw bij zijn eerste stap. Overige stappen hervatten gewoon.
  - **`alreadyHolds`:** een startvoorwaarde die al geldt (klant zit al) telt als gestart. Zonder dit bleef de tutorial na opnieuw afspelen verborgen en kwam er door de limiet van één klant geen nieuwe klant meer.
  - Doelen en overlay werken in ontwerp-pixels, zoals de rest van de UI; de overlay schaalt mee met het canvas.
- **Gemeten / gecontroleerd:** `npm run check` en `npm run build` slagen, geen bestand boven 100 regels. Bundel 374 kB gzip JS. In de browser (schone tab, geen console-fouten): spotlight en pijl op het juiste ingrediënt voor het bestelde drankje, tekst volgt de situatie (Glowcap Stout), de ketel krijgt de pijl tijdens het brouwen, daarna de klant, dan de goud-HUD; de les sluit na ruim 4 seconden; het geduld van de enige klant bleef meer dan 70 s vol; Skip verbergt alles en wordt opgeslagen; opnieuw afspelen met een zittende klant start meteen.
- **Een echte bug gevonden en opgelost tijdens het testen in de browser:** opnieuw afspelen met een klant die al zat liet de tutorial verborgen en blokkeerde nieuwe klanten (zie `alreadyHolds`).
- **Afwijkingen van het plan:** de mascotte is een CSS-tekening (geen aparte asset). Het opnieuw afspelen is alleen een dev-commando tot stap 18. De overlay heeft nog geen touch-aanpassingen (komt bij de mobiele pass).
- **Nu te proberen:** wis Local Storage (of `localStorage.clear()` in de console) en herlaad `npm run dev`: een nieuwe speler krijgt de les. Klik dwars door de les heen, kies een verkeerd ingrediënt, druk op **Skip tutorial**, en probeer `bt.replayTutorial()` in de console.
- **Nog te doen / volgende stap:** stap 9, Economie en upgrades: kostenformule, `getMultipliers`, een winkelpaneel (DOM) met koop x1/x10/max, de eerste upgrades (ketelsnelheid, prijs, opslag) en een tutorial-hint voor de eerste upgrade (als nieuwe les in `data/tutorial/`). Hier komt ook de plek waar meerdere drankjes tegelijk en ingrediëntenkosten bij horen.

### Stap 7: Brouwen en serveren (2026-10-06, `step-07-brew-and-serve`)
- **Gedaan:** (code in `src/systems/brewing|serving|actions/`, `src/scene/brewing|effects/`, `src/wiring/`, `src/data/`; tests in `tests/systems/` en `tests/data/`)
  - **De speelloop:** klik een ingrediënt van de plank; het gaat in de ketel (bolletjes boven de ketel). Past de combinatie precies op een **bekend** recept, dan start het brouwen meteen (brouwbalk). Een combinatie die nooit een bekend recept kan worden (fout paar, dubbel ingrediënt, ingrediënt zonder recept) **mislukt** direct: de ketel leegt en er verschijnt een grappige zin. Klik op de ketel om de inhoud weg te gooien (niet tijdens brouwen). Een klaar drankje komt op de bar (3 plekken). Klik op een wachtende klant: staat zijn drankje klaar, dan krijgt hij het en betaalt `basisprijs × spendMultiplier` (hele munten, minimaal 1) en geeft +1 reputatie. Verkeerd drankje of niets klaar: de klant weigert met een zin en schudt, en er verandert niets.
  - **Systemen** (puur TS): `brewing/` (`match.ts`, `add-ingredient.ts`, `advance.ts`, `shelf.ts`, `station.ts`, `system.ts`), `serving/` (`serve.ts`, `payout.ts`), `actions/player-actions.ts` (`clickIngredient`, `clickCauldron`, `clickCustomer`: de enige weg waarlangs de scene het spel verandert) en `feedback.ts` (kiest een zin uit een pool met de rng).
  - **Plank:** toont de winkelingrediënten tot de hoogste tier van de bekende recepten (nu dus de 3 van tier 1). Hogere tiers verschijnen zodra recepten bekend worden (stap 12).
  - **Nieuwe bus-events:** `ingredient:clicked`, `brew:started`, `brew:done`, `brew:notice`, `customer:served`, `customer:refused` (de eerste vier zijn ook de haken voor de tutorial van stap 8).
  - **Data:** `data/brewing.ts` (`BREWING`: max 3 ingrediënten, 3 plekken op de bar; `SERVING`: reputatie per bediening), `data/feedback.ts` (zinnenpools: served 4, wrong 4, nothing 4, fizzle 3, full 2, busy 2) en 19 zinnen in `i18n/en/feedback.ts` met `{drink}` (absurde toon).
  - **Validator:** nieuwe tabel `feedback` (alle zinnen van elke pool moeten bestaan; tekstvelden per item) en een regel dat **geen recept een deel van een groter recept is** (anders start brouwen te vroeg).
  - **Scene:** `brewing/shelf-view.ts`, `cauldron-view.ts`, `ready-view.ts`, `ingredient-look.ts`, `effects/floating-text.ts` (pool) en `feedback-layer.ts`, klikbare klanten in `customers/`, en `sprites/shelf.ts`. De losse mokken op de bar zijn vervangen door de drankjes van de ready view.
  - **Bedrading:** `wiring/create-services.ts` bouwt floor, station, systemen en acties; `main.ts` blijft kort. `SceneServices` heeft nu ook `station`, `actions` en `getShelf`.
  - 38 nieuwe tests (156 totaal): matchen, brouwregels (inclusief bezig, vol, mislukken), timer en bus, ketel legen, plank, uitbetaling, serveren (goed, fout, niets klaar, verdwenen klant), een volledige ronde via de bus, de validator en de layout van plank en bar.
- **Waarom (keuzes):**
  - **Auto-start bij een volledig recept** en **meteen mislukken** zodra een combinatie niets meer kan worden: weinig klikken en direct feedback ("5 seconden tot plezier"). De validatieregel over deelrecepten maakt dit veilig.
  - **Klik op de klant = serveren** (het systeem zoekt zelf het juiste drankje op de bar): minste klikken en idle-vriendelijk. Een fout drankje wordt geweigerd in plaats van met korting geaccepteerd; dat is duidelijker.
  - Ingrediënten zijn nu **gratis** en onbeperkt; de economie komt in stap 9. Mislukken kost dus niets behalve tijd.
  - Ketel, inhoud en bar zijn runtime en worden niet opgeslagen (net als de klanten): bij laden begint de ketel leeg. Eenvoudig, en je verliest hooguit een paar drankjes.
  - De systemen kiezen de zinnen (`messageKey` in het event) en de scene vertaalt ze; zo zijn ze testbaar met een vaste rng en blijft de tekst in i18n.
  - `shelfIngredients` toont alleen nuttige ingrediënten, zodat een nieuwe speler niet op `Fire Pepper` klikt en alleen mislukkingen ziet.
- **Gemeten / gecontroleerd:** `npm run check` en `npm run build` slagen, geen bestand boven 100 regels. Bundel 372 kB gzip JS. In de browser (schone tab, geen console-fouten): slijm + honing starten Slime Sap, de brouwbalk loopt, het drankje staat met naam op de bar, klik op de klant geeft goud 8 en reputatie 1 met "+8" en een absurde zin; fout drankje geeft "That is not Glowcap Stout. That is a cry for help." en laat alles staan; slijm + glowcap mislukt met een zin; een derde klik tijdens het brouwen geeft "One brew at a time. The cauldron is shy."
- **Een echte bug door de tests gevonden en opgelost:** een dubbel ingrediënt (slijm + slijm) werd als `slime_sap` herkend. `matchRecipe` weigert nu dubbele ingrediënten.
- **Afwijkingen van het plan:** geen. Een tutorial-hint ontbreekt bewust: de uitleg is stap 8 (zoals in het plan). De bubbel van klanten bij tafel 2 hangt deels over de ketel; dat is een placeholder-layoutkwestie voor stap 14 en 21.
- **Nu te proberen:** `npm run dev`, open http://localhost:5173. Klik op **Swamp Slime** en **Wild Honey** (Slime Sap) of **Glowcap Mushroom** en **Wild Honey** (Glowcap Stout), wacht een paar seconden, en klik dan op de klant die dat drankje bestelde. Probeer ook een verkeerde combinatie, een verkeerd drankje en klikken terwijl de ketel bezig is. **Mijlpaal: is dit leuk?** Let op: gaat het te traag of te snel, en is het duidelijk wat je moet doen zonder uitleg?
- **Nog te doen / volgende stap:** stap 8, Interactieve tutorial: statemachine in `systems/tutorial`, doelenregister voor DOM en Phaser, spotlight/pijl/spraakbel, en de eerste tutorial (ingrediënt klikken, ketel, wachten, serveren, eerste goud). De bus-events `ingredient:clicked`, `brew:done` en `customer:served` zijn daarvoor al klaar.

### Stap 6: Klanten (2026-10-06, `step-06-customers`)
- **Gedaan:** (code in `src/systems/customers/`, `src/scene/customers/`, `src/core/`, `src/data/`; tests in `tests/systems/customers/` en `tests/core/`)
  - **Systeem** (puur TS): `floor.ts` (`createFloor`, `findCustomer`, `freeSeats`, `dismiss`), `spawn-timing.ts`, `spawn.ts` (`trySpawn`), `patience.ts`, `update.ts` (`updateCustomers`, één stap) en `system.ts` (`startCustomerSystem` luistert op de `tick`-event en publiceert `customer:arrived` en `customer:left`; `publishChange` is er ook voor stap 7).
  - **Spelregels:** de eerste klant komt na 1,5 s. Daarna is het interval 8 s min 2% van de basis per reputatiepunt, nooit onder 3 s, met 30% spreiding. Een klant kiest willekeurig een vrije plek, een klanttype waarvan `minReputation` gehaald is en een recept dat de speler kent. Geduld loopt af; bij nul vertrekt de klant (`impatient`). Is de taverne vol, dan wordt een vrijgekomen plek bij de volgende stap direct opnieuw gevuld.
  - **Kern:** `core/rng.ts` (`Rng`, `createSeededRng`, `pickRandom`), `core/pool.ts` (generieke objectpool), twee nieuwe bus-events (`customer:arrived` en `customer:left` met `LeaveReason`).
  - **Data/state:** `data/customers/spawning.ts` (alle spawn-getallen), `data/recipes/starters.ts` (`slime_sap` en `glowcap_stout`) en nieuw veld `recipesDiscovered` in `GameState` (oude saves krijgen de standaardwaarde via `reconcile`).
  - **Scene:** `scene/services.ts` (`SceneServices`: bus en floor, ingespoten via `createGame`), `scene/customers/customers-layer.ts` (events naar sprites, pool, lopen met tweens), `customer-sprite.ts` (lijf, hoofd, bubbel met drankje via `t()`, geduldbalk), `customer-look.ts` (kleur per type). `main.ts` bedraadt alles.
  - 27 nieuwe tests (118 totaal): eerste klant na de vertraging, alleen ontdekte recepten, reputatie-gates op klanttypes, plekken uniek en capaciteit, hervullen, spawn-interval, geduld en vertrek, `dismiss`, bus-koppeling (inclusief verse context per stap en stoppen) en rng/pool.
- **Waarom (keuzes):**
  - Het systeem kent geen posities, alleen stoelnummers (`seat`); de scene koppelt die aan `CUSTOMER_SLOTS`. Zo blijft `systems/` vrij van scene-code en kan stap 14 plekken toevoegen zonder het systeem te wijzigen.
  - Willekeur en recepten/klanttypes worden ingespoten (SOLID: D), dus tests en de simulator van stap 13 zijn deterministisch.
  - Bus-events dragen alleen een id (de scene zoekt de klant op in de floor), zodat `core/` geen typen uit `systems/` hoeft te importeren.
  - De klanten in de taverne worden niet opgeslagen: een nieuwe sessie begint met een lege taverne. Dat is eenvoudig en voorkomt vreemde situaties na een offline gat.
  - Bestellingen kiezen uniform uit de ontdekte recepten; voorkeuren per klanttype komen in stap 11.
  - Bubbels van naastgelegen plekken (60 px uit elkaar) staan op twee hoogtes zodat ze niet over elkaar liggen.
- **Gemeten / gecontroleerd:** `npm run check` en `npm run build` slagen, geen bestand boven 100 regels. Bundel 369 kB gzip JS. In de browser: geen console-fouten; de eerste klant verschijnt na ongeveer 1,5 s, loopt van de deur naar een plek met bubbel en geduldbalk, de taverne vult zich tot 7 klanten en klanten die uitgeput zijn lopen terug naar de deur waarna de plek opnieuw gevuld wordt. Een oude save zonder `recipesDiscovered` laadt gewoon.
- **Afwijkingen van het plan:** geen. Een tutorial-hint hoort hier nog niet bij: er is nog niets voor de speler te doen (dat begint in stap 7).
- **Let op voor stap 7 en 13:** er is nog geen manier om klanten te bedienen, dus de taverne loopt vol en klanten vertrekken na het geduld. Het aantal plekken, het geduld (60 s voor de ridder) en het spawn-tempo zijn placeholders; echte balans volgt in stap 13.
- **Nu te proberen:** `npm run dev`, open http://localhost:5173 en kijk: na een seconde komt de eerste klant binnen. Verhoog `reputation` in Local Storage `bt_save` naar 10 of 25 (sluit andere tabs eerst) om de Elf with Opinions (groen) en de Thirsty Dwarf (bruin) naast de grijze ridder te zien.
- **Nog te doen / volgende stap:** stap 7, Brouwen en serveren: klik op ingrediënten, ketel, brouwbalk, serveren aan een klant via `dismiss(..., 'served')` en `publishChange`, goud en reputatie, zwevende "+goud" en absurde klantreacties. Mijlpaal: is dit leuk?

### Chore: pixel-art-experiment (2026-10-06, `chore-pixel-art-experiment`)
- **Gedaan:** `scripts/pixel/` met een PNG-encoder op alleen Node-bordmiddelen (`png.mjs`), een canvas met opschalen zonder vervaging (`canvas.mjs`), sprites als tekstrasters met palet (`sprite.mjs`, `sprites/cauldron.mjs`, `sprites/knight.mjs`), een achtergrond (`backdrop.mjs`) en `preview.mjs`. `npm run pixel:preview` schrijft naar `art/pixel/`: de taverne op 320×180 (4× opgeschaald) en de twee sprites op 12×.
- **Waarom:** de eigenaar wilde zien hoe pixel art eruit zou zien voordat de stijl wordt vastgelegd. Geen nieuwe dependencies; het spel zelf is niet aangepast.
- **Besluit:** de eigenaar vond het resultaat goed. De eindstijl wordt pixel art, maar de omschakeling is een volledige styling-stap aan het eind (stap 21, nu inclusief animaties). Tot dan blijven placeholders en 1280×720 gelden; zie hoofdstuk 4 (Rendering en Assets) en stap 21.
- **Afwijkingen van het plan:** SVG-sprites uit het oorspronkelijke plan zijn vervangen door pixel art.
- **Nu te proberen:** `npm run pixel:preview` en open `art/pixel/tavern-preview-4x.png`.
- **Nog te doen / volgende stap:** stap 6, Klanten.

### Stap 5: Taverne-scene (placeholder) (2026-10-06, `step-05-tavern-scene`)
- **Gedaan:** (code in `src/scene/` en `src/ui/`, tests in `tests/scene/` en `tests/ui/`)
  - `scene/boot-scene.ts` start `scene/tavern-scene.ts`; `game.ts` kent nu die twee scenes. `hello-scene.ts` is verwijderd.
  - De taverne is één doorsnede in gekleurde vormen op **één** `Graphics`-object: achtergrond, vloer en deur (`sprites/room-shell.ts`), bar met mokken (`bar.ts`), ketel boven vuur (`cauldron.ts`), 2 tafels (`tables.ts`) en 7 plekken voor klanten als zwakke ovalen (`customer-slots.ts`). Kleuren in `palette.ts`.
  - `scene/layout.ts`: alle posities als pure data zonder Phaser (gebouw, deur, bar, ketel, tafels, `CUSTOMER_SLOTS` met id en soort `table`/`stool`, `DOOR_ENTRY`). Stap 6 gebruikt deze slots voor de klanten.
  - `ui/`: `hud.ts` toont goud en reputatie (labels via `t()`, sleutels `hud.gold` en `hud.reputation`) en houdt zich bij met `store.subscribe`; `hud-view.ts` is de pure opmaak (`formatNumber`); `hud.css`; `dom.ts`; `mount.ts` bouwt de overlay op vanuit `main.ts`.
  - `ui/fit-math.ts` en `ui/fit-root.ts`: `#ui-root` is nu een 1280×720-vak dat met dezelfde FIT-regel als het canvas geschaald en gecentreerd wordt (bij elke `resize`). HUD-elementen staan dus in ontwerp-pixels en blijven op dezelfde plek in de scene.
  - 12 nieuwe tests (91 totaal): layout (alles binnen het gebouw, niets overlapt, klantplekken uniek en minstens 60 px uit elkaar), schaalberekening en HUD-waarden.
- **Waarom (keuzes):**
  - Posities als data in `layout.ts` (SOLID: O en D): stap 6 en 14 voegen plekken en kamers toe zonder tekenlogica te wijzigen, en de layout is zonder Phaser te testen.
  - Eén `Graphics`-object voor de statische taverne: weinig objecten, snel op een Chromebook. Wat later animeert of klikbaar wordt (ketel in stap 7) wordt dan een eigen object.
  - Geen tekstlabels in de scene (alleen vormen), zodat er geen speltekst buiten i18n valt.
  - De overlay schaalt met CSS-`transform` in plaats van elke maat om te rekenen; zo blijft een HUD in ontwerp-pixels te schrijven.
  - Placeholder-tekening bewust simpel; de art-pass is stap 21.
- **Gemeten / gecontroleerd:** `npm run check` en `npm run build` slagen, geen bestand boven 100 regels. Bundel 367 kB gzip JS, dist 1,4 MB. In de browser: geen console-fouten; HUD toont uit een bewerkte save goud `150fy` (1.5e500) en reputatie 7; canvas en overlay vallen samen in een hoog venster (487×274 op dezelfde plek) en in een breed venster (x=127 en 127,8, breedte 1244). Een verschil van ongeveer 1 px komt door afronding van Phaser.
- **Afwijkingen van het plan:** geen. De HUD heeft nog geen tutorial-hint nodig (er is nog niets te doen voor de speler).
- **Nu te proberen:** `npm run dev`, open http://localhost:5173 en maak het venster groter en kleiner: de taverne en de HUD schalen mee. Pas in Local Storage `bt_save` het `reputation`-veld aan (sluit andere tabs, anders overschrijft de autosave het) en herlaad.
- **Nog te doen / volgende stap:** stap 6, Klanten: `systems/customers` (spawn-ritme, geduld, bestelling kiezen) en sprites die via `DOOR_ENTRY` naar een `CUSTOMER_SLOTS`-plek lopen, met objectpool.

### Stap 4: i18n + data-schema (2026-10-06, `step-04-i18n-data-schema`)
- **Gedaan:** (code in `src/i18n/` en `src/data/`, tests in `tests/i18n/` en `tests/data/`)
  - `i18n/translator.ts`: `createTranslator({ messages, fallback? })` met `t(key, params?)` en `has(key)`. `{naam}`-parameters worden ingevuld; een onbekende sleutel geeft de sleutel zelf terug (zichtbaar in de game, gelogd in dev). `i18n/index.ts` exporteert `t` en `hasKey` op basis van Engels.
  - `i18n/en/`: één bestand per domein (`ingredients`, `recipes`, `customers`) plus `index.ts` dat ze samenvoegt.
  - `data/text-key.ts`: `textKey(domein, id, veld)` = `domein.id.veld`. Dit is de conventie waarmee data en vertaling aan elkaar hangen. Gebruik in UI: `t(textKey('recipes', id, 'name'))`.
  - `data/common.ts`: `Rarity` en `Effect` (met lijsten `RARITIES`, `EFFECTS`).
  - Typen en data per map: `ingredients/` (`IngredientDef`, tier 1 en 2), `recipes/` (`RecipeDef`, tier 1 en 2), `customers/` (`CustomerDef`) en `upgrades/` (alleen typen `UpgradeDef`, `UpgradeEffect`, `UpgradeKind`, `UpgradeStat`; lijst is leeg tot stap 9).
  - **Content:** 6 ingrediënten (Swamp Slime, Wild Honey, Glowcap Mushroom, Fire Pepper, Moon Grape, Troll Sweat), 5 recepten (Slime Sap, Glowcap Stout, Dragon's Hiccup, Moonlight Merlot, Troll's Toll met 3 ingrediënten; alle vier effecten komen voor) en 3 klanttypes (Sir Dents-a-Lot, Elf with Opinions, Thirsty Dwarf).
  - `data/validate/`: `validateContent(hasKey, tables?)` geeft een lijst fouten terug (leeg = geldig). Controleert unieke en snake_case ids, bestaande ingrediënt-verwijzingen, 2 tot 3 verschillende ingrediënten per recept, geldige getallen/zeldzaamheid/effecten, dat geen twee recepten dezelfde combinatie hebben (ongeacht volgorde) en dat alle vertaalsleutels bestaan.
  - 23 nieuwe tests (79 totaal): vertaler, de echte content, en de validator zelf met bewust kapotte data (zodat zeker is dat hij fouten vangt).
- **Waarom (keuzes):**
  - Data bevat **geen tekst**, alleen ids; de tekst staat onder een voorspelbare sleutel. Zo blijft `data/` vrij van i18n en komt een Nederlandse vertaling later zonder datawijzigingen.
  - `t()` accepteert een gewone `string` als sleutel (niet een union van alle sleutels), omdat sleutels uit ids worden samengesteld. De test bewaakt dat ze bestaan.
  - Elke tabel brengt zijn eigen regels mee via `defineTable` (SOLID: O): een nieuw domein (kamers, helden, kerkers) is één nieuwe tabel in `validate/tables.ts`, de validator zelf verandert niet. `hasKey` wordt ingespoten (SOLID: D).
  - Content per tier in aparte bestanden (`tier01.ts`, `tier02.ts`), zoals in het plan; een nieuwe tier is een bestand plus één regel in de `index.ts`.
  - Getallen in de data (prijzen, geduld, reputatiedrempels, brouwtijden) zijn **placeholders**; echte tuning volgt in stap 11 en 13.
  - Upgrade-typen zijn bewust al aanwezig met validatie, zodat de data van stap 9 meteen gecontroleerd wordt. De precieze velden kunnen dan nog bijgesteld worden.
- **Afwijkingen van het plan:** `discoveredHint` uit het datamodel (hoofdstuk 5) is geen veld in `RecipeDef`, maar een vertaalsleutel `recipes.<id>.hint`. De bestaande "Hello tavern" in `hello-scene.ts` is nog hardcoded; die scene verdwijnt in stap 5, dus niet aangepast.
- **Nu te proberen:** `npm run test` (79 tests). Lees de teksten in `src/i18n/en/` en pas er één aan. Maak in `src/data/recipes/tier01.ts` een tikfout in een ingrediënt-id of verwijder een vertaling in `src/i18n/en/` en draai `npm run test`: de validatietest zegt precies wat er mis is. Er is niets zichtbaar in de browser; het spel toont nog "Hello tavern".
- **Nog te doen / volgende stap:** stap 5, Taverne-scene (placeholder) met boot-scene, doorsnede met gekleurde vormen en een DOM-overlay `#ui-root` met lege HUD (goud en reputatie via `t()`).

### Stap 3: Save-systeem (2026-10-06, `step-03-save-system`)
- **Gedaan:** (code in `src/save/`, `src/runtime/autosave-driver.ts`, tests in `tests/save/`)
  - `storage.ts`: `StorageAdapter`-interface (zelfde vorm als localStorage en de CrazyGames data-module). `memory-adapter.ts` en `local-storage-adapter.ts` (valt terug op geheugen als localStorage geblokkeerd is).
  - `codec.ts`: JSON-codering waarbij elke `Decimal` automatisch een getagde string wordt (`{"$num":"1.5e+500"}`). Nieuwe state-onderdelen met getallen hoeven dus geen eigen save-code.
  - `reconcile.ts`, `migrate.ts`, `envelope.ts`, `errors.ts`, `base64.ts`: samenvoegen met defaults, versie-migraties (`CURRENT_SAVE_VERSION = 1`, nog geen migraties nodig), save-omslag `{version, savedAt, state}`, foutsoorten `corrupt` en `too-new`, en base64 voor export/import.
  - `save-manager.ts`: `load()` (`new`, `loaded` of `recovered`), `save()`, `exportString()`, `importString()`. Opslaan faalt stil (met debug-log) als de opslag vol of geblokkeerd is.
  - `autosave-driver.ts`: elke 30 s, bij verborgen tab, bij sluiten en bij de nieuwe event `saveRequested`. Zet `lastSeenAt` bij.
  - `touchLastSeen` in `core/state.ts`, `main.ts` laadt nu de save en start de autosave.
  - 29 nieuwe tests (56 totaal) inclusief een vastgezette oude save in `tests/fixtures/save-v1.json`.
- **Waarom (keuzes):**
  - Het getal-formaat gaat via één codec met tag-marker in plaats van per veld, zodat nieuwe state-secties (stap 4 tot 17) zonder extra werk opgeslagen worden (SOLID: O).
  - `reconcile` in plaats van strenge validatie: een update met nieuwe velden breekt oude saves niet. Structurele wijzigingen gaan via migraties.
  - Een kapotte of te nieuwe save wordt als backup bewaard in plaats van overschreven, zodat een speler zijn voortgang nooit stilletjes kwijtraakt.
  - De manager krijgt storage, klok en default-state binnen (SOLID: D); de CrazyGames-adapter komt in stap 20 zonder dat de manager verandert.
- **Gemeten / gecontroleerd:** `npm run check` slaagt (56 tests, geen bestand boven 100 regels). In de browser gecontroleerd: nieuw spel schrijft een save bij sluiten; een bewerkte save (gold 1.5e500, reputatie 7, createdAt 111) laadt correct; een kapotte save geeft `recovered` met backup in `bt_save_backup`; het spel blijft renderen zonder fouten.
- **Afwijkingen van het plan:** `runtime/autosave-driver.ts` en de event `saveRequested` toegevoegd (de timers en DOM-events horen niet in `save/`). Twee tabs tegelijk overschrijven elkaars save; als risico genoteerd in hoofdstuk 13.
- **Nu te proberen:** `npm run dev`, open de browser-console en kijk bij Application, Local Storage naar `bt_save`. Pas daar `reputation` aan en herlaad (sluit eerst andere tabs van het spel, anders overschrijft die het).
- **Nog te doen / volgende stap:** stap 4, i18n en data-schema (`t()` met Engels, types voor ingrediënt/recept/klant/upgrade, eerste 5 recepten, 6 ingrediënten en 3 klanttypes).

### Stap 2: Core (2026-10-06, `step-02-core`)
- **Gedaan:** (alles in `src/core/`, tests in `tests/core/`)
  - `numbers.ts`: dunne wrapper om `break_infinity.js` (`Num`, `num()`, `ZERO`, `ONE`, `serializeNum`, `parseNum`).
  - `format.ts` en `suffixes.ts`: getalnotatie 999, 1.5K, 2.5B, 1Qa, daarna aa tot zz, en daarboven wetenschappelijk (bijv. `1.00e3000`). Rondt netjes door naar het volgende achtervoegsel (999.999 wordt 1K).
  - `state.ts`: `GameState` met `meta`, `currencies.gold`, `reputation`, plus `createInitialState(now)`.
  - `store.ts`: `createStore` met `getState`, `update(mutator)` en `subscribe`.
  - `events.ts` en `game-events.ts`: getypeerde event-bus; de eerste gebeurtenis is `tick`.
  - `clock.ts`: `Clock`-interface met `systemClock`.
  - `ticker.ts`: vaste stap van 100 ms op basis van tijdsverschil. Bij een gat van meer dan 5 s roept de ticker `onGap` aan en simuleert geen stappen.
  - `debug.ts`: logging alleen in dev; verdwijnt uit de productiebuild.
  - `src/runtime/loop-driver.ts`: koppelt de ticker aan een timer en aan `visibilitychange`. `main.ts` bedraadt alles.
  - 27 tests (formattering, getallen, events, store en state, ticker).
- **Waarom (keuzes):**
  - Tijd komt via een `Clock`-interface binnen (SOLID: D), zodat tests en de simulator deterministisch zijn.
  - De ticker simuleert **geen** stappen bij lange gaten. Dat is het afgesproken offline-ontwerp: grote gaten gaan in stap 10 naar `systems/offline` met formules.
  - Store muteert de state in-place en meldt dat daarna. Dat is eenvoudig en snel genoeg; geen kopieën nodig.
  - De loop-driver staat in `src/runtime/` (nieuwe map) omdat `core/` geen DOM mag gebruiken.
  - Testbestanden zijn uitgezonderd van de ESLint-regel `max-lines-per-function` (describe-blokken zijn lang); de bestandslengte blijft wel bewaakt.
  - `tsconfig` kreeg `vite/client`-types voor `import.meta.env` in `debug.ts`.
- **Gemeten / gecontroleerd:** `npm run check` en `npm run build` slagen, geen bestand boven 100 regels. In de browser: geen fouten, `[bt] state` wordt gelogd. De string `[bt]` staat niet in de productiebundel. Bundel: 363 kB gzip (was 358 kB).
- **Afwijkingen van het plan:** `runtime/`-map toegevoegd; `meta.version` is bewust weggelaten uit de state omdat de save-versie in stap 3 in de save-wrapper komt.
- **Nu te proberen:** `npm run test` (27 tests). `npm run dev` en open de console; je ziet de beginstate gelogd.
- **Nog te doen / volgende stap:** stap 3, Save-systeem (serialize/deserialize, versie en migratie, `StorageAdapter`, autosave, export/import).

### Besluit na stap 1: regelrichtlijn en SOLID (2026-10-06, `chore-line-policy-and-solid`)
- **Gedaan:** de harde grens van 100 regels is een richtlijn geworden: waarschuwing vanaf 101 regels (ESLint en `check-lines`), fout vanaf 121. SOLID is verplicht gesteld in hoofdstuk 1 en 9 en in `CLAUDE.md`.
- **Waarom:** de 100 regels waren bedoeld om SOLID af te dwingen, niet als doel op zich. Een paar regels erover mag, te lange bestanden niet.
- **Gecontroleerd:** bestand van 101 regels geeft een waarschuwing, 121 regels geeft een fout.

### Stap 1: Project opzetten (2026-10-06, `step-01-project-setup`)
- **Gedaan:**
  - Vite 8 + TypeScript (strict) + Phaser 4.2.1 + Vitest 5 + ESLint 10 + `break_infinity.js` geïnstalleerd.
  - Scripts: `npm run dev | build | typecheck | lint | lines | test | check`.
  - `scripts/check-lines.mjs` (faalde bij > 100 regels; sinds de beleidswijziging na stap 1: waarschuwing vanaf 101, fout vanaf 121) plus ESLint `max-lines-per-function: 40`.
  - ESLint-lagenregel: `src/core`, `src/systems`, `src/data` mogen geen `phaser`, `scene/`, `ui/`, `document`, `window` of `localStorage` gebruiken.
  - Pad-alias `@/` naar `src/`. Lege Phaser-scene (1280×720, `Scale.FIT`, gecentreerd) toont "Hello tavern". `index.html` heeft `#game` en `#ui-root`.
  - Eén test (16:9-ontwerpresolutie). `.gitignore` (o.a. `.env*`, `.claude/`) en `.gitattributes` (LF).
- **Waarom (keuzes):**
  - **TypeScript 6.0.3 in plaats van 7.x**: `typescript-eslint` accepteert alleen TypeScript < 6.1, en de lint-regels zijn essentieel voor de 100-regelsgrens en de lagen.
  - Vitest-config staat in `vite.config.ts` (via `vitest/config`), zodat er één configbestand is.
  - `.claude/` staat helemaal in `.gitignore`, zodat er niets van Claude Code in de repository komt.
  - Attributie in commits en PR's is uitgezet in `.claude/settings.local.json` (lokaal, niet in git).
- **Gemeten / gecontroleerd:**
  - `npm run check` en `npm run build` slagen.
  - Regelgrens en lagenregel zijn bewust overtreden en geven beide een fout.
  - In de browser: geen consolefouten, canvas 1280×720 geschaald naar 16:9 (1024×576 in een 1024×768 venster).
  - **Bundelgrootte:** `dist/` is 1,4 MB totaal; JS 1,38 MB (358 kB gzip). Budget uit hoofdstuk 8 (< 8 MB initieel, JS gzip < 1,5 MB) is ruim gehaald. Phaser is vrijwel de hele bundel.
- **Afwijkingen van het plan:** TypeScript 6.0.3 (zie boven); `.gitattributes` toegevoegd (niet gepland, voorkomt CRLF-meldingen op Windows).
- **Nu te proberen:** `npm install` en daarna `npm run dev`, open http://localhost:5173. Je ziet "Hello tavern" gecentreerd en schaalbaar. `npm run check` draait alle controles.
- **Nog te doen / volgende stap:** stap 2, Core (Decimal-wrapper en getalformattering, `GameState`, store, event-bus, vaste 100 ms-tick, tests).
