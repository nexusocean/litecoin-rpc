export interface AddressBalance {
  balance: number;
  received: number;
}

export type AddressTxIds = string[];

export interface AddressDelta {
  satoshis: number;
  txid: string;
  index: number;
  blockindex: number;
  height: number;
  address: string;
}

export interface AddressMempoolDelta {
  address: string;
  txid: string;
  index: number;
  satoshis: number;
  timestamp: number;
  prevtxid?: string;
  prevout?: number;
}

export interface AddressUtxo {
  address: string;
  txid: string;
  outputIndex: number;
  script: string;
  satoshis: number;
  height: number;
}

export interface SpentInfo {
  txid: string;
  index: number;
}
