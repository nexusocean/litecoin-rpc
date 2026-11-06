import type { AxiosInstance } from 'axios';
import { callRpc } from '../rpc.js';
import type { SmartFeeEstimate } from '../../types/index.js';

export interface FeesMethods {
  estimateSmartFee(nblocks: number): Promise<SmartFeeEstimate>;
}

export function createFeesMethods(http: AxiosInstance): FeesMethods {
  return {
    estimateSmartFee: (nblocks: number) =>
      callRpc<SmartFeeEstimate>(http, 'estimatesmartfee', [nblocks]),
  };
}
