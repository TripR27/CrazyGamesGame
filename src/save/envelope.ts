import { decode, encode } from '@/save/codec';
import { SaveError } from '@/save/errors';
import { CURRENT_SAVE_VERSION, type RawState } from '@/save/migrate';

export interface SaveEnvelope {
  version: number;
  savedAt: number;
  state: RawState;
}

export function packEnvelope(state: unknown, savedAt: number): string {
  return encode({ version: CURRENT_SAVE_VERSION, savedAt, state });
}

export function unpackEnvelope(text: string): SaveEnvelope {
  let data: unknown;
  try {
    data = decode(text);
  } catch {
    throw new SaveError('corrupt', 'Save is not valid JSON');
  }
  const envelope = data as Partial<SaveEnvelope> | null;
  const state = envelope?.state;
  if (typeof envelope?.version !== 'number' || typeof state !== 'object' || state === null) {
    throw new SaveError('corrupt', 'Save has an unexpected shape');
  }
  return { version: envelope.version, savedAt: Number(envelope.savedAt) || 0, state: state as RawState };
}
