# WYSIWYG

Rich Text editor based on TineMCE.

## Options

| Option              | Description                                                                                      | Default     |
| ------------------- | ------------------------------------------------------------------------------------------------ | ----------- |
| `toolbar`           | What toolbar options to show                                                                     | _See below_ |
| `custom-formats`    | What custom html blocks to show in the editor                                                    | `null`      |
| `font`              | Font to render the value in (`sans-serif`, `serif`, or `monospace`)                              | `serif`     |
| `tinymce-overrides` | Override any of the [init options](https://www.tiny.cloud/docs/configure/integration-and-setup/) | `null`      |

### Toolbar defaults

```
bold,
italic,
underline,
removeformat,
link,
bullist,
numlist,
blockquote,
h1,
h2,
h3,
image,
media,
hr,
code,
fullscreen
```

## Events

| Event   | Description | Value |
| ------- | ----------- | ----- |
| `input` |             |       |

## Props

| Prop                | Description | Default         | Type                                                         |
| ------------------- | ----------- | --------------- | ------------------------------------------------------------ |
| `value`             |             | `''`            | `String`                                                     |
| `toolbar`           |             | `() => ['bold'` | `string[]`                                                   |
| `font`              |             | `'sans-serif'`  | `String as PropType<'sans-serif' or 'serif' or 'monospace'>` |
| `custom-formats`    |             | `() => []`      | `CustomFormat[]`                                             |
| `tinymce-overrides` |             | `null`          | `Object`                                                     |
| `disabled`          |             | `true`          | `Boolean`                                                    |
| `image-token`       |             | `undefined`     | `String`                                                     |
