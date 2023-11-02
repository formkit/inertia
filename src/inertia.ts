import type { FormKitNode } from '@formkit/core';
import type { Method, VisitOptions, RequestPayload } from '@inertiajs/core';

import { createMessage } from '@formkit/core';
import { router } from '@inertiajs/core';
import { reactive, toRefs, watchEffect } from 'vue';
import { createEventCallbackManager } from './event';

export const useForm = <F extends RequestPayload>(initialFields?: F) => {
  const eventManager = createEventCallbackManager<[node: FormKitNode]>();

  let _recentlySuccessfulTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  let _cancelToken: {
    cancel: () => void;
  } | undefined = undefined;

  const state = reactive<{
    node: FormKitNode | null,
    dirty: boolean | null;
    errors: boolean | null;
    processing: boolean;
    progress: number;
    recentlySuccessful: boolean;
    valid: boolean | null;
    wasSuccessful: boolean;
  }>({
    node: null,
    dirty: null,
    errors: null,
    processing: false,
    progress: 0,
    recentlySuccessful: false,
    valid: null,
    wasSuccessful: false
  });

  eventManager.combine((on) => {
    on('cancelToken', (token) => {
      _cancelToken = token;
    });

    on('before', () => {
      state.progress = 0;
      state.recentlySuccessful = false;
      state.wasSuccessful = false;

      clearInterval(_recentlySuccessfulTimeoutId);
    });

    on('start', (_, node) => {
      node.store.set(createMessage({
        key: 'loading',
        visible: false,
        value: true
      }));

      if (node.props.submitBehavior !== 'live') node.props.disabled = true;

      state.processing = true;
    });

    on('progress', (axiosProgress) => {
      state.progress = axiosProgress?.percentage || 0;
    });

    on('success', () => {
      state.recentlySuccessful = true;
      state.wasSuccessful = true;

      _recentlySuccessfulTimeoutId = setTimeout(() => {
        state.recentlySuccessful = false;
      }, 2000);
    });

    on('error', (errors, node) => {
      node.setErrors(node.name in errors ? errors[node.name] : [], errors);
    });

    on('finish', (_, node) => {
      _cancelToken = undefined;

      node.store.remove('loading');

      if (node.props.submitBehavior !== 'live') node.props.disabled = false;

      state.processing = false;
      state.progress = 0;
    });
  });

  const plugin = (node: FormKitNode) => {
    if (node.props.type !== 'form') return;

    state.node = node;
    node.input(initialFields);

    node.on('created', () => {
      if (!node.context) return;

      watchEffect(() => {
        if (!node.context) return;

        state.dirty = node.context.state.dirty;
        state.valid = node.context.state.valid;
        state.errors = node.context.state.errors;
      });
    });

    return false;
  };

  const _createVisitHandler = (method: Method) => (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => (data: F, node: FormKitNode) => {
    const _optionEventCallbacks: {
      [key: string]: any
    } = {};

    const names = Object.keys(eventManager.events) as (keyof typeof eventManager.events)[];

    for (const name of names) {
      const _callbackName = `on${name.charAt(0).toUpperCase() + name.slice(1)}`;

      _optionEventCallbacks[_callbackName] = (arg: any) => {
        return eventManager.execute(name, arg, node);
      };
    }

    if (method === 'delete') {
      router.delete(url, {
        ..._optionEventCallbacks,
        ...options,
        data
      });
    } else {
      router[method](url, data, {
        ..._optionEventCallbacks,
        ...options,
      });
    }
  };

  return {
    get: _createVisitHandler('get'),
    post: _createVisitHandler('post'),
    put: _createVisitHandler('put'),
    patch: _createVisitHandler('patch'),
    delete: _createVisitHandler('delete'),
    cancel: () => {
      if (_cancelToken) _cancelToken.cancel();
    },

    ...toRefs(state),

    on: eventManager.on,
    combine: eventManager.combine,

    plugin,
  }
};
