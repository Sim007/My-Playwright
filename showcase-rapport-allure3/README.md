# Showcase Rapport Allure3

Deze showcase gebruikt dezelfde test als `showcase-simpel`, maar schrijft testresultaten weg in Allure-formaat.
De tests en configuratie in deze showcase zijn TypeScript (`.ts`).

## Installatie

```bash
npm install
```

## Test uitvoeren

```bash
npm test
```

## TypeScript check

```bash
npm run typecheck
```

Na de test staat ruwe Allure data in:

- `allure-results/`

## Allure rapport genereren en openen

```bash
npm run allure:generate
npm run allure:open
```

Het gegenereerde rapport staat in:

- `allure-report/`
