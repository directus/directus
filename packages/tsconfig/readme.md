# @directus/tsconfig

Shared TSConfig files used by the projects in the Directus ecosystem.

The following configs are available:

- [`node-cjs`](./node-cjs/tsconfig.json) - Config for CommonJS modules running under Node.js 18
- [`node-esm`](./node-esm/tsconfig.json) - Config for ESM modules running under Node.js 18
- [`vue3`](./vue3/tsconfig.json) - Config for Vue.js 3 modules
- [`base`](./base/tsconfig.json) - Set of basic rules (included in all of the configs above)

## Usage

```
pnpm add @directus/tsconfig
```

To use one of the shared config, extend the local `tsconfig.json` from it:

```json
{
	"extends": "@directus/tsconfig/node-esm"
}
```
