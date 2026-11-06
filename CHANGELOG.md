# Changelog

## [0.1.0] - 2026-11-06

### Added

- Named wallet support. `client.wallet(name)` returns the wallet methods
  scoped to that wallet, sending requests to `/wallet/<name>`. Required when
  more than one wallet is loaded; with a single wallet the unscoped methods
  keep working as before.
- `wallet` option on `CallOptions`, so `call()` and `batch()` can target a
  named wallet.
- Wallet methods: `createWallet`, `getBalances`,
  `signRawTransactionWithWallet`.
- Raw transaction method: `signRawTransactionWithKey`.
- Util methods: `getDescriptorInfo`, `deriveAddresses`.
- Types: `CreateWalletResult`, `Balances`, `BalanceGroup`, `DescriptorInfo`.
  `Balances.mine.used` is set on wallets created with `avoidReuse`.
- `ImportMultiRequest` accepts descriptor imports (`desc`, `range`) and
  `keypool`; `ImportMultiResult` includes `warnings`.
- `PrevTx` accepts `amount` (required for segwit inputs) and `witnessScript`.
- `WalletInfo` includes `walletname`, `format`, `private_keys_enabled`,
  `avoid_reuse`, `scanning` and `descriptors`.
- `createWallet` accepts `disablePrivateKeys`, `blank` and `avoidReuse`, so
  it can create watch-only wallets (`CreateWalletOptions`).
- Wallet methods: `keypoolRefill`, `rescanBlockchain`.
- `getNewAddress` accepts an `addressType` (`'legacy'`, `'p2sh-segwit'`,
  `'bech32'` or `'mweb'`), typed as `AddressType`.

### Changed

- `SmartFeeEstimate.feerate` is now optional and `errors` was added: the
  node leaves out `feerate` when it has too little fee data.
- `importAddress`, `importPrivKey`, `importPubKey` and `abandonTransaction`
  return `Promise<null>` instead of `Promise<void>`, matching what the node
  sends.
- `fundRawTransaction` moved to the wallet methods, so `client.wallet(name)`
  includes it. It's still available on the client as before.
- `WalletInfo.keypoololdest` is now optional; descriptor wallets omit it.
- `ImportMultiRequest.scriptPubKey` is now optional, since a request may use
  `desc` instead.
- `UnspentOutput` is now a union of `CanonicalUnspentOutput` and
  `MwebUnspentOutput`. MWEB entries from `listunspent` have no `vout`,
  `scriptPubKey`, `solvable` or `safe`; narrow with
  `typeof utxo.vout === 'number'`.
- `CanonicalUnspentOutput` includes `label`, `desc` and `witnessScript`.
- `MwebUnspentOutput` includes `label`.
- `listSinceBlock` and `listReceivedByAddress` no longer send
  `include_watchonly=false` by default. The node default applies, which is
  `true` on watch-only wallets, so imported addresses are no longer hidden.

### Removed

- `WalletInfo.hdmasterkeyid`. The node returns `hdseedid` instead.
- `signRawTransaction`. The `signrawtransaction` RPC was removed in Litecoin
  Core 0.18. Use `signRawTransactionWithWallet` or `signRawTransactionWithKey`.
- `UnspentOutput.account`. Litecoin Core no longer returns it; use `label`.
