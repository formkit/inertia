import type { FormKitNode } from '@formkit/core';
import type { RequestPayload } from '@inertiajs/core';
import type { AddonExtension } from '../inertia';

import { reactive, watchEffect } from 'vue';
import { createMessage } from '@formkit/core';

export default <F extends RequestPayload>(initialFields?: F, formLevelErrorName?: string) => {
  const state = reactive({
    node: null as null | FormKitNode,
    dirty: false as boolean | null,
    errors: false as boolean | null,
    valid: false as boolean | null,
  });

  return {
    state,

    addon: ((on) => {
      on('start', (_, node) => {
        node.store.set(createMessage({
          key: 'loading',
          visible: false,
          value: true
        }));

        if (node.props.submitBehavior !== 'live') node.props.disabled = true;
      });

      on('error', (errors, node) => {
        const _formLevelErrorName = formLevelErrorName ? formLevelErrorName : node.name;

        let formErrorMessages: string | undefined;
        if (_formLevelErrorName in errors) {
          formErrorMessages = errors[_formLevelErrorName];

          delete errors[_formLevelErrorName];
        }

        node.setErrors(_formLevelErrorName, errors);
      });

      on('finish', (_, node) => {
        node.store.remove('loading');

        if (node.props.submitBehavior !== 'live') node.props.disabled = false;
      });
    }) as AddonExtension,
    plugin: (node: FormKitNode) => {
      if (node.props.type !== 'form') return;

      state.node = node;
      if (initialFields) node.input(initialFields);

      node.on('created', () => {
        watchEffect(() => {
          state.dirty = node.context!.state.dirty;
          state.valid = node.context!.state.valid;
          state.errors = node.context!.state.errors;
        });
      });

      return false;
    }
  }
};
