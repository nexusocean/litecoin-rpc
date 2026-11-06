import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { makeClient, unlockWallet, lockWallet } from './setup.js';
import type { CanonicalUnspentOutput } from '../src/index.js';

const client = makeClient();

let rawHex: string;
let utxo: CanonicalUnspentOutput | undefined;

beforeAll(async () => {
  const unspent = await client.listUnspent(1);
  // MWEB outputs have no vout and can't be spent by txid:vout.
  utxo = unspent.find(
    (u): u is CanonicalUnspentOutput =>
      u.spendable && !!u.address && typeof u.vout === 'number',
  );
  if (utxo) {
    rawHex = await client.createRawTransaction(
      [{ txid: utxo.txid, vout: utxo.vout }],
      {
        [utxo.address as string]: parseFloat((utxo.amount - 0.0001).toFixed(8)),
      },
    );
  }
});

describe('createRawTransaction', () => {
  it('returns a non-empty hex string', async () => {
    if (!utxo) return;
    expect(typeof rawHex).toBe('string');
    expect(rawHex.length).toBeGreaterThan(0);
    expect(rawHex).toMatch(/^[0-9a-f]+$/);
  });
});

describe('decodeRawTransaction', () => {
  it('returns a decoded transaction with expected fields', async () => {
    if (!utxo) return;
    const tx = await client.decodeRawTransaction(rawHex);
    expect(typeof tx.txid).toBe('string');
    expect(tx.txid).toMatch(/^[0-9a-f]{64}$/);
    expect(typeof tx.version).toBe('number');
    expect(typeof tx.locktime).toBe('number');
    expect(Array.isArray(tx.vin)).toBe(true);
    expect(Array.isArray(tx.vout)).toBe(true);
    expect(tx.vin.length).toBeGreaterThan(0);
    expect(tx.vout.length).toBeGreaterThan(0);
  });
});

describe('decodeScript', () => {
  it('returns decoded script with expected fields', async () => {
    if (!utxo) return;
    const tx = await client.decodeRawTransaction(rawHex);
    const scriptHex = tx.vout[0]!.scriptPubKey.hex;
    const result = await client.decodeScript(scriptHex);
    expect(typeof result.asm).toBe('string');
    expect(typeof result.type).toBe('string');
  });
});

describe('fundRawTransaction', () => {
  // Funding derives an MWEB change (stealth) address, which needs the keys.
  beforeAll(() => unlockWallet(client));
  afterAll(() => lockWallet(client));

  it('returns funded hex with fee and changepos', async () => {
    if (!utxo) return;
    const unfunded = await client.createRawTransaction([], {
      [utxo.address as string]: 0.001,
    });
    const result = await client.fundRawTransaction(unfunded);
    expect(typeof result.hex).toBe('string');
    expect(result.hex.length).toBeGreaterThan(0);
    expect(typeof result.fee).toBe('number');
    expect(result.fee).toBeGreaterThan(0);
    expect(typeof result.changepos).toBe('number');
  });
});

describe('signRawTransactionWithWallet', () => {
  beforeAll(() => unlockWallet(client));
  afterAll(() => lockWallet(client));

  it('returns signed hex and complete flag', async () => {
    if (!utxo) return;
    const result = await client.signRawTransactionWithWallet(rawHex);
    expect(typeof result.hex).toBe('string');
    expect(result.hex.length).toBeGreaterThan(0);
    expect(typeof result.complete).toBe('boolean');
  });
});

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function sha256(data: Buffer): Buffer {
  return createHash('sha256').update(data).digest();
}

// WIF for the private key 0x00..01, which owns none of the wallet's inputs.
function throwawayWif(chain: string): string {
  const prefix = chain === 'main' ? 0xb0 : 0xef;
  const key = Buffer.alloc(32);
  key[31] = 1;
  const payload = Buffer.concat([Buffer.from([prefix]), key, Buffer.from([1])]);
  const data = Buffer.concat([payload, sha256(sha256(payload)).subarray(0, 4)]);
  let n = BigInt(`0x${data.toString('hex')}`);
  let out = '';
  while (n > 0n) {
    out = BASE58[Number(n % 58n)] + out;
    n /= 58n;
  }
  return out;
}

describe('signRawTransactionWithKey', () => {
  it('reports per-input errors when the key does not own the input', async () => {
    if (!utxo) return;
    const { chain } = await client.getBlockchainInfo();
    const result = await client.signRawTransactionWithKey(rawHex, [
      throwawayWif(chain),
    ]);
    expect(typeof result.hex).toBe('string');
    expect(result.complete).toBe(false);
    expect(result.errors?.[0]).toMatchObject({
      txid: utxo.txid,
      vout: utxo.vout,
      error: expect.any(String),
    });
  });

  it('rejects a malformed private key', async () => {
    if (!utxo) return;
    await expect(
      client.signRawTransactionWithKey(rawHex, ['not-a-key']),
    ).rejects.toMatchObject({ code: -5 });
  });
});

describe('sendRawTransaction', () => {
  it('rejects an unsigned transaction with a validation error', async () => {
    if (!utxo) return;
    await expect(client.sendRawTransaction(rawHex)).rejects.toMatchObject({
      code: expect.any(Number),
    });
  });
});
