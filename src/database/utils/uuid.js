import 'react-native-get-random-values'; // polyfill crypto.getRandomValues sur RN/Hermes

// Génère un UUID v4 sans dépendre du package `uuid` (son export ESM par défaut casse la
// résolution CommonJS de Jest sur cet environnement — cf. incident documenté dans
// database/__tests__/sync.test.js). Implémentation minimale, RFC 4122 section 4.4.
export function uuidv4() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}
