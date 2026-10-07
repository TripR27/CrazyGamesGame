import { describe, expect, it } from 'vitest';
import { validateContent } from '@/data/validate/index';
import { tutorialTable } from '@/data/validate/tutorial-table';

describe('validating tutorial steps', () => {
  it('reports tutorial steps with unknown targets, bad timers and split lessons', () => {
    const step = (id: string, lesson: string, over: object = {}) => ({
      id, lesson, target: 'cauldron', completeOn: { kind: 'event' as const, event: 'tick' as const }, ...over,
    });
    const out = validateContent(() => true, [
      tutorialTable([step('s1', 'x', { target: 'moon' }), step('s2', 'y', { completeOn: { kind: 'after', ms: 0 } }), step('s3', 'x')]),
    ]);
    expect(out).toContain('tutorial.s1: unknown target "moon"');
    expect(out).toContain('tutorial.s2: completeOn.ms must be a positive number, got 0');
    expect(out).toContain('tutorial: lesson x has steps that are not next to each other');
  });
});
