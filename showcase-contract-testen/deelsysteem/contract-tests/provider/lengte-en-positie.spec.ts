/**
 * Provider contract test — deelsysteem als provider van scheepslengte en positie.
 *
 * Valideert dat het deelsysteem responses levert die overeenkomen met
 * deelsysteem/openapi.yaml. Zo kunnen afnemers vertrouwen op het gepubliceerde
 * contract.
 *
 * Mock server: Prism op http://localhost:4011
 * Spec:        deelsysteem/openapi.yaml
 */

import { test, expect } from '@playwright/test';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4011';
const BEKENDE_MMSI = '244820000';
const ONBEKENDE_MMSI = '000000001';

// --- AJV setup (OpenAPI 3.1 gebruikt JSON Schema 2020-12) ---
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const specPath = path.resolve(__dirname, '../../../deelsysteem/openapi.yaml');
const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as any;
const API_TITEL = spec?.info?.title ?? 'Onbekende API';
const API_VERSIE = String(spec?.info?.version ?? 'onbekend');

const validateLengteEnPositie = ajv.compile(spec.components.schemas.LengteEnPositie);
const validateFout = ajv.compile(spec.components.schemas.Fout);

// --- Tests ---

test.describe('Provider contract: GET /v1/schepen/{mmsi}/lengte-en-positie', () => {
  test(`Contract metadata — ${API_TITEL} versie ${API_VERSIE}`, async () => {
    expect(API_VERSIE).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('200 — response voldoet aan LengteEnPositie schema', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/v1/schepen/${BEKENDE_MMSI}/lengte-en-positie`,
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    const geldig = validateLengteEnPositie(body);

    expect(
      geldig,
      `AJV validatiefouten:\n${JSON.stringify(validateLengteEnPositie.errors, null, 2)}`,
    ).toBe(true);
  });

  test('200 — mmsi in response komt overeen met gevraagde mmsi', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/v1/schepen/${BEKENDE_MMSI}/lengte-en-positie`,
    );
    const body = await response.json();

    expect(body.mmsi).toBe(BEKENDE_MMSI);
  });

  test('200 — lengte is een positief getal', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/v1/schepen/${BEKENDE_MMSI}/lengte-en-positie`,
    );
    const body = await response.json();

    expect(body.lengte).toBeGreaterThan(0);
  });

  test('200 — coördinaten liggen binnen geldige WGS84-grenzen', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/v1/schepen/${BEKENDE_MMSI}/lengte-en-positie`,
    );
    const body = await response.json();

    expect(body.latitude).toBeGreaterThanOrEqual(-90);
    expect(body.latitude).toBeLessThanOrEqual(90);
    expect(body.longitude).toBeGreaterThanOrEqual(-180);
    expect(body.longitude).toBeLessThanOrEqual(180);
  });

  test('200 — koers ligt tussen 0 en 360 graden', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/v1/schepen/${BEKENDE_MMSI}/lengte-en-positie`,
    );
    const body = await response.json();

    expect(body.koers).toBeGreaterThanOrEqual(0);
    expect(body.koers).toBeLessThanOrEqual(360);
  });

  test('200 — peildatum en tijdstip zijn geldige ISO 8601 datums', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/v1/schepen/${BEKENDE_MMSI}/lengte-en-positie`,
    );
    const body = await response.json();

    expect(new Date(body.peildatum).toString()).not.toBe('Invalid Date');
    expect(new Date(body.tijdstip).toString()).not.toBe('Invalid Date');
  });

  test('404 — response voldoet aan Fout schema', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/v1/schepen/${ONBEKENDE_MMSI}/lengte-en-positie`,
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
