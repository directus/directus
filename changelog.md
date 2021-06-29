# Changelog

_Changes marked with a :warning: contain potential breaking changes depending on your use of the package._

## v9.0.0-rc.82 (June 28, 2021)

### :sparkles: New Features

- **App**
  - [#6553](https://github.com/directus/directus/pull/6553) Add support for field grouping
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **Extensions**
  - [#6548](https://github.com/directus/directus/pull/6548) Add directus-extension CLI to extension-sdk
    ([@nickrum](https://github.com/nickrum))
- **sdk**
  - [#6538](https://github.com/directus/directus/pull/6538) Adds request and response interceptors on Axios transport
    ([@WoLfulus](https://github.com/WoLfulus))

### :rocket: Improvements

- **API**
  - [#6541](https://github.com/directus/directus/pull/6541) Pass on errors thrown in MailService
    ([@luanmm](https://github.com/luanmm))
- **App**
  - [#6215](https://github.com/directus/directus/pull/6215) Added escaping on file paths including "\u"
    ([@skizer](https://github.com/skizer))

### :bug: Bug Fixes

- **App**
  - [#6555](https://github.com/directus/directus/pull/6555) Fix auto-fill of directus_files in relational setup
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6530](https://github.com/directus/directus/pull/6530) Fix translations interface options crashing the App
    ([@nickrum](https://github.com/nickrum))
- **API**
  - [#6534](https://github.com/directus/directus/pull/6534) Fix extension loading when PUBLIC_URL is absolute without
    origin ([@nickrum](https://github.com/nickrum))
  - [#6516](https://github.com/directus/directus/pull/6516) Changed filesize to bigint for large files
    ([@Enhed](https://github.com/Enhed))
- **Extensions**
  - [#6534](https://github.com/directus/directus/pull/6534) Fix extension loading when PUBLIC_URL is absolute without
    origin ([@nickrum](https://github.com/nickrum))

### :package: Dependency Updates

- [#6547](https://github.com/directus/directus/pull/6547) update typescript-eslint monorepo to v4.28.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6546](https://github.com/directus/directus/pull/6546) update dependency jest to v27.0.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6520](https://github.com/directus/directus/pull/6520) update dependency @vitejs/plugin-vue to v1.2.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6518](https://github.com/directus/directus/pull/6518) update dependency simple-git-hooks to v2.5.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6498](https://github.com/directus/directus/pull/6498) update dependency commander to v8
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.81 (June 26, 2021)

### :rocket: Improvements

- **App**
  - [#6466](https://github.com/directus/directus/pull/6466) Set calendar layout locale based on app locale
    ([@nickrum](https://github.com/nickrum))

### :bug: Bug Fixes

- **App**
  - [#6481](https://github.com/directus/directus/pull/6481) Fix login page not showing user's name on app required
    permissions role ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6377](https://github.com/directus/directus/pull/6377) Fix app extensions loading and registration
    ([@nickrum](https://github.com/nickrum))

### :memo: Documentation

- [#6467](https://github.com/directus/directus/pull/6467) Import a File link in Assets tip broken
  ([@Mrmiffo](https://github.com/Mrmiffo))

### :package: Dependency Updates

- [#6509](https://github.com/directus/directus/pull/6509) update dependency prettier to v2.3.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6507](https://github.com/directus/directus/pull/6507) update dependency marked to v2.1.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6499](https://github.com/directus/directus/pull/6499) update dependency rollup to v2.52.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6497](https://github.com/directus/directus/pull/6497) update dependency eslint-plugin-vue to v7.12.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6482](https://github.com/directus/directus/pull/6482) Update vue to 3.1.2
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#6473](https://github.com/directus/directus/pull/6473) update dependency mitt to v3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6470](https://github.com/directus/directus/pull/6470) update dependency fs-extra to v10
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6469](https://github.com/directus/directus/pull/6469) pin dependencies
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6468](https://github.com/directus/directus/pull/6468) update dependency @types/codemirror to v5.60.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6459](https://github.com/directus/directus/pull/6459) update dependency tinymce to v5.8.2
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.80 (June 22, 2021)

### :sparkles: New Features

- **API**
  - :warning: [#6456](https://github.com/directus/directus/pull/6456) Add schema caching
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6437](https://github.com/directus/directus/pull/6437) Add support for starts/ends with filters
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#6441](https://github.com/directus/directus/pull/6441) Add checkboxes-tree interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6430](https://github.com/directus/directus/pull/6430) Add Serbian (Latin) Language
    ([@srkinftel](https://github.com/srkinftel))

### :bug: Bug Fixes

- **App**
  - [#6455](https://github.com/directus/directus/pull/6455) Fixed issue that would prevent source code editing from
    staging values in wysiwyg ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6454](https://github.com/directus/directus/pull/6454) Fixed color option of the notice presentation interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6453](https://github.com/directus/directus/pull/6453) Fixed issue that would throw error in console when creating
    a new item in a collection w/ translations ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6451](https://github.com/directus/directus/pull/6451) Fix creating custom names for recommend collection fields on
    new collection setup drawer ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6450](https://github.com/directus/directus/pull/6450) Fixed rendering of SVGs in single file image interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6449](https://github.com/directus/directus/pull/6449) Fix header buttons not functioning in markdown interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6447](https://github.com/directus/directus/pull/6447) Don't default to `directus_files` in local store on existing
    relation ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6442](https://github.com/directus/directus/pull/6442) Fix display template on collection detail page
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6421](https://github.com/directus/directus/pull/6421) Update admin to use `no-store`
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#6361](https://github.com/directus/directus/pull/6361) Fix spacings and icons on presentation link buttons
    ([@HitomiTenshi](https://github.com/HitomiTenshi))
- **API**
  - [#6444](https://github.com/directus/directus/pull/6444) Don't return default val for PK field in singleton
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :package: Dependency Updates

- [#6445](https://github.com/directus/directus/pull/6445) fix(deps): update dependency gatsby-source-filesystem to
  v3.8.0 ([@renovate[bot]](https://github.com/apps/renovate))
- [#6443](https://github.com/directus/directus/pull/6443) update vue monorepo to v3.1.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6439](https://github.com/directus/directus/pull/6439) chore(deps): update dependency marked to v2.1.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6424](https://github.com/directus/directus/pull/6424) chore(deps): update dependency jest to v27.0.5
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.79 (June 22, 2021)

Nothing to see here.. (Vue's update to 3.1.2 made things go 💥)

## v9.0.0-rc.78 (June 21, 2021)

### :rocket: Improvements

- **App**
  - [#6413](https://github.com/directus/directus/pull/6413) Use correct input type for type in advanced filter sidebar
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :bug: Bug Fixes

- **App**
  - [#6412](https://github.com/directus/directus/pull/6412) Fixed issue that would prevent button/list-item links from
    functioning ([@rijkvanzanten](https://github.com/rijkvanzanten))

## v9.0.0-rc.77 (June 21, 2021)

### :sparkles: New Features

- **API**
  - [#6379](https://github.com/directus/directus/pull/6379) Add ability to specify what fields to clone on "Save as
    Copy" ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6341](https://github.com/directus/directus/pull/6341) Add support for `read` hooks on `items`
    ([@MoltenCoffee](https://github.com/MoltenCoffee))
  - [#6294](https://github.com/directus/directus/pull/6294) Allow overriding the s-maxage cache header
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#6379](https://github.com/directus/directus/pull/6379) Add ability to specify what fields to clone on "Save as
    Copy" ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :rocket: Improvements

- **API**
  - :warning: [#6355](https://github.com/directus/directus/pull/6355) Use `no-store` instead of `no-cache` for skipping
    the cache ([@nachogarcia](https://github.com/nachogarcia))
  - [#6349](https://github.com/directus/directus/pull/6349) Use existing file extension as default
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6347](https://github.com/directus/directus/pull/6347) Redact tokens from logs
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :bug: Bug Fixes

- **API**
  - [#6350](https://github.com/directus/directus/pull/6350) Don't send sensitive data in webhooks
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6308](https://github.com/directus/directus/pull/6308) Fixed invalid onDelete constraint for OracleDB
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **App**
  - [#6348](https://github.com/directus/directus/pull/6348) Fixed issue that would cause uploads to the root folder of
    the file library to fail ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6318](https://github.com/directus/directus/pull/6318) Fixed issue that would prevent setting the placeholder on
    the input interface ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6289](https://github.com/directus/directus/pull/6289) Fixed issue that would prevent the "Import from URL"
    functionality to work in a many to many interface ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :memo: Documentation

- [#6360](https://github.com/directus/directus/pull/6360) Add "require('axios')" in API hooks examples
  ([@paescuj](https://github.com/paescuj))
- [#6339](https://github.com/directus/directus/pull/6339) Fix broken link in quickstart
  ([@geertijewski](https://github.com/geertijewski))
- [#6311](https://github.com/directus/directus/pull/6311) Update SDK doc with note on using multiple instances
  ([@martinemmert](https://github.com/martinemmert))
- [#6284](https://github.com/directus/directus/pull/6284) Add workaround for vite auto-replacement in docs
  ([@nickrum](https://github.com/nickrum))

### :package: Dependency Updates

- [#6406](https://github.com/directus/directus/pull/6406) chore(deps): update typescript-eslint monorepo to v4.28.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6405](https://github.com/directus/directus/pull/6405) chore(deps): update dependency vue-router to v4.0.10
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6401](https://github.com/directus/directus/pull/6401) chore(deps): update dependency codemirror to v5.62.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6400](https://github.com/directus/directus/pull/6400) chore(deps): update dependency rollup to v2.52.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6399](https://github.com/directus/directus/pull/6399) chore(deps): update dependency swagger-ui-watcher to v2.1.12
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6392](https://github.com/directus/directus/pull/6392) chore(deps): update dependency vite to v2.3.8
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6391](https://github.com/directus/directus/pull/6391) chore(deps): update dependency @types/inquirer to v7.3.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6380](https://github.com/directus/directus/pull/6380) chore(deps): update dependency eslint to v7.29.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6371](https://github.com/directus/directus/pull/6371) chore(deps): update dependency pinia to v2.0.0-beta.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6363](https://github.com/directus/directus/pull/6363) chore(deps): update dependency @types/jsonwebtoken to v8.5.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6357](https://github.com/directus/directus/pull/6357) chore(deps): update dependency typescript to v4.3.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6342](https://github.com/directus/directus/pull/6342) fix(deps): update dependency chalk to v4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6338](https://github.com/directus/directus/pull/6338) chore(deps): update postgres docker tag to v13
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6337](https://github.com/directus/directus/pull/6337) chore(deps): update dependency rollup to v2.52.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- :warning: [#6336](https://github.com/directus/directus/pull/6336) Use node.js v16 in Docker image
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6334](https://github.com/directus/directus/pull/6334) chore(deps): update dependency fs-extra to v10
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6333](https://github.com/directus/directus/pull/6333) chore(deps): update dependency dotenv to v10
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6332](https://github.com/directus/directus/pull/6332) chore(deps): update mariadb docker tag to v10.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6331](https://github.com/directus/directus/pull/6331) chore(deps): update fullcalendar monorepo to v5.8.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6330](https://github.com/directus/directus/pull/6330) chore(deps): update dependency marked to v2.1.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6329](https://github.com/directus/directus/pull/6329) chore(deps): update dependency typescript to v4.3.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6328](https://github.com/directus/directus/pull/6328) fix(deps): update dependency ms to v2.1.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6327](https://github.com/directus/directus/pull/6327) chore(deps): update dependency vue-router to v4.0.9
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6324](https://github.com/directus/directus/pull/6324) chore(deps): update dependency globby to v11.0.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6323](https://github.com/directus/directus/pull/6323) fix(deps): pin dependencies
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6322](https://github.com/directus/directus/pull/6322) Configure Renovate
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6305](https://github.com/directus/directus/pull/6305) Bump sass from 1.35.0 to 1.35.1
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6304](https://github.com/directus/directus/pull/6304) Bump inquirer from 8.1.0 to 8.1.1
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6300](https://github.com/directus/directus/pull/6300) Bump rollup from 2.51.2 to 2.52.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6275](https://github.com/directus/directus/pull/6275) Bump @typescript-eslint/eslint-plugin from 4.26.1 to 4.27.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6274](https://github.com/directus/directus/pull/6274) Bump @typescript-eslint/parser from 4.26.1 to 4.27.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6273](https://github.com/directus/directus/pull/6273) Bump sass from 1.34.1 to 1.35.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6272](https://github.com/directus/directus/pull/6272) Bump aws-sdk from 2.927.0 to 2.928.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))

## v9.0.0-rc.76 (June 14, 2021)

### :sparkles: New Features

- **API**
  - [#6221](https://github.com/directus/directus/pull/6221) Add support for date distance adjustment in `$NOW` filter
    variable ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6216](https://github.com/directus/directus/pull/6216) Added support for nodemailer ignoreTLS option
    ([@nichols-green](https://github.com/nichols-green))

### :rocket: Improvements

- **API**
  - [#6211](https://github.com/directus/directus/pull/6211) Optimized oracle schema overview query
    ([@aidenfoxx](https://github.com/aidenfoxx))

### :bug: Bug Fixes

- **API**
  - [#6267](https://github.com/directus/directus/pull/6267) Fix issue that would cause emails to be displayed
    incorrectly in certain email clients ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6225](https://github.com/directus/directus/pull/6225) Fix Oracle env error
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#6208](https://github.com/directus/directus/pull/6208) Moved special check above localTypeMap check.
    ([@Oreilles](https://github.com/Oreilles))
  - [#6190](https://github.com/directus/directus/pull/6190) Fix type casting of boolean env var
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#6264](https://github.com/directus/directus/pull/6264) Fixed issue that could cause the HTML interface to emit a
    change on first load ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6263](https://github.com/directus/directus/pull/6263) Fixed issue that would prevent the m2o from working on
    foreign keys with no meta row ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6262](https://github.com/directus/directus/pull/6262) Fixes issue that would prevent the layout from refreshing on
    batch operations ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6258](https://github.com/directus/directus/pull/6258) Fix collection selection in system-collections interface
    ([@nickrum](https://github.com/nickrum))
  - [#6236](https://github.com/directus/directus/pull/6236) Fix missing styling for WYSIWYG
    ([@masterwendu](https://github.com/masterwendu))
  - [#6212](https://github.com/directus/directus/pull/6212) Fix proxying to the app from a subpath
    ([@nickrum](https://github.com/nickrum))
- **specs**
  - [#6179](https://github.com/directus/directus/pull/6179) Fix OpenAPI specs ([@paescuj](https://github.com/paescuj))

### :memo: Documentation

- [#6232](https://github.com/directus/directus/pull/6232) Update the app extension docs to work with Vue 3
  ([@nickrum](https://github.com/nickrum))
- [#6209](https://github.com/directus/directus/pull/6209) Add note on file env vars
  ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :package: Dependency Updates

- [#6240](https://github.com/directus/directus/pull/6240) Bump cropperjs from 1.5.11 to 1.5.12
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6239](https://github.com/directus/directus/pull/6239) Bump npm-watch from 0.9.0 to 0.10.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6238](https://github.com/directus/directus/pull/6238) Bump eslint-plugin-vue from 7.11.0 to 7.11.1
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6237](https://github.com/directus/directus/pull/6237) Bump aws-sdk from 2.926.0 to 2.927.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6201](https://github.com/directus/directus/pull/6201) Bump rollup from 2.51.1 to 2.51.2
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6200](https://github.com/directus/directus/pull/6200) Bump eslint-plugin-vue from 7.10.0 to 7.11.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6199](https://github.com/directus/directus/pull/6199) Bump aws-sdk from 2.925.0 to 2.926.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6198](https://github.com/directus/directus/pull/6198) Bump gatsby-source-filesystem from 3.7.0 to 3.7.1
  ([@dependabot[bot]](https://github.com/apps/dependabot))

## v9.0.0-rc.75 (June 10, 2021)

### 🚨 App Extensions

This release includes the big switch from Vue 2 to Vue 3. If you have (complicated) app extensions, make sure to update
the build chain of your extension and make sure you're aware of
[the breaking changes you might have to account for](https://v3.vuejs.org/guide/migration/introduction.html#breaking-changes).
We'll be upgrading the documentation and providing new boilerplates for Vue 3 based extensions in the coming days.

### :sparkles: New Features

- **API**
  - [#6155](https://github.com/directus/directus/pull/6155) Allow any of grant's (nested) configuration parameters
    (oAuth) ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6140](https://github.com/directus/directus/pull/6140) Add item duplicate fields configuration option to
    directus_collections ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6101](https://github.com/directus/directus/pull/6101) Add support for \_FILE environment variables
    ([@paescuj](https://github.com/paescuj))
- **App**
  - :warning: [#5339](https://github.com/directus/directus/pull/5339) Port the app to Vue 3
    ([@nickrum](https://github.com/nickrum))

### :rocket: Improvements

- **API**
  - :warning: [#6187](https://github.com/directus/directus/pull/6187) Add additional check to Two-Factor Authentication
    (by @masterwendu) ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6119](https://github.com/directus/directus/pull/6119) Don't treat numbers larger than the JS max number size as
    number values in environment variables ([@skizer](https://github.com/skizer))
- **App**
  - :warning: [#6187](https://github.com/directus/directus/pull/6187) Add additional check to Two-Factor Authentication
    (by @masterwendu) ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6186](https://github.com/directus/directus/pull/6186) Add number formatting to formatted-values display
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6171](https://github.com/directus/directus/pull/6171) Use JSON editor for JSON field type default value
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6168](https://github.com/directus/directus/pull/6168) Show better message for improperly formatted emails on login
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6118](https://github.com/directus/directus/pull/6118) Support async preRegisterCheck for custom modules
    ([@t7tran](https://github.com/t7tran))

### :bug: Bug Fixes

- **App**
  - [#6174](https://github.com/directus/directus/pull/6174) Fix issue that would cause sort order of fields to be
    corrupted on field changes ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6173](https://github.com/directus/directus/pull/6173) Prevent translation rows from being edited before existing
    values are loaded ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6172](https://github.com/directus/directus/pull/6172) Fix translations hint not linking to collection
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6171](https://github.com/directus/directus/pull/6171) Use JSON editor for JSON field type default value
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **API**
  - [#6167](https://github.com/directus/directus/pull/6167) Cleanup one_allowed_collections field on collection delete
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6163](https://github.com/directus/directus/pull/6163) Fix field update for data types with length or boolean as
    default value ([@paescuj](https://github.com/paescuj))
  - [#6153](https://github.com/directus/directus/pull/6153) Fixed issue that would cause foreign key constraints to be
    missed in pascal cased table names in postgres ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :memo: Documentation

- [#6188](https://github.com/directus/directus/pull/6188) Adding an example to cron hook
  ([@juancarlosjr97](https://github.com/juancarlosjr97))
- [#6150](https://github.com/directus/directus/pull/6150) Describe breaking change in filter syntax in v8 migration
  information ([@nachogarcia](https://github.com/nachogarcia))
- [#6135](https://github.com/directus/directus/pull/6135) List cron in Event Format Options
  ([@benhaynes](https://github.com/benhaynes))

### :package: Dependency Updates

- [#6177](https://github.com/directus/directus/pull/6177) Bump aws-sdk from 2.924.0 to 2.925.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6176](https://github.com/directus/directus/pull/6176) Bump @azure/storage-blob from 12.5.0 to 12.6.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6175](https://github.com/directus/directus/pull/6175) Bump jest-environment-jsdom from 26.6.2 to 27.0.3
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6147](https://github.com/directus/directus/pull/6147) Bump dotenv from 9.0.2 to 10.0.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6146](https://github.com/directus/directus/pull/6146) Bump jest-environment-jsdom from 26.6.2 to 27.0.3
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6145](https://github.com/directus/directus/pull/6145) Bump @types/codemirror from 0.0.109 to 5.60.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6144](https://github.com/directus/directus/pull/6144) Bump lint-staged from 10.5.4 to 11.0.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6126](https://github.com/directus/directus/pull/6126) Bump execa from 5.0.1 to 5.1.1
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6125](https://github.com/directus/directus/pull/6125) Bump slugify from 1.5.0 to 1.5.3
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6124](https://github.com/directus/directus/pull/6124) Bump prettier from 2.3.0 to 2.3.1
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6123](https://github.com/directus/directus/pull/6123) Bump connect-redis from 5.2.0 to 6.0.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6122](https://github.com/directus/directus/pull/6122) Bump @types/sharp from 0.28.1 to 0.28.3
  ([@dependabot[bot]](https://github.com/apps/dependabot))

## v9.0.0-rc.74 (June 7, 2021)

### :sparkles: New Features

- **API**
  - [#6116](https://github.com/directus/directus/pull/6116) Add support for CRON hooks (interval)
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :rocket: Improvements

- **App**
  - [#6112](https://github.com/directus/directus/pull/6112) Make mfa output code selectable
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **Docker**
  - [#6081](https://github.com/directus/directus/pull/6081) Optimize Docker image performance and formatting
    ([@paescuj](https://github.com/paescuj))

### :memo: Documentation

- [#6110](https://github.com/directus/directus/pull/6110) Improve search ability of update instructions
  ([@benhaynes](https://github.com/benhaynes))
- [#6087](https://github.com/directus/directus/pull/6087) Fix typo ([@benhaynes](https://github.com/benhaynes))
- [#6086](https://github.com/directus/directus/pull/6086) Update introduction.md
  ([@benhaynes](https://github.com/benhaynes))

### :package: Dependency Updates

- [#6109](https://github.com/directus/directus/pull/6109) Bump vue-loader from 15.9.6 to 15.9.7
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6108](https://github.com/directus/directus/pull/6108) Bump @types/yargs from 16.0.1 to 17.0.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6107](https://github.com/directus/directus/pull/6107) Bump mime-types from 2.1.30 to 2.1.31
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6106](https://github.com/directus/directus/pull/6106) Bump graphql-compose from 8.1.0 to 9.0.1
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6105](https://github.com/directus/directus/pull/6105) Bump jest from 27.0.3 to 27.0.4
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6082](https://github.com/directus/directus/pull/6082) Bump @godaddy/terminus from 4.7.2 to 4.9.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6069](https://github.com/directus/directus/pull/6069) Bump @fullcalendar/list from 5.7.0 to 5.7.2
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6068](https://github.com/directus/directus/pull/6068) Bump aws-sdk from 2.911.0 to 2.921.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6066](https://github.com/directus/directus/pull/6066) Bump @types/node from 15.9.0 to 15.12.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))

## v9.0.0-rc.73 (June 4, 2021)

### :bug: Bug Fixes

- **App**
  - [#6060](https://github.com/directus/directus/pull/6060) Fixed issue that would prevent the corresponding o2m field
    from being created on m2o relational setup ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6056](https://github.com/directus/directus/pull/6056) Fixed issue that would cause the whole row to be draggable
    in the list-type interfaces ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6053](https://github.com/directus/directus/pull/6053) Fixed issue that would prevent the display tab to show for
    o2m type fields in field-setup ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6052](https://github.com/directus/directus/pull/6052) Fixed issue in collection color reading for tables that
    weren't configured in directus yet ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6049](https://github.com/directus/directus/pull/6049) Fixed right click handler not extending beyond nav items
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **API**
  - [#6059](https://github.com/directus/directus/pull/6059) Fixed unique constraint violation error extraction for MySQL
    5.7 ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6058](https://github.com/directus/directus/pull/6058) Fixed issue that would prevent creation relations to an
    unsigned auto-incremented primary key in MariaDB ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6055](https://github.com/directus/directus/pull/6055) Fixed an issue that would cause "text" fields to show up as
    varchar with length -1 in MS SQL ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6054](https://github.com/directus/directus/pull/6054) Fixed issue that would prevent usage of limit -1 on deep
    limit ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6048](https://github.com/directus/directus/pull/6048) Fixed issue that could trigger update actions of children on
    manual sorting of a parent o2m instance ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **schema**
  - [#6058](https://github.com/directus/directus/pull/6058) Fixed issue that would prevent creation relations to an
    unsigned auto-incremented primary key in MariaDB ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :memo: Documentation

- [#6051](https://github.com/directus/directus/pull/6051) Update projects.md
  ([@rijkvanzanten](https://github.com/rijkvanzanten))

## v9.0.0-rc.72 (June 3, 2021)

### :sparkles: New Features

- **App**
  - [#5818](https://github.com/directus/directus/pull/5818) Add support for adding a collection accent color
    ([@Oreilles](https://github.com/Oreilles))

### :rocket: Improvements

- **API**
  - [#6040](https://github.com/directus/directus/pull/6040) Handle illegal/corrupt relational rows better during foreign
    key migration ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6035](https://github.com/directus/directus/pull/6035) Extract IPTC title and keywords
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#6025](https://github.com/directus/directus/pull/6025) Improve `disabled` state on the file interface
    ([@nickluger](https://github.com/nickluger))
- **sdk-js**
  - [#6007](https://github.com/directus/directus/pull/6007) Pass onUploadProgress function through to the axios request
    ([@moekify](https://github.com/moekify))

### :bug: Bug Fixes

- **API**
  - [#6045](https://github.com/directus/directus/pull/6045) Fix external query during transaction in foreign key
    constraint creation ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6043](https://github.com/directus/directus/pull/6043) Prevent foreign key constraint names from exceeding 64
    characters ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6042](https://github.com/directus/directus/pull/6042) Fixed issue that would prevent relationship updates on
    foreign key constraints with a custom index name ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **Docker**
  - [#6044](https://github.com/directus/directus/pull/6044) Reduce the image layers by combining RUN statements; and fix
    build permissions for issue #6023 ([@t7tran](https://github.com/t7tran))

### :memo: Documentation

- [#6037](https://github.com/directus/directus/pull/6037) Update one-clicks in readme/docs
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#6033](https://github.com/directus/directus/pull/6033) Fix wrong reference to not-yet-existing /backup endpoint
  ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :package: Dependency Updates

- [#6032](https://github.com/directus/directus/pull/6032) Upgrade dependencies
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#6022](https://github.com/directus/directus/pull/6022) Bump sass from 1.34.0 to 1.34.1
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6021](https://github.com/directus/directus/pull/6021) Bump argon2 from 0.27.2 to 0.28.1
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6020](https://github.com/directus/directus/pull/6020) Bump eslint from 7.26.0 to 7.27.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#6018](https://github.com/directus/directus/pull/6018) Bump @types/node from 15.6.0 to 15.9.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))

## v9.0.0-rc.71 (June 2, 2021)

### :rocket: Improvements

- **API**
  - [#6003](https://github.com/directus/directus/pull/6003) Don't initialize database on file require
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6001](https://github.com/directus/directus/pull/6001) Changed PORT type from number to string
    ([@nichols-green](https://github.com/nichols-green))
- **Docker**
  - :warning: [#5877](https://github.com/directus/directus/pull/5877) Clean-up docker image
    ([@paescuj](https://github.com/paescuj))

### :bug: Bug Fixes

- **API**
  - [#6002](https://github.com/directus/directus/pull/6002) Fix env var validation in database loading step
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#5998](https://github.com/directus/directus/pull/5998) Remove stray console.log in dependency
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :memo: Documentation

- [#6006](https://github.com/directus/directus/pull/6006) Added document for running directus on iis
  ([@nichols-green](https://github.com/nichols-green))

### :package: Dependency Updates

- [#5986](https://github.com/directus/directus/pull/5986) Bump marked from 2.0.5 to 2.0.7
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#5985](https://github.com/directus/directus/pull/5985) Bump dompurify from 2.2.8 to 2.2.9
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#5984](https://github.com/directus/directus/pull/5984) Bump jest-environment-jsdom from 26.6.2 to 27.0.3
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#5983](https://github.com/directus/directus/pull/5983) Bump @typescript-eslint/parser from 4.23.0 to 4.26.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))
- [#5982](https://github.com/directus/directus/pull/5982) Bump fs-extra from 9.1.0 to 10.0.0
  ([@dependabot[bot]](https://github.com/apps/dependabot))

## 9.0.0-rc.70 (June 1, 2021)

### :sparkles: New Features

- **API**
  - [#5615](https://github.com/directus/directus/pull/5615) added support for mirroring foreign key constraints with the
    database ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#5795](https://github.com/directus/directus/pull/5795) added support for new environment variables that allow you
    to control maximum asset generation parameters ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#5855](https://github.com/directus/directus/pull/5855) added support for deep filtering on many-to-any items
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :rocket: Improvements

- **API**
  - [#5804](https://github.com/directus/directus/pull/5804) treat `uniqueidentifier` in MS SQL as a UUID
    ([@Oreilles](https://github.com/Oreilles))
  - [`e2c9e15`](https://github.com/directus/directus/commit/e2c9e15a981bd7034b1c5dad839a9816148aa594) throw a 503
    service unavailable when the storage adapter crashes during a file upload
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`02089a6`](https://github.com/directus/directus/commit/02089a6227575a340bbf5b926cf9717a89941138) set the default
    TTL for cache to a more reasonable 10 minutes (from 30) ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [`4277de0`](https://github.com/directus/directus/commit/4277de088988a65f9ea4ea18a4121488a24a8e87) set the default
    value for boolean filters to `true`, preventing confusion around the state of the toggle in advanced filters
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`a5cba0d`](https://github.com/directus/directus/commit/a5cba0dc7e3a1566095deb58d10297f3b7bbe9bd) prevent unusable
    collections from being selected in the relational setup ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`4beccb6`](https://github.com/directus/directus/commit/4beccb6a8a9e33d0ae0e47333bfacd60741a91bc) don't allow using
    `_contains` on a UUID ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`a40d75a`](https://github.com/directus/directus/commit/a40d75a184e2257256a0b1e33fcdcc696e9ad73b) only close menu
    boxes when clicking on menu content, ignore menu box itself ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`3d3a508`](https://github.com/directus/directus/commit/3d3a508880f0fd51df8a8f05b990c0687fca53f5) allow setting
    on-create and on-update triggers for many-to-one UUID fields ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`5c66c53`](https://github.com/directus/directus/commit/5c66c53478400261d80113edc3c32186d3fdb6f0) allow rendering a
    translations preview next to the language in the translations interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#5943](https://github.com/directus/directus/pull/5943) allow the user to update it's own profile in the app
    recommended permissions ([@cupcakearmy](https://github.com/cupcakearmy))
- **drive-gcs**
  - [`5704cd4`](https://github.com/directus/directus/commit/5704cd46d28217ac464cea4d2a88356c80fb75f4) improve uploading
    performance ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :bug: Bug Fixes

- **API**
  - [#5763](https://github.com/directus/directus/pull/5763) fixed an issue that could cause updates on o2m items to fail
    ([@MiniDigger](https://github.com/MiniDigger))
  - [#5806](https://github.com/directus/directus/pull/5806) fixed an issue that could cause `_or` filters to
    shortcircuit ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`95307ce`](https://github.com/directus/directus/commit/95307cee979940558fafd8f822bc9fe8083bd526) fixed an issue
    that would prevent nested one to many item updates to store the correct parent revision
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#5810](https://github.com/directus/directus/pull/) fixed custom fields on system collections not aligning to the
    configured sort order ([@rijkvanzanten5810](https://github.com/rijkvanzanten5810))
  - [`158316f`](https://github.com/directus/directus/commit/158316f86318e83de5d5e6e203306a5603458c6d) fixed a small
    issue that would prevent the advanced filter field selection from allowing multiple nested fields from being opened
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`246c552`](https://github.com/directus/directus/commit/246c55266b78ae063408dbc1b04d1797bd85e476) fixed an issue
    that would require non-null fields to be submitted in every GraphQL mutation
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`5506214`](https://github.com/directus/directus/commit/550621479e3b9173f963a0bd723595213f56dedb) fixed fallback
    interface for `boolean` type fields ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`b782eba`](https://github.com/directus/directus/commit/b782eba859d0a91d08dfd39ab41e6952db0c94b7) fixed an issue
    that would make custom field translations disappear when reordering the fields in settings
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`bd6cab8`](https://github.com/directus/directus/commit/bd6cab8989ea8a8af3b0848c51ee9b3fae289ab3) fixed an issue
    that would cause the relational setup to auto generate an invalid name when making a recursive many-to-many field
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`8590eec`](https://github.com/directus/directus/commit/8590eec662364ce8c865b529394f271b8b46a1c7) fix collection
    search when using custom nav override structure ([@Oreilles](https://github.com/Oreilles))
  - [`dee8160`](https://github.com/directus/directus/commit/dee8160f184af4f041580d76ce88da5dc3eb0d12) fixed an issue
    where dragging an event in the calendar layout could save with the wrong timezone when using a datetime field
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`374e6e5`](https://github.com/directus/directus/commit/374e6e5a7dd3d752a25c352df7ce5f661a5b15c1) don't let v-error
    messages overflow the bounding box of the dialog ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`2660c39`](https://github.com/directus/directus/commit/2660c3995426dd3d8d36a8022893cddcd27ed53f) fixed an issue
    that would prevent the user from continuing in field setup when using an existing junction table for a many-to-many
    relationship ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`de0b962`](https://github.com/directus/directus/commit/de0b9627365b392d4af0589a52b122cf0b5ec927) fixed the
    highlight color of a selected folder in the move-folder dialog ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **drive-azure**
  - [#5788](https://github.com/directus/directus/pull/) fixed an issue that would cause file reads from S3/Azure to be
    double-prefixed with the storage root option ([@aidenfoxx](https://github.com/aidenfoxx))
- **drive-s3**
  - [#5788](https://github.com/directus/directus/pull/) fixed an issue that would cause file reads from S3/Azure to be
    double-prefixed with the storage root option ([@aidenfoxx](https://github.com/aidenfoxx))
  - [`eb68195`](https://github.com/directus/directus/commit/eb68195cd5cd72ab16b5480f80162e9c94b7d004) fixed an issue
    that would cause issues when leaving ACL empty ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [`925c3fa`](https://github.com/directus/directus/commit/925c3fa3fa4b8ad34801ecb17c954e3b0c4a19a1) fixed an issue
    that would prevent Range header requests from sending the correct chunk of data
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **gatsby-source-directus**
  - [`48cdf6e`](https://github.com/directus/directus/commit/48cdf6e0835b6e077cb0641be30d49483c611439) fixed static token
    support ([@TheAzack9](https://github.com/TheAzack9))
- **schema**
  - [#5816](https://github.com/directus/directus/pull/5816) ignore views when reading tables in MS SQL
    ([@wc-matteo](https://github.com/wc-matteo))

### :memo: Documentation

- added additional information on sort setup\
  ([@benhaynes](https://github.com/benhaynes))
- [#5750](https://github.com/directus/directus/pull/5750) fixed a couple typos in email-templates
  ([@larssobota](https://github.com/larssobota))
- [`477c36d`](https://github.com/directus/directus/commit/477c36d86771190f8c314b0fa641a86f3ee1a3fb) made sure that the
  latest version of the Docker image is used when copy pasting the docker-compose example
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [`c0182d7`](https://github.com/directus/directus/commit/c0182d7b14e31e8fe9d3103082fcedcbbda5dd99) improved the issue
  template for new issues on GitHub ([@benhaynes](https://github.com/benhaynes))
- [`5f4a24d`](https://github.com/directus/directus/commit/5f4a24d45637fdb2b5b2cb024002c5b6434e35b0) added a note on
  sending relational data to the Data Access page ([@moekify](https://github.com/moekify))
- [`7f5e59b`](https://github.com/directus/directus/commit/7f5e59b1174f5d1ce12103f823001d53f8364295) fixed the links to
  the API reference in the environment variable overview ([@cosminepureanu](https://github.com/cosminepureanu))
- [`56ad3c0`](https://github.com/directus/directus/commit/56ad3c04dd0b350905aa23f2483045219a1a6502) remove Patreon in
  favor of GitHub Sponsors ([@benhaynes](https://github.com/benhaynes))
