import type { TutorialProgress } from '@/core/state';
import type { TutorialStep } from '@/data/tutorial';

export function firstOpenStep(steps: readonly TutorialStep[], progress: TutorialProgress): TutorialStep | null {
  if (progress.skipped) return null;
  return steps.find((s) => !progress.completedSteps.includes(s.id)) ?? null;
}

/**
 * Called once when the game loads. Things like the cauldron and the bar are not saved, so a lesson that
 * stopped at a step that depends on them starts from its first step again. Other steps simply resume.
 */
export function rewindForResume(steps: readonly TutorialStep[], progress: TutorialProgress): void {
  const open = firstOpenStep(steps, progress);
  if (open === null || open.needsLiveState !== true) return;
  const lessonIds = new Set(steps.filter((s) => s.lesson === open.lesson).map((s) => s.id));
  progress.completedSteps = progress.completedSteps.filter((id) => !lessonIds.has(id));
}
