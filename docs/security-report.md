# Security report – TrainLoop

Datum: 8. 11. 2026 · Stav kódu: `main` po mergi #92 (`c408ec5`) · Issue: #76

Aktualizace: 9. 11. 2026 · Stav kódu: `main` (`6e72db5`), po `SECURITY.md` a onboardingu #72. Změny proti původní verzi jsou v sekci [7. Aktualizace 9. 11.](#7-aktualizace-9-11-2026), otevřené otázky k ověření v sekci [8](#8-otázky-k-ověření).

## Shrnutí

| Oblast                     | Výsledek                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Závislosti                 | 91 upozornění Dependabotu opraveno dřív (#79, #96). Z 18 otevřených tento PR opravuje 15, zbývají 3 s nízkým rizikem (zdůvodnění níže).   |
| Sledování zranitelností    | Dependabot alerts a týdenní aktualizace npm i GitHub Actions jsou zapnuté. Nově `SECURITY.md` a zapnuté soukromé hlášení zranitelností.   |
| Izolace dat mezi uživateli | Ověřeno 51 pokusy na všech 49 endpointech, které pracují s ID záznamů: jiný uživatel nemůže cizí data číst, měnit ani mazat. **0 úniků.** |
| Přihlášení a session       | Bez přihlášení API vrací 401. Session cookie je `HttpOnly` a `SameSite=Lax`, CORS povoluje jen vlastní frontend.                          |
| Další nálezy               | 1 vysoká závažnost (secrets v Docker image), 1 střední (deploy nečeká na CI), 1 nízká.                                                    |

## 1. Závislosti

Upozornění Dependabotu na GitHubu (Security → Dependabot):

- **91 opraveno** aktualizacemi v PR #79 a #96.
- **18 otevřených** před tímto PR: 7 high, 8 medium, 3 low. Všechny jsou v nepřímých závislostech, tedy v balíčcích, které si tahají jiné knihovny, ne my přímo.
- `brotli` ze zadání už v `pnpm-lock.yaml` není.

Tento PR povyšuje zranitelné verze přes `pnpm.overrides` v `package.json`. Povyšuje jen v rámci stejné hlavní verze, takže nehrozí změny chování:

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
- Jestli jsou zapnuté i automatické PR pro bezpečnostní opravy (Dependabot security updates), se přes API s běžnými právy ověřit nedá. Je potřeba zkontrolovat v Settings → Code security. `SECURITY.md` uvádí, že zapnuté jsou (viz otázka 1 v sekci 8).
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
- Lokálně běží na HTTP, takže cookie nemá příznak `Secure`. Na stagingu s HTTPS ho BetterAuth nastaví sám. Ověřit při příštím nasazení.

## 5. Další nálezy

| Nález                                                                                                                                                                                                                                                                                                                                                      | Závažnost | Stav             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------- |
| **Secrets jsou zapečené v Docker image.** `SMTP_PASSWORD`, `GOOGLE_CLIENT_SECRET` a `SUPABASE_SECRET_KEY` se předávají jako build argumenty a ukládají do image (`apps/backend/Dockerfile.deploy`). Kdo může image stáhnout z registry, přečte je přes `docker inspect`. Řešení: předávat je až při spuštění kontejneru jako proměnné prostředí v Coolify. | Vysoká    | Otevřeno         |
| **Deploy nečeká na úspěšné CI.** `deploy.yml` se spouští po každém pushi do `main` a `main` nemá povinné kontroly. Rozbitý kód se tak může nasadit.                                                                                                                                                                                                        | Střední   | Řeší se (kolega) |
| **Společná fronta videí.** Limit 10 zpracovávaných videí platí pro všechny uživatele dohromady (`VIDEO_QUEUE_LIMIT`), takže jeden uživatel ji může zaplnit ostatním.                                                                                                                                                                                       | Nízká     | Otevřeno         |

## 6. Co zbývá

1. Přesunout secrets z Docker image do proměnných prostředí v Coolify (bod 5).
2. Doplnit unit testy přístupu k cizím tréninkům v `events.service.spec.ts` (bod 3).
3. Aktualizovat `react-email`, až vyjde verze s `glob` 14, a uzavřít zbylé upozornění.
4. Ověřit v Settings → Code security, že jsou zapnuté Dependabot security updates.
5. Na stagingu ověřit, že session cookie má příznak `Secure`.

## 7. Aktualizace 9. 11. 2026

Kontrola proti `main` (`6e72db5`) a GitHub API.

**Nové:**

- `SECURITY.md` a zapnuté soukromé hlášení zranitelností (doplněno do sekce 2).
- Onboarding (#72) přidal `GET` a `PATCH /api/onboarding`. Oba mají `AuthenticatedUserGuard`, pracují jen se stavem přihlášeného uživatele a neberou žádné ID záznamu. Na izolaci dat nemají vliv a počet 49 endpointů s ID platí dál.
- Hook `databaseHooks.user.create.after` v `better-auth.provider.ts` zakládá novému účtu výchozí disciplíny pod `user.id` nově vytvořeného uživatele. Data jiných uživatelů nečte ani nemění.

**Dependabot:**

| Stav      | Počet | Poznámka                                                                |
| --------- | ----- | ----------------------------------------------------------------------- |
| Opravená  | 108   | Původní report: 91 + 15 z PR #100 = 106. O 2 víc.                       |
| Zamítnutá | 41    | V původním reportu nejsou zmíněná (viz otázka 2).                       |
| Otevřená  | 3     | Stejná jako v sekci 1: `minimatch` #153, `glob` #143, `deepmerge` #137. |

Opravená verze `glob` je podle Dependabotu `14.0.2`, `minimatch` `11.0.1`. Pro `deepmerge` oprava pořád neexistuje.

**Stav bodů ze sekce 6:**

| Bod                             | Stav                                                                                                                                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Secrets v Docker image       | **Otevřeno.** `apps/backend/Dockerfile.deploy` pořád má `ARG`/`ENV` pro `GOOGLE_CLIENT_SECRET`, `SMTP_PASSWORD` a `SUPABASE_SECRET_KEY`.                                                             |
| 2. Unit testy cizích tréninků   | **Otevřeno.** `events.service.spec.ts` se od reportu nezměnil. Testy odmítnutí cizího psa při plánování tam jsou, testy čtení, přesunu a mazání cizího tréninku chybí.                               |
| 3. `react-email` a `glob` 14    | **Otevřeno.** Upozornění #143 trvá.                                                                                                                                                                  |
| 4. Dependabot security updates  | **Neověřeno.** API s běžnými právy vrací 404. `SECURITY.md` tvrdí, že jsou zapnuté.                                                                                                                  |
| 5. Příznak `Secure` na stagingu | **Neověřeno.**                                                                                                                                                                                       |
| Deploy nečeká na CI (sekce 5)   | **Otevřeno.** `deploy.yml` se spouští na každý push do `main`. Na `main` platí jen pravidla `deletion`, `non_fast_forward` a `copilot_code_review`, povinné kontroly (required status checks) chybí. |
| Společná fronta videí (sekce 5) | **Otevřeno.** `VIDEO_QUEUE_LIMIT = 10` v `videos.constants.ts`, beze změny.                                                                                                                          |

## 8. Otázky k ověření

1. **Dependabot security updates:** jsou v Settings → Code security opravdu zapnuté, jak uvádí `SECURITY.md`? Pokud ano, bod 4 v sekci 6 uzavřít.
2. **41 zamítnutých upozornění:** kdo je zamítl a s jakým důvodem? Patří do reportu, nebo jde o duplicity či upozornění, která zmizela aktualizací?
3. **Deploy a CI:** jak daleko je kolega s navázáním `deploy.yml` na úspěšné CI? Bude to `workflow_run` po CI, nebo povinné kontroly na `main`?
4. **Secrets v image:** kdo přesune `GOOGLE_CLIENT_SECRET`, `SMTP_PASSWORD` a `SUPABASE_SECRET_KEY` do proměnných prostředí v Coolify, a dá se ověřit, že starší image v registry už nejsou dostupné (nebo secrets po přesunu rotovat)?
5. **Cookie `Secure`:** má na stagingu (`https://team-7.vsepractical.applifting.dev`) session cookie `better-auth.session_token` příznak `Secure`?
6. **Kontakty v `SECURITY.md`:** odkazuje na `README.md#team`. Sekce Team v README existuje. Jsou v ní aktuální správci, kteří umí zřídit soukromý kanál?
