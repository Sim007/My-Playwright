# My-Playwright

[![Playwright Link Checks](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml)

Playwright testproject voor `https://www.vaarweginformatie.nl` met drie testlagen: een smoke kliktest (404-checks), een nightly dead-links crawler en visual regressietests van de homepage.

De repository bevat lokale run-instructies, Docker-ondersteuning, GitHub Actions CI/CD en Gherkin-beschrijvingen van de beschikbare tests.

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

```gherkin
Feature: Klik + 404 controle op homepage
  Als beheerder van de website
  wil ik dat alle interactieve homepage-elementen valide responses geven
  zodat 404-links snel gevonden worden.

  Scenario: Interactieve targets controleren
    Given de homepage van vaarweginformatie is geladen
    When de test alle links en buttons detecteert en controleert
    Then worden links in dezelfde tab én popup/nieuw tabblad ondersteund
    And worden 404- en andere fouten gerapporteerd
    And bevat de output het aantal gevonden en gecheckte links/buttons

  Scenario: Rapportage van controlelijst
    Given de klikcontrole is uitgevoerd
    When het HTML rapport wordt gegenereerd
    Then is attachment "all-discovered-targets.txt" beschikbaar
    And is attachment "all-checked-urls.txt" beschikbaar
```

Voorbeeld van popup/new-tab actie:
- `OK button popup: [200] Sluisplanning → https://sluisplanning.rws.nl/...`

### 2) `tests/dead-links.spec.ts`

```gherkin
Feature: Dead-links crawler
  Als beheerder van de website
  wil ik interne pagina's automatisch laten crawlen
  zodat dode links vroeg worden gedetecteerd.

  Scenario: Interne links valideren vanaf BASE_URL
    Given de crawler start vanaf BASE_URL
    When interne pagina's worden bezocht tot MAX_PAGES
    And links worden gecontroleerd met HEAD/GET
    Then faalt de test bij 404, 410, 5xx of netwerkfouten
```

Instelbaar:
- `MAX_PAGES` in de testfile bepaalt hoeveel pagina’s gecrawld worden

### 3) `tests/homepage-visual.spec.ts`

```gherkin
Feature: Homepage visual en functionele checks
  Als beheerder van de website
  wil ik visuele en functionele regressies op de homepage detecteren
  zodat layout en zoekfunctie betrouwbaar blijven.

  Scenario: Visual regressie op homepage
    Given de homepage is geladen
    When een full-page screenshot wordt vergeleken met de baseline
    Then moet de visual vergelijking binnen de ingestelde tolerantie blijven

  Scenario: Quick links in gele balk
    Given de quick links op de homepage zichtbaar zijn
    When de layout van de quick links wordt gevalideerd
    Then staan de quick links in een gele (bijna) paginabrede balk

  Scenario: Zoeken op Rijkswaterstaat
    Given het zoekveld rechtsboven is beschikbaar
    When de gebruiker zoekt op "Rijkswaterstaat"
    Then worden relevante zoekresultaten getoond
```

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
