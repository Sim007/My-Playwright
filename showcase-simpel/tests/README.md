# Playwright Tests - Showcase Simpel

Deze map bevat geautomatiseerde tests voor de Playwright website met behulp van **Playwright Test** en **Gherkin-achtige BDD-syntaxis**.

## 📋 Overzicht

De tests controleren de beschikbaarheid en functionaliteit van de Playwright-website:

- ✅ Website is bereikbaar (HTTP 200)
- ✅ Pagina laadt volledig
- ✅ Paginatitel bevat "Playwright"
- ✅ Navigatiemenu is zichtbaar

## 🛠️ Vereisten

- **Node.js** 18+ (downloadable via [nodejs.org](https://nodejs.org))
- **VS Code** (optioneel maar aanbevolen)
- **npm** (komt mee met Node.js)

## 📦 Setup

### 1. Dependencies installeren

```bash
npm install
```

Dit installeert:
- `@playwright/test` - Playwright Test framework

### 2. Browsers installeren (eenmalig)

```bash
npx playwright install
```

## ▶️ Tests uitvoeren

### Via Terminal (Command Line)

```bash
# Alle tests uitvoeren in headless modus
npm test

# Tests uitvoeren met browser zichtbaar (headed)
npm test:headed

# Snapshots bijwerken
npm test:update
```

### Via VS Code (met extensie)

**Aanbevolen extensie:** [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)

#### Installatie:
1. Open VS Code
2. Ga naar **Extensions** (Ctrl+Shift+X of Cmd+Shift+X)
3. Zoek naar **"Playwright Test for VSCode"** (uitgever: Microsoft)
4. Klik **Install**

#### Gebruik in VS Code:
- **Run test**: Klik op de groene ▶️ pijl naast de test-beschrijving
- **Debug test**: Klik op de rode debugger-knop
- **Watch mode**: Klik op het ogen-icoon om tests automatisch opnieuw uit te voeren bij wijzigingen
- **View report**: Automatisch HTML-report na tests

## 📝 Gherkin Syntax Uitleg

Onze tests gebruiken **Given-When-Then (GWT) BDD-syntaxis** in Playwright:

```typescript
test.describe('Feature beschrijving', () => {
  test('Scenario beschrijving', async ({ page }) => {
    // GIVEN - Setup & voorbereiding
    const response = await page.goto('https://playwright.dev');

    // THEN - Verificatie (verwachtingen)
    expect(response?.status()).toBe(200);

    // WHEN - Actie uitvoeren
    await page.waitForLoadState('networkidle');

    // THEN - Resultaat verificatie
    const title = await page.title();
    expect(title).toContain('Playwright');
  });
});
```

### Gherkin Keywords:

| Keyword | Nederlands | Doel |
|---------|-----------|------|
| **Given** | Gegeven | Setup staat, initiële condities |
| **When** | Wanneer | Actie die de gebruiker uitvoert |
| **Then** | Dan | Verwacht resultaat/verificatie |
| **And** | En | Aanvulling op vorige stap |
| **But** | Maar | Negatieve cases |

### Voorbeeld met Gherkin-structure:

```typescript
test('Homepage laden en controles', async ({ page }) => {
  // Given: gebruiker navigeert naar website
  const response = await page.goto('https://playwright.dev');

  // Then: pagina antwoordt met succes
  expect(response?.status()).toBe(200);

  // When: pagina is volledig geladen
  await page.waitForLoadState('networkidle');

  // Then: titel is correct
  expect(await page.title()).toContain('Playwright');

  // And: navigatie is zichtbaar
  const navbar = page.locator('nav, [role="navigation"]');
  await expect(navbar).toBeVisible();
});
```

## 📊 Test Reports

Na elke test-run wordt automatisch een HTML-rapport gegenereerd:

```bash
# Report openen
npx playwright show-report
```

Dit opent een interactieve viewer met:
- ✓ Geslaagde/mislukte tests
- 🎥 Video opnames van tests
- 📸 Screenshots
- 🔍 Browser traces
- ⏱️ Timing informatie

## 🎯 Test-structuur

```
tests/
├── playwright-availability.spec.ts   # Test voor Playwright site beschikbaarheid
└── README.md                         # Dit bestand
```

## ⚙️ Configuratie

Details staan in [playwright.config.ts](../playwright.config.ts):

- **Timeout**: 30 seconden per test
- **Project**: Chromium browser
- **Reporter**: HTML report
- **Trace**: Opgeslagen bij mislukkingen
- **Parallel**: Tests draaien parallel (sneller)

## 🚀 Snelle Start in VS Code

1. **Open de testfile** in VS Code:
   ```
   showcase-simpel/tests/playwright-availability.spec.ts
   ```

2. **Installeer extensie**: Playwright Test for VSCode (zie boven)

3. **Run test**: Klik groen ▶️ icoon links naast test naam

4. **Debug test**: Klik rode cirkel voor debugging

5. **Bekijk report**: 
   ```bash
   npm run test
   npx playwright show-report
   ```

## 📚 Meer informatie

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [BDD Testing](https://playwright.dev/docs/test-bdd)
- [Playwright Inspector](https://playwright.dev/docs/inspector)

## 💡 Tips

- Gebruik `--headed` flag om browser-interactie zichtbaar te maken
- Gebruik `--debug` voor stap-voor-stap debugging
- Voeg `--workers=1` toe voor sequentiële uitvoering (handig bij debugging)
- Gebruik `page.screenshot()` om screenshots te maken in tests

```bash
# Debug modus starten
npx playwright test --debug

# Met slow motion (500ms per actie)
npx playwright test --headed --headed-slow-motion=500
```

---

**Vragen?** Raadpleeg de [Playwright docs](https://playwright.dev) of voeg issue toe.
