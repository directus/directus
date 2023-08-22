---
description: A simple recipe to slugify a string of text using the Run Script operation.
directus_version: 9.18.1
author: Eron Powell
---

# Slugify Text With Flows

<GuideMeta />

## Explanation

In some cases, you may want to take text from a title or other source and slugify it. Here's how you can implement this
in a flow. Keep in mind, slugification methods can get quite complex. This recipe is intended for basic, everyday
English text.

## The Recipe

::: tip Requirements

You'll need a string somewhere in your [data chain](/app/flows#data-chains).

:::

1. Create a [Run Script](/app/flows/operations#run-script) operation in your flow.
2. Paste the following function into your Run Script operation.

```js
module.exports = async function (data) {
	// Index data to get the string you want to slugify
	// Assign it to the "text" var below.
	const text = data.opKey.nested_value;

	const slug = text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return slug;
};
```

## Final Tips

Remember, the returned value doesn't need to be a string. You can append any valid JSON onto the data chain. You could
take in an array of strings, slugify all of them, push each to a new array, and append it onto the data chain... _or
whatever your use-case calls for!_
