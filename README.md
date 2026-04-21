# My-Playwright Monorepo

[![Playwright Link Checks](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/sim007/My-Playwright/actions/workflows/playwright.yml)

Playwright monorepo voor meerdere test showcases met **één centrale installatie**. Druk op één knop en test alles.

Dit bevat `showcase-vaarweginformatie` met tests.

## Inhoudsopgave

- [Vereisten](#vereisten)
- [Monorepo structuur](#monorepo-structuur)
- [Installatie](#installatie)
- [Tests starten](#tests-starten)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Nieuwe showcase toevoegen](#nieuwe-showcase-toevoegen)
- [Docker](#docker)
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

## Veelgebruikte troubleshooting

- `show-report` blijft hangen: Stop draaiende report server en start opnieuw.
- Externe website reageert traag: Run opnieuw; tests bevatten al retry-logica.

## Rapport bekijken

```bash
npx playwright show-report
```
