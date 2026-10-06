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

## 3. Andere gedachten (leeg)

*(Hier komen nieuwe ideeën.)*
