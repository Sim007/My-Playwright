# Showcase Contract Testen

Contract testing showcase voor het scheepvaartdomein. Demonstreert hoe je met
**OpenAPI 3.1 specs**, **Prism mock servers** en **Playwright + AJV** contract
tests schrijft zonder afhankelijkheid van een live backend of Docker.

## Structuur

```
showcase-contract-testen/
├── scheepsregister/
│   └── openapi.yaml          # Spec van het externe Scheepsregister
└── deelsysteem/
    ├── openapi.yaml           # Spec van het eigen deelsysteem
    └── contract-tests/
        ├── provider/
        │   └── lengte-en-positie.spec.ts   # Provider contract test
        └── consumer/
            └── schipeigenschappen.spec.ts  # Consumer contract test
```

## Rollen

| Rol | Systeem | Endpoint |
|-----|---------|----------|
| Consumer | Deelsysteem → Scheepsregister | `GET /v1/schepen/{mmsi}` |
| Provider | Deelsysteem → eigen afnemers | `GET /v1/schepen/{mmsi}/lengte-en-positie` |

## Installatie

```bash
npm install
```

## Mock servers starten

De mock servers draaien op basis van de OpenAPI specs via Prism — geen Docker,
geen implementatie nodig. Prism genereert responses op basis van de
`example`-waarden in de specs.

```bash
# Scheepsregister mock — poort 4010
npm run mock:scheepsregister

# Deelsysteem mock — poort 4011
npm run mock:deelsysteem

# Beide tegelijk
npm run mock:all
```

Voorbeeld request na opstarten:

```bash
curl http://localhost:4010/v1/schepen/244820000
curl http://localhost:4011/v1/schepen/244820000/lengte-en-positie
```

## Contract tests uitvoeren

De Playwright tests valideren responses met **AJV** tegen de OpenAPI schemas.

```bash
npx playwright test
```

## Leesbaar txt rapport

Bij het runnen van de contract tests wordt automatisch een leesbaar txt rapport
gemaakt, ook via de Testing view in VS Code.

Pad:

```
showcase-contract-testen/test-results/contract-report.txt
```

Na sync op een andere machine (zoals Windows):

```bash
npm install
```

## Tooling

| Tool | Doel |
|------|------|
| [Prism](https://stoplight.io/open-source/prism) | Spec-driven mock server op basis van OpenAPI |
| [Playwright](https://playwright.dev) | Testrunner voor de contract tests |
| [AJV](https://ajv.js.org) | JSON Schema validatie van API responses |
| [ajv-formats](https://github.com/ajv-validator/ajv-formats) | Formaat-validatie (`date-time`, etc.) |
| [concurrently](https://github.com/open-cli-tools/concurrently) | Meerdere npm scripts tegelijk starten |

## OpenAPI specs

Beide specs voldoen aan **OpenAPI 3.1.0** en zijn strict opgesteld:

- `additionalProperties: false` — onverwachte velden laten AJV falen
- Alle velden `required` tenzij expliciet anders
- Realistische `example`-waarden op elk veld — direct bruikbaar door Prism
- HTTP `200` en `404` responses per endpoint
