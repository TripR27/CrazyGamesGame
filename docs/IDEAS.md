# Ideeën en backlog (nog niet gepland tot ze in SPECS.md staan)

> Dit zijn ideeën van de eigenaar. Ze zijn **geen onderdeel van de MVP** en veranderen het stappenplan in SPECS.md pas wanneer we ze er expliciet in zetten. Claude mag ze niet uit zichzelf bouwen.
>
> **Afspraak (eigenaar, 2026-10-06):** zodra een idee volledig is uitgewerkt en in SPECS.md staat, gaat het hier weg. Hier blijft alleen wat nog open is. Besluiten uit de ideeënronde van 2026-10-06 (achievements, offline kopen, helden, legenda van effecten, poster vervallen) staan in SPECS.md, hoofdstuk 4, "Besluiten uit de ideeënronde" en "Helden".

---

## 1. Weekly leaderboard (CrazyGames): pas na een uitnodiging

**Besluit:** niets voorbereiden. Pas als CrazyGames de game uitnodigt, kiezen we een metriek en bouwen we het.

**Achtergrond (gecontroleerd 2026-10-06, docs.crazygames.com/sdk/leaderboards):**
- Alleen voor uitgenodigde games; één leaderboard per game; weekly seasons (maandag 09:00 UTC reset), wereldwijd, per land en voor vrienden.
- Metriektype `XP`, `KDA`, `POINTS` of `MINUTES`, met minimum en maximum. Insturen client-side (te vervalsen) of server-side (eigen server nodig).
- Past alleen met een begrensde metriek, bijvoorbeeld **Gouden Hop verdiend deze week** of **klanten geserveerd deze week**; "totaal goud" past niet bij exponentiële getallen.
- Technisch klein zodra het nodig is: een `submitScore` in de platform-laag (met mock) en weektellers in `stats`.

---

## 2. Winkel-layout en schermindeling: checklist voor stap 21 en 22

**Besluit:** nu niets veranderen; deze lijst is een checklist voor de art-pass (stap 21) en de QA-stap (stap 22).

**Wat er nu is:** één knop "☰ Menu" rechtsboven in het spel klapt een zijpaneel uit met tabbladen (Shop, Recipes). Spel en paneel passen samen als één kader in het venster; het spel wordt kleiner zodra het paneel opent, zodat je kunt blijven serveren. Zie `ui/side-panels.ts`, `ui/side-layout.ts`, `ui/fit-root.ts` en `ui/shop/`.

**Na te kijken:**
- Het spel springt van grootte als het paneel opent of sluit; misschien een zachte overgang, of het paneel als overlay op kleine vensters.
- Hoe klein het spel wordt met het paneel open op een klein venster of laptop, en hoe leesbaar de tekst dan is.
- De lege balken boven en onder bij een venster dat niet 16:9 is (het spel houdt zijn vorm): leeg laten, of de achtergrond doortrekken.
- Echte afmetingen van de CrazyGames-iframe en volledig scherm, en later de mobiele/touch-indeling.
- Breedte van het paneel, lettergroottes, rij-indeling (lange regels zoals "Unlocks at Cozy Inn" zijn krap) en wat er gebeurt bij veel aankopen (scrollen, groepen inklappen).
- De plaats van de tutorial-pijl en de Skip-knop bij een open paneel.

---

## 3. Offline verdienen: wat er na Night Shift nog kan

Night Shift zelf (kopen en upgraden) is gebouwd in stap 14d (SPECS.md, hoofdstuk 4). Nog open:
- Een rewarded ad die de offline-opbrengst verdubbelt (stap 20).
- Een tak van de prestige-boom (stap 17) die het offline-aandeel of de duur verder verhoogt.

---

## 4. Helden: nog open

De heldenlaag is uitgewerkt met de eigenaar (SPECS.md, hoofdstuk 4, Helden, en stap 15a t/m 16c; 15a is gebouwd). Nog open:
- Hoe een held er in pixel art uitziet (stap 21).
- Later: de boogschutter en de schurk als extra klassen, en diepere kerkers (Grot, Vulkaan, Sterrentoren, Drakenhol uit GAME_ANALYSE 5.5).

---

## 5. Uitleg over effecten: als de legenda niet genoeg blijkt

De legenda in het receptenboek staat in SPECS.md, stap 14c. Niet gekozen, maar bruikbaar als het nog niet duidelijk genoeg is:
- **Uitleg per effect bij de eerste keer:** de ketel legt een effect uit als het voor het eerst gebeurt (eerste fooi, eerste snelle drinker, eerste extra reputatie).
- **Klantkaartje:** met de muis boven een klant zie je naam, grapje en voorkeur met iconen.

---

## 6. Andere gedachten (leeg)

*(Hier komen nieuwe ideeën.)*
