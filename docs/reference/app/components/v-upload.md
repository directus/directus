# Upload

Allows you to easily make files uploadable using this component.

```html
<v-upload @input="onUpload"></v-upload>
```

## Reference

#### Props

| Prop           | Description                                 | Default     | Type      |
| -------------- | ------------------------------------------- | ----------- | --------- |
| `multiple`     | Allow to upload multiple files              | `false`     | `Boolean` |
| `preset`       | Preset values of the uploaded file          | `() => ({)` | `Object`  |
| `file-id`      | The id of the uploaded file                 | `null`      | `String`  |
| `from-url`     | Allow uploading files from an url           | `false`     | `Boolean` |
| `from-library` | Allow selecting files from the file library | `false`     | `Boolean` |

#### Events

| Event   | Description                   | Value |
| ------- | ----------------------------- | ----- |
| `input` | When files have been uploaded |       |
