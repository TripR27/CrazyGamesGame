import type { Scene } from 'phaser';
import { iconTexture } from '@/app/icon-text-view';
import { DOOR_ENTRY } from '@/app/layout';
import { createEl, domBounds } from '@/app/panels-view';
import { addAnimation, addPixelSprite, addStripTexture } from '@/app/textures-view';
import type { World } from '@/app/world';
import { CUSTOMER_FRAME as F, customerFrames } from '@/customers/customer-art';
import { clockText } from '@/heroes/heroes-model';
import { t } from '@/i18n/translator';
import type { Ads } from '@/platform/platform';
import { BOOSTS } from '@/rewards/rewards';
import { formatNumber } from '@/shared/numbers';
import { PIXEL } from '@/shared/pixels';
import './rewards.css';

const TEXTURE = 'peddler';
/** He stands in the doorway (clear of the first table's seat); the 🎬 above his head says what he is there for. */
const SPOT = { x: DOOR_ENTRY.x + 20, y: DOOR_ENTRY.y } as const;
const WALK_MS = 900;
const HIT = { w: 64, h: 100 };

/** The peddler in the scene: he walks in through the door, waits with a 🎬 over his head, and walks out. Target `peddler`. */
export function createPeddlerView(scene: Scene, world: World): { update(): void } {
  addStripTexture(scene, TEXTURE, customerFrames('peddler'));
  addAnimation(scene, 'peddler-walk', TEXTURE, [F.walkA, F.walkB], 6);
  addAnimation(scene, 'peddler-idle', TEXTURE, [F.stand, F.stand, F.stand, F.stand, F.stand, F.blink], 3);
  const figure = addPixelSprite(scene, DOOR_ENTRY.x, SPOT.y, TEXTURE).setVisible(false);
  const sign = scene.add.image(SPOT.x, SPOT.y - 100, iconTexture(scene, '🎬')).setScale(PIXEL / 2 + 1).setVisible(false);
  world.targets.register('peddler', () => (figure.visible ? { x: SPOT.x - HIT.w / 2, y: SPOT.y - HIT.h, w: HIT.w, h: HIT.h } : null));
  const walk = (from: number, to: number, after: () => void): void => {
    figure.setX(from).setFlipX(to < from).setVisible(true).play('peddler-walk');
    scene.tweens.add({ targets: figure, x: to, duration: WALK_MS, onComplete: after });
  };
  world.bus.on('peddler:arrived', () =>
    walk(DOOR_ENTRY.x, SPOT.x, () => {
      figure.play('peddler-idle');
      sign.setVisible(true);
    }),
  );
  world.bus.on('peddler:left', () => {
    sign.setVisible(false);
    walk(figure.x, DOOR_ENTRY.x, () => figure.setVisible(false));
  });
  return {
    update() {
      sign.setY(SPOT.y - 100 + Math.sin(scene.time.now / 300) * 3);
    },
  };
}

const REFRESH_MS = 500;
const THANKS_MS = 3500;

const boostDef = (id: string) => BOOSTS.find((b) => b.id === id);

/** The offer as the player reads it: a bag of gold, or a power-up with what it does and for how long. */
function offerText(world: World, offer: string): string {
  const boost = boostDef(offer);
  if (boost === undefined) return t('rewards.offer_gold', { gold: formatNumber(world.rewards.goldOffer()) });
  return t('rewards.offer_boost', { name: t(`rewards.${boost.id}.name`), does: t(`rewards.${boost.id}.does`), minutes: boost.minutes });
}

function thanksText(offer: string, gold: string): string {
  const boost = boostDef(offer);
  if (boost === undefined) return t('rewards.thanks_gold', { gold });
  return t('rewards.thanks_boost', { name: t(`rewards.${boost.id}.name`), does: t(`rewards.${boost.id}.does`), minutes: boost.minutes });
}

function buildCard() {
  const box = createEl('div', 'rewards');
  const card = createEl('div', 'rewards-card');
  const title = createEl('strong', 'rewards-title', t('rewards.title'));
  const line = createEl('p', 'rewards-line');
  const watch = createEl('button', 'rewards-watch', t('rewards.watch'));
  const skip = createEl('button', 'rewards-skip', t('rewards.no_thanks'));
  const badge = createEl('div', 'rewards-badge');
  const choice = createEl('div', 'rewards-choice');
  choice.append(skip, watch);
  card.append(title, line, choice);
  box.append(card, badge);
  return { box, card, title, line, watch, skip, badge };
}

const ADS_OFF_MS = 8000;

/**
 * The peddler's offer as a small card under the HUD while he is in the tavern ("No thanks" above "🎬 Watch an ad", alike
 * in size and colour as CrazyGames and Poki ask), and a badge with the power-up that runs and its time left. The same
 * card says when an ad did not come ("No ad right now"), and on CrazyGames (`explainOff`) when ads are off for the
 * session, so no ad button ever does nothing.
 */
export function mountRewards(root: HTMLElement, world: World, ads: Pick<Ads, 'rewarded' | 'rules'>): () => void {
  const { store, clock, bus, rewards, targets } = world;
  const ui = buildCard();
  root.append(ui.box);
  let noticeUntil = 0;
  const notice = (title: string, text: string, ms: number): void => {
    noticeUntil = clock.now() + ms;
    ui.card.hidden = false;
    ui.title.textContent = title;
    ui.line.textContent = text;
    ui.watch.hidden = true;
    ui.skip.hidden = true;
  };
  const render = (): void => {
    const visit = rewards.peddler();
    const now = clock.now();
    if (now >= noticeUntil) {
      ui.card.hidden = visit === null;
      ui.title.textContent = t('rewards.title');
      ui.watch.hidden = false;
      ui.skip.hidden = false;
      if (visit !== null) ui.line.textContent = offerText(world, visit.offer);
    }
    const { boost, boostEndsAt } = store.getState().rewards;
    ui.badge.hidden = boost === '';
    if (boost !== '') ui.badge.textContent = t('rewards.running', { name: t(`rewards.${boost}.name`), time: clockText(boostEndsAt - now) });
  };
  ui.watch.addEventListener('click', () => {
    ui.watch.disabled = true;
    ads.rewarded(
      () => {
        ui.watch.disabled = false;
        rewards.accept();
      },
      (unavailable) => {
        ui.watch.disabled = false;
        if (!unavailable) bus.emit('ad:none', {});
      },
    );
  });
  ui.skip.addEventListener('click', () => rewards.dismiss());
  const stops = [
    bus.on('reward:granted', ({ offer, gold }) => notice(t('rewards.title'), thanksText(offer, formatNumber(gold)), THANKS_MS)),
    bus.on('ad:none', () => notice(t('rewards.title'), t('rewards.no_ad'), THANKS_MS)),
    bus.on('rewards:off', () => ads.rules.explainOff && notice(t('rewards.ads_off_title'), t('rewards.ads_off'), ADS_OFF_MS)),
    targets.register('peddler-watch', () => (ui.card.hidden || ui.watch.hidden ? null : domBounds(ui.watch, root))),
  ];
  const timer = window.setInterval(render, REFRESH_MS);
  render();
  return () => {
    window.clearInterval(timer);
    stops.forEach((stop) => stop());
    ui.box.remove();
  };
}
