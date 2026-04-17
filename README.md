# My-Playwright

[![Playwright Link Checks](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml)

Playwright testproject om links/buttons op `https://www.vaarweginformatie.nl` te controleren, inclusief detectie van 404-pagina’s.

## Inhoudsopgave

- [Vereisten](#vereisten)
- [Installatie](#installatie)
- [Tests starten](#tests-starten)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Beschikbare tests](#beschikbare-tests)
- [Rapport bekijken](#rapport-bekijken)
- [Structuur](#structuur)
- [Veelgebruikte troubleshooting](#veelgebruikte-troubleshooting)

## Vereisten

- Node.js 18+
- npm

## Installatie

```bash
npm install
npx playwright install chromium
```

## Tests starten

### Via Docker

Build image:

```bash
docker build -t my-playwright-tests .
```

Run alle tests (Chromium):

```bash
docker run --rm my-playwright-tests
```

Run met output naar lokale map (rapport/testresultaten) **en** lokale `tests/` snapshots:

```bash
docker run --rm \
  -v "$(pwd)/tests:/app/tests" \
  -v "$(pwd)/playwright-report:/app/playwright-report" \
  -v "$(pwd)/test-results:/app/test-results" \
  my-playwright-tests
```

Waarom `tests` mount? De visual snapshots (`tests/*-snapshots`) worden daar gelezen/geschreven; zonder deze mount kan de Docker-run falen op ontbrekende Linux snapshot.

Alleen visual baseline updaten in Docker:

```bash
docker run --rm \
  -v "$(pwd)/tests:/app/tests" \
  -v "$(pwd)/playwright-report:/app/playwright-report" \
  -v "$(pwd)/test-results:/app/test-results" \
  my-playwright-tests npx playwright test homepage-visual --project=chromium --update-snapshots
```

### Aanbevolen schema

- **Elke push/PR (smoke):** kliktest
- **Elke push/PR (visual):** homepage visual regressie
- **Nightly (deep):** dead-links crawler

In CI staat dit in `.github/workflows/playwright.yml`.

## GitHub Actions CI/CD

De workflow draait automatisch bij push/PR naar `main` en volgt het aanbevolen schema:

### Jobs

| Job | Trigger | Timeout | Wat |
|-----|---------|---------|-----|
| `smoke-click` | Push / PR | 30 min | Klik test (`npm run test:smoke`) |
| `visual-homepage` | Push / PR | 30 min | Visual regressie (`npm run test:visual`) |
| `nightly-dead-links` | Nightly (02:00 UTC) | 60 min | Dead-links crawler (`npm run test:deep`) |

### Artifacts

Elk na een test run:
- `playwright-report-smoke`: HTML rapport van klik test
- `playwright-report-visual`: HTML rapport van visual tests
- `playwright-report-nightly`: HTML rapport van crawler (nacht)

Download via Actions tab in je GitHub repo.

### Workflow handmatig triggeren

Open Actions tab → Selecteer `Playwright Link Checks` → `Run workflow` → kies branch → `Run workflow`

### Status badge

[![Playwright Link Checks](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml)

In README staat de badge aan de top (koppeert direct naar Actions pagina).

### Alle tests draaien

```bash
npx playwright test --project=chromium
```

### Alleen de klik + 404 test draaien

```bash
npx playwright test click --project=chromium
```

of via script:

```bash
npm run test:smoke
```

### Alleen de dead-links crawler draaien

```bash
npx playwright test dead-links --project=chromium
```

of via script:

```bash
npm run test:deep
```

### Alleen de visual homepage regressie draaien

```bash
npx playwright test homepage-visual --project=chromium
```

of via script:

```bash
npm run test:visual
```

Baseline snapshots updaten:

```bash
npm run test:visual:update
```

### Standaard testscript

```bash
npm test
```

## Beschikbare tests

### 1) `tests/click.spec.ts`

Doel:
- Vindt interactieve elementen op de startpagina (links + buttons)
- Klikt/controleert elke actie
- Ondersteunt navigatie in dezelfde tab én popup/nieuw tabblad
- Rapporteert 404’s en andere fouten

Resultaat in output:
- Aantal gevonden links/buttons
- Aantal gecheckte links/buttons
- Lijst met eventuele 404-resultaten

Voorbeeld van popup/new-tab actie:
- `OK button popup: [200] Sluisplanning → https://sluisplanning.rws.nl/...`

Attachments in HTML rapport:
- `all-discovered-targets.txt`: alle gevonden targets (vooraf)
- `all-checked-urls.txt`: alle gecheckte URL’s met status

### 2) `tests/dead-links.spec.ts`

Doel:
- Crawlt interne pagina’s vanaf `BASE_URL`
- Controleert links met HEAD/GET
- Faalt bij gevonden dode links (404/410/5xx of netwerkfouten)

Instelbaar:
- `MAX_PAGES` in de testfile bepaalt hoeveel pagina’s gecrawld worden

### 3) `tests/homepage-visual.spec.ts`

Doel:
- Visual regressie op de homepage (full-page screenshot)
- Extra layout-check: homepage quick links staan in een gele (bijna) paginabrede balk
- Zoektest: gebruikt het zoekveld rechtsboven en valideert resultaten voor `Rijkswaterstaat`

Gebruik:
- Eerste baseline maken/updaten: `npm run test:visual:update`
- Daarna regressie controleren: `npm run test:visual`

## Rapport bekijken

Genereer eerst een run (bijv. `npx playwright test click --project=chromium`), daarna:

```bash
npx playwright show-report --host 127.0.0.1 --port 9333
```

of:

```bash
npm run report
```

Open vervolgens:

- http://127.0.0.1:9333

## Structuur

- `playwright.config.ts`: Playwright configuratie
- `tests/click.spec.ts`: klik-gebaseerde 404 check
- `tests/dead-links.spec.ts`: crawler-gebaseerde linkcheck
- `tests/homepage-visual.spec.ts`: visual regressie + quick-links balkcheck

## Veelgebruikte troubleshooting

- `show-report` blijft hangen of geeft exitcode 1:
  - Vaak draait er al een report server. Stop die (`Ctrl+C`) en start opnieuw met een vaste poort.
- Externe website reageert traag:
  - Run opnieuw; de test bevat al retry/skip-logica voor instabiele navigaties.
