// src/services/geo.service.js
//
// IP -> country/city, tried against Provider A first, then Provider B on
// failure. If both are down, enrichment degrades to null — the submission
// is still stored, just without geo data. It must never throw upstream.
//
// providerStatus is in-memory and toggled by src/modules/debug/debug.routes.js
// so the "kill a provider live" demo moment (brief §13) is possible without
// pulling a network cable. Tests instead mock axios directly (see
// tests/enrichment.test.js) for full determinism, per the brief's
// "mock the geo providers in tests" constraint.

const axios = require('axios');

const providerStatus = { A: true, B: true };

function setProviderStatus(name, up) {
  if (name !== 'A' && name !== 'B') throw new Error(`Unknown provider "${name}"`);
  providerStatus[name] = !!up;
}

function getProviderStatus() {
  return { ...providerStatus };
}

const PRIVATE_IP_RE = /^(127\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|::1|::ffff:127\.)/;

async function callProviderA(ip) {
  if (!providerStatus.A) throw new Error('Provider A disabled');
  const base = process.env.GEO_PROVIDER_A_URL || 'http://ip-api.com/json';
  const { data } = await axios.get(`${base}/${ip}`, { timeout: 2500 });
  if (!data || data.status !== 'success') throw new Error('Provider A returned no result');
  return { country: data.country, city: data.city, provider: 'ip-api.com' };
}

async function callProviderB(ip) {
  if (!providerStatus.B) throw new Error('Provider B disabled');
  const base = process.env.GEO_PROVIDER_B_URL || 'https://ipapi.co';
  const { data } = await axios.get(`${base}/${ip}/json/`, { timeout: 2500 });
  if (!data || data.error) throw new Error('Provider B returned no result');
  return { country: data.country_name, city: data.city, provider: 'ipapi.co' };
}

async function enrichIp(ip) {
  if (!ip || PRIVATE_IP_RE.test(ip)) {
    // Localhost/dev traffic has no public geo — degrade immediately rather
    // than waste a round trip that will only fail anyway.
    return null;
  }
  try {
    return await callProviderA(ip);
  } catch (errA) {
    try {
      return await callProviderB(ip);
    } catch (errB) {
      return null; // both down: degrade, never fail the submission
    }
  }
}

module.exports = { enrichIp, setProviderStatus, getProviderStatus, callProviderA, callProviderB };
