# Náklady na provoz – TrainLoop

Stav ceníků: říjen 2026. Kurz 23 Kč/USD. Ceny bez DPH.

## 1. Stručná verze pro Lean Canvas (Cost Structure)

**Fixní:** hosting API a DB (Railway), doména, monitoring, e-mail ≈ 1–2 tis. Kč/měs; údržba kódu (záplaty, opravy, aktualizace) nezávisle na počtu uživatelů ≈ 2,4 tis. Kč/měs v 1. roce, od 3. roku ≈ 0,8 tis. Kč/měs.
**Variabilní:** úložiště a přehrávání videí, podpora a moderace trenérů (2–11 tis. Kč/měs); roste s uživateli.
**Celkem provoz (1. rok):** ≈ 5,4 tis. (300 uživ.) / 9 tis. (1 500) / 16,4 tis. Kč/měs (3 000+). Od 3. roku o 1,6 tis. Kč/měs méně.

## 2. Předpoklady

- Čistě webová aplikace (React + NestJS + Postgres), žádné obchody s aplikacemi, trh ČR/SK.
- Backend NestJS a Postgres běží na Railway, přihlašování řeší NestJS samo (bez poplatku). Soubory a obrázky na Cloudflare R2 (10 GB zdarma). Odhad zdrojů (můj předpoklad): API 0,25–1 GB RAM / 0,25–0,5 vCPU a Postgres podobně, ve vyšších scénářích dvojnásobek.
- Příjmy: reklamy, premium bez reklam, měsíční předplatné trenérů (ne prodej plánů).
- Notifikace jen e-mailem, bez propojení s běžeckými aplikacemi.
- Videa ano (trenéři sledují záznamy klientů). Odhad: 20 % uživatelů nahraje 4 videa/měs po 40 MB, každé se přehraje ~2×, úložiště po 12 měsících.
- Lidská práce se počítá v reálných cenách. Hodinové sazby jsou odhad: podpora a moderace 350 Kč/h, vývojář 400 Kč/h.
- Podpora a moderace jsou z velké části samoobslužné: FAQ, kontaktní formulář a nahlašování obsahu uživateli. Hodiny proto pokrývají jen řešení dotazů a nahlášení, ne průběžnou kontrolu obsahu.
- Údržba kódu nezávisí na počtu uživatelů a s ustálením aplikace klesá: 6 h/měs v 1. roce, 4 h/měs ve 2. roce, 2 h/měs od 3. roku.
- Účetnictví se do provozních nákladů nepočítá.
- Scénáře uživatelů: konzervativní ~300, realistický ~1 500, optimistický ~3 000+.

## 3. Ověřené ceníky

| Položka                             | Cena                                                                                                                                              | Zdroj                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Railway Pro (NestJS API + Postgres) | 20 USD/měs za workspace včetně 20 USD kreditu, členové týmu v ceně; využití: RAM 10 USD/GB, CPU 20 USD/vCPU, disk 0,15 USD/GB, přenos 0,05 USD/GB | railway.com/pricing                  |
| Bunny Stream (videa)                | úložiště od 0,01 USD/GB, doručení od 0,005 USD/GB, kódování zdarma, min. 1 USD/měs                                                                | bunny.net/pricing/stream             |
| Cloudflare R2 (alternativa)         | 0,015 USD/GB, přenos zdarma                                                                                                                       | developers.cloudflare.com/r2/pricing |
| Resend (e-maily)                    | zdarma 3 000/měs (100/den), Pro 20 USD/měs za 50 000                                                                                              | resend.com/pricing                   |
| Sentry                              | zdarma (5 000 chyb), Team 26 USD/měs                                                                                                              | sentry.io/pricing                    |

## 4. Rozpad nákladů

### Fixní

| Položka                                                                                     | Kč/měs                     |
| ------------------------------------------------------------------------------------------- | -------------------------- |
| Railway (API + Postgres, 20 USD Pro + využití)                                              | ~500–1 950                 |
| Doména                                                                                      | ~20                        |
| Sentry (zdarma / Team)                                                                      | 0–600                      |
| Resend (zdarma / Pro)                                                                       | 0–460                      |
| **Infrastruktura celkem**                                                                   | **~1 100–2 100**           |
| Údržba kódu (záplaty, opravy, aktualizace závislostí): 6 / 4 / 2 h/měs v 1. / 2. / 3.+ roce | 2 400 / 1 600 / 800        |
| Právník (VOP, GDPR, DSA)                                                                    | jednorázově ~10–30 tis. Kč |

### Variabilní

| Položka           | Poznámka                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Videa             | úložiště + přehrávání jednotky až desítky USD/měs; hlídat limit délky/kvality a mazání starých videí |
| Překročení limitů | Railway (RAM, CPU, přenos při růstu), Resend (e-maily)                                               |
| Podpora uživatelů | roste s počtem uživatelů; 3 / 8 / 20 h ve scénářích                                                  |
| Moderace trenérů  | kontrola nahlášeného obsahu; 2 / 5 / 12 h ve scénářích                                               |

## 5. Scénáře (Kč/měs)

|                                | Konzervativní (~300) | Realistický (~1 500) | Optimistický (~3 000+) |
| ------------------------------ | -------------------- | -------------------- | ---------------------- |
| Infrastruktura fixní           | 1 100                | 1 800                | 2 300                  |
| Videa a přenosy                | 100                  | 200                  | 500                    |
| Podpora (3 / 8 / 20 h)         | 1 050                | 2 800                | 7 000                  |
| Moderace (2 / 5 / 12 h)        | 700                  | 1 750                | 4 200                  |
| Údržba kódu, 1. rok (6 h)      | 2 400                | 2 400                | 2 400                  |
| **Celkem 1. rok**              | **~5 350**           | **~8 950**           | **~16 400**            |
| Na uživatele (1. rok)          | ~18                  | ~6                   | ~5,5                   |
| Celkem 2. rok (údržba 4 h)     | ~4 550               | ~8 150               | ~15 600                |
| Celkem od 3. roku (údržba 2 h) | ~3 750               | ~7 350               | ~14 800                |

## 6. Závěry a rizika

- Technologie je zanedbatelná, rozhodují lidé (podpora, moderace, údržba).
- Break-even v realistickém scénáři (1. rok): při premiu 99 Kč (~82 Kč po DPH 21 %) by bylo potřeba ~110 platících, tedy ~7 % uživatelů. To je pořád nad běžnou konverzí, příjem musí doplnit trenéři a reklamy.
- Videa jsou levná, dokud je omezíme (délka, kvalita, retence).
- Nízké hodiny podpory a moderace stojí na FAQ, nahlašování obsahu a ověřování trenérů. Bez nich by náklady vzrostly zhruba trojnásobně a tyto funkce zvyšují náklady na vývoj.
- Pokles údržby předpokládá stabilní aplikaci bez většího dalšího vývoje; nové funkce se platí z rozpočtu na vývoj.
- Účetnictví (odhadem 2–5 tis. Kč/měs u externí účetní) není zahrnuto; pokud ho nebude řešit tým sám, je potřeba ho připočíst.
- Právní povinnosti: GDPR (videa osob), DSA (nahlašování nelegálního obsahu), fakturace a DPH u trenérských předplatných.
