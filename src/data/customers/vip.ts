/**
 * Placeholder VIP numbers; tuned in step 13. VIPs are customer types with `vip: true`: once their level is
 * reached, each new customer has this chance to be a VIP, who orders the most expensive known drink.
 */
export const VIP_SPAWN = {
  chance: 0.1,
} as const;
