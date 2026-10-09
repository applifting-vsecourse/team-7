# Náklady na vývoj – TrainLoop

Stav sazeb a ceníků: říjen 2026. Kurz 23 Kč/USD. Ceny bez DPH.

## 1. Stručná verze pro Lean Canvas (Cost Structure)

**Vývoj (jednorázově):** tým 4 lidí (UX, IT Lead, PM, QA), dvě navazující fáze:

- **MVP:** úvodní týden + 7 dvoutýdenních sprintů (15 týdnů, rozpočtově ~3,5 měsíce), 10,25 člověkoměsíce. **Realisticky ~1,19 mil. Kč**, rozsah ~0,82–1,53 mil. Kč.
- **Premium:** další 2 dvoutýdenní sprinty (4 týdny, rozpočtově ~1 měsíc), 3,0 člověkoměsíce. **Dodatečně ~0,34 mil. Kč**, rozsah ~0,23–0,43 mil. Kč.
- **MVP + premium celkem:** 19 týdnů, 13,25 člověkoměsíce. **Realisticky ~1,53 mil. Kč**, rozsah ~1,05–1,97 mil. Kč.

Přibližně 98 % nákladů tvoří externí práce; z vývojových nástrojů se samostatně počítá pouze Figma. Původní rezerva 1 sprint je nyní součástí pevného plánu MVP jako sprint 7, nepočítá se podruhé.

## 2. Předpoklady

- Rozsah MVP = povinné funkce z briefu („Co musí fungovat do konce semestru“): psi a oblasti, cíle a úkoly (větvení, návrat, přeskočení), týdenní kalendář, zápis % úspěšnosti a poznámky (+ video), přehled týdne, zveřejnění a prodej plánu, hodnocení a recenze.
- Rozsah premium je plánovací předpoklad podle příjmového modelu v `naklady_provoz.md`: premium bez reklam a měsíční předplatné trenérů, správa předplatného a přístupových oprávnění. Konkrétní placené funkce a limity se potvrdí s PO před sprintem 8. Prodej plánů z briefu zůstává součástí MVP.
- Webová aplikace; kalkulace práce zachovává původní předpoklad React + Supabase + Vercel. Provozní dokument již počítá s React + NestJS + Postgres na Railway; konečný stack je potřeba sjednotit při úvodním discovery.
- Agilní vývoj, tj. **pevný čas a tým, pružný rozsah**. Náklad je dán hlavně kapacitou týmu, rozsah se prioritizuje po sprintech (MVP první).
- Délka: MVP 15 týdnů (úvodní týden + sprinty 1–7), premium 4 týdny (sprinty 8–9), celkem 19 týdnů. Pro rozpočet zachováváme původní 3 měsíce za úvodní týden a sprinty 1–6; každý další sprint přidává 0,5 měsíce. 1 člověkoměsíc = 21 MD (člověkodní), jde o přibližný kapacitní přepočet, nikoli přesný kalendář.
- Členové týmu jsou počítáni jako samostatní externí dodavatelé na IČO. Rozpočet proto nezahrnuje odvody zaměstnavatele.
- Spolupráce musí být skutečně dodavatelská. Pokud by měla znaky závislé práce (osobní výkon podle pokynů objednatele, v jeho pracovní době a na jeho pracovišti), mohlo by jít o nelegální švarcsystém; v takovém případě je nutný pracovněprávní vztah a jiná kalkulace.
- Rozpočtová odměna OSVČ je stanovena jako odpovídající hrubá mzda × 1,20. Dodavatel tak získá 20 % nad zaměstnaneckou hrubou mzdu na své odvody, neplacené volno, administrativu a vlastní vybavení; objednatel přitom proti zaměstnaneckému nákladu × 1,338 ušetří přibližně 10 %.
- Jde o plánovací předpoklad, který je nutné před zahájením projektu potvrdit konkrétními nabídkami dodavatelů.
- Vývojový hardware a prostory si tým zajišťuje sám, nepočítají se.

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

### MVP – náklady do prvního spuštění

|                                                       | Nízký       | Realistický   | Vysoký        |
| ----------------------------------------------------- | ----------- | ------------- | ------------- |
| Externí práce (10,25 člověkoměsíce, včetně sprintu 7) | 802 500     | 1 167 900     | 1 497 000     |
| Figma (3,5 měs.)                                      | 2 730       | 2 730         | 2 730         |
| Právník                                               | 10 000      | 20 000        | 30 000        |
| Uživatelské testování                                 | 3 000       | 3 500         | 5 000         |
| **MVP celkem**                                        | **818 230** | **1 194 130** | **1 534 730** |

### Premium – dodatečné náklady po spuštění MVP

|                                                | Nízký       | Realistický | Vysoký      |
| ---------------------------------------------- | ----------- | ----------- | ----------- |
| Externí práce (3,0 člověkoměsíce, sprinty 8–9) | 231 000     | 334 800     | 429 000     |
| Figma (1 měs.)                                 | 780         | 780         | 780         |
| Ověření premium s uživateli / trenéry          | 1 000       | 1 500       | 2 500       |
| **Premium dodatečně**                          | **232 780** | **337 080** | **432 280** |

Právník a příprava prostředí jsou již započteni v MVP. Provoz spuštěného MVP během vývoje premium se hradí podle `naklady_provoz.md`, není součástí těchto vývojových nákladů.

### Souhrn obou fází

|                          | Nízký         | Realistický   | Vysoký        |
| ------------------------ | ------------- | ------------- | ------------- |
| MVP                      | 818 230       | 1 194 130     | 1 534 730     |
| Premium dodatečně        | 232 780       | 337 080       | 432 280       |
| **Celkem MVP + premium** | **1 051 010** | **1 531 210** | **1 967 010** |

**Konkrétní čísla pro plán: MVP 1,19 mil. Kč + premium 0,34 mil. Kč = celkem 1,53 mil. Kč bez DPH.** Scénáře se liší sazbami a jednorázovými výdaji, délka a alokace týmu jsou ve všech stejné.

### Orientační srovnání: zaměstnanci

Při stejné alokaci pro obě fáze a hrubé mzdě navýšené o 33,8 % odvodů zaměstnavatele vychází zaměstnanecká kalkulace přibližně na **1,15 / 1,68 / 2,15 mil. Kč za lidi**. Přímí externisté v této kalkulaci stojí **1,03 / 1,50 / 1,93 mil. Kč**, tedy přibližně o 10 % méně. Agentura by byla oproti přímým externistům typicky dražší.

## 6. Plán sprintů (pro kontext)

| Sprint | Fáze                     | Týdny     | Obsah                                                                                                                                      |
| ------ | ------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 0      | MVP – úvodní týden       | 1         | discovery s Veronikou, user flow, architektura, setup prostředí                                                                            |
| 1      | MVP                      | 2–3       | přihlášení, profil, psi a oblasti; UX prototyp cílů a kalendáře                                                                            |
| 2      | MVP                      | 4–5       | cíle a úkoly vč. větvení / návratu / přeskočení                                                                                            |
| 3      | MVP                      | 6–7       | týdenní kalendář, přehled týdne napříč oblastmi                                                                                            |
| 4      | MVP                      | 8–9       | zápis % a poznámky, upload videa, historie                                                                                                 |
| 5      | MVP                      | 10–11     | marketplace: zveřejnění, hledání podle kategorií, nákup (Stripe Connect – provize z prodeje)                                               |
| 6      | MVP                      | 12–13     | hodnocení a recenze, integrace a první uživatelské testy                                                                                   |
| **7**  | **MVP – přidaný sprint** | **14–15** | **opravy podle testů, stabilizace plateb, regresní testy, akceptace a spuštění MVP**                                                       |
| **8**  | **Premium**              | **16–17** | **placené tarify pro uživatele a trenéry, předplatné, přístupová oprávnění, vypnutí reklam pro premium**                                   |
| **9**  | **Premium**              | **18–19** | **správa a rušení předplatného, zpracování změn stavu plateb, testy placených oprávnění a plateb, ověření s uživateli a spuštění premium** |

MVP se spouští na konci týdne 15; premium navazuje a spouští se na konci týdne 19. Premium předpokládá připravenou platební integraci z MVP a základní reklamní plochy; rozšířená reklamní platforma není v těchto dvou sprintech zahrnuta.

## 7. Závěry a rizika

- **Jediný vývojář je úzké hrdlo.** IT Lead má rozpočtově ~73,5 MD na MVP a dalších 21 MD na premium. Nejrizikovější je marketplace s platbami (Stripe Connect, fakturace, DPH). Sprint 7 je již součástí MVP pro stabilizaci a dokončení; jeho překročení posune navazující premium nebo vyžaduje další rozpočet.
- Pokud bude potřeba držet termín i rozsah, je levnější přidat na 1–2 měsíce dalšího vývojáře než natahovat celý tým.
- Agilní přístup: rozpočet je pevný pro každou fázi, rozsah se mění. Sprinty 8–9 jsou vyhrazené premium. Dotazy autorovi, notifikace a propojení se Stravou zůstávají v backlogu mimo tento rozpočet, pokud nenahradí jinou plánovanou funkci.
- Práce na IČO automaticky neznamená, že jde o legální dodavatelský vztah. Smlouvy i skutečné fungování týmu musí zachovat samostatnost dodavatelů; samotné přejmenování zaměstnanců na OSVČ odvody neodstraňuje legálně.
- Vývoj MVP (~1,19 mil.) odpovídá zhruba 3 rokům provozu v realistickém scénáři (~33 tis. Kč/měs); MVP + premium (~1,53 mil.) zhruba 3,9 roku.
- Studentská varianta (tým nepracuje za odměnu): skutečné výdaje tvoří Figma, právník a uživatelské testování. MVP přibližně 16–38 tis. Kč, premium dodatečně 2–3 tis. Kč, dohromady přibližně 18–41 tis. Kč.
