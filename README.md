<h3 id="readme-top"></h3>

# Inertia Plugin

<a href="https://github.com/formkit/inertia/actions/workflows/ci.yml">
  <img title="Build Badge" alt="GitHub Build Status" src="https://github.com/formkit/inertia/actions/workflows/ci.yml/badge.svg">
</a>
<a href="https://www.npmjs.com/package/@formkit/inertia">
  <img title="Npm Version" alt="Npm Version" src="https://img.shields.io/npm/v/@formkit/inertia">
</a>
<a href="https://github.com/formkit/inertia/blob/main/LICENSE.txt">
  <img title="Npm Version" alt="Npm Version" src="https://img.shields.io/github/license/formkit/inertia">
</a>

The `@formkit/inertia` plugin aims to seamlessly integrate Inertia.js with FormKit forms, leveraging a robust event system that harnesses Inertia.js event callbacks and FormKit plugins for a smooth and powerful web development experience.

### Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
   1. [Method Calls](#method-calls)
   2. [States](#states)
   3. [Event Functions](#event-functions)
3. [Event Callback Manager](#event-callback-manager)
4. [Roadmap](#roadmap)
5. [Types](#types)

## Installation

To use the Inertia plugin we need to have a Laravel project already with Inertia Vue.JS installed and running you can check how by looking into the first sections of the guide [Using FormKit with Laravel Inertia](https://formkit.com/guides/using-formkit-with-laravel-inertia).

Now you can install using your preferred package manager by following this bash command:

```bash
npm install @formkit/inertia
```

## Usage

To use the Inertia plugin we need to import the `useForm` function from `@formkit/inertia`, call the `useForm` function to receive the `form`, it comes with Inertia method calls, reactive states, the plugin event system, and the FormKit plugin.

The `useForm` function can take one optional argument:

- `initialFields`: The initial fields to be passed to your form.

### Method Calls

The `useForm()` composable returns the methods `get`, `post`, `put`, `patch` and `delete`. All of these methods will return a suitable function for use as FormKit’s `@submit` handler.

The easiest way to use it is by creating a new `const` with the resulting method of your choice:

```html
<script setup lang="ts">
  import { useForm } from '@formkit/inertia'

  const form = useForm()
  const submitHandler = form.post('/login')
</script>

<template>
  <FormKit type="form" @submit="submitHandler" :plugins="[form.plugin]">
    <FormKit type="text" name="username" label="Username" />
    <FormKit type="password" name="password" label="Password" />
  </FormKit>
</template>
```

You could also also define the handler directly in your template:

```html
<FormKit
  type="form"
  @submit="(fields, node) => form.post('/login')(fields, node)"
  :plugins="[form.plugin]"
>
  <!-- The rest of your form -->
</FormKit>
```

The functions support all [visit options](https://inertiajs.com/manual-visits) from Inertia, such as `preserveState`, `preserveScroll`, and event callbacks.

> The `options` event callbacks will overwrite any default events to that specific event, meaning that if you for example add `onStart` you will lose the events from `start` that are for example loading, disabling and processing.

```html
<FormKit
  type="form"
  @submit="(fields, node) => form.post('/login', {
    preserveScroll: true,
    onSuccess: () => form.node.reset(),
  })(fields, node)"
  :plugins="[form.plugin]"
>
  <!-- The rest of your form -->
</FormKit>
```

To cancel a form submission, use the `cancel()` method.

```html
<FormKit
  type="form"
  @submit="(fields, node) => form.post('/login')(fields, node)"
  :plugins="[form.plugin]"
>
  <!-- The rest of your form -->
</FormKit>

<FormKit type="button" @click="form.cancel()" label="Cancel" />
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### States

The `useForm()` composable also returns reactive states. The Inertia ones are: `processing`, `progress`, `recentlySuccessful` and `wasSuccessful`, the FormKit based ones are `valid`, `errors`, `dirty` and `node`. For example, you could use the `processing` state to disable the form submit button while Inertia is processing the form (assuming that you’re using your own submit button):

```html
<template>
  <FormKit type="form" @submit="submit" :plugins="[form.plugin]">
    <FormKit type="text" name="username" label="Username" />
    <FormKit type="password" name="password" label="Password" />

    <template #submit>
      <FormKit type="submit" label="Log in" :disabled="form.processing" />
    </template>
  </FormKit>
</template>
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Event Functions

If you need to new features, or want to run some code on Inertia event callbacks but want to keep the functionality of this package intact, you can use the provided event functions `on()` and `combine()`. These add functions to the event callbacks without having to deal with option merging.

The `on()` function accepts any of the events from Inertia’s event callbacks (without the `on` prefix), specifically: `before`, `start`, `progress`, `success`, `error`, `cancel`, and `finish`. The arguments passed to your callback are the Inertia event’s callback arguments and then FormKit's node:

```html
<script setup lang="ts">
  import { useForm } from '@formkit/inertia'

  const form = useForm()
  form.on('before', () => {
    return confirm('Are you sure you want to delete this user?')
  })
</script>
```

The `combine()` function is just a easier way to add multiple events in a single place:

```html
<script setup lang="ts">
  import { useForm } from '@formkit/inertia'

  const form = useForm()
  form.combine((on) => {
    on('before', () => {
      return confirm('Are you sure you want to delete this user?')
    })

    on('success', () => {
      toast('User deleted.')
    })
  })
</script>
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Event Callback Manager

The `createEventCallbackManager()` composable returns 3 functions `on()`, `combine()` and `execute()`. The `on` function accepts these events `before`, `start`, `progress`, `success`, `error`, `cancel`, `finish`:

```ts
import { createEventCallbackManager } from '@formkit/ineria'

const event = createEventCallbackManager()
event.on('before', (visit) => {
  console.log(visit)
})
```

As you can see it only gets `visit` as a parameter because `createEventCallbackManager()` was not specified that its events will receive more than that, but you can extend by passing an array of types of parameters to it:

```ts
import { createEventCallbackManager } from '@formkit/ineria'

const event = createEventCallbackManager<[node: FormKitNode]>()
event.on('before', (visit, node) => {
  console.log(visit, node)
})
```

The `combine()` function allows you to define multiple events in a single block:

```ts
// addon.ts
import { CombineFunction } from '@formkit/inertia'

return (on) => {
  on('before', (visit, node) => {
    console.log(visit, node)
  })

  on('success', (page, node) => {
    console.log(page, node)
  })
} as CombineFunction<[node: FormKitNode]>

// app.ts
import { createEventCallbackManager } from '@formkit/ineria'
import addon from './addon'

const event = createEventCallbackManager<[node: FormKitNode]>()
event.combine(addon)
```

The `execute()` function executes the given event. It expects the event, parameters, and any other parameter passed as a type to `createEventCallbackManager` and returns the result of the event callback from Inertia:

```ts
import { createEventCallbackManager } from '@formkit/ineria'

const event = createEventCallbackManager<[node: FormKitNode]>()

event.on('before', (visit, node) => {
  console.log(visit, node)
})
event.on('before', (visit, node) => {
  return false
})

const result = event.execute('before', visit, node) // runs console.log
console.log(result) // returns false
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Roadmap

- [x] Make the `success` and `error` events to be able to return a `Promise<void>` to delay the call to the `finish` event
- [ ] Add support for [Laravel Precognition](https://laravel.com/docs/10.x/precognition)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Types

<details>
  <summary><code>useForm</code></summary>

```ts
export const useForm: <F extends RequestPayload>(initialFields?: F | undefined) => {
  on: OnFunction<[node: FormKitNode]>;
  combine: CombineFunction<[node: FormKitNode]>;
  plugin: (node: FormKitNode) => false | undefined;
  get: (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => (data: F, node: FormKitNode) => void;
  post: (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => (data: F, node: FormKitNode) => void;
  put: (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => (data: F, node: FormKitNode) => void;
  patch: (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => (data: F, node: FormKitNode) => void;
  delete: (url: URL | string, options?: Exclude<VisitOptions, 'method' | 'data'>) => (data: F, node: FormKitNode) => void;
  cancel: () => void;
  node: Ref<FormKitNode | null>;
  dirty: Ref<boolean | null>;
  errors: Ref<boolean | null>;
  processing: Ref<boolean>;
  progress: Ref<number>;
  recentlySuccessful: Ref<boolean>;
  valid: Ref<boolean | null>;
  wasSuccessful: Ref<boolean>;
}
```

</details>

<details>
  <summary><code>createEventCallbackManager</code></summary>

```ts
export const createEventCallbackManager: <E extends [...args: any]>() => {
  events: Partial<{
    [K in keyof EventCallback<E>]: EventCallback<E>[K][];
  }>;
  on: <T extends keyof EventCallback<E>>(eventName: T, callback: EventCallback<E>[T]) => void;
  combine: (combineCb: (cb: typeof on) => void | ((cb: typeof on) => void)[]) => void;
  execute: <T extends keyof EventCallback<E>>(eventName: T, ...params: Parameters<EventCallback<E>[T]>) => ReturnType<EventCallback<E>[T]> | undefined;
}
```

</details>

<details>
  <summary><code>EventCallback</code></summary>

```ts
export type EventCallback<A extends [...args: any]> = {
  [K in keyof Omit<GlobalEventsMap, 'navigate' | 'invalid' | 'exception'>]
  : (...args: [...GlobalEventsMap[K]['parameters'], ...A])
    => K extends 'success' | 'error'
    ? Promise<GlobalEventsMap[K]['result']> | GlobalEventsMap[K]['result']
    : GlobalEventsMap[K]['result'];
} & {
  cancelToken: (...args: [{ cancel: () => void }, ...A]) => void;
};
```

</details>

<details>
  <summary><code>OnFunction</code></summary>

```ts
export type OnFunction<A extends [...args: any]> = ReturnType<typeof createEventCallbackManager<A>>['on'];
```

</details>

<details>
  <summary><code>CombineFunction</code></summary>

```ts
export type CombineFunction<A extends [...args: any]> = ReturnType<typeof createEventCallbackManager<A>>['combine'];
```

</details>

</details>

<details>
  <summary><code>ExecuteFunction</code></summary>

```ts
export type ExecuteFunction<A extends [...args: any]> = ReturnType<typeof createEventCallbackManager<A>>['execute'];
```

</details>

<p align="right">(<a href="#readme-top">back to top</a>)</p>
