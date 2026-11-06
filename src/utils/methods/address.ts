import type { AxiosInstance } from 'axios';
import { callRpc } from '../rpc.js';
import type {
  AddressBalance,
  AddressTxIds,
  AddressDelta,
  AddressMempoolDelta,
  AddressUtxo,
  SpentInfo,
} from '../../types/index.js';

export interface AddressIndexMethods {
  getAddressBalance(address: string): Promise<AddressBalance>;
  getAddressTxIds(address: string): Promise<AddressTxIds>;
  getAddressDeltas(
    addresses: string[],
    start?: number,
    end?: number,
  ): Promise<AddressDelta[]>;
  getAddressMempool(addresses: string[]): Promise<AddressMempoolDelta[]>;
  getAddressUtxos(addresses: string[]): Promise<AddressUtxo[]>;
  getSpentInfo(txid: string, index: number): Promise<SpentInfo>;
}

export function createAddressIndexMethods(
  http: AxiosInstance,
): AddressIndexMethods {
  return {
    getAddressBalance(address: string): Promise<AddressBalance> {
      return callRpc<AddressBalance>(http, 'getaddressbalance', [
        { addresses: [address] },
      ]);
    },

    getAddressTxIds(address: string): Promise<AddressTxIds> {
      return callRpc<AddressTxIds>(http, 'getaddresstxids', [
        { addresses: [address] },
      ]);
    },

    getAddressDeltas(
      addresses: string[],
      start?: number,
      end?: number,
    ): Promise<AddressDelta[]> {
      const params: Record<string, unknown> = { addresses };
      if (start !== undefined) params.start = start;
      if (end !== undefined) params.end = end;
      return callRpc<AddressDelta[]>(http, 'getaddressdeltas', [params]);
    },

    getAddressMempool(addresses: string[]): Promise<AddressMempoolDelta[]> {
      return callRpc<AddressMempoolDelta[]>(http, 'getaddressmempool', [
        { addresses },
      ]);
    },

    getAddressUtxos(addresses: string[]): Promise<AddressUtxo[]> {
      return callRpc<AddressUtxo[]>(http, 'getaddressutxos', [{ addresses }]);
    },

    getSpentInfo(txid: string, index: number): Promise<SpentInfo> {
      return callRpc<SpentInfo>(http, 'getspentinfo', [{ txid, index }]);
    },
  };
}
