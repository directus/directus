# Changelog

_Changes marked with a :warning: contain potential breaking changes depending on your use of the package._

## v9.22.4 (January 11, 2023)

### :bug: Bug Fixes

- **API**
  - [#17101](https://github.com/directus/directus/pull/17101) offset should be 0 not 1 by default (by @freekrai)
- **Extensions**
  - [#17098](https://github.com/directus/directus/pull/17098) Fix running npm init directus-extension (by @Nitwel)

### :sponge: Optimizations

- **Misc.**
  - [#17104](https://github.com/directus/directus/pull/17104) Make sure azure tests use unique file paths (by
    @rijkvanzanten)

## v9.22.2 (January 11, 2023)

### :sparkles: New Features

- **API**
  - [#16822](https://github.com/directus/directus/pull/16822) Extension Improvements (by @Nitwel)

### :rocket: Improvements

- **API**
  - [#17044](https://github.com/directus/directus/pull/17044) use setCacheValue in get-permissions util (by @azrikahar)
  - [#16822](https://github.com/directus/directus/pull/16822) Extension Improvements (by @Nitwel)
  - [#16111](https://github.com/directus/directus/pull/16111) Allow env access in Flows Run Script operation (by
    @licitdev)
- **App**
  - [#17007](https://github.com/directus/directus/pull/17007) Add Khmer (Cambodia) language for i18n (by @licitdev)
  - [#16617](https://github.com/directus/directus/pull/16617) Simplify calendar layout's first day options (by
    @azrikahar)
  - [#16555](https://github.com/directus/directus/pull/16555) Throttle idle event listeners (by @azrikahar)
  - [#16552](https://github.com/directus/directus/pull/16552) Fix page tracking debounced timeout (by @azrikahar)
  - [#16111](https://github.com/directus/directus/pull/16111) Allow env access in Flows Run Script operation (by
    @licitdev)
- **Extensions**
  - [#16667](https://github.com/directus/directus/pull/16667) Export context types for extensions (by @br41nslug)
- **shared**
  - [#16667](https://github.com/directus/directus/pull/16667) Export context types for extensions (by @br41nslug)

### :bug: Bug Fixes

- **App**
  - [#17084](https://github.com/directus/directus/pull/17084) Wrap mime-type display in `span` node (by @azrikahar)
  - [#17024](https://github.com/directus/directus/pull/17024) Add bottom margin to Slider interface to account for field
    note (by @azrikahar)
  - [#16966](https://github.com/directus/directus/pull/16966) Remove auto-increment primary key when saving as copy (by
    @br41nslug)
  - [#16897](https://github.com/directus/directus/pull/16897) Implements server sort in o2m table interface (by
    @br41nslug)
  - [#16881](https://github.com/directus/directus/pull/16881) Fix use-items loading state when an existing request gets
    canceled (by @azrikahar)
  - [#16581](https://github.com/directus/directus/pull/16581) Fix removal of keys in local storage (by @azrikahar)
  - [#16525](https://github.com/directus/directus/pull/16525) Fix translations-display width (by @d1rOn)
  - [#16476](https://github.com/directus/directus/pull/16476) Render-template layout fix (by @d1rOn)
  - [#14314](https://github.com/directus/directus/pull/14314) Disable field selection for alias fields in the
    system-filter component when functions are used (by @u12206050)
- **API**
  - [#17081](https://github.com/directus/directus/pull/17081) Make forcePathStyle configurable (by @rijkvanzanten)
  - [#17039](https://github.com/directus/directus/pull/17039) Don't double-root file ref (by @rijkvanzanten)
  - [#16944](https://github.com/directus/directus/pull/16944) healthcheck crashes with local file storage (by @freekrai)
  - [#16927](https://github.com/directus/directus/pull/16927) Cache / Permissions: Prevent server crash when command
    times out (by @joselcvarela)
  - [#16922](https://github.com/directus/directus/pull/16922) Fix inner query sort limit (by @licitdev)
  - [#16877](https://github.com/directus/directus/pull/16877) Allow explicit region configuration (by @rijkvanzanten)
  - [#16859](https://github.com/directus/directus/pull/16859) Handle plain object body in "Send Email" operation (by
    @paescuj)
  - [#16722](https://github.com/directus/directus/pull/16722) Collection export limit 0 leads to 500 error (by
    @br41nslug)
  - [#16679](https://github.com/directus/directus/pull/16679) Remove TZ conversion for timestamps in MySQL (by
    @licitdev)
  - [#16657](https://github.com/directus/directus/pull/16657) Cast numeric filter values as number for \_eq and \_neq
    operators (by @licitdev)
  - [#16647](https://github.com/directus/directus/pull/16647) Fix getCacheKey path matching for graphql (by @azrikahar)
  - [#16595](https://github.com/directus/directus/pull/16595) Fix last admin check for alterations type inputs (by
    @licitdev)
  - [#16579](https://github.com/directus/directus/pull/16579) Pass emitEvents to query methods in item-read &
    item-delete operations (by @azrikahar)

### :sponge: Optimizations

- **API**
  - [#17013](https://github.com/directus/directus/pull/17013) Ignore extension folders on lint (by @Nitwel)
  - [#16858](https://github.com/directus/directus/pull/16858) Remove deprecated npm flag in Dockerfile (by @paescuj)
- **App**
  - [#16700](https://github.com/directus/directus/pull/16700) Re-use getEndpoint utility function (by @azrikahar)
  - [#16678](https://github.com/directus/directus/pull/16678) Minor codestyle tweaks to datetime display & interface (by
    @azrikahar)
  - [#16545](https://github.com/directus/directus/pull/16545) Type fixes in app (part 1) (by @paescuj)
- **Misc.**
  - [#16576](https://github.com/directus/directus/pull/16576) Small clean-up of dependencies (by @paescuj)

### :package: Dependency Updates

- [#16878](https://github.com/directus/directus/pull/16878) Patch Tuesday Additions 🐸🐸 (by @paescuj)
- [#16875](https://github.com/directus/directus/pull/16875) Patch Tuesday 🐸 (by @rijkvanzanten)

## v9.22.0 (December 21, 2022)

### ⚠️ Notice

#### Node Version

Directus requires NodeJS LTS. As of this release, that is Node 18. Our Docker image has been updated to Node 18. If
you're running Directus in any other way, make sure that your environment is using Node 18.

#### File Storage

The file storage and metadata abstraction services have been replaced. The Directus app / api are backwards compatible,
but you will have to replace your usage of `@directus/drive` if you were relying on that package separately.

### :sparkles: New Features

- **API**
  - :warning: [#16825](https://github.com/directus/directus/pull/16825) Upgrade file storage abstraction layers (by
    @rijkvanzanten)
  - [#16650](https://github.com/directus/directus/pull/16650) Add support for custom JS embeds in the App (by
    @br41nslug)
- **App**
  - [#16650](https://github.com/directus/directus/pull/16650) Add support for custom JS embeds in the App (by
    @br41nslug)

### :rocket: Improvements

- **App**
  - [#16870](https://github.com/directus/directus/pull/16870) Fetch item/total counts separate (by @rijkvanzanten)
  - [#16714](https://github.com/directus/directus/pull/16714) Tweak datetime picker styles (by @azrikahar)
  - [#16660](https://github.com/directus/directus/pull/16660) New Crowdin updates (by @rijkvanzanten)
  - [#16500](https://github.com/directus/directus/pull/16500) New Crowdin updates (by @rijkvanzanten)
  - [#16278](https://github.com/directus/directus/pull/16278) Follow up user Roles not loading (by @br41nslug)
- **API**
  - [#16811](https://github.com/directus/directus/pull/16811) Added extra environment setting for sharp processing of
    invalid images (by @br41nslug)
  - [#16717](https://github.com/directus/directus/pull/16717) Fix typo in env stub (by @piotr-cz)
  - [#16433](https://github.com/directus/directus/pull/16433) Fix repeated logic caused by updateOne & deleteOne
    overrides (by @azrikahar)

### :bug: Bug Fixes

- **App**
  - [#16870](https://github.com/directus/directus/pull/16870) Fetch item/total counts separate (by @rijkvanzanten)
  - [#16724](https://github.com/directus/directus/pull/16724) Export redirects to wrong page when hosted in a subfolder
    (by @br41nslug)
  - [#16710](https://github.com/directus/directus/pull/16710) Translations: Fix missing `tfa_setup` (by @joselcvarela)
  - [#16668](https://github.com/directus/directus/pull/16668) Fix key combinations being prevented in dbSafe v-input
    when it's a leading number (by @azrikahar)
  - [#16618](https://github.com/directus/directus/pull/16618) "Is one of" filter is duplicating comma separated input
    (by @br41nslug)
  - [#16614](https://github.com/directus/directus/pull/16614) Fix app permissions presets with nested dynamic variables
    (by @azrikahar)
  - [#16585](https://github.com/directus/directus/pull/16585) fix wrong default ip (by @Nitwel)
  - [#16558](https://github.com/directus/directus/pull/16558) Fix json serialization (by @br41nslug)
  - [#16538](https://github.com/directus/directus/pull/16538) Fix loading logic in image component (by @paescuj)
  - [#16038](https://github.com/directus/directus/pull/16038) Reduce translate function calls in the App (by @azrikahar)
  - [#14798](https://github.com/directus/directus/pull/14798) Fix duplicated results and functions in nested filters (by
    @licitdev)
- **API**
  - [#16868](https://github.com/directus/directus/pull/16868) File Storage 2.0: Make metadata extraction
    backward-compatible (by @paescuj)
  - [#16691](https://github.com/directus/directus/pull/16691) enforce uppercase UUIDs for MS SQL (by @br41nslug)
  - [#16524](https://github.com/directus/directus/pull/16524) fix: adds missing Query and x-metadata to
    /components/schemas (by @NickUfer)
  - [#16299](https://github.com/directus/directus/pull/16299) Missing logs with Pino asynchronous logging (by
    @br41nslug)
  - [#14798](https://github.com/directus/directus/pull/14798) Fix duplicated results and functions in nested filters (by
    @licitdev)
- **cli**
  - [#16299](https://github.com/directus/directus/pull/16299) Missing logs with Pino asynchronous logging (by
    @br41nslug)

### :sponge: Optimizations

- **API**
  - [#16871](https://github.com/directus/directus/pull/16871) Fix reinstallation of dependencies in blackbox test
    workflow (by @paescuj)
  - [#16810](https://github.com/directus/directus/pull/16810) Use Node.js 18 for Docker image (by @paescuj)
  - [#16774](https://github.com/directus/directus/pull/16774) Update minimum node version to 16+ (by @Nitwel)
  - [#16755](https://github.com/directus/directus/pull/16755) Align ASSETS_CACHE_TTL default value in .env stub (by
    @azrikahar)
  - [#16696](https://github.com/directus/directus/pull/16696) Use node16 module-resolution (by @rijkvanzanten)
- **shared**
  - [#16770](https://github.com/directus/directus/pull/16770) Remove duplicated type for interfaceConfig group (by
    @azrikahar)
- **Misc.**
  - [#16574](https://github.com/directus/directus/pull/16574) Add initial GraphQL tests (by @licitdev)

## v9.21.1 (November 28, 2022)

### :rocket: Improvements

- **App**
  - [#16512](https://github.com/directus/directus/pull/16512) v-menu pointer event tweaks (by @azrikahar)
  - [#16511](https://github.com/directus/directus/pull/16511) Improve v-icon performance (by @azrikahar)
- **API**
  - [#16501](https://github.com/directus/directus/pull/16501) Set `auth_data` to null when updating user `provider` or
    `external_identifier` (by @azrikahar)
  - [#16499](https://github.com/directus/directus/pull/16499) Remove named timezone usage on MySQL (by @licitdev)
- **Extensions**
  - [#15989](https://github.com/directus/directus/pull/15989) Use esbuild to build typescript extensions (by @nickrum)

### :bug: Bug Fixes

- **shared**
  - [#16641](https://github.com/directus/directus/pull/16641) Fixup: Re-add entrypoint type definition files in
    @directus/shared (by @paescuj)
  - [#16606](https://github.com/directus/directus/pull/16606) Re-add entrypoint type definition files in
    `@directus/shared` (by @paescuj)
- **App**
  - [#16570](https://github.com/directus/directus/pull/16570) fix missing collection after sorting in M2A (by
    @azrikahar)
  - [#16518](https://github.com/directus/directus/pull/16518) Fix .module-nav-resize-handle layout (by @d1rOn)
- **API**
  - [#16562](https://github.com/directus/directus/pull/16562) Propagate mutation options for schema apply (by @licitdev)

### :sponge: Optimizations

- **Misc.**
  - [#16591](https://github.com/directus/directus/pull/16591) Optimize stores hydration calls (by @azrikahar)
  - [#16481](https://github.com/directus/directus/pull/16481) Clean-up dependencies (by @paescuj)

## v9.21.0 (November 17, 2022)

### :sparkles: New Features

- **Extensions**
  - [#15672](https://github.com/directus/directus/pull/15672) Add support for a package extension bundle type (by
    @nickrum)

### :rocket: Improvements

- **API**
  - [#16453](https://github.com/directus/directus/pull/16453) Optimize number of times cache is being cleared in
    ItemsService `updateBatch` (by @azrikahar)
  - [#16436](https://github.com/directus/directus/pull/16436) Allow admin to update Directus User `provider` and
    `external_identifier` (by @azrikahar)
  - [#16099](https://github.com/directus/directus/pull/16099) Returns the nodemailer promise (by @keesvanbemmel)
- **App**
  - [#16436](https://github.com/directus/directus/pull/16436) Allow admin to update Directus User `provider` and
    `external_identifier` (by @azrikahar)
  - [#16379](https://github.com/directus/directus/pull/16379) Fix sortField selection (by @Nitwel)
  - [#16375](https://github.com/directus/directus/pull/16375) Add editsGuard to drawerItem (by @Nitwel)
  - [#16365](https://github.com/directus/directus/pull/16365) Allow disabling same width for attached dropdown menu (by
    @azrikahar)
  - [#16280](https://github.com/directus/directus/pull/16280) use correct collection for translation (by @Nitwel)
  - [#15861](https://github.com/directus/directus/pull/15861) Keep SidebarOpen state in local storage (by @goth-pl)
- **Extensions**
  - [#15909](https://github.com/directus/directus/pull/15909) Detect used package manager in extension CLI (by @nickrum)

### :bug: Bug Fixes

- **App**
  - [#16487](https://github.com/directus/directus/pull/16487) Fix shares sidebar drawer's close event (by @azrikahar)
  - [#16473](https://github.com/directus/directus/pull/16473) Fix preset resetting itself (by @Nitwel)
  - [#16471](https://github.com/directus/directus/pull/16471) Sanitize value in comment-input (by @azrikahar)
  - [#16412](https://github.com/directus/directus/pull/16412) Reset page when changing pageSize (by @Nitwel)
  - [#16283](https://github.com/directus/directus/pull/16283) Only pass needed values when sorting (by @Nitwel)
- **API**
  - [#16485](https://github.com/directus/directus/pull/16485) fix syntax in oas (by @cf-ts)
  - [#16483](https://github.com/directus/directus/pull/16483) Fix condition operation passing even when the checked
    field isn't present in the payload (by @azrikahar)
  - [#16461](https://github.com/directus/directus/pull/16461) Fix unsupported date_part() in CrDB (by @licitdev)
  - [#16438](https://github.com/directus/directus/pull/16438) Fix `cast-csv` read action for csv field's first revision
    (by @azrikahar)
  - [#16435](https://github.com/directus/directus/pull/16435) Fix limit in nested a2o queries (by @licitdev)
  - [#16430](https://github.com/directus/directus/pull/16430) Fix legacy permissions for M2O fields in GraphQL (by
    @licitdev)
  - [#16413](https://github.com/directus/directus/pull/16413) Fix \_\_typename selection for functions in GraphQL (by
    @licitdev)
  - [#16368](https://github.com/directus/directus/pull/16368) Fix zero value for numeric precision and scale with
    float/decimal fields (by @azrikahar)
  - [#16320](https://github.com/directus/directus/pull/16320) Skip checking of virtual alias fields (by @licitdev)
  - [#16297](https://github.com/directus/directus/pull/16297) Skip serialization for empty or string bigint values in
    GraphQL (by @licitdev)
  - [#16234](https://github.com/directus/directus/pull/16234) Check original field name when aliased (by @licitdev)
  - [#16233](https://github.com/directus/directus/pull/16233) Fix base email template footer link & logo aspect ratio
    (by @azrikahar)
  - [#16180](https://github.com/directus/directus/pull/16180) Update last value when triggering nested flows with array
    values (by @licitdev)
  - [#16027](https://github.com/directus/directus/pull/16027) Fix date functions for databases not in UTC timezone (by
    @licitdev)
  - [#15984](https://github.com/directus/directus/pull/15984) CockroachDB can't recreate constraints with the same name
    (by @br41nslug)
  - [#15576](https://github.com/directus/directus/pull/15576) Emit action events with updated schema (by @licitdev)
- **specs**
  - [#16294](https://github.com/directus/directus/pull/16294) Fix "create an item" requestBody schema in OAS (by
    @azrikahar)
- **Misc.**
  - [#16271](https://github.com/directus/directus/pull/16271) Remove dev dependencies when running blackbox tests (by
    @licitdev)

### :sponge: Optimizations

- **Misc.**
  - [#16486](https://github.com/directus/directus/pull/16486) use pnpm `shell-emulator` instead of `cross-env` (by
    @azrikahar)
  - [#16484](https://github.com/directus/directus/pull/16484) fix list-folders test on Windows (by @azrikahar)
  - [#16462](https://github.com/directus/directus/pull/16462) Clean-up after Jest to Vitest switch in API (by @paescuj)
  - [#16380](https://github.com/directus/directus/pull/16380) Clean-up lint / format set-up (by @paescuj)
  - [#16374](https://github.com/directus/directus/pull/16374) Exclude unnecessary files from packages (by @paescuj)
  - [#16360](https://github.com/directus/directus/pull/16360) Update the Makefile for testing the Docker image build
    process (by @paescuj)
- **API**
  - [#16263](https://github.com/directus/directus/pull/16263) Finish switch from Jest to Vitest in API (by @paescuj)

### :package: Dependency Updates

- [#16475](https://github.com/directus/directus/pull/16475) Patch Tuesday 🐸 (by @rijkvanzanten)
- [#16441](https://github.com/directus/directus/pull/16441) Replace rollup-plugin-terser with @rollup/plugin-terser (by
  @rijkvanzanten)

## v9.19.0 (October 21, 2022)

### :sparkles: New Features

- **drive**
  - [#15952](https://github.com/directus/directus/pull/15952) Add support for s3 ServerSideEncryption (by @rperon)

### :rocket: Improvements

- **API**
  - [#16016](https://github.com/directus/directus/pull/16016) Remove property="og:url" from email base template (by
    @vanling)
  - [#15873](https://github.com/directus/directus/pull/15873) Fix CodeQL threadflow steps (by @licitdev)
  - [#15673](https://github.com/directus/directus/pull/15673) Allow custom label for auth provider (by @joselcvarela)
- **App**
  - [#15993](https://github.com/directus/directus/pull/15993) Add Bosnian to available languages (by @ConnorSimply)
  - [#15981](https://github.com/directus/directus/pull/15981) Add search to field creation drawer (by @azrikahar)
  - [#15977](https://github.com/directus/directus/pull/15977) Allow triggering manual flow without selection(s) (by
    @azrikahar)
  - [#15955](https://github.com/directus/directus/pull/15955) Remove use-m2m (by @Nitwel)
  - [#15880](https://github.com/directus/directus/pull/15880) Allow removing existing link in WYSIWYG editor by clearing
    the URL (by @azrikahar)
  - [#15764](https://github.com/directus/directus/pull/15764) Change trigger flow operations to dropdown using the local
    store (by @br41nslug)
  - [#15757](https://github.com/directus/directus/pull/15757) Fix empty form info on translations (by @Nitwel)
  - [#15701](https://github.com/directus/directus/pull/15701) Separate pasted values for "Is one of" filter (by
    @br41nslug)
  - [#15680](https://github.com/directus/directus/pull/15680) Map cluster and calendar drag highlight color tweak (by
    @azrikahar)
  - [#15673](https://github.com/directus/directus/pull/15673) Allow custom label for auth provider (by @joselcvarela)
  - [#15585](https://github.com/directus/directus/pull/15585) Change Trigger Flow operation's Flow uuid input to
    autocomplete interface (by @u12206050)
  - [#15571](https://github.com/directus/directus/pull/15571) Remove warning type for empty presets page (by @azrikahar)
- **Misc.**
  - [#15946](https://github.com/directus/directus/pull/15946) Replace raw templates deeply when applying data to options
    (by @nickrum)
  - [#15793](https://github.com/directus/directus/pull/15793) Allow extensions to be symlinks when running the App in
    dev mode (by @nickrum)

### :bug: Bug Fixes

- **App**
  - [#16078](https://github.com/directus/directus/pull/16078) Fix Project Background Image URL Resolution (by
    @ConnorSimply)
  - [#16069](https://github.com/directus/directus/pull/16069) Reset selections for Flows manual trigger in collection
    page (by @azrikahar)
  - [#16039](https://github.com/directus/directus/pull/16039) Optimise data model sorting (by @licitdev)
  - [#16037](https://github.com/directus/directus/pull/16037) Add try/catch block to Users Module navigation and
    system-scope interface (by @azrikahar)
  - [#16030](https://github.com/directus/directus/pull/16030) Fix extensions translations and time-series panel (by
    @azrikahar)
  - [#16002](https://github.com/directus/directus/pull/16002) Use right collection for filter (by @Nitwel)
  - [#15999](https://github.com/directus/directus/pull/15999) Remove handleObject default value in render-template (by
    @azrikahar)
  - [#15959](https://github.com/directus/directus/pull/15959) Add missing adjustFieldsForDisplays (by @Nitwel)
  - [#15958](https://github.com/directus/directus/pull/15958) treat empty array as null on relational field (by @Nitwel)
  - [#15957](https://github.com/directus/directus/pull/15957) Check for M2A with single related collection in
    useFieldTree composable (by @azrikahar)
  - [#15951](https://github.com/directus/directus/pull/15951) Fix translation display (by @Nitwel)
  - [#15930](https://github.com/directus/directus/pull/15930) Insights dashboard - List panels link to listed collection
    items. (by @br41nslug)
  - [#15904](https://github.com/directus/directus/pull/15904) Reset junction collection/fields for field relationships
    with junction table (by @azrikahar)
  - [#15872](https://github.com/directus/directus/pull/15872) Fix special characters in translation strings (by
    @azrikahar)
  - [#15868](https://github.com/directus/directus/pull/15868) Fix and improve raw value editor (by @VincentKempers)
  - [#15841](https://github.com/directus/directus/pull/15841) fix (display-filesize): wrap component value in `span`
    node (by @abernh)
  - [#15840](https://github.com/directus/directus/pull/15840) fix (display-filesize): adjust handler argument to be read
    as `value` (by @abernh)
  - [#15824](https://github.com/directus/directus/pull/15824) Fix non viewable items (by @Nitwel)
  - [#15823](https://github.com/directus/directus/pull/15823) Fix scrolling on dialog (by @Nitwel)
  - [#15758](https://github.com/directus/directus/pull/15758) Make watch be triggered immediately (by @Nitwel)
  - [#15736](https://github.com/directus/directus/pull/15736) Fix thumbnails not displaying in Files interface (by
    @d1rOn)
  - [#15729](https://github.com/directus/directus/pull/15729) Fix translations display's info button vertical alignment
    (by @d1rOn)
  - [#15709](https://github.com/directus/directus/pull/15709) Fix image alt being null (by @Nitwel)
  - [#15681](https://github.com/directus/directus/pull/15681) Use singular/plural collection translations in M2A
    interface (by @azrikahar)
  - [#15662](https://github.com/directus/directus/pull/15662) Fix flow operations staged edits (by @azrikahar)
  - [#15640](https://github.com/directus/directus/pull/15640) Set special flags when configuring db-only fields (by
    @azrikahar)
  - [#15637](https://github.com/directus/directus/pull/15637) Fix workspace size logic (by @azrikahar)
  - [#14778](https://github.com/directus/directus/pull/14778) Add fallback message when no fields are visible in a form
    (by @br41nslug)
- **API**
  - [#16039](https://github.com/directus/directus/pull/16039) Optimise data model sorting (by @licitdev)
  - [#16015](https://github.com/directus/directus/pull/16015) Skip parsing of date strings that only contain zeros (by
    @licitdev)
  - [#16010](https://github.com/directus/directus/pull/16010) Process page only when merging with parent items (by
    @licitdev)
  - [#15960](https://github.com/directus/directus/pull/15960) Add alias to always have the same name (by @Nitwel)
  - [#15928](https://github.com/directus/directus/pull/15928) Updated argon2 to 0.29.X for M1 support (by @br41nslug)
  - [#15898](https://github.com/directus/directus/pull/15898) public_url_file in .env causes server start error (by
    @br41nslug)
  - [#15876](https://github.com/directus/directus/pull/15876) Update ioredis to fix connection uri options (by
    @br41nslug)
  - [#15760](https://github.com/directus/directus/pull/15760) adds missing graphQL operators (by @freekrai)
  - [#15723](https://github.com/directus/directus/pull/15723) Fix non-admin role creation via cli for SQLite (by
    @azrikahar)
  - [#15644](https://github.com/directus/directus/pull/15644) Cast special in system fields as array (by @licitdev)

### :sponge: Optimizations

- **Misc.**
  - [#16083](https://github.com/directus/directus/pull/16083) Small `Release` workflow clean-up (by @paescuj)
  - [#16081](https://github.com/directus/directus/pull/16081) Update upload-artifact action to v3 (by @licitdev)
  - [#16080](https://github.com/directus/directus/pull/16080) Prepare Action: Set output via new file method (by
    @paescuj)
  - [#16057](https://github.com/directus/directus/pull/16057) Update MAX_PAYLOAD_SIZE env stub to 1mb (by @licitdev)
  - [#16048](https://github.com/directus/directus/pull/16048) Run blackbox tests in parallel (by @licitdev)
  - [#15939](https://github.com/directus/directus/pull/15939) Make the repo usable with Node v18 (by @nickrum)
  - [#15786](https://github.com/directus/directus/pull/15786) Ignore pnpm-lock.yaml when running prettier on the repo
    (by @nickrum)
- **App**
  - [#15944](https://github.com/directus/directus/pull/15944) Move key to component where v-for is defined (by @nickrum)

### :package: Dependency Updates

- [#16052](https://github.com/directus/directus/pull/16052) Patch Tuesday 🐸 (by @rijkvanzanten)
- [#15943](https://github.com/directus/directus/pull/15943) Upgrade vite (by @rijkvanzanten)
- [#15928](https://github.com/directus/directus/pull/15928) Updated argon2 to 0.29.X for M1 support (by @br41nslug)
- [#15876](https://github.com/directus/directus/pull/15876) Update ioredis to fix connection uri options (by @br41nslug)

## v9.18.0 (September 19, 2022)

### :sparkles: New Features

- **App**
  - [#15452](https://github.com/directus/directus/pull/15452) Relational Selection Panel for Insights Variable (by
    @br41nslug)

### :rocket: Improvements

- **App**
  - [#15570](https://github.com/directus/directus/pull/15570) Only pass singleton prop in CollectionOrItem component
    when necessary (by @azrikahar)
  - [#15548](https://github.com/directus/directus/pull/15548) Use the improved get method (by @Nitwel)
  - [#15514](https://github.com/directus/directus/pull/15514) Allow user to send a WYSIWYG email body (by @raflymln)
- **API**
  - [#15514](https://github.com/directus/directus/pull/15514) Allow user to send a WYSIWYG email body (by @raflymln)

### :bug: Bug Fixes

- **API**
  - [#15599](https://github.com/directus/directus/pull/15599) Cache: Fix check if endpoint is `/graphql` or not (by
    @joselcvarela)
  - [#15574](https://github.com/directus/directus/pull/15574) Fix starting Directus using a custom start file (by
    @nickrum)
  - [#15547](https://github.com/directus/directus/pull/15547) Handle Date objects in compress util (by @azrikahar)
  - [#15494](https://github.com/directus/directus/pull/15494) Fix rotating called twice (by @Nitwel)
  - [#15467](https://github.com/directus/directus/pull/15467) revisions for CRUD operations with $full (by @freekrai)
  - [#15465](https://github.com/directus/directus/pull/15465) GraphQLID is always Non-Nullable (by @kepi)
  - [#15420](https://github.com/directus/directus/pull/15420) Ensure case insensitive email checks for password reset
    requests (by @azrikahar)
  - [#14816](https://github.com/directus/directus/pull/14816) Fix schema re-apply attempts when it's a different
    database vendor (by @azrikahar)
  - [#14690](https://github.com/directus/directus/pull/14690) Use original table names for columns with functions (by
    @licitdev)
- **App**
  - [#15593](https://github.com/directus/directus/pull/15593) skip interface options for variable panel (by @br41nslug)
  - [#15579](https://github.com/directus/directus/pull/15579) Showing the v-error on unexpected errors (by
    @VincentKempers)
  - [#15548](https://github.com/directus/directus/pull/15548) Use the improved get method (by @Nitwel)
  - [#15520](https://github.com/directus/directus/pull/15520) fix redudant message in unexpected error (by
    @VincentKempers)
  - [#15500](https://github.com/directus/directus/pull/15500) Fix duplicate indexes (by @Nitwel)
  - [#15463](https://github.com/directus/directus/pull/15463) Fix display dimensions of SVG in image edit drawer (by
    @licitdev)
  - [#15450](https://github.com/directus/directus/pull/15450) Fix M2M drawer autofocusing the wrong field with junction
    field location `top` (by @NigmaX)
  - [#15442](https://github.com/directus/directus/pull/15442) Fix v-list-group active state (by @azrikahar)
  - [#15441](https://github.com/directus/directus/pull/15441) fix: add arrow-placement logic check if folder empty (by
    @chaiwattsw)
  - [#15221](https://github.com/directus/directus/pull/15221) Fix O2M edits on unsaved items (by @azrikahar)
  - [#14947](https://github.com/directus/directus/pull/14947) Item Duplication for manually entered primary keys (by
    @br41nslug)
  - [#14871](https://github.com/directus/directus/pull/14871) Add missing download and token parameter in File interface
    (by @JonathanSchndr)
  - [#14690](https://github.com/directus/directus/pull/14690) Use original table names for columns with functions (by
    @licitdev)

### :sponge: Optimizations

- **Misc.**
  - [#15594](https://github.com/directus/directus/pull/15594) Correct the documented default type for argon2 (by
    @azrikahar)
  - [#15402](https://github.com/directus/directus/pull/15402) Add singleton tests (by @licitdev)
- **shared**
  - [#15578](https://github.com/directus/directus/pull/15578) Add a pathToRelativeUrl util function (by @nickrum)

## v9.17.4 (September 6, 2022)

### :bug: Bug Fixes

- **App**
  - [#15438](https://github.com/directus/directus/pull/15438) Prevent v-highlight infinite loop (by @azrikahar)

## v9.17.3 (September 6, 2022)

### :bug: Bug Fixes

- **App**
  - [#15433](https://github.com/directus/directus/pull/15433) Merge with M2M junction value when validating in
    drawer-item (by @licitdev)

## v9.17.2 (September 6, 2022)

### :bug: Bug Fixes

- **App**
  - [#15413](https://github.com/directus/directus/pull/15413) Fix drawer item empty form for o2m/treeview (by
    @azrikahar)

## v9.17.1 (September 5, 2022)

### :sparkles: New Features

- **API**
  - [#15384](https://github.com/directus/directus/pull/15384) Adding SendGrid email transport (by @naskio)

### :rocket: Improvements

- **App**
  - [#14605](https://github.com/directus/directus/pull/14605) fix divider not showing/ showing when not needed
    (drawer-item) (by @NigmaX)

### :bug: Bug Fixes

- **API**
  - [#15403](https://github.com/directus/directus/pull/15403) Disable foreign check outside the trx in SQLite (by
    @licitdev)
- **App**
  - [#15396](https://github.com/directus/directus/pull/15396) #15395 fix: date-fns date format for tr-TR translations
    (by @kadiresen)
  - [#15386](https://github.com/directus/directus/pull/15386) Merge with existing item when validating in drawer-item
    (by @licitdev)
  - [#15385](https://github.com/directus/directus/pull/15385) Set limit as -1 for local exports when field is cleared
    (by @licitdev)

## v9.17.0 (September 2, 2022)

### :sparkles: New Features

- **Misc.**
  - [#10551](https://github.com/directus/directus/pull/10551) Implement query hook (by @sebj54)

### :rocket: Improvements

- **App**
  - [#15366](https://github.com/directus/directus/pull/15366) Reset value when no changes (by @Nitwel)
  - [#15273](https://github.com/directus/directus/pull/15273) Add origin to accountability (by @licitdev)
  - [#15267](https://github.com/directus/directus/pull/15267) Revert list style for O2M and M2M interfaces (by
    @azrikahar)
  - [#15243](https://github.com/directus/directus/pull/15243) Allow for displaying lists in render template (by @Nitwel)
  - [#15218](https://github.com/directus/directus/pull/15218) Add missing translations (by @Nitwel)
  - [#15200](https://github.com/directus/directus/pull/15200) Automatic range on insights graph (by @HuldaCZ)
  - [#15128](https://github.com/directus/directus/pull/15128) Make all options from upload menu directly accessible (by
    @Tummerhore)
  - [#15094](https://github.com/directus/directus/pull/15094) Add Components Package (by @Nitwel)
  - [#14700](https://github.com/directus/directus/pull/14700) Refresh current item on flow run & prompt when there's
    unsaved changes (by @azrikahar)
- **API**
  - [#15327](https://github.com/directus/directus/pull/15327) Allow setting SMTP name (by @rijkvanzanten)
  - [#15302](https://github.com/directus/directus/pull/15302) Added COOKIE_OPTIONS to /refresh (by @j0hnfl0w)
  - [#15284](https://github.com/directus/directus/pull/15284) Make threshold checks configurable (by @nazarevrn)
  - [#15273](https://github.com/directus/directus/pull/15273) Add origin to accountability (by @licitdev)
  - [#15257](https://github.com/directus/directus/pull/15257) Use encodeurl package to escape URLs for axios (by
    @licitdev)
  - [#15251](https://github.com/directus/directus/pull/15251) Remove functions from non-read actions in GraphQL types
    (by @licitdev)
- **Extensions**
  - [#15213](https://github.com/directus/directus/pull/15213) Be smarter when scaffolding an extension and choosing the
    package name and target path based on the user-provided name (by @nickrum)

### :bug: Bug Fixes

- **API**
  - [#15369](https://github.com/directus/directus/pull/15369) Don't reset body on singleton non-SEARCH reqs (by
    @rijkvanzanten)
  - [#15354](https://github.com/directus/directus/pull/15354) Do not parse json in transform operation if it is already
    an object (by @nickrum)
  - [#15339](https://github.com/directus/directus/pull/15339) Fix SEARCH query not functioning on singleton collections
    (by @rijkvanzanten)
  - [#15308](https://github.com/directus/directus/pull/15308) Missing headers for invalid json requests (by @br41nslug)
  - [#15283](https://github.com/directus/directus/pull/15283) Throw rejected error for filter event in Flows (by
    @licitdev)
  - [#15241](https://github.com/directus/directus/pull/15241) Sort is set to NULL for new items (by @br41nslug)
  - [#15228](https://github.com/directus/directus/pull/15228) Return empty array if scope is not defined (by @licitdev)
  - [#15215](https://github.com/directus/directus/pull/15215) Expose login stall time environment variable (by
    @licitdev)
  - [#15209](https://github.com/directus/directus/pull/15209) Update watched extensions when enabling watcher (by
    @nickrum)
  - [#15164](https://github.com/directus/directus/pull/15164) Update workspace tile position only when there are values
    defined (by @licitdev)
- **App**
  - [#15361](https://github.com/directus/directus/pull/15361) Fix custom icons (by @azrikahar)
  - [#15355](https://github.com/directus/directus/pull/15355) check that collection exists and not a singleton on panels
    (by @freekrai)
  - [#15352](https://github.com/directus/directus/pull/15352) Prevent sending the primary key for newly created
    relational items (by @br41nslug)
  - [#15337](https://github.com/directus/directus/pull/15337) Current items cleared in o2m/m2m when selecting nothing
    with "add existing" (by @br41nslug)
  - [#15336](https://github.com/directus/directus/pull/15336) Fix drawer (by @Nitwel)
  - [#15328](https://github.com/directus/directus/pull/15328) Add max height to CodeMirror scroller (by @rijkvanzanten)
  - [#15310](https://github.com/directus/directus/pull/15310) Default values ignored for validations affected by
    conditions (by @br41nslug)
  - [#15304](https://github.com/directus/directus/pull/15304) Fix pagination on disabled o2m and m2m fields (by
    @azrikahar)
  - [#15276](https://github.com/directus/directus/pull/15276) Don't throw error if entry is null or undefined (by
    @u12206050)
  - [#15245](https://github.com/directus/directus/pull/15245) 100 related items being deleted from m2m relationship (by
    @u12206050)
  - [#15243](https://github.com/directus/directus/pull/15243) Allow for displaying lists in render template (by @Nitwel)
  - [#15241](https://github.com/directus/directus/pull/15241) Sort is set to NULL for new items (by @br41nslug)
  - [#15238](https://github.com/directus/directus/pull/15238) Add collection info to conditions (by @Nitwel)
  - [#15236](https://github.com/directus/directus/pull/15236) Fix filter not resetting on bookmarks (by @Nitwel)
  - [#15228](https://github.com/directus/directus/pull/15228) Return empty array if scope is not defined (by @licitdev)
  - [#15220](https://github.com/directus/directus/pull/15220) Fix and clean up m2m & o2m (by @Nitwel)
  - [#15211](https://github.com/directus/directus/pull/15211) Make variable panels editable in non edit mode (by
    @rijkvanzanten)
  - [#15210](https://github.com/directus/directus/pull/15210) Can't edit o2m relations to directus_files collection (by
    @br41nslug)
  - [#15155](https://github.com/directus/directus/pull/15155) Fix displaying values from deeper relationships in table
    (by @u12206050)
  - [#15115](https://github.com/directus/directus/pull/15115) Fix thumbnail overflow in render-template (by @azrikahar)

### :sponge: Optimizations

- **Misc.**
  - [#15374](https://github.com/directus/directus/pull/15374) Move updated components to app (by @rijkvanzanten)
  - [#15358](https://github.com/directus/directus/pull/15358) Fix lint warnings (by @licitdev)
  - [#15268](https://github.com/directus/directus/pull/15268) Add new flow env to allowed list & remove comment leftover
    (by @paescuj)
- **API**
  - [#15340](https://github.com/directus/directus/pull/15340) Simplify ("unoverengineer") async-handler (by
    @rijkvanzanten)
- **App**
  - [#15332](https://github.com/directus/directus/pull/15332) Move get-with-arrays to shared (by @rijkvanzanten)
- **shared**
  - [#15332](https://github.com/directus/directus/pull/15332) Move get-with-arrays to shared (by @rijkvanzanten)

### :package: Dependency Updates

- [#15234](https://github.com/directus/directus/pull/15234) Update node-cron to 3.0.2 (by @tenebrius)

## v9.16.1 (August 19, 2022)

### :bug: Bug Fixes

- **App**
  - [#15160](https://github.com/directus/directus/pull/15160) v-form error: Cannot read properties of undefined (reading
    'meta') (by @br41nslug)

## v9.16.0 (August 18, 2022)

### :sparkles: New Features

- **API**
  - [#15101](https://github.com/directus/directus/pull/15101) Add "Run Script" operation (by @rijkvanzanten)
- **App**
  - [#15101](https://github.com/directus/directus/pull/15101) Add "Run Script" operation (by @rijkvanzanten)
  - [#14665](https://github.com/directus/directus/pull/14665) RTL support in translation interface (by @ramonvanbezouw)
  - [#12820](https://github.com/directus/directus/pull/12820) Initial interface of O2M & M2M Table View (by @u12206050)

### :rocket: Improvements

- **API**
  - [#15149](https://github.com/directus/directus/pull/15149) API: Bypass cache for `/server/ping` (by @joselcvarela)
  - [#15029](https://github.com/directus/directus/pull/15029) Add Content-Type header to Flows request operation when
    applicable (by @azrikahar)
  - [#14694](https://github.com/directus/directus/pull/14694) Allow array of user IDs for Notify operation (by
    @azrikahar)
- **App**
  - [#15132](https://github.com/directus/directus/pull/15132) Unify download icon (by @Tummerhore)
  - [#15131](https://github.com/directus/directus/pull/15131) Hide item link for delete action in activity feed (by
    @licitdev)
  - [#15107](https://github.com/directus/directus/pull/15107) Remove check button when displaying activity log item (by
    @licitdev)
  - [#15032](https://github.com/directus/directus/pull/15032) Fix date-fns format to use hours (HH) instead of era (GG)
    in polish translation (by @piotr-cz)
  - [#14987](https://github.com/directus/directus/pull/14987) Add allow duplicates option to M2A and M2M interfaces (by
    @Le4Q)
  - [#14913](https://github.com/directus/directus/pull/14913) Remove disabled override (by @u12206050)
  - [#14858](https://github.com/directus/directus/pull/14858) Missed Kurdish language dialects (by @halwesit)
  - [#14694](https://github.com/directus/directus/pull/14694) Allow array of user IDs for Notify operation (by
    @azrikahar)

### :bug: Bug Fixes

- **App**
  - [#15148](https://github.com/directus/directus/pull/15148) Fix searching custom value and text property on v-select
    (by @u12206050)
  - [#15144](https://github.com/directus/directus/pull/15144) Stop groups from rendering before the conditions are
    applied (by @br41nslug)
  - [#15141](https://github.com/directus/directus/pull/15141) fix name removal in Presets & Bookmarks (by @azrikahar)
  - [#15126](https://github.com/directus/directus/pull/15126) Fix URL for subfolder assets (by @licitdev)
  - [#15117](https://github.com/directus/directus/pull/15117) Fix margin for tree view buttons (by @azrikahar)
  - [#15113](https://github.com/directus/directus/pull/15113) Reinstate language direction translations keys (by
    @azrikahar)
  - [#15111](https://github.com/directus/directus/pull/15111) Fix translations interface and use-relation-multiple empty
    edits (by @azrikahar)
  - [#15109](https://github.com/directus/directus/pull/15109) Use img for user placeholder image in activity feed (by
    @licitdev)
  - [#15082](https://github.com/directus/directus/pull/15082) Fix v-image's intersection observer sometimes preventing
    image load (by @azrikahar)
  - [#15073](https://github.com/directus/directus/pull/15073) Fix filter by folder for file and files interface (by
    @azrikahar)
  - [#15065](https://github.com/directus/directus/pull/15065) Fix manually typed o2m sort field (by @azrikahar)
  - [#15050](https://github.com/directus/directus/pull/15050) Graphql: Fix geometry type in arguments (by @joselcvarela)
  - [#15044](https://github.com/directus/directus/pull/15044) Allow fields nested in groups to be visible (by @licitdev)
  - [#15041](https://github.com/directus/directus/pull/15041) Show sub fields if parent exists (by @u12206050)
  - [#15023](https://github.com/directus/directus/pull/15023) Skip fetching items when id = '+' (by @licitdev)
  - [#15009](https://github.com/directus/directus/pull/15009) Encode webhook url only if it does not contain encoded
    values (by @licitdev)
  - [#15008](https://github.com/directus/directus/pull/15008) Fix map interface controls for non-native geometry types
    (by @azrikahar)
  - [#15005](https://github.com/directus/directus/pull/15005) Prevent clearing of trigger options when initialising (by
    @licitdev)
  - [#14998](https://github.com/directus/directus/pull/14998) Fix Flow operations update bug (by @azrikahar)
  - [#14996](https://github.com/directus/directus/pull/14996) App: Do not validate circular fields (by @joselcvarela)
  - [#14952](https://github.com/directus/directus/pull/14952) App: Do not allow to link collection `folders` to M2A
    relationship (by @joselcvarela)
  - [#14935](https://github.com/directus/directus/pull/14935) Fix show hidden collections for nested collections (by
    @azrikahar)
  - [#14867](https://github.com/directus/directus/pull/14867) Remove disabled props from presentation links (by
    @JonathanSchndr)
  - [#14841](https://github.com/directus/directus/pull/14841) Fix checkboxes and radio buttons overflow (by @azrikahar)
  - [#14824](https://github.com/directus/directus/pull/14824) m2a drawer throwing errors for alternate layouts (by
    @br41nslug)
- **API**
  - [#15106](https://github.com/directus/directus/pull/15106) Remove limit when loading flows (by @licitdev)
  - [#15097](https://github.com/directus/directus/pull/15097) Remove usage of .send() when ending stream (by @licitdev)
  - [#15087](https://github.com/directus/directus/pull/15087) Fix foreign key constraint errors for nested operations
    when deleting a Flow (by @azrikahar)
  - [#15081](https://github.com/directus/directus/pull/15081) Add messenger to allow list of environment variables with
    `_FILE` suffix (by @azrikahar)
  - [#15072](https://github.com/directus/directus/pull/15072) Fix schema apply when deleting interrelated collections
    (by @azrikahar)
  - [#15050](https://github.com/directus/directus/pull/15050) Graphql: Fix geometry type in arguments (by @joselcvarela)
  - [#15010](https://github.com/directus/directus/pull/15010) Only allow null filter operators for fields with "conceal"
    special (by @licitdev)
  - [#15007](https://github.com/directus/directus/pull/15007) Send error status only if no data is written (by
    @licitdev)
  - [#14985](https://github.com/directus/directus/pull/14985) Fix decompression when floats are used, but no integers
    are present (by @rijkvanzanten)
  - [#14981](https://github.com/directus/directus/pull/14981) Emit nested action events after the transaction completes
    (by @licitdev)
  - [#14951](https://github.com/directus/directus/pull/14951) Fix validatePayload for \_or containing \_and (by
    @u12206050)
  - [#14854](https://github.com/directus/directus/pull/14854) Encode file import url if not already encoded (by
    @licitdev)
  - [#14845](https://github.com/directus/directus/pull/14845) Fix duplicate env keys (by @bjornarhagen)
  - [#14840](https://github.com/directus/directus/pull/14840) Fix macos-release error in server info (by @azrikahar)

### :sponge: Optimizations

- **Misc.**
  - [#15146](https://github.com/directus/directus/pull/15146) Revert "Fix "Unrestricted file system access to" messages"
    (by @paescuj)
  - [#15130](https://github.com/directus/directus/pull/15130) Move unit tests to files they apply to (by @rijkvanzanten)
  - [#15093](https://github.com/directus/directus/pull/15093) Add M2M base tests (by @licitdev)
  - [#15083](https://github.com/directus/directus/pull/15083) Skip seeding of excluded tests when running "only" in
    blackbox (by @licitdev)
  - [#15070](https://github.com/directus/directus/pull/15070) Enable schema caching for blackbox tests (by @licitdev)
  - [#14954](https://github.com/directus/directus/pull/14954) Run blackbox tests when shared package / workflow is
    updated (by @licitdev)
  - [#14945](https://github.com/directus/directus/pull/14945) Clean-up GitHub workflows (by @paescuj)
  - [#14943](https://github.com/directus/directus/pull/14943) Use native concurrency option to cancel outdated workflow
    runs (by @paescuj)
  - [#14934](https://github.com/directus/directus/pull/14934) Tweak add-to-project GitHub action (by @azrikahar)

### :package: Dependency Updates

- [#15047](https://github.com/directus/directus/pull/15047) Update knex-schema-inspector to 2.0.4 (by @rijkvanzanten)

## v9.15.0 (August 4, 2022)

### :sparkles: New Features

- **API**
  - [#14833](https://github.com/directus/directus/pull/14833) Improve cache performance by compressing records (by
    @joselcvarela)
- **App**
  - [#14786](https://github.com/directus/directus/pull/14786) Support custom aspect ratios in image editor (by
    @azrikahar)
- **Extensions**
  - [#14410](https://github.com/directus/directus/pull/14410) Add support for operation extensions to the Extensions SDK
    (by @nickrum)

### :rocket: Improvements

- **App**
  - [#14818](https://github.com/directus/directus/pull/14818) Exclude relationship fields on field validation (by
    @u12206050)
  - [#14745](https://github.com/directus/directus/pull/14745) Add configuration for "Add New"/"Select Existing" buttons
    in M2O interface (by @rijkvanzanten)
  - [#14663](https://github.com/directus/directus/pull/14663) Add Show Search option to checkbox tree (by @u12206050)
  - [#14662](https://github.com/directus/directus/pull/14662) Resolve a warning shown when opening the in-App docs in
    dev mode (by @nickrum)
- **Extensions**
  - [#14659](https://github.com/directus/directus/pull/14659) Improve extension scaffolding log message (by @nickrum)
- **API**
  - [#14625](https://github.com/directus/directus/pull/14625) Handle not unique errors during auto-registration (by
    @aidenfoxx)

### :bug: Bug Fixes

- **API**
  - [#14829](https://github.com/directus/directus/pull/14829) Check for allowed filter operators when applying filter
    (by @licitdev)
  - [#14803](https://github.com/directus/directus/pull/14803) Move serializers option to the right place for pino-http
    (by @erickjth)
  - [#14741](https://github.com/directus/directus/pull/14741) Fix Emit Events for item CRUD operations in Flows (by
    @azrikahar)
  - [#14705](https://github.com/directus/directus/pull/14705) Replace functions within arrays in GraphQL (by @licitdev)
  - [#14627](https://github.com/directus/directus/pull/14627) 500 error when using scoped fields query when not
    applicable (by @br41nslug)
  - [#14581](https://github.com/directus/directus/pull/14581) Extend OpenAPI schemas for JSON-backed fields (by
    @pmwheatley)
  - [#14323](https://github.com/directus/directus/pull/14323) Change notifications timestamp to nullable & default to
    now (by @azrikahar)
- **App**
  - [#14806](https://github.com/directus/directus/pull/14806) Check for null initialValues in unsetValue (by @licitdev)
  - [#14791](https://github.com/directus/directus/pull/14791) Nested forms get out of sync on unset (by @br41nslug)
  - [#14776](https://github.com/directus/directus/pull/14776) Comments not getting loaded properly (by @br41nslug)
  - [#14769](https://github.com/directus/directus/pull/14769) Do not show inactive manual flows in flows sidebar (by
    @azrikahar)
  - [#14709](https://github.com/directus/directus/pull/14709) Input and textarea fields are always getting trimmed (by
    @br41nslug)
  - [#14695](https://github.com/directus/directus/pull/14695) Fix exported fields reactivity in export drawer (by
    @azrikahar)
  - [#14693](https://github.com/directus/directus/pull/14693) Fix fallback icon styling for interfaces (by @azrikahar)
  - [#14688](https://github.com/directus/directus/pull/14688) Fix files interface's drawer download button (by
    @azrikahar)
  - [#14685](https://github.com/directus/directus/pull/14685) Cast values to string when matching in v-select (by
    @licitdev)
  - [#14666](https://github.com/directus/directus/pull/14666) Fix Favicon when project color and logo are not set (by
    @nickrum)
  - [#14650](https://github.com/directus/directus/pull/14650) broken assets paths when serving Directus from a subfolder
    (by @br41nslug)
  - [#14648](https://github.com/directus/directus/pull/14648) Do not override current admin language when updating
    project default language (by @azrikahar)
  - [#14646](https://github.com/directus/directus/pull/14646) Reload image view when src is updated (by @licitdev)
  - [#14644](https://github.com/directus/directus/pull/14644) Fix render template height in card subtitle (by
    @rijkvanzanten)
  - [#14637](https://github.com/directus/directus/pull/14637) Fix list-group clickable; Fix navigation-item initial
    state (by @dimitrov-adrian)
  - [#14626](https://github.com/directus/directus/pull/14626) Fix calendar list view styling (by @azrikahar)
  - [#14618](https://github.com/directus/directus/pull/14618) Fix flatpickr global style (by @azrikahar)
  - [#14570](https://github.com/directus/directus/pull/14570) File Preview fixes (by @azrikahar)
- **specs**
  - [#14795](https://github.com/directus/directus/pull/14795) Fix typo for operation component in OAS (by @azrikahar)
- **Extensions**
  - [#14658](https://github.com/directus/directus/pull/14658) Fix building the extensions-sdk in dev mode (by @nickrum)

### :sponge: Optimizations

- **App**
  - [#14751](https://github.com/directus/directus/pull/14751) Make DrawerItem, DrawerBatch global components (by
    @j0hnfl0w)
  - [#14615](https://github.com/directus/directus/pull/14615) Fix revisions drawer detail ref type (by @azrikahar)
  - [#14580](https://github.com/directus/directus/pull/14580) Refactor unnecessary nested app folders (by
    @rijkvanzanten)
- **Misc.**
  - [#14728](https://github.com/directus/directus/pull/14728) Support running prod locally through ./api/cli.js (by
    @rijkvanzanten)

## v9.14.2 (July 21, 2022)

### :rocket: Improvements

- **App**
  - [#14541](https://github.com/directus/directus/pull/14541) Select multiple dropdown preview threshold (by
    @rijkvanzanten)
  - [#14412](https://github.com/directus/directus/pull/14412) Enable spellcheck on wysiwyg and markdown interfaces (by
    @licitdev)
  - [#14390](https://github.com/directus/directus/pull/14390) Fix strict relative dates showing "incorrect" (by
    @u12206050)
  - [#14021](https://github.com/directus/directus/pull/14021) Add raw editor toggle for using variables in flows
    operations (by @azrikahar)
  - [#10592](https://github.com/directus/directus/pull/10592) Optimize media loading across app (by @jaycammarano)
  - [#10488](https://github.com/directus/directus/pull/10488) Adding editor to image component (by @juancarlosjr97)
- **API**
  - [#14499](https://github.com/directus/directus/pull/14499) Enable extensions cache (by @claytongulick)
  - [#9400](https://github.com/directus/directus/pull/9400) Add "security" commands to api CLI (by @danilopolani)
- **Extensions**
  - [#14475](https://github.com/directus/directus/pull/14475) Improve extension create onboarding (by @u12206050)

### :bug: Bug Fixes

- **App**
  - [#14543](https://github.com/directus/directus/pull/14543) Fix map layout not rendering items on search (by
    @rijkvanzanten)
  - [#14542](https://github.com/directus/directus/pull/14542) Fix singleton navigation temporarily using wrong ID (by
    @rijkvanzanten)
  - [#14539](https://github.com/directus/directus/pull/14539) Don't render explicit null values in md custom blocks (by
    @rijkvanzanten)
  - [#14538](https://github.com/directus/directus/pull/14538) Add max height to folder picker (by @rijkvanzanten)
  - [#14537](https://github.com/directus/directus/pull/14537) Don't disable distinct count based on integer type (by
    @rijkvanzanten)
  - [#14536](https://github.com/directus/directus/pull/14536) Default auth provider to first configured one if default
    is disabled (by @rijkvanzanten)
  - [#14532](https://github.com/directus/directus/pull/14532) Skip disabled field check when using set-field-value event
    (by @rijkvanzanten)
  - [#14530](https://github.com/directus/directus/pull/14530) Fix M2A filter scope on select existing (by
    @rijkvanzanten)
  - [#14511](https://github.com/directus/directus/pull/14511) Fix the preview not being updated after editing the image
    (by @qborisb)
  - [#14488](https://github.com/directus/directus/pull/14488) Conditions not working (partially) (by @br41nslug)
  - [#14438](https://github.com/directus/directus/pull/14438) Prevent app crash on empty manual flow config (by
    @rijkvanzanten)
  - [#14404](https://github.com/directus/directus/pull/14404) Fix/wysiwyg context menu (by @licitdev)
  - [#14402](https://github.com/directus/directus/pull/14402) Insights: Fix query primary field for system tables (by
    @joselcvarela)
  - [#14396](https://github.com/directus/directus/pull/14396) Fix list panel descending sort (by @azrikahar)
  - [#14369](https://github.com/directus/directus/pull/14369) Fixes nested groups in accordions not rendering fields (by
    @br41nslug)
  - [#14358](https://github.com/directus/directus/pull/14358) Fix disabled state for markdown interface (by @azrikahar)
  - [#14355](https://github.com/directus/directus/pull/14355) Fix translation in render-template (by @u12206050)
  - [#14322](https://github.com/directus/directus/pull/14322) Prevent empty title attribute in WYSIWYG links (by
    @azrikahar)
  - [#14256](https://github.com/directus/directus/pull/14256) Fix field aliasing not returning null after merging
    documents (by @addisonElliott)
  - [#10592](https://github.com/directus/directus/pull/10592) Optimize media loading across app (by @jaycammarano)
- **API**
  - [#14540](https://github.com/directus/directus/pull/14540) Add missing \_between/\_nbetween filter operators to GQL
    (by @rijkvanzanten)
  - [#14520](https://github.com/directus/directus/pull/14520) Graphql: Do not try to convert Dates (considered an
    object) (by @joselcvarela)
  - [#14512](https://github.com/directus/directus/pull/14512) Disable foreign check on SQLite when deleting fields (by
    @licitdev)
  - [#14506](https://github.com/directus/directus/pull/14506) Fix apply snapshot for UUID primary keys (by @azrikahar)
  - [#14460](https://github.com/directus/directus/pull/14460) API/Graphql: Use same types as `count` for `countDistinct`
    (by @joselcvarela)
  - [#14423](https://github.com/directus/directus/pull/14423) Fix filter column aliasing (by @licitdev)
  - [#14418](https://github.com/directus/directus/pull/14418) Encoded the url using encodeURIComponent, so that the url
    gets sanitzed and so, we did not get 404 error. (by @zeel-pathak)
  - [#14416](https://github.com/directus/directus/pull/14416) fix generateJoi error due to empty permissions when
    creating new role (by @azrikahar)
  - [#14401](https://github.com/directus/directus/pull/14401) Don't use locales in generated camelCased values from env
    (by @rijkvanzanten)
  - [#14371](https://github.com/directus/directus/pull/14371) Add GraphQL query POST caching (by @rijkvanzanten)
  - [#13949](https://github.com/directus/directus/pull/13949) Fix: Error applying schemas with nested collection(s) (by
    @IanPirro)
  - [#13870](https://github.com/directus/directus/pull/13870) Process relational collection's permissions in functions
    (by @licitdev)
  - [#11462](https://github.com/directus/directus/pull/11462) Cache GraphQL POST queries (by @viters)

### :sponge: Optimizations

- **Misc.**
  - [#14555](https://github.com/directus/directus/pull/14555) Resolve lint warnings (by @rijkvanzanten)
  - [#14525](https://github.com/directus/directus/pull/14525) Cancel all previous workflows in the branch (by @licitdev)
  - [#14350](https://github.com/directus/directus/pull/14350) Move repo to `pnpm` based workflow (by @rijkvanzanten)
  - [#14335](https://github.com/directus/directus/pull/14335) Move external packages to separate repos (by
    @rijkvanzanten)
- **API**
  - [#13596](https://github.com/directus/directus/pull/13596) Generate joi merge (by @jaycammarano)

### :package: Dependency Updates

- [#14509](https://github.com/directus/directus/pull/14509) Update Knex version to fix CockroachDB relationships showing
  multiple times (by @christopher-kapic)
- [#14437](https://github.com/directus/directus/pull/14437) Update knex-schema-inspector to 2.0.3 (by @rijkvanzanten)

## v9.14.0 (July 7, 2022)

### :sparkles: New Features

- **API**
  - [#14203](https://github.com/directus/directus/pull/14203) Emitter emits event in the meta (by @licitdev)

### :rocket: Improvements

- **API**
  - :warning: [#14287](https://github.com/directus/directus/pull/14287) Terminate Directus if OpenID discovery fails (by
    @aidenfoxx)
  - [#14164](https://github.com/directus/directus/pull/14164) Add emitEvents flag to item reads in service (by
    @rijkvanzanten)
  - [#9191](https://github.com/directus/directus/pull/9191) Enable caching for App assets (by @nickrum)
- **shared**
  - [#14254](https://github.com/directus/directus/pull/14254) Fix type for defaults in useCollection composable (by
    @addisonElliott)
- **App**
  - [#14244](https://github.com/directus/directus/pull/14244) Don't show language select when there is only one language
    to choose from (by @janwillemvd)
  - [#14232](https://github.com/directus/directus/pull/14232) Use string displays on the calendar layout (by
    @rijkvanzanten)
  - [#14229](https://github.com/directus/directus/pull/14229) Hide user invite flow when default auth provider is
    disabled (by @rijkvanzanten)
  - [#14193](https://github.com/directus/directus/pull/14193) Use native api with access_token when defineing url as
    relative (by @u12206050)
  - [#14186](https://github.com/directus/directus/pull/14186) Tweaks for datetime display options (by @azrikahar)

### :bug: Bug Fixes

- **App**
  - [#14303](https://github.com/directus/directus/pull/14303) Prevents selecting relational fields as sort field (by
    @br41nslug)
  - [#14300](https://github.com/directus/directus/pull/14300) Fixes data missing after sort in m2a interface (by
    @br41nslug)
  - [#14252](https://github.com/directus/directus/pull/14252) Remove auto-open groups in v-select (by @azrikahar)
  - [#14251](https://github.com/directus/directus/pull/14251) Fix crash on logout due to `te` missing (by
    @addisonElliott)
  - [#14241](https://github.com/directus/directus/pull/14241) broken image display for null assets (by @br41nslug)
  - [#14234](https://github.com/directus/directus/pull/14234) Don't force reset scroll on hash changes (by
    @rijkvanzanten)
  - [#14233](https://github.com/directus/directus/pull/14233) Fix conditions crash when custom options component is used
    (by @rijkvanzanten)
  - [#14231](https://github.com/directus/directus/pull/14231) Fix vertical alignment of render-template in tabular (by
    @rijkvanzanten)
  - [#14227](https://github.com/directus/directus/pull/14227) Persist existing global variable values on save (by
    @azrikahar)
  - [#14216](https://github.com/directus/directus/pull/14216) Only emit value if updated for wysiwyg interface (by
    @licitdev)
  - [#14195](https://github.com/directus/directus/pull/14195) Fix rendering of social icons (by @licitdev)
  - [#14188](https://github.com/directus/directus/pull/14188) Performance improvements for groups within v-form (by
    @br41nslug)
  - [#13970](https://github.com/directus/directus/pull/13970) Fix Save As Copy with edited relational fields (by
    @younky-yang)
- **API**
  - [#14286](https://github.com/directus/directus/pull/14286) Fix filename charset for uploaded files (by @azrikahar)
  - [#14131](https://github.com/directus/directus/pull/14131) Fixes: No notification being created when sendmail fails.
    (by @jaycammarano)
  - [#14127](https://github.com/directus/directus/pull/14127) Check if a date string is valid ISO8601 before parsing it
    (by @br41nslug)
  - [#14057](https://github.com/directus/directus/pull/14057) CSV import converts numeric strings to numbers (by
    @br41nslug)

### :sponge: Optimizations

- **App**
  - [#14299](https://github.com/directus/directus/pull/14299) Remove invalid exported type in app (by @azrikahar)
  - [#14255](https://github.com/directus/directus/pull/14255) Fix duplicate logic for retrieving system collections in
    related-collection-select (by @addisonElliott)
- **Misc.**
  - [#14214](https://github.com/directus/directus/pull/14214) Fix vite error when pre-bundling docs package (by
    @azrikahar)

### :memo: Documentation

- [#14177](https://github.com/directus/directus/pull/14177) Add bootstrap step in manual installation (by @raflymln)

## v9.13.0 (June 28, 2022)

### :sparkles: New Features

- **API**
  - [#14096](https://github.com/directus/directus/pull/14096) Insights 2.0 (by @rijkvanzanten)
  - [#13924](https://github.com/directus/directus/pull/13924) API: Add env var to opt-out mailer setup verification (by
    @joselcvarela)
  - [#13907](https://github.com/directus/directus/pull/13907) Allow setting a custom filename in the /assets endpoint
    for SEO (by @rijkvanzanten)
  - [#13871](https://github.com/directus/directus/pull/13871) Add optional cache max value size limit configuration (by
    @rijkvanzanten)
- **App**
  - [#14096](https://github.com/directus/directus/pull/14096) Insights 2.0 (by @rijkvanzanten)
  - [#13867](https://github.com/directus/directus/pull/13867) Add search in v-select (by @azrikahar)
  - [#13576](https://github.com/directus/directus/pull/13576) Allow setting default language for translations interface
    or choosing user's language (by @u12206050)
  - [#7805](https://github.com/directus/directus/pull/7805) Add tfa enforce flow (by @Nitwel)

### :rocket: Improvements

- **App**
  - [#14154](https://github.com/directus/directus/pull/14154) Fix v-select search & selection of groups (by @azrikahar)
  - [#14090](https://github.com/directus/directus/pull/14090) Improve IDs field interaction for Flows item
    read/update/delete operations when empty (by @azrikahar)
  - [#14083](https://github.com/directus/directus/pull/14083) App Docs Module Improvements (by @azrikahar)
  - [#14065](https://github.com/directus/directus/pull/14065) Allow admin to import into system collections (by
    @azrikahar)
  - [#14064](https://github.com/directus/directus/pull/14064) Prevent filename overflow in import file field for
    Import/Export sidebar (by @azrikahar)
  - [#14041](https://github.com/directus/directus/pull/14041) Prevent hyphens in auto generated operation keys (by
    @azrikahar)
  - [#13996](https://github.com/directus/directus/pull/13996) Minor tweaks to some flow operations (by @azrikahar)
  - [#13940](https://github.com/directus/directus/pull/13940) invert color shades (by @benhaynes)
  - [#13934](https://github.com/directus/directus/pull/13934) Improve Flows drawer editing experience (by @azrikahar)
  - [#13929](https://github.com/directus/directus/pull/13929) Enable header resize for Insights & Flows overview (by
    @azrikahar)
  - :warning: [#13921](https://github.com/directus/directus/pull/13921) add `Emit Events` option to item update/delete
    operations in Flows (by @azrikahar)
- **API**
  - [#14094](https://github.com/directus/directus/pull/14094) Mark list result as non-nullable in GraphQL schema (by
    @licitdev)
  - [#14090](https://github.com/directus/directus/pull/14090) Improve IDs field interaction for Flows item
    read/update/delete operations when empty (by @azrikahar)
  - [#14080](https://github.com/directus/directus/pull/14080) Fix `undefined` values in filters for GraphQL (by
    @azrikahar)
  - [#14074](https://github.com/directus/directus/pull/14074) Make path argument optional for snapshot command (by
    @claytongulick)
  - :warning: [#14066](https://github.com/directus/directus/pull/14066) API: Return more error messages for OpenID and
    OAuth2 (by @joselcvarela)
  - [#14065](https://github.com/directus/directus/pull/14065) Allow admin to import into system collections (by
    @azrikahar)
  - :warning: [#13921](https://github.com/directus/directus/pull/13921) add `Emit Events` option to item update/delete
    operations in Flows (by @azrikahar)
  - [#13897](https://github.com/directus/directus/pull/13897) API: Ignore `returning` not supported messages (by
    @joselcvarela)
- **shared**
  - [#14001](https://github.com/directus/directus/pull/14001) Update get-filter-operators-for-type.ts (by @licitdev)

### :bug: Bug Fixes

- **API**
  - [#14163](https://github.com/directus/directus/pull/14163) Prevent webhooks from registering twice (by
    @rijkvanzanten)
  - [#14034](https://github.com/directus/directus/pull/14034) fix action event Flows for related tables (by @azrikahar)
  - [#14029](https://github.com/directus/directus/pull/14029) Commented out text in .env (by @jaycammarano)
  - [#13906](https://github.com/directus/directus/pull/13906) Dashboards: Add missing system `color` field (by
    @joselcvarela)
  - [#13900](https://github.com/directus/directus/pull/13900) Sanitize query for item read/update/delete operations in
    Flows (by @azrikahar)
  - [#13891](https://github.com/directus/directus/pull/13891) Fix date filter with null value on SQLite (by @licitdev)
  - [#13879](https://github.com/directus/directus/pull/13879) Add migration to rename `hook` triggers to `event` (by
    @azrikahar)
  - [#13575](https://github.com/directus/directus/pull/13575) Fix aliased DB table names in filter query (by @licitdev)
  - :warning: [#11845](https://github.com/directus/directus/pull/11845) Add depth limit to filtering (by @licitdev)
- **App**
  - [#14154](https://github.com/directus/directus/pull/14154) Fix v-select search & selection of groups (by @azrikahar)
  - [#14147](https://github.com/directus/directus/pull/14147) Fix relational fields for Download Page as CSV & relevant
    displays' handler improvements (by @azrikahar)
  - [#14124](https://github.com/directus/directus/pull/14124) Use conditional props for links in v-list-item (by
    @azrikahar)
  - [#14078](https://github.com/directus/directus/pull/14078) Fix M2O interface in junction tables (by @azrikahar)
  - [#14070](https://github.com/directus/directus/pull/14070) Fixed firefox opacity of placeholders issue (by
    @jaycammarano)
  - [#14043](https://github.com/directus/directus/pull/14043) Fix autocomplete field options not selectable (by
    @azrikahar)
  - [#14035](https://github.com/directus/directus/pull/14035) Major input delays on text fields in complex documents (by
    @br41nslug)
  - [#13998](https://github.com/directus/directus/pull/13998) Fix saving error with custom permissions in O2M fields (by
    @younky-yang)
  - [#13953](https://github.com/directus/directus/pull/13953) Fix in-app docs (by @azrikahar)
  - [#13952](https://github.com/directus/directus/pull/13952) batch edit toggle not rendered side-by-side (by
    @br41nslug)
  - [#13930](https://github.com/directus/directus/pull/13930) Prevent translations validation error matching parent (by
    @azrikahar)
  - [#13920](https://github.com/directus/directus/pull/13920) Translation Strings Improvements (by @azrikahar)
  - [#13905](https://github.com/directus/directus/pull/13905) Redirect to page not found for flows that do not exist (by
    @azrikahar)
  - [#13904](https://github.com/directus/directus/pull/13904) Big Integer fields sort as strings (by @br41nslug)
  - [#13890](https://github.com/directus/directus/pull/13890) Labels with v-chips are not rendered side-by-side (by
    @br41nslug)
  - [#13874](https://github.com/directus/directus/pull/13874) Fix insights panel configuration not persisting to tiles
    (by @rijkvanzanten)
  - [#13866](https://github.com/directus/directus/pull/13866) O2M relation does not display correctly (by @br41nslug)
  - [#13861](https://github.com/directus/directus/pull/13861) Use translate in render-display (by @azrikahar)
  - [#13846](https://github.com/directus/directus/pull/13846) Fix: Time Series panel crashes when setting a max value
    with no min value (by @jaycammarano)
  - [#13840](https://github.com/directus/directus/pull/13840) Use conditional props for component in v-button (by
    @azrikahar)
  - [#13830](https://github.com/directus/directus/pull/13830) use parsePreset in App side (by @azrikahar)
  - [#13829](https://github.com/directus/directus/pull/13829) Trigger focus event to ensure observable exists in WYSIWYG
    (by @licitdev)
  - [#13752](https://github.com/directus/directus/pull/13752) Checkbox Tree Field Expand/Collapse in Show Selected (by
    @br41nslug)
  - [#7805](https://github.com/directus/directus/pull/7805) Add tfa enforce flow (by @Nitwel)
- **specs**
  - [#14060](https://github.com/directus/directus/pull/14060) OAS does not contain all utility functions (by @br41nslug)

### :sponge: Optimizations

- **API**
  - [#13877](https://github.com/directus/directus/pull/13877) Prevent unknown knex methods from being used (by
    @rijkvanzanten)
  - [#13873](https://github.com/directus/directus/pull/13873) Added correct null parsing to Directus schemas (by
    @aidenfoxx)
- **Misc.**
  - [#13876](https://github.com/directus/directus/pull/13876) Upgrade codeql to v2 (by @rijkvanzanten)
  - [#13849](https://github.com/directus/directus/pull/13849) Fix linting for api/src/utils/get-local-type.ts (by
    @licitdev)
  - [#13824](https://github.com/directus/directus/pull/13824) Auto approve pull requests from Crowdin via label (by
    @paescuj)

### :memo: Documentation

- [#14101](https://github.com/directus/directus/pull/14101) Document insights updates (by @erondpowell)
- [#14067](https://github.com/directus/directus/pull/14067) Docs: Fix how to refresh token example on SSO example (by
  @joselcvarela)
- [#13995](https://github.com/directus/directus/pull/13995) fixes 404 links in docs (by @br41nslug)
- [#13976](https://github.com/directus/directus/pull/13976) Docs: fixed more links (by @erondpowell)
- [#13967](https://github.com/directus/directus/pull/13967) Docs: Fixed Resources Headers (by @erondpowell)
- [#13945](https://github.com/directus/directus/pull/13945) Docs config refactor (by @erondpowell)
- [#13919](https://github.com/directus/directus/pull/13919) Docs: Translation Strings (by @erondpowell)
- [#13908](https://github.com/directus/directus/pull/13908) Docs: Lori's Flows Edits (by @erondpowell)
- [#13903](https://github.com/directus/directus/pull/13903) Update flows.md - broken links (by @jkarelins)
- [#13893](https://github.com/directus/directus/pull/13893) Clarified DEFAULT_ROLE_ID for LDAP (by @aidenfoxx)
- [#13844](https://github.com/directus/directus/pull/13844) fixed links, tweaked text (by @erondpowell)
- [#12289](https://github.com/directus/directus/pull/12289) Cleanup of the plesk docs page to make it more streamlined
  (by @Slations)

### :package: Dependency Updates

- [#13878](https://github.com/directus/directus/pull/13878) Upgrade gluegun (by @rijkvanzanten)
- [#13876](https://github.com/directus/directus/pull/13876) Upgrade codeql to v2 (by @rijkvanzanten)
- [#13875](https://github.com/directus/directus/pull/13875) Upgrade busboy (by @rijkvanzanten)
- [#13845](https://github.com/directus/directus/pull/13845) Upgrade API & Schema dependencies (by @rijkvanzanten)

## v9.12.2 (June 9, 2022)

### :rocket: Improvements

- **Extensions**
  - [#13797](https://github.com/directus/directus/pull/13797) Use latest vue version when scaffolding extension packages
    (by @nickrum)
- **API**
  - [#13796](https://github.com/directus/directus/pull/13796) Use JobQueue when reloading extensions (by @nickrum)
  - [#12044](https://github.com/directus/directus/pull/12044) Enable activity tracking at password reset (by @ybelenko)
- **App**
  - [#13777](https://github.com/directus/directus/pull/13777) Allow selection of image transformation in the WYSIWYG
    interface (by @licitdev)
  - [#13772](https://github.com/directus/directus/pull/13772) Add configurable page-size to files/o2m/m2m/m2a interfaces
    (by @rijkvanzanten)
  - [#12804](https://github.com/directus/directus/pull/12804) Take into account the format option when displaying dates
    relative. (by @u12206050)

### :bug: Bug Fixes

- **App**
  - [#13821](https://github.com/directus/directus/pull/13821) Fix preset layouts not persisting. (by @jaycammarano)
  - [#13802](https://github.com/directus/directus/pull/13802) Emit input whenever WYSIWYG content is updated (by
    @licitdev)
  - [#13799](https://github.com/directus/directus/pull/13799) Make UUID/manual primary keys selectable with count in
    Time Series panels (by @azrikahar)
  - [#13789](https://github.com/directus/directus/pull/13789) Set count on fresh init of defered tinymce (by
    @rijkvanzanten)
  - [#13768](https://github.com/directus/directus/pull/13768) Fix filter error when switching between collections with
    map layout (by @azrikahar)
  - [#13757](https://github.com/directus/directus/pull/13757) header bar icon color: var(--primary) (by @jaycammarano)
  - [#13750](https://github.com/directus/directus/pull/13750) Searching the top level bug (by @br41nslug)
  - [#13701](https://github.com/directus/directus/pull/13701) Fix range to be based on current time (by @licitdev)
  - [#13574](https://github.com/directus/directus/pull/13574) fix nested array updates for relational interfaces (by
    @azrikahar)
  - [#13224](https://github.com/directus/directus/pull/13224) Fix clear value for relational interfaces (by @azrikahar)
  - [#13187](https://github.com/directus/directus/pull/13187) Show fields inside groups correctly in display templates
    for relational interfaces (by @br41nslug)
  - [#13141](https://github.com/directus/directus/pull/13141) Fix form field label responsiveness (by @azrikahar)
  - [#12759](https://github.com/directus/directus/pull/12759) Use aliases for relational fields (by @azrikahar)
- **API**
  - [#13783](https://github.com/directus/directus/pull/13783) Fix flow triggers being registered multiple times (by
    @nickrum)
  - [#13762](https://github.com/directus/directus/pull/13762) Flush caches after applying schema snapshot (by
    @rijkvanzanten)
  - [#13759](https://github.com/directus/directus/pull/13759) Fix formatting of headers in request operation (by
    @rijkvanzanten)
  - [#13754](https://github.com/directus/directus/pull/13754) Serve robots.txt from root (by @rijkvanzanten)
  - [#13751](https://github.com/directus/directus/pull/13751) Fix description field in directus_flows (by @azrikahar)
  - [#13701](https://github.com/directus/directus/pull/13701) Fix range to be based on current time (by @licitdev)
- **specs**
  - [#13776](https://github.com/directus/directus/pull/13776) Fixes OAS specs for Flows & Operations (by @azrikahar)

### :sponge: Optimizations

- **App**
  - [#13755](https://github.com/directus/directus/pull/13755) Fix various linter warnings, disable new rule (by
    @rijkvanzanten)
- **Misc.**
  - [#13714](https://github.com/directus/directus/pull/13714) disable thumbsmith update blocking the docs build (by
    @br41nslug)

### :memo: Documentation

- [#13794](https://github.com/directus/directus/pull/13794) tweaks done for today (by @erondpowell)
- [#13793](https://github.com/directus/directus/pull/13793) replaced replace a file video file (by @erondpowell)
- [#13692](https://github.com/directus/directus/pull/13692) Docs/Cloud: Add "Asia Pacific, Singapore" to regions (by
  @joselcvarela)
- [#13672](https://github.com/directus/directus/pull/13672) Docs: Fix one last link to installation (by @erondpowell)
- [#13358](https://github.com/directus/directus/pull/13358) Docs & Specs update for Data Flows (by @azrikahar)
- [#13258](https://github.com/directus/directus/pull/13258) Docs: getting-started > architecture (by @erondpowell)
- [#13246](https://github.com/directus/directus/pull/13246) Docs: Configuration > Data Flows (by @erondpowell)
- [#13122](https://github.com/directus/directus/pull/13122) Docs: getting-started > backing-directus (by @erondpowell)
- [#13055](https://github.com/directus/directus/pull/13055) Docs: getting-started > Introduction (by @erondpowell)

## v9.12.1 (June 3, 2022)

### :bug: Bug Fixes

- **App**
  - [#13724](https://github.com/directus/directus/pull/13724) Only render first 10000 items on calendar layout view (by
    @rijkvanzanten)
  - [#13723](https://github.com/directus/directus/pull/13723) Don't crash on misconfigured scope trigger (by
    @rijkvanzanten)
  - [#13713](https://github.com/directus/directus/pull/13713) Fix flows editing existing operations (by @rijkvanzanten)
  - [#13635](https://github.com/directus/directus/pull/13635) Add Locale labels to groups (by @azrikahar)
- **API**
  - [#13719](https://github.com/directus/directus/pull/13719) Fix installer missing package (by @rijkvanzanten)
  - [#13694](https://github.com/directus/directus/pull/13694) Fix export offset (by @licitdev)
- **Extensions**
  - [#13709](https://github.com/directus/directus/pull/13709) Fix endpoint extensions being registered under wrong route
    (by @nickrum)

## v9.12.0 (June 2, 2022)

### :sparkles: New Features

- **API**
  - [#12522](https://github.com/directus/directus/pull/12522) 🌊 Add Data Flows to Directus 🌊 (by @Nitwel)
- **App**
  - [#12522](https://github.com/directus/directus/pull/12522) 🌊 Add Data Flows to Directus 🌊 (by @Nitwel)
- **Misc.**
  - [#11186](https://github.com/directus/directus/pull/11186) Docs: Auto-generated "Link preview" thumbnails for all
    pages (by @loteoo)

### :rocket: Improvements

- **App**
  - [#13639](https://github.com/directus/directus/pull/13639) Translations: Make password reset notice clearer (by
    @joselcvarela)
  - [#13610](https://github.com/directus/directus/pull/13610) add collection and folder names to delete confirmation
    messages (by @sxsws)
  - :warning: [#13549](https://github.com/directus/directus/pull/13549) Add System token interface (by @azrikahar)
  - [#13540](https://github.com/directus/directus/pull/13540) Add copy button to user id on user info page (by @nickrum)
  - [#13389](https://github.com/directus/directus/pull/13389) Don't consider SIGN_OUT an SSO error (by @aidenfoxx)
  - [#13363](https://github.com/directus/directus/pull/13363) Improve translation for require_value_to_be_set (by
    @janwillemvd)
- **format-title**
  - [#13629](https://github.com/directus/directus/pull/13629) Remove BASIC acronym (by @azrikahar)
- **API**
  - :warning: [#13549](https://github.com/directus/directus/pull/13549) Add System token interface (by @azrikahar)
  - [#13352](https://github.com/directus/directus/pull/13352) Add comments to the .env file stub (by @sxsws)
  - [#12033](https://github.com/directus/directus/pull/12033) Add projectUrl to defaultTemplateData (by @ybelenko)
  - [#11141](https://github.com/directus/directus/pull/11141) Allow authentication using MSSQL
    azure-active-directory-service-principal-secret (by @erickjth)

### :bug: Bug Fixes

- **App**
  - [#13681](https://github.com/directus/directus/pull/13681) fix collection & folder delete dialog message (by
    @azrikahar)
  - [#13630](https://github.com/directus/directus/pull/13630) use v-if instead of v-show in v-detail component (by
    @azrikahar)
  - [#13563](https://github.com/directus/directus/pull/13563) Fix field conditions optionDefaults computed property (by
    @yassilah)
  - [#13532](https://github.com/directus/directus/pull/13532) Remove the paste value check on slug inputs (by
    @azrikahar)
- **API**
  - [#13660](https://github.com/directus/directus/pull/13660) Fix wrong source of meta info for notifications API (by
    @tenebrius)
  - [#13651](https://github.com/directus/directus/pull/13651) Add cross-instance messenger pubsub setup (by
    @rijkvanzanten)
  - [#13623](https://github.com/directus/directus/pull/13623) Field permissions and relational interfaces (by
    @br41nslug)
  - [#13539](https://github.com/directus/directus/pull/13539) Added missing "DB*SSL*\*\_FILE" to the "\_FILE" allow
    list. (by @br41nslug)
  - [#13527](https://github.com/directus/directus/pull/13527) Fix metadata for directus_folders (by @azrikahar)
- **Misc.**
  - [#13577](https://github.com/directus/directus/pull/13577) `last_page` type was `date` instead of `str` (by
    @louisgavalda)
- **specs**
  - [#13531](https://github.com/directus/directus/pull/13531) add `meta` to list responses for OAS (by @azrikahar)

### :sponge: Optimizations

- **Misc.**
  - [#13648](https://github.com/directus/directus/pull/13648) Use `pull_request_target` instead of `pull_request` for
    auto-project-assign (by @jaycammarano)
  - [#13633](https://github.com/directus/directus/pull/13633) Auto approve pull requests from Crowdin (by @paescuj)
  - [#13455](https://github.com/directus/directus/pull/13455) Remove workaround in release flow (by @nickrum)
  - [#13444](https://github.com/directus/directus/pull/13444) Remove npmrc files which prevent lockfile creation in
    workspaces (by @nickrum)
- **shared**
  - [#13594](https://github.com/directus/directus/pull/13594) Moved tests from the "shared" package into a single test
    folder (by @jaycammarano)

### :memo: Documentation

- [#13688](https://github.com/directus/directus/pull/13688) fixed typo (by @erondpowell)
- [#13656](https://github.com/directus/directus/pull/13656) removing remaining links to example.env (by @sxsws)
- [#13642](https://github.com/directus/directus/pull/13642) Quickstart fix (by @erondpowell)
- [#13601](https://github.com/directus/directus/pull/13601) Docs: fix wrong url paths for self-hosted installation
  guides (by @thammarith)
- [#13577](https://github.com/directus/directus/pull/13577) `last_page` type was `date` instead of `str` (by
  @louisgavalda)
- [#11186](https://github.com/directus/directus/pull/11186) Docs: Auto-generated "Link preview" thumbnails for all pages
  (by @loteoo)

## v9.11.1 (May 24, 2022)

### :rocket: Improvements

- **API**
  - [#13518](https://github.com/directus/directus/pull/13518) Don't require default connection params when using non
    default type (by @rijkvanzanten)
  - [#13514](https://github.com/directus/directus/pull/13514) Default `default-src` to `"self"` in CSP header (by
    @rijkvanzanten)
  - [#13492](https://github.com/directus/directus/pull/13492) Allow floats in number validation (by @rijkvanzanten)
  - [#13274](https://github.com/directus/directus/pull/13274) Environment variable with \_FILE suffix containing invalid
    path throws error on start (by @br41nslug)
- **App**
  - [#13511](https://github.com/directus/directus/pull/13511) Don't show regex on permissions configuration (by
    @rijkvanzanten)
  - [#13501](https://github.com/directus/directus/pull/13501) Add empty state for Translation Strings page (by
    @azrikahar)
  - [#13462](https://github.com/directus/directus/pull/13462) Improve dashboard saving experience (by @nickrum)

### :bug: Bug Fixes

- **API**
  - [#13497](https://github.com/directus/directus/pull/13497) Fix applyFilter (by @nickrum)
  - [#13453](https://github.com/directus/directus/pull/13453) Adds \_none and \_some operators (by @br41nslug)
  - [#13429](https://github.com/directus/directus/pull/13429) Add cast-timestamp field flag to system tables (by
    @licitdev)
  - [#13276](https://github.com/directus/directus/pull/13276) Validate type of items' primary keys (by @licitdev)
- **App**
  - [#13479](https://github.com/directus/directus/pull/13479) Allow selecting primary key when aggregating count in time
    series panel (by @azrikahar)
  - [#13474](https://github.com/directus/directus/pull/13474) Fix field conditions when null (by @azrikahar)

### :sponge: Optimizations

- **Misc.**
  - [#13523](https://github.com/directus/directus/pull/13523) Remove unnecessary ampersand from URLs in filter tests (by
    @nickrum)

### :memo: Documentation

- [#13494](https://github.com/directus/directus/pull/13494) Docs: Display Templates Page (by @erondpowell)
- [#13489](https://github.com/directus/directus/pull/13489) how to work with nested data (by @erondpowell)
- [#13486](https://github.com/directus/directus/pull/13486) docs: clarified data, schema, and permissions caching (by
  @erondpowell)
- [#13445](https://github.com/directus/directus/pull/13445) no composite key support warning added (by @erondpowell)
- [#13424](https://github.com/directus/directus/pull/13424) Docs: re-edited user-directory + users-roles-permissions (by
  @erondpowell)

## v9.11.0 (May 19, 2022)

### :sparkles: New Features

- **API**
  - [#11871](https://github.com/directus/directus/pull/11871) GraphQL count aggregation for all fields and \* (by
    @jeengbe)
  - [#11737](https://github.com/directus/directus/pull/11737) Add support to insensitive case operators (by
    @bernatvadell)
- **App**
  - [#11737](https://github.com/directus/directus/pull/11737) Add support to insensitive case operators (by
    @bernatvadell)

### :rocket: Improvements

- **API**
  - [#13309](https://github.com/directus/directus/pull/13309) Prevent changing active status of the only active admin
    user (by @azrikahar)
  - [#13184](https://github.com/directus/directus/pull/13184) Display error message on OAuth errors (by @aidenfoxx)
- **App**
  - [#13301](https://github.com/directus/directus/pull/13301) Allow creating big integer auto-incremented primary keys
    in MySQL and PostgreSQL (by @samdze)
  - [#13264](https://github.com/directus/directus/pull/13264) fix: AUTH_PROVIDER ibmid should display as IBMid (by
    @davidnixon)
  - [#13263](https://github.com/directus/directus/pull/13263) Add string-export support for related-values and
    translations display (by @rijkvanzanten)
  - [#13207](https://github.com/directus/directus/pull/13207) Show edit drawer as preview for disabled many to one (by
    @rijkvanzanten)
  - [#13126](https://github.com/directus/directus/pull/13126) Hide import if create is not allowed (by @ankitchhatbar)
  - [#13103](https://github.com/directus/directus/pull/13103) Show collection key instead of name in Data Model (by
    @azrikahar)
- **sdk**
  - [#13214](https://github.com/directus/directus/pull/13214) Improve type definitions for o2m item queries involving
    deep, filter or sort (by @wfoxall)

### :bug: Bug Fixes

- **API**
  - [#13410](https://github.com/directus/directus/pull/13410) Fix parsing of time and dates when filtering in SQLite (by
    @licitdev)
  - [#13388](https://github.com/directus/directus/pull/13388) Fix compareValue check for \_null and \_empty type of
    operators (by @licitdev)
  - [#13375](https://github.com/directus/directus/pull/13375) Fix user update going through status check even when the
    payload does not have `status` in it (by @azrikahar)
  - [#13307](https://github.com/directus/directus/pull/13307) Stalling Sqlite when using cascading foreign contraints
    (by @eikaramba)
  - [#13250](https://github.com/directus/directus/pull/13250) Fix inconsistent revisions after batch update (by
    @licitdev)
  - [#13222](https://github.com/directus/directus/pull/13222) Delete field only after foreign key constraints are
    removed (by @licitdev)
  - [#13186](https://github.com/directus/directus/pull/13186) Fix aliases (by @rijkvanzanten)
  - [#13115](https://github.com/directus/directus/pull/13115) Fix incorrect bindings in postgres dialect (by @LookinGit)
  - [#12907](https://github.com/directus/directus/pull/12907) Sort schema snapshot (by @diegoleme)
  - [#12198](https://github.com/directus/directus/pull/12198) Fix Invalid foreign key when applying schema snapshot (by
    @PeeraJ)
- **App**
  - [#13409](https://github.com/directus/directus/pull/13409) Hide Save as Copy when creating new item (by @azrikahar)
  - [#13316](https://github.com/directus/directus/pull/13316) Fix app docs collection & item page (by @azrikahar)
  - [#13272](https://github.com/directus/directus/pull/13272) Creating corresponding relational field for file fields
    throws errors (by @br41nslug)
  - [#13242](https://github.com/directus/directus/pull/13242) Init count of soft limit in wysiwyg on first render (by
    @rijkvanzanten)
  - [#13231](https://github.com/directus/directus/pull/13231) Prevent inputs in deeply nested groups being duplicated
    (by @br41nslug)
  - [#13223](https://github.com/directus/directus/pull/13223) Form fields in a group unable to reset to default or undo
    changes (by @br41nslug)
  - [#13220](https://github.com/directus/directus/pull/13220) Fix limit/filter/search reactivity for export sidebar (by
    @azrikahar)
  - [#13158](https://github.com/directus/directus/pull/13158) fixes nested groups filtering out its parents values (by
    @br41nslug)
  - [#13151](https://github.com/directus/directus/pull/13151) Fix relational interfaces creating instead of updating
    nested relational items (by @br41nslug)
  - [#13147](https://github.com/directus/directus/pull/13147) Fix WYSIWYG being disabled due to loading (by @azrikahar)
  - [#13133](https://github.com/directus/directus/pull/13133) fix sort field not updating in export sidebar (by
    @azrikahar)
  - [#13120](https://github.com/directus/directus/pull/13120) fixes saving interface option values for field conditions
    (by @br41nslug)
  - [#13112](https://github.com/directus/directus/pull/13112) Fix slug not turning pasted value with spaces to
    separators (by @azrikahar)
  - [#13108](https://github.com/directus/directus/pull/13108) fixes slider component error for value between accepted
    steps (by @br41nslug)
  - [#13102](https://github.com/directus/directus/pull/13102) Fix auto generated field keys not being reset (by
    @azrikahar)
- **sdk**
  - [#13189](https://github.com/directus/directus/pull/13189) Reset refresh promise after catch (by @rijkvanzanten)

### :sponge: Optimizations

- **API**
  - [#13191](https://github.com/directus/directus/pull/13191) Use JSON.parse wrapper function to prevent pollution
    attacks (by @rijkvanzanten)

### :memo: Documentation

- [#13367](https://github.com/directus/directus/pull/13367) Update hooks.md - Add `query` object to `items.read` filter
  meta documentation (by @Dominic-Marcelino)
- [#13333](https://github.com/directus/directus/pull/13333) replaced video (by @erondpowell)
- [#13327](https://github.com/directus/directus/pull/13327) improved clarity of logical operators explanation (by
  @erondpowell)
- [#13285](https://github.com/directus/directus/pull/13285) re-edited support doc (by @erondpowell)
- [#13270](https://github.com/directus/directus/pull/13270) Fix docs homepage sidebar (by @licitdev)

### :package: Dependency Updates

- [#13190](https://github.com/directus/directus/pull/13190) Update gatsby-\* subpackages in gatsby-source-directus (by
  @rijkvanzanten)

## v9.10.0 (May 3, 2022)

### :sparkles: New Features

- **App**
  - [#13099](https://github.com/directus/directus/pull/13099) Add local export capability (by @rijkvanzanten)
- **API**
  - [#13004](https://github.com/directus/directus/pull/13004) Allow configuring the HSTS header (by @rijkvanzanten)
  - [#12084](https://github.com/directus/directus/pull/12084) Add support to sort on a nested value (by @nodeworks)

### :rocket: Improvements

- **API**
  - [#13076](https://github.com/directus/directus/pull/13076) Use older Oracle optimizer for faster first execution (by
    @aidenfoxx)
  - [#13003](https://github.com/directus/directus/pull/13003) Allow disabling GraphQL introspection (by @rijkvanzanten)
  - [#8034](https://github.com/directus/directus/pull/8034) Store original error code in extensions (by @gkielwasser)
- **App**
  - [#13038](https://github.com/directus/directus/pull/13038) Use transition to fix user avatar tooltip (by @azrikahar)
- **sdk**
  - [#13008](https://github.com/directus/directus/pull/13008) Prevent SDK from returning meta property when not
    available (by @azrikahar)

### :bug: Bug Fixes

- **Misc.**
  - [#13073](https://github.com/directus/directus/pull/13073) collections broken link fix (by @dcheglakov)
  - [#13015](https://github.com/directus/directus/pull/13015) Fix graphql schema for m2o fields without permissions to
    related collection (by @azrikahar)
- **API**
  - [#13067](https://github.com/directus/directus/pull/13067) Convert OAuth identifier to string before calling
    toLowerCase (by @tenebrius)
  - [#12993](https://github.com/directus/directus/pull/12993) Support BOM in CSV import (by @rijkvanzanten)
  - [#10106](https://github.com/directus/directus/pull/10106) Ensure all fields are available for conditions/validation
    on Save (by @t7tran)
- **App**
  - [#13021](https://github.com/directus/directus/pull/13021) Fix translations interface when using a single language
    (by @rijkvanzanten)
  - [#13014](https://github.com/directus/directus/pull/13014) Allow selecting foreign key fields in relationship setup
    (by @rijkvanzanten)
  - [#13012](https://github.com/directus/directus/pull/13012) Fix default display template lookup in m2o interface (by
    @rijkvanzanten)
  - [#13011](https://github.com/directus/directus/pull/13011) Fix translations error when finding item (by @azrikahar)
  - [#12995](https://github.com/directus/directus/pull/12995) Correctly default to + in singleton primary key (by
    @rijkvanzanten)
  - [#12968](https://github.com/directus/directus/pull/12968) Fix signin info text in dark mode (by @LasseRosenow)
- **sdk**
  - [#13007](https://github.com/directus/directus/pull/13007) Prevent token refreshing when using auth.static() method
    (by @azrikahar)

### :sponge: Optimizations

- **Misc.**
  - [#13091](https://github.com/directus/directus/pull/13091) spelling: extensionentrypoints (by @jsoref)
- **API**
  - [#13051](https://github.com/directus/directus/pull/13051) Update knex to version 2.0.0 (by @nickrum)

### :memo: Documentation

- [#13073](https://github.com/directus/directus/pull/13073) collections broken link fix (by @dcheglakov)
- [#13037](https://github.com/directus/directus/pull/13037) Fix naming & typo in CLI docs (by @azrikahar)
- [#13000](https://github.com/directus/directus/pull/13000) Clarified auth docs (by @aidenfoxx)
- [#12999](https://github.com/directus/directus/pull/12999) added tip to exlpain how to formate custom range (by
  @erondpowell)

## v9.9.1 (April 22, 2022)

### :rocket: Improvements

- **App**
  - [#12947](https://github.com/directus/directus/pull/12947) Add extensions to fix mp4 file icons (by @azrikahar)
  - [#12936](https://github.com/directus/directus/pull/12936) Only watch for wysiwyg changes on first interaction (by
    @rijkvanzanten)
  - [#12929](https://github.com/directus/directus/pull/12929) Show minutes by default in Calendar month layout (by
    @azrikahar)
  - [#12869](https://github.com/directus/directus/pull/12869) Input translated string improvements (by @azrikahar)
  - [#12865](https://github.com/directus/directus/pull/12865) Improve app loading background (by @LasseRosenow)
  - [#12822](https://github.com/directus/directus/pull/12822) Tweak default sizing of roles, enable resize (by
    @rijkvanzanten)
  - [#11946](https://github.com/directus/directus/pull/11946) Emoji Picker & Comment improvements (by @Nitwel)
- **API**
  - [#12839](https://github.com/directus/directus/pull/12839) Don't save directus_revisions row for empty delta (by
    @rijkvanzanten)
  - [#12835](https://github.com/directus/directus/pull/12835) Support jsonb in count() (by @rijkvanzanten)

### :bug: Bug Fixes

- **App**
  - [#12957](https://github.com/directus/directus/pull/12957) Check for valid date when parsing end date for Calendar
    layout (by @azrikahar)
  - [#12951](https://github.com/directus/directus/pull/12951) Prevent pasting non slug or db safe characters (by
    @azrikahar)
  - [#12950](https://github.com/directus/directus/pull/12950) Fix color-scheme for light theme (by @azrikahar)
  - [#12933](https://github.com/directus/directus/pull/12933) Fix validation check on item update (by @rijkvanzanten)
  - [#12919](https://github.com/directus/directus/pull/12919) Add missing import for color package (by @azrikahar)
  - [#12917](https://github.com/directus/directus/pull/12917) Fix apply function not working properly when only passing
    collection prop (by @azrikahar)
  - [#12916](https://github.com/directus/directus/pull/12916) Translate validation message in validation errors (by
    @azrikahar)
  - [#12904](https://github.com/directus/directus/pull/12904) Prevent passing empty string as json field default value
    when null (by @azrikahar)
  - [#12880](https://github.com/directus/directus/pull/12880) Fix unsetting fields in batch mode (by @azrikahar)
  - [#12872](https://github.com/directus/directus/pull/12872) Refresh datetime display value every minute for relative
    format (by @azrikahar)
  - [#12864](https://github.com/directus/directus/pull/12864) Removed trailing comma from barchart name translations (by
    @jaycammarano)
  - [#12840](https://github.com/directus/directus/pull/12840) Fix related primary key lookup in list-m2m (by
    @rijkvanzanten)
  - [#12834](https://github.com/directus/directus/pull/12834) Fix width detection when using mixed hidden fields (by
    @rijkvanzanten)
  - [#12832](https://github.com/directus/directus/pull/12832) Fix update fetchedItems on every param change (by @Nitwel)
  - [#12821](https://github.com/directus/directus/pull/12821) Fix uploading new files not working (by @Nitwel)
  - [#12800](https://github.com/directus/directus/pull/12800) Show pagination on readonly (by @Nitwel)
  - [#12797](https://github.com/directus/directus/pull/12797) Prevent stale filter value when switching between maps (by
    @azrikahar)
- **sdk**
  - [#12955](https://github.com/directus/directus/pull/12955) Remove underscore prefix for deep aggregate operations (by
    @azrikahar)
- **API**
  - [#12952](https://github.com/directus/directus/pull/12952) Fix API response for non existent fields & collections (by
    @azrikahar)
  - [#12949](https://github.com/directus/directus/pull/12949) Prevent relational fields without permissions from
    appearing in GraphQL schema (by @azrikahar)
  - [#12922](https://github.com/directus/directus/pull/12922) Fix readSingleItems response from array to object (by
    @azrikahar)
  - [#12900](https://github.com/directus/directus/pull/12900) Give config file higher priority than existing env (by
    @rijkvanzanten)
  - [#12860](https://github.com/directus/directus/pull/12860) Ignore non-alias fields that only exist in directus_fields
    (by @rijkvanzanten)
  - [#12852](https://github.com/directus/directus/pull/12852) Only set field default value when available for singleton
    collections (by @azrikahar)
  - [#12849](https://github.com/directus/directus/pull/12849) Fix directus_user mutation with role (by @azrikahar)
  - [#12833](https://github.com/directus/directus/pull/12833) Scope not null in subquery (by @rijkvanzanten)
  - [#12826](https://github.com/directus/directus/pull/12826) Fix alias (by @azrikahar)
  - [#12824](https://github.com/directus/directus/pull/12824) Fix casting of duplication fields (by @rijkvanzanten)
  - [#12785](https://github.com/directus/directus/pull/12785) Throw 400 on file upload with missing filename (by
    @rijkvanzanten)
- **specs**
  - [#12922](https://github.com/directus/directus/pull/12922) Fix readSingleItems response from array to object (by
    @azrikahar)

### :sponge: Optimizations

- **Misc.**
  - [#12934](https://github.com/directus/directus/pull/12934) Deprecate use of faker (by @rijkvanzanten)
- **App**
  - [#12825](https://github.com/directus/directus/pull/12825) Move more utils to shared (by @jaycammarano)

### :memo: Documentation

- [#12948](https://github.com/directus/directus/pull/12948) Add alwaysdata to one-click installs (by @nferrari)
- [#12938](https://github.com/directus/directus/pull/12938) fixed tip issue (by @erondpowell)

### :package: Dependency Updates

- [#12934](https://github.com/directus/directus/pull/12934) Deprecate use of faker (by @rijkvanzanten)

## v9.9.0 (April 15, 2022)

### :sparkles: New Features

- **API**
  - [#12732](https://github.com/directus/directus/pull/12732) Adds x-directus-cache response header with HIT value (by
    @keesvanbemmel)
- **App**
  - [#12687](https://github.com/directus/directus/pull/12687) Add support for translatable bookmark names (by
    @rijkvanzanten)
  - [#12082](https://github.com/directus/directus/pull/12082) Relational Interfaces Rework 🐰🕳️ (by @Nitwel)
  - [#11620](https://github.com/directus/directus/pull/11620) :sparkles: adding possibility to update another field
    value from a custom interface (by @AntoineBarroux)
- **sdk**
  - [#12575](https://github.com/directus/directus/pull/12575) Add `import` file method to SDK (by @azrikahar)

### :rocket: Improvements

- **App**
  - [#12780](https://github.com/directus/directus/pull/12780) Insights translations (by @jaycammarano)
  - [#12743](https://github.com/directus/directus/pull/12743) Hide DB only tables from default nav (by @rijkvanzanten)
  - [#12742](https://github.com/directus/directus/pull/12742) Render full field path in system fields interface (by
    @rijkvanzanten)
  - [#12706](https://github.com/directus/directus/pull/12706) Add copy button to role ID in role permissions page's
    sidebar detail (by @azrikahar)
  - [#12704](https://github.com/directus/directus/pull/12704) Sticky permissions overview header (by @azrikahar)
  - [#12689](https://github.com/directus/directus/pull/12689) Re-style file detail preview + replace interaction (by
    @rijkvanzanten)
  - [#12613](https://github.com/directus/directus/pull/12613) Add first day of the week option to calendar layout (by
    @azrikahar)
  - [#12598](https://github.com/directus/directus/pull/12598) Default filter operator to `eq` for field with choices (by
    @azrikahar)
  - [#12597](https://github.com/directus/directus/pull/12597) Prevent boolean as string for filter value when switching
    from null/empty operators (by @azrikahar)
  - [#12596](https://github.com/directus/directus/pull/12596) Add autofocus prop to input translated string (by
    @azrikahar)
  - [#12541](https://github.com/directus/directus/pull/12541) When no header icon is chosen use the panel types's icon
    for the default header icon rather than hardcoding "insert_chart" (by @jaycammarano)
  - [#12539](https://github.com/directus/directus/pull/12539) Disable fields that are groups to be selected in field
    list (by @u12206050)
- **API**
  - [#12767](https://github.com/directus/directus/pull/12767) Added default role support to LDAP and allow optional role
    syncing (by @aidenfoxx)
  - [#12684](https://github.com/directus/directus/pull/12684) Fix count support in GQL schema (by @rijkvanzanten)
  - [#12670](https://github.com/directus/directus/pull/12670) add citext as a supported local type (by @azrikahar)
  - [#12511](https://github.com/directus/directus/pull/12511) Safe Metadata Upload (by @wrynegade)
  - [#12457](https://github.com/directus/directus/pull/12457) Flatten oauth user profile so we can use sub-values (by
    @aidenfoxx)
  - :warning: [#12281](https://github.com/directus/directus/pull/12281) Return 401 status code for expired tokens (by
    @azrikahar)
  - [#12231](https://github.com/directus/directus/pull/12231) add `Last-Modified` header to `/assets/*` responses (by
    @molszanski)
- **sdk**
  - [#12649](https://github.com/directus/directus/pull/12649) Await when token is refreshing & reinstate
    `msRefreshBeforeExpires` flag (by @lubrst)
- **Docker**
  - [#12547](https://github.com/directus/directus/pull/12547) docker - disable npm update warnings (by @adminradio)

### :bug: Bug Fixes

- **App**
  - [#12744](https://github.com/directus/directus/pull/12744) Fix icon alignment in db-only tables (by @rijkvanzanten)
  - [#12741](https://github.com/directus/directus/pull/12741) Fix inline rendering of rating display (by @rijkvanzanten)
  - [#12715](https://github.com/directus/directus/pull/12715) Fix updating of exported fields for table layout (by
    @azrikahar)
  - [#12703](https://github.com/directus/directus/pull/12703) Fix primitive values for JSON code input (by @azrikahar)
  - [#12697](https://github.com/directus/directus/pull/12697) Reset existing image error after replacing it (by
    @azrikahar)
  - [#12692](https://github.com/directus/directus/pull/12692) Don't crash on non-image files in image interface (by
    @rijkvanzanten)
  - [#12690](https://github.com/directus/directus/pull/12690) Fix inline overflow of formatted value display in cards
    layout (by @rijkvanzanten)
  - [#12630](https://github.com/directus/directus/pull/12630) Fix M2A editing of new but unsaved items (by @azrikahar)
  - [#12629](https://github.com/directus/directus/pull/12629) fix M2M and M2A drawer item validation (by @azrikahar)
  - [#12611](https://github.com/directus/directus/pull/12611) Check create & update permissions for M2O field (by
    @azrikahar)
  - [#12608](https://github.com/directus/directus/pull/12608) Fix export sidebar without read permission for primary key
    (by @licitdev)
  - [#12601](https://github.com/directus/directus/pull/12601) Set system-language includeProjectDefault prop's default
    value to false (by @azrikahar)
  - [#12592](https://github.com/directus/directus/pull/12592) Allow adding items to the repeater interface if the
    (default) value is no array (by @HCl-not-HCi)
  - [#12582](https://github.com/directus/directus/pull/12582) Fix batch editing for fields in groups (by @azrikahar)
  - [#12553](https://github.com/directus/directus/pull/12553) Fix field names in groups for validation errors (by
    @azrikahar)
  - [#12052](https://github.com/directus/directus/pull/12052) Fix expressions/functions as default values for datetime
    field (by @azrikahar)
  - [#12045](https://github.com/directus/directus/pull/12045) Display fullscreen rich text input below dialog (by
    @programmarchy)
  - [#11437](https://github.com/directus/directus/pull/11437) Fix not being able to close groups (by @Nitwel)
- **API**
  - [#12739](https://github.com/directus/directus/pull/12739) Split filter key to get m2a nested collection name (by
    @licitdev)
  - [#12727](https://github.com/directus/directus/pull/12727) Added "json" to acceptedEnvTypes (by @aidenfoxx)
  - [#12723](https://github.com/directus/directus/pull/12723) Fix schema apply of UUIDs from SQLite onto other databases
    (by @azrikahar)
  - [#12716](https://github.com/directus/directus/pull/12716) Fix schema apply for CURRENT_TIMESTAMP default value (by
    @azrikahar)
  - [#12688](https://github.com/directus/directus/pull/12688) Return BigIntegers as Strings in GraphQL (by
    @rijkvanzanten)
  - [#12685](https://github.com/directus/directus/pull/12685) Only add update_me permissions for logged in users (by
    @rijkvanzanten)
  - [#12682](https://github.com/directus/directus/pull/12682) Throw payload error when using file upload without
    providing a file (by @rijkvanzanten)
  - [#12666](https://github.com/directus/directus/pull/12666) Cast to number for joi between (by @licitdev)
  - [#12615](https://github.com/directus/directus/pull/12615) Merge permission's validation only when not empty (by
    @licitdev)
  - [#12607](https://github.com/directus/directus/pull/12607) Fix access to count(\*) aggregation (by @licitdev)
  - [#12579](https://github.com/directus/directus/pull/12579) Fix snapshot output (by @azrikahar)
  - [#12549](https://github.com/directus/directus/pull/12549) Add permissions check for relational field only if child
    has filter (by @licitdev)
  - [#12532](https://github.com/directus/directus/pull/12532) Always try to rebind on healthcheck error (by @aidenfoxx)
  - :warning: [#10956](https://github.com/directus/directus/pull/10956) Remove UTC conversion from date, time and
    datetime fields (by @licitdev)
- **sdk**
  - [#12632](https://github.com/directus/directus/pull/12632) add missing query parameters in SDK (by @azrikahar)
  - [#12595](https://github.com/directus/directus/pull/12595) Prevent empty string as id in SDK (by @azrikahar)

### :memo: Documentation

- [#12576](https://github.com/directus/directus/pull/12576) Add `count` function in docs (by @azrikahar)
- [#12558](https://github.com/directus/directus/pull/12558) Adds one click deploy with koyeb. (by @PatelN123)
- [#11827](https://github.com/directus/directus/pull/11827) Docs: Add Cloud Section (by @erondpowell)
- [#11579](https://github.com/directus/directus/pull/11579) Docs: Data Sharing (by @erondpowell)

### :package: Dependency Updates

- [#12609](https://github.com/directus/directus/pull/12609) Upgrade sharp (by @rijkvanzanten)

## v9.8.0 (April 1, 2022)

### :sparkles: New Features

- **sdk**
  - [#12503](https://github.com/directus/directus/pull/12503) [SDK] Add further request options to `items` functions (by
    @tschortsch)
- **API**
  - [#12488](https://github.com/directus/directus/pull/12488) Add functions support to the app + add `count` function
    (by @rijkvanzanten)
  - [#12363](https://github.com/directus/directus/pull/12363) Add field-level validation (by @rijkvanzanten)
- **App**
  - [#12488](https://github.com/directus/directus/pull/12488) Add functions support to the app + add `count` function
    (by @rijkvanzanten)
  - [#12363](https://github.com/directus/directus/pull/12363) Add field-level validation (by @rijkvanzanten)
  - [#8196](https://github.com/directus/directus/pull/8196) Added default locale before login (by @christianrr)

### :rocket: Improvements

- **App**
  - [#12485](https://github.com/directus/directus/pull/12485) Updated styling on Time Series tooltips to accommodate
    dark theme. (by @jaycammarano)
  - [#12465](https://github.com/directus/directus/pull/12465) Prevent password managers from triggering on input-hash
    fields (by @nickrum)
  - [#12402](https://github.com/directus/directus/pull/12402) Allow configuring filters on preset detail page (by
    @rijkvanzanten)
  - [#12354](https://github.com/directus/directus/pull/12354) fix: translate formatted value when setting translation
    key (by @yassilah)
  - [#12031](https://github.com/directus/directus/pull/12031) Bookmark improvements (by @azrikahar)
  - [#10978](https://github.com/directus/directus/pull/10978) App / Presets: Use layout-wrapper to list presets (by
    @joselcvarela)
- **API**
  - [#12400](https://github.com/directus/directus/pull/12400) Improve cache reliability in DDL operations (by
    @rijkvanzanten)
  - [#12344](https://github.com/directus/directus/pull/12344) refactor: replace deprecated String.prototype.substr() (by
    @CommanderRoot)

### :bug: Bug Fixes

- **API**
  - [#12514](https://github.com/directus/directus/pull/12514) Cast input data for filters (by @azrikahar)
  - [#12482](https://github.com/directus/directus/pull/12482) Fix field validation not being cast as json (by
    @azrikahar)
  - [#12426](https://github.com/directus/directus/pull/12426) Fix filter permissions for relational fields (by
    @licitdev)
  - [#12394](https://github.com/directus/directus/pull/12394) Use Url util to construct urls everywhere (by
    @rijkvanzanten)
  - [#12385](https://github.com/directus/directus/pull/12385) Fix deep \_limit -1 not resolving all items (by
    @rijkvanzanten)
  - [#12372](https://github.com/directus/directus/pull/12372) Fix typecast migration array (by @licitdev)
  - [#12370](https://github.com/directus/directus/pull/12370) Fix csv values from env variables in telemetry (by
    @azrikahar)
  - [#12351](https://github.com/directus/directus/pull/12351) Fix activity fields using invalid display (by @azrikahar)
  - [#12349](https://github.com/directus/directus/pull/12349) fix: cast translation strings as json (by @yassilah)
  - [#12342](https://github.com/directus/directus/pull/12342) fix LOGGER_LEVELS array being split as string (by
    @azrikahar)
  - [#12187](https://github.com/directus/directus/pull/12187) fix: handle nulls when processing m2m (by @sjones6)
- **App**
  - [#12480](https://github.com/directus/directus/pull/12480) Allow primary key to be propagated upstream (by
    @RegisHubelia)
  - [#12467](https://github.com/directus/directus/pull/12467) Fix field validations showing filter interface with all
    fields (by @nickrum)
  - [#12464](https://github.com/directus/directus/pull/12464) Fix v-form overwriting type of input-hash interface (by
    @nickrum)
  - [#12463](https://github.com/directus/directus/pull/12463) Prevent selecting foreign keys for junction sort (by
    @azrikahar)
  - [#12461](https://github.com/directus/directus/pull/12461) Fix translations junction field not using language table
    name (by @azrikahar)
  - [#12446](https://github.com/directus/directus/pull/12446) Fix geometry fields raw value edits (by @azrikahar)
  - [#12445](https://github.com/directus/directus/pull/12445) fix color interface showing black color when empty (by
    @azrikahar)
  - [#12391](https://github.com/directus/directus/pull/12391) Fix default value for stars display (by @rijkvanzanten)
  - [#12371](https://github.com/directus/directus/pull/12371) Fix action for updateAllowed in M2M usePermissions (by
    @azrikahar)
  - [#12353](https://github.com/directus/directus/pull/12353) Fix translation drawer delete button hover style (by
    @azrikahar)
  - [#12320](https://github.com/directus/directus/pull/12320) Update system-filter interface to use v-field-list (by
    @azrikahar)
- **sdk**
  - [#12399](https://github.com/directus/directus/pull/12399) Use date (epoch) compare workflow instead of timer to
    refresh token in SDK (by @krazyjakee)

### :sponge: Optimizations

- **App**
  - [#12468](https://github.com/directus/directus/pull/12468) Fix prop type check issue in filter interface (by
    @nickrum)

### :memo: Documentation

- [#12410](https://github.com/directus/directus/pull/12410) docs homepage clarifications and tweaks (by @benhaynes)
- [#12362](https://github.com/directus/directus/pull/12362) Docs dark mode (by @benhaynes)
- [#12341](https://github.com/directus/directus/pull/12341) Docs: Slightly better scrollbars in dark mode (by @loteoo)

## v9.7.1 (March 23, 2022)

### :rocket: Improvements

- **App**
  - [#12170](https://github.com/directus/directus/pull/12170) Add App Translation Strings in Settings (by @azrikahar)
  - [#12324](https://github.com/directus/directus/pull/12324) Add shortcut from data model to collection content (by
    @Tummerhore)
  - [#12310](https://github.com/directus/directus/pull/12310) Save last accessed collection in Content Module (by
    @azrikahar)
  - [#12276](https://github.com/directus/directus/pull/12276) Fix field preview background color (by @azrikahar)
- **API**
  - [#12141](https://github.com/directus/directus/pull/12141) Prefix existing field typecasting flags with "cast-" (by
    @licitdev)

### :bug: Bug Fixes

- **API**
  - [#12330](https://github.com/directus/directus/pull/12330) Fix auto-casting of array like values in env (by
    @rijkvanzanten)
  - [#12328](https://github.com/directus/directus/pull/12328) Fix inconsistent delete action payload (by @rijkvanzanten)
  - [#12190](https://github.com/directus/directus/pull/12190) Add query filter validation with permissions (by
    @licitdev)
  - [#12130](https://github.com/directus/directus/pull/12130) Fix incorrect order of migrations when reverting (by
    @licitdev)
- **App**
  - [#12316](https://github.com/directus/directus/pull/12316) Disable dashboard/panel actions based on permissions (by
    @azrikahar)
  - [#12312](https://github.com/directus/directus/pull/12312) Prevent M2M item edits without permission via app (by
    @azrikahar)
  - [#12302](https://github.com/directus/directus/pull/12302) Handle array vs string based sorting in export (by
    @rijkvanzanten)
  - [#12284](https://github.com/directus/directus/pull/12284) Fix groups in v-field-template (by @rijkvanzanten)
  - [#12280](https://github.com/directus/directus/pull/12280) Fix start setting of detail group (by @rijkvanzanten)
  - [#12279](https://github.com/directus/directus/pull/12279) Fix color translation keys (by @rijkvanzanten)
  - [#12277](https://github.com/directus/directus/pull/12277) Add fields to directus_user app recommended permission (by
    @licitdev)
  - [#12274](https://github.com/directus/directus/pull/12274) fix export sidebar's collection not updating (by
    @azrikahar)
  - [#12260](https://github.com/directus/directus/pull/12260) Fix being able to export a relational field that is within
    a group (by @u12206050)
  - [#11836](https://github.com/directus/directus/pull/11836) Prevent errors when using string filters with empty values
    (by @licitdev)
- **shared**
  - [#11836](https://github.com/directus/directus/pull/11836) Prevent errors when using string filters with empty values
    (by @licitdev)

## v9.7.0 (March 18, 2022)

### :sparkles: New Features

- **API**
  - [#12201](https://github.com/directus/directus/pull/12201) Add new export experience (by @rijkvanzanten)
  - [#12088](https://github.com/directus/directus/pull/12088) Allow configuring overrides for the openid-client (by
    @rijkvanzanten)
  - [#12025](https://github.com/directus/directus/pull/12025) Add support for import ip deny list (by @rijkvanzanten)
  - [#12006](https://github.com/directus/directus/pull/12006) add --dry-run flag to `schema apply` CLI command (by
    @sjones6)
- **App**
  - [#12201](https://github.com/directus/directus/pull/12201) Add new export experience (by @rijkvanzanten)
  - [#12154](https://github.com/directus/directus/pull/12154) Upgrade table layout (by @rijkvanzanten)

### :rocket: Improvements

- **App**
  - [#12229](https://github.com/directus/directus/pull/12229) Style updates (by @benhaynes)
  - [#12223](https://github.com/directus/directus/pull/12223) Tweak tags placeholder for clarity (by @azrikahar)
  - [#12220](https://github.com/directus/directus/pull/12220) Add direct download option to files interface (by
    @rijkvanzanten)
  - [#12157](https://github.com/directus/directus/pull/12157) Group groups in field select, add search when number of
    fields exceeds 20 (by @rijkvanzanten)
  - [#12085](https://github.com/directus/directus/pull/12085) Add Croatian to available-languages.yaml (by @nrozic)
  - [#12050](https://github.com/directus/directus/pull/12050) Hide nav resize handle when it is not open (by @azrikahar)
  - [#12048](https://github.com/directus/directus/pull/12048) Add Edit Role context menu in User Directory (by
    @azrikahar)
  - [#12001](https://github.com/directus/directus/pull/12001) Form error validation improvements (by @azrikahar)
- **API**
  - [#12020](https://github.com/directus/directus/pull/12020) Allow configuring /assets endpoint CSP separately (by
    @rijkvanzanten)

### :bug: Bug Fixes

- **API**
  - [#12235](https://github.com/directus/directus/pull/12235) Fix nested relational limit for m2o fetching (by
    @rijkvanzanten)
  - [#12216](https://github.com/directus/directus/pull/12216) Improvements to WYSIWYG interface (by @licitdev)
  - [#12208](https://github.com/directus/directus/pull/12208) Export authorization service (by @licitdev)
  - [#12193](https://github.com/directus/directus/pull/12193) add cdn domain in CSP directives for in app docs (by
    @azrikahar)
  - [#12087](https://github.com/directus/directus/pull/12087) Make sure mysql error extraction won't error on slice (by
    @rijkvanzanten)
  - [#12076](https://github.com/directus/directus/pull/12076) Fix deep relational offset (by @licitdev)
  - [#12017](https://github.com/directus/directus/pull/12017) Add lock for system cache (by @licitdev)
  - [#12011](https://github.com/directus/directus/pull/12011) Fix query limit -1 for o2m queries (by @azrikahar)
  - [#11538](https://github.com/directus/directus/pull/11538) fix M2O field deletion (by @azrikahar)
- **App**
  - [#12222](https://github.com/directus/directus/pull/12222) fix number input step up/down when undefined (by
    @azrikahar)
  - [#12218](https://github.com/directus/directus/pull/12218) Fix WYSIWYG link keyboard shortcut and add parent anchor
    tag detection (by @licitdev)
  - [#12192](https://github.com/directus/directus/pull/12192) use type json for select-color presets options field (by
    @azrikahar)
  - [#12169](https://github.com/directus/directus/pull/12169) M2A interface collection name layout fix (by @d1rOn)
  - [#12162](https://github.com/directus/directus/pull/12162) Prevent null field/collection translations from being
    merged (by @azrikahar)
  - [#12153](https://github.com/directus/directus/pull/12153) fix: display related translations (by @yassilah)
  - [#12060](https://github.com/directus/directus/pull/12060) Fix cropper aspect ratio not activating crop (by
    @licitdev)
  - [#12047](https://github.com/directus/directus/pull/12047) Fix user info sidebar last access timestamp (by
    @azrikahar)
  - [#12037](https://github.com/directus/directus/pull/12037) Close WYSIWYG fullscreen when opening drawer or dialog (by
    @licitdev)
  - [#12034](https://github.com/directus/directus/pull/12034) Hide raw value copy paste button if unsupported by browser
    (by @licitdev)
  - [#11990](https://github.com/directus/directus/pull/11990) Rich-text-html interface fix (by @d1rOn)

### :sponge: Optimizations

- **App**
  - [#12092](https://github.com/directus/directus/pull/12092) Remove outline prop from v-icons (by @azrikahar)

### :memo: Documentation

- [#12094](https://github.com/directus/directus/pull/12094) Update hooks.md - add system collection "files", fix payload
  parameter (by @Dominic-Marcelino)
- [#12038](https://github.com/directus/directus/pull/12038) Docs: Settings (by @erondpowell)
- [#11728](https://github.com/directus/directus/pull/11728) Docs: User Directory (by @erondpowell)
- [#11330](https://github.com/directus/directus/pull/11330) Docs: Filters (by @erondpowell)

## v9.6.0 (March 4, 2022)

### :sparkles: New Features

- **App**
  - [#11952](https://github.com/directus/directus/pull/11952) Update base theme of the App (by @rijkvanzanten)
  - [#11874](https://github.com/directus/directus/pull/11874) Update available-languages.yaml (by @g-ariunbold)
- **API**
  - [#11942](https://github.com/directus/directus/pull/11942) Add `authenticate` hook to implement custom auth checks
    against current request (by @rijkvanzanten)
  - [#11869](https://github.com/directus/directus/pull/11869) Add support to extend `server` properties (by
    @joselcvarela)
  - [#11622](https://github.com/directus/directus/pull/11622) Emit an event after items are manually sorted 💯 (by
    @infomiho)
  - [#11465](https://github.com/directus/directus/pull/11465) Support listen parameter (by @YpNo)
- **Docker**
  - [#11516](https://github.com/directus/directus/pull/11516) Docker: Add support for changing the timezone (by
    @maartenvn)

### :rocket: Improvements

- **API**
  - [#11954](https://github.com/directus/directus/pull/11954) Add "items.sort" event (by @rijkvanzanten)
  - [#11799](https://github.com/directus/directus/pull/11799) LDAP handle posix groups (by @aidenfoxx)
  - [#11750](https://github.com/directus/directus/pull/11750) Fix anonymous binding ldap (by @schlagmichdoch)
  - [#11617](https://github.com/directus/directus/pull/11617) Avoid get database when authenticate with JWT (by
    @abdonrd)
- **App**
  - [#11944](https://github.com/directus/directus/pull/11944) Resizable navigation panel (by @azrikahar)
  - [#11925](https://github.com/directus/directus/pull/11925) add style to links in notice (by @azrikahar)
  - [#11854](https://github.com/directus/directus/pull/11854) Close date picker on select (by @azrikahar)
  - [#11793](https://github.com/directus/directus/pull/11793) Hide delete action for last admin role (by @azrikahar)
  - [#11787](https://github.com/directus/directus/pull/11787) Allow target="\_blank" in markdown sanitization (by
    @azrikahar)
  - [#11783](https://github.com/directus/directus/pull/11783) Datetime interface improvements (by @azrikahar)
  - [#11767](https://github.com/directus/directus/pull/11767) Chinese translation optimization: item → 条目 not 项目 (by
    @easychen)

### :bug: Bug Fixes

- **App**
  - [#11945](https://github.com/directus/directus/pull/11945) Enable editing of Geometry types from the raw value modal
    (by @vidhav)
  - [#11904](https://github.com/directus/directus/pull/11904) Fix access to public role permissions (by @licitdev)
  - [#11893](https://github.com/directus/directus/pull/11893) Respect the disable the o2m sort option (by @abdonrd)
  - [#11882](https://github.com/directus/directus/pull/11882) Redirect to page not found for collections that do not
    exist (by @azrikahar)
  - [#11815](https://github.com/directus/directus/pull/11815) add missing directus_shares note (by @azrikahar)
  - [#11796](https://github.com/directus/directus/pull/11796) fix map interface extension options (by @azrikahar)
  - [#11784](https://github.com/directus/directus/pull/11784) Fix video size within in-app docs (by @azrikahar)
  - [#11769](https://github.com/directus/directus/pull/11769) fix copy/paste for readonly code interface (by @azrikahar)
  - [#11765](https://github.com/directus/directus/pull/11765) Fix relational interfaces to return null when the array is
    empty after deselecting item(s) (by @azrikahar)
  - [#11762](https://github.com/directus/directus/pull/11762) Hide certain save options for users without create
    permission (by @azrikahar)
  - [#11761](https://github.com/directus/directus/pull/11761) Show errors for Save as Copy action (by @azrikahar)
  - [#11746](https://github.com/directus/directus/pull/11746) Fix translations resetting for new records (by @azrikahar)
  - [#10418](https://github.com/directus/directus/pull/10418) Fix "Save as Copy" for relational fields (by @azrikahar)
- **API**
  - [#11771](https://github.com/directus/directus/pull/11771) fix permission for field functions (by @azrikahar)
  - [#11768](https://github.com/directus/directus/pull/11768) Add check for filterPath length when not having m2o/a2o
    relation (by @eXsiLe95)
  - [#11554](https://github.com/directus/directus/pull/11554) Empty {} supersedes other permissions/validations in \_OR
    merge (by @licitdev)
  - [#11246](https://github.com/directus/directus/pull/11246) Replace union query approach with updated table scan (by
    @rijkvanzanten)

### :memo: Documentation

- [#11855](https://github.com/directus/directus/pull/11855) Clarify default role ID format for SSO (by @azrikahar)
- [#11819](https://github.com/directus/directus/pull/11819) Update plesk docs: Create / apply snapshots (by
  @Dominic-Marcelino)
- [#11782](https://github.com/directus/directus/pull/11782) Docs dark mode fix v2 (by @azrikahar)
- [#11781](https://github.com/directus/directus/pull/11781) Fix dark mode for docs (by @azrikahar)
- [#11686](https://github.com/directus/directus/pull/11686) Adds Deploy with Koyeb. (by @PatelN123)
- [#11662](https://github.com/directus/directus/pull/11662) Fixed readByQuery's sort parameter in custom API endpoint
  example (by @chrisbartley)
- [#11634](https://github.com/directus/directus/pull/11634) Docs: update CSS and pics (by @erondpowell)

## v9.5.2 (February 18, 2022)

### ⚠️ (Potential) Breaking Change

The SDKs type signature was tweaked to make it consistent with the API's internal services. The `.readMany` method has
been renamed to `.readByQuery`. Please check / update your usage of the SDK before upgrading.

### :rocket: Improvements

- **App**
  - [#11705](https://github.com/directus/directus/pull/11705) add "press enter to close" for time inputs (by @azrikahar)
  - [#11703](https://github.com/directus/directus/pull/11703) Align displayed time for 24 hours format (by @azrikahar)
  - [#11702](https://github.com/directus/directus/pull/11702) Show collection notes (by @azrikahar)
  - [#11640](https://github.com/directus/directus/pull/11640) Add required field indicators to accordion group (by
    @azrikahar)
  - [#11599](https://github.com/directus/directus/pull/11599) Auto fill display text when adding link in WYSIWYG (by
    @azrikahar)
  - [#11597](https://github.com/directus/directus/pull/11597) Change relation delete rule to `NO ACTION` for
    non-nullable fields (by @Oreilles)
  - [#11561](https://github.com/directus/directus/pull/11561) Add delete share translation (by @licitdev)
  - [#11433](https://github.com/directus/directus/pull/11433) Fix text when deleting data-model folder (by @Nitwel)
  - [#11286](https://github.com/directus/directus/pull/11286) Fix notifications position when sidebar is open (by
    @azrikahar)
- **API**
  - [#11656](https://github.com/directus/directus/pull/11656) Merge token claims and userinfo in openid flow (by
    @aidenfoxx)
- **sdk**
  - :warning: [#11204](https://github.com/directus/directus/pull/11204) SDK: split `readMany` into itself and
    `readByQuery` (by @joselcvarela)

### :bug: Bug Fixes

- **App**
  - [#11697](https://github.com/directus/directus/pull/11697) Fix translations for singleton (by @azrikahar)
  - [#11685](https://github.com/directus/directus/pull/11685) Fix alias fields not showing up in permissions (by
    @azrikahar)
  - [#11681](https://github.com/directus/directus/pull/11681) Fix context menu directive's deactivate event (by
    @azrikahar)
  - [#11672](https://github.com/directus/directus/pull/11672) Add nested translations support (by @azrikahar)
  - [#11670](https://github.com/directus/directus/pull/11670) Emit value before unmounting datepicker (by @licitdev)
  - [#11642](https://github.com/directus/directus/pull/11642) Fix stacked drawers layering (by @licitdev)
  - [#11600](https://github.com/directus/directus/pull/11600) Hydrate collections store after field deletion (by
    @Oreilles)
  - [#11584](https://github.com/directus/directus/pull/11584) Remove relation from store when translations field is
    deleted (by @azrikahar)
  - [#11582](https://github.com/directus/directus/pull/11582) Fix nested M2O field breaking parent M2O preview (by
    @azrikahar)
  - [#11580](https://github.com/directus/directus/pull/11580) Fix dashboard panels distinct functions (by @azrikahar)
  - [#11569](https://github.com/directus/directus/pull/11569) Fix share items hidden by adblockers (by @Oreilles)
  - [#11567](https://github.com/directus/directus/pull/11567) Fix m2o interface display issues (by @licitdev)
  - [#11526](https://github.com/directus/directus/pull/11526) Fix soft limit overflowing (by @azrikahar)
  - [#11520](https://github.com/directus/directus/pull/11520) Fix o2m interface selection issues (by @licitdev)
  - [#11503](https://github.com/directus/directus/pull/11503) Prevent filter's datepicker closing on month nav (by
    @azrikahar)
  - [#11501](https://github.com/directus/directus/pull/11501) Fix roles in users module navigation not updating (by
    @azrikahar)
  - [#11482](https://github.com/directus/directus/pull/11482) Prevent literal interpolation on null translations & apply
    to collection translations (by @azrikahar)
  - [#11469](https://github.com/directus/directus/pull/11469) Fix translations interface divider's margin top (by
    @azrikahar)
  - [#11467](https://github.com/directus/directus/pull/11467) fix field advanced display config not working (by
    @azrikahar)
  - [#11454](https://github.com/directus/directus/pull/11454) Fix Metrics type panel creation (by @azrikahar)
  - [#11453](https://github.com/directus/directus/pull/11453) Fix repeater's extension options not updating when
    configured (by @azrikahar)
  - [#11431](https://github.com/directus/directus/pull/11431) Fix items' translations not loaded in relational modal (by
    @Nitwel)
  - [#10882](https://github.com/directus/directus/pull/10882) fix fields validation to include field presets (by
    @azrikahar)
  - [#10548](https://github.com/directus/directus/pull/10548) Remove access token from asset url when unnecessary (by
    @licitdev)
- **API**
  - [#11682](https://github.com/directus/directus/pull/11682) validate first user email during installation (by
    @azrikahar)
  - [#11572](https://github.com/directus/directus/pull/11572) Fix timestamp created with unexpected property in MariaDB
    (by @Oreilles)
  - [#11560](https://github.com/directus/directus/pull/11560) Add shares to app access minimum permissions (by
    @licitdev)
  - [#11525](https://github.com/directus/directus/pull/11525) fix directus_notifications default app access permissions
    fields not returning as array (by @azrikahar)
  - [#11444](https://github.com/directus/directus/pull/11444) Prevent selection of Foreign Keys for collection sort (by
    @licitdev)
  - [#11441](https://github.com/directus/directus/pull/11441) Prevent creation of relationships on primary keys (by
    @licitdev)
  - [#11432](https://github.com/directus/directus/pull/11432) Fix not being able to delete folder in data-model (by
    @Nitwel)

### :memo: Documentation

- [#11704](https://github.com/directus/directus/pull/11704) fix/removed typo: duplicated word (by @nesjett)
- [#11698](https://github.com/directus/directus/pull/11698) CLI docs Tip: Create date based snapshots (by
  @Dominic-Marcelino)
- [#11583](https://github.com/directus/directus/pull/11583) minor typo in google cloud documentation (by @yanc0)
- [#11540](https://github.com/directus/directus/pull/11540) Fix snapshot options documentation error (by @eyecatchup)
- [#11488](https://github.com/directus/directus/pull/11488) Fixes reference to documentation about environment
  variables. (by @ijpatricio)
- [#11485](https://github.com/directus/directus/pull/11485) Fix GCP Kubernetes Engine typo (by @Ismaaa)

### :package: Dependency Updates

- [#11710](https://github.com/directus/directus/pull/11710) Bump url-parse from 1.5.3 to 1.5.7 (by @dependabot[bot])
- [#11689](https://github.com/directus/directus/pull/11689) Update rollup-plugin-styles to v4 (by @abdonrd)

## v9.5.1 (February 3, 2022)

### :rocket: Improvements

- **App**
  - [#11415](https://github.com/directus/directus/pull/11415) Add missing error translations (by @dimitrov-adrian)
  - [#11412](https://github.com/directus/directus/pull/11412) Fix performance drop in stacked drawer when many layers
    (by @dimitrov-adrian)
  - [#11318](https://github.com/directus/directus/pull/11318) App: Allow batch edit for 1 or more items (by
    @joselcvarela)
  - [#11294](https://github.com/directus/directus/pull/11294) Update toolbar items order in WYSIWYG editor (by
    @azrikahar)
  - [#11258](https://github.com/directus/directus/pull/11258) Refine option labels for Folders in Data Model (by
    @azrikahar)
  - [#10828](https://github.com/directus/directus/pull/10828) Add strings to accepted fields for Insights Panel
    "Metrics" (by @jaycammarano)
  - [#9421](https://github.com/directus/directus/pull/9421) Fix translations layout (by @Nitwel)
- **API**
  - [#11307](https://github.com/directus/directus/pull/11307) Bearer token no longer case sensitive for API
    authentication (by @jaycammarano)
  - [#11279](https://github.com/directus/directus/pull/11279) Resolve transaction unreliability issues in schema
    alterations (by @rijkvanzanten)
  - [#11069](https://github.com/directus/directus/pull/11069) Prevent MySQL collation errors (by @Oreilles)

### :bug: Bug Fixes

- **API**
  - [#11423](https://github.com/directus/directus/pull/11423) Don't parse preset object as filter structure (by
    @rijkvanzanten)
  - [#11359](https://github.com/directus/directus/pull/11359) Fixed issue when updating columns in Oracle (by
    @aidenfoxx)
  - [#11347](https://github.com/directus/directus/pull/11347) Fix update file endpoint (by @azrikahar)
  - [#11279](https://github.com/directus/directus/pull/11279) Resolve transaction unreliability issues in schema
    alterations (by @rijkvanzanten)
  - [#11269](https://github.com/directus/directus/pull/11269) Use correct import for crdb dialect from schema-inspector
    (by @rijkvanzanten)
  - [#11268](https://github.com/directus/directus/pull/11268) Fix PG10 support (by @rijkvanzanten)
  - [#11256](https://github.com/directus/directus/pull/11256) Return empty string as empty array in CSV type (by
    @rijkvanzanten)
- **specs**
  - [#11347](https://github.com/directus/directus/pull/11347) Fix update file endpoint (by @azrikahar)
  - [#11290](https://github.com/directus/directus/pull/11290) Update OpenAPI schema for file/files (by @azrikahar)
- **Extensions**
  - [#11329](https://github.com/directus/directus/pull/11329) Mark shared as side effects free (by @nickrum)
- **shared**
  - [#11329](https://github.com/directus/directus/pull/11329) Mark shared as side effects free (by @nickrum)
- **App**
  - [#11289](https://github.com/directus/directus/pull/11289) fix sorting of select-multiple-dropdown values (by
    @azrikahar)
  - [#11287](https://github.com/directus/directus/pull/11287) Prevent vue-i18n special characters causing error (by
    @azrikahar)
  - [#11284](https://github.com/directus/directus/pull/11284) Prevent group edited indicator in Shared View (by
    @azrikahar)
  - [#11281](https://github.com/directus/directus/pull/11281) Prevent editing of fields within groups in Share (by
    @azrikahar)
  - [#11265](https://github.com/directus/directus/pull/11265) Fix fields order in Fields Permissions (by @azrikahar)
  - [#11263](https://github.com/directus/directus/pull/11263) fix tooltip directive modifiers (by @azrikahar)
  - [#11251](https://github.com/directus/directus/pull/11251) Fix o2m nested image thumbnail extraction (by
    @rijkvanzanten)
  - [#9421](https://github.com/directus/directus/pull/9421) Fix translations layout (by @Nitwel)

### :sponge: Optimizations

- **Misc.**
  - [#11381](https://github.com/directus/directus/pull/11381) Add a few missing DefinitelyTyped dependencies (by
    @nickrum)

### :memo: Documentation

- [#11366](https://github.com/directus/directus/pull/11366) Document `--yes` option for creating schema snapshots (by
  @eyecatchup)
- [#11356](https://github.com/directus/directus/pull/11356) Document `--yes` option for applying schema snapshots (by
  @eyecatchup)
- [#11336](https://github.com/directus/directus/pull/11336) Added / amended env vars in docs example for Google Cloud
  Logging (by @keesvanbemmel)
- [#11267](https://github.com/directus/directus/pull/11267) Documentation Polishing (by @josdea)
- [#10898](https://github.com/directus/directus/pull/10898) Make docs a lot more fancy. ✨ (by @Nitwel)

## v9.5.0 (January 24, 2022)

### :sparkles: New Features

- **Misc.**
  - [#11094](https://github.com/directus/directus/pull/11094) Enable end-to-end tests for Oracle and SQLite
    ([@Oreilles](https://github.com/Oreilles))
- **App**
  - [#11050](https://github.com/directus/directus/pull/11050) Add CSV/JSON Import capability via App
    ([@azrikahar](https://github.com/azrikahar))
  - [#11009](https://github.com/directus/directus/pull/11009) Add soft character limit to various inputs
    ([@jaycammarano](https://github.com/jaycammarano))
- **API**
  - [#10911](https://github.com/directus/directus/pull/10911) Adds possible extra pino logger options through env vars
    ([@keesvanbemmel](https://github.com/keesvanbemmel))
  - [#10113](https://github.com/directus/directus/pull/10113) Implement CockroachDB support
    ([@wodka](https://github.com/wodka))
- **schema**
  - [#10113](https://github.com/directus/directus/pull/10113) Implement CockroachDB support
    ([@wodka](https://github.com/wodka))

### :rocket: Improvements

- **Misc.**
  - [#11174](https://github.com/directus/directus/pull/11174) Improve end-to-end test displayed results
    ([@Oreilles](https://github.com/Oreilles))
- **App**
  - [#11164](https://github.com/directus/directus/pull/11164) Only render project descriptor if it is set
    ([@nickrum](https://github.com/nickrum))
  - [#11116](https://github.com/directus/directus/pull/11116) Disable login form when AUTH_DISABLE_DEFAULT is enabled
    ([@diegoleme](https://github.com/diegoleme))
  - [#11103](https://github.com/directus/directus/pull/11103) Make email_notifications column a translated name
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#11018](https://github.com/directus/directus/pull/11018) App: `use-edits-guard`
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#11016](https://github.com/directus/directus/pull/11016) `has-edits` as part of `use-item`
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#11015](https://github.com/directus/directus/pull/11015) Minor Shares UX Improvements
    ([@azrikahar](https://github.com/azrikahar))
  - [#11014](https://github.com/directus/directus/pull/11014) Move danger styling to field-select-menu component
    ([@azrikahar](https://github.com/azrikahar))
  - [#10992](https://github.com/directus/directus/pull/10992) Enable context menu for read-only fields & adds copy/paste
    options ([@azrikahar](https://github.com/azrikahar))
  - [#10991](https://github.com/directus/directus/pull/10991) Improve Width for Search Input & Filters
    ([@azrikahar](https://github.com/azrikahar))
  - [#10985](https://github.com/directus/directus/pull/10985) Add relations tab for file type fields
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10951](https://github.com/directus/directus/pull/10951) Filter UI tweaks
    ([@azrikahar](https://github.com/azrikahar))
  - [#10944](https://github.com/directus/directus/pull/10944) add last_page to minimal permissions on app side
    ([@azrikahar](https://github.com/azrikahar))
- **sdk**
  - [#11162](https://github.com/directus/directus/pull/11162) Added the 4 "\_starts/ends_with" filter operators to type
    defs in SDK ([@wfoxall](https://github.com/wfoxall))
- **API**
  - [#11113](https://github.com/directus/directus/pull/11113) Only watch entrypoints of local extensions for changes
    ([@nickrum](https://github.com/nickrum))
  - [#11096](https://github.com/directus/directus/pull/11096) Add Unsupported Media Type Exception
    ([@azrikahar](https://github.com/azrikahar))
  - [#11079](https://github.com/directus/directus/pull/11079) Removed OpenID token fetching from OAuth flow
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#10960](https://github.com/directus/directus/pull/10960) Allow passing 'version' to Knex
    ([@joeinnes](https://github.com/joeinnes))
- **Extensions**
  - :warning: [#11106](https://github.com/directus/directus/pull/11106) Rename sourceMaps flag to sourcemap to align
    with other tools and add no-minify flag to the extensions-sdk CLI ([@nickrum](https://github.com/nickrum))
  - [#11100](https://github.com/directus/directus/pull/11100) Always inline dynamic imports when bundling extensions
    ([@nickrum](https://github.com/nickrum))
  - [#11099](https://github.com/directus/directus/pull/11099) Remove extensions-sdk and axios from the list of shared
    deps ([@nickrum](https://github.com/nickrum))

### :bug: Bug Fixes

- **API**
  - [#11238](https://github.com/directus/directus/pull/11238) Use new pg_catalog based schema introspection
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#11227](https://github.com/directus/directus/pull/11227) Fix nested transactions on SQLite
    ([@licitdev](https://github.com/licitdev))
  - [#11193](https://github.com/directus/directus/pull/11193) Set CRDB options to avoid inconsistencies between vendors
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#11159](https://github.com/directus/directus/pull/11159) fix for filtering nested M2M relations
    ([@zimmersi](https://github.com/zimmersi))
  - [#11129](https://github.com/directus/directus/pull/11129) Fix auth refresh issue
    ([@azrikahar](https://github.com/azrikahar))
  - [#11112](https://github.com/directus/directus/pull/11112) Handle errors while pre-bundling App extensions more
    gracefully ([@nickrum](https://github.com/nickrum))
  - [#11096](https://github.com/directus/directus/pull/11096) Add Unsupported Media Type Exception
    ([@azrikahar](https://github.com/azrikahar))
  - [#11077](https://github.com/directus/directus/pull/11077) Fixed broken auth SQL on Oracle
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **Extensions**
  - [#11231](https://github.com/directus/directus/pull/11231) Add DefinitelyTyped deps to shared
    ([@nickrum](https://github.com/nickrum))
- **shared**
  - [#11231](https://github.com/directus/directus/pull/11231) Add DefinitelyTyped deps to shared
    ([@nickrum](https://github.com/nickrum))
- **App**
  - [#11170](https://github.com/directus/directus/pull/11170) Only trigger edits guard if there are edits
    ([@nickrum](https://github.com/nickrum))
  - [#11084](https://github.com/directus/directus/pull/11084) Fix collection options menu clicks
    ([@azrikahar](https://github.com/azrikahar))
  - [#10993](https://github.com/directus/directus/pull/10993) Set minimum value for string field length to 1
    ([@jaycammarano](https://github.com/jaycammarano))
  - [#10977](https://github.com/directus/directus/pull/10977) Fix project name overflow
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10970](https://github.com/directus/directus/pull/10970) show items without archive value in all items view
    ([@azrikahar](https://github.com/azrikahar))
  - [#10945](https://github.com/directus/directus/pull/10945) App (Presets): Fix delete reactivity
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#8467](https://github.com/directus/directus/pull/8467) Remove marginTop option from presentation divider
    ([@licitdev](https://github.com/licitdev))
- **Misc.**
  - [#11081](https://github.com/directus/directus/pull/11081) Make skipping of workflows work again
    ([@paescuj](https://github.com/paescuj))
  - [#11041](https://github.com/directus/directus/pull/11041) moved sso doc over to configurations
    ([@erondpowell](https://github.com/erondpowell))

### :sponge: Optimizations

- **API**
  - [#11238](https://github.com/directus/directus/pull/11238) Use new pg_catalog based schema introspection
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#11191](https://github.com/directus/directus/pull/11191) Remove API extension types from the API
    ([@nickrum](https://github.com/nickrum))
  - [#11179](https://github.com/directus/directus/pull/11179) Moving schema and relation types into shared package
    ([@johnhuffsmith](https://github.com/johnhuffsmith))
  - [#11163](https://github.com/directus/directus/pull/11163) Clean up emitting "items" events
    ([@nickrum](https://github.com/nickrum))
  - [#10955](https://github.com/directus/directus/pull/10955) Delete required hooks only once
    ([@nickrum](https://github.com/nickrum))
- **Misc.**
  - [#11232](https://github.com/directus/directus/pull/11232) Remove no-break space characters with regular spaces
    ([@nickrum](https://github.com/nickrum))
  - [#11167](https://github.com/directus/directus/pull/11167) Removed unused session data type
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#10968](https://github.com/directus/directus/pull/10968) End-to-end tests refactor
    ([@Oreilles](https://github.com/Oreilles))
- **App**
  - [#11171](https://github.com/directus/directus/pull/11171) Fix a prop type check in the advanced schema drawer
    ([@nickrum](https://github.com/nickrum))

### :memo: Documentation

- [#11224](https://github.com/directus/directus/pull/11224) Change "register" for "handler" in the example
  ([@jjmiranda](https://github.com/jjmiranda))
- [#11108](https://github.com/directus/directus/pull/11108) Add alert about nested alias
  ([@joselcvarela](https://github.com/joselcvarela))
- [#11085](https://github.com/directus/directus/pull/11085) break word for code tags in custom blocks
  ([@azrikahar](https://github.com/azrikahar))
- [#11041](https://github.com/directus/directus/pull/11041) moved sso doc over to configurations
  ([@erondpowell](https://github.com/erondpowell))
- [#11038](https://github.com/directus/directus/pull/11038) Update Running Locally docs to have correct paths in
  commands ([@jaycammarano](https://github.com/jaycammarano))
- [#10943](https://github.com/directus/directus/pull/10943) fix Read By Query example code
  ([@azrikahar](https://github.com/azrikahar))
- [#10936](https://github.com/directus/directus/pull/10936) Installation guide for Google Cloud Platform
  ([@keesvanbemmel](https://github.com/keesvanbemmel))
- [#10922](https://github.com/directus/directus/pull/10922) Add documentation for EXTENSIONS_AUTO_RELOAD
  ([@nickrum](https://github.com/nickrum))
- [#10911](https://github.com/directus/directus/pull/10911) Adds possible extra pino logger options through env vars
  ([@keesvanbemmel](https://github.com/keesvanbemmel))

### :package: Dependency Updates

- [#11203](https://github.com/directus/directus/pull/11203) Update knex-schema-inspector
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#11118](https://github.com/directus/directus/pull/11118) Upgrade dependencies
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#11118](https://github.com/directus/directus/pull/11118) Upgrade dependencies
  ([@rijkvanzanten](https://github.com/rijkvanzanten))

## v9.4.3 (January 7, 2022)

### :sparkles: New Features

- **API**
  - [#10881](https://github.com/directus/directus/pull/10881) Add extension auto reloading to the API
    ([@nickrum](https://github.com/nickrum))
- **Extensions**
  - [#10881](https://github.com/directus/directus/pull/10881) Add extension auto reloading to the API
    ([@nickrum](https://github.com/nickrum))
  - [#10849](https://github.com/directus/directus/pull/10849) Make registered extensions accessible from extensions
    ([@nickrum](https://github.com/nickrum))

### :rocket: Improvements

- **App**
  - [#10879](https://github.com/directus/directus/pull/10879) Handle broken images more gracefully
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10872](https://github.com/directus/directus/pull/10872) Use new date picker in filter, allow manual input
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **Extensions**
  - [#10850](https://github.com/directus/directus/pull/10850) Move useLayout composable to shared and expose it through
    extensions-sdk ([@nickrum](https://github.com/nickrum))
- **API**
  - [#10830](https://github.com/directus/directus/pull/10830) Default to upgrade-insecure-requests turned off
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :bug: Bug Fixes

- **App**
  - [#10903](https://github.com/directus/directus/pull/10903) Fix user info sidebar watcher causing error
    ([@azrikahar](https://github.com/azrikahar))
  - [#10895](https://github.com/directus/directus/pull/10895) Fix color width inconsistency
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10819](https://github.com/directus/directus/pull/10819) Fix logo url in shared view
    ([@azrikahar](https://github.com/azrikahar))
  - [#10814](https://github.com/directus/directus/pull/10814) add translations for project descriptor & shares fields
    ([@azrikahar](https://github.com/azrikahar))
  - [#10812](https://github.com/directus/directus/pull/10812) prevent icons from being searchable
    ([@azrikahar](https://github.com/azrikahar))
- **API**
  - [#10875](https://github.com/directus/directus/pull/10875) Fix refresh token payload structure on shared refresh
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10852](https://github.com/directus/directus/pull/10852) Add CSP directives for MapLibre to work
    ([@azrikahar](https://github.com/azrikahar))
  - [#10847](https://github.com/directus/directus/pull/10847) Fix running migrations in dev mode
    ([@nickrum](https://github.com/nickrum))
  - [#10846](https://github.com/directus/directus/pull/10846) Fix reloading hooks with schedule events
    ([@nickrum](https://github.com/nickrum))
  - [#10837](https://github.com/directus/directus/pull/10837) Api (Assets): fix UUID verification
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#10836](https://github.com/directus/directus/pull/10836) Left Join-ing on roles to allow users without roles to
    login ([@johnhuffsmith](https://github.com/johnhuffsmith))
  - [#10821](https://github.com/directus/directus/pull/10821) fix file local type for displaysForType
    ([@azrikahar](https://github.com/azrikahar))

### :memo: Documentation

- [#10891](https://github.com/directus/directus/pull/10891) Clarify case rules for storage env vars
  ([@jkjustjoshing](https://github.com/jkjustjoshing))
- [#10827](https://github.com/directus/directus/pull/10827) Docs(SDK): use top level await upload
  ([@joselcvarela](https://github.com/joselcvarela))
- [#10816](https://github.com/directus/directus/pull/10816) minor fix for form closing tag in file upload example
  ([@azrikahar](https://github.com/azrikahar))
- [#10813](https://github.com/directus/directus/pull/10813) update docs on descriptor in project settings
  ([@azrikahar](https://github.com/azrikahar))
- [#10807](https://github.com/directus/directus/pull/10807) Add Deploy with Cleavr to Readme
  ([@armgitaar](https://github.com/armgitaar))

## v9.4.2 (December 30, 2021)

### :warning: Notice

For security reasons, we've enabled the `Content-Security-Policy` header by default. This won't change the normal
operating behavior of the API, but be aware if you were doing some trickery before that might be affected by this
header.

### :rocket: Improvements

- **API**
  - [#10778](https://github.com/directus/directus/pull/10778) Add warning when DB_CHARSET isn't explicitly configured
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - :warning: [#10776](https://github.com/directus/directus/pull/10776) Add Content-Security-Policy header by default
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10773](https://github.com/directus/directus/pull/10773) Don't force commandTimeout in redis based caches
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10765](https://github.com/directus/directus/pull/10765) Add ability to configure IP extraction
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#10762](https://github.com/directus/directus/pull/10762) Don't show badge when no revisions
    ([@azrikahar](https://github.com/azrikahar))
  - [#10760](https://github.com/directus/directus/pull/10760) style tweaks ([@benhaynes](https://github.com/benhaynes))
  - [#9224](https://github.com/directus/directus/pull/9224) Enable alpha channel in color selector
    ([@adanielyan](https://github.com/adanielyan))

### :memo: Documentation

- [#10761](https://github.com/directus/directus/pull/10761) Add link to Cleavr deployment guide
  ([@armgitaar](https://github.com/armgitaar))
- [#10622](https://github.com/directus/directus/pull/10622) `update_users_me` Alias for GraphQL API
  ([@w0ryn](https://github.com/w0ryn))

## v9.4.1 (December 28, 2021)

### :rocket: Improvements

- **API**
  - [#10713](https://github.com/directus/directus/pull/10713) exclude MS-SQL system table 'sysdiagrams'
    ([@paulboudewijn](https://github.com/paulboudewijn))
- **App**
  - [#10698](https://github.com/directus/directus/pull/10698) Add notice for display templates when creating M2M field
    ([@azrikahar](https://github.com/azrikahar))
  - [#10697](https://github.com/directus/directus/pull/10697) Add empty state to revisions
    ([@azrikahar](https://github.com/azrikahar))
  - [#10611](https://github.com/directus/directus/pull/10611) Update interface previews
    ([@azrikahar](https://github.com/azrikahar))
  - [#6440](https://github.com/directus/directus/pull/6440) Add stacked drawers effect
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :bug: Bug Fixes

- **API**
  - [#10740](https://github.com/directus/directus/pull/10740) Fix data type inconsistencies in directus_shares table
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10736](https://github.com/directus/directus/pull/10736) Replace knex.fn.now() to Date()
    ([@licitdev](https://github.com/licitdev))
  - [#10674](https://github.com/directus/directus/pull/10674) check system deny list in relations for GraphQL
    ([@azrikahar](https://github.com/azrikahar))
- **App**
  - [#10721](https://github.com/directus/directus/pull/10721) Tweak auto-refresh of panels
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10704](https://github.com/directus/directus/pull/10704) App: fix m2o raw value
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#10703](https://github.com/directus/directus/pull/10703) App: add sort on create m2m item
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#10702](https://github.com/directus/directus/pull/10702) App: fix stacked drawers on mobile
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#10696](https://github.com/directus/directus/pull/10696) Fix Map Attribution Problems
    ([@maltejur](https://github.com/maltejur))
  - [#10691](https://github.com/directus/directus/pull/10691) Add OpenStreetMaps Attribution
    ([@maltejur](https://github.com/maltejur))
  - [#10576](https://github.com/directus/directus/pull/10576) fix default values from permission's field presets
    ([@azrikahar](https://github.com/azrikahar))

### :sponge: Optimizations

- **Misc.**
  - [#10711](https://github.com/directus/directus/pull/10711) Fix end-to-end tests for Postgres10
    ([@jaycammarano](https://github.com/jaycammarano))
- **API**
  - [#10710](https://github.com/directus/directus/pull/10710) Fix debugging random portno
    ([@paulboudewijn](https://github.com/paulboudewijn))

## v9.4.0 (December 23, 2021)

### :sparkles: New Features

- **App**
  - [#10663](https://github.com/directus/directus/pull/10663) Add ability to share items with people outside the
    platform ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10438](https://github.com/directus/directus/pull/10438) Add v-date-picker base component & use it in datetime
    interface ([@azrikahar](https://github.com/azrikahar))

### :rocket: Improvements

- **App**
  - [#10659](https://github.com/directus/directus/pull/10659) match panel sizing to metric
    ([@benhaynes](https://github.com/benhaynes))
  - [#10652](https://github.com/directus/directus/pull/10652) use CSS variable for users Admin Options divider
    ([@azrikahar](https://github.com/azrikahar))
  - [#10587](https://github.com/directus/directus/pull/10587) smaller label height
    ([@benhaynes](https://github.com/benhaynes))
  - [#10573](https://github.com/directus/directus/pull/10573) Update to the latest Material Icons
    ([@tatthien](https://github.com/tatthien))
  - [#7199](https://github.com/directus/directus/pull/7199) Add default folder upload to WYSIWYG editors
    ([@letoast](https://github.com/letoast))

### :bug: Bug Fixes

- **App**
  - [#10651](https://github.com/directus/directus/pull/10651) fix public role sidebar not closable
    ([@azrikahar](https://github.com/azrikahar))
  - [#10617](https://github.com/directus/directus/pull/10617) fix M2A list not updating
    ([@azrikahar](https://github.com/azrikahar))
- **cli**
  - [#10623](https://github.com/directus/directus/pull/10623) Fix directusctl packages
    ([@azrikahar](https://github.com/azrikahar))
- **API**
  - :warning: [#10569](https://github.com/directus/directus/pull/10569) Use correct status code (204) when no content is
    sent ([@eikaramba](https://github.com/eikaramba))

### :sponge: Optimizations

- **API**
  - [#10643](https://github.com/directus/directus/pull/10643) Move the app entrypoints to the assets directory
    ([@nickrum](https://github.com/nickrum))

## v9.3.0 (December 16, 2021)

### :sparkles: New Features

- **App**
  - [#10513](https://github.com/directus/directus/pull/10513) Add Archive sidebar component
    ([@azrikahar](https://github.com/azrikahar))
  - [#9773](https://github.com/directus/directus/pull/9773) Update formatted-value display
    ([@alejandro-tss](https://github.com/alejandro-tss))
  - [#9135](https://github.com/directus/directus/pull/9135) Custom filter support for relational interfaces
    ([@t7tran](https://github.com/t7tran))

### :rocket: Improvements

- **API**
  - [#10531](https://github.com/directus/directus/pull/10531) Pass a custom emitter to API extensions
    ([@nickrum](https://github.com/nickrum))
  - [#10529](https://github.com/directus/directus/pull/10529) Emitting action/filter events for api extensions
    ([@br41nslug](https://github.com/br41nslug))
- **Extensions**
  - [#10531](https://github.com/directus/directus/pull/10531) Pass a custom emitter to API extensions
    ([@nickrum](https://github.com/nickrum))
- **App**
  - [#10514](https://github.com/directus/directus/pull/10514) add tooltip to sidebar components
    ([@azrikahar](https://github.com/azrikahar))
  - [#10494](https://github.com/directus/directus/pull/10494) Remove quotes for CSS variable in selection style
    ([@azrikahar](https://github.com/azrikahar))
  - [#10493](https://github.com/directus/directus/pull/10493) Unify & translate initial role/user detail in `init` &
    `bootstrap` command ([@azrikahar](https://github.com/azrikahar))
  - [#10464](https://github.com/directus/directus/pull/10464) Autofocus form for repeater
    ([@azrikahar](https://github.com/azrikahar))

### :bug: Bug Fixes

- **API**
  - [#10497](https://github.com/directus/directus/pull/10497) Expanded try catch around extracting metadata
    ([@keesvanbemmel](https://github.com/keesvanbemmel))
- **App**
  - [#10491](https://github.com/directus/directus/pull/10491) Fix decimal input on the interface
    ([@licitdev](https://github.com/licitdev))

### :sponge: Optimizations

- **App**
  - [#10524](https://github.com/directus/directus/pull/10524) Align display options type with interface options type
    ([@nickrum](https://github.com/nickrum))

### :memo: Documentation

- [#10543](https://github.com/directus/directus/pull/10543) Update CLI docs ([@azrikahar](https://github.com/azrikahar))
- [#10513](https://github.com/directus/directus/pull/10513) Add Archive sidebar component
  ([@azrikahar](https://github.com/azrikahar))
- [#10467](https://github.com/directus/directus/pull/10467) fix links to types
  ([@azrikahar](https://github.com/azrikahar))
- [#10465](https://github.com/directus/directus/pull/10465) Minor fix for "no result found" for search in dark mode
  ([@azrikahar](https://github.com/azrikahar))

## v9.2.2 (December 10, 2021)

### :rocket: Improvements

- **App**
  - [#10441](https://github.com/directus/directus/pull/10441) interface padding
    ([@benhaynes](https://github.com/benhaynes))
  - [#10437](https://github.com/directus/directus/pull/10437) Update selection styling to use CSS variable
    ([@azrikahar](https://github.com/azrikahar))
  - [#10123](https://github.com/directus/directus/pull/10123) fix advanced filter fields order with field groups
    ([@azrikahar](https://github.com/azrikahar))

### :bug: Bug Fixes

- **App**
  - [#10440](https://github.com/directus/directus/pull/10440) Fix broken wysiwyg editor when width and height are set in
    image ([@maltejur](https://github.com/maltejur))
  - [#10430](https://github.com/directus/directus/pull/10430) patch translations interface for new translations
    ([@azrikahar](https://github.com/azrikahar))
  - [#10412](https://github.com/directus/directus/pull/10412) Fix selection of field.meta.special after removal
    ([@licitdev](https://github.com/licitdev))
  - [#10410](https://github.com/directus/directus/pull/10410) fix translations not refreshing on save
    ([@azrikahar](https://github.com/azrikahar))
  - [#10370](https://github.com/directus/directus/pull/10370) fix styling problem with nested render-template
    ([@SeanDylanGoff](https://github.com/SeanDylanGoff))
  - [#10368](https://github.com/directus/directus/pull/10368) Relations: fix M2M related primary key
    ([@AdiechaHK](https://github.com/AdiechaHK))
  - [#10125](https://github.com/directus/directus/pull/10125) Auto expand selections for checkbox tree in Show Selected
    mode ([@azrikahar](https://github.com/azrikahar))
  - [#10123](https://github.com/directus/directus/pull/10123) fix advanced filter fields order with field groups
    ([@azrikahar](https://github.com/azrikahar))
  - [#9589](https://github.com/directus/directus/pull/9589) Fix conditional markdown and code input glitches
    ([@smilledge](https://github.com/smilledge))
- **API**
  - [#10409](https://github.com/directus/directus/pull/10409) Add password policy check during password reset
    ([@licitdev](https://github.com/licitdev))
  - [#9957](https://github.com/directus/directus/pull/9957) Separate caching of dynamic user vars from permissions
    ([@licitdev](https://github.com/licitdev))
  - [#9527](https://github.com/directus/directus/pull/9527) Added edge case handling for weird IBM ldap issues
    ([@aidenfoxx](https://github.com/aidenfoxx))

### :memo: Documentation

- [#10408](https://github.com/directus/directus/pull/10408) clarify "folder" collections & collection API reference
  ([@azrikahar](https://github.com/azrikahar))
- [#10386](https://github.com/directus/directus/pull/10386) Add custom panel extensions template & docs
  ([@azrikahar](https://github.com/azrikahar))
- [#10382](https://github.com/directus/directus/pull/10382) Tweak for logical operators snippet
  ([@ryntab](https://github.com/ryntab))
- [#10275](https://github.com/directus/directus/pull/10275) Docs for testing the API
  ([@jaycammarano](https://github.com/jaycammarano))

## v9.2.1 (December 6, 2021)

### :rocket: Improvements

- **App**
  - [#10346](https://github.com/directus/directus/pull/10346) Use variables for default colors in boolean
    interface/display ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10340](https://github.com/directus/directus/pull/10340) replace logo with rounded version
    ([@benhaynes](https://github.com/benhaynes))
  - [#10331](https://github.com/directus/directus/pull/10331) Update input-rich-text-html.vue
    ([@AndreyKindin](https://github.com/AndreyKindin))
- **API**
  - [#10339](https://github.com/directus/directus/pull/10339) Use expression instead of alias in groupBy query
    ([@Oreilles](https://github.com/Oreilles))
  - [#10301](https://github.com/directus/directus/pull/10301) SSO fixes and improvements
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **Extensions**
  - [#10335](https://github.com/directus/directus/pull/10335) Share pinia with extensions
    ([@nickrum](https://github.com/nickrum))

### :bug: Bug Fixes

- **API**
  - [#10339](https://github.com/directus/directus/pull/10339) Use expression instead of alias in groupBy query
    ([@Oreilles](https://github.com/Oreilles))
  - [#10336](https://github.com/directus/directus/pull/10336) Fix permissions merging on null check
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10301](https://github.com/directus/directus/pull/10301) SSO fixes and improvements
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#10297](https://github.com/directus/directus/pull/10297) Fixed escaping error on LDAP filters
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **App**
  - [#10338](https://github.com/directus/directus/pull/10338) Add disabled state to translations interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10308](https://github.com/directus/directus/pull/10308) Fix non-native geometries not visible in map layout
    ([@Oreilles](https://github.com/Oreilles))

### :sponge: Optimizations

- **App**
  - [#10316](https://github.com/directus/directus/pull/10316) Small optimization in getNodeAtPath
    ([@Oreilles](https://github.com/Oreilles))

### :memo: Documentation

- [#10334](https://github.com/directus/directus/pull/10334) docs updates on file library, content sidebar etc
  ([@azrikahar](https://github.com/azrikahar))
- [#8611](https://github.com/directus/directus/pull/8611) Extension docs updates
  ([@nickrum](https://github.com/nickrum))

### :package: Dependency Updates

- [#10319](https://github.com/directus/directus/pull/10319) Update Node.js to v16.13.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#10318](https://github.com/directus/directus/pull/10318) Pin dependencies
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.2.0 (December 3, 2021)

### :sparkles: New Features

- **API**
  - [#10279](https://github.com/directus/directus/pull/10279) Add items.read filter hook
    ([@Oreilles](https://github.com/Oreilles))
  - [#9322](https://github.com/directus/directus/pull/9322) Implement AUTH_DISABLE_DEFAULT config option
    ([@dorianim](https://github.com/dorianim))
- **Misc.**
  - [#10098](https://github.com/directus/directus/pull/10098) Add dark mode to docs
    ([@u12206050](https://github.com/u12206050))
- **App**
  - [#9322](https://github.com/directus/directus/pull/9322) Implement AUTH_DISABLE_DEFAULT config option
    ([@dorianim](https://github.com/dorianim))
  - [#8010](https://github.com/directus/directus/pull/8010) Support 'selectionMode' on tabular and cards
    ([@joselcvarela](https://github.com/joselcvarela))

### :rocket: Improvements

- **API**
  - [#10281](https://github.com/directus/directus/pull/10281) Add shared exceptions to extension context
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10268](https://github.com/directus/directus/pull/10268) Added "null/admin" accountability and emitEvents opts to
    FilesService ([@keesvanbemmel](https://github.com/keesvanbemmel))
  - [#10227](https://github.com/directus/directus/pull/10227) Force CDNs to ignore module bundle output in cache
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10151](https://github.com/directus/directus/pull/10151) Cleaned up Oracle duplicate index handling
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#10077](https://github.com/directus/directus/pull/10077) Add `limit` to graphql aggregated queries
    ([@azrikahar](https://github.com/azrikahar))
  - [#10064](https://github.com/directus/directus/pull/10064) Add status field in the directus_notifications collection
    ([@alejandro-tss](https://github.com/alejandro-tss))
  - [#10052](https://github.com/directus/directus/pull/10052) Improve helpers structure
    ([@Oreilles](https://github.com/Oreilles))
  - :warning: [#10003](https://github.com/directus/directus/pull/10003) Remove `runMigrations` from `database install`
    (#9911) ([@viters](https://github.com/viters))
- **Extensions**
  - [#10281](https://github.com/directus/directus/pull/10281) Add shared exceptions to extension context
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10227](https://github.com/directus/directus/pull/10227) Force CDNs to ignore module bundle output in cache
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#10274](https://github.com/directus/directus/pull/10274) Add integer support to radio and dropdown
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10264](https://github.com/directus/directus/pull/10264) allow delete keypresses in v-input
    ([@azrikahar](https://github.com/azrikahar))
  - [#10183](https://github.com/directus/directus/pull/10183) add text path to autocomplete api input
    ([@azrikahar](https://github.com/azrikahar))
  - [#10180](https://github.com/directus/directus/pull/10180) refresh edited insights panel on change
    ([@azrikahar](https://github.com/azrikahar))
  - [#10173](https://github.com/directus/directus/pull/10173) Improve mentions keyboard accessibility
    ([@licitdev](https://github.com/licitdev))
  - [#10171](https://github.com/directus/directus/pull/10171) less bold for display
    ([@benhaynes](https://github.com/benhaynes))
  - [#10161](https://github.com/directus/directus/pull/10161) App: fix relationships raw value
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#10149](https://github.com/directus/directus/pull/10149) add colorOn & colorOff to checkbox interface
    ([@azrikahar](https://github.com/azrikahar))
  - [#10090](https://github.com/directus/directus/pull/10090) Add English (United Kingdom) to available languages
    ([@joelkennedy](https://github.com/joelkennedy))
  - [#10073](https://github.com/directus/directus/pull/10073) Hide options for date type in datetime interface
    ([@azrikahar](https://github.com/azrikahar))
  - [#10054](https://github.com/directus/directus/pull/10054) save wysiwyg image size in url params instead of html tags
    ([@maltejur](https://github.com/maltejur))
  - [#9742](https://github.com/directus/directus/pull/9742) Simplify presentation/aliases & accordion setup flow
    ([@azrikahar](https://github.com/azrikahar))
  - [#9741](https://github.com/directus/directus/pull/9741) Add fill & curve options to Insights time series chart
    ([@azrikahar](https://github.com/azrikahar))
  - [#9628](https://github.com/directus/directus/pull/9628) add crop and contain options, increase full height
    ([@benhaynes](https://github.com/benhaynes))
  - [#9619](https://github.com/directus/directus/pull/9619) Skip tabbing on input number steppers
    ([@dimitrov-adrian](https://github.com/dimitrov-adrian))
  - [#9583](https://github.com/directus/directus/pull/9583) Autofocus first input in create item form
    ([@azrikahar](https://github.com/azrikahar))
  - [#9563](https://github.com/directus/directus/pull/9563) Added Line Wrapping option to Code Interface
    ([@myzinsky](https://github.com/myzinsky))
  - [#9267](https://github.com/directus/directus/pull/9267) Markdown Interface Updates
    ([@rclee91](https://github.com/rclee91))
- **sdk**
  - [#10133](https://github.com/directus/directus/pull/10133) SDK: Fix type arrays on filter
    ([@joselcvarela](https://github.com/joselcvarela))

### :bug: Bug Fixes

- **API**
  - [#10272](https://github.com/directus/directus/pull/10272) Align webhook payload with new hooks implementation
    ([@nickrum](https://github.com/nickrum))
  - [#10270](https://github.com/directus/directus/pull/10270) Fix SQLite date functions not working in aggregate queries
    ([@Oreilles](https://github.com/Oreilles))
  - [#10261](https://github.com/directus/directus/pull/10261) Check if file exists in assets service
    ([@licitdev](https://github.com/licitdev))
  - [#10250](https://github.com/directus/directus/pull/10250) Add table prefix to groupBy query
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10246](https://github.com/directus/directus/pull/10246) Fix handling of nested arrays in snapshot diffing
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10236](https://github.com/directus/directus/pull/10236) Permissions: fix empty permissions
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#10194](https://github.com/directus/directus/pull/10194) fix filter breaking instead of defaulting to `_eq`
    ([@azrikahar](https://github.com/azrikahar))
  - [#10139](https://github.com/directus/directus/pull/10139) Fix compatibility with Postgres <= 10
    ([@Oreilles](https://github.com/Oreilles))
  - [#10138](https://github.com/directus/directus/pull/10138) Fix string filter unexpectedly being casted to number
    ([@Oreilles](https://github.com/Oreilles))
  - [#10084](https://github.com/directus/directus/pull/10084) Fix SQL Server text casting
    ([@Oreilles](https://github.com/Oreilles))
  - [#10083](https://github.com/directus/directus/pull/10083) Fix MySQL `tinyint(1)` not being treated as boolean
    ([@Oreilles](https://github.com/Oreilles))
  - [#9351](https://github.com/directus/directus/pull/9351) Shift hook emits to field service
    ([@licitdev](https://github.com/licitdev))
- **App**
  - [#10251](https://github.com/directus/directus/pull/10251) Handle unexpected filter formats better in system-filter
    ui ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10248](https://github.com/directus/directus/pull/10248) Fix translations relationship setup not syncing o2m col to
    m2o ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10247](https://github.com/directus/directus/pull/10247) Fix login redirect
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10235](https://github.com/directus/directus/pull/10235) Don't go back to page 1 when navigating back from an item
    ([@Oreilles](https://github.com/Oreilles))
  - [#10234](https://github.com/directus/directus/pull/10234) Fix token manipulation on alignment change in images
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#10212](https://github.com/directus/directus/pull/10212) Fix updatePreset behavior
    ([@Oreilles](https://github.com/Oreilles))
  - [#10168](https://github.com/directus/directus/pull/10168) Remove on_delete rule from `user-created` and
    `user-updated` schema ([@Oreilles](https://github.com/Oreilles))
  - [#10124](https://github.com/directus/directus/pull/10124) add default render template & scope to formatted JSON
    display ([@azrikahar](https://github.com/azrikahar))
  - [#10096](https://github.com/directus/directus/pull/10096) Fix ability to change M2O field type and prevent
    incompatible interfaces in advanced mode ([@Oreilles](https://github.com/Oreilles))
  - [#10094](https://github.com/directus/directus/pull/10094) Fix notification not clickable on singleton collection
    ([@Nitwel](https://github.com/Nitwel))
  - [#10075](https://github.com/directus/directus/pull/10075) Fix system collection forms with custom fields
    ([@azrikahar](https://github.com/azrikahar))
  - [#10068](https://github.com/directus/directus/pull/10068) fix translation input blur on revert to old value
    ([@azrikahar](https://github.com/azrikahar))
  - [#9838](https://github.com/directus/directus/pull/9838) fix template fields not clickable when editing
    ([@azrikahar](https://github.com/azrikahar))
  - [#9798](https://github.com/directus/directus/pull/9798) Clear selections after batch edit
    ([@azrikahar](https://github.com/azrikahar))
  - [#9707](https://github.com/directus/directus/pull/9707) Add default values when tracking edits in list interface
    ([@azrikahar](https://github.com/azrikahar))
  - [#9600](https://github.com/directus/directus/pull/9600) fix tree view interface display template
    ([@azrikahar](https://github.com/azrikahar))
  - [#8010](https://github.com/directus/directus/pull/8010) Support 'selectionMode' on tabular and cards
    ([@joselcvarela](https://github.com/joselcvarela))
- **Extensions**
  - [#10242](https://github.com/directus/directus/pull/10242) Fix extension config importing on Windows
    ([@nickrum](https://github.com/nickrum))
- **sdk**
  - [#10053](https://github.com/directus/directus/pull/10053) SDK: Fix bundles
    ([@joselcvarela](https://github.com/joselcvarela))

### :sponge: Optimizations

- **sdk**
  - [#10230](https://github.com/directus/directus/pull/10230) Apply the cleaned up build config to the sdk
    ([@nickrum](https://github.com/nickrum))
  - [#9985](https://github.com/directus/directus/pull/9985) Update BaseStorage
    ([@NilsBaumgartner1994](https://github.com/NilsBaumgartner1994))
- **format-title**
  - [#10204](https://github.com/directus/directus/pull/10204) Clean up format-title build process
    ([@nickrum](https://github.com/nickrum))
- **API**
  - [#10151](https://github.com/directus/directus/pull/10151) Cleaned up Oracle duplicate index handling
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **Misc.**
  - [#10135](https://github.com/directus/directus/pull/10135) Run end-to-end tests only if corresponding files have been
    modified ([@paescuj](https://github.com/paescuj))
- **App**
  - [#9637](https://github.com/directus/directus/pull/9637) Fixing some type errors in app #2
    ([@paescuj](https://github.com/paescuj))
  - [#9212](https://github.com/directus/directus/pull/9212) Use lodash.assign in use-preset.ts
    ([@Oreilles](https://github.com/Oreilles))

### :memo: Documentation

- [#10286](https://github.com/directus/directus/pull/10286) Docs styles ([@azrikahar](https://github.com/azrikahar))
- [#10280](https://github.com/directus/directus/pull/10280) Add note to enable module in settings after completion
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#10278](https://github.com/directus/directus/pull/10278) Add missing docs for collection hierarchy and auth-refresh
  mode ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#10277](https://github.com/directus/directus/pull/10277) Fix border colors in docs dark mode
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#10221](https://github.com/directus/directus/pull/10221) add sidebar link for notifications API reference
  ([@azrikahar](https://github.com/azrikahar))
- [#10184](https://github.com/directus/directus/pull/10184) Documentation tweaks - mentions, notifications etc
  ([@azrikahar](https://github.com/azrikahar))
- [#10174](https://github.com/directus/directus/pull/10174) Removed security hole in hooks doc example
  ([@jaycammarano](https://github.com/jaycammarano))
- [#10104](https://github.com/directus/directus/pull/10104) Docs: Add guide for SSO
  ([@joselcvarela](https://github.com/joselcvarela))
- [#10098](https://github.com/directus/directus/pull/10098) Add dark mode to docs
  ([@u12206050](https://github.com/u12206050))
- [#9574](https://github.com/directus/directus/pull/9574) Add a tip explaining HTTP Only cookies issue
  ([@joeinnes](https://github.com/joeinnes))

## v9.1.2 (November 25, 2021)

### :rocket: Improvements

- **App**
  - [#10051](https://github.com/directus/directus/pull/10051) fix notifications button hover color on dark theme
    ([@azrikahar](https://github.com/azrikahar))

### :bug: Bug Fixes

- **App**
  - [#10057](https://github.com/directus/directus/pull/10057) Fix mysql duplicates
    ([@Nitwel](https://github.com/Nitwel))
  - [#10050](https://github.com/directus/directus/pull/10050) fix roles aggregation query to fit all db vendors
    ([@azrikahar](https://github.com/azrikahar))
  - [#10048](https://github.com/directus/directus/pull/10048) Set isEditorDirty flag to track edits in wysiwyg html
    editor ([@licitdev](https://github.com/licitdev))
  - [#10040](https://github.com/directus/directus/pull/10040) Fix data model folders edit dialog
    ([@azrikahar](https://github.com/azrikahar))

### :memo: Documentation

- [#3456](https://github.com/directus/directus/pull/3456) Add cloudron as installation method
  ([@gramakri](https://github.com/gramakri))

## v9.1.1 (November 24, 2021)

### :bug: Bug Fixes

- **Docker**
  - [#10038](https://github.com/directus/directus/pull/10038) Fix dependency listing
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

## v9.1.0 (November 24, 2021)

### :sparkles: New Features

- **API**
  - [#9861](https://github.com/directus/directus/pull/9861) Add notifications system and support user mentions in
    comments ([@jaycammarano](https://github.com/jaycammarano))
- **App**
  - [#9861](https://github.com/directus/directus/pull/9861) Add notifications system and support user mentions in
    comments ([@jaycammarano](https://github.com/jaycammarano))

### :rocket: Improvements

- **App**
  - [#10009](https://github.com/directus/directus/pull/10009) Fix color picker position
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9989](https://github.com/directus/directus/pull/9989) Support file/files in related-values display
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9959](https://github.com/directus/directus/pull/9959) Use router.replace() to prevent invalid history navigations
    ([@licitdev](https://github.com/licitdev))
  - [#9834](https://github.com/directus/directus/pull/9834) use aggregate count for users in roles view
    ([@azrikahar](https://github.com/azrikahar))
  - [#9763](https://github.com/directus/directus/pull/9763) Relationship field-detail: use `nullable` on `sort` instead
    of condition ([@joselcvarela](https://github.com/joselcvarela))
  - [#9756](https://github.com/directus/directus/pull/9756) Improvement: DRY on applyConditions
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9533](https://github.com/directus/directus/pull/9533) Fix M2O display inside M2M relations
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9334](https://github.com/directus/directus/pull/9334) Add context menu directive
    ([@azrikahar](https://github.com/azrikahar))
- **sdk**
  - [#9965](https://github.com/directus/directus/pull/9965) Add logical operators to the SDK's Filter type
    ([@Oreilles](https://github.com/Oreilles))
  - [#9777](https://github.com/directus/directus/pull/9777) SDK: Start auth refresh job when constructor is initialised
    ([@joeinnes](https://github.com/joeinnes))
- **API**
  - [#9964](https://github.com/directus/directus/pull/9964) Fix issue with OAuth setting incorrect initial session data
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9921](https://github.com/directus/directus/pull/9921) Email updates ([@benhaynes](https://github.com/benhaynes))
  - [#9862](https://github.com/directus/directus/pull/9862) Throw if OpenID provider doesn't support code flow
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9529](https://github.com/directus/directus/pull/9529) Added scope support to LDAP group and user search
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **Extensions**
  - [#9932](https://github.com/directus/directus/pull/9932) Adding sourceMap flag to extensions-sdk cli
    ([@johnhuffsmith](https://github.com/johnhuffsmith))

### :bug: Bug Fixes

- **App**
  - [#10021](https://github.com/directus/directus/pull/10021) Fix tag interface always allowing other values
    ([@Oreilles](https://github.com/Oreilles))
  - [#10005](https://github.com/directus/directus/pull/10005) Fix hidden folders/collections (#9207)
    ([@nazarhanov](https://github.com/nazarhanov))
  - [#9994](https://github.com/directus/directus/pull/9994) Fix roles aggregate query for users count
    ([@azrikahar](https://github.com/azrikahar))
  - [#9992](https://github.com/directus/directus/pull/9992) Fix impossibility to save M2M (alterations not triggered)
    ([@Oreilles](https://github.com/Oreilles))
  - [#9983](https://github.com/directus/directus/pull/9983) Fix date usage in pl-PL
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9982](https://github.com/directus/directus/pull/9982) Allow reordering between groups in data model
    ([@licitdev](https://github.com/licitdev))
  - [#9924](https://github.com/directus/directus/pull/9924) Fix indeterminate properties in advanced field creation
    ([@Oreilles](https://github.com/Oreilles))
  - [#9914](https://github.com/directus/directus/pull/9914) Fix wrong date filter in calendar layout
    ([@Oreilles](https://github.com/Oreilles))
  - [#9890](https://github.com/directus/directus/pull/9890) Fix render-template not working for M2M relationship
    ([@Oreilles](https://github.com/Oreilles))
  - [#9804](https://github.com/directus/directus/pull/9804) Refactor parseFilter to only flatten filter entries that
    need it ([@Oreilles](https://github.com/Oreilles))
  - [#9803](https://github.com/directus/directus/pull/9803) Fix translations input issues
    ([@azrikahar](https://github.com/azrikahar))
  - [#9792](https://github.com/directus/directus/pull/9792) Fix: Make sort visible by default on relationships
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9789](https://github.com/directus/directus/pull/9789) Fix reuse same M2M junction fields
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9750](https://github.com/directus/directus/pull/9750) Remove geometryFormat from map interface options.
    ([@Oreilles](https://github.com/Oreilles))
  - [#9505](https://github.com/directus/directus/pull/9505) Fix timeseries for precision by week
    ([@azrikahar](https://github.com/azrikahar))
  - [#9392](https://github.com/directus/directus/pull/9392) Fix create relation after collection deletion
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9220](https://github.com/directus/directus/pull/9220) Fix create M2M field concurrency
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9056](https://github.com/directus/directus/pull/9056) Fix click event for unconfigured tables
    ([@azrikahar](https://github.com/azrikahar))
- **API**
  - [#10005](https://github.com/directus/directus/pull/10005) Fix hidden folders/collections (#9207)
    ([@nazarhanov](https://github.com/nazarhanov))
  - [#9996](https://github.com/directus/directus/pull/9996) Fix deep groupBy
    ([@azrikahar](https://github.com/azrikahar))
  - [#9993](https://github.com/directus/directus/pull/9993) Fix LDAP race condition
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9599](https://github.com/directus/directus/pull/9599) Fix unexpected types
    ([@GrefriT](https://github.com/GrefriT))
- **schema**
  - [#9822](https://github.com/directus/directus/pull/9822) Handle composite primary keys
    ([@aidenfoxx](https://github.com/aidenfoxx))

### :sponge: Optimizations

- **Misc.**
  - [#10020](https://github.com/directus/directus/pull/10020) Hide Kodiak status when no automerge label
    ([@paescuj](https://github.com/paescuj))
  - [#9981](https://github.com/directus/directus/pull/9981) Capitalize automerge label
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9762](https://github.com/directus/directus/pull/9762) Enable E2E Tests on PRs
    ([@paescuj](https://github.com/paescuj))

### :memo: Documentation

- [#10033](https://github.com/directus/directus/pull/10033) Reorganize the Hooks Documentation
  ([@jaycammarano](https://github.com/jaycammarano))
- [#9998](https://github.com/directus/directus/pull/9998) Update iis.md
  ([@paulboudewijn](https://github.com/paulboudewijn))
- [#9891](https://github.com/directus/directus/pull/9891) Docs SDK: Improve usage example
  ([@joselcvarela](https://github.com/joselcvarela))
- [#9865](https://github.com/directus/directus/pull/9865) Docs SDK: `BaseStorage` instead of `IStorage`
  ([@joselcvarela](https://github.com/joselcvarela))
- [#9836](https://github.com/directus/directus/pull/9836) Prevent interpolation for url variable
  ([@azrikahar](https://github.com/azrikahar))
- [#9800](https://github.com/directus/directus/pull/9800) Update documentation for project settings
  ([@azrikahar](https://github.com/azrikahar))
- [#9799](https://github.com/directus/directus/pull/9799) Fix docs tables overflow
  ([@azrikahar](https://github.com/azrikahar))
- [#9766](https://github.com/directus/directus/pull/9766) Update iis.md
  ([@paulboudewijn](https://github.com/paulboudewijn))
- [#9529](https://github.com/directus/directus/pull/9529) Added scope support to LDAP group and user search
  ([@aidenfoxx](https://github.com/aidenfoxx))

### :package: Dependency Updates

- [#9969](https://github.com/directus/directus/pull/9969) Update mariadb Docker tag to v10.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9968](https://github.com/directus/directus/pull/9968) Update NPM dependencies (non-major)
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.1 (November 11, 2021)

### :rocket: Improvements

- **App**
  - [#9732](https://github.com/directus/directus/pull/9732) Add missing translations
    ([@dimitrov-adrian](https://github.com/dimitrov-adrian))
  - [#9706](https://github.com/directus/directus/pull/9706) Add field type to field select tooltip
    ([@azrikahar](https://github.com/azrikahar))
  - [#9674](https://github.com/directus/directus/pull/9674) Clean up save-options
    ([@licitdev](https://github.com/licitdev))
  - [#9644](https://github.com/directus/directus/pull/9644) Allow for discarding of changes without leaving
    ([@licitdev](https://github.com/licitdev))
  - [#9638](https://github.com/directus/directus/pull/9638) Show items for all days in calendar layout
    ([@Oreilles](https://github.com/Oreilles))
  - [#9618](https://github.com/directus/directus/pull/9618) Import 'Fira Mono' & 'Merriweather' into WYSIWYG
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9558](https://github.com/directus/directus/pull/9558) Data model dense
    ([@benhaynes](https://github.com/benhaynes))
  - [#9557](https://github.com/directus/directus/pull/9557) Sidebar styling ([@benhaynes](https://github.com/benhaynes))
  - [#9555](https://github.com/directus/directus/pull/9555) remove extra popup padding
    ([@benhaynes](https://github.com/benhaynes))
  - [#9554](https://github.com/directus/directus/pull/9554) small text update
    ([@benhaynes](https://github.com/benhaynes))
  - [#9532](https://github.com/directus/directus/pull/9532) divider title placeholder
    ([@benhaynes](https://github.com/benhaynes))
  - [#9504](https://github.com/directus/directus/pull/9504) fix repeater field names title format
    ([@azrikahar](https://github.com/azrikahar))
- **API**
  - [#9625](https://github.com/directus/directus/pull/9625) Add support for AWS SES mailer transport
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9616](https://github.com/directus/directus/pull/9616) Expose server instance in action hook 'server.start'
    ([@gkielwasser](https://github.com/gkielwasser))

### :bug: Bug Fixes

- **App**
  - [#9738](https://github.com/directus/directus/pull/9738) Fix relations lookup in m2m/m2a advanced edit existing
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9735](https://github.com/directus/directus/pull/9735) Fix make sort field null if empty in relationships
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9711](https://github.com/directus/directus/pull/9711) Apply cloneDeep to relations in FieldDetailStore
    ([@azrikahar](https://github.com/azrikahar))
  - [#9708](https://github.com/directus/directus/pull/9708) Ensure update of one_field in m2o
    ([@azrikahar](https://github.com/azrikahar))
  - [#9662](https://github.com/directus/directus/pull/9662) Patch parameter type for syncRefProperty
    ([@licitdev](https://github.com/licitdev))
  - [#9632](https://github.com/directus/directus/pull/9632) Fix field schema unique option
    ([@azrikahar](https://github.com/azrikahar))
  - [#9615](https://github.com/directus/directus/pull/9615) Fix unexpected camera update and unavailable clustering
    option in map ([@Oreilles](https://github.com/Oreilles))
  - [#9612](https://github.com/directus/directus/pull/9612) fixes: #9568 ([@benhaynes](https://github.com/benhaynes))
  - [#9609](https://github.com/directus/directus/pull/9609) Fix existing files drawer selection
    ([@licitdev](https://github.com/licitdev))
  - [#9593](https://github.com/directus/directus/pull/9593) Include default values when validating field conditions
    ([@licitdev](https://github.com/licitdev))
  - [#9588](https://github.com/directus/directus/pull/9588) Fix repeater interface template
    ([@azrikahar](https://github.com/azrikahar))
  - [#9584](https://github.com/directus/directus/pull/9584) Fix presets layout query/options edits on load
    ([@azrikahar](https://github.com/azrikahar))
  - [#9548](https://github.com/directus/directus/pull/9548) Fix lose data on M2M
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9537](https://github.com/directus/directus/pull/9537) Fix missing and wrong translations
    ([@dimitrov-adrian](https://github.com/dimitrov-adrian))
  - [#9530](https://github.com/directus/directus/pull/9530) fix elements z-index higher than app header bar
    ([@azrikahar](https://github.com/azrikahar))
  - [#9522](https://github.com/directus/directus/pull/9522) Remove quotes on string values in raw display
    ([@paescuj](https://github.com/paescuj))
  - [#9451](https://github.com/directus/directus/pull/9451) Fix m2m links in related values to target related collection
    ([@Toilal](https://github.com/Toilal))
- **API**
  - [#9726](https://github.com/directus/directus/pull/9726) Fix nested union query filter
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9677](https://github.com/directus/directus/pull/9677) Exclude hidden Oracle SYS columns
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9666](https://github.com/directus/directus/pull/9666) [API] m2a filtering fix ([@d1rOn](https://github.com/d1rOn))
  - [#9661](https://github.com/directus/directus/pull/9661) Emit `auth.jwt` on refresh
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9652](https://github.com/directus/directus/pull/9652) Fix relation not having collection and field values
    ([@Nitwel](https://github.com/Nitwel))
  - [#9635](https://github.com/directus/directus/pull/9635) Fixed Oracle special geometry migration
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9629](https://github.com/directus/directus/pull/9629) Don't cache root index.html
    ([@azrikahar](https://github.com/azrikahar))
  - [#9621](https://github.com/directus/directus/pull/9621) Fix MySQL wkt conversion and fix SRID for Postgres geometry
    columns ([@Oreilles](https://github.com/Oreilles))
  - [#9598](https://github.com/directus/directus/pull/9598) Use "access_token" with "openid-client" to fix Facebook auth
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **Misc.**
  - [#9656](https://github.com/directus/directus/pull/9656) Add wait to await database
    ([@jaycammarano](https://github.com/jaycammarano))
- **sdk**
  - [#9535](https://github.com/directus/directus/pull/9535) Include the ESM entrypoint when publishing to npm
    ([@nickrum](https://github.com/nickrum))

### :sponge: Optimizations

- **Misc.**
  - [#9594](https://github.com/directus/directus/pull/9594) Fix PR title for major updates from renovate
    ([@paescuj](https://github.com/paescuj))
  - [#9517](https://github.com/directus/directus/pull/9517) Add note about Directus version in bug report
    ([@paescuj](https://github.com/paescuj))
  - [#9514](https://github.com/directus/directus/pull/9514) Update Docker installation documentation
    ([@paescuj](https://github.com/paescuj))
  - [#9509](https://github.com/directus/directus/pull/9509) Update package-lock.json & fix warning from eslint
    ([@paescuj](https://github.com/paescuj))
  - [#9508](https://github.com/directus/directus/pull/9508) Revert "Schedule Renovate on a daily basis for now (#9488)"
    ([@paescuj](https://github.com/paescuj))
- **Docker**
  - [#9512](https://github.com/directus/directus/pull/9512) No 'latest' Docker tag on pre-releases anymore
    ([@paescuj](https://github.com/paescuj))

### :memo: Documentation

- [#9689](https://github.com/directus/directus/pull/9689) Add references for social & material icons
  ([@azrikahar](https://github.com/azrikahar))
- [#9657](https://github.com/directus/directus/pull/9657) Use Postgis image in docker-compose example from the docs
  ([@Oreilles](https://github.com/Oreilles))
- [#9616](https://github.com/directus/directus/pull/9616) Expose server instance in action hook 'server.start'
  ([@gkielwasser](https://github.com/gkielwasser))
- [#9612](https://github.com/directus/directus/pull/9612) fixes: #9568 ([@benhaynes](https://github.com/benhaynes))
- [#9611](https://github.com/directus/directus/pull/9611) fix in-app docs homepage
  ([@benhaynes](https://github.com/benhaynes))
- [#9610](https://github.com/directus/directus/pull/9610) update in-app docs nav
  ([@benhaynes](https://github.com/benhaynes))
- [#9608](https://github.com/directus/directus/pull/9608) link updates ([@benhaynes](https://github.com/benhaynes))
- [#9607](https://github.com/directus/directus/pull/9607) collections to content
  ([@benhaynes](https://github.com/benhaynes))
- [#9606](https://github.com/directus/directus/pull/9606) clean up in-app docs
  ([@benhaynes](https://github.com/benhaynes))
- [#9605](https://github.com/directus/directus/pull/9605) doc app links should not point externally
  ([@benhaynes](https://github.com/benhaynes))
- [#9553](https://github.com/directus/directus/pull/9553) Minor docs fixes ([@azrikahar](https://github.com/azrikahar))
- [#9514](https://github.com/directus/directus/pull/9514) Update Docker installation documentation
  ([@paescuj](https://github.com/paescuj))
- [#9513](https://github.com/directus/directus/pull/9513) Remove note about RC in the readme
  ([@paescuj](https://github.com/paescuj))

### :package: Dependency Updates

- [#9585](https://github.com/directus/directus/pull/9585) Update NPM dependencies (non-major)
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9506](https://github.com/directus/directus/pull/9506) Update NPM dependencies (non-major)
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0 (November 4, 2021)

### :rocket: Improvements

- **create-directus-project**
  - [#9496](https://github.com/directus/directus/pull/9496) Don't show all migrations logged on init
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#9491](https://github.com/directus/directus/pull/9491) Remove beta flag from insights
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9490](https://github.com/directus/directus/pull/9490) Remove collection listing option from role settings
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9487](https://github.com/directus/directus/pull/9487) Removes "Collections Navigation" setting from roles detail
    page ([@YannickMol](https://github.com/YannickMol))

### :bug: Bug Fixes

- **sdk**
  - [#9502](https://github.com/directus/directus/pull/9502) Fix importing the SDK from a Node ESM environment
    ([@nickrum](https://github.com/nickrum))
- **API**
  - [#9501](https://github.com/directus/directus/pull/9501) Prevent negative hashes from being generated
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9494](https://github.com/directus/directus/pull/9494) Move union query application to applyQuery, fix where clause
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9448](https://github.com/directus/directus/pull/9448) Use hash instead of random for default index name
    ([@faridsaud](https://github.com/faridsaud))
- **App**
  - [#9485](https://github.com/directus/directus/pull/9485) Fix presentation-links interfaces
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9484](https://github.com/directus/directus/pull/9484) Fix m2a relations on editing field
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9483](https://github.com/directus/directus/pull/9483) Fix nested system-interface-options usage
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9477](https://github.com/directus/directus/pull/9477) Resolve calendar link to detail page
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9432](https://github.com/directus/directus/pull/9432) Properly handle M2A fields in fieldStore and useFieldTree
    ([@Oreilles](https://github.com/Oreilles))
  - [#9420](https://github.com/directus/directus/pull/9420) Fix invalid collection for Interface Display Template for
    M2M relationships ([@Toilal](https://github.com/Toilal))
  - [#9407](https://github.com/directus/directus/pull/9407) Fix render template for number template parts (#9406)
    ([@Toilal](https://github.com/Toilal))
  - [#9397](https://github.com/directus/directus/pull/9397) Update geometric types and patch new field flow.
    ([@Oreilles](https://github.com/Oreilles))

### :sponge: Optimizations

- **App**
  - [#9466](https://github.com/directus/directus/pull/9466) Fixing some type errors in app
    ([@paescuj](https://github.com/paescuj))
  - [#9447](https://github.com/directus/directus/pull/9447) Clean up interface options type
    ([@nickrum](https://github.com/nickrum))

### :memo: Documentation

- [#9497](https://github.com/directus/directus/pull/9497) Small fixes for Hooks documentation
  ([@tylerforesthauser](https://github.com/tylerforesthauser))
- [#9489](https://github.com/directus/directus/pull/9489) Clarify hook register function parameter descriptions in docs
  ([@nickrum](https://github.com/nickrum))
- [#9486](https://github.com/directus/directus/pull/9486) Fix docs about SDK refactor
  ([@joselcvarela](https://github.com/joselcvarela))
- [#9450](https://github.com/directus/directus/pull/9450) fix docs homepage header responsiveness
  ([@azrikahar](https://github.com/azrikahar))

## v9.0.0-rc.101 (November 3, 2021)

### ⚠️ Breaking Changes

- **Hooks** have an updated way of registering them, that makes an explicit split between actions, filters, init, and
  scheduler hooks (h/t @smilledge). All the previous functionality is still available, but you will have to update your
  custom hooks to fit the new structure. Please see [the updated docs](https://docs.directus.io/extensions/hooks/) for
  more information. (https://github.com/directus/directus/pull/8027)
- The Collections module has been renamed to Content. If you had a custom module bar override configured in project
  settings, you might have to re-enable the ~~collections~~ content module.
  (https://github.com/directus/directus/pull/9441)
- The type signature for the internal Accountability and SchemaOverview objects have changed slightly. Permissions are
  now stored under Accountability instead of SchemaOverview. If you were relying on the permissions existing under
  SchemaOverview, please make sure to update your code to rely on Accountability instead.
  (https://github.com/directus/directus/pull/9376)

### :sparkles: New Features

- **API**
  - :warning: [#9376](https://github.com/directus/directus/pull/9376) Allow dynamic user variables to be used with
    filter rules (cont.) ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - :warning: [#9376](https://github.com/directus/directus/pull/9376) Allow dynamic user variables to be used with
    filter rules (cont.) ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :rocket: Improvements

- **App**
  - [#9446](https://github.com/directus/directus/pull/9446) Rename activity->notifications module
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - :warning: [#9441](https://github.com/directus/directus/pull/9441) Rename Collections Modules to Content Module
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9440](https://github.com/directus/directus/pull/9440) Tweak project-settings page
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9387](https://github.com/directus/directus/pull/9387) Add the generic stroke to notice preview icon
    ([@azrikahar](https://github.com/azrikahar))
  - [#9362](https://github.com/directus/directus/pull/9362) remove default color options from labels display
    ([@benhaynes](https://github.com/benhaynes))
  - [#9337](https://github.com/directus/directus/pull/9337) Add placeholder to Language Indicator Field for first
    Translations setup ([@azrikahar](https://github.com/azrikahar))
  - [#9297](https://github.com/directus/directus/pull/9297) Add shadows to v-menu angles
    ([@dimitrov-adrian](https://github.com/dimitrov-adrian))
  - [#9295](https://github.com/directus/directus/pull/9295) Set calendar height to 100%
    ([@Oreilles](https://github.com/Oreilles))
  - [#9292](https://github.com/directus/directus/pull/9292) Update translation icon in interface selector
    ([@azrikahar](https://github.com/azrikahar))
  - [#9288](https://github.com/directus/directus/pull/9288) Map layout and interface improvements
    ([@Oreilles](https://github.com/Oreilles))
  - [#9285](https://github.com/directus/directus/pull/9285) Filter files by folder when an upload folder is specified in
    the file interface ([@azrikahar](https://github.com/azrikahar))
  - [#9282](https://github.com/directus/directus/pull/9282) Prevent file interface from preloading "Choose from Library"
    drawer ([@azrikahar](https://github.com/azrikahar))
  - [#9281](https://github.com/directus/directus/pull/9281) Improve disabled interface selector style
    ([@azrikahar](https://github.com/azrikahar))
  - [#9271](https://github.com/directus/directus/pull/9271) Context menu improvements
    ([@azrikahar](https://github.com/azrikahar))
  - [#9270](https://github.com/directus/directus/pull/9270) Fix: disable sort field for singleton collections
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#8497](https://github.com/directus/directus/pull/8497) Fix nullable boolean
    ([@paulboudewijn](https://github.com/paulboudewijn))
- **Misc.**
  - [#9443](https://github.com/directus/directus/pull/9443) Add exports fields to all packages
    ([@nickrum](https://github.com/nickrum))
- **API**
  - [#9368](https://github.com/directus/directus/pull/9368) Added fallback to "id_token" info if profile URL not defined
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9307](https://github.com/directus/directus/pull/9307) Feat/custom ldap mail attribute
    ([@dorianim](https://github.com/dorianim))
  - [#9305](https://github.com/directus/directus/pull/9305) Add SET NULL to directus_files.uploaded_by constraint
    ([@jaycammarano](https://github.com/jaycammarano))
  - [#9289](https://github.com/directus/directus/pull/9289) Added state param to OAuth to make Okta happy
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#8497](https://github.com/directus/directus/pull/8497) Fix nullable boolean
    ([@paulboudewijn](https://github.com/paulboudewijn))
  - :warning: [#8027](https://github.com/directus/directus/pull/8027) Rework hook registration
    ([@nickrum](https://github.com/nickrum))

### :bug: Bug Fixes

- **Misc.**
  - [#9437](https://github.com/directus/directus/pull/9437) Fix duplicate chat widget injection
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **API**
  - [#9425](https://github.com/directus/directus/pull/9425) Fixed SET NULL on directus_files for MSSQL
    ([@jaycammarano](https://github.com/jaycammarano))
  - [#9381](https://github.com/directus/directus/pull/9381) Set user token as unique
    ([@azrikahar](https://github.com/azrikahar))
  - [#9339](https://github.com/directus/directus/pull/9339) Added user rebinding on reconnect in LDAP
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9318](https://github.com/directus/directus/pull/9318) fix(graphql): remove \_\_typename from selection nodes when
    present ([@8byr0](https://github.com/8byr0))
  - [#9314](https://github.com/directus/directus/pull/9314) Fix aggregation needing the table name to avoid ambiguous
    ([@danilopolani](https://github.com/danilopolani))
  - [#9310](https://github.com/directus/directus/pull/9310) Update Oracle to support `is_generated`
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9300](https://github.com/directus/directus/pull/9300) Removed empty list check in validateList.
    ([@Oreilles](https://github.com/Oreilles))
  - [#9290](https://github.com/directus/directus/pull/9290) Fix geometry support check
    ([@Oreilles](https://github.com/Oreilles))
  - [#7774](https://github.com/directus/directus/pull/7774) Fix date on sqlite ([@Nitwel](https://github.com/Nitwel))
- **App**
  - [#9414](https://github.com/directus/directus/pull/9414) Fix hover effect on o2m and m2a lists (#9412)
    ([@Toilal](https://github.com/Toilal))
  - [#9403](https://github.com/directus/directus/pull/9403) Use primary key as default sort in map layout
    ([@Oreilles](https://github.com/Oreilles))
  - [#9401](https://github.com/directus/directus/pull/9401) Fix related value for alias typed fields (#9210)
    ([@Toilal](https://github.com/Toilal))
  - [#9393](https://github.com/directus/directus/pull/9393) Fix corresponding field name
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9353](https://github.com/directus/directus/pull/9353) Fix condition to translate directus collections
    ([@paescuj](https://github.com/paescuj))
  - [#9349](https://github.com/directus/directus/pull/9349) fix M2A field creation unable to be saved
    ([@azrikahar](https://github.com/azrikahar))
  - [#9333](https://github.com/directus/directus/pull/9333) Translations interface fix
    ([@d1rOn](https://github.com/d1rOn))
  - [#9324](https://github.com/directus/directus/pull/9324) Fix issues with fields config
    ([@Nitwel](https://github.com/Nitwel))
  - [#9301](https://github.com/directus/directus/pull/9301) Fix selection of "Group" field types
    ([@danilopolani](https://github.com/danilopolani))
  - [#9291](https://github.com/directus/directus/pull/9291) Show lint errors for code input type JSON
    ([@azrikahar](https://github.com/azrikahar))
  - [#9269](https://github.com/directus/directus/pull/9269) Fixed nullable and unique options disabled in advanced field
    settings ([@Oreilles](https://github.com/Oreilles))
  - [#8104](https://github.com/directus/directus/pull/8104) Translate system fields when creating new collections
    ([@azrikahar](https://github.com/azrikahar))
- **schema**
  - [#9260](https://github.com/directus/directus/pull/9260) Removed invalid column in mssql schema inspector
    ([@Oreilles](https://github.com/Oreilles))

### :sponge: Optimizations

- **API**
  - [#9418](https://github.com/directus/directus/pull/9418) Clean up API exports
    ([@nickrum](https://github.com/nickrum))
- **Misc.**
  - [#9408](https://github.com/directus/directus/pull/9408) Enhance comments in CI workflow
    ([@paescuj](https://github.com/paescuj))
  - [#9404](https://github.com/directus/directus/pull/9404) Relocate renovate config to .github
    ([@paescuj](https://github.com/paescuj))
  - [#9394](https://github.com/directus/directus/pull/9394) Link to all (open & closed) issues in bug report
    ([@paescuj](https://github.com/paescuj))
  - [#9357](https://github.com/directus/directus/pull/9357) Fix eslint warnings ([@paescuj](https://github.com/paescuj))
  - [#9309](https://github.com/directus/directus/pull/9309) Removed undefined type from LDAP userAccountControl
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9265](https://github.com/directus/directus/pull/9265) Add workflow-dispatch flag to e2e-tests.yml to allow manual
    workflow runs ([@jaycammarano](https://github.com/jaycammarano))
  - [#9240](https://github.com/directus/directus/pull/9240) Revise GitHub workflows #2
    ([@paescuj](https://github.com/paescuj))
- **App**
  - [#9287](https://github.com/directus/directus/pull/9287) Fix lint warnings in app
    ([@azrikahar](https://github.com/azrikahar))

### :memo: Documentation

- [#9437](https://github.com/directus/directus/pull/9437) Fix duplicate chat widget injection
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#9382](https://github.com/directus/directus/pull/9382) Update tfa_secret description in users.md
  ([@azrikahar](https://github.com/azrikahar))
- [#9373](https://github.com/directus/directus/pull/9373) add live chat to public docs
  ([@benhaynes](https://github.com/benhaynes))
- [#9354](https://github.com/directus/directus/pull/9354) Fixes broken links in the documentation
  ([@jaycammarano](https://github.com/jaycammarano))
- [#9327](https://github.com/directus/directus/pull/9327) Fixes broken docs links
  ([@jaycammarano](https://github.com/jaycammarano))
- [#9325](https://github.com/directus/directus/pull/9325) Fixes dead links in docs site.
  ([@jaycammarano](https://github.com/jaycammarano))
- [#9321](https://github.com/directus/directus/pull/9321) add content and fix broken links
  ([@benhaynes](https://github.com/benhaynes))
- [#9256](https://github.com/directus/directus/pull/9256) Fixed GitHub oauth config in docs
  ([@aidenfoxx](https://github.com/aidenfoxx))
- [#9218](https://github.com/directus/directus/pull/9218) Update config-options.md
  ([@aidenfoxx](https://github.com/aidenfoxx))

### :package: Dependency Updates

- [#9436](https://github.com/directus/directus/pull/9436) Update dependency pinia to v2.0.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9428](https://github.com/directus/directus/pull/9428) Update dependency pinia to v2.0.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9386](https://github.com/directus/directus/pull/9386) Update fullcalendar monorepo to v5.10.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9385](https://github.com/directus/directus/pull/9385) Update dependency tinymce to v5.10.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9380](https://github.com/directus/directus/pull/9380) Update dependency mime to v3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9378](https://github.com/directus/directus/pull/9378) Update dependency knex to v0.95.13
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9377](https://github.com/directus/directus/pull/9377) Update dependency @types/ldapjs to v2.2.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9370](https://github.com/directus/directus/pull/9370) Update dependency mime to v2.6.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9367](https://github.com/directus/directus/pull/9367) Update gatsby monorepo to v4.1.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9359](https://github.com/directus/directus/pull/9359) Update dependency marked to v3.0.8
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9352](https://github.com/directus/directus/pull/9352) Update dependency @types/sharp to v0.29.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9341](https://github.com/directus/directus/pull/9341) Update vue monorepo to v3.2.21
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9317](https://github.com/directus/directus/pull/9317) Update typescript-eslint monorepo to v5.3.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9293](https://github.com/directus/directus/pull/9293) Update dependency rollup to v2.59.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9221](https://github.com/directus/directus/pull/9221) Update dependency npm to v8.1.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9202](https://github.com/directus/directus/pull/9202) Update dependency openid-client to v5
  ([@renovate[bot]](https://github.com/apps/renovate))

Directus refs/tags/v9.0.0-rc.101

## v9.0.0-rc.100 (October 29, 2021)

### :sparkles: New Features

- **App**
  - [#9109](https://github.com/directus/directus/pull/9109) Add new field flow
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **API**
  - [#9074](https://github.com/directus/directus/pull/9074) LDAP auth provider
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#8855](https://github.com/directus/directus/pull/8855) Add configurable headers for webhooks
    ([@Jakob-em](https://github.com/Jakob-em))

### :rocket: Improvements

- **App**
  - [#9239](https://github.com/directus/directus/pull/9239) Map interface improvements
    ([@Oreilles](https://github.com/Oreilles))
  - [#9184](https://github.com/directus/directus/pull/9184) Add missing options to the files interface
    ([@Oreilles](https://github.com/Oreilles))
  - [#9183](https://github.com/directus/directus/pull/9183) Remove toLowerCase for dbSafe fields
    ([@GrefriT](https://github.com/GrefriT))
  - [#9115](https://github.com/directus/directus/pull/9115) Feat: allow ctrl click to open new tab on tabular
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9112](https://github.com/directus/directus/pull/9112) Ignore codemirror mode import types
    ([@Oreilles](https://github.com/Oreilles))
  - [#9103](https://github.com/directus/directus/pull/9103) Use default filter operator for type in filter input.
    ([@Oreilles](https://github.com/Oreilles))
  - [#9041](https://github.com/directus/directus/pull/9041) Use textarea input for textarea placeholder
    ([@azrikahar](https://github.com/azrikahar))
- **API**
  - :warning: [#9199](https://github.com/directus/directus/pull/9199) Export API dist folder at the root of the package
    path ([@nickrum](https://github.com/nickrum))
  - [#9103](https://github.com/directus/directus/pull/9103) Use default filter operator for type in filter input.
    ([@Oreilles](https://github.com/Oreilles))
  - [#9059](https://github.com/directus/directus/pull/9059) Added the provider to auth hooks
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **shared**
  - [#9103](https://github.com/directus/directus/pull/9103) Use default filter operator for type in filter input.
    ([@Oreilles](https://github.com/Oreilles))

### :bug: Bug Fixes

- **API**
  - [#9200](https://github.com/directus/directus/pull/9200) Fix generated columns being required.
    ([@Oreilles](https://github.com/Oreilles))
  - [#9186](https://github.com/directus/directus/pull/9186) Set no-cache header on extension sources
    ([@nickrum](https://github.com/nickrum))
  - [#9153](https://github.com/directus/directus/pull/9153) Ignore email field in oauth and store email in
    external_identifier ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9126](https://github.com/directus/directus/pull/9126) Fix localstorage file deletion
    ([@paulboudewijn](https://github.com/paulboudewijn))
  - [#9122](https://github.com/directus/directus/pull/9122) Always cast M2A related primary keys to text.
    ([@Oreilles](https://github.com/Oreilles))
- **App**
  - [#9200](https://github.com/directus/directus/pull/9200) Fix generated columns being required.
    ([@Oreilles](https://github.com/Oreilles))
  - [#9187](https://github.com/directus/directus/pull/9187) Always show folder icon for alias tables (folders)
    ([@Oreilles](https://github.com/Oreilles))
  - [#9180](https://github.com/directus/directus/pull/9180) Fix dynamic variables not working anymore in UUID filter
    ([@Oreilles](https://github.com/Oreilles))
  - [#9179](https://github.com/directus/directus/pull/9179) Fix dynamic translations import
    ([@Oreilles](https://github.com/Oreilles))
  - [#9143](https://github.com/directus/directus/pull/9143) fix time series date field allow list
    ([@azrikahar](https://github.com/azrikahar))
  - [#9118](https://github.com/directus/directus/pull/9118) Fix field tree not updating appropriately.
    ([@Oreilles](https://github.com/Oreilles))
  - [#9116](https://github.com/directus/directus/pull/9116) Fix filter added twice and remove unnecessary `_and` node.
    ([@Oreilles](https://github.com/Oreilles))
  - [#9113](https://github.com/directus/directus/pull/9113) Fix: no options in repeater causes empty page
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#9070](https://github.com/directus/directus/pull/9070) Change v-checkbox background color when disabled
    ([@Oreilles](https://github.com/Oreilles))
  - [#9067](https://github.com/directus/directus/pull/9067) Do not listen to the clicks of the ghosts
    ([@Oreilles](https://github.com/Oreilles))
  - [#9062](https://github.com/directus/directus/pull/9062) Append `access_token` to images in WYSIWYG only once
    ([@danilopolani](https://github.com/danilopolani))
  - [#9054](https://github.com/directus/directus/pull/9054) Update SSO links to correctly continue
    ([@aidenfoxx](https://github.com/aidenfoxx))

### :sponge: Optimizations

- **API**
  - [#9192](https://github.com/directus/directus/pull/9192) Clean up App base url replacement
    ([@nickrum](https://github.com/nickrum))
  - [#9058](https://github.com/directus/directus/pull/9058) Improved invalid JWT handling
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **App**
  - [#9190](https://github.com/directus/directus/pull/9190) Clean up App type shims
    ([@nickrum](https://github.com/nickrum))
- **Misc.**
  - [#9011](https://github.com/directus/directus/pull/9011) Revise GitHub workflows
    ([@paescuj](https://github.com/paescuj))

### :memo: Documentation

- [#9203](https://github.com/directus/directus/pull/9203) Clarified some oauth things in the docs
  ([@aidenfoxx](https://github.com/aidenfoxx))
- [#9172](https://github.com/directus/directus/pull/9172) Fixes broken links in docs
  ([@jaycammarano](https://github.com/jaycammarano))
- [#9170](https://github.com/directus/directus/pull/9170) Re-add missing oauth docs
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#9142](https://github.com/directus/directus/pull/9142) Docs: improve running locally
  ([@joselcvarela](https://github.com/joselcvarela))
- [#9071](https://github.com/directus/directus/pull/9071) Docs structure ([@benhaynes](https://github.com/benhaynes))
- [#9068](https://github.com/directus/directus/pull/9068) Update running-locally.md
  ([@paulboudewijn](https://github.com/paulboudewijn))
- [#9063](https://github.com/directus/directus/pull/9063) Update introduction.md
  ([@paulboudewijn](https://github.com/paulboudewijn))

### :package: Dependency Updates

- [#9238](https://github.com/directus/directus/pull/9238) Pin dependency @types/ldapjs to 2.2.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9206](https://github.com/directus/directus/pull/9206) Update dependency vite-plugin-md to v0.11.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9205](https://github.com/directus/directus/pull/9205) Update dependency pinia to v2.0.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9195](https://github.com/directus/directus/pull/9195) Update dependency simple-git-hooks to v2.7.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9193](https://github.com/directus/directus/pull/9193) Update dependency vite to v2.6.13
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9181](https://github.com/directus/directus/pull/9181) Update dependency @vitejs/plugin-vue to v1.9.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9177](https://github.com/directus/directus/pull/9177) Update dependency sass to v1.43.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9175](https://github.com/directus/directus/pull/9175) Update dependency lint-staged to v11.2.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9174](https://github.com/directus/directus/pull/9174) Update Node.js to v16.13.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9169](https://github.com/directus/directus/pull/9169) Update dependency vite to v2.6.12
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9168](https://github.com/directus/directus/pull/9168) Update dependency stylelint to v14.0.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9159](https://github.com/directus/directus/pull/9159) Update dependency knex-schema-inspector to v1.6.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9155](https://github.com/directus/directus/pull/9155) Update dependency lint-staged to v11.2.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9141](https://github.com/directus/directus/pull/9141) Update dependency micromark to v3.0.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9140](https://github.com/directus/directus/pull/9140) Pin dependency stylelint-config-standard to 23.0.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9137](https://github.com/directus/directus/pull/9137) Update Node.js to v16.12.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9136](https://github.com/directus/directus/pull/9136) Update dependency @types/async to v3.2.9
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9133](https://github.com/directus/directus/pull/9133) Update typescript-eslint monorepo to v5.2.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9132](https://github.com/directus/directus/pull/9132) Update dependency axios to v0.24.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9131](https://github.com/directus/directus/pull/9131) Update dependency pinia to v2.0.0-rc.15
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9121](https://github.com/directus/directus/pull/9121) Update dependency vite to v2.6.11
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9100](https://github.com/directus/directus/pull/9100) Update dependency lint-staged to v11.2.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9096](https://github.com/directus/directus/pull/9096) Update dependency @types/busboy to v0.3.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9091](https://github.com/directus/directus/pull/9091) Update dependency eslint to v8.1.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9090](https://github.com/directus/directus/pull/9090) Update dependency @types/js-yaml to v4.0.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9083](https://github.com/directus/directus/pull/9083) Update dependency ts-node to v10.4.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9042](https://github.com/directus/directus/pull/9042) Update dependency oracledb to v5.3.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9035](https://github.com/directus/directus/pull/9035) Update dependency sass to v1.43.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9026](https://github.com/directus/directus/pull/9026) Update dependency stylelint-config-standard to v23
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9016](https://github.com/directus/directus/pull/9016) Update dependency stylelint to v14
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.99 (October 21, 2021)

### ⚠️ Potential Breaking Changes

The old grant-based oAuth2 setup has been replaced by the new `oauth2` driver. This new setup uses (slightly) different
names for its environment variables. Please refer to https://docs.directus.io/reference/environment-variables/#auth for
the correct names and update your environment where required.

### :sparkles: New Features

- **API**
  - :warning: [#8660](https://github.com/directus/directus/pull/8660) New OpenID and OAuth2 drivers
    ([@aidenfoxx](https://github.com/aidenfoxx))

### :rocket: Improvements

- **App**
  - [#8995](https://github.com/directus/directus/pull/8995) Map layout and interface: fixes and improvements
    ([@Oreilles](https://github.com/Oreilles))
  - [#8954](https://github.com/directus/directus/pull/8954) Improve folder picker selection highlight
    ([@azrikahar](https://github.com/azrikahar))
  - [#8937](https://github.com/directus/directus/pull/8937) add default preset for webhooks page
    ([@azrikahar](https://github.com/azrikahar))
  - [#8929](https://github.com/directus/directus/pull/8929) Tweak styling of the map layout
    ([@benhaynes](https://github.com/benhaynes))
  - [#8908](https://github.com/directus/directus/pull/8908) Map layout and interface improvements
    ([@Oreilles](https://github.com/Oreilles))
- **sdk**
  - [#8863](https://github.com/directus/directus/pull/8863) Add geo operators to FilterOperators type
    ([@TheBeastOfCaerbannog](https://github.com/TheBeastOfCaerbannog))

### :bug: Bug Fixes

- **API**
  - [#9029](https://github.com/directus/directus/pull/9029) Cast "DB_EXCLUDE_TABLES" to array
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9024](https://github.com/directus/directus/pull/9024) Update users.ts ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#9012](https://github.com/directus/directus/pull/9012) Fix #8402 ([@filipproch](https://github.com/filipproch))
  - [#8944](https://github.com/directus/directus/pull/8944) Fix o2m-resolver memory issue
    ([@Oreilles](https://github.com/Oreilles))
  - [#8864](https://github.com/directus/directus/pull/8864) Fix collections endpoint not filtering `DB_EXCLUDE_TABLES`
    env ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8814](https://github.com/directus/directus/pull/8814) Only unflatten item properties that needs to be unflattened
    ([@Oreilles](https://github.com/Oreilles))
- **App**
  - [#9019](https://github.com/directus/directus/pull/9019) Allow filesize display for bigInteger fields
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#9010](https://github.com/directus/directus/pull/9010) Fix error with table manual sort
    ([@Oreilles](https://github.com/Oreilles))
  - [#9007](https://github.com/directus/directus/pull/9007) Fix click on relational filters with children
    ([@licitdev](https://github.com/licitdev))
  - [#9002](https://github.com/directus/directus/pull/9002) Sort child collections in navigation
    ([@Oreilles](https://github.com/Oreilles))
  - [#8939](https://github.com/directus/directus/pull/8939) hide folder-collections in permissions settings
    ([@azrikahar](https://github.com/azrikahar))
  - [#8938](https://github.com/directus/directus/pull/8938) Fix labels display for non-null empty value
    ([@azrikahar](https://github.com/azrikahar))
  - [#8936](https://github.com/directus/directus/pull/8936) show System Collections in empty Data Model page
    ([@azrikahar](https://github.com/azrikahar))
  - [#8927](https://github.com/directus/directus/pull/8927) Fix missing display groups for file/image fields
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8893](https://github.com/directus/directus/pull/8893) hydrate permissionsStore only if user has role
    ([@azrikahar](https://github.com/azrikahar))
  - [#8889](https://github.com/directus/directus/pull/8889) Fix "Show Hidden Collection" context menu in collections
    navigation ([@azrikahar](https://github.com/azrikahar))
  - [#8888](https://github.com/directus/directus/pull/8888) Fix slug input ([@azrikahar](https://github.com/azrikahar))
  - [#8881](https://github.com/directus/directus/pull/8881) App: add 'schema' to body in M2M and M2A
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#8880](https://github.com/directus/directus/pull/8880) Set missing refresh timeout
    ([@licitdev](https://github.com/licitdev))
  - [#8876](https://github.com/directus/directus/pull/8876) Fix settings page freeze when custom fields have a sort
    value ([@smilledge](https://github.com/smilledge))

### :sponge: Optimizations

- **Misc.**
  - [#8969](https://github.com/directus/directus/pull/8969) Fix warnings from ESLint
    ([@paescuj](https://github.com/paescuj))
  - [#8957](https://github.com/directus/directus/pull/8957) Skip publish-npm job in the release workflow for forked
    repos ([@t7tran](https://github.com/t7tran))

### :memo: Documentation

- [#8948](https://github.com/directus/directus/pull/8948) Update iis.md
  ([@paulboudewijn](https://github.com/paulboudewijn))
- [#8879](https://github.com/directus/directus/pull/8879) Fix field duplicate typo
  ([@licitdev](https://github.com/licitdev))

### :package: Dependency Updates

- [#9025](https://github.com/directus/directus/pull/9025) Update dependency ts-node to v10.3.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#9015](https://github.com/directus/directus/pull/9015) Update dependency knex-schema-inspector to v1.6.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8989](https://github.com/directus/directus/pull/8989) Update dependency @types/lodash to v4.14.176
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8980](https://github.com/directus/directus/pull/8980) Pin dependencies
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8974](https://github.com/directus/directus/pull/8974) Update typescript-eslint monorepo to v5.1.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8971](https://github.com/directus/directus/pull/8971) Update dependency eslint-plugin-vue to v7.20.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8970](https://github.com/directus/directus/pull/8970) Update dependency @types/busboy to v0.3.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8967](https://github.com/directus/directus/pull/8967) Update jest monorepo to v27.3.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8964](https://github.com/directus/directus/pull/8964) Update dependency vite-plugin-md to v0.11.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8963](https://github.com/directus/directus/pull/8963) Update dependency vite to v2.6.10
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8962](https://github.com/directus/directus/pull/8962) Update dependency pinia to v2.0.0-rc.14
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8961](https://github.com/directus/directus/pull/8961) Update dependency nock to v13.1.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8959](https://github.com/directus/directus/pull/8959) Update dependency @rollup/plugin-node-resolve to v13.0.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8958](https://github.com/directus/directus/pull/8958) Update dependency @rollup/plugin-commonjs to v21.0.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8918](https://github.com/directus/directus/pull/8918) Update jest monorepo to v27.3.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8916](https://github.com/directus/directus/pull/8916) Update dependency vite to v2.6.9
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8915](https://github.com/directus/directus/pull/8915) Update dependency ts-jest to v27.0.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8772](https://github.com/directus/directus/pull/8772) Update fullcalendar monorepo to v5.10.0
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.98 (October 15, 2021)

### :sparkles: New Features

- **App**
  - [#8623](https://github.com/directus/directus/pull/8623) Add improved collection organization setup
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :rocket: Improvements

- **App**
  - [#8850](https://github.com/directus/directus/pull/8850) Fix refresh problems on background outdated tabs
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8472](https://github.com/directus/directus/pull/8472) Clear user's selection upon navigation
    ([@licitdev](https://github.com/licitdev))
- **API**
  - [#8843](https://github.com/directus/directus/pull/8843) Update calendar fix with \_between
    ([@GrefriT](https://github.com/GrefriT))

### :bug: Bug Fixes

- **App**
  - [#8849](https://github.com/directus/directus/pull/8849) Preload tree for display template properly
    ([@Nitwel](https://github.com/Nitwel))
  - [#8848](https://github.com/directus/directus/pull/8848) Fix scoping of v-list-group to the same as v-list
    ([@Nitwel](https://github.com/Nitwel))
  - [#8847](https://github.com/directus/directus/pull/8847) Fix dashboards for non-admin users
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8844](https://github.com/directus/directus/pull/8844) Fix translations display shown in m2m
    ([@Nitwel](https://github.com/Nitwel))
  - [#8841](https://github.com/directus/directus/pull/8841) Fix default sort value
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8840](https://github.com/directus/directus/pull/8840) Fix calendar layout filter
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8839](https://github.com/directus/directus/pull/8839) Fix choices not showing up in filter
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8826](https://github.com/directus/directus/pull/8826) Fix table and cards layout scroll to top if page changes
    ([@nickrum](https://github.com/nickrum))
  - [#8825](https://github.com/directus/directus/pull/8825) Show deletion error in File Library view
    ([@azrikahar](https://github.com/azrikahar))
  - [#8809](https://github.com/directus/directus/pull/8809) Fix broken access token refresh on page load
    ([@licitdev](https://github.com/licitdev))

### :sponge: Optimizations

- **App**
  - [#8827](https://github.com/directus/directus/pull/8827) Pause API queue when refreshing auth
    ([@licitdev](https://github.com/licitdev))

## v9.0.0-rc.97 (October 14, 2021)

### :sparkles: New Features

- **App**
  - [#8264](https://github.com/directus/directus/pull/8264) Add translations display
    ([@Nitwel](https://github.com/Nitwel))

### :rocket: Improvements

- **App**
  - [#8786](https://github.com/directus/directus/pull/8786) Format filesize for display & file info sidebar
    ([@azrikahar](https://github.com/azrikahar))
  - [#8712](https://github.com/directus/directus/pull/8712) Add datetime placeholder
    ([@tstedjb04](https://github.com/tstedjb04))
  - [#8711](https://github.com/directus/directus/pull/8711) Adjust "Report Bug" link to the new issue template
    ([@paescuj](https://github.com/paescuj))
  - [#8684](https://github.com/directus/directus/pull/8684) Add descriptions for Directus Panels and Dashboards
    ([@DanielKrasny](https://github.com/DanielKrasny))
  - [#8642](https://github.com/directus/directus/pull/8642) Fix rel attribute of external links
    ([@nickrum](https://github.com/nickrum))
  - [#8631](https://github.com/directus/directus/pull/8631) Debounce search & filter inputs
    ([@azrikahar](https://github.com/azrikahar))
  - [#8628](https://github.com/directus/directus/pull/8628) Map layout and interface improvements
    ([@Oreilles](https://github.com/Oreilles))
  - [#8610](https://github.com/directus/directus/pull/8610) Map layout and interface improvements
    ([@Oreilles](https://github.com/Oreilles))
- **API**
  - [#8729](https://github.com/directus/directus/pull/8729) Add missing arguments in aggregated resolver
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8684](https://github.com/directus/directus/pull/8684) Add descriptions for Directus Panels and Dashboards
    ([@DanielKrasny](https://github.com/DanielKrasny))

### :bug: Bug Fixes

- **App**
  - [#8795](https://github.com/directus/directus/pull/8795) Don't use type=search for filter input
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8790](https://github.com/directus/directus/pull/8790) Fix translations interface when no langPk field is selected
    ([@Nitwel](https://github.com/Nitwel))
  - [#8782](https://github.com/directus/directus/pull/8782) Fix column resizing for collections overview
    ([@azrikahar](https://github.com/azrikahar))
  - [#8781](https://github.com/directus/directus/pull/8781) add key to v-form in collections
    ([@azrikahar](https://github.com/azrikahar))
  - [#8766](https://github.com/directus/directus/pull/8766) Fix layouts stuck at page 1 with filters
    ([@Oreilles](https://github.com/Oreilles))
  - [#8761](https://github.com/directus/directus/pull/8761) Fix disabled state of code input
    ([@smilledge](https://github.com/smilledge))
  - [#8756](https://github.com/directus/directus/pull/8756) remove obsolete selectionFilters in O2M tree view
    ([@azrikahar](https://github.com/azrikahar))
  - [#8747](https://github.com/directus/directus/pull/8747) Also fix cards layout pagination.
    ([@Oreilles](https://github.com/Oreilles))
  - [#8739](https://github.com/directus/directus/pull/8739) Fixed tabular layout stuck at page 1
    ([@Oreilles](https://github.com/Oreilles))
  - [#8696](https://github.com/directus/directus/pull/8696) Bug fixes in the new filter interface
    ([@Oreilles](https://github.com/Oreilles))
  - [#8695](https://github.com/directus/directus/pull/8695) Translation fixes ([@paescuj](https://github.com/paescuj))
  - [#8664](https://github.com/directus/directus/pull/8664) Fix activity layout filter
    ([@nickrum](https://github.com/nickrum))
  - [#8654](https://github.com/directus/directus/pull/8654) Fix layout preview being empty when editing preview
    ([@nickrum](https://github.com/nickrum))
  - [#8629](https://github.com/directus/directus/pull/8629) fix validation not updated/saved
    ([@azrikahar](https://github.com/azrikahar))
  - [#8452](https://github.com/directus/directus/pull/8452) Reduce the refresh of access token while still fresh
    ([@licitdev](https://github.com/licitdev))
- **API**
  - [#8707](https://github.com/directus/directus/pull/8707) Fix group cleanup on deletion for directus_fields
    ([@azrikahar](https://github.com/azrikahar))
  - [#8695](https://github.com/directus/directus/pull/8695) Translation fixes ([@paescuj](https://github.com/paescuj))
  - [#8640](https://github.com/directus/directus/pull/8640) Fix creation of primary key field when it is uuid
    ([@alejandro-tss](https://github.com/alejandro-tss))
  - [#8485](https://github.com/directus/directus/pull/8485) Use ActivityService/RevisionsService to save accountability
    records ([@paescuj](https://github.com/paescuj))

### :sponge: Optimizations

- **Misc.**
  - [#8791](https://github.com/directus/directus/pull/8791) Remove unused vue cli dependencies
    ([@nickrum](https://github.com/nickrum))
  - [#8733](https://github.com/directus/directus/pull/8733) Add GitHub action workflow to automate author assignment on
    pull requests ([@paescuj](https://github.com/paescuj))
- **App**
  - [#8743](https://github.com/directus/directus/pull/8743) Transpile docs to vue components at build time
    ([@nickrum](https://github.com/nickrum))
  - [#8718](https://github.com/directus/directus/pull/8718) Fix eslint warnings and cleanup unused disable-directives
    ([@paescuj](https://github.com/paescuj))
- **Extensions**
  - [#8721](https://github.com/directus/directus/pull/8721) Use Composition API in extension templates
    ([@nickrum](https://github.com/nickrum))
- **API**
  - [#8718](https://github.com/directus/directus/pull/8718) Fix eslint warnings and cleanup unused disable-directives
    ([@paescuj](https://github.com/paescuj))
  - :warning: [#8670](https://github.com/directus/directus/pull/8670) Remove deprecated code
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :memo: Documentation

- [#8783](https://github.com/directus/directus/pull/8783) Docs: replace 'files.create' by 'files.upload'
  ([@joselcvarela](https://github.com/joselcvarela))
- [#8742](https://github.com/directus/directus/pull/8742) Add missing geo type filters
  ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :package: Dependency Updates

- [#8803](https://github.com/directus/directus/pull/8803) Update dependency ts-jest to v27.0.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8802](https://github.com/directus/directus/pull/8802) Update dependency stylelint-config-prettier to v9.0.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8800](https://github.com/directus/directus/pull/8800) Update dependency vue-router to v4.0.12
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8776](https://github.com/directus/directus/pull/8776) Update dependency sass to v1.43.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8775](https://github.com/directus/directus/pull/8775) Update dependency nanoid to v3.1.30
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8749](https://github.com/directus/directus/pull/8749) Update dependency typescript to v4.4.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8744](https://github.com/directus/directus/pull/8744) Update dependency axios to v0.23.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8741](https://github.com/directus/directus/pull/8741) Update dependency @types/dockerode to v3.3.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8740](https://github.com/directus/directus/pull/8740) Update dependency pinia to v2.0.0-rc.13
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8724](https://github.com/directus/directus/pull/8724) Update dependency codemirror to v5.63.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8705](https://github.com/directus/directus/pull/8705) Update dependency @types/codemirror to v5.60.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8703](https://github.com/directus/directus/pull/8703) Update dependency stylelint-config-prettier to v9
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8700](https://github.com/directus/directus/pull/8700) Update dependency ts-node to v10.3.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8698](https://github.com/directus/directus/pull/8698) Update dependency vite to v2.6.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8688](https://github.com/directus/directus/pull/8688) Update dependency tinymce to v5.10.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8685](https://github.com/directus/directus/pull/8685) Update dependency apexcharts to v3.29.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8681](https://github.com/directus/directus/pull/8681) Update dependency eslint to v8
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8674](https://github.com/directus/directus/pull/8674) Update dependency lint-staged to v11.2.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8673](https://github.com/directus/directus/pull/8673) Update dependency vue to v3.2.20
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8667](https://github.com/directus/directus/pull/8667) Update dependency @vue/compiler-sfc to v3.2.20
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8656](https://github.com/directus/directus/pull/8656) Update jest monorepo to v27.2.5
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.96 (October 7, 2021)

### :warning: Potential Breaking Changes

- Custom displays's handler function was renamed to `component` to be consistent with the other app extensions
- If you're upgrading from 95, and had some troubles with migrating due to "group" on directus_fields
  (https://github.com/directus/directus/issues/8369) on that version, please remove row `20210927A` from
  `directus_migrations` and re-run the migrations.

### :sparkles: New Features

- **App**
  - [#8570](https://github.com/directus/directus/pull/8570) Add new advanced filters experience
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7492](https://github.com/directus/directus/pull/7492) Add Filter interface ([@Nitwel](https://github.com/Nitwel))

### :rocket: Improvements

- **App**
  - [#8614](https://github.com/directus/directus/pull/8614) Show file-image actions button upon focus; Use hover style
    for focuse… ([@dimitrov-adrian](https://github.com/dimitrov-adrian))
  - [#8598](https://github.com/directus/directus/pull/8598) added robots.txt in order to disallow any indexing by search
    engines ([@sensedrive](https://github.com/sensedrive))
  - [#8566](https://github.com/directus/directus/pull/8566) smaller and bolder breadcrumb
    ([@benhaynes](https://github.com/benhaynes))
  - [#8564](https://github.com/directus/directus/pull/8564) update orange colors
    ([@benhaynes](https://github.com/benhaynes))
  - [#8554](https://github.com/directus/directus/pull/8554) autofocus input for Import from URL dialog
    ([@azrikahar](https://github.com/azrikahar))
  - [#8468](https://github.com/directus/directus/pull/8468) Removed unused properties from ModuleConfig
    ([@nickrum](https://github.com/nickrum))
  - [#8388](https://github.com/directus/directus/pull/8388) Remove invalid CSS from presets item view
    ([@licitdev](https://github.com/licitdev))
  - [#8108](https://github.com/directus/directus/pull/8108) Add save and delete shortcuts
    ([@Nitwel](https://github.com/Nitwel))
  - [#7546](https://github.com/directus/directus/pull/7546) Use display template for button links
    ([@Nitwel](https://github.com/Nitwel))
- **API**
  - [#8597](https://github.com/directus/directus/pull/8597) Check for duplicate migration keys
    ([@heyarne](https://github.com/heyarne))
  - [#8397](https://github.com/directus/directus/pull/8397) Refactor action value from authenticate to login in
    directus_activity ([@licitdev](https://github.com/licitdev))
  - [#8041](https://github.com/directus/directus/pull/8041) Convert to object default json value
    ([@joselcvarela](https://github.com/joselcvarela))
- **Extensions**
  - [#8593](https://github.com/directus/directus/pull/8593) Make directus:extension.hidden optional
    ([@nickrum](https://github.com/nickrum))

### :bug: Bug Fixes

- **App**
  - [#8603](https://github.com/directus/directus/pull/8603) Ignore WYSIWYG change on first load
    ([@azrikahar](https://github.com/azrikahar))
  - [#8602](https://github.com/directus/directus/pull/8602) fix orderBy to prioritize system fields first
    ([@azrikahar](https://github.com/azrikahar))
  - [#8567](https://github.com/directus/directus/pull/8567) Fix data model edits tracking
    ([@licitdev](https://github.com/licitdev))
  - [#8533](https://github.com/directus/directus/pull/8533) Add permission check during hydration of insights store
    ([@licitdev](https://github.com/licitdev))
  - [#8528](https://github.com/directus/directus/pull/8528) Set integer type on tileSize
    ([@dimitrov-adrian](https://github.com/dimitrov-adrian))
  - [#8513](https://github.com/directus/directus/pull/8513) Add empty object check for permissions
    ([@licitdev](https://github.com/licitdev))
  - [#8509](https://github.com/directus/directus/pull/8509) Add revert event handling in users module
    ([@licitdev](https://github.com/licitdev))
  - [#8504](https://github.com/directus/directus/pull/8504) Hide revision's revert button for created entries
    ([@licitdev](https://github.com/licitdev))
  - [#8379](https://github.com/directus/directus/pull/8379) Fix marginTop not implemented in presentation divider
    ([@licitdev](https://github.com/licitdev))
  - [#8373](https://github.com/directus/directus/pull/8373) Add discard confirmation prompt for project settings
    ([@licitdev](https://github.com/licitdev))
  - [#8365](https://github.com/directus/directus/pull/8365) Fix relative link routing in button links
    ([@licitdev](https://github.com/licitdev))
- **drive**
  - [#8601](https://github.com/directus/directus/pull/8601) Turn GCS credentials from camelCase to snake_case
    ([@azrikahar](https://github.com/azrikahar))
- **API**
  - [#8575](https://github.com/directus/directus/pull/8575) Fix field permissions check in aggregate
    ([@azrikahar](https://github.com/azrikahar))
  - [#8553](https://github.com/directus/directus/pull/8553) pass MutationOptions to createOne
    ([@azrikahar](https://github.com/azrikahar))
  - [#8526](https://github.com/directus/directus/pull/8526) Fix password exception crashing server
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#8490](https://github.com/directus/directus/pull/8490) Disable Cron hooks when only the CLI is running
    ([@nickrum](https://github.com/nickrum))
  - [#8423](https://github.com/directus/directus/pull/8423) Fix sanitize aggregate on parse objects
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#8404](https://github.com/directus/directus/pull/8404) Fix group migration on MySQL
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8399](https://github.com/directus/directus/pull/8399) Fix email migration for MS SQL
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8391](https://github.com/directus/directus/pull/8391) Add defaults for null fields in permissions
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8389](https://github.com/directus/directus/pull/8389) Send correct payload to auth provider for oauth
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#8375](https://github.com/directus/directus/pull/8375) fix "add conditions to fields" migration
    ([@azrikahar](https://github.com/azrikahar))

### :sponge: Optimizations

- **Misc.**
  - [#8616](https://github.com/directus/directus/pull/8616) Update the Dockerfile link in readme
    ([@nickrum](https://github.com/nickrum))
  - [#8599](https://github.com/directus/directus/pull/8599) Add .nvmrc to improve dev flow for nvm users
    ([@sensedrive](https://github.com/sensedrive))
  - [#8590](https://github.com/directus/directus/pull/8590) Recommend npm init directus-project to create a project
    ([@nickrum](https://github.com/nickrum))
  - [#8489](https://github.com/directus/directus/pull/8489) Allow unused vars starting with underscore
    ([@paescuj](https://github.com/paescuj))
  - [#8469](https://github.com/directus/directus/pull/8469) e2e test improvement
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **API**
  - [#8478](https://github.com/directus/directus/pull/8478) Move extension management into a class
    ([@nickrum](https://github.com/nickrum))
  - [#8383](https://github.com/directus/directus/pull/8383) Remove duplicate directus_migrations collection
    ([@nickrum](https://github.com/nickrum))
- **App**
  - :warning: [#8475](https://github.com/directus/directus/pull/8475) Drop support for display handler functions in
    favor of functional components and make the routes module config required ([@nickrum](https://github.com/nickrum))
  - [#8474](https://github.com/directus/directus/pull/8474) Fix types of mime package
    ([@nickrum](https://github.com/nickrum))
  - [#8382](https://github.com/directus/directus/pull/8382) Fix popper modifier validation error
    ([@nickrum](https://github.com/nickrum))
- **Extensions**
  - :warning: [#8475](https://github.com/directus/directus/pull/8475) Drop support for display handler functions in
    favor of functional components and make the routes module config required ([@nickrum](https://github.com/nickrum))

### :memo: Documentation

- [#8590](https://github.com/directus/directus/pull/8590) Recommend npm init directus-project to create a project
  ([@nickrum](https://github.com/nickrum))

### :package: Dependency Updates

- [#8622](https://github.com/directus/directus/pull/8622) Update dependency @types/markdown-it to v12.2.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8608](https://github.com/directus/directus/pull/8608) Update dependency vite to v2.6.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8605](https://github.com/directus/directus/pull/8605) Update dependency pinia to v2.0.0-rc.12
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8594](https://github.com/directus/directus/pull/8594) Update dependency vue-i18n to v9.1.9
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8591](https://github.com/directus/directus/pull/8591) Update dependency tedious to v13.1.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8585](https://github.com/directus/directus/pull/8585) Update dependency eslint-plugin-vue to v7.19.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8573](https://github.com/directus/directus/pull/8573) Update dependency nanoid to v3.1.29
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8571](https://github.com/directus/directus/pull/8571) Update dependency @types/markdown-it to v12.2.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8558](https://github.com/directus/directus/pull/8558) Update dependency vite to v2.6.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8557](https://github.com/directus/directus/pull/8557) Update dependency @vitejs/plugin-vue to v1.9.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8551](https://github.com/directus/directus/pull/8551) Update dependency eslint-plugin-vue to v7.19.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8548](https://github.com/directus/directus/pull/8548) Update typescript-eslint monorepo to v4.33.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8547](https://github.com/directus/directus/pull/8547) Update dependency npm to v7.24.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8532](https://github.com/directus/directus/pull/8532) Update dependency slugify to v1.6.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8530](https://github.com/directus/directus/pull/8530) Update dependency lint-staged to v11.2.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8525](https://github.com/directus/directus/pull/8525) Update dependency vue-i18n to v9.1.8
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8515](https://github.com/directus/directus/pull/8515) Update dependency pinia to v2.0.0-rc.11
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8500](https://github.com/directus/directus/pull/8500) Update dependency @types/codemirror to v5.60.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8496](https://github.com/directus/directus/pull/8496) Update dependency @types/node-cron to v2.0.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8494](https://github.com/directus/directus/pull/8494) Update dependency @rollup/plugin-commonjs to v21
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8484](https://github.com/directus/directus/pull/8484) Update dependency rollup to v2.58.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8466](https://github.com/directus/directus/pull/8466) Update dependency vite to v2.6.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8455](https://github.com/directus/directus/pull/8455) Update dependency @popperjs/core to v2.10.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8453](https://github.com/directus/directus/pull/8453) Update dependency pinia to v2.0.0-rc.10
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8436](https://github.com/directus/directus/pull/8436) Update dependency vite to v2.6.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8430](https://github.com/directus/directus/pull/8430) Update dependency vite to v2.6.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8429](https://github.com/directus/directus/pull/8429) Update dependency codemirror to v5.63.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8426](https://github.com/directus/directus/pull/8426) Update jest monorepo to v27.2.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8414](https://github.com/directus/directus/pull/8414) Update dependency tedious to v13
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8405](https://github.com/directus/directus/pull/8405) Pin dependency tmp to v0.0.33
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8403](https://github.com/directus/directus/pull/8403) Update dependency @types/dompurify to v2.3.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8380](https://github.com/directus/directus/pull/8380) Update jest monorepo to v27.2.3
  ([@renovate[bot]](https://github.com/apps/renovate))

Directus refs/tags/v9.0.0-rc.96

## v9.0.0-rc.95 (September 27, 2021)

### :rocket: Improvements

- **App**
  - [#8359](https://github.com/directus/directus/pull/8359) Style updates ([@benhaynes](https://github.com/benhaynes))
  - [#8327](https://github.com/directus/directus/pull/8327) Use user language as first on translations
    ([@joselcvarela](https://github.com/joselcvarela))
- **API**
  - [#8257](https://github.com/directus/directus/pull/8257) Allow environment syntax prefix per item within an array
    ([@azrikahar](https://github.com/azrikahar))
  - [#6942](https://github.com/directus/directus/pull/6942) Modular authentication
    ([@aidenfoxx](https://github.com/aidenfoxx))

### :bug: Bug Fixes

- **API**
  - [#8357](https://github.com/directus/directus/pull/8357) Migrate down chronologically instead of by version
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8355](https://github.com/directus/directus/pull/8355) Don't track primary keys of relations/fields
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8352](https://github.com/directus/directus/pull/8352) Don't error on missing meta key for collection
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8351](https://github.com/directus/directus/pull/8351) Add missing system data points
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8349](https://github.com/directus/directus/pull/8349) Use field key instead of ID for group value
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8335](https://github.com/directus/directus/pull/8335) Fix getSchema while trx on postgres
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#8334](https://github.com/directus/directus/pull/8334) prevent ambiguous role selection in middleware
    ([@azrikahar](https://github.com/azrikahar))
  - [#8333](https://github.com/directus/directus/pull/8333) Fix multiple issues in Data Model view
    ([@azrikahar](https://github.com/azrikahar))
  - [#8286](https://github.com/directus/directus/pull/8286) Allow for + in $NOW ([@Nitwel](https://github.com/Nitwel))
  - [#8272](https://github.com/directus/directus/pull/8272) Fix oas parameters ([@Nitwel](https://github.com/Nitwel))
  - [#8111](https://github.com/directus/directus/pull/8111) Fixed error when setting Oracle column to not null
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#6942](https://github.com/directus/directus/pull/6942) Modular authentication
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **App**
  - [#8349](https://github.com/directus/directus/pull/8349) Use field key instead of ID for group value
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8346](https://github.com/directus/directus/pull/8346) Fix panel not assigned on insights
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#8344](https://github.com/directus/directus/pull/8344) Fix input not being masked
    ([@Nitwel](https://github.com/Nitwel))
  - [#8337](https://github.com/directus/directus/pull/8337) Debounce app idle tracker autorefresh token
    ([@azrikahar](https://github.com/azrikahar))
  - [#8333](https://github.com/directus/directus/pull/8333) Fix multiple issues in Data Model view
    ([@azrikahar](https://github.com/azrikahar))
  - [#8317](https://github.com/directus/directus/pull/8317) fix target collection interface for o2m relationship
    ([@azrikahar](https://github.com/azrikahar))
  - [#8293](https://github.com/directus/directus/pull/8293) Vertically center content of v-button
    ([@paescuj](https://github.com/paescuj))
  - [#8285](https://github.com/directus/directus/pull/8285) Add missing null,nnull and remove unused file
    ([@Nitwel](https://github.com/Nitwel))
  - [#8278](https://github.com/directus/directus/pull/8278) Fix sorting for alias fields
    ([@azrikahar](https://github.com/azrikahar))
  - [#8260](https://github.com/directus/directus/pull/8260) Fix primary key not being passed to v-form
    ([@Nitwel](https://github.com/Nitwel))
  - [#8256](https://github.com/directus/directus/pull/8256) Reinstate v-click-outside event in v-menu
    ([@azrikahar](https://github.com/azrikahar))
- **drive**
  - [#8294](https://github.com/directus/directus/pull/8294) Fix azure storage content-type
    ([@joselcvarela](https://github.com/joselcvarela))
- **shared**
  - [#8283](https://github.com/directus/directus/pull/8283) Allow date strings in gt(e)/lt(e)/between in validation step
    ([@azrikahar](https://github.com/azrikahar))

### :sponge: Optimizations

- **API**
  - [#6942](https://github.com/directus/directus/pull/6942) Modular authentication
    ([@aidenfoxx](https://github.com/aidenfoxx))

### :memo: Documentation

- [#8279](https://github.com/directus/directus/pull/8279) Prevent unnecessary interpolation by Vuepress
  ([@azrikahar](https://github.com/azrikahar))
- [#8257](https://github.com/directus/directus/pull/8257) Allow environment syntax prefix per item within an array
  ([@azrikahar](https://github.com/azrikahar))

### :package: Dependency Updates

- [#8361](https://github.com/directus/directus/pull/8361) Update dependency @types/lodash to v4.14.175
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8348](https://github.com/directus/directus/pull/8348) Update typescript-eslint monorepo to v4.32.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8345](https://github.com/directus/directus/pull/8345) Update dependency knex-schema-inspector to v1.6.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8328](https://github.com/directus/directus/pull/8328) Update dependency nanoid to v3.1.28
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8320](https://github.com/directus/directus/pull/8320) Update vue monorepo to v3.2.19
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8316](https://github.com/directus/directus/pull/8316) Update jest monorepo to v27.2.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8308](https://github.com/directus/directus/pull/8308) Update dependency @types/lodash to v4.14.174
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8304](https://github.com/directus/directus/pull/8304) Update dependency @vitejs/plugin-vue to v1.9.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8303](https://github.com/directus/directus/pull/8303) Update vue monorepo to v3.2.18
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8300](https://github.com/directus/directus/pull/8300) Update dependency vue to v3.2.17
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8299](https://github.com/directus/directus/pull/8299) Update dependency @vue/compiler-sfc to v3.2.17
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8275](https://github.com/directus/directus/pull/8275) Update dependency npm to v7.24.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8273](https://github.com/directus/directus/pull/8273) Update dependency @vitejs/plugin-vue to v1.9.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8271](https://github.com/directus/directus/pull/8271) Update vue monorepo to v3.2.16
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.94 (September 22, 2021)

### 📈 Insights Module

This version includes a beta of the much requested Insights module and Aggregation & Grouping capabilities in the API.
You can enable this new module under Project Settings.

### :sparkles: New Features

- **App**
  - [#8129](https://github.com/directus/directus/pull/8129) List panel
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8009](https://github.com/directus/directus/pull/8009) Add Insights Module & API Aggregation Functionality
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **API**
  - [#8009](https://github.com/directus/directus/pull/8009) Add Insights Module & API Aggregation Functionality
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7906](https://github.com/directus/directus/pull/7906) Add support for custom claims before issuing a JWT.
    ([@joelbqz](https://github.com/joelbqz))
- **Extensions**
  - [#7856](https://github.com/directus/directus/pull/7856) Add extensions-sdk watch build option
    ([@Moeriki](https://github.com/Moeriki))

### :rocket: Improvements

- **App**
  - [#8240](https://github.com/directus/directus/pull/8240) Add divider for modules section in project settings
    ([@licitdev](https://github.com/licitdev))
  - [#8225](https://github.com/directus/directus/pull/8225) Allow links with custom URL schemes
    ([@licitdev](https://github.com/licitdev))
  - [#8180](https://github.com/directus/directus/pull/8180) Change some API calls to use getEndpoint utility
    ([@azrikahar](https://github.com/azrikahar))
  - [#8170](https://github.com/directus/directus/pull/8170) Fix having more than 100 languages
    ([@Nitwel](https://github.com/Nitwel))
  - [#8097](https://github.com/directus/directus/pull/8097) add error handling for image component
    ([@azrikahar](https://github.com/azrikahar))
  - [#8069](https://github.com/directus/directus/pull/8069) Display error when image exceeds
    `ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION` limit ([@azrikahar](https://github.com/azrikahar))
  - [#8051](https://github.com/directus/directus/pull/8051) Show selected items in drawer collection
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#7962](https://github.com/directus/directus/pull/7962) Ensure menus closes when another one gets opened
    ([@azrikahar](https://github.com/azrikahar))
  - [#6303](https://github.com/directus/directus/pull/6303) Improvement/revision pagination
    ([@masterwendu](https://github.com/masterwendu))
- **API**
  - [#8193](https://github.com/directus/directus/pull/8193) Fix errors thrown in CRON hook not caught
    ([@licitdev](https://github.com/licitdev))
  - [#8134](https://github.com/directus/directus/pull/8134) Fix incorrect env ASSETS_TRANSFORM_MAX_CONCURRENT
    ([@joselcvarela](https://github.com/joselcvarela))

### :bug: Bug Fixes

- **App**
  - [#8248](https://github.com/directus/directus/pull/8248) Only apply conditional variables in use
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8201](https://github.com/directus/directus/pull/8201) Fix docs module routes from triggering auth refresh
    ([@licitdev](https://github.com/licitdev))
  - [#8197](https://github.com/directus/directus/pull/8197) Enable split view only on +2 languages
    ([@Nitwel](https://github.com/Nitwel))
  - [#8174](https://github.com/directus/directus/pull/8174) Fix translation interface on new items
    ([@Nitwel](https://github.com/Nitwel))
  - [#8169](https://github.com/directus/directus/pull/8169) Fix blank repeater item creation when cancelled
    ([@licitdev](https://github.com/licitdev))
  - [#8158](https://github.com/directus/directus/pull/8158) Prevent unsaved changes dialog from appearing after item is
    deleted ([@azrikahar](https://github.com/azrikahar))
  - [#8157](https://github.com/directus/directus/pull/8157) Fixed readonly repeater fields from sorting
    ([@licitdev](https://github.com/licitdev))
  - [#8130](https://github.com/directus/directus/pull/8130) Fix module bar relative links from opening externally
    ([@licitdev](https://github.com/licitdev))
  - [#8115](https://github.com/directus/directus/pull/8115) Fixed missing documentation due to directory-tree update
    ([@licitdev](https://github.com/licitdev))
  - [#8066](https://github.com/directus/directus/pull/8066) Fix revision drawer for create events
    ([@azrikahar](https://github.com/azrikahar))
  - [#7907](https://github.com/directus/directus/pull/7907) Fix automatic replacement of dynamic variables in field
    conditions. ([@licitdev](https://github.com/licitdev))
- **API**
  - [#8241](https://github.com/directus/directus/pull/8241) Replace prettier with simple trim
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#8184](https://github.com/directus/directus/pull/8184) Clear collection cache & schema cache on update
    ([@azrikahar](https://github.com/azrikahar))
  - [#8149](https://github.com/directus/directus/pull/8149) Fix large integer string used in filters
    ([@licitdev](https://github.com/licitdev))
  - [#8117](https://github.com/directus/directus/pull/8117) Fix the port being duplicated in parsed URLs
    ([@nickrum](https://github.com/nickrum))
  - [#8103](https://github.com/directus/directus/pull/8103) Prevent null being converted to empty object in deepMap
    utility function ([@azrikahar](https://github.com/azrikahar))

### :sponge: Optimizations

- **App**
  - [#8204](https://github.com/directus/directus/pull/8204) Fix auth token refresh to be on first load only
    ([@licitdev](https://github.com/licitdev))
  - [#8185](https://github.com/directus/directus/pull/8185) change computed endpoint to getEndpoint utility
    ([@azrikahar](https://github.com/azrikahar))
  - [#8148](https://github.com/directus/directus/pull/8148) Consolidate example domains in translations to example.com
    ([@azrikahar](https://github.com/azrikahar))

### :memo: Documentation

- [#8242](https://github.com/directus/directus/pull/8242) Add documentation for module bar
  ([@licitdev](https://github.com/licitdev))
- [#8192](https://github.com/directus/directus/pull/8192) fix(docs): update link in persistence section
  ([@gokaygurcan](https://github.com/gokaygurcan))

### :package: Dependency Updates

- [#8238](https://github.com/directus/directus/pull/8238) Update dependency pino to v6.13.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8234](https://github.com/directus/directus/pull/8234) Update dependency directory-tree to v3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8226](https://github.com/directus/directus/pull/8226) Update dependency sass to v1.42.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8222](https://github.com/directus/directus/pull/8222) Update dependency @vitejs/plugin-vue to v1.9.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8221](https://github.com/directus/directus/pull/8221) Update dependency knex-schema-inspector to v1.6.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8220](https://github.com/directus/directus/pull/8220) Update dependency @rollup/plugin-node-resolve to v13.0.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8219](https://github.com/directus/directus/pull/8219) Update dependency @types/inquirer to v8.1.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8218](https://github.com/directus/directus/pull/8218) Update dependency @types/fs-extra to v9.0.13
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8217](https://github.com/directus/directus/pull/8217) Update vue monorepo to v3.2.13
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8215](https://github.com/directus/directus/pull/8215) Update dependency @types/codemirror to v5.60.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8205](https://github.com/directus/directus/pull/8205) Update dependency pino-http to v5.8.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8179](https://github.com/directus/directus/pull/8179) Update dependency sass to v1.42.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8178](https://github.com/directus/directus/pull/8178) Update dependency apexcharts to v3.28.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8177](https://github.com/directus/directus/pull/8177) Pin dependency @types/flat to 5.0.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8172](https://github.com/directus/directus/pull/8172) Update typescript-eslint monorepo to v4.31.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8171](https://github.com/directus/directus/pull/8171) Update dependency codemirror to v5.63.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8168](https://github.com/directus/directus/pull/8168) Update dependency jest to v27.2.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8167](https://github.com/directus/directus/pull/8167) Update dependency dompurify to v2.3.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8136](https://github.com/directus/directus/pull/8136) Update dependency vite to v2.5.10
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8135](https://github.com/directus/directus/pull/8135) Update dependency @vitejs/plugin-vue to v1.8.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8131](https://github.com/directus/directus/pull/8131) Update dependency @types/async to v3.2.8
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8126](https://github.com/directus/directus/pull/8126) Update gatsby monorepo to v3.14.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8120](https://github.com/directus/directus/pull/8120) Update vue monorepo to v3.2.12
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8112](https://github.com/directus/directus/pull/8112) Update dependency eslint-plugin-vue to v7.18.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8102](https://github.com/directus/directus/pull/8102) Update dependency date-fns to v2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8095](https://github.com/directus/directus/pull/8095) Update dependency vite to v2.5.8
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8094](https://github.com/directus/directus/pull/8094) Update dependency npm to v7.24.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8093](https://github.com/directus/directus/pull/8093) Update dependency sass to v1.41.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7776](https://github.com/directus/directus/pull/7776) Update dependency @popperjs/core to v2.10.1
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.93 (September 17, 2021)

### :sparkles: New Features

- **App**
  - [#8012](https://github.com/directus/directus/pull/8012) Move module setup to Project Settings
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7727](https://github.com/directus/directus/pull/7727) Add new translations interface
    ([@jaycammarano](https://github.com/jaycammarano))
- **API**
  - [#7939](https://github.com/directus/directus/pull/7939) Add native schema migration capabilities
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7833](https://github.com/directus/directus/pull/7833) Add ability to customise database errors
    ([@smilledge](https://github.com/smilledge))
  - [#7755](https://github.com/directus/directus/pull/7755) Make Argon2.hash parameters configurable to allow for
    stronger user password hashes. ([@TonyLovesDevOps](https://github.com/TonyLovesDevOps))
  - [#7675](https://github.com/directus/directus/pull/7675) Allow custom CLI commands to be added by extensions
    ([@smilledge](https://github.com/smilledge))

### :rocket: Improvements

- **API**
  - [#7986](https://github.com/directus/directus/pull/7986) Align memcached configurations for multiple hosts
    ([@azrikahar](https://github.com/azrikahar))
  - [#7923](https://github.com/directus/directus/pull/7923) add spatial_ref_sys as default for DB_EXCLUDE_TABLES
    ([@azrikahar](https://github.com/azrikahar))
  - :warning: [#7830](https://github.com/directus/directus/pull/7830) Add custom JWTs support for static token
    ([@azrikahar](https://github.com/azrikahar))
  - [#7676](https://github.com/directus/directus/pull/7676) Update logging in CLI commands
    ([@smilledge](https://github.com/smilledge))
- **App**
  - [#7974](https://github.com/directus/directus/pull/7974) Prevent v-input append slot from shrinking
    ([@azrikahar](https://github.com/azrikahar))
  - [#7972](https://github.com/directus/directus/pull/7972) Various style updates
    ([@benhaynes](https://github.com/benhaynes))
  - [#7964](https://github.com/directus/directus/pull/7964) Fix header icon for revisions drawer
    ([@azrikahar](https://github.com/azrikahar))
  - [#7954](https://github.com/directus/directus/pull/7954) Add click event for user tooltip & navigate to the user's
    page ([@azrikahar](https://github.com/azrikahar))
  - [#7948](https://github.com/directus/directus/pull/7948) Allow v-menu tooltip to stay active on hover
    ([@azrikahar](https://github.com/azrikahar))
  - [#7925](https://github.com/directus/directus/pull/7925) Add possibility to translate Published, Draft and Archived
    strings ([@jrvidotti](https://github.com/jrvidotti))
  - [#7913](https://github.com/directus/directus/pull/7913) Enable "Format JSON Value" to display 'geometry'
    ([@vidhav](https://github.com/vidhav))
  - [#7902](https://github.com/directus/directus/pull/7902) remove auto-open feature for info sidebar
    ([@azrikahar](https://github.com/azrikahar))
  - [#7811](https://github.com/directus/directus/pull/7811) Map selection behaviour
    ([@Oreilles](https://github.com/Oreilles))
  - [#7140](https://github.com/directus/directus/pull/7140) V button color prop
    ([@jaycammarano](https://github.com/jaycammarano))
- **sdk**
  - [#7815](https://github.com/directus/directus/pull/7815) fix type for deep query with underscore prefix
    ([@azrikahar](https://github.com/azrikahar))

### :bug: Bug Fixes

- **App**
  - [#8091](https://github.com/directus/directus/pull/8091) Fix saving issue on invalid conditional rule
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7987](https://github.com/directus/directus/pull/7987) fix revision detail refresh for "Save and Stay"
    ([@azrikahar](https://github.com/azrikahar))
  - [#7966](https://github.com/directus/directus/pull/7966) Right icon hides for numeric input
    ([@alesvaupotic](https://github.com/alesvaupotic))
  - [#7963](https://github.com/directus/directus/pull/7963) Respect & show correct icon/color for collection drawers
    ([@azrikahar](https://github.com/azrikahar))
  - [#7950](https://github.com/directus/directus/pull/7950) Fixed mapbox-gl-draw css not being applied and moved logo
    ([@Oreilles](https://github.com/Oreilles))
  - [#7947](https://github.com/directus/directus/pull/7947) Fix user-popover location when hovered in revisions
    ([@azrikahar](https://github.com/azrikahar))
  - [#7918](https://github.com/directus/directus/pull/7918) Add tileSize parameter to basemap options
    ([@Oreilles](https://github.com/Oreilles))
  - [#7917](https://github.com/directus/directus/pull/7917) Fix translation keys for system collections
    ([@azrikahar](https://github.com/azrikahar))
  - [#7884](https://github.com/directus/directus/pull/7884) Add scope to v-tab-items
    ([@Nitwel](https://github.com/Nitwel))
  - [#7864](https://github.com/directus/directus/pull/7864) Fix reverting to created revision
    ([@Nitwel](https://github.com/Nitwel))
  - [#7858](https://github.com/directus/directus/pull/7858) Fix display labels translations
    ([@azrikahar](https://github.com/azrikahar))
  - [#7840](https://github.com/directus/directus/pull/7840) Fix watcher loop and filters not being applied.
    ([@Oreilles](https://github.com/Oreilles))
  - [#7816](https://github.com/directus/directus/pull/7816) Apply "in" to query even if array is empty
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#7812](https://github.com/directus/directus/pull/7812) Fix map interface controls not showing
    ([@Oreilles](https://github.com/Oreilles))
  - [#7801](https://github.com/directus/directus/pull/7801) Use https for openmaptiles fonts.
    ([@Oreilles](https://github.com/Oreilles))
  - [#7800](https://github.com/directus/directus/pull/7800) Fix wrong icon ([@Nitwel](https://github.com/Nitwel))
  - [#7796](https://github.com/directus/directus/pull/7796) Fix allow false as value in filter
    ([@Nitwel](https://github.com/Nitwel))
  - [#7794](https://github.com/directus/directus/pull/7794) Datetime interface "Set to now" sets seconds to 0
    ([@Moeriki](https://github.com/Moeriki))
  - [#7754](https://github.com/directus/directus/pull/7754) Fix WYSIWYG field not being cleared after "Save and Create
    New" ([@azrikahar](https://github.com/azrikahar))
- **API**
  - [#8056](https://github.com/directus/directus/pull/8056) Don't flush schema cache on content update
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7910](https://github.com/directus/directus/pull/7910) Fix the collections column in directus_webhooks being
    nullable ([@nickrum](https://github.com/nickrum))
  - [#7883](https://github.com/directus/directus/pull/7883) Parse created arrays in parseFilter
    ([@Nitwel](https://github.com/Nitwel))
  - [#7847](https://github.com/directus/directus/pull/7847) fix default of env var EMAIL_MAILGUN_HOST
    ([@mooori](https://github.com/mooori))
  - [#7820](https://github.com/directus/directus/pull/7820) make csv imports try to parse values to json
    ([@azrikahar](https://github.com/azrikahar))
  - [#7816](https://github.com/directus/directus/pull/7816) Apply "in" to query even if array is empty
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#7814](https://github.com/directus/directus/pull/7814) Fix return error for GraphQL mutations
    ([@joselcvarela](https://github.com/joselcvarela))
- **Extensions**
  - [#7978](https://github.com/directus/directus/pull/7978) Make type-only dependency versions of shared package less
    strict ([@nickrum](https://github.com/nickrum))
- **drive**
  - [#7976](https://github.com/directus/directus/pull/7976) Update AmazonWebServicesS3Storage.ts
    ([@aidenfoxx](https://github.com/aidenfoxx))
- **Misc.**
  - [#7965](https://github.com/directus/directus/pull/7965) Add missing words to Database Abstraction
    ([@alesvaupotic](https://github.com/alesvaupotic))
  - [#7893](https://github.com/directus/directus/pull/7893) fix readme emoji
    ([@azrikahar](https://github.com/azrikahar))
- **Docker**
  - [#7892](https://github.com/directus/directus/pull/7892) fix readme filename in sync-dockerhub-readme.yml
    ([@azrikahar](https://github.com/azrikahar))

### :sponge: Optimizations

- **App**
  - [#8078](https://github.com/directus/directus/pull/8078) make i18n shared ([@Nitwel](https://github.com/Nitwel))
  - [#8059](https://github.com/directus/directus/pull/8059) Move some compositions, utils and types to shared
    ([@Nitwel](https://github.com/Nitwel))
- **Misc.**
  - [#8062](https://github.com/directus/directus/pull/8062) Add return type to useFilterFields
    ([@nickrum](https://github.com/nickrum))
- **API**
  - [#8008](https://github.com/directus/directus/pull/8008) Fix type issue in getCacheKey
    ([@nickrum](https://github.com/nickrum))
  - [#8005](https://github.com/directus/directus/pull/8005) Replace require.main check with start script
    ([@nickrum](https://github.com/nickrum))
  - [#7841](https://github.com/directus/directus/pull/7841) Use node promisify in sqlite database initialization.
    ([@Oreilles](https://github.com/Oreilles))
- **shared**
  - [#7971](https://github.com/directus/directus/pull/7971) Remove unused LAYOUT_SYMBOL constant
    ([@nickrum](https://github.com/nickrum))
- **Docker**
  - [#7889](https://github.com/directus/directus/pull/7889) Add github action for syncing readme to Docker Hub
    ([@azrikahar](https://github.com/azrikahar))

### :memo: Documentation

- [#8067](https://github.com/directus/directus/pull/8067) Make default values have consistent formatting
  ([@azrikahar](https://github.com/azrikahar))
- [#8055](https://github.com/directus/directus/pull/8055) Fix broken anchor link to oAuth config section.
  ([@TonyLovesDevOps](https://github.com/TonyLovesDevOps))
- [#8036](https://github.com/directus/directus/pull/8036) Fix URL ([@cstork](https://github.com/cstork))
- [#8023](https://github.com/directus/directus/pull/8023) Update cli.md: Point to update/upgrade instructions
  ([@cstork](https://github.com/cstork))
- [#7967](https://github.com/directus/directus/pull/7967) Update assets.md
  ([@alesvaupotic](https://github.com/alesvaupotic))
- [#7965](https://github.com/directus/directus/pull/7965) Add missing words to Database Abstraction
  ([@alesvaupotic](https://github.com/alesvaupotic))
- [#7925](https://github.com/directus/directus/pull/7925) Add possibility to translate Published, Draft and Archived
  strings ([@jrvidotti](https://github.com/jrvidotti))
- [#7915](https://github.com/directus/directus/pull/7915) Docs: update actions for file event
  ([@pgegenfurtner](https://github.com/pgegenfurtner))
- [#7893](https://github.com/directus/directus/pull/7893) fix readme emoji ([@azrikahar](https://github.com/azrikahar))
- [#7892](https://github.com/directus/directus/pull/7892) fix readme filename in sync-dockerhub-readme.yml
  ([@azrikahar](https://github.com/azrikahar))
- [#7889](https://github.com/directus/directus/pull/7889) Add github action for syncing readme to Docker Hub
  ([@azrikahar](https://github.com/azrikahar))
- [#7831](https://github.com/directus/directus/pull/7831) fix url format for Azure storage endpoint
  ([@azrikahar](https://github.com/azrikahar))
- [#7821](https://github.com/directus/directus/pull/7821) fix minor typo in api-hooks.md
  ([@azrikahar](https://github.com/azrikahar))
- [#7798](https://github.com/directus/directus/pull/7798) Fix incorrect database exclude tables environment variable in
  docs. ([@licitdev](https://github.com/licitdev))
- [#7795](https://github.com/directus/directus/pull/7795) Update modules docs
  ([@HarunKilic](https://github.com/HarunKilic))

### :package: Dependency Updates

- [#8070](https://github.com/directus/directus/pull/8070) Update dependency prettier to v2.4.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8063](https://github.com/directus/directus/pull/8063) Update dependency @types/lodash to v4.14.173
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8060](https://github.com/directus/directus/pull/8060) Update dependency @mapbox/mapbox-gl-geocoder to v4.7.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8050](https://github.com/directus/directus/pull/8050) Update dependency dompurify to v2.3.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8046](https://github.com/directus/directus/pull/8046) Update dependency @types/object-hash to v2.2.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8042](https://github.com/directus/directus/pull/8042) Update dependency directory-tree to v2.4.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8039](https://github.com/directus/directus/pull/8039) Update dependency sass to v1.41.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8025](https://github.com/directus/directus/pull/8025) Update dependency @types/sharp to v0.29.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8018](https://github.com/directus/directus/pull/8018) Update dependency stylelint-scss to v3.21.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8014](https://github.com/directus/directus/pull/8014) Update dependency sass to v1.40.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8011](https://github.com/directus/directus/pull/8011) Pin dependency @types/deep-diff to 1.0.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8003](https://github.com/directus/directus/pull/8003) Update dependency @typescript-eslint/parser to v4.31.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#8002](https://github.com/directus/directus/pull/8002) Update dependency @typescript-eslint/eslint-plugin to v4.31.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7997](https://github.com/directus/directus/pull/7997) Update dependency @types/object-hash to v2.2.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7995](https://github.com/directus/directus/pull/7995) Update dependency vite to v2.5.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7989](https://github.com/directus/directus/pull/7989) Update jest monorepo to v27.2.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7982](https://github.com/directus/directus/pull/7982) Update dependency pinia to v2.0.0-rc.9
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7973](https://github.com/directus/directus/pull/7973) Update dependency typescript to v4.4.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7959](https://github.com/directus/directus/pull/7959) Update dependency sass to v1.39.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7956](https://github.com/directus/directus/pull/7956) Update dependency npm to v7.23.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7945](https://github.com/directus/directus/pull/7945) Update dependency prettier to v2.4.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7944](https://github.com/directus/directus/pull/7944) Update dependency @types/sharp to v0.29.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7940](https://github.com/directus/directus/pull/7940) Update vue monorepo to v3.2.11
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7929](https://github.com/directus/directus/pull/7929) Update dependency vite to v2.5.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7922](https://github.com/directus/directus/pull/7922) Update dependency @vitejs/plugin-vue to v1.6.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7912](https://github.com/directus/directus/pull/7912) Update jest monorepo to v27.1.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7908](https://github.com/directus/directus/pull/7908) Update dependency tinymce to v5.9.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7905](https://github.com/directus/directus/pull/7905) Update dependency vite to v2.5.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7897](https://github.com/directus/directus/pull/7897) Update vue monorepo to v3.2.10
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7896](https://github.com/directus/directus/pull/7896) Update dependency @types/sharp to v0.29.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7886](https://github.com/directus/directus/pull/7886) Update dependency vite to v2.5.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7882](https://github.com/directus/directus/pull/7882) Update dependency @types/keyv to v3.1.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7876](https://github.com/directus/directus/pull/7876) Update dependency dockerode to v3.3.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7868](https://github.com/directus/directus/pull/7868) Update dependency @types/inquirer to v8
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7866](https://github.com/directus/directus/pull/7866) Update typescript-eslint monorepo to v4.31.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7865](https://github.com/directus/directus/pull/7865) Update dependency axios to v0.21.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7860](https://github.com/directus/directus/pull/7860) Update dependency pino to v6.13.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7859](https://github.com/directus/directus/pull/7859) Update dependency @vitejs/plugin-vue to v1.6.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7848](https://github.com/directus/directus/pull/7848) Update dependency pinia to v2.0.0-rc.8
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7842](https://github.com/directus/directus/pull/7842) Update vue monorepo to v3.2.9
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7835](https://github.com/directus/directus/pull/7835) Update dependency tedious to v12.2.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7829](https://github.com/directus/directus/pull/7829) Update dependency axios to v0.21.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7819](https://github.com/directus/directus/pull/7819) Update dependency knex to v0.95.11
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7817](https://github.com/directus/directus/pull/7817) Update dependency pinia to v2.0.0-rc.7
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.92 (September 17, 2021)

### :sparkles: New Features

- **API**
  - [#7789](https://github.com/directus/directus/pull/7789) Add environment variable to force-exclude tables from
    Directus ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7777](https://github.com/directus/directus/pull/7777) Expose logger through ExtensionContext
    ([@Moeriki](https://github.com/Moeriki))
  - [#7759](https://github.com/directus/directus/pull/7759) Show a warning if PostGIS is missing
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#7605](https://github.com/directus/directus/pull/7605) Add search result highlighting to tree-view interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6643](https://github.com/directus/directus/pull/6643) Add "Edit Collection" link to Left Nav context menu
    ([@Kematia](https://github.com/Kematia))
- **Extensions**
  - [#6881](https://github.com/directus/directus/pull/6881) Add support for typescript extensions to extension-sdk
    ([@nickrum](https://github.com/nickrum))

### :rocket: Improvements

- **App**
  - [#7749](https://github.com/directus/directus/pull/7749) Disable attribute inheritance for all layout components
    ([@nickrum](https://github.com/nickrum))
  - [#7738](https://github.com/directus/directus/pull/7738) Warn the user when a collapsed group field had an error
    ([@Nitwel](https://github.com/Nitwel))
  - [#7687](https://github.com/directus/directus/pull/7687) Resolve editor/type warnings
    ([@Nitwel](https://github.com/Nitwel))
  - [#7668](https://github.com/directus/directus/pull/7668) Replace system provide with composables
    ([@nickrum](https://github.com/nickrum))
  - [#7650](https://github.com/directus/directus/pull/7650) Allow to select system collections in m2a
    ([@Nitwel](https://github.com/Nitwel))
  - [#7583](https://github.com/directus/directus/pull/7583) Display private images in WYSIWYG editor
    ([@jaycammarano](https://github.com/jaycammarano))
  - [#7578](https://github.com/directus/directus/pull/7578) Add `search this area` button to map layout.
    ([@Oreilles](https://github.com/Oreilles))
  - [#7563](https://github.com/directus/directus/pull/7563) Move basemap input higher in sidebar options. Keep map
    interactive under v-info ([@Oreilles](https://github.com/Oreilles))
  - [#7535](https://github.com/directus/directus/pull/7535) Allow using regular input interface on TEXT type fields
    ([@alexkharech](https://github.com/alexkharech))
- **Extensions**
  - [#7714](https://github.com/directus/directus/pull/7714) Improve API extension context types
    ([@nickrum](https://github.com/nickrum))
  - :warning: [#7695](https://github.com/directus/directus/pull/7695) Remove /custom subpath for endpoints and add a way
    to customize the endpoint subpath ([@nickrum](https://github.com/nickrum))
  - [#7668](https://github.com/directus/directus/pull/7668) Replace system provide with composables
    ([@nickrum](https://github.com/nickrum))
  - [#7629](https://github.com/directus/directus/pull/7629) Share vue-router between App and extensions
    ([@nickrum](https://github.com/nickrum))
  - [#7627](https://github.com/directus/directus/pull/7627) Allow json imports and replace NODE_ENV env var when
    building extensions ([@nickrum](https://github.com/nickrum))
- **API**
  - [#7711](https://github.com/directus/directus/pull/7711) Remove permission.limit
    ([@Nitwel](https://github.com/Nitwel))
  - :warning: [#7695](https://github.com/directus/directus/pull/7695) Remove /custom subpath for endpoints and add a way
    to customize the endpoint subpath ([@nickrum](https://github.com/nickrum))
  - [#7604](https://github.com/directus/directus/pull/7604) Log localhost url on startup so it's clickable in terminals
    ([@zebapy](https://github.com/zebapy))
  - [#6923](https://github.com/directus/directus/pull/6923) Use root-relative base url for app and extensions
    ([@nickrum](https://github.com/nickrum))

### :bug: Bug Fixes

- **App**
  - [#7780](https://github.com/directus/directus/pull/7780) Use OpenMapTiles font instead of ArcGIS
    ([@Oreilles](https://github.com/Oreilles))
  - [#7778](https://github.com/directus/directus/pull/7778) Fixes bug when trying to edit geometry in code interface.
    ([@Oreilles](https://github.com/Oreilles))
  - [#7768](https://github.com/directus/directus/pull/7768) Fix hash link in docs module
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7763](https://github.com/directus/directus/pull/7763) Fix branch emitter logic from grand-to-child
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7760](https://github.com/directus/directus/pull/7760) Fix 'Inactive' to 'Invited' translations on user status
    ([@joselcvarela](https://github.com/joselcvarela))
  - [#7756](https://github.com/directus/directus/pull/7756) fix WYSIWYG field focus event
    ([@azrikahar](https://github.com/azrikahar))
  - [#7716](https://github.com/directus/directus/pull/7716) Fix input-code component lint style
    ([@azrikahar](https://github.com/azrikahar))
  - [#7712](https://github.com/directus/directus/pull/7712) Prevent generated columns edition
    ([@Oreilles](https://github.com/Oreilles))
  - [#7703](https://github.com/directus/directus/pull/7703) Fix alignment of collection nav grouping
    ([@Nitwel](https://github.com/Nitwel))
  - [#7698](https://github.com/directus/directus/pull/7698) Add permission prop check
    ([@Nitwel](https://github.com/Nitwel))
  - [#7697](https://github.com/directus/directus/pull/7697) Add upload event for file imports
    ([@azrikahar](https://github.com/azrikahar))
  - [#7684](https://github.com/directus/directus/pull/7684) Add missing translations
    ([@Nitwel](https://github.com/Nitwel))
  - [#7683](https://github.com/directus/directus/pull/7683) Move related values link to icon
    ([@Nitwel](https://github.com/Nitwel))
  - [#7682](https://github.com/directus/directus/pull/7682) Fix firefox being buggy with numbers as value inputs
    ([@Nitwel](https://github.com/Nitwel))
  - [#7669](https://github.com/directus/directus/pull/7669) Add missing translations
    ([@Nitwel](https://github.com/Nitwel))
  - [#7666](https://github.com/directus/directus/pull/7666) Fix items not getting matched properly
    ([@Nitwel](https://github.com/Nitwel))
  - [#7635](https://github.com/directus/directus/pull/7635) Prevent collection from crashing on unknown layout
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7632](https://github.com/directus/directus/pull/7632) Assign edits instead of merge
    ([@Nitwel](https://github.com/Nitwel))
  - [#7631](https://github.com/directus/directus/pull/7631) Fix o2m flashing / reloading when typing
    ([@Nitwel](https://github.com/Nitwel))
  - [#7628](https://github.com/directus/directus/pull/7628) Truely unref item ([@Nitwel](https://github.com/Nitwel))
  - [#7602](https://github.com/directus/directus/pull/7602) Add mapbox-key to map interface initialization
    ([@Oreilles](https://github.com/Oreilles))
  - [#7599](https://github.com/directus/directus/pull/7599) Check if perms have edits
    ([@Nitwel](https://github.com/Nitwel))
  - [#7562](https://github.com/directus/directus/pull/7562) Fix calendar layout not opening detail pages for system
    collections ([@azrikahar](https://github.com/azrikahar))
  - :warning: [#7489](https://github.com/directus/directus/pull/7489) Rework layout extension component management
    ([@nickrum](https://github.com/nickrum))
- **Extensions**
  - [#7624](https://github.com/directus/directus/pull/7624) Enable browser module resolution when building app
    extensions ([@nickrum](https://github.com/nickrum))
- **API**
  - [#7581](https://github.com/directus/directus/pull/7581) Fix uploaded_by not always setting user
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7568](https://github.com/directus/directus/pull/7568) fix(api): merge original user object into payload from auth
    hook ([@azrikahar](https://github.com/azrikahar))
  - [#7561](https://github.com/directus/directus/pull/7561) Handle difference between `pg` and `postgres` as db client
    in geometry helper ([@Oreilles](https://github.com/Oreilles))
  - [#7553](https://github.com/directus/directus/pull/7553) Fix asset transformation `withEnlargement` type
    ([@azrikahar](https://github.com/azrikahar))

### :sponge: Optimizations

- **App**
  - [#7717](https://github.com/directus/directus/pull/7717) Use self-closing slot tags everywhere
    ([@nickrum](https://github.com/nickrum))
  - [#7603](https://github.com/directus/directus/pull/7603) Make the asset url regex unambiguous
    ([@nickrum](https://github.com/nickrum))
  - :warning: [#7489](https://github.com/directus/directus/pull/7489) Rework layout extension component management
    ([@nickrum](https://github.com/nickrum))
- **Misc.**
  - [#7713](https://github.com/directus/directus/pull/7713) Expose package.json from shared and extensions-sdk
    ([@nickrum](https://github.com/nickrum))
  - [#7654](https://github.com/directus/directus/pull/7654) Explicitly set catch parameters to any type
    ([@nickrum](https://github.com/nickrum))
  - [#7640](https://github.com/directus/directus/pull/7640) Fix typescript issues
    ([@nickrum](https://github.com/nickrum))
  - [#7617](https://github.com/directus/directus/pull/7617) Fix lint warnings ([@nickrum](https://github.com/nickrum))
- **Extensions**
  - :warning: [#7282](https://github.com/directus/directus/pull/7282) Rename extension-sdk to extensions-sdk
    ([@nickrum](https://github.com/nickrum))

### :memo: Documentation

- [#7771](https://github.com/directus/directus/pull/7771) tiny rewrite of operator descriptions in
  docs/reference/filter-rules ([@definiteIymaybe](https://github.com/definiteIymaybe))
- [#7757](https://github.com/directus/directus/pull/7757) Document usage of custom reset URL in request password in the
  SDK ([@joselcvarela](https://github.com/joselcvarela))
- [#7750](https://github.com/directus/directus/pull/7750) Update layout docs to new layouts system
  ([@nickrum](https://github.com/nickrum))
- [#7648](https://github.com/directus/directus/pull/7648) Update mentions of Vue 2 to Vue 3 in codebase-overview.md
  ([@azrikahar](https://github.com/azrikahar))
- [#7586](https://github.com/directus/directus/pull/7586) Add installation guide for plesk/shared hosting
  ([@Tummerhore](https://github.com/Tummerhore))

### :package: Dependency Updates

- [#7786](https://github.com/directus/directus/pull/7786) Update dependency npm to v7.22.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7785](https://github.com/directus/directus/pull/7785) Update vue monorepo to v3.2.8
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7770](https://github.com/directus/directus/pull/7770) Update dependency sass to v1.39.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7769](https://github.com/directus/directus/pull/7769) Update dependency knex-schema-inspector to v1.6.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7766](https://github.com/directus/directus/pull/7766) Update vue monorepo to v3.2.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7752](https://github.com/directus/directus/pull/7752) Update dependency vite to v2.5.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7742](https://github.com/directus/directus/pull/7742) Update dependency @types/sharp to v0.28.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7728](https://github.com/directus/directus/pull/7728) Update gatsby monorepo to v3.13.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7718](https://github.com/directus/directus/pull/7718) Update dependency knex-schema-inspector to v1.5.15
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7715](https://github.com/directus/directus/pull/7715) Update dependency vite to v2.5.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7708](https://github.com/directus/directus/pull/7708) Update dependency knex-schema-inspector to v1.5.14
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7705](https://github.com/directus/directus/pull/7705) Update dependency eslint-plugin-prettier to v4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7704](https://github.com/directus/directus/pull/7704) Update typescript-eslint monorepo to v4.30.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7690](https://github.com/directus/directus/pull/7690) Update dependency micromark to v3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7672](https://github.com/directus/directus/pull/7672) Update dependency sass to v1.38.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7656](https://github.com/directus/directus/pull/7656) update jest monorepo to v27.1.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7655](https://github.com/directus/directus/pull/7655) update dependency @types/markdown-it to v12.2.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7646](https://github.com/directus/directus/pull/7646) update dependency tinymce to v5.9.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7643](https://github.com/directus/directus/pull/7643) update dependency eslint-plugin-vue to v7.17.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7638](https://github.com/directus/directus/pull/7638) update dependency typescript to v4.4.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7614](https://github.com/directus/directus/pull/7614) update dependency tinymce to v5.9.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7606](https://github.com/directus/directus/pull/7606) pin dependencies
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7595](https://github.com/directus/directus/pull/7595) update dependency nock to v13.1.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7582](https://github.com/directus/directus/pull/7582) pin dependency @types/supertest to 2.0.11
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7580](https://github.com/directus/directus/pull/7580) update dependency @vitejs/plugin-vue to v1.6.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7579](https://github.com/directus/directus/pull/7579) update vue monorepo to v3.2.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7576](https://github.com/directus/directus/pull/7576) update vue monorepo to v3.2.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7571](https://github.com/directus/directus/pull/7571) update dependency @vitejs/plugin-vue to v1.5.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7570](https://github.com/directus/directus/pull/7570) update dependency vite to v2.5.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7558](https://github.com/directus/directus/pull/7558) update dependency sass to v1.38.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7556](https://github.com/directus/directus/pull/7556) update dependency @types/marked to v2.0.5
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.91 (August 23, 2021)

### :sparkles: New Features

- **Extensions**
  - [#7332](https://github.com/directus/directus/pull/7332) Add basic support for a config file to extension building
    ([@nickrum](https://github.com/nickrum))
- **API**
  - [#5684](https://github.com/directus/directus/pull/5684) Add support for Geometry type, add Map Layout & Interface
    ([@Oreilles](https://github.com/Oreilles))
- **App**
  - [#5684](https://github.com/directus/directus/pull/5684) Add support for Geometry type, add Map Layout & Interface
    ([@Oreilles](https://github.com/Oreilles))

### :rocket: Improvements

- **App**
  - [#7552](https://github.com/directus/directus/pull/7552) Improve stability of tree-view select interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7505](https://github.com/directus/directus/pull/7505) Set simple_select mode in map interface when the value is
    loaded. ([@Oreilles](https://github.com/Oreilles))
  - [#7462](https://github.com/directus/directus/pull/7462) Improve conditional fields
    ([@Nitwel](https://github.com/Nitwel))
  - [#7459](https://github.com/directus/directus/pull/7459) Allow cancelling the creation of custom permissions
    ([@Nitwel](https://github.com/Nitwel))
  - [#7456](https://github.com/directus/directus/pull/7456) Render href attributes on router-link
    ([@nickrum](https://github.com/nickrum))
- **gatsby-source-directus**
  - [#7528](https://github.com/directus/directus/pull/7528) Image auth
    ([@jacobrienstra](https://github.com/jacobrienstra))
- **API**
  - [#7501](https://github.com/directus/directus/pull/7501) Don't allow `empty` filter for non-string types. Add `null`
    filter where appropriate. ([@Oreilles](https://github.com/Oreilles))
  - [#7416](https://github.com/directus/directus/pull/7416) Fixes for GraphQL variables in HTTP GET requests
    ([@smilledge](https://github.com/smilledge))

### :bug: Bug Fixes

- **App**
  - [#7549](https://github.com/directus/directus/pull/7549) Fix field template removing text
    ([@Nitwel](https://github.com/Nitwel))
  - [#7543](https://github.com/directus/directus/pull/7543) Fix running useFieldTree on every keypress
    ([@Nitwel](https://github.com/Nitwel))
  - [#7525](https://github.com/directus/directus/pull/7525) Don't sort filters alphabetical
    ([@Nitwel](https://github.com/Nitwel))
  - [#7515](https://github.com/directus/directus/pull/7515) Hide filter input when filter operator is null/nnull.
    ([@Oreilles](https://github.com/Oreilles))
  - [#7513](https://github.com/directus/directus/pull/7513) Prevent 400 error on translations load for to-be-created
    items ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7512](https://github.com/directus/directus/pull/7512) Explicitly nullify user/role when the other is set in
    presets ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7509](https://github.com/directus/directus/pull/7509) Allow fetching singleton content through pk route
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7462](https://github.com/directus/directus/pull/7462) Improve conditional fields
    ([@Nitwel](https://github.com/Nitwel))
  - [#7460](https://github.com/directus/directus/pull/7460) Add edge case using mysql for tinyint as boolean
    ([@Nitwel](https://github.com/Nitwel))
  - [#7459](https://github.com/directus/directus/pull/7459) Allow cancelling the creation of custom permissions
    ([@Nitwel](https://github.com/Nitwel))
  - [#7452](https://github.com/directus/directus/pull/7452) Add simple audio support for WYSIWYG
    ([@Nitwel](https://github.com/Nitwel))
  - [#7439](https://github.com/directus/directus/pull/7439) remove list-style for v-list
    ([@azrikahar](https://github.com/azrikahar))
  - [#7379](https://github.com/directus/directus/pull/7379) Export Collection button now shows collection name not table
    name ([@jaycammarano](https://github.com/jaycammarano))
  - [#7371](https://github.com/directus/directus/pull/7371) Fix english string after #7358
    ([@dimitrov-adrian](https://github.com/dimitrov-adrian))
- **sdk**
  - [#7514](https://github.com/directus/directus/pull/7514) Fix SDK request URL when updating fields
    ([@smilledge](https://github.com/smilledge))
- **API**
  - [#7501](https://github.com/directus/directus/pull/7501) Don't allow `empty` filter for non-string types. Add `null`
    filter where appropriate. ([@Oreilles](https://github.com/Oreilles))
  - [#7486](https://github.com/directus/directus/pull/7486) Fix server error when a postgres view contains geometry
    columns ([@Oreilles](https://github.com/Oreilles))
  - [#7416](https://github.com/directus/directus/pull/7416) Fixes for GraphQL variables in HTTP GET requests
    ([@smilledge](https://github.com/smilledge))
  - [#7392](https://github.com/directus/directus/pull/7392) Fix typecasting of required field
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :memo: Documentation

- [#7516](https://github.com/directus/directus/pull/7516) Link to awesome-directus in introduction doc
  ([@paescuj](https://github.com/paescuj))
- [#7479](https://github.com/directus/directus/pull/7479) Add docker compose update instructions
  ([@tanc](https://github.com/tanc))

### :package: Dependency Updates

- [#7548](https://github.com/directus/directus/pull/7548) update dependency tedious to v12
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7547](https://github.com/directus/directus/pull/7547) update dependency tedious to v11.8.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7542](https://github.com/directus/directus/pull/7542) update dependency rollup to v2.56.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7539](https://github.com/directus/directus/pull/7539) update dependency vuedraggable to v4.1.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7536](https://github.com/directus/directus/pull/7536) update dependency pino-http to v5.7.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7534](https://github.com/directus/directus/pull/7534) update dependency pino to v6.13.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7532](https://github.com/directus/directus/pull/7532) update dependency eslint-plugin-prettier to v3.4.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7530](https://github.com/directus/directus/pull/7530) update dependency nock to v13.1.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7529](https://github.com/directus/directus/pull/7529) update dependency @types/js-yaml to v4.0.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7524](https://github.com/directus/directus/pull/7524) pin dependency gatsby-source-graphql to 3.12.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7523](https://github.com/directus/directus/pull/7523) Update dependencies of gatsby-source-directus
  ([@jacobrienstra](https://github.com/jacobrienstra))
- [#7521](https://github.com/directus/directus/pull/7521) update dependency knex to v0.95.10
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7520](https://github.com/directus/directus/pull/7520) update dependency codemirror to v5.62.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7510](https://github.com/directus/directus/pull/7510) update dependency @types/jsonwebtoken to v8.5.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7504](https://github.com/directus/directus/pull/7504) pin dependency jest-environment-jsdom to 27.0.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7503](https://github.com/directus/directus/pull/7503) update dependency pinia to v2.0.0-rc.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7495](https://github.com/directus/directus/pull/7495) update dependency ts-node to v10.2.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7482](https://github.com/directus/directus/pull/7482) update dependency gatsby-source-filesystem to v3.12.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7472](https://github.com/directus/directus/pull/7472) update dependency supertest to v6.1.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7467](https://github.com/directus/directus/pull/7467) update vue monorepo to v3.2.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7461](https://github.com/directus/directus/pull/7461) update dependency sharp to ^0.29.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7453](https://github.com/directus/directus/pull/7453) update dependency ts-jest to v27.0.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7449](https://github.com/directus/directus/pull/7449) update dependency simple-git-hooks to v2.6.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7448](https://github.com/directus/directus/pull/7448) update dependency sass to v1.38.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7444](https://github.com/directus/directus/pull/7444) update vue monorepo to v3.2.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7440](https://github.com/directus/directus/pull/7440) update dependency @types/mime-types to v2.1.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7438](https://github.com/directus/directus/pull/7438) update typescript-eslint monorepo to v4.29.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7437](https://github.com/directus/directus/pull/7437) update dependency @mapbox/mapbox-gl-geocoder to v4.7.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7425](https://github.com/directus/directus/pull/7425) update dependency vite to v2.5.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7424](https://github.com/directus/directus/pull/7424) update dependency marked to v3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7418](https://github.com/directus/directus/pull/7418) update dependency @types/markdown-it to v12.2.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7407](https://github.com/directus/directus/pull/7407) update dependency dompurify to v2.3.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7387](https://github.com/directus/directus/pull/7387) update dependency npm to v7.20.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7384](https://github.com/directus/directus/pull/7384) pin dependencies
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7381](https://github.com/directus/directus/pull/7381) update dependency macos-release to v3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7380](https://github.com/directus/directus/pull/7380) update dependency directory-tree to v2.3.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7376](https://github.com/directus/directus/pull/7376) update dependency directory-tree to v2.3.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7375](https://github.com/directus/directus/pull/7375) update dependency nanoid to v3.1.25
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7365](https://github.com/directus/directus/pull/7365) update dependency nanoid to v3.1.24
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7360](https://github.com/directus/directus/pull/7360) update dependency supertest to v6.1.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7355](https://github.com/directus/directus/pull/7355) update vue monorepo to v3.2.2
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.90 (August 11, 2021)

### :rocket: Improvements

- **App**
  - [#7358](https://github.com/directus/directus/pull/7358) Add missing translations
    ([@dimitrov-adrian](https://github.com/dimitrov-adrian))
- **API**
  - [#7310](https://github.com/directus/directus/pull/7310) Add permission check for sqlite, upload and extensions
    directories ([@paescuj](https://github.com/paescuj))

### :bug: Bug Fixes

- **API**
  - [#7331](https://github.com/directus/directus/pull/7331) Check for non-existing parent pk records
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7323](https://github.com/directus/directus/pull/7323) Check for related collection before creation relation
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7319](https://github.com/directus/directus/pull/7319) Fix graphql GET request cache query extraction
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7315](https://github.com/directus/directus/pull/7315) Clear the file payload after file upload
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7312](https://github.com/directus/directus/pull/7312) Fix uuid resolving in DBs without returning support
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#7327](https://github.com/directus/directus/pull/7327) Fix schema field types not being translated in the app
    ([@dimitrov-adrian](https://github.com/dimitrov-adrian))
  - [#7322](https://github.com/directus/directus/pull/7322) Fix colors on different types
    ([@dimitrov-adrian](https://github.com/dimitrov-adrian))
- **sdk**
  - [#7304](https://github.com/directus/directus/pull/7304) Fix HTTP method for collections.createMany in SDK
    ([@paescuj](https://github.com/paescuj))

### :package: Dependency Updates

- [#7303](https://github.com/directus/directus/pull/7303) update dependency rollup to v2.56.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7300](https://github.com/directus/directus/pull/7300) update dependency eslint-plugin-vue to v7.16.0
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.89 (August 9, 2021)

### :sparkles: New Features

- **App**
  - [#7202](https://github.com/directus/directus/pull/7202) Support dynamic variables in conditional fields
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7166](https://github.com/directus/directus/pull/7166) Add support for app-required field state
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **API**
  - [#7201](https://github.com/directus/directus/pull/7201) Allow JSON in env variables
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7082](https://github.com/directus/directus/pull/7082) Allow setting TLS options for SMTP configuration
    ([@bernatvadell](https://github.com/bernatvadell))
- **sdk**
  - [#7192](https://github.com/directus/directus/pull/7192) Updated routes for SDK Settings, Relations, Collections, and
    Fields ([@jaycammarano](https://github.com/jaycammarano))

### :rocket: Improvements

- **API**
  - [#7294](https://github.com/directus/directus/pull/7294) Flush caches on server (re)start
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7287](https://github.com/directus/directus/pull/7287) Only treat `tinyint(1)` and `tinyint(0)` as booleans
    ([@jaycammarano](https://github.com/jaycammarano))
  - [#7259](https://github.com/directus/directus/pull/7259) Rely on `RETURNING` when possible
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7248](https://github.com/directus/directus/pull/7248) Add logger statement on password request failures
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7226](https://github.com/directus/directus/pull/7226) Add cache connection fallbacks
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7223](https://github.com/directus/directus/pull/7223) Warn if a collection includes a space
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7176](https://github.com/directus/directus/pull/7176) Don't trigger updates for pre-existing selected items
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7170](https://github.com/directus/directus/pull/7170) Show any sso login warnings in stdout
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6922](https://github.com/directus/directus/pull/6922) Switch to exifr for image metadata extraction
    ([@paescuj](https://github.com/paescuj))
- **Extensions**
  - [#7275](https://github.com/directus/directus/pull/7275) Only loads app extensions if SERVE_APP is true
    ([@nickrum](https://github.com/nickrum))
- **App**
  - [#7274](https://github.com/directus/directus/pull/7274) Log error message when registering app extension fails
    ([@nickrum](https://github.com/nickrum))
  - [#7254](https://github.com/directus/directus/pull/7254) Rate limit the outgoing requests from the app
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7229](https://github.com/directus/directus/pull/7229) Update/tweak groups
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7177](https://github.com/directus/directus/pull/7177) Refresh token after idle period/background tab
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7161](https://github.com/directus/directus/pull/7161) Add show all/selected toggle to tree-select
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :bug: Bug Fixes

- **App**
  - [#7292](https://github.com/directus/directus/pull/7292) Handle JSON in labels display
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7258](https://github.com/directus/directus/pull/7258) Don't use tags interface for CSV filter
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7253](https://github.com/directus/directus/pull/7253) Fix formatted-value overflow ellipsis on card layout
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7252](https://github.com/directus/directus/pull/7252) Handle empty collection group in custom nav
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7175](https://github.com/directus/directus/pull/7175) Fix export sidebar detail for system collections
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7173](https://github.com/directus/directus/pull/7173) Only trim input on blur for text based values
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7169](https://github.com/directus/directus/pull/7169) Make sure disabled prevents click on list-item
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7158](https://github.com/directus/directus/pull/7158) Fix list-selection branch mode unselect bug
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **Extensions**
  - [#7279](https://github.com/directus/directus/pull/7279) Fix gitignore file in extension templates being deleted when
    publishing ([@nickrum](https://github.com/nickrum))
  - [#7196](https://github.com/directus/directus/pull/7196) extension-sdk no long missing common folder
    ([@jaycammarano](https://github.com/jaycammarano))
- **API**
  - [#7259](https://github.com/directus/directus/pull/7259) Rely on `RETURNING` when possible
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7249](https://github.com/directus/directus/pull/7249) Fix import of perf hook on node < 16
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7240](https://github.com/directus/directus/pull/7240) Fix error on item creation with no validation step
    ([@bernatvadell](https://github.com/bernatvadell))
  - [#7200](https://github.com/directus/directus/pull/7200) Fix timezone problems in `dateTime` type
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7168](https://github.com/directus/directus/pull/7168) Fix nested m2a collection permission retrieval
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **sdk**
  - [#7192](https://github.com/directus/directus/pull/7192) Updated routes for SDK Settings, Relations, Collections, and
    Fields ([@jaycammarano](https://github.com/jaycammarano))
- **specs**
  - [#7172](https://github.com/directus/directus/pull/7172) Fix spec for default folder setting
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :memo: Documentation

- [#7174](https://github.com/directus/directus/pull/7174) Remove advanced example
  ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :package: Dependency Updates

- [#7293](https://github.com/directus/directus/pull/7293) update vue monorepo to v3.2.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7289](https://github.com/directus/directus/pull/7289) update dependency vue to v3.2.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7288](https://github.com/directus/directus/pull/7288) update dependency @vue/compiler-sfc to v3.2.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7283](https://github.com/directus/directus/pull/7283) update typescript-eslint monorepo to v4.29.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7272](https://github.com/directus/directus/pull/7272) update dependency vue-router to v4.0.11
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7271](https://github.com/directus/directus/pull/7271) update dependency ts-node to v10.2.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7269](https://github.com/directus/directus/pull/7269) update dependency rollup to v2.56.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7263](https://github.com/directus/directus/pull/7263) update dependency @vitejs/plugin-vue to v1.4.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7255](https://github.com/directus/directus/pull/7255) update dependency p-queue to v7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7238](https://github.com/directus/directus/pull/7238) update dependency lint-staged to v11.1.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7230](https://github.com/directus/directus/pull/7230) Fix pino deprecation warning
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#7227](https://github.com/directus/directus/pull/7227) update dependency npm to v7.20.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7225](https://github.com/directus/directus/pull/7225) update dependency npm to v7.20.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7208](https://github.com/directus/directus/pull/7208) update dependency rollup to v2.56.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7194](https://github.com/directus/directus/pull/7194) update dependency gatsby-source-filesystem to v3.11.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7187](https://github.com/directus/directus/pull/7187) update dependency npm to v7.20.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7181](https://github.com/directus/directus/pull/7181) update dependency sass to v1.37.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7179](https://github.com/directus/directus/pull/7179) update dependency sass to v1.37.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7171](https://github.com/directus/directus/pull/7171) update dependency sass to v1.37.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7165](https://github.com/directus/directus/pull/7165) update dependency @popperjs/core to v2.9.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7153](https://github.com/directus/directus/pull/7153) update dependency @types/lodash to v4.14.172
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7151](https://github.com/directus/directus/pull/7151) update dependency eslint-plugin-vue to v7.15.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7150](https://github.com/directus/directus/pull/7150) update dependency sass to v1.37.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7148](https://github.com/directus/directus/pull/7148) update dependency sass to v1.37.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7055](https://github.com/directus/directus/pull/7055) update dependency pinia to v2.0.0-rc.3
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.88 (August 2, 2021)

### :sparkles: New Features

- **App**
  - [#7130](https://github.com/directus/directus/pull/7130) Add accordion group
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7101](https://github.com/directus/directus/pull/7101) Surface dropdown choices in advanced sidebar filter
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :rocket: Improvements

- **App**
  - [#7141](https://github.com/directus/directus/pull/7141) Title format repeater names
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7132](https://github.com/directus/directus/pull/7132) Add missing keys to translations
    ([@nickrum](https://github.com/nickrum))
  - [#7103](https://github.com/directus/directus/pull/7103) Add a standardized max-height to tree select interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7102](https://github.com/directus/directus/pull/7102) Render list group arrows on the left of the group checkbox
    in the tree select interface ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7059](https://github.com/directus/directus/pull/7059) Added "Default Open" Checkbox to Field Group Dividers
    ([@m0rtis0](https://github.com/m0rtis0))
- **API**
  - [#7105](https://github.com/directus/directus/pull/7105) Stall login/pw reset to prevent email leaking
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6580](https://github.com/directus/directus/pull/6580) Warn on Missing Migrations
    ([@jaycammarano](https://github.com/jaycammarano))

### :bug: Bug Fixes

- **App**
  - [#7142](https://github.com/directus/directus/pull/7142) Prevent duplicate alias fields from being created
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7135](https://github.com/directus/directus/pull/7135) Fix nested fields check in validate-payload handler
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7131](https://github.com/directus/directus/pull/7131) Fix default value of select-icon interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **API**
  - [#7139](https://github.com/directus/directus/pull/7139) Fix cache-key generation for query params
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7104](https://github.com/directus/directus/pull/7104) Fix users accountability tracking
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :memo: Documentation

- [#7106](https://github.com/directus/directus/pull/7106) Add note on conditional fields
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#7099](https://github.com/directus/directus/pull/7099) Add note regarding required directus:extension field to
  extension docs ([@nickrum](https://github.com/nickrum))
- [#7079](https://github.com/directus/directus/pull/7079) Add note on npm run dev restart
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#7077](https://github.com/directus/directus/pull/7077) Add note on hook params
  ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :package: Dependency Updates

- [#7136](https://github.com/directus/directus/pull/7136) update typescript-eslint monorepo to v4.29.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7117](https://github.com/directus/directus/pull/7117) update dependency joi to v17.4.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7115](https://github.com/directus/directus/pull/7115) update dependency knex to v0.95.9
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7110](https://github.com/directus/directus/pull/7110) update dependency sass to v1.37.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7109](https://github.com/directus/directus/pull/7109) update dependency eslint to v7.32.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7094](https://github.com/directus/directus/pull/7094) update dependency @rollup/plugin-commonjs to v20
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7093](https://github.com/directus/directus/pull/7093) update dependency chalk to v4.1.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7090](https://github.com/directus/directus/pull/7090) update dependency npm-watch to v0.11.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7089](https://github.com/directus/directus/pull/7089) update dependency eslint-plugin-vue to v7.15.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7087](https://github.com/directus/directus/pull/7087) update styfle/cancel-workflow-action action to v0.9.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7085](https://github.com/directus/directus/pull/7085) update dependency rollup to v2.55.1
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.87 (July 28, 2021)

### :sparkles: New Features

- **API**
  - [#7014](https://github.com/directus/directus/pull/7014) Add new /utils/cache/clear endpoint
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7008](https://github.com/directus/directus/pull/7008) Prevent from deleting the last admin user
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :rocket: Improvements

- **App**
  - [#7025](https://github.com/directus/directus/pull/7025) Handle autocomplete empty path configurations
    ([@luanmm](https://github.com/luanmm))
  - [#7013](https://github.com/directus/directus/pull/7013) Use limit layoutQuery in export sidebar detail
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **API**
  - [#7003](https://github.com/directus/directus/pull/7003) Default SERVE_APP to true
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6987](https://github.com/directus/directus/pull/6987) Wait for the database to be ready in bootstrap step
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6852](https://github.com/directus/directus/pull/6852) Support for notifying user if an update is available for
    Directus CLI ([@msaaddev](https://github.com/msaaddev))

### :bug: Bug Fixes

- **API**
  - [#7060](https://github.com/directus/directus/pull/7060) Fix top level perm check on nested m2a records
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7050](https://github.com/directus/directus/pull/7050) Don't throw 500 on missing email
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7042](https://github.com/directus/directus/pull/7042) Fix type checking in password reset controller
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7041](https://github.com/directus/directus/pull/7041) Fix mssql max-length doubling
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7027](https://github.com/directus/directus/pull/7027) Move object-hash to non-optional deps
    ([@paescuj](https://github.com/paescuj))
  - [#7021](https://github.com/directus/directus/pull/7021) Fix cache-key causing problems in memcached
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7020](https://github.com/directus/directus/pull/7020) Don't return collections outside of cache
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7019](https://github.com/directus/directus/pull/7019) Fix MS SQL unique constraint field name extraction
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7008](https://github.com/directus/directus/pull/7008) Prevent from deleting the last admin user
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7003](https://github.com/directus/directus/pull/7003) Default SERVE_APP to true
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#7057](https://github.com/directus/directus/pull/7057) Fix last action button not surfacing on mobile
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7049](https://github.com/directus/directus/pull/7049) Fix value unstaging in nested field groups
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7045](https://github.com/directus/directus/pull/7045) Remove illegal words from translations root
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7018](https://github.com/directus/directus/pull/7018) Add selectMode to Calendar layout
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7012](https://github.com/directus/directus/pull/7012) Fix M2O type in O2M creation when referencing UUID-PK
    collections ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#7005](https://github.com/directus/directus/pull/7005) Fix advanced filter sidebar detail
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6924](https://github.com/directus/directus/pull/6924) Add modular extension badge to app docs
    ([@Nitwel](https://github.com/Nitwel))
  - [#6775](https://github.com/directus/directus/pull/6775) Calendar range render
    ([@bernatvadell](https://github.com/bernatvadell))

### :package: Dependency Updates

- [#7056](https://github.com/directus/directus/pull/7056) update fullcalendar monorepo to v5.9.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7028](https://github.com/directus/directus/pull/7028) update dependency rollup to v2.55.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7023](https://github.com/directus/directus/pull/7023) update dependency pg to v8.7.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7022](https://github.com/directus/directus/pull/7022) update dependency @types/dockerode to v3.2.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7017](https://github.com/directus/directus/pull/7017) update dependency @types/sharp to v0.28.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#7007](https://github.com/directus/directus/pull/7007) update dependency pg to v8.7.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6998](https://github.com/directus/directus/pull/6998) update dependency @vitejs/plugin-vue to v1.3.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6997](https://github.com/directus/directus/pull/6997) update dependency vite to v2.4.4
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.86 (July 26, 2021)

### :sparkles: New Features

- **API**
  - [#6890](https://github.com/directus/directus/pull/6890) Allow using a custom name for the refresh token cookie
    ([@j3n57h0m45](https://github.com/j3n57h0m45))
  - [#6593](https://github.com/directus/directus/pull/6593) Allow custom transformations of assets
    ([@tim-smart](https://github.com/tim-smart))
- **App**
  - [#6864](https://github.com/directus/directus/pull/6864) Add support for Conditional Fields
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#3209](https://github.com/directus/directus/pull/3209) Add default-folder option
    ([@dimitrov-adrian](https://github.com/dimitrov-adrian))

### :rocket: Improvements

- **API**
  - [#6984](https://github.com/directus/directus/pull/6984) Fix pino deprecation warning
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6977](https://github.com/directus/directus/pull/6977) Improve error reporting on CLI bootstrap command
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6860](https://github.com/directus/directus/pull/6860) Use `/` as default value for public_url
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6845](https://github.com/directus/directus/pull/6845) Make extension loading more robust
    ([@nickrum](https://github.com/nickrum))
  - [#6843](https://github.com/directus/directus/pull/6843) Improve default value extraction in MS SQL
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6840](https://github.com/directus/directus/pull/6840) Show warning when PUBLIC_URL isn't correctly configured
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **Extensions**
  - [#6845](https://github.com/directus/directus/pull/6845) Make extension loading more robust
    ([@nickrum](https://github.com/nickrum))
- **App**
  - [#6838](https://github.com/directus/directus/pull/6838) Auto-open groups on search in tree-select
    ([@rijkvanzanten](https://github.com/rijkvanzanten))

### :bug: Bug Fixes

- **API**
  - [#6968](https://github.com/directus/directus/pull/6968) Fix quotes with schema default values
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#6862](https://github.com/directus/directus/pull/6862) Fix extension loading on Windows
    ([@nickrum](https://github.com/nickrum))
  - [#6847](https://github.com/directus/directus/pull/6847) Make sure every DB returns time as HH:mm:ss
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6841](https://github.com/directus/directus/pull/6841) Fixed issue that would cause the wrong field to be extracted
    when using "detailed" updates in o2m with non-"id" primary keys ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **App**
  - [#6943](https://github.com/directus/directus/pull/6943) Fix form field sort order
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6856](https://github.com/directus/directus/pull/6856) Fix logs logo alignment
    ([@SeanDylanGoff](https://github.com/SeanDylanGoff))
- **sdk**
  - [#6925](https://github.com/directus/directus/pull/6925) Fix SDK invite accept
    ([@MajesteitBart](https://github.com/MajesteitBart))
- **Misc.**
  - [#6878](https://github.com/directus/directus/pull/6878) Fix update/delete relation docs
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **Extensions**
  - [#6862](https://github.com/directus/directus/pull/6862) Fix extension loading on Windows
    ([@nickrum](https://github.com/nickrum))

### :memo: Documentation

- [#6962](https://github.com/directus/directus/pull/6962) Add PUBLIC_URL example in docker-compose guide
  ([@paescuj](https://github.com/paescuj))
- [#6920](https://github.com/directus/directus/pull/6920) Use `--workspace` instead of `cd` in "Running locally" guide
  ([@paescuj](https://github.com/paescuj))
- [#6878](https://github.com/directus/directus/pull/6878) Fix update/delete relation docs
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#6846](https://github.com/directus/directus/pull/6846) Correctly document the default value of PUBLIC_URL
  ([@nickrum](https://github.com/nickrum))
- [#6830](https://github.com/directus/directus/pull/6830) Fix session memcache variable name
  ([@Moeriki](https://github.com/Moeriki))

### :package: Dependency Updates

- [#6985](https://github.com/directus/directus/pull/6985) pin dependency lodash to 4.17.21
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6983](https://github.com/directus/directus/pull/6983) pin dependency joi to 17.4.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6980](https://github.com/directus/directus/pull/6980) update dependency @rollup/plugin-yaml to v3.1.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6979](https://github.com/directus/directus/pull/6979) update typescript-eslint monorepo to v4.28.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6976](https://github.com/directus/directus/pull/6976) update dependency knex-schema-inspector to v1.5.12
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6975](https://github.com/directus/directus/pull/6975) Update knex-schema-inspector@1.5.12
  ([@rijkvanzanten](https://github.com/rijkvanzanten))
- [#6973](https://github.com/directus/directus/pull/6973) update dependency @rollup/plugin-commonjs to v19.0.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6958](https://github.com/directus/directus/pull/6958) update dependency knex to v0.95.8
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6954](https://github.com/directus/directus/pull/6954) update dependency rollup to v2.54.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6951](https://github.com/directus/directus/pull/6951) update dependency @rollup/plugin-node-resolve to v13.0.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6949](https://github.com/directus/directus/pull/6949) update dependency lint-staged to v11.1.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6944](https://github.com/directus/directus/pull/6944) update dependency sass to v1.36.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6934](https://github.com/directus/directus/pull/6934) update dependency date-fns to v2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6933](https://github.com/directus/directus/pull/6933) update dependency tedious to v11.4.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6928](https://github.com/directus/directus/pull/6928) update dependency lint-staged to v11.1.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6914](https://github.com/directus/directus/pull/6914) pin dependency @types/object-hash to 2.1.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6913](https://github.com/directus/directus/pull/6913) update dependency ts-jest to v27.0.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6911](https://github.com/directus/directus/pull/6911) update dependency codemirror to v5.62.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6903](https://github.com/directus/directus/pull/6903) update dependency rollup to v2.53.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6901](https://github.com/directus/directus/pull/6901) update dependency supertest to v6.1.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6896](https://github.com/directus/directus/pull/6896) update dependency codemirror to v5.62.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6894](https://github.com/directus/directus/pull/6894) update dependency gatsby-source-filesystem to v3.10.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6891](https://github.com/directus/directus/pull/6891) update dependency vite to v2.4.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6882](https://github.com/directus/directus/pull/6882) update typescript-eslint monorepo to v4.28.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6874](https://github.com/directus/directus/pull/6874) update dependency @types/dockerode to v3.2.6
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6873](https://github.com/directus/directus/pull/6873) update dependency stylelint-scss to v3.20.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6869](https://github.com/directus/directus/pull/6869) update dependency eslint-plugin-vue to v7.14.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6868](https://github.com/directus/directus/pull/6868) update dependency eslint to v7.31.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6863](https://github.com/directus/directus/pull/6863) update vue monorepo to v3.1.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6855](https://github.com/directus/directus/pull/6855) update dependency @types/dockerode to v3.2.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6849](https://github.com/directus/directus/pull/6849) update dependency @rollup/plugin-node-resolve to v13.0.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6839](https://github.com/directus/directus/pull/6839) update dependency slugify to v1.6.0
  ([@renovate[bot]](https://github.com/apps/renovate))

Directus refs/tags/v9.0.0-rc.86

## v9.0.0-rc.85 (July 15, 2021)

### :bug: Bug Fixes

- **shared**
  - [#6836](https://github.com/directus/directus/pull/6836) Fix production build on node versions <16
    ([@nickrum](https://github.com/nickrum))

## v9.0.0-rc.84 (July 15, 2021)

### :sparkles: New Features

- **sdk**
  - [#6824](https://github.com/directus/directus/pull/6824) add updateByQuery to js sdk
    ([@wc-matteo](https://github.com/wc-matteo))
  - [#6742](https://github.com/directus/directus/pull/6742) Support invite_url in SDK invite method
    ([@paescuj](https://github.com/paescuj))
- **App**
  - [#6799](https://github.com/directus/directus/pull/6799) Support Slovenian language
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **Docker**
  - [#6796](https://github.com/directus/directus/pull/6796) Add support for Docker ARM image
    ([@paescuj](https://github.com/paescuj))
- **Extensions**
  - [#6735](https://github.com/directus/directus/pull/6735) Allow extension-sdk to bundle API extensions as well
    ([@nickrum](https://github.com/nickrum))

### :rocket: Improvements

- **App**
  - [#6835](https://github.com/directus/directus/pull/6835) Add v-md directive
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6640](https://github.com/directus/directus/pull/6640) Support arrays in formatted-json-value display
    ([@Kematia](https://github.com/Kematia))
- **Extensions**
  - [#6835](https://github.com/directus/directus/pull/6835) Add v-md directive
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6706](https://github.com/directus/directus/pull/6706) Configure build command based on extension manifest
    ([@nickrum](https://github.com/nickrum))
- **API**
  - [#6804](https://github.com/directus/directus/pull/6804) Allow setting a custom mailgun host
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6746](https://github.com/directus/directus/pull/6746) Add encrypt option to MS SQL questions
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6734](https://github.com/directus/directus/pull/6734) No error message from password reset request #6658
    ([@dannycoulombe](https://github.com/dannycoulombe))
- **create-directus-project**
  - [#6791](https://github.com/directus/directus/pull/6791) Catch and show errors in execa calls
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **Docker**
  - [#6659](https://github.com/directus/directus/pull/6659) Install exact version of Directus
    ([@paescuj](https://github.com/paescuj))

### :bug: Bug Fixes

- **Misc.**
  - [#6813](https://github.com/directus/directus/pull/6813) Add required deps for Docker ARM build
    ([@paescuj](https://github.com/paescuj))
  - [#6805](https://github.com/directus/directus/pull/6805) disable lerna access verification
    ([@SeanDylanGoff](https://github.com/SeanDylanGoff))
- **App**
  - [#6810](https://github.com/directus/directus/pull/6810) Fix sidebar overflow in preset detail
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6809](https://github.com/directus/directus/pull/6809) Fix relationship setup not showing current collection
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6807](https://github.com/directus/directus/pull/6807) Clear group when duplicating field
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6806](https://github.com/directus/directus/pull/6806) Fix system locked fields showing double
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6801](https://github.com/directus/directus/pull/6801) Fix permissions/validation default value for full
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6800](https://github.com/directus/directus/pull/6800) Fetch all languages in the translations interface
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6733](https://github.com/directus/directus/pull/6733) Fix md editor being empty when editing existing value
    ([@nickrum](https://github.com/nickrum))
  - [#6732](https://github.com/directus/directus/pull/6732) Fix two small issues around field grouping
    ([@nickrum](https://github.com/nickrum))
- **API**
  - [#6808](https://github.com/directus/directus/pull/6808) Use [String] for CSV type in GraphQL
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6783](https://github.com/directus/directus/pull/6783) Fixed issue that would prevent reordering in M2A
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
  - [#6740](https://github.com/directus/directus/pull/6740) Fix "Duplicate environment variable" error message never
    showing up ([@paescuj](https://github.com/paescuj))
  - [#6722](https://github.com/directus/directus/pull/6722) Fixed migration changing filesize failing on Oracle
    ([@aidenfoxx](https://github.com/aidenfoxx))
  - [#6645](https://github.com/directus/directus/pull/6645) Fix item.read hook not firing for readByQuery
    ([@MoltenCoffee](https://github.com/MoltenCoffee))
- **Extensions**
  - [#6700](https://github.com/directus/directus/pull/6700) Fix requiring vue from a cjs/umd dependency in a extension
    ([@nickrum](https://github.com/nickrum))

### :memo: Documentation

- [#6785](https://github.com/directus/directus/pull/6785) Clarify definition of environment variables
  ([@paescuj](https://github.com/paescuj))
- [#6784](https://github.com/directus/directus/pull/6784) Add note about sensitive values in Docker guide
  ([@paescuj](https://github.com/paescuj))

### :package: Dependency Updates

- [#6828](https://github.com/directus/directus/pull/6828) update dependency @rollup/plugin-node-resolve to v13.0.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6826](https://github.com/directus/directus/pull/6826) update dependency @rollup/plugin-commonjs to v19.0.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6812](https://github.com/directus/directus/pull/6812) update dependency rollup to v2.53.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6788](https://github.com/directus/directus/pull/6788) update dependency tedious to v11.2.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6780](https://github.com/directus/directus/pull/6780) update dependency vue-i18n to v9.1.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6777](https://github.com/directus/directus/pull/6777) update dependency lint-staged to v11.0.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6769](https://github.com/directus/directus/pull/6769) update typescript-eslint monorepo to v4.28.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6768](https://github.com/directus/directus/pull/6768) update dependency vite to v2.4.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6767](https://github.com/directus/directus/pull/6767) update dependency @vitejs/plugin-vue to v1.2.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6748](https://github.com/directus/directus/pull/6748) update dependency pinia to v2.0.0-beta.5
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6747](https://github.com/directus/directus/pull/6747) update dependency knex to v0.95.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6745](https://github.com/directus/directus/pull/6745) update dependency @tinymce/tinymce-vue to v4.0.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6744](https://github.com/directus/directus/pull/6744) update dependency ts-node to v10.1.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6727](https://github.com/directus/directus/pull/6727) update dependency @types/cors to v2.8.12
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6726](https://github.com/directus/directus/pull/6726) update dependency @types/figlet to v1.5.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6724](https://github.com/directus/directus/pull/6724) update dependency @types/marked-terminal to v3.1.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6717](https://github.com/directus/directus/pull/6717) update dependency sass to v1.35.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6716](https://github.com/directus/directus/pull/6716) update dependency @types/qs to v6.9.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6715](https://github.com/directus/directus/pull/6715) update dependency @types/qrcode to v1.4.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6712](https://github.com/directus/directus/pull/6712) update dependency @types/nodemailer to v6.4.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6711](https://github.com/directus/directus/pull/6711) update dependency gatsby-source-filesystem to v3.9.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6710](https://github.com/directus/directus/pull/6710) update dependency rollup to v2.53.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6708](https://github.com/directus/directus/pull/6708) update dependency @types/node-cron to v2.0.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6707](https://github.com/directus/directus/pull/6707) update dependency @types/marked to v2.0.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6705](https://github.com/directus/directus/pull/6705) update dependency @types/markdown-it to v12.0.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6704](https://github.com/directus/directus/pull/6704) update dependency @types/lodash to v4.14.171
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6702](https://github.com/directus/directus/pull/6702) update dependency @types/listr to v0.14.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6701](https://github.com/directus/directus/pull/6701) update dependency @types/keyv to v3.1.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6697](https://github.com/directus/directus/pull/6697) update dependency @types/jsonwebtoken to v8.5.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6696](https://github.com/directus/directus/pull/6696) update dependency @types/json2csv to v5.0.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6694](https://github.com/directus/directus/pull/6694) update dependency @types/js-yaml to v4.0.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6692](https://github.com/directus/directus/pull/6692) update dependency @types/jest to v26.0.24
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6690](https://github.com/directus/directus/pull/6690) update dependency @types/inquirer to v7.3.3
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6689](https://github.com/directus/directus/pull/6689) update dependency @types/fs-extra to v9.0.12
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6688](https://github.com/directus/directus/pull/6688) update dependency @types/figlet to v1.5.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6687](https://github.com/directus/directus/pull/6687) update dependency @types/express-session to v1.17.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6686](https://github.com/directus/directus/pull/6686) update dependency @types/express to v4.17.13
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6685](https://github.com/directus/directus/pull/6685) update dependency @types/dockerode to v3.2.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6683](https://github.com/directus/directus/pull/6683) update dependency @types/diff to v5.0.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6682](https://github.com/directus/directus/pull/6682) update dependency @types/cors to v2.8.11
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6681](https://github.com/directus/directus/pull/6681) update dependency @types/color to v3.0.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6680](https://github.com/directus/directus/pull/6680) update dependency @types/codemirror to v5.60.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6679](https://github.com/directus/directus/pull/6679) update dependency @types/bytes to v3.1.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6678](https://github.com/directus/directus/pull/6678) update dependency @types/busboy to v0.2.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6677](https://github.com/directus/directus/pull/6677) update dependency @types/body-parser to v1.19.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6676](https://github.com/directus/directus/pull/6676) update dependency @types/async to v3.2.7
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6675](https://github.com/directus/directus/pull/6675) update dependency @types/sharp to v0.28.4
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6669](https://github.com/directus/directus/pull/6669) update dependency vite to v2.4.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6668](https://github.com/directus/directus/pull/6668) update dependency eslint-plugin-vue to v7.13.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6667](https://github.com/directus/directus/pull/6667) update dependency dompurify to v2.3.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6660](https://github.com/directus/directus/pull/6660) update typescript-eslint monorepo to v4.28.2
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6657](https://github.com/directus/directus/pull/6657) update dependency vite to v2.4.0
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6652](https://github.com/directus/directus/pull/6652) update dependency nock to v13.1.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6634](https://github.com/directus/directus/pull/6634) update dependency @types/stream-json to v1.7.1
  ([@renovate[bot]](https://github.com/apps/renovate))
- [#6630](https://github.com/directus/directus/pull/6630) update dependency eslint to v7.30.0
  ([@renovate[bot]](https://github.com/apps/renovate))

## v9.0.0-rc.83 (July 14, 2021)

### :bug: Bug Fixes

- **App**
  - [#6566](https://github.com/directus/directus/pull/6566) Fix half-width fields before groups causing trouble
    ([@rijkvanzanten](https://github.com/rijkvanzanten))
- **API**
  - [#6561](https://github.com/directus/directus/pull/6561) Add limit options for deleteMany files
    ([@Enhed](https://github.com/Enhed))
  - [#6558](https://github.com/directus/directus/pull/6558) Fixed typo in MySQL dialect
    ([@Oreilles](https://github.com/Oreilles))

### :package: Dependency Updates

- [#6564](https://github.com/directus/directus/pull/6564) update dependency ts-node-dev to v1.1.7
  ([@renovate[bot]](https://github.com/apps/renovate))

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
