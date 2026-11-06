import process from 'node:process';
import dotenv from 'dotenv';
import { createLitecoinRpcClient } from '../src/index.js';
import type { LitecoinRpcClient, RpcConfig } from '../src/index.js';

const { parsed } = dotenv.config({ path: '.env.test' });

const {
  LTC_HOST,
  LTC_USER,
  LTC_PASS,
  LTC_PORT,
  LTC_PROTOCOL,
  LTC_TEST_SEND,
  TEST_IMPORT_ADDRESS,
  TEST_ADDRESS,
  TEST_WALLET_PASSPHRASE,
  TEST_SPENT_TXID,
  TEST_SPENT_INDEX,
  TEST_WALLET,
} = (parsed ?? {}) as Record<string, string>;

if (!LTC_HOST || !LTC_USER || !LTC_PASS || !LTC_PORT || !LTC_PROTOCOL) {
  throw new Error('Missing required LTC_* env vars in .env.test');
}

export const config = {
  host: LTC_HOST,
  port: parseInt(LTC_PORT, 10),
  user: LTC_USER,
  pass: LTC_PASS,
  protocol: LTC_PROTOCOL as 'http' | 'https',
};

export const WALLET = TEST_WALLET || undefined;

// Ignores TEST_WALLET, for tests about unscoped wallet calls.
export function makeUnscopedClient(): LitecoinRpcClient {
  return createLitecoinRpcClient(config);
}

// With TEST_WALLET set, wallet methods go to /wallet/<name>, so other wallets
// can stay loaded. call() and batch() stay unscoped.
export function makeClient(
  overrides: Partial<RpcConfig> = {},
): LitecoinRpcClient {
  const client = createLitecoinRpcClient({ ...config, ...overrides });
  return WALLET ? { ...client, ...client.wallet(WALLET) } : client;
}

export const shouldTestSend = LTC_TEST_SEND === '1';

export const maybeDescribe = TEST_IMPORT_ADDRESS ? describe : describe.skip;

export const IMPORT_ADDRESS = TEST_IMPORT_ADDRESS ?? '';

export const maybeDescribeAddress = TEST_ADDRESS ? describe : describe.skip;

export const ADDRESS = TEST_ADDRESS ?? '';

export const maybeDescribeUnlocked = TEST_WALLET_PASSPHRASE
  ? describe
  : describe.skip;

export const WALLET_PASSPHRASE = TEST_WALLET_PASSPHRASE ?? '';

// For tests that need private keys. They do nothing on an unencrypted wallet
// (getwalletinfo has no unlocked_until) or when no passphrase is set, since
// walletpassphrase and walletlock both error on unencrypted wallets.
async function isEncrypted(client: LitecoinRpcClient): Promise<boolean> {
  const info = await client.getWalletInfo();
  return info.unlocked_until !== undefined;
}

export async function unlockWallet(
  client: LitecoinRpcClient,
  seconds = 30,
): Promise<void> {
  if (WALLET_PASSPHRASE && (await isEncrypted(client)))
    await client.walletPassphrase(WALLET_PASSPHRASE, seconds);
}

export async function lockWallet(client: LitecoinRpcClient): Promise<void> {
  if (WALLET_PASSPHRASE && (await isEncrypted(client)))
    await client.walletLock();
}

export const maybeDescribeSpentInfo =
  TEST_SPENT_TXID && TEST_SPENT_INDEX ? describe : describe.skip;

export const SPENT_TXID = TEST_SPENT_TXID ?? '';

export const SPENT_INDEX = TEST_SPENT_INDEX
  ? parseInt(TEST_SPENT_INDEX, 10)
  : 0;

// Loads a second wallet on the node, which makes unscoped wallet calls in
// other spec files fail with -19 while it runs. Run this spec on its own.
// Shell only, not .env.test: the spec loads extra wallets, which breaks the
// other specs if it runs alongside them. Run it on its own with
// TEST_MULTIWALLET=1 npx jest tests/multi-wallet.spec.ts
export const maybeDescribeMultiWallet =
  process.env.TEST_MULTIWALLET === '1' ? describe : describe.skip;
