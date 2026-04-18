import { test, expect } from '@playwright/test';

const BASE_URL = 'https://www.vaarweginformatie.nl';

test('Homepage quick links staan in een gele (bijna) paginabrede balk', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });

  const result = await page.evaluate(() => {
    const parseRgb = (value: string): { r: number; g: number; b: number; a: number } | null => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
      if (!match) return null;
      return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: match[4] ? Number(match[4]) : 1,
      };
    };

    const isYellow = (color: string): boolean => {
      const rgb = parseRgb(color);
      if (!rgb || rgb.a === 0) return false;
      return rgb.r >= 160 && rgb.g >= 120 && rgb.b <= 140;
    };

    const isVisible = (el: Element): boolean => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const style = window.getComputedStyle(el as HTMLElement);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
      );
    };

    const headingCandidate = Array.from(
      document.querySelectorAll<HTMLElement>('h1, h2, h3, p, span, div')
    ).find((el) => (el.innerText || el.textContent || '').trim().toLowerCase() === 'vaarweginformatie');

    if (!headingCandidate) {
      return { ok: false, reason: 'Tekst "Vaarweginformatie" niet gevonden op de pagina.' };
    }

    const viewportWidth = window.innerWidth;

    const targetTexts = ['stremmingen', 'ligplaatsen', 'water'];
    const clickableLabels = Array.from(document.querySelectorAll<HTMLElement>('a, button, div, span'))
      .filter((el) => {
        if (!isVisible(el)) return false;
        const text = (el.innerText || el.textContent || '').trim().toLowerCase();
        if (!targetTexts.includes(text)) return false;
        const style = window.getComputedStyle(el);
        return style.cursor === 'pointer' || el.closest('a, button') !== null;
      });

    if (clickableLabels.length < 3) {
      return {
        ok: false,
        reason: 'Niet genoeg klikbare labels (Stremmingen/Ligplaatsen/Water) gevonden.',
        labelsFound: clickableLabels.length,
      };
    }

    const ancestorCandidates = new Set<HTMLElement>();
    for (const item of clickableLabels) {
      let node: HTMLElement | null = item;
      let depth = 0;
      while (node && node !== document.body && depth < 10) {
        ancestorCandidates.add(node);
        node = node.parentElement;
        depth++;
      }
    }

    let best: HTMLElement | null = null;
    for (const candidate of ancestorCandidates) {
      const rect = candidate.getBoundingClientRect();
      if (rect.width < viewportWidth * 0.75 || rect.height < 20) continue;

      const textsInside = Array.from(candidate.querySelectorAll<HTMLElement>('a, button, div, span'))
        .filter((el) => isVisible(el))
        .map((el) => (el.innerText || el.textContent || '').trim().toLowerCase());
      const hasRequiredLinks = targetTexts.every((t) => textsInside.includes(t));
      if (!hasRequiredLinks) continue;

      if (!best || rect.width > best.getBoundingClientRect().width) {
        best = candidate;
      }
    }

    if (!best) {
      return {
        ok: false,
        reason: 'Geen (bijna) paginabrede balk gevonden die de labels bevat.',
      };
    }

    const bestStyle = window.getComputedStyle(best);
    const selfYellowLike =
      isYellow(bestStyle.backgroundColor) ||
      isYellow(bestStyle.borderTopColor) ||
      isYellow(bestStyle.borderBottomColor);

    const yellowInTree = Array.from(best.querySelectorAll<HTMLElement>('*')).some((el) => {
      const style = window.getComputedStyle(el);
      return isYellow(style.backgroundColor) || isYellow(style.borderTopColor) || isYellow(style.borderBottomColor);
    });

    const yellowLike = selfYellowLike || yellowInTree;

    if (!yellowLike) {
      return {
        ok: false,
        reason: 'Quick-link balk gevonden, maar kleur is niet geel.',
        backgroundColor: bestStyle.backgroundColor,
        borderTopColor: bestStyle.borderTopColor,
        borderBottomColor: bestStyle.borderBottomColor,
        yellowInTree,
      };
    }

    return {
      ok: true,
      viewportWidth,
      labelsFound: clickableLabels.length,
    };
  });

  expect(result.ok, JSON.stringify(result, null, 2)).toBeTruthy();
});

test('Zoekfunctie rechtsboven vindt "Rijkswaterstaat"', async ({ page }, testInfo) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });

  const searchInput = page
    .locator('input[placeholder*="Zoeken" i]:visible, input[aria-label*="Zoeken" i]:visible, input[type="search"]:visible')
    .first();

  await expect(searchInput).toBeVisible();
  await searchInput.click();
  await searchInput.fill('');
  await searchInput.pressSequentially('Rijkswaterstaat', { delay: 80 });
  await expect(searchInput).toHaveValue('Rijkswaterstaat');

  const typedScreenshot = await page.screenshot({ fullPage: false });
  await testInfo.attach('search-field-after-typing.png', {
    body: typedScreenshot,
    contentType: 'image/png',
  });

  await searchInput.press('Enter');
  await expect(page.locator('body')).toContainText(/resultaten gevonden voor\s+'Rijkswaterstaat'/i);
});

test('Homepage visual regression', async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });

  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.02,
  });
});
