import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    "*": "vp check --fix"
  },
  lint: {
    "plugins": [
      "oxc",
      "typescript",
      "unicorn",
      "react",
      "vue"
    ],
    "categories": {
      "correctness": "warn"
    },
    "env": {
      "builtin": true,
      "es2023": true,
      "browser": true,
      "node": true
    },
    "globals": {
      "AudioWorkletGlobalScope": "readonly",
      "AudioWorkletProcessor": "readonly",
      "currentFrame": "readonly",
      "currentTime": "readonly",
      "registerProcessor": "readonly",
      "sampleRate": "readonly",
      "WorkletGlobalScope": "readonly"
    },
    "ignorePatterns": [
      "**/dist/",
      "packages/extensions-sdk/templates/",
      "api/extensions/"
    ],
    "rules": {
      "constructor-super": "error",
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-case-declarations": "error",
      "no-class-assign": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-const-assign": "error",
      "no-constant-binary-expression": "error",
      "no-constant-condition": "error",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-delete-var": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": "error",
      "no-empty-character-class": "error",
      "no-empty-pattern": "error",
      "no-empty-static-block": "error",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-fallthrough": "error",
      "no-func-assign": "error",
      "no-global-assign": "error",
      "no-import-assign": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-new-native-nonconstructor": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-obj-calls": "error",
      "no-prototype-builtins": "error",
      "no-redeclare": "error",
      "no-regex-spaces": "error",
      "no-self-assign": "error",
      "no-setter-return": "error",
      "no-shadow-restricted-names": "error",
      "no-sparse-arrays": "error",
      "no-this-before-super": "error",
      "no-undef": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-unused-private-class-members": "error",
      "no-unused-vars": "error",
      "no-useless-backreference": "error",
      "no-useless-catch": "error",
      "no-useless-escape": "error",
      "no-with": "error",
      "require-yield": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "no-nested-ternary": "error",
      "curly": [
        "error",
        "multi-line"
      ],
      "@typescript-eslint/ban-ts-comment": "error",
      "no-array-constructor": "error",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-extra-non-null-assertion": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-this-alias": "error",
      "@typescript-eslint/no-unnecessary-type-constraint": "error",
      "@typescript-eslint/no-unsafe-declaration-merging": "error",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "no-unused-expressions": "error",
      "@typescript-eslint/no-wrapper-object-types": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/prefer-namespace-keyword": "error",
      "@typescript-eslint/triple-slash-reference": "error",
      "vue/no-arrow-functions-in-watch": "error",
      "vue/no-deprecated-destroyed-lifecycle": "error",
      "vue/no-export-in-script-setup": "error",
      "vue/no-lifecycle-after-await": "error",
      "vue/prefer-import-from-vue": "error",
      "vue/valid-define-emits": "error",
      "vue/valid-define-props": "error",
      "vue/no-multiple-slot-args": "warn",
      "vue/no-required-prop-with-default": "warn"
    },
    "overrides": [
      {
        "files": [
          "**/*.ts",
          "**/*.tsx",
          "**/*.mts",
          "**/*.cts",
          "**/*.vue"
        ],
        "rules": {
          "constructor-super": "off",
          "getter-return": "off",
          "no-class-assign": "off",
          "no-const-assign": "off",
          "no-dupe-class-members": "off",
          "no-dupe-keys": "off",
          "no-func-assign": "off",
          "no-import-assign": "off",
          "no-new-native-nonconstructor": "off",
          "no-obj-calls": "off",
          "no-redeclare": "off",
          "no-setter-return": "off",
          "no-this-before-super": "off",
          "no-undef": "off",
          "no-unreachable": "off",
          "no-unsafe-negation": "off",
          "no-var": "error",
          "no-with": "off",
          "prefer-const": "error",
          "prefer-rest-params": "error",
          "prefer-spread": "error"
        }
      },
      {
        "files": [
          "**/*.{ts,vue}"
        ],
        "rules": {
          "@typescript-eslint/ban-ts-comment": "off",
          "@typescript-eslint/no-explicit-any": "off",
          "no-unused-vars": [
            "warn",
            {
              "argsIgnorePattern": "^_",
              "varsIgnorePattern": "^_"
            }
          ]
        }
      }
    ],
    "options": {
      "typeAware": true,
      "typeCheck": true
    }
  },
  fmt: {
    "printWidth": 120,
    "singleQuote": true,
    "proseWrap": "always",
    "htmlWhitespaceSensitivity": "ignore",
    "sortPackageJson": false,
    "ignorePatterns": [
      "dist/",
      "coverage/",
      "pnpm-lock.yaml",
      ".histoire/",
      "**/.vitepress/cache/",
      "/.changeset/pre.json",
      "/.changeset/*.md",
      "/app/src/lang/translations/*.yaml",
      "!/app/src/lang/translations/en-US.yaml",
      "/api/uploads/",
      "/api/extensions/"
    ]
  },
});
