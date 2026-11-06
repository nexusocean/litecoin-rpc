/**
 * Fees
 *
 * Estimate the fee rate needed for confirmation within a target number
 * of blocks.
 *
 */

import dotenv from 'dotenv';
import { createLitecoinRpcClient } from '../src/index.js';

const { parsed } = dotenv.config({ path: '.env.test' });
const { LTC_HOST, LTC_USER, LTC_PASS, LTC_PORT, LTC_PROTOCOL } =
  parsed as Record<string, string>;

const client = createLitecoinRpcClient({
  host: LTC_HOST,
  port: parseInt(LTC_PORT, 10),
  user: LTC_USER,
  pass: LTC_PASS,
  protocol: LTC_PROTOCOL as 'http' | 'https',
});

async function main(nblocks: number = 5) {
  const blocks = Math.round(nblocks);

  const estimate = await client.estimateSmartFee(blocks);

  console.log(`Target:    ${blocks} blocks`);
  if (estimate.feerate === undefined) {
    // Common on testnet and regtest, where there is little fee history.
    console.log(`No estimate: ${estimate.errors?.join('; ') ?? 'unknown'}`);
  } else {
    console.log(`Fee rate:  ${estimate.feerate} LTC/kB`);
    console.log(`Within:    ${estimate.blocks} blocks`);
  }
}

main().catch(console.error);
