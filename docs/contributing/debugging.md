# Debugging

> This guide should help you with debugging the app and api.

## Debugging the App

There are several ways to debug the app but the easiest way to do it is with the
[Vue Devtools](https://chrome.google.com/webstore/detail/vuejs-devtools/ljjemllljcmogpfapbkkighbhhppjdbg). It's
recommended to use the Vue Devtools with Chrome as the Devtools for Firefox are still really buggy.

::: tip Computed Debugging To debug computed properties, it can be helpful to have a look at this
[Vue Guide](https://v3.vuejs.org/guide/reactivity-computed-watchers.html#computed-debugging). :::

## Debugging the Api

To debug the api, we recommend to use [Visual Studio Code](https://code.visualstudio.com/) with it's build in debugger.
You first have to setup the config for starting the debugger. Create the following file
`./directus/api/.vscode/launch.json` and paste in the following structure.

```
{
    "version": "0.2.0",
    "configurations": [

        {
            "type": "pwa-node",
            "request": "launch",
            "name": "Debug Api",
            "skipFiles": [
                "<node_internals>/**"
            ],
            "program": "${workspaceFolder}/src/start.ts",
            "preLaunchTask": "npm: build",
            "outFiles": [
                "${workspaceFolder}/dist/**/*.js"
            ]
        }
    ]
}
```

::: warning Disable Cache Make sure that you have caching disabled as it otherwise returns the cached response. To
disable this, goto your `.env` file in the api and set `CACHE_ENABLED` to `false`. :::

Now you can start the api by going to the debugger view in VS Code, select to debug the Api and press `Start Debugging`.
This runs the api and allows you to set breakpoints.
