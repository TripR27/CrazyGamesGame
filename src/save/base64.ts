import { SaveError } from '@/save/errors';

export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
}

export function fromBase64(encoded: string): string {
  try {
    const binary = atob(encoded.trim());
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  } catch {
    throw new SaveError('corrupt', 'Export code is not valid');
  }
}
