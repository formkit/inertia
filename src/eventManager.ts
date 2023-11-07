import type { FormKitNode } from '@formkit/core';
import type { GlobalEventsMap } from '@inertiajs/core';

export type EventCallback = {
  [K in keyof Omit<GlobalEventsMap, 'navigate' | 'invalid' | 'exception'>]
  : (...args: [...GlobalEventsMap[K]['parameters'], ...[node: FormKitNode]])
    => K extends 'success' | 'error'
    ? Promise<GlobalEventsMap[K]['result']> | GlobalEventsMap[K]['result']
    : GlobalEventsMap[K]['result'];
} & {
  cancelToken: (...args: [{ cancel: () => void }, ...[node: FormKitNode]]) => void;
};

export const createEventManager = () => {
  const events: Partial<{
    [K in keyof EventCallback]: EventCallback[K][];
  }> = {};

  const on = <T extends keyof EventCallback>(name: T, cb: EventCallback[T]) => {
    if (typeof events[name] === 'undefined') events[name] = [];

    events[name]?.push(cb);
  };

  const run = (name: keyof EventCallback, ...args: any): Promise<void> | void | boolean => {
    let promiseResolver = Promise.resolve();

    for (const event of events[name] || []) {
      const res = event(...args);

      if (name === 'before' && typeof res === 'boolean') return res;
      else if (name === 'success' || name === 'finish') {
        if (res instanceof Promise) {
          promiseResolver = res;
        } else {
          promiseResolver = Promise.resolve(res);
        }
      }
    }

    if (name === 'success' || name === 'finish') return promiseResolver;
  };

  return {
    events,
    on,
    run
  }
}
