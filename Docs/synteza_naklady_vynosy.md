# Náklady a výnosy podle fáze a počtu uživatelů – TrainLoop

Syntéza dokumentů `naklady_provoz.md`, `naklady_vyvoj.md`, TrainLoop – Monetizace, TrainLoop_feature_breakdown.xlsx a Lean Canvas V4. Stav: říjen 2026. Kč za měsíc, bez DPH. Trh ČR/SK, webová aplikace.

## 1. Souhrnná tabulka (Kč/měs, 1. rok provozu)

Uživatelé = měsíčně aktivní uživatelé (MAU). Sloupce označené * jsou dopočet nad rámec zdrojových scénářů (viz předpoklady).

|                                                                   |        300 |      1 500 |       3 000 |     10 000* |     50 000* |     100 000* |
| ----------------------------------------------------------------- | ---------: | ---------: | ----------: | ----------: | ----------: | -----------: |
| **MVP** – vývoj jednorázově **1,19 mil. Kč** (0,82–1,53)          |            |            |             |             |             |              |
| Infrastruktura                                                    |      1 100 |      1 800 |       2 300 |       2 700 |       7 500 |       13 000 |
| Podpora                                                           |      1 050 |      2 800 |       7 000 |      17 500 |      52 500 |       87 500 |
| Údržba kódu                                                       |      2 400 |      2 400 |       2 400 |       2 400 |       2 400 |        2 400 |
| **Náklady MVP**                                                   |  **4 550** |  **7 000** |  **11 700** |  **22 600** |  **62 400** |  **102 900** |
| **Příjmy MVP**                                                    |      **0** |      **0** |       **0** |       **0** |       **0** |        **0** |
| **Výsledek MVP**                                                  | **−4 550** | **−7 000** | **−11 700** | **−22 600** | **−62 400** | **−102 900** |
| **Full Release** – vývoj jednorázově **1,53 mil. Kč** (1,05–1,97) |            |            |             |             |             |              |
| Infrastruktura                                                    |      1 100 |      1 800 |       2 300 |       2 700 |       7 500 |       13 000 |
| Videa a přenosy                                                   |        100 |        200 |         500 |       1 500 |       7 500 |       15 000 |
| Podpora                                                           |      1 050 |      2 800 |       7 000 |      17 500 |      52 500 |       87 500 |
| Moderace                                                          |        700 |      1 750 |       4 200 |      10 500 |      35 000 |       56 000 |
| Údržba kódu                                                       |      2 400 |      2 400 |       2 400 |       2 400 |       2 400 |        2 400 |
| **Náklady Full**                                                  |  **5 350** |  **8 950** |  **16 400** |  **34 600** | **104 900** |  **173 900** |
| Plus pro psovody                                                  |        400 |      1 800 |       3 700 |      12 200 |      60 900 |      121 800 |
| Předplatné trenérů                                                |        100 |        700 |       1 300 |       4 400 |      22 000 |       44 000 |
| Psí školy                                                         |          0 |          0 |       1 300 |       3 900 |      19 400 |       38 700 |
| Reklamy                                                           |        100 |        700 |       1 400 |       4 700 |      23 300 |       46 500 |
| Partnerství                                                       |        100 |        500 |         900 |       5 000 |      25 000 |       50 000 |
| **Příjmy Full**                                                   |    **700** |  **3 700** |   **8 600** |  **30 200** | **150 600** |  **301 000** |
| **Výsledek Full**                                                 | **−4 650** | **−5 250** |  **−7 800** |  **−4 400** | **+45 700** | **+127 100** |
| Návratnost vývoje Full                                            |          – |          – |           – |           – |    ~34 měs. |     ~12 měs. |
| _Pro kontext:_                                                    |            |            |             |             |             |              |
| Předplatitelé Plus                                                |          9 |         46 |          91 |         305 |       1 520 |        3 045 |
| Platící trenéři                                                   |          1 |          6 |          12 |          40 |         200 |          400 |
| Psí školy                                                         |          0 |          0 |           1 |           3 |          15 |           30 |
| Náklady Full na uživatele                                         |       17,8 |        6,0 |         5,5 |         3,5 |         2,1 |          1,7 |
| Příjmy Full na uživatele                                          |        2,3 |        2,5 |         2,9 |         3,0 |         3,0 |          3,0 |

Od 2. roku jsou náklady obou fází nižší o 800 Kč/měs, od 3. roku o 1 600 Kč/měs (klesající údržba). Bod zvratu Full Release je přibližně při **13 500 MAU**.

## 2. Předpoklady

### Fáze

- **MVP** = funkce s prioritou MVP ve feature breakdownu (verze z 9. 10.). Neobsahuje žádnou placenou funkci, sdílení plánů, spolupráci s trenérem ani videa, proto má nulové příjmy a nemá náklady na videa a moderaci.
- **Full Release** = MVP + premium fáze z `naklady_vyvoj.md` (sprinty 8–9) a zdroje příjmů z Monetizace kromě tržiště: placený prodej plánů se dělat nebude.
- Vývoj Full Release (1,53 mil. Kč) pokrývá jen MVP a placené tarify. Spolupráce s trenérem, reklamní plochy a tarif pro školy v něm nejsou (ve feature breakdownu jsou Nice to have nebo Out of scope). Skutečný náklad na vývoj Full Release bude vyšší a návratnost delší.

### Náklady

- Do 3 000 uživatelů přesně podle `naklady_provoz.md`; podpora 350 Kč/h, údržba 6 h/měs v 1. roce.
- **Dopočet nad 3 000 uživatelů (můj odhad):**
  - Infrastruktura: Railway škáluje podle RAM a CPU (100 000 MAU ≈ 16 GB RAM a 6 vCPU ≈ 8 700 Kč), Sentry Team, e-maily (týdenní souhrn, ~5 e-mailů na uživatele měsíčně) přes Resend nebo Amazon SES.
  - Videa: ~0,15 Kč na uživatele (20 % uživatelů nahrává, Bunny Stream).
  - Podpora: 50 / 150 / 250 h; s růstem klesá z ~5 na ~2,5 h na 1 000 uživatelů díky FAQ a samoobsluze.
  - Moderace: 30 / 100 / 160 h; klesá z ~3 na ~1,6 h na 1 000 uživatelů.
- Údržba kódu je i u 100 000 uživatelů stejná. To je optimistické: u aplikace s platbami a desítkami tisíc uživatelů bude reálně vyšší.
- Účetnictví a právník (jednorázově, je ve vývoji) se v provozu nepočítají.

### Výnosy

Jednotkové výnosy a podíly vycházejí z Monetizace, přepočtené na ČR/SK a web: ceny v ČR, bez 15% provize obchodů, po DPH 21 % a poplatku Stripe (1,5 % + ~6 Kč za platbu).

| Zdroj       | Čistý výnos                                                                          | Podíl                                                                         |
| ----------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Plus        | ~40 Kč na předplatitele měsíčně (60 % roční 490 Kč, 40 % měsíční 69 Kč)              | 3,5 % psovodů (~3 % MAU; 12 % MAU jsou klienti trenérů a škol s plány zdarma) |
| Trenéři     | ~110 Kč na trenéra (mezi 1. rokem se slevou ~88 Kč a plnou cenou ~132 Kč)            | 0,4 % MAU, 65 % Pro 20 a 35 % Pro+                                            |
| Psí školy   | ~1 290 Kč na školu včetně licencí Plus                                               | počty podle Monetizace (3 / 15 / 30 škol při 10 / 50 / 100 tis. MAU)          |
| Reklamy     | 0,55 Kč na uživatele zdarma (sazba ČR)                                               | ~85 % MAU                                                                     |
| Partnerství | 0,3 Kč na MAU do 3 000, poté 0,5 Kč (Monetizace počítá až 0,8 Kč, ale se zahraničím) | všichni MAU                                                                   |

Kontrola: při 1 000 MAU vychází ~2 400 Kč/měs, Monetizace bez tržiště uvádí 2 300 Kč. Vyšší sloupce jsou nižší než v Monetizaci (ta při 100 000 MAU počítá s 80 % zahraničních uživatelů a 425 900 Kč/měs včetně tržiště).

## 3. Závěry

- **MVP nic nevydělává** a s růstem uživatelů jen roste ztráta (4,6–103 tis. Kč/měs). Hodí se pro ověření produktu na stovkách až nízkých tisících uživatelů, ne pro růst.
- **Full Release je do ~13 500 MAU ve ztrátě** 4–8 tis. Kč/měs. Výnos na uživatele (2,3–3,0 Kč) je pod náklady, dokud se nerozloží podpora a údržba.
- **Vývoj se vrátí až od desítek tisíc uživatelů:** ~34 měsíců při 50 000 MAU, ~12 měsíců při 100 000 MAU. Monetizace upozorňuje, že 100 000 MAU do 2 let zvládne jen malý zlomek aplikací, a jen v ČR/SK je to výrazně těžší.
- **Největší páka je Plus** (~40 % příjmů). Bez něj by Full Release nebyl ziskový ani při 50 000 MAU.
- **Největší náklad jsou lidé:** podpora a moderace tvoří od 10 000 MAU přes 80 % nákladů. Udržet samoobsluhu (FAQ, nahlašování, ověřování trenérů) je klíčové.
