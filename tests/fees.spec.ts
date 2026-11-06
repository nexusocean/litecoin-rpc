import { makeClient } from './setup.js';

const client = makeClient();

describe('estimateSmartFee', () => {
  it('returns a smart fee estimate for 6 blocks', async () => {
    const result = await client.estimateSmartFee(6);
    // Quiet chains (testnet, regtest) often have no fee data yet.
    if (result.feerate === undefined) {
      expect(Array.isArray(result.errors)).toBe(true);
    } else {
      expect(typeof result.feerate).toBe('number');
    }
    expect(typeof result.blocks).toBe('number');
    expect(result.blocks).toBeGreaterThan(0);
  });
});
