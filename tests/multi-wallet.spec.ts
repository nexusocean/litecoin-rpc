import { makeUnscopedClient, maybeDescribeMultiWallet } from './setup.js';
import type { RpcCallError } from '../src/index.js';

const client = makeUnscopedClient();

const TEST_WALLET = 'ltc-rpc-multiwallet-test';
const WATCH_WALLET = 'ltc-rpc-watchonly-test';

let defaultWallet: string;

// Run on its own: npx jest tests/multi-wallet.spec.ts
maybeDescribeMultiWallet('named wallets', () => {
  beforeAll(async () => {
    const wallets = await client.call<string[]>('listwallets');
    if (wallets.length !== 1 || wallets[0] === undefined) {
      throw new Error(
        `expected exactly one loaded wallet, found: ${JSON.stringify(wallets)}`,
      );
    }
    defaultWallet = wallets[0];
  });

  afterAll(async () => {
    const wallets = await client.call<string[]>('listwallets');
    for (const name of [TEST_WALLET, WATCH_WALLET]) {
      if (wallets.includes(name)) await client.call('unloadwallet', [name]);
    }
  });

  it('unscoped wallet calls work with a single wallet loaded', async () => {
    expect(typeof (await client.getBalance())).toBe('number');
  });

  it('createWallet loads a second wallet', async () => {
    try {
      const res = await client.createWallet(TEST_WALLET);
      expect(res.name).toBe(TEST_WALLET);
    } catch (err) {
      // left on disk by a previous run
      if (!/already exists/i.test((err as RpcCallError).message)) throw err;
      await client.call('loadwallet', [TEST_WALLET]);
    }
    const wallets = await client.call<string[]>('listwallets');
    expect(wallets).toEqual(
      expect.arrayContaining([defaultWallet, TEST_WALLET]),
    );
  });

  it('unscoped wallet calls fail with -19 once two wallets are loaded', async () => {
    await expect(client.getBalance()).rejects.toMatchObject({
      name: 'RpcCallError',
      code: -19,
    });
  });

  it('scoped calls reach the new wallet', async () => {
    const info = await client.wallet(TEST_WALLET).getWalletInfo();
    expect(info.walletname).toBe(TEST_WALLET);
  });

  it('scoped calls reach the default wallet', async () => {
    const info = await client.wallet(defaultWallet).getWalletInfo();
    expect(info.walletname).toBe(defaultWallet);
  });

  it('getBalances returns trusted/untrusted/immature for a scoped wallet', async () => {
    const balances = await client.wallet(TEST_WALLET).getBalances();
    expect(balances.mine).toEqual({
      trusted: 0,
      untrusted_pending: 0,
      immature: 0,
    });
  });

  it('call and batch honour the wallet option', async () => {
    const balance = await client.call<number>('getbalance', [], {
      wallet: TEST_WALLET,
    });
    expect(balance).toBe(0);

    const [res] = await client.batch([{ method: 'getwalletinfo' }], {
      wallet: TEST_WALLET,
    });
    expect(res?.error).toBeNull();
    expect((res?.result as { walletname: string }).walletname).toBe(
      TEST_WALLET,
    );
  });

  it('createWallet with disablePrivateKeys makes a watch-only wallet', async () => {
    try {
      await client.createWallet(WATCH_WALLET, {
        disablePrivateKeys: true,
        blank: true,
      });
    } catch (err) {
      if (!/already exists/i.test((err as RpcCallError).message)) throw err;
      await client.call('loadwallet', [WATCH_WALLET]);
    }
    const watch = client.wallet(WATCH_WALLET);
    const info = await watch.getWalletInfo();
    expect(info.private_keys_enabled).toBe(false);
    expect(info.keypoolsize).toBe(0);
    // No keys and no imported xpub: nothing to hand out.
    await expect(watch.getNewAddress()).rejects.toMatchObject({
      name: 'RpcCallError',
    });
  });
});
