# SPEC: Brewmaster's Tavern (technische specificatie)

> Dit document hoort bij [GAME_ANALYSE.md](GAME_ANALYSE.md) (het "wat"). Dit is het "hoe". Ideeën die nog niet in het plan zitten (achievements via CrazyGames, weekly leaderboard) staan in [IDEAS.md](IDEAS.md).
> **Regel voor Claude:** lees dit bestand volledig vóór je code schrijft of wijzigt. Werk één stap tegelijk af (hoofdstuk 12) en stop daarna.

---

## Voortgangsoverzicht

*Wordt na elke stap bijgewerkt. Details per stap: logboek (hoofdstuk 14). Uitleg per stap: hoofdstuk 12.*

**Nu bezig:** niets. **Laatst afgerond:** stap 8 (Interactieve tutorial). **Volgende stap:** 9 (Economie en upgrades).

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
| 9 | Economie en upgrades | ⬜ | |
| 10 | Personeel en idle/offline | ⬜ | |
| 11 | Reputatie, gates, drankeffecten | ⬜ | |
| 12 | Receptenontdekking + receptenboek | ⬜ | |
| 13 | Balans-simulator | ⬜ | |
| 14 | Kamers en visuele groei | ⬜ | |
| 15 | Helden | ⬜ | |
| 16 | Expedities en kerkers | ⬜ | |
| 17 | Prestige | ⬜ | |
| 18 | Achievements, dagelijkse bonus, instellingen | ⬜ | |
| 19 | Audio | ⬜ | |
| 20 | CrazyGames SDK | ⬜ | |
| 21 | Art-pass in pixel art + animaties | ⬜ | |
| 22 | Performance, QA, indienklaar | ⬜ | |
| 23 | Indienen en na-lancering | ⬜ | |

---

## 1. Harde regels (altijd van toepassing)

1. **Houd bestanden klein: richtlijn 100 regels per bestand** in `src/`, `tests/` en `scripts/` (geteld als ruwe regels). Het doel is niet de grens zelf, maar **SOLID werken**: kleine bestanden met één verantwoordelijkheid. Een paar regels erover (tot ~120) is toelaatbaar als splitsen het onnodig verknipt; daarboven is splitsen verplicht. Vermijd bewust te veel regels. Ook data wordt gesplitst (recepten per tier). Uitgezonderd: config in de projectroot, lockfiles, `.md`-bestanden en stylesheets (`.css`): de grens geldt voor programmeerwerk.
2. **SOLID is verplicht** (zie hoofdstuk 9): elke module heeft één reden om te veranderen, uitbreiden gaat via nieuwe data of nieuwe modules, en afhankelijkheden lopen via interfaces.
3. **Eén stap per keer.** Geen code buiten de scope van de gevraagde stap.
4. **Een stap is pas klaar als `npm run check` slaagt** (typecheck + lint + regelgrens + tests) en de "Klaar wanneer"-punten van de stap kloppen.
5. **Geen nieuwe dependencies zonder te vragen.** De toegestane lijst staat in hoofdstuk 3.
6. **Game-logica kent geen Phaser en geen DOM** (zie lagen, hoofdstuk 4).
7. **Alle tekst die een speler ziet** staat in i18n-bestanden, nooit hardcoded in logica of UI.
8. **Geen externe links, geen externe advertenties, geen externe login, geen externe fonts/CDN-requests** in de game (CrazyGames-regel + laadtijd). Enige uitzondering: het SDK-script van CrazyGames.
9. **Na elke stap wordt SPEC.md bijgewerkt** (voortgangsoverzicht bovenaan, vinkje in hoofdstuk 12, logboek in hoofdstuk 14 met wat/waarom/wat nog). Zonder die update is de stap niet klaar (hoofdstuk 10).
10. **Git:** één branch per stap, een paar logische commits (ongeveer 2 tot 3), mergen naar `main` pas na jouw akkoord, nooit pushen tenzij gevraagd (hoofdstuk 11).

### Hoe dwing je dit af (voor jou)
- **`CLAUDE.md`** in de projectroot (wordt in stap 1 gemaakt, en ik maak hem nu al aan) wordt automatisch bij elke sessie geladen en verwijst hiernaar. Dat is de betrouwbaarste manier.
- **`npm run check`** bewaakt de regelrichtlijn: ESLint waarschuwt vanaf 100 regels en `scripts/check-lines.mjs` waarschuwt vanaf 101 en **faalt vanaf 121 regels**. Wat niet door de check komt, is niet klaar.
- Optioneel in stap 1: een hook in Claude Code-instellingen die na elke bestandswijziging de regelcheck draait (kan via de `update-config` skill; vraag erom).
- Jij kunt altijd zeggen: "Doe stap N", en ik lees eerst dit bestand.

---

## 2. Geverifieerde CrazyGames-eisen

Gecontroleerd op 2026-10-06 in de officiële docs (docs.crazygames.com). Opnieuw checken vlak voor indienen (stap 22).

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

**Nog niet gecontroleerd (doen in stap 22):** exacte thumbnail-formaten, de CrazyGames QA/preview-tool, beoordelingscriteria voor Basic → Full Launch, en of een externe analytics-oplossing is toegestaan (standaard: **geen analytics**).

---

## 3. Tech stack

| Onderdeel | Keuze | Versie (npm, 2026-10-06) | Opmerking |
|---|---|---|---|
| Taal | TypeScript, `strict: true`, geen `any` | **6.0.3** (niet 7.x) | `typescript-eslint` ondersteunt alleen TypeScript < 6.1. Pas upgraden als dat verandert. |
| Engine | **Phaser 4** | 4.2.x (stabiel sinds april 2026) | Fallback: Phaser 3.90. Check bundlegrootte in stap 1. |
| Build/dev | Vite | 8.x | `base: './'`, productiebuild naar `dist/` |
| Grote getallen | `break_infinity.js` | 2.2.x | Opslaan als string in save |
| Tests | Vitest | 5.x | Alleen voor `core/` en `systems/` (puur TS) |
| Lint | ESLint (flat config) + `typescript-eslint` | 10.x | Waarschuwing `max-lines: 100`, fout `max-lines-per-function: 40` |
| UI | **Vanilla TypeScript + DOM** voor HUD/menu's, Phaser-canvas voor de taverne | n.v.t. | Geen React/Vue (bundlegrootte, eenvoud) |
| Opslag | via `Storage`-adapter: SDK data-module of `localStorage` | n.v.t. | |
| Audio | Phaser's eigen audio | n.v.t. | Geen Howler nodig |

Alles buiten deze lijst: eerst vragen.

**Waarom niet Unity/Godot:** grotere downloads en laadtijd, terwijl ≤ 50 MB en snel laden harde eisen zijn.

---

## 4. Architectuur

### Lagen (afhankelijkheid gaat alleen naar beneden)

```
ui/ + scene/        (DOM en Phaser: tonen en input)
      ↓
systems/            (spelregels: puur TypeScript)
      ↓
core/ + data/       (state, tijd, getallen, save, content-tabellen)

platform/  audio/  i18n/   (diensten; mogen door ui/scene gebruikt worden,
                            systems/core mogen alleen platform/ via een interface)
```

- `core/` en `systems/` importeren **nooit** `phaser`, `document` of `window`. Daardoor testbaar met Vitest en geschikt voor offline-berekening.
- `ui/` en `scene/` lezen alleen de state en roepen **acties** aan (functies uit `systems/`). Ze berekenen zelf geen spelregels.
- Eén rijtje ESLint-regels (`no-restricted-imports`) bewaakt dit.

### Mappenstructuur

```
crazyGamesGame/
  CLAUDE.md  SPEC.md  GAME_ANALYSE.md  ASSETS.md
  index.html  package.json  vite.config.ts  tsconfig.json  eslint.config.js
  scripts/        check-lines.mjs, simulate.ts (balans-simulator)
  public/         assets (svg, spritesheets, audio)
  src/
    main.ts                 opstart (kort!)
    core/                   state, store, tick, events, numbers (Decimal), format
    save/                   serialize, migrate, storage-adapter, autosave
    data/                   ingredients/, recipes/tier01.ts.., customers/, upgrades/,
                            rooms/, heroes/, dungeons/, achievements/, tutorial/
    systems/                brewing, customers, economy, reputation, upgrades, staff,
                            heroes, expeditions, prestige, offline, achievements, tutorial
    scene/                  boot, tavern, sprites/ (klant, ketel, held), effects
    ui/                     hud, shop, recipe-book, heroes, prestige, settings, toast, tutorial/
    wiring/                 composition root: bouwt de runtime-objecten, start de systemen, levert services aan de scenes
    runtime/                browser-koppelingen voor core (loop-driver: timers en tab-zichtbaarheid)
    platform/               crazygames (SDK-wrapper), mock, ads, gameplay-state
    audio/                  sfx, music, mute-logic
    i18n/                   index.ts (t()), en/*.ts, nl/*.ts (later)
  tests/                    spiegelt src/ (core en systems)
```

Bestandsnamen: `kebab-case.ts`. Eén verantwoordelijkheid per bestand; een bestand dat dichter dan ~80 regels komt wordt direct gesplitst.

### State

- **Eén** `GameState`-object, volledig JSON-serialiseerbaar (Decimal als string bij opslaan).
- Wijzigingen alleen via acties in `systems/` (`(state, params) => void` of nieuwe state). Na wijziging roept de store `notify()` aan; UI abonneert zich.
- **Niet in de state:** wie er op dit moment in de taverne zit (`CustomerFloor` in `systems/customers`) is runtime en wordt niet opgeslagen; de taverne begint bij elk laden leeg.
- State bevat o.a.: `meta` (versie, laatst-gezien-tijd), `currencies`, `reputation`, `recipesDiscovered`, `ingredients`, `upgrades`, `staff`, `rooms`, `heroes`, `expeditions` (met absolute eindtijd), `prestige`, `achievements`, `settings`, `stats`.

### Tijd en tick

- Vaste simulatiestap van **100 ms**, losgekoppeld van framerate.
- Tijd wordt altijd gemeten met `Date.now()`-verschil (accumulator), niet met "aantal ticks", omdat achtergrondtabs door de browser worden afgeknepen.
- Bij terugkeren (visibilitychange of laden) wordt het gemiste tijdsverschil verwerkt door `systems/offline` met **formules** (niet door alle ticks te simuleren). Bovengrens = offline-limiet (basis 2 uur, uitbreidbaar).
- Expedities slaan een absolute `endsAt` op en worden bij laden direct afgehandeld.

### Save

- Sleutel `bt_save`, inhoud: `{ version, savedAt, state }` als JSON-string.
- `migrate(save)` voert versie-stappen uit (`v1 → v2 → ...`), zodat updates nooit voortgang breken.
- Autosave elke 30 s, bij belangrijke acties (aankoop, prestige: via de event `saveRequested`) en bij `visibilitychange`/`beforeunload`. Elke autosave zet eerst `meta.lastSeenAt` (nodig voor offline-voortgang in stap 10).
- Een onleesbare of te nieuwe save wordt **niet** weggegooid: de ruwe tekst gaat naar `bt_save_backup` en er start een nieuw spel (`status: recovered`).
- Bij laden wordt de save samengevoegd met de defaults (`reconcile`): ontbrekende velden krijgen een default, onbekende velden vallen weg, velden van het verkeerde type vallen terug op de default. **Regel:** een leeg object in de default-state (`{}`) betekent een open lijst (bijv. upgrade-niveaus per id); de opgeslagen inhoud blijft dan volledig behouden.
- Handmatige **export/import** als tekst (base64) in Settings, als vangnet.
- Grootte bewaken: < 200 KB (SDK-limiet is 1 MB).
- Alle opslag via een `StorageAdapter`-interface: `localStorageAdapter` (dev/Basic Launch) en `crazyGamesAdapter` (SDK data-module).

### Tutorial (interactief)

Doel: een nieuwe speler leert de basis **door het te doen**, in de echte game, zonder tekstmuur en zonder apart scherm (past bij "land direct in gameplay" van CrazyGames).

- **Statemachine in `systems/tutorial`** (puur TS, getest met Vitest). Stappen zijn data in `data/tutorial/`: `{ id, lesson, startWhen?, target, completeOn, needsLiveState? }`. De tekst is de i18n-sleutel `tutorial.<id>.text` (geen `textKey`-veld; dezelfde conventie als andere content).
  - `startWhen`/`completeOn` luisteren naar **echte spel-events** uit de event-bus (bijv. `ingredient:clicked`, `brew:done`, `customer:served`, `upgrade:bought`) of naar een state-conditie (bijv. "genoeg goud voor eerste upgrade").
  - De speler klikt dus nooit op "volgende"; de tutorial gaat verder wanneer de speler de actie echt uitvoert.
- **Registry van doelen (`target`):** `core/target-registry.ts`. DOM-elementen en Phaser-objecten melden zich aan met een id en een functie die hun huidige positie in ontwerp-pixels geeft (`ingredient:<id>`, `customer:<id>`, `cauldron`, `hud-gold`, later `shop-button`). Bewegende doelen worden gevolgd. Een stap kan ook een **gids-alias** als doel hebben (`guide-ingredient`, `guide-customer`) die `systems/tutorial/guide.ts` tijdens het spelen omzet naar het juiste doel, zodat de tutorial altijd het drankje van een echt wachtende klant uitlegt.
- **Tijdens een les:** maximaal **één klant** in de taverne en het **geduld staat stil** (de balk blijft vol), zodat niemand midden in de les vertrekt. Daarna loopt alles normaal.
- **UI in `ui/tutorial`:** gedimde overlay met een "spotlight"-gat om het doel, een pulserende pijl en een korte spraakbel van een mascotte. Maximaal 1 à 2 korte zinnen per stap, in humoristische toon (i18n-sleutels).
- **Mascotte (werktitel):** een chagrijnige pratende ketel. Placeholder tot stap 21.
- **Nooit blokkerend of vervelend:**
  - Altijd een zichtbare "Skip"-knop.
  - De rest van de game blijft bedienbaar; een verkeerde klik breekt niets.
  - Doet de speler de actie van een latere stap al, dan wordt die stap (en elke eerdere) automatisch afgevinkt.
  - Hoort tot `gameplayStart`-tijd (geen aparte "pauze").
- **Opslaan:** voortgang staat in `state.tutorial` (`completedSteps`, `skipped`) en overleeft herladen.
- **Opnieuw afspelen:** via Settings (stap 18), tot dan via debug-commando.
- **Fasering:** basis-tutorial (ingrediënt → ketel → wachten → serveren → eerste goud) in **stap 8**. Elke latere stap met een nieuwe functie levert een **korte contextuele hint** die pas verschijnt zodra de functie voor het eerst beschikbaar is (eerste upgrade, eerste medewerker, eerste ontdekking, eerste held, enz.).
- **Tests:** stappen volgen elkaar correct op, overslaan werkt, out-of-order acties lopen niet vast, herladen hervat op de juiste stap.

### Economie (code-kant)

- Upgradekosten: `kosten(n) = basis × groeifactor^n`, groeifactor per upgrade-type in `data/`.
- Multipliers worden samengevoegd in één functie `getMultipliers(state)` zodat bronnen (prestige, upgrades, achievements, events) op één plek optellen/vermenigvuldigen.
- Alle balansgetallen staan in `data/`, nooit in `systems/`.
- **Balans-simulator** (`scripts/simulate.ts`, draait in Node dankzij de pure `systems/`): simuleert een speler-strategie en print wanneer mijlpalen worden gehaald. Doel: eerste prestige na ~1 tot 2 uur.

### Rendering

- Phaser `Scale.FIT`, vaste ontwerpresolutie **1280×720**, gecentreerd, `pixelArt: false`.
- **Besluit (2026-10-06): de eindstijl wordt pixel art.** De omschakeling hoort bij stap 21 en niet eerder: ontwerpresolutie dan **320×180** (4× opgeschaald naar 1280×720), `pixelArt: true`, en `layout.ts` en de UI-schaling gaan mee. Tot die tijd blijft alles op 1280×720 met placeholders.
- Doorsnede-taverne: kamers als vaste "slots" in één scene; nieuwe kamer = nieuwe slot zichtbaar maken, geen camerabeweging.
- Objectpools voor klanten, muntjes en partikels. Maximaal ~30 gelijktijdige klanten-sprites.
- DOM-overlay (`#ui-root`) bovenop het canvas voor HUD, winkel, receptenboek, instellingen.
- Doel: 60 FPS op gemiddelde laptop, speelbaar op Chromebook (4 GB).

### Assets

- **Eerlijke kanttekening:** ik kan geen geschilderde/AI-afbeeldingen genereren. Wel kan ik **pixel-art-sprites schrijven als tekstrasters met een palet** (zie `scripts/pixel/` en `art/pixel/`; een script maakt er PNG's van, zonder dependencies) en **CC0/vrije assets opzoeken** (bijv. Kenney.nl, OpenGameArt; per asset de licentie checken). Downloaden doe ik alleen na jouw akkoord per bestand. Ingewikkelde sprites (zeldzame klanten, helden, gebouwen) kun je beter via een beeldtool of CC0-pakket laten maken; eenvoudige klanten, ingrediënten en meubels lukken in dit formaat.
- Stap 1 t/m 20: **placeholders** (gekleurde vormen + emoji) zodat spelen niet op art wacht.
- Stap 21: volledige styling-stap in pixel art, met animaties (zie stap 21 in hoofdstuk 12).
- Elke gebruikte externe asset komt met bron en licentie in `ASSETS.md`.
- Budget: alle assets samen < 5 MB. Muziek: korte loopbare mp3/ogg (jij levert), < 2 MB per track.

### i18n

- `t('sleutel')` met sleutels per domein (`recipes.slime_sap.name`). Basis: **Engels**. Nederlands later als vertaalbestand + taalknop in Settings.
- Spelers-zichtbare getallen/tekst nooit samenstellen met losse string-plakkerij; gebruik parameters (`t('toast.gold', { n })`).

---

## 5. Datamodel (schetsen)

```ts
Ingredient { id, tier, rarity, source: 'shop' | 'dungeon:<id>' }
Recipe     { id, tier, rarity, ingredients: id[2..3], brewSeconds, basePrice,
             effect: 'strength' | 'speed' | 'luck' | 'charm' }   // naam en hint: i18n-sleutels recipes.<id>.name/.hint
Customer   { id, minReputation, patienceSeconds, spendMultiplier, likes: effect[] }
Upgrade    { id, kind, baseCost, growth, effect, maxLevel? }
Room       { id, unlockReputation, cost, slotsAdded, bonus }
Hero       { id, class, baseStats, hireCost }
Dungeon    { id, minHeroLevel, durationSeconds, drops: ingredient id weighted[] }
```

Contentomvang MVP: ~30 recepten, ~25 ingrediënten, 8 klanttypes, 3 kamers, 4 heldenklassen, 3 kerkers, ~40 upgrades.

---

## 6. Platform-laag (CrazyGames)

`src/platform/` is de **enige** plek die `window.CrazyGames` aanraakt.

- Interface `Platform`: `init()`, `loadingStart/Stop()`, `gameplayStart/Stop()`, `requestMidgameAd()`, `requestRewardedAd()`, `storage`, `getUsername()`, `onMuteChange()`.
- `crazyGamesPlatform` (SDK) en `mockPlatform` (lokaal/dev, logt en geeft nep-ads) worden gekozen op basis van aanwezigheid van het SDK-script.
- `gameplay-state.ts`: roept `gameplayStart/Stop` aan op basis van: tab zichtbaar, geen modal open, geen ad actief.
- `ads.ts`: regels *wanneer* een ad gevraagd wordt (na prestige, na terugkeer van expeditie, niet binnen 3 min, nooit tijdens actieve interactie). Rewarded ads alleen na speler-keuze (dubbele offline-beloning, tijdelijke boost). Altijd correct afhandelen: `adblock`, `unfilled`, `adCooldown`.
- **Direct in gameplay:** er is geen hoofdmenu. De speler staat meteen in de taverne met de eerste klant; instellingen via een tandwiel.

---

## 7. Teststrategie

- **Vitest** voor `core/` en `systems/`: kosten-formules, offline-berekening, save/migratie, prestige-berekening, receptontdekking.
- **Handmatig in browser** (ik gebruik de ingebouwde browser) na elke visuele stap: laden, geen console-errors, framerate-indruk.
- **Balans-simulator** vanaf stap 13.
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
- **SOLID (verplicht)**, vertaald naar dit project:
  - **S (single responsibility):** één bestand, één taak. Een systeem berekent, een scene tekent, een UI-paneel toont. Raakt een wijziging twee soorten dingen, dan is het bestand te groot.
  - **O (open/closed):** uitbreiden zonder bestaande code te wijzigen. Nieuwe recepten, klanten, upgrades, kerkers en kamers zijn nieuwe data of nieuwe kleine modules, geen `if`-ketens in bestaande systemen. Gedrag per type via een registry of tabel.
  - **L (Liskov):** elke implementatie van een interface (bijv. `StorageAdapter`, `Platform`, upgrade-effecten) moet inwisselbaar zijn zonder verrassingen, zodat de mock en de echte SDK zich gelijk gedragen.
  - **I (interface segregation):** kleine, gerichte interfaces. Een systeem dat alleen goud nodig heeft, krijgt geen hele `GameState`, maar het stuk dat het nodig heeft.
  - **D (dependency inversion):** logica hangt af van interfaces, niet van concrete diensten (opslag, platform, tijd, willekeur). Tijd en RNG worden ingespoten, zodat tests en de simulator deterministisch zijn.
- Functies kort (lint: max 40 regels), liever pure functies dan klassen. Klassen alleen waar Phaser het vraagt (Scenes).
- Geen magische getallen in logica: naar `data/` of constanten.
- Geen commentaar dat herhaalt wat de code doet; wel één regel *waarom* bij niet-voor-de-hand-liggende keuzes.
- Imports met pad-alias `@/` naar `src/`.
- Geen `console.log` in productie (een `debug()`-helper die in de build verdwijnt).

---

## 10. Definition of Done (per stap)

1. De stap-beschrijving is volledig uitgevoerd, niets extra's.
2. `npm run check` slaagt (typecheck, lint, regelgrens, tests).
3. Visuele stappen: in de browser gecontroleerd, geen console-fouten.
4. Geen bestand > 120 regels, en bestanden boven 100 regels zijn bewust (en gemeld) of worden gesplitst. SOLID gecontroleerd.
5. Heeft de stap een nieuwe speler-functie? Dan hoort daar een korte **tutorial-hint** bij (zie hoofdstuk 4, Tutorial).
6. **SPEC.md is bijgewerkt (verplicht, laatste commit van de stap):**
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
- Houd bestanden rond 100 regels; zie je een bestand groeien of meerdere verantwoordelijkheden krijgen, splits het direct.
- Als een stap te groot blijkt: stop, stel een opsplitsing voor.

### Git-werkwijze (per stap)
Jij maakt de repository en de GitHub-koppeling zelf aan. Daarna werkt het zo:

1. **Branch per stap:** `step-NN-korte-naam` (bijv. `step-07-brew-and-serve`), aangemaakt vanaf een bijgewerkte `main`.
2. **Een paar logische commits per stap (ongeveer 2 tot 3)**, niet overdrijven. Bijvoorbeeld: één commit voor de code met bijbehorende tests, één voor de SPEC-update, en alleen extra commits als de stap echt uit losse delen bestaat. Berichten in het Engels, korte imperatieve zin.
3. **Laatste commit van de stap** is de SPEC.md-update (hoofdstuk 10, punt 6).
4. **Terug mergen naar `main`:** alleen nadat jij het resultaat hebt bekeken en zegt dat het mag ("merge stap N"). Standaard `--no-ff`, zodat elke stap als blok in de geschiedenis zichtbaar blijft.
5. **Pushen doe ik nooit** tenzij jij dat expliciet vraagt. Geen force-push, geen herschrijven van geschiedenis op `main`.
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
- [ ] **Stap 9: Economie en upgrades.** Kostenformule, `getMultipliers`, winkelpaneel (DOM) met koop x1/x10/max, eerste upgrades (ketel-snelheid, prijs, opslag). Tutorial-hint: eerste upgrade kopen.
  *Klaar wanneer:* upgrades werken, kosten stijgen, tests slagen.
- [ ] **Stap 10: Personeel en idle.** Barman/serveerster/brouwer-assistent automatiseren stappen; idle-inkomen ≈ 30 tot 40% van actief spelen; offline-voortgang met limiet en "welkom terug"-venster. Tutorial-hint: eerste medewerker inhuren.
  *Klaar wanneer:* tabblad 5 min weg of sluiten/openen levert correcte offline-opbrengst; tests voor `systems/offline`.

### Fase C: Diepte
- [ ] **Stap 11: Reputatie, gates en drankeffecten.** Reputatieniveaus ontgrendelen klanten/kamers/recepten; klantvoorkeuren en effecten (kracht/snelheid/geluk/charme); VIP-klanten. Tutorial-hint: klantvoorkeur.
- [ ] **Stap 12: Receptenontdekking en receptenboek.** Combineren in ketel → nieuw recept ("Eureka!"), silhouetten van onontdekte recepten, receptenboek-paneel met X/N voortgang. Content uitbreiden naar ~15 recepten. Tutorial-hint: eerste ontdekking.
- [ ] **Stap 13: Balans-simulator.** `scripts/simulate.ts` simuleert een speler; rapporteert mijlpaaltijden. Eerste tuning van getallen in `data/`.
  *Klaar wanneer:* simulator draait via `npm run simulate` en toont een duidelijke tijdlijn.
- [ ] **Stap 14: Kamers en visuele groei.** Uitbreidingen (extra tafels, alchemielab, VIP-lounge), kamer-slots in de scene, decoraties als goud-sink. Tutorial-hint: eerste kamer.
- [ ] **Stap 15: Helden.** Inhuren, klassen, levelen, uitrusting, held-paneel. Tutorial-hint: eerste held.
- [ ] **Stap 16: Expedities en kerkers.** Held + kerker + meegenomen drankjes → timer (absoluut) → opbrengst (ingrediënten/XP); offline afhandelen; gewonde-cooldown. Receptencontent naar ~30. Tutorial-hint: eerste expeditie.
- [ ] **Stap 17: Prestige.** "Verkoop de taverne", Gouden Hop-formule, permanente tree, wat reset en wat blijft (recepten blijven). Tests voor de formule en reset. Tutorial-hint: eerste prestige.

### Fase D: Afwerking
- [ ] **Stap 18: Achievements, dagelijkse bonus, statistieken, instellingen.** Settings-paneel (volume, taalkeuze-mechaniek met alleen EN, save reset/export/import, **tutorial opnieuw afspelen**). Achievements zijn een eigen systeem (de SDK heeft geen achievement-module; alleen `happytime()` voor grote momenten), met een `stats`-sectie in de state. Zie IDEAS.md.
- [ ] **Stap 19: Audio.** Sfx-hooks, muziek-hook (jij levert later het bestand), mute-knop, eigen volume; `muteAudio` van de SDK krijgt voorrang.
- [ ] **Stap 20: CrazyGames SDK.** Platform-laag: init, loading/gameplay-events, data-module als `StorageAdapter`, midgame- en rewarded ads (3 min-regel, adblock-veilig), gebruikersnaam, `happytime()` bij zeldzame achievements. Het weekly leaderboard is **niet** onderdeel van de MVP (alleen voor uitgenodigde games); zie IDEAS.md. Test met mock én met CrazyGames' preview/QA-tool.
- [ ] **Stap 21: Art-pass in pixel art (volledige styling-stap, met animaties).** Omschakelen naar ontwerpresolutie 320×180 met `pixelArt: true` (`layout.ts`, scene en UI-schaling meenemen). Alle placeholders vervangen door pixel-art-sprites: de pijplijn uit `scripts/pixel/` (tekstrasters naar PNG/spritesheet, uit te breiden met een atlas) en eventueel CC0-assets of extern gemaakte art, na akkoord per bestand. **Animaties:** klanten (lopen, zitten, drinken, blij en boos), ketel (borrelen, vuur), vallende munten, held-animaties, tutorial-mascotte. Juice (partikels, schermschud bij legendarisch), thumbnail-materiaal. `ASSETS.md` bijwerken.
  *Klaar wanneer:* geen gekleurde-vorm-placeholders meer in het spel, alle klantacties hebben een animatie, 60 FPS blijft gehaald, assets blijven binnen het budget (hoofdstuk 8).
- [ ] **Stap 22: Performance, QA en indienklaar maken.** Bundel-/assetbudget, Chromebook-test, Chrome + Edge, relatieve paden, aantal bestanden, alle "nog niet gecontroleerd"-punten uit hoofdstuk 2 doornemen, `npm run build` → zip.
- [ ] **Stap 23: Indienen en na-lancering.** Checklist voor Basic Launch, daarna Full Launch (jij maakt het developer-account en dient in). Daarna: events, content, tweede prestige-laag, Nederlandse vertaling.

---

## 13. Risico's (technisch)

| Risico | Mitigatie |
|---|---|
| Phaser 4 is nieuw, minder voorbeelden | Migratiegids zit in het npm-pakket; fallback op 3.90 in stap 1 |
| Browser knijpt timers af op achtergrondtab | Altijd tijdsverschil met `Date.now()`; offline-formules |
| Grote getallen en afrondfouten | Decimal overal in de economie; tests met extreme waarden |
| Saves breken bij update | Versie + migraties + fixture-test |
| 100-regelsregel leidt tot veel kleine bestanden | Bewust; duidelijke mappen en indexbestanden |
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
