# App Reference

The purpose of the app reference is to allow more and easier access to our internal components when developing custom
interfaces, displays or modules.

## App Structure

The Vue frontend app is structured into many departments to combine similar purpose components.

| Folder        | Content                                                                                               | Example                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `components`  | In here are our base components that are designed to be as general and everywhere fitting as possible | It contains `v-button`                                                                      |
| `composables` | Composables are reusable pieces of logic that can be used inside Vue component                        | `use-shortcut` to easily react to button combinations pressed                               |
| `directives`  | Directives are functions that are available on Vue components in templates                            | contains `v-focus` or `v-tooltip`                                                           |
| `displays`    | Displays are functions / components that are used in the system to display data                       | `display-image` is used to display image data inside the app                                |
| `interfaces`  | Interfaces are the individual blocks that allow editing and viewing individual pieces of data         | `interface-color` is a color picker allowing for easy selection of any color                |
| `lang`        | Containing all translations used across the directus app                                              | Contains translations like `en-US`                                                          |
| `layouts`     | Layouts change the way items are represented inside the collection view                               | The card and tabular layout are inside here                                                 |
| `modules`     | Modules organize in which major parts the app is structured                                           | Here are the files or settings module which are always visible from the sidebar             |
| `routes`      | Basic routes the app needs that shouldn't be customized                                               | Routes for authentication or password reset                                                 |
| `stores`      | Here lay all stores used in the app containing all relevant data that gets fetched from the api       | The `fields` store containing all accessible fields for the user                            |
| `styles`      | All general styles, css-vars, mixins and themes are stored inside here                                | The `form-grid` mixin allowing to style form like grids                                     |
| `types`       | Contains types used to generalize data for typescript                                                 | `field-schema` which is used to model the schema of fields                                  |
| `utils`       | Utility functions that helps minimize repetition                                                      | `notify` which is used to easily generate notifications inside the app                      |
| `views`       | Views are the top-level parent component that are used in all modules                                 | `private-view` which renders the basic structure like sidebar, headers and content sections |
