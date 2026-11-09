# Security report – TrainLoop

Datum: 8. 11. 2026 · Stav kódu: `main` po mergi #92 (`c408ec5`) · Issue: #76

Aktualizace: 9. 11. 2026 · Základ kontroly: `main` (`6e72db5`), po `SECURITY.md` a onboardingu #72. Report zahrnuje také aktuální změnu `deploy.yml` v pracovním stromu a ověření potvrzená správcem projektu. Podrobnosti jsou v sekci [7. Aktualizace 9. 11.](#7-aktualizace-9-11-2026).

## Shrnutí

| Oblast                     | Výsledek                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Závislosti                 | 91 upozornění Dependabotu opraveno dřív (#79, #96). Z 18 otevřených tento PR opravuje 15, zbývají 3 s nízkým rizikem (zdůvodnění níže).                      |
| Sledování zranitelností    | Dependabot alerts a týdenní aktualizace npm i GitHub Actions jsou zapnuté. Nově `SECURITY.md` a zapnuté soukromé hlášení zranitelností.                      |
| Izolace dat mezi uživateli | Ověřeno 51 pokusy na všech 49 endpointech, které pracují s ID záznamů: jiný uživatel nemůže cizí data číst, měnit ani mazat. **0 úniků.**                    |
| Přihlášení a session       | Bez přihlášení API vrací 401. Session cookie je `HttpOnly` a `SameSite=Lax`, CORS povoluje jen vlastní frontend.                                             |
| Další nálezy               | Secrets v image: přijaté riziko kvůli omezenému přístupu k prostředí. Deploy podmíněn úspěšným CI. Otevřená zůstává společná fronta videí (nízká závažnost). |

## 1. Závislosti

Upozornění Dependabotu na GitHubu (Security → Dependabot):

- **91 opraveno** aktualizacemi v PR #79 a #96.
- **18 otevřených** před tímto PR: 7 high, 8 medium, 3 low. Všechny jsou v nepřímých závislostech, tedy v balíčcích, které si tahají jiné knihovny, ne my přímo.
- `brotli` ze zadání už v `pnpm-lock.yaml` není.

Tento PR povyšuje zranitelné verze přes `pnpm.overrides` v `package.json`. Povyšuje jen v rámci stejné hlavní verze, což omezuje riziko nekompatibility; funkčnost ověřují kontroly a testy uvedené níže:

| Balíček                 | Upozornění   | Odkud                                                        | Oprava   |
| ----------------------- | ------------ | ------------------------------------------------------------ | -------- |
| `fast-uri` 3.1.5        | 10 (5× high) | `@nestjs/cli` → `ajv`, jen vývojový nástroj                  | → 3.1.9  |
| `postcss` 8.4.31        | 4 (2× high)  | `better-auth` → volitelný peer `next`, aplikace ho nespouští | → 8.5.32 |
| `brace-expansion` 5.0.9 | 1 medium     | ESLint plugin, jen vývojový nástroj                          | → 5.0.12 |

Po změně prošly lint, type-check, build obou aplikací a všech 14 e2e testů.

**Zůstávají 3 upozornění:**

| Balíček            | Závažnost | Proč zůstává                                                                                                                                                                                                                                                                                          |
| ------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `glob` 13.0.6      | medium    | Oprava existuje jen ve verzi 14 a balíček používají `react-email` a `@nestjs/cli`. Vynucení nové hlavní verze uvnitř cizích knihoven by je mohlo rozbít. Zranitelnost se týká jen zrušení hledání souborů přes `AbortSignal` a naše aplikace `glob` sama nevolá. Vyřeší se aktualizací `react-email`. |
| `minimatch` 10.2.6 | medium    | Oprava je jen ve verzi 11. Používá ho jen ESLint při vývoji, do produkce se nedostane.                                                                                                                                                                                                                |
| `deepmerge` 4.3.1  | low       | Opravená verze neexistuje. Používá ho jen `@nestjs/cli` při vývoji.                                                                                                                                                                                                                                   |

## 2. Sledování zranitelností

- **Dependabot alerts** jsou zapnuté. Nová upozornění se zobrazují v záložce Security na GitHubu.
- **Aktualizace verzí** (`.github/dependabot.yml`): každou neděli kontrola npm a GitHub Actions. Minor a patch aktualizace chodí jako jeden společný PR. Prisma 8 je zatím vyloučená.
- **Dependabot security updates** jsou zapnuté; ověření potvrdil správce projektu v aktualizaci reportu z 9. 11. 2026. Přes API s dostupnými právy se nastavení nepodařilo nezávisle ověřit.
- **`SECURITY.md`** (přidáno 8. 11., commit `8cd48e6`) popisuje, jak zranitelnost nahlásit soukromě, co do hlášení patří, pravidla pro testování a jak se hlášení zpracovávají.
- **Soukromé hlášení zranitelností** (Private vulnerability reporting) je zapnuté. API vrací `{"enabled": true}`, takže formulář `/security/advisories/new`, na který odkazuje `SECURITY.md`, funguje.

## 3. Izolace dat mezi uživateli

**Jak to aplikace zajišťuje:** všechny controllery kromě `/api` a `/api/health` mají `AuthenticatedUserGuard`. Vlastník se bere ze session, nikdy z requestu, a každý dotaz do databáze filtruje podle něj (`where: { id, userId }` nebo přes vlastníka psa). Cizí záznam se chová, jako by neexistoval, a API vrací 404. Nikdo tedy nezjistí ani to, jestli dané ID existuje.

**Jak jsem to ověřil:** skriptem proti lokálnímu backendu. Uživatel B (`deepduckthoughts@example.com`) zkoušel pracovat se záznamy uživatele A (`caffeinatedduck@example.com`): psem, disciplínou, cílem, cvičením, tréninkem a lekcí s trenérem.

- **51 pokusů** na všech 49 endpointech, které pracují s ID (přesun a smazání u tréninku i u lekce): čtení, úpravy, archivace, plánování, přesun, dokončení, mazání, nahrání avataru i videa. Requesty měly validní tělo, takže prošly validací a narazily až na kontrolu vlastnictví.
- **Výsledek: všech 51 vrátilo 404.** Data uživatele A zůstala beze změny.
- Seznamy uživatele B (`/dogs`, `/dogs/archived`, `/disciplines`, `/events`, `/overview`, `/users/me/settings`) neobsahují žádné ID uživatele A.

**Automatické testy:**

- **E2e test `apps/frontend/e2e/data-isolation.spec.ts`** opakuje ověření při každé změně v CI. Uživatel A si přes API založí psa, disciplínu s cílem a cvičením a lekci s trenérem. Uživatel B pak zkusí 23 requestů na čtení, úpravy a mazání a všechny musí vrátit 404. Test dál kontroluje, že seznamy uživatele B neobsahují data A a že data A zůstala beze změny. Když izolace selže, test spadne a u každého requestu vypíše, co prošlo (např. `GET dogs/… Expected: 404, Received: 200`).
- Unit testy controllerů kontrolují přístup k cizím datům u disciplín, cílů, přiřazení disciplíny psovi, psů a videí (`disciplines.controller.spec.ts`, `dog-selection.controller.spec.ts`, `dogs.controller.spec.ts`, `videos.service.spec.ts`). U tréninků (`events.service.spec.ts`) zatím chybí. Pokrývá je jen e2e test výše.

## 4. Přihlášení a session

- Bez přihlášení vrací všechny chráněné endpointy **401**.
- Session cookie `better-auth.session_token`: `HttpOnly` (JavaScript ji nepřečte), `SameSite=Lax` (neposílá se z cizích webů při formulářích a AJAXu), platnost 7 dní.
- CORS i `trustedOrigins` v BetterAuth povolují jen adresu vlastního frontendu.
- Aplikace vyžaduje ověřený e-mail.
- Lokálně běží aplikace na HTTP, takže cookie nemá příznak `Secure`. Na stagingu s HTTPS byl příznak **`Secure` ověřen**; potvrzeno správcem projektu 9. 11. 2026.

## 5. Další nálezy

| Nález                                                                                                                                                                                                                                                                                                                                     | Závažnost                     | Stav                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| **Secrets v Docker image.** `GOOGLE_CLIENT_SECRET`, `SMTP_PASSWORD` a `SUPABASE_SECRET_KEY` se předávají při buildu a ukládají do image. Tým nemá přístup ke konfiguraci nasazeného prostředí, takže je nyní nemůže předávat až při spuštění kontejneru. Image je v privátní registry; přístup k ní ale umožňuje přečíst uložené secrets. | Vysoká při zpřístupnění image | Přijaté riziko za současných provozních omezení       |
| **Deploy podmíněný úspěšným CI.** Aktualizovaný `deploy.yml` navazuje na úspěšné CI na `main` a před buildem kontroluje úspěch nejnovějšího CI běhu pro nasazovaný commit. Stejná kontrola platí pro ruční spuštění; checkout používá ověřené SHA.                                                                                        | Střední (původní nález)       | Opraveno v pracovním stromu; účinné po mergi workflow |
| **Společná fronta videí.** Limit 10 zpracovávaných videí platí pro všechny uživatele dohromady (`VIDEO_QUEUE_LIMIT`), takže jeden uživatel ji může zaplnit ostatním.                                                                                                                                                                      | Nízká                         | Otevřeno                                              |

Pokud tým získá přístup ke konfiguraci prostředí, lze secrets přesunout do proměnných předávaných při spuštění a původní hodnoty rotovat. Za současných podmínek jde o přijaté provozní omezení, nikoli o dokončenou technickou nápravu.

## 6. Co zbývá

1. Doplnit unit testy čtení, přesunu a mazání cizích tréninků v `events.service.spec.ts` (sekce 3).
2. Aktualizovat závislosti používající `glob` a `minimatch`, až budou dostupné kompatibilní opravy; sledovat opravu `deepmerge` (sekce 1).
3. Sloučit změnu `deploy.yml`, aby se kontrola úspěšného CI uplatnila při nasazení.
4. Vyřešit sdílený limit fronty videí, například limitem na uživatele (sekce 5).

## 7. Aktualizace 9. 11. 2026

Kontrola proti `main` (`6e72db5`) a GitHub API, doplněná o aktuální změnu workflow a potvrzení správce projektu.

**Nové:**

- `SECURITY.md` a zapnuté soukromé hlášení zranitelností (doplněno do sekce 2).
- Onboarding (#72) přidal `GET` a `PATCH /api/onboarding`. Oba mají `AuthenticatedUserGuard`, pracují jen se stavem přihlášeného uživatele a neberou žádné ID záznamu. Na izolaci dat nemají vliv a počet 49 endpointů s ID platí dál.
- Hook `databaseHooks.user.create.after` v `better-auth.provider.ts` zakládá novému účtu výchozí disciplíny pod `user.id` nově vytvořeného uživatele. Data jiných uživatelů nečte ani nemění.

**Dependabot:**

| Stav      | Počet | Poznámka                                                                                                      |
| --------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| Opravená  | 108   | Původní report: 91 + 15 z PR #100 = 106. O 2 víc.                                                             |
| Zamítnutá | 41    | Zamítnutá jako nepoužívaná (`not_used`): `next` a `sharp`. U `next` je uveden nepoužívaný adaptér BetterAuth. |
| Otevřená  | 3     | Stejná jako v sekci 1: `minimatch` #153, `glob` #143, `deepmerge` #137.                                       |

Opravená verze `glob` je podle Dependabotu `14.0.2`, `minimatch` `11.0.1`. Pro `deepmerge` oprava pořád neexistuje.

**Aktuální stav nálezů a ověření:**

| Oblast                       | Stav                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Secrets v Docker image       | **Přijaté riziko.** Privátní registry omezuje přístup; tým nemá přístup ke konfiguraci nasazeného prostředí. Secrets zůstávají součástí image (sekce 5).         |
| Unit testy cizích tréninků   | **Otevřeno.** Testy odmítnutí cizího psa při plánování existují, testy čtení, přesunu a mazání cizího tréninku chybí.                                            |
| Závislosti                   | **Otevřeno.** Zůstávají upozornění na `glob`, `minimatch` a `deepmerge` se zdůvodněním v sekci 1.                                                                |
| Dependabot security updates  | **Ověřeno správcem projektu.** Potvrzeno v aktualizaci reportu z 9. 11. 2026.                                                                                    |
| Příznak `Secure` na stagingu | **Ověřeno správcem projektu.** Session cookie na HTTPS stagingu má příznak `Secure`; potvrzeno 9. 11. 2026.                                                      |
| Deploy a CI                  | **Opraveno v pracovním stromu.** Workflow vyžaduje úspěšný nejnovější CI běh pro nasazovaný commit na `main`, včetně ručního spuštění. Účinné po mergi workflow. |
| Společná fronta videí        | **Otevřeno.** `VIDEO_QUEUE_LIMIT = 10` v `videos.constants.ts` platí pro všechny uživatele dohromady.                                                            |
