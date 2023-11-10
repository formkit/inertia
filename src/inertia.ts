import type { FormKitNode } from '@formkit/core';
import type { Method, VisitOptions, RequestPayload } from '@inertiajs/core';

import { router } from '@inertiajs/vue3';
import { toRefs } from 'vue';
import { createEventManager } from './eventManager';
import { createFormkitAddon, createStateAddon } from './addons/index';

export type AddonExtension = (on: ReturnType<typeof createEventManager>['on']) => void;
export interface UseFormOptions {
  recentlySuccessfulTimeoutTime?: number;
  formLevelErrorName?: string;
}

export const useForm = <F extends RequestPayload>(initialFields?: F, options?: UseFormOptions) => {
  const eventManager = createEventManager();
  const { state: addonState, addon: stateAddon } = createStateAddon(options?.recentlySuccessfulTimeoutTime);
  const { state: formkitState, addon: formkitAddon, plugin } = createFormkitAddon(initialFields, options?.formLevelErrorName);

  const addon = (addons: AddonExtension | AddonExtension[]) => {
    if (Array.isArray(addons)) addons.forEach((cb) => cb(eventManager.on));
    else addons(eventManager.on);
  };

  addon(stateAddon);
  addon(formkitAddon);

  let _cancelToken: {
    cancel: () => void;
  } | undefined = undefined;

  addon((on) => {
    on('cancelToken', (token) => {
      _cancelToken = token;
    });

    on('finish', () => {
      _cancelToken = undefined;
    });
  });

  const submit = (method: Method, url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => (data: F, node: FormKitNode) => {
    const callbackEvents = (Object.keys(eventManager.events) as (keyof typeof eventManager.events)[]).map((name) => ({
      [`on${name.charAt(0).toUpperCase() + name.slice(1)}`]: (arg: any) => {
        if (name === 'cancel') return eventManager.run(name, arg);

        return eventManager.run(name, arg, node);
      }
    })).reduce((p, c) => ({ ...p, ...c }), {});

    if (method === 'delete') {
      router.delete(url, {
        ...callbackEvents,
        ...options,
        data
      });
    } else {
      router[method](url, data, {
        ...callbackEvents,
        ...options,
      });
    }
  };

  return {
    submit,

    get: (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => submit('get', url, options),
    post: (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => submit('post', url, options),
    put: (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => submit('put', url, options),
    patch: (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => submit('patch', url, options),
    delete: (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => submit('delete', url, options),

    cancel: () => {
      if (_cancelToken) _cancelToken.cancel();
    },

    ...toRefs(addonState),
    ...toRefs(formkitState),

    on: eventManager.on,
    addon,

    plugin,
  }
};
