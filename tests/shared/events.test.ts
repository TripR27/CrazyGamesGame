import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '@/shared/events';

interface TestEvents {
  ping: { n: number };
  pong: { text: string };
}

describe('event bus', () => {
  it('delivers payloads to subscribers of that event only', () => {
    const bus = createEventBus<TestEvents>();
    const onPing = vi.fn();
    const onPong = vi.fn();
    bus.on('ping', onPing);
    bus.on('pong', onPong);

    bus.emit('ping', { n: 1 });

    expect(onPing).toHaveBeenCalledWith({ n: 1 });
    expect(onPong).not.toHaveBeenCalled();
  });

  it('stops delivering after unsubscribe', () => {
    const bus = createEventBus<TestEvents>();
    const handler = vi.fn();
    const off = bus.on('ping', handler);

    off();
    bus.emit('ping', { n: 2 });

    expect(handler).not.toHaveBeenCalled();
  });

  it('allows a handler to unsubscribe itself while being called', () => {
    const bus = createEventBus<TestEvents>();
    const second = vi.fn();
    const off = bus.on('ping', () => off());
    bus.on('ping', second);

    bus.emit('ping', { n: 3 });
    bus.emit('ping', { n: 4 });

    expect(second).toHaveBeenCalledTimes(2);
  });

  it('ignores emits without subscribers', () => {
    const bus = createEventBus<TestEvents>();
    expect(() => bus.emit('pong', { text: 'hi' })).not.toThrow();
  });
});
