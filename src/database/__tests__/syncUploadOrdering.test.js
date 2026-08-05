// Test isolé (fichier séparé) plutôt qu'ajouté à sync.test.js : `synchronize` (@nozbe/watermelondb/sync)
// est mocké directement ici pour vérifier UNIQUEMENT l'ordre d'appel dans `runSync`, sans dépendre de
// l'état réel de la base WatermelonDB (fake-indexeddb) ni du calcul de diff local — sync.test.js, lui,
// vérifie le comportement réel de bout en bout avec la vraie `synchronize`.
const mockSynchronize = jest.fn().mockResolvedValue(undefined);
jest.mock('@nozbe/watermelondb/sync', () => ({ synchronize: (...args) => mockSynchronize(...args) }));

jest.mock('../index', () => ({ database: {} }));
jest.mock('../../api/client', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
jest.mock('../../utils/storageManager', () => ({
  getData: jest.fn().mockResolvedValue('test-device-id'),
  storeData: jest.fn().mockResolvedValue(undefined),
}));

const callOrder = [];
jest.mock('../../files/uploadQueue', () => ({
  enqueuePendingUploads: jest.fn(() => {
    callOrder.push('upload');
    return Promise.resolve();
  }),
}));

const { runSync } = require('../sync');

describe('runSync — ordre pièces jointes vs push', () => {
  it("appelle enqueuePendingUploads() avant `synchronize()` (donc avant tout push JSON), pour que "
    + "les FK `attachment_id` référencées par `reasons`/`escalation_reasons` existent déjà côté "
    + "serveur au moment du push — sinon Django rejette le push en 400 et, comme `enqueuePendingUploads` "
    + "ne s'exécutait auparavant qu'APRÈS un `synchronize()` réussi, le fichier ne pouvait plus jamais "
    + "être envoyé (boucle d'échec permanente observée en production)", async () => {
    mockSynchronize.mockImplementationOnce(async () => { callOrder.push('synchronize'); });

    await runSync();

    expect(callOrder[0]).toBe('upload');
    expect(callOrder.indexOf('upload')).toBeLessThan(callOrder.indexOf('synchronize'));
  });
});
