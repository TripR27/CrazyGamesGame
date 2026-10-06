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

## 4. Offline-opbrengst eerst kopen en upgraden

**Wens (eigenaar, 2026-10-06):** offline verdienen moet **niet automatisch** gebeuren. De speler moet het eerst **kopen** (ontgrendelen) en kan het daarna **upgraden**, zodat het voelt als een aankoop met een doel en niet als een gratis extraatje.

**Wat er nu is (stap 10b):** zodra een brouwer en een serveerster zijn ingehuurd, verdient het personeel offline automatisch 50% van zijn tempo, tot 2 uur (`data/offline.ts`, `systems/offline/`). Er is nog geen aankoop voor.

**Ideeën om uit te werken (nog niet gepland):**
- Een eerste aankoop in de winkel ("Nachtwacht" of "Sluitingstijd", werknaam) die offline verdienen aanzet. Zonder die aankoop telt de tijd weg niet mee en toont het welkom-terug-venster een uitnodiging om het te kopen.
- Upgrades daarna: een hoger offline-aandeel (nu 50%) en een langere limiet (nu 2 uur, de stat `offlineHours` bestaat al). Past ook in de prestige-boom ("Brouwerij-erfenis").
- Een rewarded ad die de offline-opbrengst verdubbelt (stap 20) kan hierop aansluiten.
- Technisch klein: een stat (bijv. `offlineShare`, basis 0) en een upgrade in `data/upgrades/`; `computeOffline` gebruikt dan die stat in plaats van de vaste `OFFLINE.efficiency`. Het welkom-terug-venster krijgt een regel voor "nog niet gekocht". De tutorial-hint voor de eerste medewerker moet dan ook uitleggen dat offline verdienen apart gekocht wordt.
- Open vragen voor later: wat kost het, wanneer wordt het aangeboden (na de eerste medewerkers?), en moet de eerste afwezigheid wel eens laten zien wat de speler mist (een voorbeeldbedrag)?

**Plan:** niet bouwen buiten de stappen. Een logisch moment is bij stap 13 (balans, getallen afstellen) of stap 17 (prestige-boom). Wil de eigenaar het eerder, dan komt het als aparte stap in SPEC.md.

---

## 5. Receptenboek als poster op de muur

**Wens (eigenaar, 2026-10-06):** de recepten hangen als **poster op de muur** van de taverne, zodat de speler altijd kan zien hoe je iets maakt, in plaats van (of naast) een knop in de hoek.

**Wat al in het plan staat:** het receptenboek als zijpaneel met een grid van drankjes, ingrediënten per recept en X/N voortgang (SPEC.md hoofdstuk 4, Receptenboek, en stap 12).

**Ideeën om uit te werken (nog niet gepland):**
- Een poster in de scene (op de muur, bij de plank) die klikbaar is en het zijpaneel opent. Past bij "een zichtbare wereld": de poster kan groeien met het aantal ontdekte recepten (meer regels, kleurtjes, doorgestreepte of ingevulde vakjes).
- Hij kan ook al het **ingrediëntenpaneel** zijn: kleine plaatjes van de ingrediënten per recept direct op de poster, zonder het paneel te openen, voor de meest recente of de gevraagde drankjes.
- De tutorial wijst de poster aan bij de eerste ontdekking (doelenregister: `recipe-poster`).
- Open vragen: poster en paneel allebei, of alleen de poster? Hoe leesbaar is hij op 1280x720 en op een Chromebook, en hoe past hij in de pixel-art-stijl (stap 21)?

**Plan:** het receptenboek is in stap 12 als zijpaneel gebouwd (knop Recipes). De poster wacht op de art-pass (stap 21), omdat hij pas met echte art leesbaar en mooi wordt; dan linkt hij naar hetzelfde paneel.

---

## 6. Helden: nog te bespreken

**Wens (eigenaar, 2026-10-06):** er komt nog een gesprek over de **helden** (stap 15 en 16 in SPEC.md), voordat die stappen worden uitgewerkt.

**Wat er al ligt:** helden worden ingehuurd, hebben een klasse (krijger, boogschutter, magiër, schurk), level en uitrusting, en gaan met meegenomen drankjes op expeditie naar kerkers voor ingrediënten en XP, ook offline, zonder dat ze kunnen sterven (GAME_ANALYSE.md hoofdstuk 5.5, SPEC.md stap 15 en 16).

**Onderwerpen voor dat gesprek:**
- Hoe zichtbaar zijn helden in de taverne (zitten ze aan de bar, staan ze in een gildekamer, zie je ze vertrekken)?
- Hoe sterk is de koppeling met de brouwloop: welke drankjes kies je, en hoe bepaalt de kwaliteit het succes?
- Hoeveel keuze en hoeveel idle: handmatig uitrusten of automatisch, en wat gebeurt er offline?
- Past een held visueel in de gekozen stijl (pixel art, zie SPEC.md stap 21)?

**Plan:** eerst praten, dan SPEC.md aanpassen. Niet bouwen.

---

## 7. Andere gedachten (leeg)

*(Hier komen nieuwe ideeën.)*
