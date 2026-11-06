import { IMPORT_ADDRESS, makeClient, maybeDescribe } from './setup.js';

const client = makeClient();

maybeDescribe('importAddress', () => {
  it('imports a watch-only address without rescan', async () => {
    await expect(
      client.importAddress(IMPORT_ADDRESS!, 'test-import', false),
    ).resolves.toBeNull();
  });
});
