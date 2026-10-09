# Lean Canvas – TrainLoop

**Projekt:** TrainLoop · **Autor:** Tým 7 · **Datum:** 09.10. · **Verze:** 5

## Problém

1. Trénink je roztříštěný: sešit, videa v mobilu a screenshoty pro trenérku nejsou propojené.
2. Nejde porovnat pokrok: poznámky jsou volný text, nedá se zjistit, co fungovalo.
3. Týdenní plán napříč psy a disciplínami se píše stále znovu, něco zůstane pozadu.

## Existující alternativy

- Sešit a tužka, poznámky v telefonu
- Aplikace s hotovými kurzy (Dogo, Woofz, Puppr, PawChamp): bez vlastního plánu i vlastního trenéra
- SW pro trenéry (HeelYeah, Pawgress)

## Řešení

- Vlastní disciplíny → cíle → cvičení, upravitelné kdykoli
- Týdenní kalendář s opakováním a přesunem nesplněných cvičení
- Záznam: úspěšné pokusy z celku (%) a poznámka; historie a graf pokroku
- Trenér vidí plán a záznamy klienta a přiděluje mu plány

Strukturovaný záznam tréninku: % úspěšnosti a poznámka u každého úkolu.

Vše na jednom místě: cíle, úkoly, záznamy i videa pohromadě, s možností sdílet je s trenérkou.

Možnost přiřazovat stejné úkoly i na další dny.

Přehlednost pokroku

## Indikátory

- **Retence:** délka série, odchody po 1./3./12. měsíci
- **Trenéři:** 2–3 propojení klienti v 1. týdnu, konverze ze zkušební verze
- **Tržby:** konverze na Plus ≥ 3,5 %

## Unikátní nabídka hodnoty

**Celý trénink psa na jednom místě: plán na týden, záznam úspěšnosti a pokrok, který vidí i tvůj trenér.**

- Propojení s vlastním trenérem: nemá ho nikdo ze 6 ověřených konkurentů (ti mají jen své interní trenéry)
- Síťový efekt: trenér přivede klienty, ti zůstávají kvůli němu
- Historie tréninků: odchod = ztráta záznamů
- Česky, ceny v Kč, osobní kontakty s českými trenéry

Pro trenéra: víš, jak klienti trénují doma, ne jen to, co ukážou na lekci.

## Srozumitelný popis

Týdenní plánovač a tréninkový deník pro psa, do kterého nahlíží i trenér.

## Neférová výhoda

- Nemáme :(

## Cesty k zákazníkům

- **Přes trenéry:** pozvánka klientovi odkazem (hlavní kanál)
- Přímé oslovení trenérů a psích klubů
- Sdílení plánů odkazem, katalog bezplatných plánů
- Komunity sportovních psovodů

## Zákazníci

- **Uživatelé (zdarma):** psovodi, kteří plánují trénink svého psa, a klienti trenérů
- **Plus:** aktivní psovodi s více psy nebo plány/disciplínami (canicross, nosework, agility)
- **Pro:** Trenéři
- **Psí školy:** Licence pro své trenéry - zdarma/plus jejich zákazníci

## První vlaštovky

- Psovodi jako Verča, kteří trénují s trenérkou a posílají jí screenshoty sešitu
- Trenéři s prodlouženou zkušební verzí a jejich klienti
- Psí školy, jejich trenéři a klienti

## Struktura nákladů

- **Provoz** (hosting, DB, doména, e-maily, analytika).
- ->**Fixní:** doména, monitoring, e-mail ≈ 0–1 tis. Kč/měs; údržba kódu (záplaty, opravy, aktualizace) nezávisle na počtu uživatelů ≈ 2,4 tis. Kč/měs v 1. roce, od 3. roku ≈ 0,8 tis. Kč/měs.
- ->**Variabilní:** úložiště a přehrávání videí, podpora a moderace trenérů (2–11 tis. Kč/měs); roste s uživateli.
- ->**Celkem provoz (1. rok):** ≈ 4,3 tis. (300 uživ.) / 7,6 tis. (1 500) / 15,2 tis. Kč/měs (3 000+). Od 3. roku o 1,6 tis. Kč/měs méně.

- **Xtra:** Procenta za platby (zpracování transakcí apod.) 1 - 3% + fixně 3-10 Kč za platbu + 0,7 % Billing.

| **Vývoj:**               | Nízký         | Realistický   | Vysoký        |
| ------------------------ | ------------- | ------------- | ------------- |
| MVP                      | 818 230       | 1 194 130     | 1 534 730     |
| Premium dodatečně        | 232 780       | 337 080       | 432 280       |
| **Celkem MVP + premium** | **1 051 010** | **1 531 210** | **1 967 010** |

## Cenový model

- **Psovodi:** Zdarma (1 pes, 2 rozpracované cíle) · Plus 89 Kč/měs. nebo 890 Kč/rok (do 5 psů, foto a video, měsíc zdarma).
- **Trenéři:** Pro za 139 Kč/měs. (do 20 psů klientů), Pro MAX za 249 Kč/měs.; klienti trenéra mají dostupné veškeré plány od trenéra.
- **Psí školy:** (S - M - L) 349/650/1290 Kč/měs.
