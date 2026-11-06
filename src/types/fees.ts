export interface FeeRate {
  /** Fee rate in satoshis per kB. */
  rate: number;
}

export interface SmartFeeEstimate {
  /** Fee rate in LTC/kB. Missing when the node has too little fee data; see `errors`. */
  feerate?: number;
  /** Why no estimate was returned, e.g. "Insufficient data or no feerate found". */
  errors?: string[];
  blocks: number;
}

export interface SmartPriorityEstimate {
  priority: number;
  blocks: number;
}
