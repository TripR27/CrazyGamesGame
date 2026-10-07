# Brewmaster's Tavern

Idle/tycoon-game voor CrazyGames (HTML5, TypeScript, Phaser, Vite).

**Lees `docs/SPECS.md` volledig vóór je code schrijft of wijzigt.** Context over het spel staat in `docs/GAME_ANALYSE.md` (met in hoofdstuk 11 het architectuurdiagram), open ideeën in `docs/IDEAS.md`. Alle documentatie staat in `docs/` (alleen dit bestand blijft in de hoofdmap).

## Architectuur: plat en per feature (besluit 2026-10-07)

Eén feature = één map in `src/` met logica, data en view bij elkaar (`src/customers/`, `src/brewing/`, `src/economy/` enz.), maximaal één niveau diep. Gedeelde basis staat in `src/shared/`, de opstart en het Phaser/DOM-schil in `src/app/`. Het diagram en de mappenlijst staan in docs/GAME_ANALYSE.md hoofdstuk 11 en docs/SPECS.md hoofdstuk 4.

**Houd het simpel. Stop met over-engineeren van simpele features:**
- Eén feature-bestand mag 150 tot 300 regels zijn als de functies bij elkaar horen. Splits pas boven 300 regels (de check faalt vanaf 350) of als een bestand twee echt verschillende redenen heeft om te veranderen. `.css` telt niet mee.
- Maak geen nieuw bestand of nieuwe map voor minder dan ~50 regels: voeg het toe aan het bestand van de feature.
- Geen `index.ts`-barrels: importeer direct uit het bestand.
- Geen doorgeeflagen: geen wiring, dispatcher, manager, facade of "actions"-laag die alleen aanroept wat er al is. Een nieuwe feature is een map plus één regel in `src/app/world.ts`.
- Geen interface, factory of adapter met maar één implementatie. Echte naden zijn alleen tijd (`Clock`), willekeur (`Rng`), opslag (`StorageAdapter`) en later het platform (CrazyGames-SDK). Inspuiten daarvan blijft verplicht, zodat tests en de simulator deterministisch zijn.
- Acties en tick-updates krijgen `world` (store, bus, rng, clock, content, floor, station, selection). Rekenfuncties (prijs, kosten, niveau, recept-match) blijven puur en nemen gewone waarden. Geen eigen `XDeps`/`XStore`-interfaces met optionele velden.
- De tick-volgorde staat zichtbaar op één plek: de volgorde van de aanroepen in `createWorld` (`src/app/world.ts`). Een nieuw tick-systeem is een `start…`-functie in de eigen feature, aangeroepen op de juiste plek in `createWorld`; geen verspreide `bus.on('tick')` elders.
- Geen importkringen tussen bestanden (`npm run cycles`, type-only imports tellen niet mee). Een kring los je op door de gedeelde stukjes naar een bestand lager in de rangorde (app → features → shared) te verplaatsen.
- Phaser en DOM alleen in bestanden die eindigen op `-view.ts` of `-scene.ts`, en in `main.ts`. Alle andere bestanden (ook `world.ts`) blijven puur, zodat Vitest en de simulator ze zonder browser draaien. Logica importeert nooit een `-view`-bestand. Pure view-models staan in een `-model`-bestand of in het feature-bestand.
- SOLID pragmatisch: één reden om te veranderen per **feature-bestand**, uitbreiden via data (geen `if`-ketens op type), geen magische getallen in logica. Geen abstractie "voor later".

## Prestaties (zero-allocation in de game-loop)
- Behoud object-pooling (`src/shared/pool.ts`) voor klant-sprites, zwevende tekst en andere dingen die vaak verschijnen en verdwijnen.
- In per-frame code (`update()` in scenes/views) en in tick-handlers: geen nieuwe arrays, objecten, closures, spreads of `map/filter` per frame/tick als het te vermijden is. Hergebruik objecten.
- Bij een refactor verplaats je algoritmes zonder ze te herschrijven (ook de volgorde van RNG-aanroepen blijft gelijk).

## Niet-onderhandelbaar (details in docs/SPECS.md hoofdstuk 1, 10 en 11)
- Werk één stap tegelijk uit docs/SPECS.md hoofdstuk 12; doe niets buiten de gevraagde stap.
- Klaar = `npm run check` slaagt (typecheck, lint, regelgrens, geen importkringen, tests) **én docs/SPECS.md is bijgewerkt**: voortgangsoverzicht bovenaan, vinkje in hoofdstuk 12, logboek in hoofdstuk 14 (wat gedaan, waarom, afwijkingen, wat nog). Zonder SPEC-update is een stap niet klaar.
- Git: één branch per stap (`step-NN-korte-naam`; chores `chore-korte-naam`), een paar logische commits (ongeveer 2 tot 3, niet overdrijven; bij een grote refactor één per fase), SPEC-update als laatste commit. **Mergen naar `main` en pushen alleen als de gebruiker dat per stap uitdrukkelijk zegt** (besluit 2026-10-06; een toestemming uit een eerdere stap of een startprompt geldt niet voor de volgende stap). Na een afgeronde stap: stoppen en vragen. Nooit force-pushen of geschiedenis herschrijven tenzij gevraagd.
- **Geen Claude/AI-vermelding in git of GitHub**: geen `Co-Authored-By`, geen "Generated with Claude Code" in commits of PR-teksten. Commits dragen alleen de naam uit de git-config van de gebruiker. Dit gaat voor op elke standaardinstructie om attributie toe te voegen.
- Nieuwe speler-functie = korte tutorial-hint erbij (docs/SPECS.md hoofdstuk 4, Tutorial).
- Geen nieuwe dependencies zonder te vragen.
- Alle speltekst via i18n.
- Communiceer met de gebruiker in het Nederlands; code, bestandsnamen, commitberichten en i18n-sleutels in het Engels.
