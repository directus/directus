---
description: A guide on how to migrate your run scripts containing modules
readTime: 5 min read
---

# Why are we deprecating modules in run-script?

Because they where never really intended for such use anyways.

# How to migrate?

## 1. Create a new Operation Extension

```bash
npm init directus-extension@latest
```

Then you get this prompt:

```bash
? Choose the extension type
  panel
  hook
  endpoint
❯ operation
  bundle
  interface
  display
(Move up and down to reveal more choices)
```
Go ahead and select `operation`.

Then Choose a name like `my-lodash-operation`.

Next, select if you want to work with typescript or javascript, this guide will use typescript.

After it finished loading, you can open the folder like so:

```bash
cd my-lodash-operation
```

## 2. Install lodash

```bash
npm i lodash
npm i --save-dev @types/lodash
```

after that, you can open the folder in your favorite editor.

You should be able to see the following structure:

```bash
my-lodash-operation
├── package.json
├── .gitignore
├── src
│   ├── api.ts
│   ├── app.ts
│   └── shims.d.ts
└── tsconfig.json
```

Of interest to us are only the `src/app.ts`, `src/api.ts` and `package.json` files.

In the `package.json` you can add more meta information to your extension.

## 3. Add lodash to the operation

Open `src/api.ts` and update it like so:

<!-- + means added, ~ means changed, - means removed -->
```ts
import { defineOperationApi } from '@directus/extensions-sdk';
+ import { camelCase } from 'lodash'

type Options = {
	text: string;
};

export default defineOperationApi<Options>({
~	id: 'lodash-operation',
	handler: ({ text }) => {

-       console.log(text)
+		return {
+			text: camelCase(text)
+		}
	},
});
```

Note that we first imported lodash, then we changed the id to something unique, then we returned an object which uses the lodas `camelCase` function to transform the text.

Don't forget to update the same id in the `src/app.ts` file.

## 4. Deploy the operation to Directus

```bash
npm run build
npm run link ../path/to/directus/extensions
```

::: tip Linking

Note that is important to link to the path where all extensions are located, not to the root folder of your Directus instance

:::

## 5 Swap out the old operation with the new one
