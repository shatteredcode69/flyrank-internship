// tests/enrichment.test.js
jest.mock('axios');
const axios = require('axios');
const { enrichIp, setProviderStatus } = require('../src/services/geo.service');

// A public-looking IP so the enrichIp() private-IP short-circuit doesn't
// skip the network calls we're trying to test.
const PUBLIC_IP = '203.0.113.42';

describe('Geo enrichment — provider fallback chain', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setProviderStatus('A', true);
    setProviderStatus('B', true);
  });

  test('uses Provider A when it succeeds', async () => {
    axios.get.mockResolvedValueOnce({ data: { status: 'success', country: 'Pakistan', city: 'Peshawar' } });

    const result = await enrichIp(PUBLIC_IP);
    expect(result).toEqual({ country: 'Pakistan', city: 'Peshawar', provider: 'ip-api.com' });
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test('falls back to Provider B when Provider A throws', async () => {
    axios.get
      .mockRejectedValueOnce(new Error('Provider A timeout'))
      .mockResolvedValueOnce({ data: { country_name: 'United States', city: 'Austin' } });

    const result = await enrichIp(PUBLIC_IP);
    expect(result).toEqual({ country: 'United States', city: 'Austin', provider: 'ipapi.co' });
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test('falls back to Provider B when Provider A is disabled via debug toggle', async () => {
    setProviderStatus('A', false);
    axios.get.mockResolvedValueOnce({ data: { country_name: 'Germany', city: 'Berlin' } });

    const result = await enrichIp(PUBLIC_IP);
    expect(result.provider).toBe('ipapi.co');
    expect(axios.get).toHaveBeenCalledTimes(1); // only B was ever called
  });

  test('degrades to null (submission still succeeds) when BOTH providers are down', async () => {
    setProviderStatus('A', false);
    setProviderStatus('B', false);

    const result = await enrichIp(PUBLIC_IP);
    expect(result).toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('degrades to null when both providers throw network errors', async () => {
    axios.get
      .mockRejectedValueOnce(new Error('A is down'))
      .mockRejectedValueOnce(new Error('B is down too'));

    const result = await enrichIp(PUBLIC_IP);
    expect(result).toBeNull();
  });

  test('skips network calls entirely for private/localhost IPs', async () => {
    const result = await enrichIp('127.0.0.1');
    expect(result).toBeNull();
    expect(axios.get).not.toHaveBeenCalled();
  });
});
