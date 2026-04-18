import { test, expect, request } from '@playwright/test';

const BASE_URL = 'https://www.vaarweginformatie.nl';

// Max aantal pagina's om te crawlen (verhoog voor een volledige scan)
const MAX_PAGES = 300;

test('Geen dode links op vaarweginformatie.nl', async ({ page }) => {
  const visited = new Set<string>();
  const deadLinks: { page: string; link: string; status: number | string }[] = [];
  const queue: string[] = [BASE_URL];

  const apiContext = await request.newContext({
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'User-Agent': 'Mozilla/5.0 (compatible; DeadLinkChecker/1.0)',
    },
  });

  const normalizeUrl = (href: string, base: string): string | null => {
    try {
      const url = new URL(href, base);
      // Alleen http(s) links, geen mailto/tel/javascript
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      // Verwijder fragment
      url.hash = '';
      return url.toString();
    } catch {
      return null;
    }
  };

  const checkLink = async (url: string): Promise<number | string> => {
    try {
      const response = await apiContext.head(url, { timeout: 10_000 });
      // Sommige servers accepteren geen HEAD, probeer dan GET
      if (response.status() === 405) {
        const getResponse = await apiContext.get(url, { timeout: 10_000 });
        return getResponse.status();
      }
      return response.status();
    } catch (e: unknown) {
      return e instanceof Error ? e.message : String(e);
    }
  };

  let crawledCount = 0;

  while (queue.length > 0 && crawledCount < MAX_PAGES) {
    const currentUrl = queue.shift()!;
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);
    crawledCount++;

    console.log(`[${crawledCount}/${MAX_PAGES}] Crawlen: ${currentUrl}`);

    try {
      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    } catch (e) {
      console.warn(`  Kon pagina niet laden: ${currentUrl} — ${e}`);
      continue;
    }

    // Verzamel alle hrefs op de pagina
    const hrefs = await page.$$eval('a[href]', (anchors) =>
      anchors.map((a) => (a as HTMLAnchorElement).href)
    );

    for (const href of hrefs) {
      const normalized = normalizeUrl(href, currentUrl);
      if (!normalized) continue;

      if (visited.has(normalized)) continue;

      const isInternal = normalized.startsWith(BASE_URL);

      // Controleer de link
      const status = await checkLink(normalized);
      const isError =
        typeof status === 'string' ||
        status === 404 ||
        status === 410 ||
        (status >= 500 && status <= 599);

      if (isError) {
        console.error(`  DODE LINK gevonden: ${normalized} (status: ${status}) op pagina: ${currentUrl}`);
        deadLinks.push({ page: currentUrl, link: normalized, status });
      } else {
        console.log(`  OK [${status}]: ${normalized}`);
      }

      // Interne pagina's in de wachtrij zetten voor verdere crawl
      if (isInternal && !visited.has(normalized)) {
        queue.push(normalized);
      }
    }
  }

  await apiContext.dispose();

  if (deadLinks.length > 0) {
    const report = deadLinks
      .map((d) => `  [${d.status}] ${d.link}\n       gevonden op: ${d.page}`)
      .join('\n');
    console.error(`\nDode links gevonden:\n${report}`);
  } else {
    console.log('\nGeen dode links gevonden!');
  }

  expect(deadLinks, `Dode links gevonden:\n${JSON.stringify(deadLinks, null, 2)}`).toHaveLength(0);
});
