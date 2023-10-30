import type { VisitOptions, GlobalEventsMap } from '@inertiajs/core';

export type Events<A extends [...args: any]> = {
  [K in keyof Omit<GlobalEventsMap, 'navigate' | 'invalid' | 'exception'>]
  : (...args: [...GlobalEventsMap[K]['parameters'], ...A]) => GlobalEventsMap[K]['result'];
} & {
  cancelToken: (...args: [{ cancel: () => void }, ...A]) => void;
};

export type EventsList<A extends [...args: any]> = {
  [K in keyof Events<A>]: Events<A>[K][];
};

export const useEventsSystem = <E extends [...args: any]>() => {
  const eventList: Partial<EventsList<E>> = {};

  const on = <T extends keyof Events<E>>(eventName: T, callback: Events<E>[T]) => {
    if (typeof eventList[eventName] === 'undefined') eventList[eventName] = [];

    eventList[eventName]?.push(callback);
  };

  const combine = (combineCb: (cb: typeof on) => void | ((cb: typeof on) => void)[]) => {
    if (Array.isArray(combineCb)) combineCb.forEach((cb) => cb(on));
    combineCb(on);
  };

  const execute = <T extends keyof Events<E>>(eventName: T, ...params: Parameters<Events<E>[T]>): ReturnType<Events<E>[T]> | undefined => {
    const events = eventList[eventName];
    if (!events) return;

    if (eventName === 'before') {
      for (const event of events) {
        const res = event(...params);

        if (typeof res === 'boolean') return res as ReturnType<Events<E>[T]>;
      }
    } else {
      for (const event of events) {
        event(...params);
      }
    }
  };

  const toVisitOptions = (...params: E): VisitOptions => ((Object.keys(eventList) as (keyof typeof eventList)[]).map((name) => ({
    [`on${(name.charAt(0).toUpperCase() + name.slice(1)) as Capitalize<keyof typeof eventList>}`]: (arg: any) => {
      return execute(name, ...[arg, ...params]);
    }
  })).reduce((p, c) => ({
    ...p,
    ...c
  }), {}));

  return {
    on,
    combine,
    execute,
    toVisitOptions
  };
};
