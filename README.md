# My-Playwright Monorepo

[![Playwright Link Checks](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml)

Playwright monorepo voor meerdere test showcases met **één centrale installatie**. Druk op één knop en test alles.

Huidi bevat `showcase-vaarweginformatie` met drie testlagen: smoke kliktest (404-checks), dead-links crawler en visual regressietests.

## Inhoudsopgave

- [Vereisten](#vereisten)
- [Monorepo structuur](#monorepo-structuur)
- [Installatie](#installatie)
- [Tests starten](#tests-starten)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Nieuwe showcase toevoegen](#nieuwe-showcase-toevoegen)
- [Docker](#docker)
- [Beschikbare tests](#beschikbare-tests)
- [Rapport bekijken](#rapport-bekijken)
- [Veelgebruikte troubleshooting](#veelgebruikte-troubleshooting)

## Monorepo structuur

```
My-Playwright/
├── package.json                    (root: gedeelde dependencies)
├── package-lock.json               (root: één lock file)
├── playwright.config.ts            (root: detecteert alle showcases)
├── Dockerfile                      (root: bouwt alles)
├── .github/workflows/playlist.yml  (root: test alles)
│
├── showcase-vaarweginformatie/     (showcase 1)
│   ├── package.json                (workspace: alleen scripts)
│   ├── playwright.config.ts        (showcase config)
│   ├── tests/                      (showcase tests)
│   └── Dockerfile                  (standby: voor standalone build)
│
└── showcase-example/               (showcase N, later toe te voegen)
    ├── package.json
    ├── playwright.config.ts
    └── tests/
```

**Voordelen:**
- 1x `npm install` in root
- Alle showcases delen dezelfde Playwright versie
- Gedeelde eslint, TypeScript config, etc.
- Efficiënte CI/CD (geen dubbele installs)

## Vereisten

- Node.js 18+
- npm

## Installatie

```bash
# Install all dependencies (root + all workspaces)
npm install

# Install Playwright browser
npx playwright install chromium
```

Dat is het. Alle showcases gebruiken nu hetzelfde `node_modules`.

## Tests starten

### Lokaal

#### Alle tests in alle showcases

```bash
npm test
```

#### Tests per showcase

```bash
cd showcase-vaarweginformatie
npm test

# Of via root:
npm test -- showcase-vaarweginformatie
```

#### Smoke tests

```bash
cd showcase-vaarweginformatie
npm run test:smoke
```

#### Visual baseline updaten

```bash
cd showcase-vaarweginformatie
npm run test:visual:update
```

### Via Docker

#### Build image:

```bash
docker build -t my-playwright-tests .
```

#### Run alle tests in alle showcases

```bash
docker run --rm my-playwright-tests
```

#### Run met output naar lokale directories

```bash
docker run --rm \
  -v "$(pwd)/showcase-vaarweginformatie/tests:/app/showcase-vaarweginformatie/tests" \
  -v "$(pwd)/showcase-vaarweginformatie/playwright-report:/app/showcase-vaarweginformatie/playwright-report" \
  -v "$(pwd)/test-results:/app/test-results" \
  my-playwright-tests
```

#### Visual baseline updaten in Docker

```bash
docker run --rm \
  -v "$(pwd)/showcase-vaarweginformatie/tests:/app/showcase-vaarweginformatie/tests" \
  -v "$(pwd)/showcase-vaarweginformatie/playwright-report:/app/showcase-vaarweginformatie/playwright-report" \
  -v "$(pwd)/test-results:/app/test-results" \
  my-playwright-tests npx playwright test showcase-vaarweginformatie/tests/homepage-visual.spec.ts --project=chromium --update-snapshots
```

## GitHub Actions CI/CD

De workflow is generiek voor het gehele monorepo. Open Actions tab → Selecteer `Playwright Link Checks` → `Run workflow` → kies branch → `Run workflow`

### Jobs

| Job | Trigger | Timeout | Wat |
|-----|---------|---------|-----|
| `discover-showcases` | Handmatig | - | Detecteert alle showcase-mappen |
| `test-all` | Handmatig | 120 min | Draait alle tests in alle showcases |

### Artifacts

Na een test run:
- `playwright-reports`: ZIP van alle `playwright-report/` directories van alle showcases

Download via Actions tab.

### Status badge

[![Playwright Link Checks](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml)

In README staat de badge aan de top (koppeert direct naar Actions pagina).

## Nieuwe showcase toevoegen

Wil je een extra showcase toevoegen, bijvoorbeeld `showcase-nieuw`?

### 1. Map aanmaken

```bash
mkdir showcase-nieuw
```

### 2. Minimale `package.json`

```json
{
  "name": "showcase-nieuw",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "playwright test --project=chromium",
    "test:smoke": "playwright test --grep @smoke --project=chromium"
  }
}
```

### 3. `playwright.config.ts`

Kopieer van `showcase-vaarweginformatie/playwright.config.ts` en pas `baseURL` en `testDir` aan:

```typescript
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'https://your-site.nl',
  },
  // ...
});
```

### 4. Tests directory

```bash
mkdir showcase-nieuw/tests
```

Voeg je test files toe (bijv. `homepage.spec.ts`).

### 5. Klaar!

```bash
cd showcase-nieuw
npm test
```

De root config en GitHub Actions workflow detecteren je showcase automatisch.

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
