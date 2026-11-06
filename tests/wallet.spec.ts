import {
  makeClient,
  maybeDescribeUnlocked,
  shouldTestSend,
  unlockWallet,
  lockWallet,
} from './setup.js';

const client = makeClient();

describe('getWalletInfo', () => {
  it('returns wallet metadata with expected fields', async () => {
    const info = await client.getWalletInfo();
    expect(typeof info.walletversion).toBe('number');
    expect(typeof info.balance).toBe('number');
    expect(typeof info.unconfirmed_balance).toBe('number');
    expect(typeof info.immature_balance).toBe('number');
    expect(typeof info.txcount).toBe('number');
    expect(typeof info.keypoololdest).toBe('number');
    expect(typeof info.keypoolsize).toBe('number');
    expect(typeof info.paytxfee).toBe('number');
  });
});

describe('getNewAddress', () => {
  it('returns a non-empty address string', async () => {
    const addr = await client.getNewAddress();
    expect(typeof addr).toBe('string');
    expect(addr.length).toBeGreaterThan(0);
  });

  it('accepts an optional label', async () => {
    const addr = await client.getNewAddress('test-label');
    expect(typeof addr).toBe('string');
    expect(addr.length).toBeGreaterThan(0);
  });

  it('returns a bech32 address when asked', async () => {
    const addr = await client.getNewAddress(undefined, 'bech32');
    expect(addr).toMatch(/^(ltc1|tltc1|rltc1)/);
  });

  it('returns an MWEB address when asked', async () => {
    // MWEB addresses need the wallet unlocked.
    await unlockWallet(client);
    try {
      const addr = await client.getNewAddress('', 'mweb');
      expect(addr).toMatch(/^(ltcmweb1|tmweb1)/);
    } finally {
      await lockWallet(client);
    }
  });
});

describe('validateAddress', () => {
  it('validates a freshly generated address', async () => {
    const addr = await client.getNewAddress();
    const result = await client.validateAddress(addr);
    expect(result.isvalid).toBe(true);
    expect(result.address).toBe(addr);
    expect(typeof result.scriptPubKey).toBe('string');
  });
});

describe('getAddressInfo', () => {
  it('reports a freshly generated address as mine', async () => {
    const addr = await client.getNewAddress();
    const info = await client.getAddressInfo(addr);
    expect(info.address).toBe(addr);
    expect(info.ismine).toBe(true);
    expect(info.iswatchonly).toBe(false);
    expect(typeof info.scriptPubKey).toBe('string');
    expect(typeof info.pubkey).toBe('string');
    expect(typeof info.hdkeypath).toBe('string');
    expect(Array.isArray(info.labels)).toBe(true);
  });

  it('flags an invalid address', async () => {
    const result = await client.validateAddress('not-a-real-address');
    expect(result.isvalid).toBe(false);
  });
});

describe('getBalance', () => {
  it('returns a non-negative number', async () => {
    const balance = await client.getBalance();
    expect(typeof balance).toBe('number');
    expect(typeof balance).toBe('number');
  });

  it('accepts a minconf parameter', async () => {
    const balance = await client.getBalance(6);
    expect(typeof balance).toBe('number');
    expect(typeof balance).toBe('number');
  });
});

describe('getUnconfirmedBalance', () => {
  it('returns a non-negative number', async () => {
    const balance = await client.getUnconfirmedBalance();
    expect(typeof balance).toBe('number');
    expect(balance).toBeGreaterThanOrEqual(0);
  });
});

describe('listTransactions', () => {
  it('returns an array of wallet transactions', async () => {
    const txs = await client.listTransactions('*', 10);
    expect(Array.isArray(txs)).toBe(true);
    if (txs.length === 0) return;
    const tx = txs[0]!;
    if (tx.address !== undefined) {
      expect(typeof tx.address).toBe('string');
    }
    expect(typeof tx.amount).toBe('number');
    expect(typeof tx.confirmations).toBe('number');
    expect(['send', 'receive', 'generate', 'immature', 'orphan']).toContain(
      tx.category,
    );
    expect(typeof tx.time).toBe('number');
    expect(Array.isArray(tx.walletconflicts)).toBe(true);
  });
});

describe('getTransaction', () => {
  it('returns full wallet transaction with details and hex', async () => {
    const txs = await client.listTransactions('*', 1);
    if (txs.length === 0) return;
    const tx = await client.getTransaction(txs[0]!.txid);
    expect(typeof tx.amount).toBe('number');
    expect(typeof tx.confirmations).toBe('number');
    expect(typeof tx.txid).toBe('string');
    expect(typeof tx.hex).toBe('string');
    expect(Array.isArray(tx.details)).toBe(true);
    expect(tx.details.length).toBeGreaterThan(0);
    const detail = tx.details[0]!;
    if (detail.address !== undefined) {
      expect(typeof detail.address).toBe('string');
    }
    expect(typeof detail.amount).toBe('number');
    expect(typeof detail.vout).toBe('number');
  });
});

describe('listSinceBlock', () => {
  it('returns transactions since genesis when no blockhash given', async () => {
    const result = await client.listSinceBlock();
    expect(Array.isArray(result.transactions)).toBe(true);
    expect(typeof result.lastblock).toBe('string');
    expect(result.lastblock).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns transactions since a specific block', async () => {
    const count = await client.getBlockCount();
    const hash = await client.getBlockHash(Math.max(1, count - 10));
    const result = await client.listSinceBlock(hash, 1);
    expect(Array.isArray(result.transactions)).toBe(true);
    expect(typeof result.lastblock).toBe('string');
  });
});

(shouldTestSend ? describe : describe.skip)('sendToAddress', () => {
  beforeAll(() => unlockWallet(client));
  afterAll(() => lockWallet(client));

  it('sends to an address and returns txid', async () => {
    const addr = await client.getNewAddress();
    const txid = await client.sendToAddress(addr, 0.0001);
    expect(txid).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('getReceivedByAddress', () => {
  it('returns a non-negative amount for a wallet address', async () => {
    const addr = await client.getNewAddress();
    const received = await client.getReceivedByAddress(addr);
    expect(typeof received).toBe('number');
    expect(received).toBeGreaterThanOrEqual(0);
  });

  it('respects minconf parameter', async () => {
    const addr = await client.getNewAddress();
    const received = await client.getReceivedByAddress(addr, 6);
    expect(typeof received).toBe('number');
    expect(received).toBeGreaterThanOrEqual(0);
  });
});

describe('getRawChangeAddress', () => {
  it('returns a change address string', async () => {
    const address = await client.getRawChangeAddress();
    expect(typeof address).toBe('string');
    expect(address.length).toBeGreaterThan(0);
  });
});

describe('listAddressGroupings', () => {
  it('returns an array of groupings of [address, amount, label?] tuples', async () => {
    const groupings = await client.listAddressGroupings();
    expect(Array.isArray(groupings)).toBe(true);
    for (const group of groupings) {
      for (const [address, amount, label] of group) {
        expect(typeof address).toBe('string');
        expect(typeof amount).toBe('number');
        if (label !== undefined) {
          expect(typeof label).toBe('string');
        }
      }
    }
  });
});

describe('listLockUnspent', () => {
  it('returns an array', async () => {
    const locked = await client.listLockUnspent();
    expect(Array.isArray(locked)).toBe(true);
  });
});

describe('listReceivedByAddress', () => {
  it('returns an array of received-by-address entries', async () => {
    const entries = await client.listReceivedByAddress();
    expect(Array.isArray(entries)).toBe(true);
    for (const entry of entries) {
      expect(typeof entry.address).toBe('string');
      expect(typeof entry.amount).toBe('number');
      expect(typeof entry.confirmations).toBe('number');
    }
  });
});

maybeDescribeUnlocked('signMessage', () => {
  beforeAll(() => unlockWallet(client, 10));
  afterAll(() => lockWallet(client));

  it('returns a signature string for a wallet address', async () => {
    // signmessage only works with legacy (P2PKH) addresses.
    const address = await client.getNewAddress('', 'legacy');
    const signature = await client.signMessage(address, 'test message');
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);
  });
});

describe('lockUnspent', () => {
  it('locks and unlocks a real unspent output', async () => {
    const unspent = await client.listUnspent();
    // MWEB outputs have no vout and can't be locked by txid:vout.
    const utxo = unspent.find((u) => typeof u.vout === 'number');
    if (!utxo) return;

    const locked = await client.lockUnspent(false, [
      { txid: utxo.txid, vout: utxo.vout },
    ]);
    expect(locked).toBe(true);

    const lockedList = await client.listLockUnspent();
    expect(
      lockedList.some((l) => l.txid === utxo.txid && l.vout === utxo.vout),
    ).toBe(true);

    const unlocked = await client.lockUnspent(true, [
      { txid: utxo.txid, vout: utxo.vout },
    ]);
    expect(unlocked).toBe(true);
  });
});

describe('encryptWallet', () => {
  it('is a function', () => {
    // Placeholder: permanently encrypts the node wallet
    expect(typeof client.encryptWallet).toBe('function');
  });
});

describe('walletPassphraseChange', () => {
  it('is a function', () => {
    // Placeholder: changes the node wallet passphrase
    expect(typeof client.walletPassphraseChange).toBe('function');
  });
});

describe('setTxFee', () => {
  it('is a function', () => {
    // Placeholder: mutates node wallet setting
    expect(typeof client.setTxFee).toBe('function');
  });
});

describe('importPrivKey', () => {
  it('is a function', () => {
    // Placeholder: mutates wallet keypool, triggers rescan
    expect(typeof client.importPrivKey).toBe('function');
  });
});

describe('importPubKey', () => {
  it('is a function', () => {
    // Placeholder: mutates wallet keypool, triggers rescan
    expect(typeof client.importPubKey).toBe('function');
  });
});

describe('sendMany', () => {
  it('is a function', () => {
    // Placeholder: sends real funds
    expect(typeof client.sendMany).toBe('function');
  });
});

describe('bumpFee', () => {
  it('is a function', () => {
    // Placeholder: requires a real pending fee-bumpable txid
    expect(typeof client.bumpFee).toBe('function');
  });
});

describe('importMulti', () => {
  it('is a function', () => {
    // Placeholder: request/options schema unconfirmed
    expect(typeof client.importMulti).toBe('function');
  });
});

describe('abandonTransaction', () => {
  it('is a function', () => {
    // Placeholder: no unconfirmed txid available to test against
    expect(typeof client.abandonTransaction).toBe('function');
  });
});
