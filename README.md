<h3 id="readme-top"></h3>

# FormKit Inertia Integration

<a href="https://github.com/formkit/inertia/actions/workflows/ci.yml">
  <img title="Build Badge" alt="GitHub Build Status" src="https://github.com/formkit/inertia/actions/workflows/ci.yml/badge.svg">
</a>
<a href="https://www.npmjs.com/package/@formkit/inertia">
  <img title="Npm Version" alt="Npm Version" src="https://img.shields.io/npm/v/@formkit/inertia">
</a>
<a href="https://github.com/formkit/inertia/blob/main/LICENSE.txt">
  <img title="Npm Version" alt="Npm Version" src="https://img.shields.io/github/license/formkit/inertia">
</a>

This project aims to seamlessly integrate Inertia.js with FormKit forms, leveraging a robust event system that harnesses Inertia.js event callbacks and FormKit plugins for a smooth and powerful web development experience, and here is why:

- Your time should be used on creating forms and backends, not integrations.
- Having an easy to install and use package, makes it so you don't need to care about packaging and publishing.

### Table of Contents

1. [Quick Start](#quick-start)
2. [The Composable `useForm()`](#the-composable-useform)
   1. [Method Calls](#method-calls)
   2. [States](#states)
   3. [Event Functions](#event-functions)
3. [Event System](#event-system)
4. [Roadmap](#roadmap)
5. [Types](#types)

## Quick Start

First, you should already have a Laravel with InertiaJS application, you can check the docs on how [here](https://laravel.com/docs/10.x/starter-kits#breeze-and-inertia).

You also should already have FormKit added to your vue application, you can check the docs on how [here](https://formkit.com/getting-started/installation).

Now you have all requisites ready to use this package, you can install it with your preferred package manager.

```bash
npm install @formkit/inertia
```

You should be able to to use the now available composable `useForm()`:

```ts
import { useForm } from '@formkit/inertia'

const form = useForm()
const submit = form.post('/login')

<FormKit type="form" @submit="submit" :plugins="[form.plugin]">
  // The rest of your form goes here
</FormKit>
```

And that is it, now you're ready to look more into the available features of this package, like the agnostic [event system]() and more about the [vue composable]().

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## The Composable `useForm()`

To make integration between FormKit and Inertia easier we include a form helper composable designed to reduce the boilerplate needed for handling form submissions, it by default creates the event system, add method calls and reactive states, and it will also add default behaviours to FormKit forms like loading, disabling and setting errors that come from your backend.

The `useForm()` accepts a single optional parameter that is the initial fields of your form:

```ts
const form = useForm({
  email: 'foo@bar.baz',
})
```

> Remember that for everything to work as expected you should add the returned plugin to FormKit: `:plugins="[form.plugin]"`.

### Method Calls

To submit the form, `useForm()` returns the methods `get`, `post`, `put`, `patch` and `delete`, any of those will return a suitable function that FormKit `@submit` expects.

The easiest way to use it is by creating a new `const` with the resulting method of your choice:

```html
<script setup lang="ts">
  import { useForm } from '@formkit/inertia'

  const form = useForm()
  const submit = form.post('/login')
</script>

<template>
  <FormKit type="form" @submit="submit" :plugins="[form.plugin]">
    <FormKit type="text" name="username" label="Username" />
    <FormKit type="password" name="password" label="Password" />
  </FormKit>
</template>
```

But you can also manually pass the variables to the returned function:

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

> Those will also remove any default events to that specific event, meaning that if you for example add `onStart` you will lose the events from `start` that are for example loading, disabling and processing.

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

The `useForm()` returns some helpful reactive states, the Inertia based ones are: `processing`, `progress`, `recentlySuccessful` and `wasSuccessful`, the FormKit based ones are `valid`, `errors`, `dirty` and `node`.

> All FormKit based states will be null if `form.plugin` wasn't added to the FormKit form input.

Those events can be helpful for example for disabling the form submit button if you're using your own submit instead of the provided FormKit one:

> The `node` can be really helpful if you need the underlining [FormKit node](https://formkit.com/essentials/architecture).

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

If you need to new features, or want to run some code on Inertia event callbacks but want to keep the functionality of this package intact, you can use the provided event functions `on()` and `combine()`, those functions are meant to add functions to the event callbacks without having to deal with option merging.

The `on()` function accepts any of the events from Inertia event callbacks without the `on` prefix, those being `before`, `start`, `progress`, `success`, `error`, `cancel`, `finish` and the parameters will be always the event callback parameter then FormKit's node:

> Returning false from the `before` event will cause the visit to be cancelled.

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

## Event System

The core functionality of all comes from the simple and yet porweful event system wrapper for Inertia visit options, the `useForm()` uses the `useEventsSystem()` to create a way to access and retrive the event callbacks with multiple function calls correctly, without having to deal with object merging.

The `useEventsSystem()` returns 4 functions `on()`, `combine()`, `execute()` and `toVisitOptions()`, the `on` function is just the same as its passed to the return of `useForm`, it also accepts these events `before`, `start`, `progress`, `success`, `error`, `cancel`, `finish`:

```ts
const event = useEventsSystem()
event.on('before', (visit) => {
  console.log(visit)
})
```

As you can see it only gets `visit` as a parameter because `useEventsSystem()` was not specified that its events will receive more than that, but you can extend by passing an array of types of parameters to it:

> We do that for `useForm()` so that the events also receive [`FormKitNode`](https://formkit.com/api-reference/formkit-core#formkitnode) from FormKit.

```ts
const event = useEventsSystem<[node: FormKitNode]>()
event.on('before', (visit, node) => {
  console.log(visit, node)
})
```

The `combine()` function is meant to be used for easily pass multiple events in a single place:

```ts
// addon.ts
return (on) => {
  on('before', (visit, node) => {
    console.log(visit, node)
  })

  on('success', (page, node) => {
    console.log(page, node)
  })
}

// app.ts
import addon from './addon'

const event = useEventsSystem<[node: FormKitNode]>()
event.combine(addon)
```

The `execute()` function runs the events expects the event and the parameters to returns the expected return of that event callback from Inertia:

```ts
const event = useEventsSystem<[node: FormKitNode]>()

event.on('before', (visit, node) => {
  console.log(visit, node)
})
event.on('before', (visit, node) => {
  return false
})

const result = event.execute('before', visit, node) // runs console.log
console.log(result) // returns false
```

The `toVisitOptions()` functions returns a `VisitOptions` with all events that where passed prior to it by wrapping the `execute()` function, and its already ready to used in Inertia's `router()` function:

```ts
const event = useEventsSystem<[node: FormKitNode]>()

event.on('before', (visit, node) => {
  console.log(visit, node)
})
event.on('start', (visit, node) => {
  console.log(visit, node)
})

const options = event.toVisitOptions(node)
/**
 * {
 *    onBefore: (visit) => {
 *        return execute('before', visit, node)
 *    },
 *    onStart: (visit) => {
 *        return execute('start', visit, node)
 *    },
 * }
 */

router.post('/login', options)
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Roadmap

- [ ] Make the `success` and `error` events to be able to return a `Promise<void>` to delay the call to the `finish` event
- [ ] Add support for [Laravel Precognition](https://laravel.com/docs/10.x/precognition)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Types

<details>
  <summary><code>useForm</code></summary>

```ts
const useForm: <F extends RequestPayload>(
  initialFields?: F | undefined
) => {
  on: <
    T extends
      | 'before'
      | 'start'
      | 'progress'
      | 'finish'
      | 'cancel'
      | 'success'
      | 'error'
      | 'cancelToken'
  >(
    eventName: T,
    callback: Events<[node: FormKitNode]>[T]
  ) => void
  combine: (
    combineCb: (
      cb: <
        T extends
          | 'before'
          | 'start'
          | 'progress'
          | 'finish'
          | 'cancel'
          | 'success'
          | 'error'
          | 'cancelToken'
      >(
        eventName: T,
        callback: Events<[node: FormKitNode]>[T]
      ) => void
    ) =>
      | void
      | ((
          cb: <
            T extends
              | 'before'
              | 'start'
              | 'progress'
              | 'finish'
              | 'cancel'
              | 'success'
              | 'error'
              | 'cancelToken'
          >(
            eventName: T,
            callback: Events<[node: FormKitNode]>[T]
          ) => void
        ) => void)[]
  ) => void
  plugin: (node: FormKitNode) => false | undefined
  node: Ref<FormKitNode | null>
  dirty: Ref<boolean | null>
  errors: Ref<boolean | null>
  processing: Ref<boolean>
  progress: Ref<number>
  recentlySuccessful: Ref<boolean>
  valid: Ref<boolean | null>
  wasSuccessful: Ref<boolean>
  get: (
    url: URL | string,
    options?: Exclude<VisitOptions, 'method' | 'data'>
  ) => (data: F, node: FormKitNode) => void
  post: (
    url: URL | string,
    options?: Exclude<VisitOptions, 'method' | 'data'>
  ) => (data: F, node: FormKitNode) => void
  put: (
    url: URL | string,
    options?: Exclude<VisitOptions, 'method' | 'data'>
  ) => (data: F, node: FormKitNode) => void
  patch: (
    url: URL | string,
    options?: Exclude<VisitOptions, 'method' | 'data'>
  ) => (data: F, node: FormKitNode) => void
  delete: (
    url: URL | string,
    options?: Exclude<VisitOptions, 'method' | 'data'>
  ) => (data: F, node: FormKitNode) => void
  cancel: () => void
}
```

</details>

<details>
  <summary><code>Events</code></summary>

```ts
export type Events<A extends [...args: any]> = {
  [K in keyof Omit<GlobalEventsMap, 'navigate' | 'invalid' | 'exception'>]: (
    ...args: [...GlobalEventsMap[K]['parameters'], ...A]
  ) => GlobalEventsMap[K]['result']
} & {
  cancelToken: (...args: [{ cancel: () => void }, ...A]) => void
}
```

</details>

<details>
  <summary><code>EventsList</code></summary>

```ts
export type EventsList<A extends [...args: any]> = {
  [K in keyof Events<A>]: Events<A>[K][]
}
```

</details>

</details>

<details>
  <summary><code>useEventsSystem</code></summary>

```ts
const useEventsSystem: <E extends any[]>() => {
  on: <
    T extends
      | 'before'
      | 'start'
      | 'progress'
      | 'finish'
      | 'cancel'
      | 'success'
      | 'error'
      | 'cancelToken'
  >(
    eventName: T,
    callback: Events<E>[T]
  ) => void
  combine: (
    combineCb: (
      cb: <
        T extends
          | 'before'
          | 'start'
          | 'progress'
          | 'finish'
          | 'cancel'
          | 'success'
          | 'error'
          | 'cancelToken'
      >(
        eventName: T,
        callback: Events<E>[T]
      ) => void
    ) =>
      | void
      | ((
          cb: <
            T extends
              | 'before'
              | 'start'
              | 'progress'
              | 'finish'
              | 'cancel'
              | 'success'
              | 'error'
              | 'cancelToken'
          >(
            eventName: T,
            callback: Events<E>[T]
          ) => void
        ) => void)[]
  ) => void
  execute: <
    T extends
      | 'before'
      | 'start'
      | 'progress'
      | 'finish'
      | 'cancel'
      | 'success'
      | 'error'
      | 'cancelToken'
  >(
    eventName: T,
    ...params: Parameters<Events<E>[T]>
  ) => ReturnType<Events<E>[T]> | undefined
  toVisitOptions: (...params: E) => VisitOptions
}
```

</details>

<p align="right">(<a href="#readme-top">back to top</a>)</p>
