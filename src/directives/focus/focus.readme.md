# Focus

The focus directive is basically `autofocus`, but works in Vue. Because of the way HTML works, `autofocus` isn't triggered for DOM elements that are added after first load, which means that `autofocus` basically never works in the context of the Directus app. That's where you can use `v-focus` instead:

```html
<v-input v-focus />
```

## Value
You can pass it a boolean value if you need more fine grained control over when focus is set:

```html
<v-input v-focus="active" />
```
