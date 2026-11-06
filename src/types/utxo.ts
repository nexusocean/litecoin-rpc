export interface TxOut {
  bestblock: string;
  confirmations: number;
  value: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs?: number;
    type: string;
    addresses?: string[];
  };
  coinbase: boolean;
}

export interface CanonicalUnspentOutput {
  txid: string;
  vout: number;
  address?: string;
  label?: string;
  scriptPubKey: string;
  amount: number;
  confirmations: number;
  redeemScript?: string;
  witnessScript?: string;
  spendable: boolean;
  solvable: boolean;
  desc?: string;
  safe: boolean;
}

/**
 * An MWEB output. `txid` holds the MWEB output ID; there is no `vout`.
 * While the wallet is locked the node reports `amount` as 0; unlock it
 * (`walletPassphrase`) to get real amounts.
 */
export interface MwebUnspentOutput {
  txid: string;
  vout?: never;
  address: string;
  label?: string;
  amount: number;
  confirmations: number;
  spendable: boolean;
}

/** Narrow with `typeof utxo.vout === 'number'`. */
export type UnspentOutput = CanonicalUnspentOutput | MwebUnspentOutput;
