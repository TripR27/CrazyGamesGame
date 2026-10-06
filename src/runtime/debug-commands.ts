export interface DebugCommands {
  /** Play the tutorial again from the start. The Settings button for this arrives in step 18. */
  replayTutorial(): void;
}

/** Makes commands available as `bt.<name>()` in the browser console. Development builds only. */
export function registerDebugCommands(commands: DebugCommands): void {
  if (!import.meta.env.DEV) return;
  (window as unknown as { bt?: DebugCommands }).bt = commands;
}
