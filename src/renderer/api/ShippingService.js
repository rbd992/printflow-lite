// ──────────────────────────────────────────────────────────────────────────────
// PrintFlow Lite v0.1.4 — ShippingService.js
// Multi-Carrier Shipping Integration
// Supports: Canada Post, FedEx, UPS, Purolator, DHL Express
// Covers:   Rate Quotes, Shipments, Labels (PDF/ZPL), Tracking,
//           Address Validation, Pickup Scheduling
// Place in: src/renderer/api/ShippingService.js
// ──────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

// ── Carrier Registry ────────────────────────────────────────────────────────

export const CARRIERS = {
  canada_post: {
    id: 'canada_post',
    name: 'Canada Post',
    logo: '🍁',
    country: 'CA',
    apiBase: 'https://ct.soa-gw.canadapost.ca',       // Production
    sandboxBase: 'https://ct.soa-gw.canadapost.ca',    // Same host, sandbox creds
    authType: 'basic',  // username:password (API key : secret)
    labelFormats: ['PDF', '4x6_PDF', 'ZPL'],
    services: [
      { code: 'DOM.EP',  name: 'Expedited Parcel',        domestic: true },
      { code: 'DOM.RP',  name: 'Regular Parcel',           domestic: true },
      { code: 'DOM.XP',  name: 'Xpresspost',               domestic: true },
      { code: 'DOM.PC',  name: 'Priority',                  domestic: true },
      { code: 'USA.EP',  name: 'Expedited Parcel USA',     international: true },
      { code: 'USA.XP',  name: 'Xpresspost USA',           international: true },
      { code: 'USA.PW.ENV', name: 'Priority Worldwide Envelope USA', international: true },
      { code: 'INT.XP',  name: 'Xpresspost International', international: true },
      { code: 'INT.IP.AIR', name: 'International Parcel Air', international: true },
      { code: 'INT.PW.ENV', name: 'Priority Worldwide Envelope', international: true },
    ],
    features: ['rates', 'shipment', 'label', 'tracking', 'manifest', 'pickup'],
    setupInstructions: {
      title: 'Canada Post API Setup',
      steps: [
        'Go to https://www.canadapost-postescanada.ca/information/app/drc/registered',
        'Sign in or create a Canada Post business account',
        'Navigate to Developer Program → API Keys',
        'Create a new API key set (you\'ll get a Username and Password)',
        'Enter your Customer Number (from your Canada Post commercial account)',
        'Paste the API Username, Password, and Customer Number in PrintFlow settings',
        'For production shipping, ensure your Canada Post commercial account has Parcel Services enabled',
      ],
      fields: [
        { key: 'apiUsername', label: 'API Username', placeholder: 'abc123def456', required: true },
        { key: 'apiPassword', label: 'API Password', placeholder: '0a1b2c3d4e...', required: true, sensitive: true },
        { key: 'customerNumber', label: 'Customer Number', placeholder: '1234567', required: true },
        { key: 'contractNumber', label: 'Contract Number (optional)', placeholder: '0012345678', required: false },
      ],
      helpUrl: 'https://www.canadapost-postescanada.ca/information/app/drc/home',
    },
  },

  fedex: {
    id: 'fedex',
    name: 'FedEx',
    logo: '📦',
    country: 'US',
    apiBase: 'https://apis.fedex.com',
    sandboxBase: 'https://apis-sandbox.fedex.com',
    authType: 'oauth2',
    labelFormats: ['PDF', 'PNG', 'ZPL'],
    services: [
      { code: 'FEDEX_GROUND',             name: 'FedEx Ground' },
      { code: 'FEDEX_EXPRESS_SAVER',       name: 'FedEx Express Saver' },
      { code: 'FEDEX_2_DAY',              name: 'FedEx 2Day' },
      { code: 'STANDARD_OVERNIGHT',        name: 'Standard Overnight' },
      { code: 'PRIORITY_OVERNIGHT',        name: 'Priority Overnight' },
      { code: 'FIRST_OVERNIGHT',           name: 'First Overnight' },
      { code: 'INTERNATIONAL_ECONOMY',     name: 'International Economy' },
      { code: 'INTERNATIONAL_PRIORITY',    name: 'International Priority' },
      { code: 'FEDEX_INTERNATIONAL_GROUND', name: 'FedEx International Ground' },
    ],
    features: ['rates', 'shipment', 'label', 'tracking', 'address_validation', 'pickup'],
    setupInstructions: {
      title: 'FedEx API Setup',
      steps: [
        'Go to https://developer.fedex.com and create a developer account',
        'Create a new project in the FedEx Developer Portal',
        'Select the APIs you need: Ship, Rate, Track, Address Validation',
        'Copy your API Key (Client ID) and Secret Key (Client Secret)',
        'Enter your FedEx Account Number',
        'Paste all credentials into PrintFlow shipping settings',
        'Test with sandbox mode first, then switch to production when ready',
      ],
      fields: [
        { key: 'clientId', label: 'API Key (Client ID)', placeholder: 'l7a1b2c3d4e5...', required: true },
        { key: 'clientSecret', label: 'Secret Key (Client Secret)', placeholder: 'abc123...', required: true, sensitive: true },
        { key: 'accountNumber', label: 'FedEx Account Number', placeholder: '123456789', required: true },
      ],
      helpUrl: 'https://developer.fedex.com/api/en-us/get-started.html',
    },
  },

  ups: {
    id: 'ups',
    name: 'UPS',
    logo: '🟤',
    country: 'US',
    apiBase: 'https://onlinetools.ups.com/api',
    sandboxBase: 'https://wwwcie.ups.com/api',
    authType: 'oauth2',
    labelFormats: ['PDF', 'PNG', 'ZPL', 'GIF'],
    services: [
      { code: '03', name: 'UPS Ground' },
      { code: '02', name: 'UPS 2nd Day Air' },
      { code: '01', name: 'UPS Next Day Air' },
      { code: '13', name: 'UPS Next Day Air Saver' },
      { code: '14', name: 'UPS Next Day Air Early' },
      { code: '12', name: 'UPS 3 Day Select' },
      { code: '11', name: 'UPS Standard (Canada)' },
      { code: '07', name: 'UPS Worldwide Express' },
      { code: '08', name: 'UPS Worldwide Expedited' },
      { code: '54', name: 'UPS Worldwide Express Plus' },
      { code: '65', name: 'UPS Worldwide Saver' },
    ],
    features: ['rates', 'shipment', 'label', 'tracking', 'address_validation', 'pickup', 'time_in_transit'],
    setupInstructions: {
      title: 'UPS API Setup',
      steps: [
        'Go to https://developer.ups.com and sign in with your UPS.com account',
        'Navigate to Apps → Create New App',
        'Select the APIs: Rating, Shipping, Tracking, Address Validation',
        'Copy your Client ID and Client Secret',
        'Enter your UPS Account Number (6 alphanumeric characters)',
        'Paste all credentials into PrintFlow shipping settings',
        'Use sandbox mode for testing before going live',
      ],
      fields: [
        { key: 'clientId', label: 'Client ID', placeholder: 'AbCdEfGh1234...', required: true },
        { key: 'clientSecret', label: 'Client Secret', placeholder: 'xyz789...', required: true, sensitive: true },
        { key: 'accountNumber', label: 'UPS Account Number', placeholder: 'A1B2C3', required: true },
      ],
      helpUrl: 'https://developer.ups.com/get-started',
    },
  },

  purolator: {
    id: 'purolator',
    name: 'Purolator',
    logo: '🔴',
    country: 'CA',
    apiBase: 'https://webservices.purolator.com/EWS/V2',
    sandboxBase: 'https://devwebservices.purolator.com/EWS/V2',
    authType: 'basic',  // Activation Key + Password in SOAP header
    labelFormats: ['PDF', 'ZPL'],
    services: [
      { code: 'PurolatorExpress',          name: 'Purolator Express' },
      { code: 'PurolatorExpress12PM',      name: 'Purolator Express 12PM' },
      { code: 'PurolatorExpress9AM',       name: 'Purolator Express 9AM' },
      { code: 'PurolatorExpressEvening',   name: 'Purolator Express Evening' },
      { code: 'PurolatorGround',           name: 'Purolator Ground' },
      { code: 'PurolatorGround9AM',        name: 'Purolator Ground 9AM' },
      { code: 'PurolatorExpressUS',        name: 'Purolator Express US' },
      { code: 'PurolatorExpressUSLetter',  name: 'Purolator Express US Letter' },
      { code: 'PurolatorExpressInternational', name: 'Purolator Express International' },
    ],
    features: ['rates', 'shipment', 'label', 'tracking', 'pickup'],
    setupInstructions: {
      title: 'Purolator E-Ship API Setup',
      steps: [
        'Contact Purolator E-Ship Solutions at 1-888-SHIP-123 or eship@purolator.com',
        'Request API access — they will provide an Activation Key and Production Key',
        'You\'ll also receive a Billing Account Number',
        'For testing, request sandbox credentials separately',
        'Enter your Activation Key, Password, and Billing Account in PrintFlow settings',
        'Purolator may require a brief technical review before production access',
      ],
      fields: [
        { key: 'activationKey', label: 'Activation Key', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: true },
        { key: 'password', label: 'Password', placeholder: 'Your API password', required: true, sensitive: true },
        { key: 'billingAccount', label: 'Billing Account Number', placeholder: '9999999999', required: true },
        { key: 'registeredAccount', label: 'Registered Account Number', placeholder: '9999999999', required: false },
      ],
      helpUrl: 'https://www.purolator.com/en/business-solutions/e-shipping-solutions',
    },
  },

  dhl: {
    id: 'dhl',
    name: 'DHL Express',
    logo: '🟡',
    country: 'DE',
    apiBase: 'https://express.api.dhl.com/mydhlapi',
    sandboxBase: 'https://express.api.dhl.com/mydhlapi/test',
    authType: 'basic',  // username:password
    labelFormats: ['PDF', 'ZPL'],
    services: [
      { code: 'P', name: 'DHL Express Worldwide' },
      { code: 'D', name: 'DHL Express Worldwide Doc' },
      { code: 'U', name: 'DHL Express Worldwide (ECX)' },
      { code: 'K', name: 'DHL Express 9:00' },
      { code: 'E', name: 'DHL Express 9:00 Doc' },
      { code: 'T', name: 'DHL Express 12:00' },
      { code: 'Y', name: 'DHL Express 12:00 Doc' },
      { code: 'N', name: 'DHL Domestic Express' },
      { code: 'G', name: 'DHL Economy Select' },
      { code: 'W', name: 'DHL Economy Select Doc' },
    ],
    features: ['rates', 'shipment', 'label', 'tracking', 'address_validation', 'pickup', 'customs'],
    setupInstructions: {
      title: 'DHL Express API (MyDHL API) Setup',
      steps: [
        'Go to https://developer.dhl.com and register for a developer account',
        'Navigate to MyDHL API and request access',
        'You\'ll receive API credentials (username and password) via email',
        'Enter your DHL Express account number (typically 9 digits)',
        'Paste API credentials into PrintFlow shipping settings',
        'Test mode uses the sandbox URL automatically — toggle in settings',
        'For customs documentation on international shipments, ensure your DHL account has export privileges',
      ],
      fields: [
        { key: 'apiUsername', label: 'API Username', placeholder: 'your_username', required: true },
        { key: 'apiPassword', label: 'API Password', placeholder: 'your_password', required: true, sensitive: true },
        { key: 'accountNumber', label: 'DHL Account Number', placeholder: '123456789', required: true },
      ],
      helpUrl: 'https://developer.dhl.com/api-reference/dhl-express-mydhl-api',
    },
  },
};


// ── Shared Helpers ──────────────────────────────────────────────────────────

function buildBasicAuth(username, password) {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}

// Browser-safe base64 for renderer process
function btoa64(str) {
  if (typeof Buffer !== 'undefined') return Buffer.from(str).toString('base64');
  return btoa(str);
}

// Standard parcel dimensions for 3D printed parts
export const DEFAULT_PACKAGE = {
  weight: { value: 1.0, unit: 'kg' },
  dimensions: { length: 25, width: 20, height: 15, unit: 'cm' },
};


// ══════════════════════════════════════════════════════════════════════════════
// CANADA POST API
// ══════════════════════════════════════════════════════════════════════════════

export class CanadaPostAPI {
  constructor(credentials, sandbox = false) {
    this.carrier = CARRIERS.canada_post;
    this.customerNumber = credentials.customerNumber;
    this.contractNumber = credentials.contractNumber || '';
    this.http = axios.create({
      baseURL: sandbox ? this.carrier.sandboxBase : this.carrier.apiBase,
      timeout: 30000,
      headers: {
        Authorization: 'Basic ' + btoa64(`${credentials.apiUsername}:${credentials.apiPassword}`),
        Accept: 'application/vnd.cpc.ship.rate-v4+xml',
        'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
        'Accept-language': 'en-CA',
      },
    });
  }

  // ─ Get Rates ─
  async getRates(originPostal, destPostal, parcel = DEFAULT_PACKAGE, destCountry = 'CA') {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
        <customer-number>${this.customerNumber}</customer-number>
        ${this.contractNumber ? `<contract-id>${this.contractNumber}</contract-id>` : ''}
        <parcel-characteristics>
          <weight>${parcel.weight.value}</weight>
          <dimensions>
            <length>${parcel.dimensions.length}</length>
            <width>${parcel.dimensions.width}</width>
            <height>${parcel.dimensions.height}</height>
          </dimensions>
        </parcel-characteristics>
        <origin-postal-code>${originPostal.replace(/\s/g, '')}</origin-postal-code>
        <destination>
          ${destCountry === 'CA'
            ? `<domestic><postal-code>${destPostal.replace(/\s/g, '')}</postal-code></domestic>`
            : destCountry === 'US'
              ? `<united-states><zip-code>${destPostal}</zip-code></united-states>`
              : `<international><country-code>${destCountry}</country-code></international>`
          }
        </destination>
      </mailing-scenario>`;

    const res = await this.http.post(`/rs/ship/price`, xml);
    return this._parseRatesXML(res.data);
  }

  // ─ Create Shipment (Non-Contract or Contract) ─
  async createShipment(shipmentData) {
    const endpoint = this.contractNumber
      ? `/rs/${this.customerNumber}/${this.customerNumber}/shipment`
      : `/rs/${this.customerNumber}/ncshipment`;

    const headers = {
      Accept: 'application/vnd.cpc.ncshipment-v4+xml',
      'Content-Type': 'application/vnd.cpc.ncshipment-v4+xml',
    };

    const xml = this._buildShipmentXML(shipmentData);
    const res = await this.http.post(endpoint, xml, { headers });
    return this._parseShipmentResponse(res.data);
  }

  // ─ Get Label (returns PDF URL) ─
  async getLabel(shipmentId, format = 'PDF') {
    const endpoint = `/rs/${this.customerNumber}/ncshipment/${shipmentId}/label`;
    const res = await this.http.get(endpoint, {
      headers: { Accept: format === 'ZPL' ? 'application/zpl' : 'application/pdf' },
      responseType: 'arraybuffer',
    });
    return { data: res.data, format, contentType: res.headers['content-type'] };
  }

  // ─ Track ─
  async track(trackingNumber) {
    const res = await this.http.get(`/vis/track/pin/${trackingNumber}/summary`, {
      headers: { Accept: 'application/vnd.cpc.track-v2+xml' },
    });
    return this._parseTrackingXML(res.data);
  }

  // ─ Create Manifest (end-of-day) ─
  async createManifest(groupId) {
    const endpoint = `/rs/${this.customerNumber}/${this.customerNumber}/manifest`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <transmit-set xmlns="http://www.canadapost.ca/ws/manifest-v8">
        <group-ids><group-id>${groupId}</group-id></group-ids>
        <cpc-pickup-indicator>true</cpc-pickup-indicator>
        <requested-shipping-point>${this.originPostal || ''}</requested-shipping-point>
      </transmit-set>`;
    const res = await this.http.post(endpoint, xml, {
      headers: {
        Accept: 'application/vnd.cpc.manifest-v8+xml',
        'Content-Type': 'application/vnd.cpc.manifest-v8+xml',
      },
    });
    return res.data;
  }

  // ─ Void Shipment ─
  async voidShipment(shipmentId) {
    return (await this.http.delete(
      `/rs/${this.customerNumber}/ncshipment/${shipmentId}`
    )).data;
  }

  // ─ XML Helpers (simplified — in production use an XML builder library) ─
  _buildShipmentXML(data) {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <non-contract-shipment xmlns="http://www.canadapost.ca/ws/ncshipment-v4">
      <delivery-spec>
        <service-code>${data.serviceCode}</service-code>
        <sender>
          <name>${data.sender.name}</name>
          <company>${data.sender.company || ''}</company>
          <contact-phone>${data.sender.phone}</contact-phone>
          <address-details>
            <address-line-1>${data.sender.address1}</address-line-1>
            ${data.sender.address2 ? `<address-line-2>${data.sender.address2}</address-line-2>` : ''}
            <city>${data.sender.city}</city>
            <prov-state>${data.sender.province}</prov-state>
            <postal-zip-code>${data.sender.postalCode.replace(/\s/g, '')}</postal-zip-code>
            <country-code>CA</country-code>
          </address-details>
        </sender>
        <destination>
          <name>${data.recipient.name}</name>
          <company>${data.recipient.company || ''}</company>
          <address-details>
            <address-line-1>${data.recipient.address1}</address-line-1>
            ${data.recipient.address2 ? `<address-line-2>${data.recipient.address2}</address-line-2>` : ''}
            <city>${data.recipient.city}</city>
            <prov-state>${data.recipient.province}</prov-state>
            <postal-zip-code>${data.recipient.postalCode.replace(/\s/g, '')}</postal-zip-code>
            <country-code>${data.recipient.country || 'CA'}</country-code>
          </address-details>
        </destination>
        <options>
          ${data.signatureRequired ? '<option><option-code>SO</option-code></option>' : ''}
        </options>
        <parcel-characteristics>
          <weight>${data.parcel?.weight?.value || 1.0}</weight>
          <dimensions>
            <length>${data.parcel?.dimensions?.length || 25}</length>
            <width>${data.parcel?.dimensions?.width || 20}</width>
            <height>${data.parcel?.dimensions?.height || 15}</height>
          </dimensions>
        </parcel-characteristics>
        <preferences>
          <show-packing-instructions>true</show-packing-instructions>
        </preferences>
      </delivery-spec>
    </non-contract-shipment>`;
  }

  _parseRatesXML(xmlStr) {
    // Simple text parsing — in production use xml2js or fast-xml-parser
    const rates = [];
    const priceQuotes = xmlStr.match(/<price-quote>([\s\S]*?)<\/price-quote>/g) || [];
    priceQuotes.forEach(q => {
      const code = q.match(/<service-code>(.*?)<\/service-code>/)?.[1] || '';
      const name = q.match(/<service-name>(.*?)<\/service-name>/)?.[1] || '';
      const price = q.match(/<due>(.*?)<\/due>/)?.[1] || '0';
      const transit = q.match(/<expected-transit-time>(.*?)<\/expected-transit-time>/)?.[1] || '';
      const delivery = q.match(/<expected-delivery-date>(.*?)<\/expected-delivery-date>/)?.[1] || '';
      rates.push({ carrier: 'canada_post', serviceCode: code, serviceName: name, price: parseFloat(price), currency: 'CAD', transitDays: parseInt(transit) || null, deliveryDate: delivery });
    });
    return rates;
  }

  _parseShipmentResponse(xmlStr) {
    return {
      shipmentId: xmlStr.match(/<shipment-id>(.*?)<\/shipment-id>/)?.[1] || '',
      trackingPin: xmlStr.match(/<tracking-pin>(.*?)<\/tracking-pin>/)?.[1] || '',
      labelUrl: xmlStr.match(/<rel>label<\/rel>[\s\S]*?<href>(.*?)<\/href>/)?.[1] || '',
    };
  }

  _parseTrackingXML(xmlStr) {
    return {
      trackingNumber: xmlStr.match(/<pin>(.*?)<\/pin>/)?.[1] || '',
      status: xmlStr.match(/<event-type>(.*?)<\/event-type>/)?.[1] || '',
      description: xmlStr.match(/<event-description>(.*?)<\/event-description>/)?.[1] || '',
      timestamp: xmlStr.match(/<event-date>(.*?)<\/event-date>/)?.[1] || '',
      location: xmlStr.match(/<event-site>(.*?)<\/event-site>/)?.[1] || '',
    };
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// FEDEX API (REST — new FedEx API platform)
// ══════════════════════════════════════════════════════════════════════════════

export class FedExAPI {
  constructor(credentials, sandbox = false) {
    this.carrier = CARRIERS.fedex;
    this.baseURL = sandbox ? this.carrier.sandboxBase : this.carrier.apiBase;
    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;
    this.accountNumber = credentials.accountNumber;
    this.accessToken = null;
    this.tokenExpiry = 0;

    this.http = axios.create({ baseURL: this.baseURL, timeout: 30000 });
  }

  async _ensureToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) return;
    const res = await this.http.post('/oauth/token',
      `grant_type=client_credentials&client_id=${this.clientId}&client_secret=${this.clientSecret}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    this.accessToken = res.data.access_token;
    this.tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
    this.http.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }

  async getRates(sender, recipient, parcel = DEFAULT_PACKAGE) {
    await this._ensureToken();
    const res = await this.http.post('/rate/v1/rates/quotes', {
      accountNumber: { value: this.accountNumber },
      requestedShipment: {
        shipper: { address: this._formatAddress(sender) },
        recipient: { address: this._formatAddress(recipient) },
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        rateRequestType: ['ACCOUNT', 'LIST'],
        requestedPackageLineItems: [{
          weight: { value: parcel.weight.value, units: parcel.weight.unit === 'kg' ? 'KG' : 'LB' },
          dimensions: {
            length: parcel.dimensions.length, width: parcel.dimensions.width, height: parcel.dimensions.height,
            units: parcel.dimensions.unit === 'cm' ? 'CM' : 'IN',
          },
        }],
      },
    });
    return (res.data.output?.rateReplyDetails || []).map(r => ({
      carrier: 'fedex',
      serviceCode: r.serviceType,
      serviceName: r.serviceName,
      price: parseFloat(r.ratedShipmentDetails?.[0]?.totalNetCharge || 0),
      currency: r.ratedShipmentDetails?.[0]?.currency || 'CAD',
      transitDays: r.commit?.transitDays?.amount || null,
      deliveryDate: r.commit?.dateDetail?.dayFormat || '',
    }));
  }

  async createShipment(shipmentData) {
    await this._ensureToken();
    const res = await this.http.post('/ship/v1/shipments', {
      accountNumber: { value: this.accountNumber },
      labelResponseOptions: 'LABEL',
      requestedShipment: {
        shipper: { contact: this._formatContact(shipmentData.sender), address: this._formatAddress(shipmentData.sender) },
        recipients: [{ contact: this._formatContact(shipmentData.recipient), address: this._formatAddress(shipmentData.recipient) }],
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        serviceType: shipmentData.serviceCode,
        packagingType: 'YOUR_PACKAGING',
        labelSpecification: { labelFormatType: 'COMMON2D', imageType: shipmentData.labelFormat || 'PDF', labelStockType: 'PAPER_4X6' },
        requestedPackageLineItems: [{
          weight: { value: shipmentData.parcel?.weight?.value || 1.0, units: 'KG' },
          dimensions: { length: shipmentData.parcel?.dimensions?.length || 25, width: shipmentData.parcel?.dimensions?.width || 20, height: shipmentData.parcel?.dimensions?.height || 15, units: 'CM' },
        }],
      },
    });
    const piece = res.data.output?.transactionShipments?.[0];
    return {
      shipmentId: piece?.masterTrackingNumber || '',
      trackingNumber: piece?.masterTrackingNumber || '',
      labelData: piece?.pieceResponses?.[0]?.packageDocuments?.[0]?.encodedLabel || '',
      labelFormat: shipmentData.labelFormat || 'PDF',
    };
  }

  async track(trackingNumber) {
    await this._ensureToken();
    const res = await this.http.post('/track/v1/trackingnumbers', {
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      includeDetailedScans: true,
    });
    const detail = res.data.output?.completeTrackResults?.[0]?.trackResults?.[0];
    return {
      trackingNumber,
      status: detail?.latestStatusDetail?.statusByLocale || '',
      description: detail?.latestStatusDetail?.description || '',
      deliveryDate: detail?.estimatedDeliveryTimeWindow?.window?.ends || '',
      events: (detail?.scanEvents || []).map(e => ({
        date: e.date, description: e.eventDescription, location: e.scanLocation?.city || '',
      })),
    };
  }

  async validateAddress(address) {
    await this._ensureToken();
    const res = await this.http.post('/address/v1/addresses/resolve', {
      addressesToValidate: [{ address: this._formatAddress(address) }],
    });
    return res.data.output?.resolvedAddresses?.[0] || null;
  }

  _formatAddress(addr) {
    return {
      streetLines: [addr.address1, addr.address2].filter(Boolean),
      city: addr.city,
      stateOrProvinceCode: addr.province || addr.state || '',
      postalCode: addr.postalCode || addr.zipCode || '',
      countryCode: addr.country || 'CA',
    };
  }
  _formatContact(c) {
    return { personName: c.name, phoneNumber: c.phone || '', emailAddress: c.email || '', companyName: c.company || '' };
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// UPS API (REST — new UPS Developer API)
// ══════════════════════════════════════════════════════════════════════════════

export class UPSAPI {
  constructor(credentials, sandbox = false) {
    this.carrier = CARRIERS.ups;
    this.baseURL = sandbox ? this.carrier.sandboxBase : this.carrier.apiBase;
    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;
    this.accountNumber = credentials.accountNumber;
    this.accessToken = null;
    this.tokenExpiry = 0;

    this.http = axios.create({ baseURL: this.baseURL, timeout: 30000 });
  }

  async _ensureToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) return;
    const res = await axios.post(`${this.baseURL}/security/v1/oauth/token`,
      'grant_type=client_credentials',
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + btoa64(`${this.clientId}:${this.clientSecret}`) } }
    );
    this.accessToken = res.data.access_token;
    this.tokenExpiry = Date.now() + (parseInt(res.data.expires_in) - 60) * 1000;
    this.http.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }

  async getRates(sender, recipient, parcel = DEFAULT_PACKAGE) {
    await this._ensureToken();
    const res = await this.http.post('/rating/v1/Shop', {
      RateRequest: {
        Request: { SubVersion: '2205' },
        Shipment: {
          Shipper: { Address: this._formatAddr(sender), ShipperNumber: this.accountNumber },
          ShipTo: { Address: this._formatAddr(recipient) },
          ShipFrom: { Address: this._formatAddr(sender) },
          Package: {
            PackagingType: { Code: '02' },
            PackageWeight: { UnitOfMeasurement: { Code: parcel.weight.unit === 'kg' ? 'KGS' : 'LBS' }, Weight: String(parcel.weight.value) },
            Dimensions: { UnitOfMeasurement: { Code: parcel.dimensions.unit === 'cm' ? 'CM' : 'IN' }, Length: String(parcel.dimensions.length), Width: String(parcel.dimensions.width), Height: String(parcel.dimensions.height) },
          },
        },
      },
    });
    return (res.data.RateResponse?.RatedShipment || []).map(r => ({
      carrier: 'ups', serviceCode: r.Service?.Code || '', serviceName: this._serviceNameFromCode(r.Service?.Code),
      price: parseFloat(r.TotalCharges?.MonetaryValue || 0), currency: r.TotalCharges?.CurrencyCode || 'CAD',
      transitDays: parseInt(r.GuaranteedDelivery?.BusinessDaysInTransit) || null,
    }));
  }

  async createShipment(shipmentData) {
    await this._ensureToken();
    const res = await this.http.post('/shipments/v2205/ship', {
      ShipmentRequest: {
        Request: { SubVersion: '2205' },
        Shipment: {
          Shipper: { Name: shipmentData.sender.name, ShipperNumber: this.accountNumber, Address: this._formatAddr(shipmentData.sender), Phone: { Number: shipmentData.sender.phone || '' } },
          ShipTo: { Name: shipmentData.recipient.name, Address: this._formatAddr(shipmentData.recipient), Phone: { Number: shipmentData.recipient.phone || '' } },
          ShipFrom: { Name: shipmentData.sender.name, Address: this._formatAddr(shipmentData.sender) },
          PaymentInformation: { ShipmentCharge: { Type: '01', BillShipper: { AccountNumber: this.accountNumber } } },
          Service: { Code: shipmentData.serviceCode },
          Package: {
            Packaging: { Code: '02' },
            PackageWeight: { UnitOfMeasurement: { Code: 'KGS' }, Weight: String(shipmentData.parcel?.weight?.value || 1) },
            Dimensions: { UnitOfMeasurement: { Code: 'CM' }, Length: String(shipmentData.parcel?.dimensions?.length || 25), Width: String(shipmentData.parcel?.dimensions?.width || 20), Height: String(shipmentData.parcel?.dimensions?.height || 15) },
          },
        },
        LabelSpecification: { LabelImageFormat: { Code: shipmentData.labelFormat || 'PDF' }, LabelStockSize: { Width: '4', Height: '6' } },
      },
    });
    const pkg = res.data.ShipmentResponse?.ShipmentResults;
    return {
      shipmentId: pkg?.ShipmentIdentificationNumber || '',
      trackingNumber: pkg?.PackageResults?.TrackingNumber || pkg?.ShipmentIdentificationNumber || '',
      labelData: pkg?.PackageResults?.ShippingLabel?.GraphicImage || '',
      labelFormat: shipmentData.labelFormat || 'PDF',
    };
  }

  async track(trackingNumber) {
    await this._ensureToken();
    const res = await this.http.get(`/track/v1/details/${trackingNumber}`);
    const pkg = res.data.trackResponse?.shipment?.[0]?.package?.[0];
    return {
      trackingNumber,
      status: pkg?.currentStatus?.description || '',
      deliveryDate: pkg?.deliveryDate?.[0]?.date || '',
      events: (pkg?.activity || []).map(a => ({
        date: a.date, time: a.time, description: a.status?.description || '', location: a.location?.address?.city || '',
      })),
    };
  }

  async validateAddress(address) {
    await this._ensureToken();
    const res = await this.http.post('/addressvalidation/v1/1', {
      XAVRequest: { AddressKeyFormat: { AddressLine: [address.address1, address.address2].filter(Boolean), PoliticalDivision2: address.city, PoliticalDivision1: address.province || address.state || '', PostcodePrimaryLow: address.postalCode || address.zipCode || '', CountryCode: address.country || 'CA' } },
    });
    return res.data.XAVResponse?.Candidate || null;
  }

  _formatAddr(a) {
    return {
      AddressLine: [a.address1, a.address2].filter(Boolean),
      City: a.city, StateProvinceCode: a.province || a.state || '',
      PostalCode: (a.postalCode || a.zipCode || '').replace(/\s/g, ''),
      CountryCode: a.country || 'CA',
    };
  }
  _serviceNameFromCode(code) {
    return CARRIERS.ups.services.find(s => s.code === code)?.name || `UPS Service ${code}`;
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// PUROLATOR API (REST/SOAP hybrid — simplified to REST calls)
// ══════════════════════════════════════════════════════════════════════════════

export class PurolatorAPI {
  constructor(credentials, sandbox = false) {
    this.carrier = CARRIERS.purolator;
    this.baseURL = sandbox ? this.carrier.sandboxBase : this.carrier.apiBase;
    this.activationKey = credentials.activationKey;
    this.password = credentials.password;
    this.billingAccount = credentials.billingAccount;

    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
      },
    });
  }

  _soapEnvelope(service, body) {
    return `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
      xmlns:v2="http://purolator.com/pws/datatypes/v2">
      <soap:Header>
        <v2:RequestContext>
          <v2:Version>2.2</v2:Version>
          <v2:Language>en</v2:Language>
          <v2:GroupID>xxx</v2:GroupID>
          <v2:RequestReference>PrintFlow</v2:RequestReference>
          <v2:UserToken>${this.activationKey}</v2:UserToken>
        </v2:RequestContext>
      </soap:Header>
      <soap:Body>${body}</soap:Body>
    </soap:Envelope>`;
  }

  async getRates(sender, recipient, parcel = DEFAULT_PACKAGE) {
    const body = `
      <v2:GetFullEstimateRequest>
        <v2:Shipment>
          <v2:SenderInformation><v2:Address>
            <v2:City>${sender.city}</v2:City>
            <v2:Province>${sender.province}</v2:Province>
            <v2:PostalCode>${sender.postalCode.replace(/\s/g, '')}</v2:PostalCode>
            <v2:Country>CA</v2:Country>
          </v2:Address></v2:SenderInformation>
          <v2:ReceiverInformation><v2:Address>
            <v2:City>${recipient.city}</v2:City>
            <v2:Province>${recipient.province || recipient.state || ''}</v2:Province>
            <v2:PostalCode>${(recipient.postalCode || recipient.zipCode || '').replace(/\s/g, '')}</v2:PostalCode>
            <v2:Country>${recipient.country || 'CA'}</v2:Country>
          </v2:Address></v2:ReceiverInformation>
          <v2:PackageInformation>
            <v2:TotalWeight><v2:Value>${parcel.weight.value}</v2:Value><v2:WeightUnit>kg</v2:WeightUnit></v2:TotalWeight>
            <v2:TotalPieces>1</v2:TotalPieces>
            <v2:PiecesInformation><v2:Piece>
              <v2:Weight><v2:Value>${parcel.weight.value}</v2:Value><v2:WeightUnit>kg</v2:WeightUnit></v2:Weight>
              <v2:Length><v2:Value>${parcel.dimensions.length}</v2:Value><v2:DimensionUnit>cm</v2:DimensionUnit></v2:Length>
              <v2:Width><v2:Value>${parcel.dimensions.width}</v2:Value><v2:DimensionUnit>cm</v2:DimensionUnit></v2:Width>
              <v2:Height><v2:Value>${parcel.dimensions.height}</v2:Value><v2:DimensionUnit>cm</v2:DimensionUnit></v2:Height>
            </v2:Piece></v2:PiecesInformation>
          </v2:PackageInformation>
          <v2:PaymentInformation>
            <v2:PaymentType>Sender</v2:PaymentType>
            <v2:BillingAccountNumber>${this.billingAccount}</v2:BillingAccountNumber>
          </v2:PaymentInformation>
        </v2:Shipment>
        <v2:ShowAlternativeServicesIndicator>true</v2:ShowAlternativeServicesIndicator>
      </v2:GetFullEstimateRequest>`;

    const res = await this.http.post('/EstimatingService.asmx', this._soapEnvelope('Estimating', body), {
      headers: { SOAPAction: 'http://purolator.com/pws/service/v2/GetFullEstimate' },
    });
    return this._parseRatesSOAP(res.data);
  }

  async track(trackingNumber) {
    const body = `
      <v2:TrackPackagesByPinRequest>
        <v2:PINs><v2:PIN><v2:Value>${trackingNumber}</v2:Value></v2:PIN></v2:PINs>
      </v2:TrackPackagesByPinRequest>`;

    const res = await this.http.post('/TrackingService.asmx', this._soapEnvelope('Tracking', body), {
      headers: { SOAPAction: 'http://purolator.com/pws/service/v2/TrackPackagesByPin' },
    });
    return this._parseTrackingSOAP(res.data);
  }

  _parseRatesSOAP(xml) {
    const rates = [];
    const estimates = xml.match(/<ShipmentEstimate>([\s\S]*?)<\/ShipmentEstimate>/g) || [];
    estimates.forEach(e => {
      const code = e.match(/<ServiceID>(.*?)<\/ServiceID>/)?.[1] || '';
      const name = e.match(/<ServiceDescription>(.*?)<\/ServiceDescription>/)?.[1] || '';
      const total = e.match(/<TotalPrice>(.*?)<\/TotalPrice>/)?.[1] || '0';
      const transit = e.match(/<EstimatedTransitDays>(.*?)<\/EstimatedTransitDays>/)?.[1] || '';
      rates.push({ carrier: 'purolator', serviceCode: code, serviceName: name, price: parseFloat(total), currency: 'CAD', transitDays: parseInt(transit) || null });
    });
    return rates;
  }

  _parseTrackingSOAP(xml) {
    return {
      trackingNumber: xml.match(/<Value>(.*?)<\/Value>/)?.[1] || '',
      status: xml.match(/<Description>(.*?)<\/Description>/)?.[1] || '',
      events: [],
    };
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// DHL EXPRESS API (MyDHL API — REST)
// ══════════════════════════════════════════════════════════════════════════════

export class DHLAPI {
  constructor(credentials, sandbox = false) {
    this.carrier = CARRIERS.dhl;
    this.baseURL = sandbox ? this.carrier.sandboxBase : this.carrier.apiBase;
    this.accountNumber = credentials.accountNumber;
    this.http = axios.create({
      baseURL: this.baseURL, timeout: 30000,
      headers: { Authorization: 'Basic ' + btoa64(`${credentials.apiUsername}:${credentials.apiPassword}`), 'Content-Type': 'application/json' },
    });
  }

  async getRates(sender, recipient, parcel = DEFAULT_PACKAGE) {
    const res = await this.http.post('/rates', {
      customerDetails: {
        shipperDetails: { postalCode: sender.postalCode?.replace(/\s/g, ''), cityName: sender.city, countryCode: sender.country || 'CA' },
        receiverDetails: { postalCode: (recipient.postalCode || recipient.zipCode || '').replace(/\s/g, ''), cityName: recipient.city, countryCode: recipient.country || 'CA' },
      },
      accounts: [{ typeCode: 'shipper', number: this.accountNumber }],
      plannedShippingDateAndTime: new Date(Date.now() + 86400000).toISOString().slice(0, 10) + 'T12:00:00 GMT+00:00',
      unitOfMeasurement: 'metric',
      isCustomsDeclarable: (recipient.country || 'CA') !== (sender.country || 'CA'),
      packages: [{ weight: parcel.weight.value, dimensions: { length: parcel.dimensions.length, width: parcel.dimensions.width, height: parcel.dimensions.height } }],
    });
    return (res.data.products || []).map(p => ({
      carrier: 'dhl', serviceCode: p.productCode, serviceName: p.productName,
      price: parseFloat(p.totalPrice?.[0]?.price || 0), currency: p.totalPrice?.[0]?.priceCurrency || 'CAD',
      transitDays: p.deliveryCapabilities?.totalTransitDays || null,
      deliveryDate: p.deliveryCapabilities?.estimatedDeliveryDateAndTime || '',
    }));
  }

  async createShipment(shipmentData) {
    const res = await this.http.post('/shipments', {
      plannedShippingDateAndTime: new Date().toISOString().slice(0, 10) + 'T12:00:00 GMT+00:00',
      pickup: { isRequested: false },
      productCode: shipmentData.serviceCode,
      accounts: [{ typeCode: 'shipper', number: this.accountNumber }],
      outputImageProperties: { imageOptions: [{ typeCode: 'label', templateName: 'ECOM26_84_001' }], splitTransportAndWaybillDocLabels: true },
      customerDetails: {
        shipperDetails: { postalAddress: this._formatAddr(shipmentData.sender), contactInformation: { fullName: shipmentData.sender.name, phone: shipmentData.sender.phone || '', email: shipmentData.sender.email || '' } },
        receiverDetails: { postalAddress: this._formatAddr(shipmentData.recipient), contactInformation: { fullName: shipmentData.recipient.name, phone: shipmentData.recipient.phone || '', email: shipmentData.recipient.email || '' } },
      },
      content: {
        packages: [{ weight: shipmentData.parcel?.weight?.value || 1, dimensions: { length: shipmentData.parcel?.dimensions?.length || 25, width: shipmentData.parcel?.dimensions?.width || 20, height: shipmentData.parcel?.dimensions?.height || 15 } }],
        isCustomsDeclarable: false, description: shipmentData.description || '3D Printed Parts', unitOfMeasurement: 'metric',
      },
    });
    return {
      shipmentId: res.data.shipmentTrackingNumber || '',
      trackingNumber: res.data.shipmentTrackingNumber || '',
      labelData: res.data.documents?.[0]?.content || '',
      labelFormat: 'PDF',
    };
  }

  async track(trackingNumber) {
    const res = await this.http.get(`/tracking?shipmentTrackingNumber=${trackingNumber}`);
    const shipment = res.data.shipments?.[0];
    return {
      trackingNumber, status: shipment?.status || '', description: shipment?.statusDescription || '',
      deliveryDate: shipment?.estimatedDeliveryDate || '',
      events: (shipment?.events || []).map(e => ({ date: e.timestamp, description: e.description, location: e.location?.address?.addressLocality || '' })),
    };
  }

  async validateAddress(address) {
    const res = await this.http.get(`/address-validate?countryCode=${address.country || 'CA'}&postalCode=${(address.postalCode || '').replace(/\s/g, '')}&cityName=${address.city}`);
    return res.data.address || null;
  }

  _formatAddr(a) {
    return { addressLine1: a.address1, addressLine2: a.address2 || '', cityName: a.city, provinceCode: a.province || a.state || '', postalCode: (a.postalCode || a.zipCode || '').replace(/\s/g, ''), countryCode: a.country || 'CA' };
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// UNIFIED SHIPPING FACTORY + MULTI-CARRIER RATE COMPARISON
// ══════════════════════════════════════════════════════════════════════════════

export function createShippingClient(carrier, credentials, sandbox = false) {
  switch (carrier) {
    case 'canada_post': return new CanadaPostAPI(credentials, sandbox);
    case 'fedex':       return new FedExAPI(credentials, sandbox);
    case 'ups':         return new UPSAPI(credentials, sandbox);
    case 'purolator':   return new PurolatorAPI(credentials, sandbox);
    case 'dhl':         return new DHLAPI(credentials, sandbox);
    default: throw new Error(`Unsupported carrier: ${carrier}`);
  }
}

// Compare rates across all configured carriers at once
export async function compareRates(carriers, sender, recipient, parcel = DEFAULT_PACKAGE) {
  const allRates = [];
  const errors = [];

  await Promise.allSettled(
    carriers.map(async ({ carrier, client }) => {
      try {
        const rates = await client.getRates(sender, recipient, parcel);
        allRates.push(...rates);
      } catch (err) {
        errors.push({ carrier, error: err.message });
      }
    })
  );

  // Sort by price ascending
  allRates.sort((a, b) => a.price - b.price);

  return { rates: allRates, errors };
}

export default { CARRIERS, createShippingClient, compareRates };
