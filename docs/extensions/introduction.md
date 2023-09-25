---
contributors: Rijk Van Zanten, Esther Agbaje
description: Discover how Directus extensions enable you to expand its features and how you can customize it to suit your specific needs.
---

# Extensions

Extensions provide a way to build, modify or expand Directus' functionality beyond the default, for your specific needs.
There are three main categories of extensions:

1. App Extensions
2. API Extensions
3. Hybrid Extensions

## App Extensions

App extensions (also known as frontend extensions) provide visual and client-side modifications to the Directus App.

### Interfaces

[Interfaces](/extensions/interfaces) provide the user with ways to create and edit items through forms and other
elements.

### Layouts

[Layouts](/extensions/layouts) give you control over how data inside a collection gets presented. Out of the box,
Directus provides data layouts such as _table_, _cards_, _calendar_ and _map_. However, with layout extensions, you can
implement a custom layout extension to present your data. For example, a layout that renders your data in a 4
dimensional sphere.

### Displays

[Displays](/extensions/displays) enable you to customize the way data gets displayed in layouts. For instance, if you
have a field with values ranging from 0 to 10 you could create an interface that shows a progress bar relative to that
value.

### Panels

[Panels](/extensions/panels) are similar to displays in that they display data in a certain way. However, panels are
specifically designed to visualize data within Directus Insights.

### Modules

[Modules](/extensions/modules) introduce a whole new level of extensibility to Directus by allowing you to add an
entirely new page your Directus app. For example, a page solely containing an integration with an external service. When
new modules are added, they appear as new icons in the main module side bar.

## API Extensions

API extensions (also known as backend extensions) modify Directus server-side related functionalities such as APIs, data
sources and custom workflows. Examples include:

### Endpoints

[Endpoints](/extensions/endpoints) allow for creating your own custom endpoints to the Express instance of Directus.

### Hooks

[Hooks](/extensions/hooks) are the code only variant to Flows. So you can wait for changes within Directus and then
execute custom code when that event triggers.

## Hybrid Extensions

Hybrid extensions modify both frontend and backend functionality. Hence, they allow expanding upon both the admin app
interface and the API.

### Flow Operations

[Flow Operations](/extensions/operations) are small modules inside flows that allow for complex processes when combining
them with each other. An operation extension could be an integration with a 3rd party service or simply a regex
validator for a given string.

### Bundles

[Bundles](/extensions/bundles) allow you to combine many small extensions into one large extension. The benefit of this
is that if your extensions share a lot of dependencies, bundles allow to share those between all you extensions inside
the bundle and reduce the file size considerably when building.

::: tip Extensions Library

Here's a [list of various extensions](https://github.com/directus-community/awesome-directus#extensions) created by the
Directus Community.

:::
