/** Placeholder numbers for progress while the player is away; tuned in step 13. */
export const OFFLINE = {
  /** How long staff keep working while away. Upgrades (later: prestige) raise this through the offlineHours stat. */
  limitHours: 2,
  /** Share of the staff's normal pace that counts while away: being there should pay a little better. */
  efficiency: 0.5,
  /** Gaps shorter than this are counted without showing the welcome-back window (a quick reload, a tab switch). */
  minWelcomeMs: 60_000,
} as const;
