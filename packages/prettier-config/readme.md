# @directus/prettier-config

A sharable [prettier](https://prettier.io/) configuration used by Directus.

## Installation

Install `prettier` and `@directus/prettier-config`:

    npm install --save-dev prettier @directus/prettier-config

## Usage

Add `@directus/prettier-config` in the `extends` property of your
[prettier configuration file](https://prettier.io/docs/en/configuration.html):

```js
// .prettierrc.js
module.exports = {
	...require('@directus/prettier-config'),
	// your overrides here
};
```
