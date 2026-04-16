> [!NOTE]
>
> The following test website and guide are intended to be used or testing and development purposes, not for production
> use!

# Test Website

This test website is based on the Simple CMS Starter Template of [@directus-labs](https://github.com/directus-labs/).

## Setup Instructions

While you can also set up the Visual Editing test website with a Directus instance running in a
[Docker](https://directus.io/docs/getting-started/create-a-project#docker-installation) container, this guide describes
setting up a development environment using the official Directus repository.

### Set up your Directus Dev Instance

1.  Clone the official [Directus GitHub repository](https://github.com/directus/directus) and make sure you have the
    dependencies installed (`pnpm i`) and build everything (`pnpm build`)!
2.  Create a new database (sqlite is recommended for development) and add the env config in `api/.env`

    <details><summary>Example .env file</summary>

    ```sh
    PUBLIC_URL=http://localhost:8080
    KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    SECRET="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    ADMIN_EMAIL=admin@directus.io
    ADMIN_PASSWORD=secret
    CACHE_ENABLED=true
    CACHE_AUTO_PURGE=true
    CACHE_TTL=1d
    CORS_ENABLED=true
    CORS_ORIGIN=http://localhost:3000
    CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC=http://localhost:3000
    DB_CLIENT=sqlite3
    DB_FILENAME=db.sqlite3
    ```

    </details>

3.  Double check that the following env vars are set:

    ```sh
     CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC=http://localhost:3000
     CACHE_AUTO_PURGE=true
    ```

4.  Run `pnpm --filter api cli bootstrap` to set up the db
5.  Run the dev servers: `pnpm --filter api dev` and `pnpm --filter app dev`
6.  Login to Directus Studio, create a token for your user and have it ready

### Set up the test website

1. Clone the separate [Visual Editing library repository](https://github.com/directus/visual-editing), open it in a new
   window in your code editor on the `main` branch
2. Add the env vars to `test-website/simple-cms/nuxt/.env` and make sure to provide `<your-token>` and the correct.
   `DIRECTUS_URL`

   ```sh
   DIRECTUS_URL=http://localhost:8080
   DIRECTUS_FORM_TOKEN=<your-token>
   DIRECTUS_SERVER_TOKEN=<your-token>
   NUXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. Now, install the Directus template

   ```sh
   cd test-website/template && npm run setup-directus
   ```

   On Windows, use the following command and make sure to replace `<directus-url>` with your Directus URL and
   `<your-token>` with the token you generated earlier.

   ```sh
   cd test-website/template && npx directus-template-cli@latest apply -p --directusUrl=<directus-url> --templateLocation=. --templateType=local --directusToken=<your-token>
   ```

### Set up the library

1. Install the package: `pnpm i` from the root of the Visual Editing library repository
2. Build the package: `pnpm build`
3. Then install the test-website dependencies: `cd test-website/simple-cms/nuxt/ && pnpm i`
4. And from that folder (test-website/simple-cms/nuxt) run it with `pnpm visual-editing:ssr--refresh`

> [!NOTE]  
> See the description of the different “Test Modes” below

### Set up Directus Visual Editor module

1. Switch to Directus Studio
2. Enable the Visual Editor module in settings
3. Add the following URLs to the Visual Editor settings (on the settings page)

   - `http://localhost:3000`
   - `http://localhost:3000/blog`
   - `http://localhost:3000/blog/why-steampunk-rabbits-are-the-future-of-work`

     > [!NOTE]  
     > The last two URLs are for testing purposes only. You do not need to add every page URL of your website to access
     > them with the Visual Editor.

4. Open the Visual Editor Module

## Test Modes

Use the following commands to run predefined test environments. Find the corresponding code by searching for
`useVisualEditingTest` or `testCase` in the test-website directory to see how it is set up.

> [!NOTE]  
> Be sure to stop other servers running on localhost:3000

```sh
# commands

pnpm visual-editing:monolith

pnpm visual-editing:ssr
pnpm visual-editing:ssr--refresh-all
pnpm visual-editing:ssr--refresh
pnpm visual-editing:ssr--refresh-customized # http://localhost:3000/blog
pnpm visual-editing:ssr--methods # http://localhost:3000

pnpm visual-editing:dev
pnpm visual-editing:dev--refresh-all
pnpm visual-editing:dev--refresh
pnpm visual-editing:dev--refresh-customized # http://localhost:3000/blog
pnpm visual-editing:dev--methods # http://localhost:3000

pnpm visual-editing:ssg # http://localhost:3000/blog/why-steampunk-rabbits-are-the-future-of-work
```

### Rendering modes:

- Monolith / server only rendering: use as with PHP
- SSG: live data only on hydration
- SSR: always with live data
- Dev mode: if you want to play around

### Test Cases

- `basic`
  - No `onSaved` callback — the web page inside the iframe will be reloaded (`window.location.reload()`)
  - Editable elements are added and removed globally on route change
  - Rendering modes: `monolith` || `dev` || `ssr`
  - Search for `testCase === 'basic'`
- `refresh-all`
  - `onSaved` will refetch all data with `refreshNuxtData()`
  - Editable elements will be added and removed globally on route changes
  - Rendering modes: `dev` || `ssr`
  - Search for `testCase === 'refresh-all'`
- `refresh` _(smooth, recommended)_
  - `onSaved` will call refetch all data where it was originally fetched.
  - Editable elements are only removed globally on route changes, they are added in nested components where data is
    fetched, so that their `refresh()` function can be passed to `onSaved`. This should provide the smoothest experience
    without layout shifts.
  - Rendering modes: `dev` || `ssr`
  - Search for `testCase === 'refresh'`
- `refresh-customized`
  - The best way to see this on the test website is to open this page in the Visual Editor: http://localhost:3000/blog
  - Exactly the same as `refresh` above, except that custom classes are attached to some editable elements to
    demonstrate customizability.
  - Rendering modes: `dev` || `ssr`
  - Search for `testCase === 'refresh-customized'`
- `methods`
  - The best way to see this on the test website is to open this page in the Visual Editor: http://localhost:3000
  - Exactly the same as `basic` above, except that there are buttons to test some useful functions/methods
  - Rendering modes: `dev` || `ssr`
  - Search for `testCase === 'methods'`
- `refresh-ssg`
  - The best way to see this on the test website is to open this page in the Visual Editor:
    http://localhost:3000/blog/why-steampunk-rabbits-are-the-future-of-work
  - Exactly the same as `refresh` above, except that it is only available for SSG and on a blog page `/blog/[slug]`
  - Rendering modes: `ssg`
  - Search for `testCase === 'refresh-ssg’`
