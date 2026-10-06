# Ideeën en backlog (nog niet gepland tot ze in SPEC.md staan)

> Dit zijn ideeën van de eigenaar. Ze zijn **geen onderdeel van de MVP** en veranderen het stappenplan in SPEC.md pas wanneer we ze er expliciet in zetten. Claude mag ze niet uit zichzelf bouwen.

---

## 1. Achievements (prestaties)

**Wens:** achievements in de game, eventueel via CrazyGames als dat kan.

**Wat CrazyGames biedt (gecontroleerd 2026-10-06, docs.crazygames.com):**
- Er is **geen aparte achievements-module** in de SDK gevonden. De modules zijn: video-ads, banners, game, user, data, in-game purchases en leaderboards.
- Wel is er `game.happytime()`: een viering (confetti-achtig effect) voor bijzondere momenten, bedoeld voor "een baas verslaan, een highscore halen". De docs zeggen: sparsaam gebruiken, niet voor routine-gebeurtenissen.

**Plan:**
- Bouw achievements als **eigen systeem** (past al in SPEC stap 18: `systems/achievements`, `data/achievements/`, UI-paneel, toast bij ontgrendelen). Opslag zit gewoon in de save.
- Koppel alleen **de zeldzame, grote** achievements aan `happytime()` (bijv. eerste prestige, alle recepten ontdekt, legendarisch drankje).
- Achievements geven kleine permanente bonussen (past bij de idle-loop) en tellen mee in de statistieken.
- Open vraag voor later: zijn achievements per CrazyGames-account? Dat komt automatisch via de data-module (cloud-save).

**Voorbereiding die nu al helpt:** een `stats`-sectie in de state (totaal geserveerd, totaal goud verdiend, recepten ontdekt, enzovoort), zodat achievements en leaderboards later gewoon op die tellers leunen. Hoort bij stap 18, maar de state-opzet houdt er rekening mee.

---

## 2. Weekly leaderboard (CrazyGames)

**Wens:** een manier om met het CrazyGames-weekly-leaderboard te werken, **alleen als het kan én logisch past** bij deze game.

**Wat CrazyGames biedt (gecontroleerd 2026-10-06, docs.crazygames.com/sdk/leaderboards):**
- **Alleen voor uitgenodigde games.** Je kunt het niet zelf aanzetten; CrazyGames moet je game goedkeuren/uitnodigen. Dit kan dus pas ná lancering, afhankelijk van hoe de game presteert.
- **Weekly seasons:** van maandag tot maandag, eindigend om 09:00 UTC, daarna automatische reset. Ranglijsten: wereldwijd, per land en voor vrienden. Trofeeën voor top 3 en top 1%, 5% en 10%.
- **Maar één leaderboard per game.**
- Metriektype wordt vastgelegd: `XP`, `KDA`, `POINTS` of `MINUTES`. Er zijn minimum- en maximumwaarden voor de score en een cooldown tussen inzendingen (alleen client-side).
- Score insturen kan **client-side via de SDK** (manipuleerbaar) of **server-side via een Leaderboard-API** (veilig, maar vraagt een eigen server).
- Nog niet uitgezocht: exacte SDK-methodes en de invitatievoorwaarden. Doen als er een uitnodiging komt.

**Past het bij deze game? Eerlijke inschatting:**
- Idle-games hebben exponentiële getallen. Een leaderboard met een maximumscore past daar slecht bij. "Totaal goud" is dus **geen** goede metriek.
- Metrieken die wel logisch zijn en begrensd blijven: **Gouden Hop verdiend deze week**, **aantal geserveerde klanten deze week**, of **aantal ontdekte recepten**. Een weekelijkse reset past goed bij prestige: "wie prestigeert het slimst deze week".
- Zonder server is de score client-side en dus te vervalsen. Voor een casual game is dat acceptabel; wie eerlijk wil, heeft een server nodig (extra werk, extra kosten, nu buiten scope).

**Plan:**
- **Niet bouwen** in de MVP. Behandelen als optionele stap ná lancering, alleen als CrazyGames de game uitnodigt.
- Wel nu al: weektellers bijhouden in `stats` (bijv. `weeklyHopEarned` met een resetmoment), zodat een leaderboard later weinig werk kost. Alleen doen als het niets extra's kost in stap 17 en 18.
- In `platform/` komt de SDK-wrapper al; een `submitScore`-methode toevoegen is dan klein (interface aanvullen met een mock-implementatie).

---

## 3. Winkel-layout en schermindeling nakijken

**Wens (eigenaar, 2026-10-06):** de layout van de shop en hoe alles op het scherm komt, moeten later nog aangepast of nagekeken worden. Wat er nu staat (stap 9) is een werkende placeholder.

**Wat er nu is:** de winkel is een kolom (380 ontwerp-pixels) rechts van het spel. Spel en kolom passen samen als één kader in het venster; het spel wordt kleiner zodra de winkel opent, zodat je kunt blijven serveren. De kolom is even hoog als het spel en loopt niet door de lege balken van een venster dat niet 16:9 is. De Shop/Close-knop staat in de rechterbovenhoek van het spel. Zie `ui/side-layout.ts`, `ui/fit-root.ts` en `ui/shop/`.

**Om na te kijken of aan te passen (nog niet gepland):**
- Het spel springt van schaal als de winkel opent of sluit; misschien liever een zachte overgang, of de winkel als overlay op kleine vensters.
- Hoe klein het spel wordt met de winkel open op een klein venster of laptop, en hoe leesbaar de tekst dan nog is.
- De lege balken boven en onder bij een niet-16:9-venster: leeg laten, of de achtergrond doortrekken (past bij de art-pass).
- Echte afmetingen van de CrazyGames-iframe en volledig scherm controleren, en later de mobiele/touch-indeling (liggend en staand).
- De breedte van de kolom, de lettergroottes, de rij-indeling en wat er bij veel upgrades gebeurt (scrollen, groeperen per soort: ketel, taverne, personeel).
- De tutorial-pijl kan op een knop in het paneel liggen; de plaatsing en de Skip-knop bij een open paneel nakijken.
- Eén gedeelde regel voor alle zijpanelen (winkel, receptenboek, instellingen, helden): wat gebeurt er als twee tegelijk open willen?
- Waar de Shop-knop staat ten opzichte van de HUD en de bar.

**Plan:** niet bouwen buiten de stappen. Meenemen bij stap 14 (kamers en visuele groei, nieuwe panelen), bij de mobiele pass en in elk geval bij stap 21 (styling) en stap 22 (QA op Chromebook, Chrome en Edge). Wil de eigenaar het eerder, dan komt het als aparte stap in SPEC.md.

---

## 4. Andere gedachten (leeg)

*(Hier komen nieuwe ideeën.)*
