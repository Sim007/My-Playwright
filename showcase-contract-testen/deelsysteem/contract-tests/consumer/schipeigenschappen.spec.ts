/**
 * Consumer contract test — deelsysteem als consument van het Scheepsregister.
 *
 * Valideert dat de Scheepsregister API responses levert die overeenkomen met
 * scheepsregister/openapi.yaml. Zo weet het deelsysteem dat het contract
 * waarop het vertrouwt daadwerkelijk wordt nagekomen.
 *
 * Mock server: Prism op http://localhost:4010
 * Spec:        scheepsregister/openapi.yaml
 */

import { test, expect } from '@playwright/test';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4010';
const BEKENDE_MMSI = '244820000';
const ONBEKENDE_MMSI = '000000001';

// --- AJV setup (OpenAPI 3.1 gebruikt JSON Schema 2020-12) ---
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const specPath = path.resolve(__dirname, '../../../scheepsregister/openapi.yaml');
const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as any;
const API_TITEL = spec?.info?.title ?? 'Onbekende API';
const API_VERSIE = String(spec?.info?.version ?? 'onbekend');

const validateSchip = ajv.compile(spec.components.schemas.Schip);
const validateFout = ajv.compile(spec.components.schemas.Fout);

// --- Tests ---

test.describe('Consumer contract: GET /v1/schepen/{mmsi}', () => {
  test(`Contract metadata — ${API_TITEL} versie ${API_VERSIE}`, async () => {
    expect(API_VERSIE).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('200 — response voldoet aan Schip schema', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/v1/schepen/${BEKENDE_MMSI}`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    const geldig = validateSchip(body);

    expect(
      geldig,
      `AJV validatiefouten:\n${JSON.stringify(validateSchip.errors, null, 2)}`,
    ).toBe(true);
  });

  test('200 — mmsi in response komt overeen met gevraagde mmsi', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/v1/schepen/${BEKENDE_MMSI}`);
    const body = await response.json();

    expect(body.mmsi).toBe(BEKENDE_MMSI);
  });

  test('200 — scheepstype is een toegestane enum-waarde', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/v1/schepen/${BEKENDE_MMSI}`);
    const body = await response.json();

    expect(['tanker', 'vrachtschip', 'passagiersschip']).toContain(body.type);
  });

  test('200 — vlag heeft formaat ISO 3166-1 alpha-2', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/v1/schepen/${BEKENDE_MMSI}`);
    const body = await response.json();

    expect(body.vlag).toMatch(/^[A-Z]{2}$/);
  });

  test('200 — afmetingen zijn positieve getallen', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/v1/schepen/${BEKENDE_MMSI}`);
    const body = await response.json();

    expect(body.lengte).toBeGreaterThan(0);
    expect(body.breedte).toBeGreaterThan(0);
    expect(body.diepgang).toBeGreaterThan(0);
  });

  test('404 — response voldoet aan Fout schema', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/v1/schepen/${ONBEKENDE_MMSI}`,
      { headers: { Prefer: 'code=404' } },
    );

    expect(response.status()).toBe(404);

    const body = await response.json();
    const geldig = validateFout(body);

    expect(
      geldig,
      `AJV validatiefouten:\n${JSON.stringify(validateFout.errors, null, 2)}`,
    ).toBe(true);
  });
});
