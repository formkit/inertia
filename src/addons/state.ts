import type { AddonExtension } from '../inertia';

import { reactive } from 'vue';

export default (recentlySuccessfulTimeoutTime = 2000) => {
  let _recentlySuccessfulTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

  const state = reactive({
    processing: false,
    progress: 0,
    recentlySuccessful: false,
    wasSuccessful: false,
  });

  return {
    state,

    addon: ((on) => {
      on('before', () => {
        state.processing = false;
        state.progress = 0;
        state.recentlySuccessful = false;
        state.wasSuccessful = false;

        clearInterval(_recentlySuccessfulTimeoutId);
      });

      on('start', () => {
        state.processing = true;
      });

      on('progress', (progress) => {
        state.progress = progress?.percentage || 0;
      });

      on('success', () => {
        state.recentlySuccessful = true;
        state.wasSuccessful = true;

        _recentlySuccessfulTimeoutId = setTimeout(() => {
          state.recentlySuccessful = false;
        }, recentlySuccessfulTimeoutTime);
      });

      on('finish', () => {
        state.processing = false;
        state.progress = 0;
      });
    }) as AddonExtension
  };
}
