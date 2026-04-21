# showcase-simpel

Eenvoudige Playwright tests voor het controleren van de beschikbaarheid van de Playwright website.

## Feature beschrijving

```gherkin
Feature: Playwright website beschikbaarheid

  Scenario: Playwright site is bereikbaar en operationeel
    Given de gebruiker navigeert naar "https://playwright.dev"
    When de pagina volledig is geladen
    Then is de HTTP-statuscode 200
    And bevat de paginatitel "Playwright"
    And is het hoofdmenu zichtbaar
```

## Installatie

```bash
npm install
```

## Tests uitvoeren

### Via CLI (Command Line)

```bash
# Standaard tests (headless mode)
npm test

# Tests met zichtbare browser interface
npm run test:headed

# Snapshots updaten
npm run test:update

# Specifieke test file uitvoeren
npx playwright test tests/playwright-availability.spec.ts

# Met verbose output
npx playwright test --verbose
```

### Via VS Code

1. **Playwright Test extension installeren:**
   - Open VS Code Extensions (Ctrl+Shift+X)
   - Zoek naar "Playwright Test for VS Code"
   - Installeer de extension van Microsoft

2. **Test uitvoeren vanuit de editor:**
   - Open `tests/playwright-availability.spec.ts`
   - Klik op het groene **play icon** naast de test naam
   - Of gebruik Ctrl+; Ctrl+T (shortcut voor testen)

3. **Debug modus:**
   - Klik op het **debug icon** (of gebruik Ctrl+; Ctrl+D)
   - De browser opent met debug tools

### HTML Report bekijken

Na het uitvoeren van tests:

```bash
npx playwright show-report
```

Dit opent het HTML report in je standaard browser.

## Testen

- **playwright-availability.spec.ts**: Controleert of de Playwright website bereikbaar is, de juiste HTTP-statuscode (200) heeft, en dat de pagina correct is geladen met zichtbare navigatie.
