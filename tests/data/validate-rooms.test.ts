import { describe, expect, it } from 'vitest';
import type { RoomDef } from '@/data/rooms';
import { roomTable, validateContent } from '@/data/validate';

const room = (over: Partial<RoomDef> = {}): RoomDef => ({ id: 'r', buy: { level: 2, cost: 10 }, seats: 1, effects: [], ...over });
const problems = (r: RoomDef): string[] => validateContent(() => true, [roomTable([r])]);

describe('room validation', () => {
  it('accepts a room with seats or an effect', () => {
    expect(problems(room())).toEqual([]);
    expect(problems(room({ seats: 0, effects: [{ stat: 'brewSpeed', mode: 'multiply', perLevel: 0.1 }] }))).toEqual([]);
  });

  it('reports a wrong level, a free room, a room that does nothing and an unknown stat', () => {
    expect(problems(room({ buy: { level: 1, cost: 10 } }))).toEqual([expect.stringMatching(/buy\.level/)]);
    expect(problems(room({ buy: { level: 2, cost: 0 } }))).toEqual([expect.stringMatching(/buy\.cost/)]);
    expect(problems(room({ seats: 0 }))).toEqual(['rooms.r: a room must add seats or an effect']);
    const odd = room({ effects: [{ stat: 'luck' as 'seats', mode: 'add', perLevel: 1 }] });
    expect(problems(odd)).toEqual([expect.stringMatching(/effect stat "luck"/)]);
  });
});
