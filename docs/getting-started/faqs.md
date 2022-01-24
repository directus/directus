# FAQs

:::details How to see / edit Raw Value?

To see / edit `Raw Value` you need to:

1. Open an item page
1. Click on the field name you want to see / edit the value
1. Click on `Raw Value`

**Demonstration**

<video alt="See / edit Raw Value on Directus" muted controls>
  <source src="https://cdn.directus.io/docs/v9/getting-started/faqs/raw-value-220124.mp4" type="video/mp4">
</video>
:::

:::details How to debug Directus?

There's two approaches to debug Directus:

- By setting environment variable `DEBUG=*`
  - This will log requests, queries on database and other useful logs.
- Run with debbuger and attach to it. For this approach you need to:
  1. Run the following command inside your directus instance folder
  ```sh
    node --inspect node_modules/.bin/directus start
  ```
  2. Attach debugger via VSCode or another debugger client, like Chrome

**Demonstration**

<video alt="Debug Directus" muted controls>
  <source src="https://cdn.directus.io/docs/v9/getting-started/faqs/debugger-220124.mp4" type="video/mp4">
</video>
:::
