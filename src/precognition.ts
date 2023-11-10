import type { Method, RequestPayload, VisitOptions } from '@inertiajs/core';
import type { FormKitNode } from '@formkit/core';
import type { AxiosInstance } from 'axios';

import { createMessage } from '@formkit/core';
import { useForm as useInertiaForm } from './inertia';
import axios from 'axios';

let _axiosInstance: AxiosInstance = axios.create();

export const client = {
  debounceTimeoutDuration: 2000,
  timeout: 30000,
  use: (axios: AxiosInstance) => _axiosInstance = axios,
  axios: () => _axiosInstance
};

export const useForm = <F extends RequestPayload>(method: Method, url: URL | string, initialFields?: F) => {
  const form = useInertiaForm(initialFields);

  const submit = (options?: Exclude<VisitOptions, 'method' | 'data'>) => form.submit(method, url, options);

  const precognitiveInputs: string[] = [];

  const plugin = (node: FormKitNode) => {
    form.plugin(node);

    if (node.type !== 'input') return;

    node.addProps(['precognitive']);
    node.props.precognitive = node.props.precognitive !== undefined && node.props.precognitive !== 'false' && node.props.precognitive !== false
      ? true
      : undefined;

    if (!node.props.precognitive) return;
    node.props.validation = undefined;

    precognitiveInputs.push(node.props.type);

    let _timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    const request = (field: string, data: any) => {
      clearTimeout(_timeoutId);

      _timeoutId = setTimeout(() => {
        node.setErrors({});

        node.store.set(createMessage({
          key: 'validating',
          type: 'state',
          blocking: true,
          visible: false,
          value: true
        }));

        node.store.set(createMessage({
          key: 'loading',
          value: true,
          visible: false
        }));

        axios.request({
          url: typeof url === 'string' ? url : url.toString(),
          method,
          ...(['get', 'delete'].includes(method) ? {
            params: data
          } : { data }),
          timeout: client.timeout,
          headers: {
            'Content-Type': precognitiveInputs.some((t) => t === 'file') ? 'multipart/form-data' : 'application/json',
            Precognition: true,
            'Precognition-Validate-Only': field
          }
        }).then((response) => {
          if (response.headers?.precognition !== 'true') {
            throw Error('Did not receive a Precognition response. Ensure you have the Precognition middleware in place for the route.')
          }

          if (response.status === 422) node.setErrors(Object.keys(response.data).reduce((carry, key) => ({
            ...carry,
            [key]: Array.isArray(response.data[key])
              ? response.data[key][0]
              : response.data[key],
          }), {}));
        }).catch((error) => {
          if (error.response.headers?.precognition !== 'true') {
            throw Error('Did not receive a Precognition response. Ensure you have the Precognition middleware in place for the route.')
          }

          if (error.response.status === 422) node.setErrors(Object.keys(error.response.data).reduce((carry, key) => ({
            ...carry,
            [key]: Array.isArray(error.response.data[key])
              ? error.response.data[key][0]
              : error.response.data[key],
          }), {}));
        }).finally(() => {
          node.store.remove('validating');
          node.store.remove('loading');
        });
      }, client.debounceTimeoutDuration);
    };

    node.on('created', () => node.on('commit', ({ payload }) => {
      request(node.name, form.node.value?.value || { [node.name]: payload });
    }));
  };

  return {
    submit,

    cancel: form.cancel,

    processing: form.processing,
    progress: form.progress,
    recentlySuccessful: form.recentlySuccessful,
    wasSuccessful: form.wasSuccessful,

    node: form.node,
    dirty: form.dirty,
    errors: form.errors,
    valid: form.valid,

    on: form.on,
    addon: form.addon,

    plugin,
  }
}
