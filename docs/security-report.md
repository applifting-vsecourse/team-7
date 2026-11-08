# Security report – TrainLoop

Datum: 8. 11. 2026 · Stav kódu: `main` po mergi #92 (`c408ec5`) · Issue: #76

## Shrnutí

| Oblast                     | Výsledek                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Závislosti                 | 91 upozornění Dependabotu opraveno dřív (#79, #96). Z 18 otevřených tento PR opravuje 15, zbývají 3 s nízkým rizikem (zdůvodnění níže).   |
| Sledování zranitelností    | Dependabot alerts a týdenní aktualizace npm i GitHub Actions jsou zapnuté.                                                                |
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

Po změně prošly lint, type-check, build obou aplikací a všech 13 e2e testů.

**Zůstávají 3 upozornění:**

| Balíček            | Závažnost | Proč zůstává                                                                                                                                                                                                                                                                                          |
| ------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `glob` 13.0.6      | medium    | Oprava existuje jen ve verzi 14 a balíček používají `react-email` a `@nestjs/cli`. Vynucení nové hlavní verze uvnitř cizích knihoven by je mohlo rozbít. Zranitelnost se týká jen zrušení hledání souborů přes `AbortSignal` a naše aplikace `glob` sama nevolá. Vyřeší se aktualizací `react-email`. |
| `minimatch` 10.2.6 | medium    | Oprava je jen ve verzi 11. Používá ho jen ESLint při vývoji, do produkce se nedostane.                                                                                                                                                                                                                |
| `deepmerge` 4.3.1  | low       | Opravená verze neexistuje. Používá ho jen `@nestjs/cli` při vývoji.                                                                                                                                                                                                                                   |

## 2. Sledování zranitelností

- **Dependabot alerts** jsou zapnuté. Nová upozornění se zobrazují v záložce Security na GitHubu.
- **Aktualizace verzí** (`.github/dependabot.yml`): každou neděli kontrola npm a GitHub Actions. Minor a patch aktualizace chodí jako jeden společný PR. Prisma 8 je zatím vyloučená.
- Jestli jsou zapnuté i automatické PR pro bezpečnostní opravy (Dependabot security updates), se přes API s běžnými právy ověřit nedá. Je potřeba zkontrolovat v Settings → Code security.

## 3. Izolace dat mezi uživateli

**Jak to aplikace zajišťuje:** všechny controllery kromě `/api` a `/api/health` mají `AuthenticatedUserGuard`. Vlastník se bere ze session, nikdy z requestu, a každý dotaz do databáze filtruje podle něj (`where: { id, userId }` nebo přes vlastníka psa). Cizí záznam se chová, jako by neexistoval, a API vrací 404. Nikdo tedy nezjistí ani to, jestli dané ID existuje.

**Jak jsem to ověřil:** skriptem proti lokálnímu backendu. Uživatel B (`deepduckthoughts@example.com`) zkoušel pracovat se záznamy uživatele A (`caffeinatedduck@example.com`): psem, disciplínou, cílem, cvičením, tréninkem a lekcí s trenérem.

- **51 pokusů** na všech 49 endpointech, které pracují s ID (přesun a smazání u tréninku i u lekce): čtení, úpravy, archivace, plánování, přesun, dokončení, mazání, nahrání avataru i videa. Requesty měly validní tělo, takže prošly validací a narazily až na kontrolu vlastnictví.
- **Výsledek: všech 51 vrátilo 404.** Data uživatele A zůstala beze změny.
- Seznamy uživatele B (`/dogs`, `/dogs/archived`, `/disciplines`, `/events`, `/overview`, `/users/me/settings`) neobsahují žádné ID uživatele A.

**Automatické testy:** unit testy controllerů kontrolují přístup k cizím datům u disciplín, cílů, přiřazení disciplíny psovi, psů a videí (`disciplines.controller.spec.ts`, `dog-selection.controller.spec.ts`, `dogs.controller.spec.ts`, `videos.service.spec.ts`). U tréninků (`events`) takový test chybí. Chybí i test se dvěma skutečnými uživateli, který by výše popsané ověření opakoval při každé změně (viz bod 6).

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
2. Přidat automatický test se dvěma uživateli, který při každé změně ověří izolaci dat (bod 3), a doplnit unit testy pro tréninky.
3. Aktualizovat `react-email`, až vyjde verze s `glob` 14, a uzavřít zbylé upozornění.
4. Ověřit v Settings → Code security, že jsou zapnuté Dependabot security updates.
5. Na stagingu ověřit, že session cookie má příznak `Secure`.
