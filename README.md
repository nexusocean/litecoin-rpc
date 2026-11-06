# Litecoin RPC Client

TypeScript client for Litecoin Core's JSON-RPC interface. Promise-based,
strongly typed, with batch calls and named wallet support. Built on Axios.
Requires Node 24 or later.

## Install

```bash
npm install @nexusocean/litecoin-rpc
```

## Quickstart

```ts
import { createLitecoinRpcClient } from '@nexusocean/litecoin-rpc';

const client = createLitecoinRpcClient({
  host: '127.0.0.1',
  port: 9332,
  user: 'rpcuser',
  pass: 'rpcpassword',
});

const height = await client.getBlockCount();
const hash = await client.getBlockHash(height);
const block = await client.getBlock(hash);
```

The package ships both ESM and CommonJS builds.

## Options

| Option               | Type                 | Default       | Description                                                   |
| -------------------- | -------------------- | ------------- | ------------------------------------------------------------- |
| `user`               | `string`             | required      | RPC username (`rpcuser`).                                     |
| `pass`               | `string`             | required      | RPC password (`rpcpassword`).                                 |
| `host`               | `string`             | `'127.0.0.1'` | Node hostname.                                                |
| `port`               | `number`             | `9332`        | RPC port. Testnet uses `19332`, regtest `19443`.              |
| `protocol`           | `'http' \| 'https'`  | `'http'`      | Use `https` when the node sits behind a TLS proxy.            |
| `timeout`            | `number`             | `30000`       | Request timeout in milliseconds.                              |
| `rejectUnauthorized` | `boolean`            | `true`        | Set to `false` to accept self-signed certificates over HTTPS. |
| `axiosOptions`       | `AxiosRequestConfig` | `{}`          | Extra Axios settings, merged last.                            |

## Calling methods

Most Litecoin Core RPCs have a typed method in camelCase, for example
`getBlockchainInfo`, `listUnspent`, `sendToAddress` and
`signRawTransactionWithWallet`. They are grouped as blockchain, network,
wallet, raw transaction, fee and util methods, all available directly on the
client.

For anything without a typed method, use `call`:

```ts
const uptime = await client.call<number>('uptime');
```

### Batch calls

`batch` sends several calls in one HTTP request. Results come back in the
same order as the calls, each with its own `result` or `error`:

```ts
const [count, best] = await client.batch([
  { method: 'getblockcount' },
  { method: 'getbestblockhash' },
]);
```

### Per-call options

`call` and `batch` accept a third and second argument respectively:

```ts
await client.call('rescanblockchain', [], { timeout: 600_000 });
```

- `timeout`: overrides the client timeout for this call.
- `wallet`: sends the call to a named wallet (see below).

## Named wallets

When more than one wallet is loaded, Litecoin Core needs to know which wallet
a call is for. `client.wallet(name)` returns the wallet methods scoped to that
wallet:

```ts
await client.createWallet('watch', { disablePrivateKeys: true, blank: true });

const watch = client.wallet('watch');
const info = await watch.getWalletInfo();
const utxos = await watch.listUnspent();
```

With a single loaded wallet, the wallet methods on `client` work as they are.

## MWEB outputs

`listUnspent` can return MWEB outputs, which have no `vout` or `scriptPubKey`.
The node reports their `amount` as 0 while the wallet is locked, so unlock
it first if you need balances. The result type is a union, so narrow before
spending by `txid:vout`:

```ts
import type { CanonicalUnspentOutput } from '@nexusocean/litecoin-rpc';

const utxos = await client.listUnspent();
const spendable = utxos.filter(
  (u): u is CanonicalUnspentOutput => typeof u.vout === 'number',
);
```

## Errors

Every failure throws an `RpcCallError`:

```ts
import { RpcCallError } from '@nexusocean/litecoin-rpc';

try {
  await client.getTransaction(txid);
} catch (err) {
  if (err instanceof RpcCallError) {
    console.error(err.code, err.message, err.httpStatus);
  }
}
```

- `code` is the JSON-RPC error code from the node (for example `-5` for an
  invalid address or `-13` for a locked wallet). Transport failures use
  `-1`, and authentication failures use `-401` or `-403`.
- `httpStatus` is the HTTP status, when there was a response.

## Node requirements

- Wallet methods need the wallet enabled on the node.
- The address index methods (`getAddressBalance`, `getAddressTxIds`,
  `getAddressDeltas`, `getAddressMempool`, `getAddressUtxos`, `getSpentInfo`)
  are not part of Litecoin Core. They need a patched node with an address
  index, such as the builds block explorers run, started with
  `-addressindex` (and `-spentindex` for `getSpentInfo`). On stock Litecoin
  Core they fail with "Method not found".
- `getRawTransaction` for transactions outside the mempool and wallet needs
  `-txindex`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues: see
[SECURITY.md](SECURITY.md).

## License

MIT
