import type { AxiosInstance } from 'axios';
import { callRpc } from '../rpc.js';
import type {
  CallOptions,
  AddressType,
  WalletInfo,
  ValidateAddressResult,
  AddressInfo,
  WalletTransaction,
  WalletTransactionListEntry,
  ListSinceBlockResult,
  UnspentOutput,
  AddressGrouping,
  LockedUnspent,
  ReceivedByAddressEntry,
  BumpFeeOptions,
  BumpFeeResult,
  UnspentOutputRef,
  ImportMultiRequest,
  ImportMultiOptions,
  ImportMultiResult,
  CreateWalletOptions,
  CreateWalletResult,
  RescanBlockchainResult,
  Balances,
  PrevTx,
  SignRawTransactionResult,
  FundRawTransactionResult,
} from '../../types/index.js';

export interface WalletMethods {
  getWalletInfo(): Promise<WalletInfo>;
  getBalance(minconf?: number): Promise<number>;
  getUnconfirmedBalance(): Promise<number>;
  /**
   * `addressType` defaults to the node's `-addresstype`. `'mweb'` needs the
   * wallet unlocked.
   */
  getNewAddress(label?: string, addressType?: AddressType): Promise<string>;
  validateAddress(address: string): Promise<ValidateAddressResult>;
  getAddressInfo(address: string): Promise<AddressInfo>;
  getTransaction(txid: string): Promise<WalletTransaction>;
  listTransactions(
    label?: string,
    count?: number,
    skip?: number,
  ): Promise<WalletTransactionListEntry[]>;
  listSinceBlock(
    blockhash?: string,
    targetConfirmations?: number,
    includeWatchOnly?: boolean,
  ): Promise<ListSinceBlockResult>;
  listUnspent(
    minconf?: number,
    maxconf?: number,
    addresses?: string[],
    includeUnsafe?: boolean,
  ): Promise<UnspentOutput[]>;
  sendToAddress(
    address: string,
    amount: number,
    comment?: string,
    commentTo?: string,
    subtractFeeFromAmount?: boolean,
  ): Promise<string>;
  getReceivedByAddress(address: string, minconf?: number): Promise<number>;
  importAddress(
    address: string,
    label?: string,
    rescan?: boolean,
    p2sh?: boolean,
  ): Promise<null>;
  getRawChangeAddress(): Promise<string>;
  listAddressGroupings(): Promise<AddressGrouping>;
  listLockUnspent(): Promise<LockedUnspent[]>;
  listReceivedByAddress(
    minconf?: number,
    includeEmpty?: boolean,
    includeWatchOnly?: boolean,
  ): Promise<ReceivedByAddressEntry[]>;
  setTxFee(amount: number): Promise<boolean>;
  // dumpprivkey requires a one-time confirmation code, undocumented in CLI help.
  // First call (no code) always errors with the code embedded in the error message;
  // second call (address + code) returns the key. Caller is responsible for the flow.
  dumpPrivKey(address: string, code?: string): Promise<string>;
  // Unlocks an encrypted wallet for `timeout` seconds.
  walletPassphrase(passphrase: string, timeout: number): Promise<null>;
  walletLock(): Promise<null>;
  // Permanent: litecoind has no RPC to decrypt a wallet again.
  encryptWallet(passphrase: string): Promise<string>;
  walletPassphraseChange(
    oldPassphrase: string,
    newPassphrase: string,
  ): Promise<null>;
  importPrivKey(
    privKey: string,
    label?: string,
    rescan?: boolean,
  ): Promise<null>;
  importPubKey(pubKey: string, label?: string, rescan?: boolean): Promise<null>;
  /** Legacy (P2PKH) addresses only; the wallet must be unlocked. */
  signMessage(address: string, message: string): Promise<string>;
  lockUnspent(
    unlock: boolean,
    transactions?: UnspentOutputRef[],
  ): Promise<boolean>;
  // fromaccount is a legacy positional param — hardcoded to '', not exposed.
  sendMany(
    recipients: Record<string, number>,
    minconf?: number,
    comment?: string,
    subtractFeeFrom?: string[],
  ): Promise<string>;
  bumpFee(txid: string, options?: BumpFeeOptions): Promise<BumpFeeResult>;
  importMulti(
    requests: ImportMultiRequest[],
    options?: ImportMultiOptions,
  ): Promise<ImportMultiResult[]>;
  abandonTransaction(txid: string): Promise<null>;
  createWallet(
    name: string,
    opts?: CreateWalletOptions,
  ): Promise<CreateWalletResult>;
  // Tops up the keypool; on a watch-only wallet this derives more addresses
  // from the imported xpub ranges.
  keypoolRefill(newSize?: number): Promise<null>;
  rescanBlockchain(
    startHeight?: number,
    stopHeight?: number,
  ): Promise<RescanBlockchainResult>;
  getBalances(): Promise<Balances>;
  signRawTransactionWithWallet(
    hex: string,
    prevtxs?: PrevTx[],
    sighashtype?: string,
  ): Promise<SignRawTransactionResult>;
  /**
   * Adds inputs and change from this wallet to a raw transaction. Needs the
   * wallet unlocked: Litecoin derives an MWEB change address while funding.
   */
  fundRawTransaction(
    hex: string,
    options?: Record<string, unknown>,
  ): Promise<FundRawTransactionResult>;
}

export function createWalletMethods(
  http: AxiosInstance,
  wallet?: string,
): WalletMethods {
  const options: CallOptions = wallet !== undefined ? { wallet } : {};
  const rpc = <T>(method: string, params: unknown[] = []) =>
    callRpc<T>(http, method, params, options);

  return {
    getWalletInfo(): Promise<WalletInfo> {
      return rpc<WalletInfo>('getwalletinfo', []);
    },

    getBalance(minconf: number = 1): Promise<number> {
      return rpc<number>('getbalance', ['*', minconf]);
    },

    getUnconfirmedBalance(): Promise<number> {
      return rpc<number>('getunconfirmedbalance', []);
    },

    getNewAddress(label?: string, addressType?: AddressType): Promise<string> {
      if (addressType !== undefined) {
        return rpc<string>('getnewaddress', [label ?? '', addressType]);
      }
      return rpc<string>('getnewaddress', label !== undefined ? [label] : []);
    },

    validateAddress(address: string): Promise<ValidateAddressResult> {
      return rpc<ValidateAddressResult>('validateaddress', [address]);
    },

    getAddressInfo(address: string): Promise<AddressInfo> {
      return rpc<AddressInfo>('getaddressinfo', [address]);
    },

    getTransaction(txid: string): Promise<WalletTransaction> {
      return rpc<WalletTransaction>('gettransaction', [txid]);
    },

    listTransactions(
      label: string = '*',
      count: number = 10,
      skip: number = 0,
    ): Promise<WalletTransactionListEntry[]> {
      return rpc<WalletTransactionListEntry[]>('listtransactions', [
        label,
        count,
        skip,
      ]);
    },

    // includeWatchOnly unset = node default (true on watch-only wallets).
    listSinceBlock(
      blockhash?: string,
      targetConfirmations: number = 1,
      includeWatchOnly?: boolean,
    ): Promise<ListSinceBlockResult> {
      const params: unknown[] = [];
      if (blockhash !== undefined || includeWatchOnly !== undefined) {
        params.push(
          blockhash ?? null,
          targetConfirmations,
          includeWatchOnly ?? null,
        );
      }
      return rpc<ListSinceBlockResult>('listsinceblock', params);
    },

    listUnspent: (
      minconf = 1,
      maxconf = 9999999,
      addresses,
      includeUnsafe = true,
    ) =>
      rpc<UnspentOutput[]>('listunspent', [
        minconf,
        maxconf,
        addresses ?? [],
        includeUnsafe,
      ]),

    sendToAddress(
      address: string,
      amount: number,
      comment?: string,
      commentTo?: string,
      subtractFeeFromAmount: boolean = false,
    ): Promise<string> {
      const params: unknown[] = [address, amount];
      if (
        comment !== undefined ||
        commentTo !== undefined ||
        subtractFeeFromAmount
      ) {
        params.push(comment ?? '', commentTo ?? '', subtractFeeFromAmount);
      }
      return rpc<string>('sendtoaddress', params);
    },

    getReceivedByAddress(
      address: string,
      minconf: number = 1,
    ): Promise<number> {
      return rpc<number>('getreceivedbyaddress', [address, minconf]);
    },

    importAddress: (address, label = '', rescan = true, p2sh = false) =>
      rpc<null>('importaddress', [address, label, rescan, p2sh]),

    getRawChangeAddress: () => rpc<string>('getrawchangeaddress'),

    listAddressGroupings: () => rpc<AddressGrouping>('listaddressgroupings'),

    listLockUnspent: () => rpc<LockedUnspent[]>('listlockunspent'),

    // includeWatchOnly unset = node default (true on watch-only wallets).
    listReceivedByAddress: (
      minconf = 1,
      includeEmpty = false,
      includeWatchOnly,
    ) =>
      rpc<ReceivedByAddressEntry[]>('listreceivedbyaddress', [
        minconf,
        includeEmpty,
        includeWatchOnly ?? null,
      ]),

    setTxFee: (amount: number) => rpc<boolean>('settxfee', [amount]),

    walletPassphrase: (passphrase: string, timeout: number) =>
      rpc<null>('walletpassphrase', [passphrase, timeout]),

    walletLock: () => rpc<null>('walletlock', []),

    encryptWallet: (passphrase: string) =>
      rpc<string>('encryptwallet', [passphrase]),

    walletPassphraseChange: (oldPassphrase: string, newPassphrase: string) =>
      rpc<null>('walletpassphrasechange', [oldPassphrase, newPassphrase]),

    dumpPrivKey: (address: string, code?: string) =>
      rpc<string>(
        'dumpprivkey',
        code !== undefined ? [address, code] : [address],
      ),

    importPrivKey: (privKey: string, label = '', rescan = true) =>
      rpc<null>('importprivkey', [privKey, label, rescan]),

    importPubKey: (pubKey: string, label = '', rescan = true) =>
      rpc<null>('importpubkey', [pubKey, label, rescan]),

    signMessage: (address: string, message: string) =>
      rpc<string>('signmessage', [address, message]),

    lockUnspent: (unlock: boolean, transactions: UnspentOutputRef[] = []) =>
      rpc<boolean>('lockunspent', [unlock, transactions]),

    // fromaccount is a legacy positional param — hardcoded to '', not exposed.
    sendMany: (
      recipients: Record<string, number>,
      minconf = 1,
      comment = '',
      subtractFeeFrom: string[] = [],
    ) =>
      rpc<string>('sendmany', [
        '',
        recipients,
        minconf,
        comment,
        subtractFeeFrom,
      ]),

    bumpFee: (txid: string, options: BumpFeeOptions = {}) =>
      rpc<BumpFeeResult>('bumpfee', [txid, options]),

    importMulti: (
      requests: ImportMultiRequest[],
      options: ImportMultiOptions = {},
    ) => rpc<ImportMultiResult[]>('importmulti', [requests, options]),

    abandonTransaction: (txid: string) =>
      rpc<null>('abandontransaction', [txid]),

    createWallet: (name: string, opts: CreateWalletOptions = {}) =>
      rpc<CreateWalletResult>('createwallet', [
        name,
        opts.disablePrivateKeys ?? false,
        opts.blank ?? false,
        opts.passphrase ?? '',
        opts.avoidReuse ?? false,
        opts.descriptors ?? false,
      ]),

    keypoolRefill: (newSize?: number) =>
      rpc<null>('keypoolrefill', newSize !== undefined ? [newSize] : []),

    rescanBlockchain: (startHeight?: number, stopHeight?: number) =>
      rpc<RescanBlockchainResult>('rescanblockchain', [
        startHeight ?? null,
        stopHeight ?? null,
      ]),

    getBalances: () => rpc<Balances>('getbalances'),

    signRawTransactionWithWallet: (
      hex: string,
      prevtxs: PrevTx[] = [],
      sighashtype = 'ALL',
    ) =>
      rpc<SignRawTransactionResult>('signrawtransactionwithwallet', [
        hex,
        prevtxs,
        sighashtype,
      ]),

    fundRawTransaction: (hex: string, options: Record<string, unknown> = {}) =>
      rpc<FundRawTransactionResult>('fundrawtransaction', [hex, options]),
  };
}
