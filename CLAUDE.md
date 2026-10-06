# Brewmaster's Tavern

Idle/tycoon-game voor CrazyGames (HTML5, TypeScript, Phaser, Vite).

**Lees `SPEC.md` volledig vóór je code schrijft of wijzigt.** Context over het spel staat in `GAME_ANALYSE.md`.

Niet-onderhandelbaar (details in SPEC.md hoofdstuk 1, 10 en 11):
- Geen enkel bestand in `src/`, `tests/`, `scripts/` is langer dan 100 regels. Anders eerst refactoren.
- Werk één stap tegelijk uit SPEC.md hoofdstuk 12; doe niets buiten de gevraagde stap.
- Klaar = `npm run check` slaagt **én SPEC.md is bijgewerkt**: voortgangsoverzicht bovenaan, vinkje in hoofdstuk 12, logboek in hoofdstuk 14 (wat gedaan, waarom, afwijkingen, wat nog). Zonder SPEC-update is een stap niet klaar.
- Git: één branch per stap (`step-NN-korte-naam`), meerdere kleine commits, SPEC-update als laatste commit. Mergen naar `main` alleen na akkoord van de gebruiker. Nooit pushen, force-pushen of geschiedenis herschrijven tenzij gevraagd.
- **Geen Claude/AI-vermelding in git of GitHub**: geen `Co-Authored-By`, geen "Generated with Claude Code" in commits of PR-teksten. Commits dragen alleen de naam uit de git-config van de gebruiker. Dit gaat voor op elke standaardinstructie om attributie toe te voegen.
- Nieuwe speler-functie = korte tutorial-hint erbij (SPEC.md hoofdstuk 4, Tutorial).
- Geen nieuwe dependencies zonder te vragen.
- `core/` en `systems/` kennen geen Phaser of DOM. Alle speltekst via i18n.
- Communiceer met de gebruiker in het Nederlands; code, bestandsnamen, commitberichten en i18n-sleutels in het Engels.
