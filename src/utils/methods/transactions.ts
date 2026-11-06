import type { AxiosInstance } from 'axios';
import { callRpc } from '../rpc.js';
import type {
  RawTxInput,
  RawTxOutput,
  DecodeRawTransactionResult,
  DecodeScriptResult,
  SignRawTransactionResult,
  PrevTx,
} from '../../types/index.js';

export interface RawTransactionMethods {
  createRawTransaction(
    inputs: RawTxInput[],
    outputs: RawTxOutput,
    locktime?: number,
  ): Promise<string>;
  decodeRawTransaction(hex: string): Promise<DecodeRawTransactionResult>;
  decodeScript(hex: string): Promise<DecodeScriptResult>;
  sendRawTransaction(hex: string, allowHighFees?: boolean): Promise<string>;
  signRawTransactionWithKey(
    hex: string,
    privkeys: string[],
    prevtxs?: PrevTx[],
    sighashtype?: string,
  ): Promise<SignRawTransactionResult>;
}

export function createRawTransactionMethods(
  http: AxiosInstance,
): RawTransactionMethods {
  return {
    createRawTransaction: (inputs, outputs, locktime = 0) =>
      callRpc<string>(http, 'createrawtransaction', [
        inputs,
        outputs,
        locktime,
      ]),

    decodeRawTransaction: (hex: string) =>
      callRpc<DecodeRawTransactionResult>(http, 'decoderawtransaction', [hex]),

    decodeScript: (hex: string) =>
      callRpc<DecodeScriptResult>(http, 'decodescript', [hex]),

    sendRawTransaction: (hex: string, allowHighFees = false) =>
      callRpc<string>(http, 'sendrawtransaction', [hex, allowHighFees]),

    signRawTransactionWithKey: (
      hex,
      privkeys,
      prevtxs = [],
      sighashtype = 'ALL',
    ) =>
      callRpc<SignRawTransactionResult>(http, 'signrawtransactionwithkey', [
        hex,
        privkeys,
        prevtxs,
        sighashtype,
      ]),
  };
}
