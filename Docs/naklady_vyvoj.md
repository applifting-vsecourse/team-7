# Náklady na vývoj – TrainLoop

## 1. Stručná verze pro Lean Canvas (Cost Structure)

**Vývoj (jednorázově):** tým 4 lidí (UX, IT Lead, PM, QA), dvě navazující fáze:

- **MVP:** úvodní týden + 7 dvoutýdenních sprintů (15 týdnů, rozpočtově ~3,5 měsíce), 10,25 člověkoměsíce. **Realisticky ~1,19 mil. Kč**, rozsah ~0,82–1,53 mil. Kč.
- **Premium:** další 2 dvoutýdenní sprinty (4 týdny, rozpočtově ~1 měsíc), 3,0 člověkoměsíce. **Dodatečně ~0,34 mil. Kč**, rozsah ~0,23–0,43 mil. Kč.
- **MVP + premium celkem:** 19 týdnů, 13,25 člověkoměsíce. **Realisticky ~1,53 mil. Kč**, rozsah ~1,05–1,97 mil. Kč.

Přibližně 98 % nákladů tvoří externí práce; z vývojových nástrojů se samostatně počítá pouze Figma. Původní rezerva 1 sprint je nyní součástí pevného plánu MVP jako sprint 7, nepočítá se podruhé.

### Alokace v čase (agilně se mění podle fáze)

| Role            | MVP: měsíc 1 | MVP: měsíc 2 | MVP: měsíc 3 | MVP: sprint 7 (0,5 měs.) | MVP člověkoměsíce | Premium: sprinty 8–9 (1 měs.) | Premium člověkoměsíce | Celkem člověkoměsíce |
| --------------- | ------------ | ------------ | ------------ | ------------------------ | ----------------- | ----------------------------- | --------------------- | -------------------- |
| IT Lead         | 100 %        | 100 %        | 100 %        | 100 %                    | 3,5               | 100 %                         | 1,0                   | 4,5                  |
| UX designér     | 100 %        | 75 %         | 50 %         | 50 %                     | 2,5               | 50 %                          | 0,5                   | 3,0                  |
| Project Manager | 50 %         | 50 %         | 50 %         | 50 %                     | 1,75              | 50 %                          | 0,5                   | 2,25                 |
| QA              | 25 %         | 75 %         | 100 %        | 100 %                    | 2,5               | 100 %                         | 1,0                   | 3,5                  |
| **Celkem**      |              |              |              |                          | **10,25**         |                               | **3,0**               | **13,25**            |

IT Lead zajišťuje architekturu, FE + BE, CI/CD a platby; UX research, prototypy a uživatelské testy; PM backlog, plánování a komunikaci s PO (Veronika); QA testovací scénáře, manuální a automatické testy a akceptaci. Sprint 7 i premium používají alokaci závěrečné fáze MVP.

Pokud by všichni byli na obou fázích na 100 % (18 člověkoměsíců), náklad na externí práce vzroste v realistickém scénáři o ~494 tis. Kč.

## 3. Zdroje

| Položka                                         | Hodnota                                                                                 | Zdroj                                                                                                                                                                        |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Výchozí hrubé mzdy                              | IT Lead 80/117/150 tis., UX 60/89/115 tis., PM 65/95/120 tis., QA 50/70/90 tis. Kč/měs. | Platy.cz; nízký / střední / vysoký scénář                                                                                                                                    |
| Rozpočtová odměna OSVČ                          | odpovídající hrubá mzda × 1,20                                                          | plánovací předpoklad; potvrdit nabídkami dodavatelů                                                                                                                          |
| Rozlišení dodavatelského vztahu a závislé práce | Rozhoduje skutečný způsob výkonu práce, ne název smlouvy                                | [Státní úřad inspekce práce: Nelegální zaměstnávání, nelegální práce](https://www.suip.cz/informace-ze-zamestnanosti/-/asset_publisher/YK1lEEp7MjdO/content/nelegalni-prace) |
| Figma Professional                              | Full 16 USD, Dev 12 USD, Collab 3 USD / místo / měs                                     | figma.com/pricing                                                                                                                                                            |
| Evidence práce a backlog                        | 0 Kč                                                                                    | GitHub Issues a GitHub Projects                                                                                                                                              |

## 4. Rozpad nákladů

### Lidé – měsíční odměny externích dodavatelů (Kč při 100% alokaci)

| Role            |  Nízký | Střední |  Vysoký |
| --------------- | -----: | ------: | ------: |
| IT Lead         | 96 000 | 140 400 | 180 000 |
| UX designér     | 72 000 | 106 800 | 138 000 |
| Project Manager | 78 000 | 114 000 | 144 000 |
| QA              | 60 000 |  84 000 | 108 000 |

### Lidé – MVP (úvodní týden + sprinty 1–7, Kč)

| Role            | Člověkoměsíce | Nízký       | Střední       | Vysoký        |
| --------------- | ------------- | ----------- | ------------- | ------------- |
| IT Lead         | 3,5           | 336 000     | 491 400       | 630 000       |
| UX designér     | 2,5           | 180 000     | 267 000       | 345 000       |
| Project Manager | 1,75          | 136 500     | 199 500       | 252 000       |
| QA              | 2,5           | 150 000     | 210 000       | 270 000       |
| **Lidé celkem** | **10,25**     | **802 500** | **1 167 900** | **1 497 000** |

### Lidé – premium (dodatečné sprinty 8–9, Kč)

| Role            | Člověkoměsíce | Nízký       | Střední     | Vysoký      |
| --------------- | ------------- | ----------- | ----------- | ----------- |
| IT Lead         | 1,0           | 96 000      | 140 400     | 180 000     |
| UX designér     | 0,5           | 36 000      | 53 400      | 69 000      |
| Project Manager | 0,5           | 39 000      | 57 000      | 72 000      |
| QA              | 1,0           | 60 000      | 84 000      | 108 000     |
| **Lidé celkem** | **3,0**       | **231 000** | **334 800** | **429 000** |

**Externí práce za obě fáze:** 1 033 500 / 1 502 700 / 1 926 000 Kč (nízký / střední / vysoký scénář).

### Nástroje během vývoje (Kč/měs)

| Položka                                   | Kč/měs   |
| ----------------------------------------- | -------- |
| Figma (1× Full pro UX, 1× Dev, 2× Collab) | ~780     |
| GitHub Issues a Projects                  | 0        |
| **Celkem**                                | **~780** |

Hosting, databáze, doména, monitoring a e-maily se rozpočtují v nákladech na provoz, proto se zde znovu nepočítají.

### Jednorázové položky

| Položka                                                                     | Fáze                       | Kč            |
| --------------------------------------------------------------------------- | -------------------------- | ------------- |
| Právník: VOP, GDPR (videa osob), DSA, podmínky prodeje plánů a předplatného | MVP, příprava pro obě fáze | 10 000–30 000 |
| Uživatelské testování MVP (6–8 psovodů, odměna ~500 Kč)                     | MVP                        | 3 000–5 000   |
| Ověření premium s 2–5 uživateli / trenéry (odměna ~500 Kč)                  | Premium                    | 1 000–2 500   |

Sprint 7 je plánovaný sprint stabilizace a spuštění MVP. V žádném scénáři se již nepřičítá další rezerva 1 sprint; případné prodloužení nad sprint 9 vyžaduje navýšení rozpočtu. Cena právníka předpokládá přípravu podmínek pro obě fáze najednou.

Právník je uveden i v nákladech na provoz jako jednorázová položka. Počítat ho jen jednou, tady jako náklad před spuštěním.

## 5. Scénáře (Kč, odděleně podle fáze)

### Souhrn fází

|                          | Nízký         | Realistický   | Vysoký        |
| ------------------------ | ------------- | ------------- | ------------- |
| MVP                      | 818 230       | 1 194 130     | 1 534 730     |
| Premium dodatečně        | 232 780       | 337 080       | 432 280       |
| **Celkem MVP + premium** | **1 051 010** | **1 531 210** | **1 967 010** |

**Konkrétní čísla pro plán: MVP 1,19 mil. Kč + premium 0,34 mil. Kč = celkem 1,53 mil. Kč bez DPH.** Scénáře se liší sazbami a jednorázovými výdaji, délka a alokace týmu jsou ve všech stejné.