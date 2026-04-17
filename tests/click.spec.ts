import { test, expect, BrowserContext } from '@playwright/test';

const BASE_URL = 'https://www.vaarweginformatie.nl';
const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  '[role="button"]:not([disabled])',
  'input[type="button"]:not([disabled])',
  'input[type="submit"]:not([disabled])',
  '[onclick]',
  '[data-href]',
  '[data-url]',
].join(', ');

interface ClickResult {
  element: string;
  href: string;
  status: number | string;
}

interface TargetElement {
  domIndex: number;
  type: 'link' | 'button';
  label: string;
  href: string;
}

interface UrlReportEntry {
  type: 'link' | 'button';
  label: string;
  href: string;
  status: number | string;
}

function normalizeUrl(rawUrl: string, baseUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

async function checkUrlStatus(context: BrowserContext, url: string): Promise<number | string> {
  const tab = await context.newPage();
  try {
    const response = await tab.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    });
    return response?.status() ?? 0;
  } catch (e: unknown) {
    return e instanceof Error ? e.message : String(e);
  } finally {
    await tab.close();
  }
}

test('Klik op alle links en buttons – rapporteer 404s', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(2_000);

  const targets = await page.$$eval(INTERACTIVE_SELECTOR, (elements) => {
    const isVisible = (el: Element) => {
      const style = window.getComputedStyle(el as HTMLElement);
      const rect = (el as HTMLElement).getBoundingClientRect();
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0 &&
        (el as HTMLElement).getAttribute('aria-hidden') !== 'true'
      );
    };

    return elements
      .map((el, domIndex) => {
        const htmlEl = el as HTMLElement;
        const tagName = htmlEl.tagName.toLowerCase();
        const href = htmlEl.getAttribute('href') || htmlEl.getAttribute('data-href') || htmlEl.getAttribute('data-url') || '';
        const className = htmlEl.className?.toString?.() || '';
        const role = htmlEl.getAttribute('role') || '';
        const label = (
          htmlEl.innerText?.trim() ||
          htmlEl.textContent?.trim() ||
          htmlEl.getAttribute('aria-label') ||
          htmlEl.getAttribute('title') ||
          htmlEl.getAttribute('value') ||
          `${tagName}-${domIndex + 1}`
        ).replace(/\s+/g, ' ').trim();
        const buttonLikeAnchor =
          tagName === 'a' && (
            href.startsWith('javascript:') ||
            href === '#' ||
            role === 'button' ||
            /(^|\s)(btn|button|cta)(\s|$)/i.test(className)
          );

        return {
          domIndex,
          visible: isVisible(el),
          type: tagName === 'a' && !buttonLikeAnchor ? 'link' : 'button',
          label,
          href,
        };
      })
      .filter((item) => item.visible)
      .map(({ visible: _visible, ...item }) => item);
  });

  const totalLinks = targets.filter((target) => target.type === 'link').length;
  const totalButtons = targets.filter((target) => target.type === 'button').length;

  console.log(`  Raw interactieve elementen gevonden : ${targets.length}`);
  console.log('\nGevonden elementen:');
  console.log(`  Links   : ${totalLinks}`);
  console.log(`  Buttons : ${totalButtons}`);
  console.log(`  Totaal  : ${targets.length}`);

  const notFound: ClickResult[] = [];
  const errors: ClickResult[] = [];
  const checkedUrlEntries: UrlReportEntry[] = [];
  let checkedLinks = 0;
  let checkedButtons = 0;

  for (const [index, target] of (targets as TargetElement[]).entries()) {
    const stepTitle = `${String(index + 1).padStart(2, '0')} - ${target.type.toUpperCase()} - ${target.label.substring(0, 60)}`;

    await test.step(stepTitle, async () => {
      if (target.type === 'link' && target.href && !target.href.startsWith('javascript:') && target.href !== '#') {
        const href = normalizeUrl(target.href, BASE_URL);
        if (!href) {
          console.log(`  SKIP link: ${target.label} (ongeldige URL: ${target.href})`);
          return;
        }
        const status = await checkUrlStatus(context, href);
        checkedLinks++;
        const logLabel = `[${status}] ${target.label.substring(0, 60)} → ${href}`;
        checkedUrlEntries.push({ type: 'link', label: target.label, href, status });

        if (status === 404) {
          console.error(`  404 NOT FOUND link: ${logLabel}`);
          notFound.push({ element: target.label, href, status });
        } else if (typeof status === 'number' && status >= 400) {
          console.warn(`  ${status} ERROR link: ${logLabel}`);
          errors.push({ element: target.label, href, status });
        } else if (typeof status === 'string') {
          console.warn(`  ERROR link: ${logLabel}`);
          errors.push({ element: target.label, href, status });
        } else {
          console.log(`  OK link: ${logLabel}`);
        }
        return;
      }

      try {
        let retries = 3;
        let pageLoaded = false;
        while (retries > 0 && !pageLoaded) {
          try {
            await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
            await page.waitForTimeout(500);
            pageLoaded = true;
          } catch {
            retries--;
            if (retries === 0) {
              console.warn(`  SKIP ${target.type}: ${target.label} (pagina kon niet geladen worden)`);
              return;
            }
            await page.waitForTimeout(1_000);
          }
        }

        const currentTargets = page.locator(INTERACTIVE_SELECTOR);
        let count = 0;
        try {
          count = await currentTargets.count();
        } catch {
          console.log(`  SKIP ${target.type}: ${target.label} (kon locator niet tellen)`);
          return;
        }

        if (target.domIndex >= count) {
          console.log(`  SKIP ${target.type}: ${target.label} (niet opnieuw gevonden - index ${target.domIndex} >= count ${count})`);
          return;
        }

        const element = currentTargets.nth(target.domIndex);
        const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5_000 }).catch(() => null);
        const popupPromise = page.waitForEvent('popup', { timeout: 5_000 }).catch(() => null);

        const [, navigation, popup] = await Promise.all([
          element.evaluate((el: HTMLElement) => el.click()).catch(() => null),
          navigationPromise,
          popupPromise,
        ]);

        if (target.type === 'link') checkedLinks++; else checkedButtons++;

        if (popup) {
          await popup.waitForLoadState('domcontentloaded', { timeout: 15_000 }).catch(() => null);
          const href = popup.url();
          const status = href ? await checkUrlStatus(context, href) : 0;
          const logLabel = `[${status}] ${target.label.substring(0, 60)} → ${href}`;
          checkedUrlEntries.push({ type: target.type, label: target.label, href, status });

          if (status === 404) {
            console.error(`  404 NOT FOUND ${target.type} popup: ${logLabel}`);
            notFound.push({ element: target.label, href, status });
          } else if (typeof status === 'number' && status >= 400) {
            console.warn(`  ${status} ERROR ${target.type} popup: ${logLabel}`);
            errors.push({ element: target.label, href, status });
          } else {
            console.log(`  OK ${target.type} popup: ${logLabel}`);
          }

          await popup.close().catch(() => null);
          return;
        }

        if (navigation) {
          const href = navigation.url();
          const status = navigation.status();
          const logLabel = `[${status}] ${target.label.substring(0, 60)} → ${href}`;
          checkedUrlEntries.push({ type: target.type, label: target.label, href, status });

          if (status === 404) {
            console.error(`  404 NOT FOUND ${target.type}: ${logLabel}`);
            notFound.push({ element: target.label, href, status });
          } else if (status >= 400) {
            console.warn(`  ${status} ERROR ${target.type}: ${logLabel}`);
            errors.push({ element: target.label, href, status });
          } else {
            console.log(`  OK ${target.type}: ${logLabel}`);
          }
        } else {
          console.log(`  SKIP ${target.type}: ${target.label} (geen navigatie)`);
        }
      } catch (e: unknown) {
        if (target.type === 'link') checkedLinks++; else checkedButtons++;
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`  FOUT ${target.type} klik: ${target.label} — ${msg.substring(0, 100)}`);
        errors.push({ element: target.label, href: target.href || '(onbekend)', status: msg });
      }
    });
  }

  await context.close();

  console.log('\n========== SAMENVATTING ==========');
  console.log(`Gecheckte links   : ${checkedLinks} / ${totalLinks}`);
  console.log(`Gecheckte buttons : ${checkedButtons} / ${totalButtons}`);
  console.log(`Totaal geclickt   : ${checkedLinks + checkedButtons} / ${targets.length}`);

  if (notFound.length === 0) {
    console.log('Geen 404-links gevonden!');
  } else {
    console.log(`\n404-resultaten (${notFound.length}):`);
    notFound.forEach((r) => console.log(`  [404] ${r.element.substring(0, 60)} → ${r.href}`));
  }

  if (errors.length > 0) {
    console.log(`\nOverige fouten (${errors.length}):`);
    errors.forEach((r) => console.log(`  [${r.status}] ${r.element.substring(0, 60)} → ${r.href}`));
  }

  const discoveredTargetsReport = (targets as TargetElement[])
    .map((target, index) => {
      const href = target.href ? (normalizeUrl(target.href, BASE_URL) ?? `(ongeldige href: ${target.href})`) : '(geen href)';
      return `${index + 1}. [${target.type}] ${target.label} -> ${href}`;
    })
    .join('\n');

  const checkedUrlsReport = checkedUrlEntries.length > 0
    ? checkedUrlEntries
        .map((entry, index) => `${index + 1}. [${entry.type}] [${entry.status}] ${entry.label} -> ${entry.href}`)
        .join('\n')
    : 'Geen URLs gecheckt.';

  await testInfo.attach('all-discovered-targets.txt', {
    body: Buffer.from(discoveredTargetsReport),
    contentType: 'text/plain',
  });

  await testInfo.attach('all-checked-urls.txt', {
    body: Buffer.from(checkedUrlsReport),
    contentType: 'text/plain',
  });

  console.log('==================================\n');

  expect(
    notFound,
    `404-links gevonden:\n${notFound.map((r) => `  ${r.href}`).join('\n')}`
  ).toHaveLength(0);
});
