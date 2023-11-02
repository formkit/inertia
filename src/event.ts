import type { GlobalEventsMap } from '@inertiajs/core';

export type EventCallback<A extends [...args: any]> = {
  [K in keyof Omit<GlobalEventsMap, 'navigate' | 'invalid' | 'exception'>]
  : (...args: [...GlobalEventsMap[K]['parameters'], ...A])
    => K extends 'success' | 'error'
    ? Promise<GlobalEventsMap[K]['result']> | GlobalEventsMap[K]['result']
    : GlobalEventsMap[K]['result'];
} & {
  cancelToken: (...args: [{ cancel: () => void }, ...A]) => void;
};

export type OnFunction<A extends [...args: any]> = ReturnType<typeof createEventCallbackManager<A>>['on'];
export type CombineFunction<A extends [...args: any]> = ReturnType<typeof createEventCallbackManager<A>>['combine'];
export type ExecuteFunction<A extends [...args: any]> = ReturnType<typeof createEventCallbackManager<A>>['execute'];

export const createEventCallbackManager = <E extends [...args: any]>() => {
  const events: Partial<{
    [K in keyof EventCallback<E>]: EventCallback<E>[K][];
  }> = {};

  const on = <T extends keyof EventCallback<E>>(eventName: T, callback: EventCallback<E>[T]) => {
    if (typeof events[eventName] === 'undefined') events[eventName] = [];

    events[eventName]?.push(callback);
  };

  const combine = (combineCb: (cb: typeof on) => void | ((cb: typeof on) => void)[]) => {
    if (Array.isArray(combineCb)) combineCb.forEach((cb) => cb(on));
    combineCb(on);
  };

  const execute = <T extends keyof EventCallback<E>>(eventName: T, ...params: Parameters<EventCallback<E>[T]>): ReturnType<EventCallback<E>[T]> | undefined => {
    const eventList = events[eventName];
    if (!eventList) return;

    if (eventName === 'before') {
      for (const event of eventList) {
        const res = event(...params);

        if (typeof res === 'boolean') return res as ReturnType<EventCallback<E>[T]>;
      }
    } else if (['success', 'error'].includes(eventName)) {
      let promiseResolver = Promise.resolve();

      for (const event of eventList) {
        const res = event(...params);

        if (res instanceof Promise) {
          promiseResolver = res;
        } else {
          promiseResolver = Promise.resolve(res as void);
        }
      }

      return promiseResolver as ReturnType<EventCallback<E>[T]>;
    } else {
      for (const event of eventList) {
        event(...params);
      }
    }
  };

  return {
    events,
    on,
    combine,
    execute
  };
};
