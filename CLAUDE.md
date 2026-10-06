# Brewmaster's Tavern

Idle/tycoon-game voor CrazyGames (HTML5, TypeScript, Phaser, Vite).

**Lees `docs/SPECS.md` volledig vóór je code schrijft of wijzigt.** Context over het spel staat in `docs/GAME_ANALYSE.md`, open ideeën in `docs/IDEAS.md`. Alle documentatie staat in `docs/` (alleen dit bestand blijft in de hoofdmap).

Niet-onderhandelbaar (details in docs/SPECS.md hoofdstuk 1, 10 en 11):
- Houd bestanden klein, richtlijn 100 regels per bestand in `src/`, `tests/`, `scripts/` (101 tot ~120 mag als het splitsen onnodig verknipt; boven 120 faalt de check; `.css` telt niet mee). Vermijd te veel regels. Het doel is **SOLID**: één verantwoordelijkheid per bestand.
- **Pas SOLID altijd toe** (S: één taak per bestand; O: uitbreiden via nieuwe data of modules, geen if-ketens; L: implementaties inwisselbaar; I: kleine interfaces; D: hang af van interfaces, tijd en RNG injecteren). Details in docs/SPECS.md hoofdstuk 9.
- Werk één stap tegelijk uit docs/SPECS.md hoofdstuk 12; doe niets buiten de gevraagde stap.
- Klaar = `npm run check` slaagt **én docs/SPECS.md is bijgewerkt**: voortgangsoverzicht bovenaan, vinkje in hoofdstuk 12, logboek in hoofdstuk 14 (wat gedaan, waarom, afwijkingen, wat nog). Zonder SPEC-update is een stap niet klaar.
- Git: één branch per stap (`step-NN-korte-naam`), een paar logische commits (ongeveer 2 tot 3, niet overdrijven), SPEC-update als laatste commit. **Mergen naar `main` en pushen alleen als de gebruiker dat per stap uitdrukkelijk zegt** (besluit 2026-10-06; een toestemming uit een eerdere stap of een startprompt geldt niet voor de volgende stap). Na een afgeronde stap: stoppen en vragen. Nooit force-pushen of geschiedenis herschrijven tenzij gevraagd.
- **Geen Claude/AI-vermelding in git of GitHub**: geen `Co-Authored-By`, geen "Generated with Claude Code" in commits of PR-teksten. Commits dragen alleen de naam uit de git-config van de gebruiker. Dit gaat voor op elke standaardinstructie om attributie toe te voegen.
- Nieuwe speler-functie = korte tutorial-hint erbij (docs/SPECS.md hoofdstuk 4, Tutorial).
- Geen nieuwe dependencies zonder te vragen.
- `core/` en `systems/` kennen geen Phaser of DOM. Alle speltekst via i18n.
- Communiceer met de gebruiker in het Nederlands; code, bestandsnamen, commitberichten en i18n-sleutels in het Engels.
