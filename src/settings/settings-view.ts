import type { World } from '@/app/world';
import { createEl, domBounds } from '@/app/panels-view';
import { t } from '@/i18n/translator';
import { importGame, LANGUAGES, resetGame, setLanguage, setVolume } from '@/settings/settings';
import type { GameState } from '@/shared/state';
import './settings.css';

/** How long "Start over" waits for the second click that confirms. */
const CONFIRM_MS = 4000;
/** After a reset or an import the page starts the other game after this short pause (the save is written at once). */
const RELOAD_MS = 300;

/** Reading and writing whole saves as text; main.ts passes the save manager's functions. */
export interface SaveCodes {
  exportCode(): string;
  /** Throws when the text is not a valid save. */
  importCode(code: string): GameState;
}

const row = (label: string, ...parts: HTMLElement[]): HTMLElement => {
  const el = createEl('div', 'settings-row');
  el.append(createEl('span', 'settings-label', label), ...parts);
  return el;
};

function buildWindow() {
  const overlay = createEl('div', 'settings');
  const card = createEl('div', 'settings-card');
  const close = createEl('button', 'settings-close', '✕');
  const volume = Object.assign(createEl('input', 'settings-volume'), { type: 'range', min: '0', max: '100' });
  const language = createEl('select', 'settings-select');
  language.append(...LANGUAGES.map((id) => Object.assign(document.createElement('option'), { value: id, textContent: t(`settings.lang_${id}`) })));
  const tutorial = createEl('button', 'settings-action', t('settings.tutorial'));
  const exportButton = createEl('button', 'settings-action', t('settings.export'));
  const code = Object.assign(createEl('textarea', 'settings-code'), { rows: 3, placeholder: t('settings.code_hint') });
  const importButton = createEl('button', 'settings-action', t('settings.import'));
  const message = createEl('p', 'settings-message');
  const reset = createEl('button', 'settings-action settings-danger', t('settings.reset'));
  const user = createEl('p', 'settings-note settings-user');
  const ads = createEl('p', 'settings-note');
  card.append(
    close,
    createEl('h2', 'settings-title', t('settings.title')),
    row(t('settings.volume'), volume),
    createEl('p', 'settings-note', t('settings.volume_note')),
    row(t('settings.language'), language),
    row(t('settings.tutorial_label'), tutorial),
    row(t('settings.save_label'), exportButton, importButton),
    code,
    message,
    row(t('settings.reset_label'), reset),
    user,
    ads,
  );
  overlay.append(card);
  overlay.hidden = true;
  return { overlay, close, volume, language, tutorial, exportButton, code, importButton, message, reset, user, ads };
}

/**
 * The settings: a ⚙ button left of the Menu button opens a window with the volume, the language, the tutorial again,
 * the save as text (export and import) and starting over (two clicks). A reset or an import reloads the page. The
 * button is the tutorial target `settings-button`. Returns an unmount function.
 */
export function mountSettings(root: HTMLElement, world: World, { saves, username }: { saves: SaveCodes; username(): Promise<string | null> }): () => void {
  const { store, bus, clock, tutorial, targets } = world;
  const button = createEl('button', 'side-button settings-button', '⚙');
  const ui = buildWindow();
  root.append(button, ui.overlay);
  let armedUntil = 0;

  const open = (): void => {
    const { settings } = store.getState();
    ui.volume.value = String(Math.round(settings.volume * 100));
    ui.language.value = settings.language;
    ui.code.value = '';
    ui.message.textContent = '';
    ui.reset.textContent = t('settings.reset');
    ui.user.textContent = '';
    // CrazyGames: a feature that is off because of an ad blocker gets a notice (not a popup) saying why.
    ui.ads.textContent = world.rewards.enabled() ? '' : t('settings.ads_off');
    void username().then((name) => void (ui.user.textContent = name === null ? '' : t('settings.signed_in', { name })));
    ui.overlay.hidden = false;
    bus.emit('settings:opened', {});
  };
  const shut = (): void => void (ui.overlay.hidden = true);
  button.addEventListener('click', open);
  ui.close.addEventListener('click', shut);
  ui.volume.addEventListener('input', () => setVolume(world, Number(ui.volume.value) / 100));
  ui.language.addEventListener('change', () => setLanguage(world, ui.language.value));
  ui.tutorial.addEventListener('click', () => {
    tutorial.machine.restart();
    shut();
  });
  ui.exportButton.addEventListener('click', () => {
    ui.code.value = saves.exportCode();
    ui.code.select();
    ui.message.textContent = t('settings.exported');
  });
  ui.importButton.addEventListener('click', () => {
    try {
      importGame(world, saves.importCode(ui.code.value.trim()));
    } catch {
      ui.message.textContent = t('settings.import_failed');
    }
  });
  ui.reset.addEventListener('click', () => {
    if (clock.now() < armedUntil) return resetGame(world);
    armedUntil = clock.now() + CONFIRM_MS;
    ui.reset.textContent = t('settings.reset_confirm');
  });
  const stopReplaced = bus.on('game:replaced', () => window.setTimeout(() => window.location.reload(), RELOAD_MS));
  const stopTarget = targets.register('settings-button', () => domBounds(button, root));
  return () => {
    stopReplaced();
    stopTarget();
    button.remove();
    ui.overlay.remove();
  };
}
