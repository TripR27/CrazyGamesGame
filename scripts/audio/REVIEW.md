# Reviewrapport audio

Gemeten op de gedecodeerde `.ogg`-bestanden. Luidheid = ongepoorte K-gewogen LUFS over het hele bestand (effecten zijn korter dan 400 ms, dus de standaard EBU-poort kan daar niet); voor de muziek staat ook ffmpeg `ebur128` (geïntegreerd) ter controle. Piek = true peak (4× oversampling).

Eisen: lengte per geluid volgens tabel; piek ≤ -1 dBTP; luidheid doel ±2 LU (effecten -16, `coin` -19, muziek -20); effect < 50 KB, samen < 400 KB, muziek < 2 MB; effecten starten binnen 5 ms zonder klik en eindigen op stilte; de loop heeft geen sprong op het loop-punt.

| bestand | lengte (s) | grootte (KB) | sample-piek (dBFS) | true peak (dBTP) | luidheid (LUFS) | ebur128 (LUFS) | start (ms) | voldoet |
|---|---|---|---|---|---|---|---|---|
| plop.ogg | 0.157 | 4.9 | -2.5 | -2.5 | -15.9 |  | 0.2 | ja |
| bubble.ogg | 0.357 | 5.8 | -3.7 | -3.7 | -16.0 |  | 0.2 | ja |
| coin.ogg | 0.257 | 5.7 | -8.7 | -8.7 | -19.0 |  | 0.3 | ja |
| buzz.ogg | 0.257 | 5.0 | -8.8 | -8.8 | -15.9 |  | 0.2 | ja |
| buy.ogg | 0.357 | 5.9 | -5.8 | -5.8 | -16.0 |  | 0.2 | ja |
| eureka.ogg | 0.777 | 10.4 | -3.8 | -3.8 | -16.0 |  | 0.2 | ja |
| fanfare.ogg | 1.060 | 13.9 | -4.0 | -4.0 | -16.0 |  | 1.6 | ja |
| horn.ogg | 0.617 | 7.5 | -8.8 | -8.8 | -15.9 |  | 0.4 | ja |
| hit.ogg | 0.217 | 5.4 | -3.9 | -3.9 | -15.9 |  | 0.2 | ja |
| miss.ogg | 0.257 | 6.4 | -5.2 | -5.1 | -16.3 |  | 0.5 | ja |
| music_tavern.ogg | 90.000 | 844.8 | -6.7 | -6.7 | -20.0 | -20.0 |  | ja |

Alle effecten samen: 70.8 KB (grens 400 KB).

**Uitslag:** alles voldoet.

Niet gemeten: hoe het klinkt (de maker kan niet luisteren); luister de bestanden na voor gebruik.
