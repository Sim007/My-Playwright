# API‑contractstrategie – Tribe Big Picture

## Doel
Deze strategie beschrijft hoe we **API‑stabiliteit voorkomen** in een landschap van
onafhankelijk ontwikkelde en gedeployde deelsystemen, **intern én extern**.

De focus ligt op:
- preventie van API‑breuken
- duidelijke verantwoordelijkheden
- lock‑vrij releasen
- low‑effort governance

---

## 1. Context en probleemstelling
- Deelsystemen worden **per squad** ontwikkeld en gedeployd
- Op **T/A** draaien alleen **groene releaseversies**
- Deelsystemen zijn zowel **consumer als provider** van API’s
- API‑breuken worden vaak **te laat ontdekt** (op T of later)

**Doel:** API‑breuken voorkomen vóór T/A, niet detecteren erna.

---

## 2. OpenAPI en contract‑testing

### OpenAPI
- Beschrijft **wat is afgesproken**
- Endpoints, schema’s, statuscodes
- Functioneel contract / intentie

### Contract‑testing
- Verifieert **dat de implementatie zich aan de afspraak houdt**
- Automatisch afdwingbaar in CI

> **OpenAPI zonder automatische verificatie is documentatie, geen bescherming.**

---

## 3. Provider‑gericht contractdenken

### Richtingen
- Technische call: `A → B`
- Contract‑relatie: **`B → A`**

Het contract beschrijft:
> *Wat moet de provider (B) garanderen aan consumer (A)*

### Principe
- Contracten worden **georganiseerd per provider‑API**
- Inhoud: consumer‑verwachtingen
- Governance: provider‑verantwoordelijkheid

> **Consumer‑driven in inhoud, provider‑driven in governance**

---

## 4. Eén deelsysteem = consumer én provider
Dit is normaal en gewenst.

Een deelsysteem:
- is **consumer** van API’s van andere deelsystemen
- is **provider** van API’s voor andere deelsystemen

Belangrijk:
- Rollen gelden **per API‑relatie**
- Nooit tegelijk consumer en provider voor dezelfde API

---

## 5. CI‑verantwoordelijkheden (lock‑vrij)

### Consumer‑CI
- Test eigen code
- Tegen **stubs**
- Gebaseerd op contract

Doel:
> “Als de provider zich aan het contract houdt, werkt ons deelsysteem.”

### Provider‑CI
- Verifieert implementatie
- Tegen **alle bekende consumer‑contracten**

Doel:
> “Wij breken geen enkel ander deelsysteem.”

### Lock‑vrij werken
- Nooit testen tegen live deelsystemen
- Alleen tegen **contracten**
- Contracten zijn versieerbaar en asynchroon

> **Locks ontstaan niet door contract‑testing, maar door synchroon releasen.**

---

## 6. Tribe‑niveau contract‑testing (per deelsysteem↔deelsysteem)

Contracten worden vastgelegd:
- per **API tussen deelsystemen**
- niet per individuele service

Voordelen:
- sluit aan op deploy‑eenheid (deelsysteem)
- minder contracten
- beter overzicht
- eenvoudiger governance
- beter beheersbaar door testers

---

## 7. Rol van de T‑omgeving

### Contract‑tests
- Preventie
- Blokkeren breuken vóór deploy

### API‑tests op T
- Extra zekerheid
- Smoke / confidence tests
- Realistische configuratie

> **T is ons vangnet, niet onze rem.**

---

## 8. Externe API’s

### 8.1 Externe API’s die wij consumeren
- Wij zijn consumer
- Provider is buiten onze controle

Aanpak:
- Consumer‑side contracttests
- Test eigen gedrag
- Tolerant en defensief
- Monitoring op afwijkingen

> *We testen ons gedrag, niet hun discipline.*

---

### 8.2 Externe API’s die wij leveren
- Wij zijn provider
- Externe consumers hebben hoge impact

Aanpak:
- Strikte contract‑verificatie
- Backward compatibility verplicht
- Breaking changes = nieuwe versie
- Langere support van oude versies

> **Externe API’s zijn publieke, permanente contracten.**

---

## 9. Eén API intern én extern
Als een API:
- zowel interne als externe consumers heeft

Dan geldt:
> **Behandel de API altijd als extern (publiek).**

Gevolgen:
- Eén OpenAPI
- Eén contractset
- Eén versie‑strategie
- Geen uitzonderingen voor interne consumers

> *De strengste consument bepaalt het regime.*

---

## 10. Low‑effort API‑register

Doel van het register:
- Weten **welke API’s bestaan**
- Wie provider is
- Wie consumers zijn
- Welk regime geldt
- Waar het contract ligt

Minimumvelden:
- API‑naam
- Provider‑deelsysteem
- Consumers (intern / extern)
- API‑type: intern | extern | gemengd
- Contract‑locatie
- Lifecycle‑status

> **Geen vermelding in het API‑register = API bestaat formeel niet.**

---

## 11. Rol van de tester
De tester bewaakt **systeemgedrag**, niet individuele code.

Checklist:
- Is elke inter‑deelsysteem‑API geregistreerd?
- Heeft elke API een contract?
- Zijn provider en consumers expliciet?
- Is het juiste API‑regime toegepast?
- Worden breuken voorkomen vóór T?

---

## 12. Big picture (samenvatting)

- Provider‑gerichte contracten
- Automatische verificatie in CI
- Lock‑vrij, asynchroon releasen
- Preventie vóór detectie
- T als bevestiging, niet als vangrail
- Eén denkmodel voor intern en extern

> **We voorkomen API‑breuken vóór deploy,  
en gebruiken T om te bevestigen dat groene deelsystemen samen werken.**
