import type { AxiosInstance } from 'axios';
import { callRpc } from '../rpc.js';
import type {
  Block,
  BlockHeader,
  BlockchainInfo,
  TxOutSetInfo,
  TxOut,
  Transaction,
  MempoolInfo,
  MempoolEntry,
  RawMempool,
  ChainTip,
} from '../../types/index.js';

export interface BlockchainMethods {
  getBlockCount(): Promise<number>;
  getBlockHash(height: number): Promise<string>;
  getBestBlockHash(): Promise<string>;
  getBlock(hash: string): Promise<Block>;
  getBlockHeader(hash: string): Promise<BlockHeader>;
  getBlockHeader(hash: string, verbose: true): Promise<BlockHeader>;
  getBlockHeader(hash: string, verbose: false): Promise<string>;
  getBlockchainInfo(): Promise<BlockchainInfo>;
  getTxOutSetInfo(): Promise<TxOutSetInfo>;
  getTxOut(
    txid: string,
    n: number,
    includeMempool?: boolean,
  ): Promise<TxOut | null>;
  // Without -txindex, litecoind only finds non-mempool txs when blockhash is given.
  getRawTransaction(txid: string): Promise<Transaction>;
  getRawTransaction(
    txid: string,
    verbose: true,
    blockhash?: string,
  ): Promise<Transaction>;
  getRawTransaction(
    txid: string,
    verbose: false,
    blockhash?: string,
  ): Promise<string>;
  getMempoolInfo(): Promise<MempoolInfo>;
  getRawMempool(): Promise<RawMempool>;
  getRawMempool(verbose: true): Promise<RawMempool>;
  getRawMempool(verbose: false): Promise<string[]>;
  getMempoolEntry(txid: string): Promise<MempoolEntry>;
  getChainTips(): Promise<ChainTip[]>;
  getDifficulty(): Promise<number>;
  getMempoolAncestors(txid: string): Promise<string[]>;
  getMempoolAncestors(
    txid: string,
    verbose: true,
  ): Promise<Record<string, MempoolEntry>>;
  getMempoolAncestors(txid: string, verbose: false): Promise<string[]>;
  getMempoolDescendants(txid: string): Promise<string[]>;
  getMempoolDescendants(
    txid: string,
    verbose: true,
  ): Promise<Record<string, MempoolEntry>>;
  getMempoolDescendants(txid: string, verbose: false): Promise<string[]>;
  getTxOutProof(txids: string[], blockhash?: string): Promise<string>;
  preciousBlock(blockhash: string): Promise<null>;
  pruneBlockchain(height: number): Promise<number>;
  verifyChain(checklevel?: number, nblocks?: number): Promise<boolean>;
  verifyTxOutProof(proof: string): Promise<string[]>;
}

export function createBlockchainMethods(
  http: AxiosInstance,
): BlockchainMethods {
  return {
    getBlockCount(): Promise<number> {
      return callRpc<number>(http, 'getblockcount', []);
    },

    getBlockHash(height: number): Promise<string> {
      return callRpc<string>(http, 'getblockhash', [height]);
    },

    getBestBlockHash: () => callRpc<string>(http, 'getbestblockhash'),

    getBlock(hash: string): Promise<Block> {
      return callRpc<Block>(http, 'getblock', [hash, 2]);
    },

    getBlockHeader: ((hash: string, verbose: boolean = true) =>
      callRpc<BlockHeader | string>(http, 'getblockheader', [
        hash,
        verbose,
      ])) as BlockchainMethods['getBlockHeader'],

    getBlockchainInfo(): Promise<BlockchainInfo> {
      return callRpc<BlockchainInfo>(http, 'getblockchaininfo', []);
    },

    getTxOutSetInfo(): Promise<TxOutSetInfo> {
      return callRpc<TxOutSetInfo>(http, 'gettxoutsetinfo', []);
    },

    getTxOut: (txid, n, includeMempool = true) =>
      callRpc<TxOut | null>(http, 'gettxout', [txid, n, includeMempool]),

    getRawTransaction: ((
      txid: string,
      verbose: boolean = true,
      blockhash?: string,
    ) =>
      callRpc<Transaction | string>(
        http,
        'getrawtransaction',
        blockhash !== undefined ? [txid, verbose, blockhash] : [txid, verbose],
      )) as BlockchainMethods['getRawTransaction'],

    getMempoolInfo(): Promise<MempoolInfo> {
      return callRpc<MempoolInfo>(http, 'getmempoolinfo', []);
    },

    getRawMempool: ((verbose: boolean = true) =>
      callRpc<RawMempool | string[]>(http, 'getrawmempool', [
        verbose,
      ])) as BlockchainMethods['getRawMempool'],

    getMempoolEntry(txid: string): Promise<MempoolEntry> {
      return callRpc<MempoolEntry>(http, 'getmempoolentry', [txid]);
    },

    getChainTips: () => callRpc<ChainTip[]>(http, 'getchaintips'),

    getDifficulty: () => callRpc<number>(http, 'getdifficulty'),

    getMempoolAncestors: ((txid: string, verbose: boolean = false) =>
      callRpc<string[] | Record<string, MempoolEntry>>(
        http,
        'getmempoolancestors',
        [txid, verbose],
      )) as BlockchainMethods['getMempoolAncestors'],

    getMempoolDescendants: ((txid: string, verbose: boolean = false) =>
      callRpc<string[] | Record<string, MempoolEntry>>(
        http,
        'getmempooldescendants',
        [txid, verbose],
      )) as BlockchainMethods['getMempoolDescendants'],

    getTxOutProof: (txids: string[], blockhash?: string) =>
      callRpc<string>(
        http,
        'gettxoutproof',
        blockhash !== undefined ? [txids, blockhash] : [txids],
      ),

    preciousBlock: (blockhash: string) =>
      callRpc<null>(http, 'preciousblock', [blockhash]),

    pruneBlockchain: (height: number) =>
      callRpc<number>(http, 'pruneblockchain', [height]),

    verifyChain: (checklevel: number = 3, nblocks: number = 6) =>
      callRpc<boolean>(http, 'verifychain', [checklevel, nblocks]),

    verifyTxOutProof: (proof: string) =>
      callRpc<string[]>(http, 'verifytxoutproof', [proof]),
  };
}
