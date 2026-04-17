# My-Playwright

Playwright testproject om links/buttons op `https://www.vaarweginformatie.nl` te controleren, inclusief detectie van 404-pagina’s.

## Vereisten

- Node.js 18+
- npm

## Installatie

```bash
npm install
npx playwright install chromium
```

## Tests starten

### Aanbevolen schema

- **Elke push/PR (smoke):** kliktest
- **Nightly (deep):** dead-links crawler

In CI staat dit in `.github/workflows/playwright.yml`.

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
