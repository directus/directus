# @directus/eslint-config

A sharable [eslint](https://eslint.org/) configuration used by Directus.

## Installation

Install `eslint` and `@directus/eslint-config`:

    npm install --save-dev eslint @directus/eslint-config

## Usage

Add `@directus/eslint-config` in the `extends` property of your
[eslint configuration file](https://eslint.org/docs/user-guide/configuring/configuration-files#configuration-file-formats):

```js
// .eslintrc.js
module.exports = {
	extends: ['@directus/eslint-config'],
};
```
