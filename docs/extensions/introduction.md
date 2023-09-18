---
contributors: Rijk Van Zanten, Esther Agbaje
description: Discover how Directus extensions enable you to expand its features and how you can customize it to suit your specific needs.
---

# Extensions

Extensions provide a way to build, modify or expand upon Directus' functionality beyond the default suite, for your
specific needs. There are three main categories of extensions:

1. App Extensions
2. Api Extensions
3. Hybrid Extensions

## App Extensions

App extensions are also known as frontend extensions. They provide visual and client-side modifications to the Directus
Explore, Editor and Insights. Examples include:

### 1. Interfaces

[Interfaces](/extensions/interfaces) allow you to customise how a user will interact with the data of an item. For
example, you could create an extension that allows the user to draw some vector graphic which then would be turned into
json in the interface and saved to the database. Created with Vue.js.

![Interfaces](https://marketing.directus.app/assets/356e156b-bfb0-4ce3-b691-a2abdb589f89.png)

### 2. Layouts

[Layouts](/extensions/layouts) give you control over how data inside a collection gets presented. Out of the box,
Directus provides data layouts using table, cards, calendar and map. However, with layout extensions, you can implement
a custom layout to present your data. For example, a layout that renders your data in a 4 dimensional hypersphere.
Created with Vue.js.

![Layouts](https://marketing.directus.app/assets/b49628ec-3281-48ff-ac56-8f8c5cc1e450.png)

### 3. Displays

[Displays](/extensions/displays) enable you to customzie the way data gets displayed in layouts. For instance, if you
have a field with values ranging from 0 to 10 you could create a interface that shows a progress bar relative to that
value. Created with Vue.js.

![Displays](https://marketing.directus.app/assets/d005fd0d-9357-4f4e-8394-4cbee9e7ed90.png)

### 4. Panels

[Panels](/extensions/panels) are similar to displays in that they display data in a certain way. However, panels are
specifically designed to visualize data within Directus Insights and dashboards. Created with Vue.js.

![Panels](https://marketing.directus.app/assets/694b89e7-6465-424d-a118-a3a00d5ff23a.png)

### 5. Modules

[Modules](/extensions/modules) introduce a whole new level of extensibility to Directus by allowing you to add an
entirely new page your Directus app. For example, a page solely containing an integration with an external service. When
new modules are added, they appear as new icons in the main module side bar. Created with Vue.js.

![Modules](https://marketing.directus.app/assets/4bd58ad0-d564-44e9-b594-83d9f69941ad.png)

## Api Extensions

Api extensions (also known as backend extensions) modify Directus server-side related functionalities such as data
sources and custom workflows. Examples include:

### 1. Endpoints

[Endpoints](/extensions/endpoints) allow for creating your own custom endpoints to the Express instance of Directus.
Created with JavaScript / Node.js

### 2. Hooks

[Hooks](/extensions/hooks) are the code only variant to Flows. So you can wait for changes within Directus and then
execute custom code when that event triggers. Created with JavaScript / Node.js

## Hybrid Extensions

Hybrid extensions modify both frontend and backend functionality. Hence, they allow expanding upon both the admin app
interface and the API.

### 1. Flow Operations

[Flow Operations](/extensions/operations) are small modules inside flows that allow for complex processes when combining
them with each other. An operation extension could be an integration with a 3rd party service or simply a regex
validator for a given string. Created with Vue.js and JavaScript / Node.js

### 2. Bundles

[Bundles](/extensions/bundles) allow you to combine many small extensions into one large extension. The benefit of this
is that if your extensions share a lot of dependencies, bundles allow to share those between all you extensions inside
the bundle and reduce the filesize a lot when building. Created with Vue.js and JavaScript / Node.js
