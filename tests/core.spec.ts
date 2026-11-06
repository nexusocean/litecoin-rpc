import { makeClient } from './setup.js';
import { RpcCallError } from '../src/index.js';

const client = makeClient();

let blockCount: number;
let bestHash: string;

beforeAll(async () => {
  blockCount = await client.call<number>('getblockcount');
  bestHash = await client.call<string>('getbestblockhash');
});

describe('call', () => {
  it('returns a block count as a number', () => {
    expect(typeof blockCount).toBe('number');
    expect(blockCount).toBeGreaterThan(0);
  });

  it('returns the best block hash as a 64-char hex string', () => {
    expect(typeof bestHash).toBe('string');
    expect(bestHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns a block with expected fields', async () => {
    const block = await client.call<Record<string, unknown>>('getblock', [
      bestHash,
    ]);
    expect(block.hash).toBe(bestHash);
    expect(typeof block.height).toBe('number');
    expect(typeof block.time).toBe('number');
    expect(Array.isArray(block.tx)).toBe(true);
  });

  it('applies a per-call timeout override', async () => {
    // waitfornewblock holds the request for up to 3 s (unless a block lands),
    // so a 200 ms client timeout fires reliably. A fast call like getblock
    // can finish inside even a 1 ms timeout on a local node.
    await expect(
      client.call('waitfornewblock', [3000], { timeout: 200 }),
    ).rejects.toMatchObject({
      name: 'RpcCallError',
      message: expect.stringContaining('timeout'),
    });
  });

  it('throws RpcCallError on a bogus method', async () => {
    await expect(client.call('not_a_real_rpc_method')).rejects.toBeInstanceOf(
      RpcCallError,
    );
  });
});

describe('batch', () => {
  it('returns one result per request in order', async () => {
    const heights = [blockCount, blockCount - 1, blockCount - 2];
    const results = await client.batch(
      heights.map((h) => ({ method: 'getblockhash', params: [h] })),
    );
    expect(results).toHaveLength(3);
    results.forEach((r) => {
      expect(r.error).toBeNull();
      expect(typeof r.result).toBe('string');
    });
  });

  it('isolates errors across calls', async () => {
    const results = await client.batch([
      { method: 'getblockcount' },
      { method: 'bogusmethod' },
      { method: 'getbestblockhash' },
    ]);
    expect(results[0]!.error).toBeNull();
    expect(results[1]!.error).not.toBeNull();
    expect(results[2]!.error).toBeNull();
  });

  it('short-circuits on empty batch', async () => {
    const results = await client.batch([]);
    expect(results).toEqual([]);
  });
});

describe('auth failures', () => {
  it('throws on bad credentials', async () => {
    const badClient = makeClient({ user: 'wrong', pass: 'wrong' });
    await expect(badClient.call('getblockcount')).rejects.toMatchObject({
      name: 'RpcCallError',
      httpStatus: 401,
    });
  });
});
