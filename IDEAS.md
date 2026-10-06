# Ideeën en backlog (nog niet gepland tot ze in SPECS.md staan)

> Dit zijn ideeën van de eigenaar. Ze zijn **geen onderdeel van de MVP** en veranderen het stappenplan in SPECS.md pas wanneer we ze er expliciet in zetten. Claude mag ze niet uit zichzelf bouwen.
>
> **Ideeënronde 2026-10-06:** alle punten zijn met de eigenaar doorgenomen. Per punt staat hieronder het besluit. Wat besloten is, staat in SPECS.md (hoofdstuk 4, "Besluiten uit de ideeënronde" en "Helden", en het stappenplan); hier blijft alleen wat nog open is of als achtergrond nuttig is.

---

## 1. Achievements (prestaties): besloten, stap 18

**Besluit:** zoals gepland. Een eigen systeem in stap 18 met kleine permanente bonussen, een paneel en een melding bij ontgrendelen; `happytime()` van CrazyGames alleen bij de grote momenten (eerste prestige, alle recepten ontdekt, legendarisch drankje).

**Achtergrond (gecontroleerd 2026-10-06, docs.crazygames.com):** de SDK heeft **geen achievements-module** (wel: video-ads, banners, game, user, data, in-game purchases en leaderboards). `game.happytime()` is een viering voor bijzondere momenten; spaarzaam gebruiken. Achievements per account komen vanzelf via de data-module (cloud-save). Een `stats`-sectie in de state (totaal geserveerd, goud verdiend, recepten ontdekt) is de basis.

---

## 2. Weekly leaderboard (CrazyGames): pas na een uitnodiging

**Besluit:** niets voorbereiden. Pas als CrazyGames de game uitnodigt, kiezen we een metriek en bouwen we het.

**Achtergrond (gecontroleerd 2026-10-06, docs.crazygames.com/sdk/leaderboards):**
- Alleen voor uitgenodigde games; één leaderboard per game; weekly seasons (maandag 09:00 UTC reset), wereldwijd, per land en voor vrienden.
- Metriektype `XP`, `KDA`, `POINTS` of `MINUTES`, met minimum en maximum. Insturen client-side (te vervalsen) of server-side (eigen server nodig).
- Past alleen met een begrensde metriek, bijvoorbeeld **Gouden Hop verdiend deze week** of **klanten geserveerd deze week**; "totaal goud" past niet bij exponentiële getallen.
- Technisch klein zodra het nodig is: een `submitScore` in de platform-laag (met mock) en weektellers in `stats`.

---

## 3. Winkel-layout en schermindeling: checklist voor stap 21 en 22

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

## 4. Offline-opbrengst eerst kopen: besloten, stap 14d

**Besluit:** "Night Shift" (werknaam) wordt een eenmalige aankoop in de winkel zodra de speler een eerste medewerker heeft, daarna upgrades voor aandeel en duur. Zonder aankoop laat het welkom-venster zien wat de speler gemist heeft. Details in SPECS.md, hoofdstuk 4, Besluiten uit de ideeënronde.

**Nog open (bij stap 14d of later):** een rewarded ad die de offline-opbrengst verdubbelt (stap 20), en of een tak van de prestige-boom (stap 17) het offline-aandeel verder verhoogt.

---

## 5. Receptenboek als poster op de muur: vervallen

**Besluit:** het receptenboek in het menu (tabblad Recipes) is genoeg; geen poster.

---

## 6. Helden: besloten, stap 15, 16 en 16b

**Besluit:** gildekamer op de bovenverdieping; vier actieve onderdelen (uitrusting kiezen, drankjes meegeven, keuzes onderweg, baasgevecht als timing-klik); idle kan, actief loont meer; klein beginnen met 2 klassen en 1 kerker. Details in SPECS.md, hoofdstuk 4, Helden.

**Nog open (bij de uitwerking van stap 15):** hoe een held er in pixel art uitziet (stap 21), welke 2 klassen het eerst komen, en welke keuzekaartjes en drankeffecten bij de eerste kerker horen.

---

## 7. Meer uitleg over effecten: besloten, stap 14c

**Besluit:** een legenda bovenaan het receptenboek (icoon, naam, wat het doet); bij elk recept alleen nog het icoon.

**Niet gekozen, bruikbaar als het nog niet duidelijk genoeg blijkt:**
- **Uitleg per effect bij de eerste keer:** de ketel legt een effect uit als het voor het eerst gebeurt (eerste fooi, eerste snelle drinker, eerste extra reputatie).
- **Klantkaartje:** met de muis boven een klant zie je naam, grapje en voorkeur met iconen.

---

## 8. Andere gedachten (leeg)

*(Hier komen nieuwe ideeën.)*
