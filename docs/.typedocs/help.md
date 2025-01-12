# Help

## Add a Package

To add packages to the Typedocs in the Docs, just follow these steps.

1. In the package itself, add a TypeDoc config to the TSConfig file.

```diff
{
	"extends": "@directus/tsconfig/node22",
	"compilerOptions": {
		"outDir": "dist"
	},
	"include": ["src"],
+	"typedocOptions": {
+        "entryPoints": ["./src"]
+    }
}

```

2. Add the entry point to the `options.json` file in this folder.
3. Update the link to the package in the `docs/contributing/codebase-overview.md` file.
