export interface WalletInfo {
  walletname: string;
  walletversion: number;
  /** Database format, e.g. `'bdb'` or `'sqlite'`. */
  format: string;
  balance: number;
  unconfirmed_balance: number;
  immature_balance: number;
  txcount: number;
  /** Legacy wallets only. */
  keypoololdest?: number;
  keypoolsize: number;
  keypoolsize_hd_internal?: number;
  /** Only present on encrypted wallets; 0 means locked. */
  unlocked_until?: number;
  paytxfee: number;
  /** Only present when HD is enabled. */
  hdseedid?: string;
  private_keys_enabled: boolean;
  avoid_reuse: boolean;
  /** `false` when idle, otherwise the progress of the running rescan. */
  scanning: false | { duration: number; progress: number };
  descriptors: boolean;
}
export interface ValidateAddressResult {
  isvalid: boolean;
  address?: string;
  scriptPubKey?: string;
  isscript?: boolean;
  iswitness?: boolean;
  witness_version?: number;
  witness_program?: string;
  ismweb?: boolean;
}

export interface AddressInfo {
  address: string;
  scriptPubKey: string;
  ismine: boolean;
  solvable: boolean;
  desc?: string;
  iswatchonly: boolean;
  isscript: boolean;
  iswitness: boolean;
  witness_version?: number;
  witness_program?: string;
  ismweb: boolean;
  script?: string;
  hex?: string;
  pubkeys?: string[];
  sigsrequired?: number;
  pubkey?: string;
  iscompressed?: boolean;
  timestamp?: number;
  hdkeypath?: string;
  hdseedid?: string;
  hdmasterfingerprint?: string;
  labels: string[];
  ischange: boolean;
}
/** `address_type` values accepted by `getnewaddress`. */
export type AddressType = 'legacy' | 'p2sh-segwit' | 'bech32' | 'mweb';

export type WalletTxCategory =
  'send' | 'receive' | 'generate' | 'immature' | 'orphan';
export interface WalletTransactionDetail {
  account: string;
  address?: string;
  category: WalletTxCategory;
  amount: number;
  label?: string;
  vout: number;
  fee?: number;
  abandoned?: boolean;
}
export interface WalletTransactionListEntry extends WalletTransactionDetail {
  confirmations: number;
  blockhash?: string;
  blockindex?: number;
  blocktime?: number;
  txid: string;
  walletconflicts: string[];
  time: number;
  timereceived: number;
  'bip125-replaceable': 'yes' | 'no' | 'unknown';
  comment?: string;
  to?: string;
}
export interface WalletTransaction {
  amount: number;
  fee?: number;
  confirmations: number;
  generated?: boolean;
  blockhash?: string;
  blockindex?: number;
  blocktime?: number;
  txid: string;
  walletconflicts: string[];
  time: number;
  timereceived: number;
  'bip125-replaceable': 'yes' | 'no' | 'unknown';
  details: WalletTransactionDetail[];
  hex: string;
  comment?: string;
  to?: string;
}
export interface ListSinceBlockResult {
  transactions: WalletTransactionListEntry[];
  removed?: WalletTransactionListEntry[];
  lastblock: string;
}

export type AddressGroupingEntry = [string, number, string?];

export type AddressGrouping = AddressGroupingEntry[][];

export type AddressBalances = Record<string, number>;

export interface LockedUnspent {
  txid: string;
  vout: number;
}

export interface ReceivedByAddressEntry {
  address: string;
  amount: number;
  confirmations: number;
  label?: string;
  /** @deprecated legacy account field, always "" — do not use */
  account?: string;
  txids?: string[];
}

export interface BumpFeeOptions {
  confTarget?: number;
  totalFee?: number;
  replaceable?: boolean;
}

export interface BumpFeeResult {
  txid: string;
  origfee: number;
  fee: number;
  errors: string[];
}

export interface UnspentOutputRef {
  txid: string;
  vout: number;
}

export interface ImportMultiRequest {
  scriptPubKey?: string | { address: string };
  desc?: string;
  range?: number | [number, number];
  timestamp: number | 'now';
  redeemscript?: string;
  pubkeys?: string[];
  keys?: string[];
  keypool?: boolean;
  internal?: boolean;
  watchonly?: boolean;
  label?: string;
}

export interface CreateWalletOptions {
  /** Watch-only wallet: no private keys, cannot sign. Required for xpub keypools via importMulti. */
  disablePrivateKeys?: boolean;
  /** Create without an HD seed or keys; import them afterwards. */
  blank?: boolean;
  passphrase?: string;
  avoidReuse?: boolean;
  descriptors?: boolean;
}

export interface RescanBlockchainResult {
  start_height: number;
  stop_height: number;
}

export interface ImportMultiOptions {
  rescan?: boolean;
}

export interface ImportMultiResult {
  success: boolean;
  warnings?: string[];
  error?: { code: number; message: string };
}
