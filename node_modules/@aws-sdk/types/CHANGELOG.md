# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.55.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.54.1...v3.55.0) (2022-03-21)


### Bug Fixes

* **types:** remove [@internal](https://github.com/internal) jsdoc tag from profile types ([#3452](https://github.com/aws/aws-sdk-js-v3/issues/3452)) ([2d7c151](https://github.com/aws/aws-sdk-js-v3/commit/2d7c151bb6d9ccfdd1eb3bd8b007e4ebcdd5daa3))


### Features

* **property-provider:** memoize() supports force refresh ([#3413](https://github.com/aws/aws-sdk-js-v3/issues/3413)) ([a79f962](https://github.com/aws/aws-sdk-js-v3/commit/a79f962873ff11a3d6f98199224155bd2ddc0b1e))





## [3.54.1](https://github.com/aws/aws-sdk-js-v3/compare/v3.54.0...v3.54.1) (2022-03-15)

**Note:** Version bump only for package @aws-sdk/types





# [3.54.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.53.1...v3.54.0) (2022-03-11)


### Features

* **credential-provider-imds:** accept custom logger ([#3409](https://github.com/aws/aws-sdk-js-v3/issues/3409)) ([11c4a7b](https://github.com/aws/aws-sdk-js-v3/commit/11c4a7b5ac00763139f130595a37e182d34d9a72))





# [3.53.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.52.0...v3.53.0) (2022-02-24)


### Features

* **util-stream:** add getAwsChunkedEncodingStream ([#3339](https://github.com/aws/aws-sdk-js-v3/issues/3339)) ([42d433b](https://github.com/aws/aws-sdk-js-v3/commit/42d433b274eeeb38db268af4d6d48c972fc10486))





# [3.52.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.51.0...v3.52.0) (2022-02-18)

**Note:** Version bump only for package @aws-sdk/types





# [3.50.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.49.0...v3.50.0) (2022-02-08)


### Features

* **smithy-client:** implement SdkException class ([#3261](https://github.com/aws/aws-sdk-js-v3/issues/3261)) ([6a23634](https://github.com/aws/aws-sdk-js-v3/commit/6a23634ec278fe0d275f58fb6b981440be6a3db8))





# [3.49.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.48.0...v3.49.0) (2022-01-29)

**Note:** Version bump only for package @aws-sdk/types





## [3.47.1](https://github.com/aws/aws-sdk-js-v3/compare/v3.47.0-release-test-1...v3.47.1) (2022-01-20)

**Note:** Version bump only for package @aws-sdk/types





# [3.47.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.46.0...v3.47.0) (2022-01-15)

**Note:** Version bump only for package @aws-sdk/types





# [3.46.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.45.0...v3.46.0) (2022-01-07)


### Bug Fixes

* **middleware-signing:** correct clock skew from error response ([#3133](https://github.com/aws/aws-sdk-js-v3/issues/3133)) ([7a207a9](https://github.com/aws/aws-sdk-js-v3/commit/7a207a9d3173631f62f8b90ee1fbd7f68342133a))


### Features

* **packages:** end support for Node.js 10.x ([#3141](https://github.com/aws/aws-sdk-js-v3/issues/3141)) ([1a62865](https://github.com/aws/aws-sdk-js-v3/commit/1a6286513f7cdb556708845c512861c5f92eb883))





# [3.40.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.39.0...v3.40.0) (2021-11-05)

**Note:** Version bump only for package @aws-sdk/types





# [3.38.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.37.0...v3.38.0) (2021-10-22)

**Note:** Version bump only for package @aws-sdk/types





# [3.37.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.36.1...v3.37.0) (2021-10-15)

**Note:** Version bump only for package @aws-sdk/types





# [3.36.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.35.0...v3.36.0) (2021-10-08)


### Features

* publish files in dist-* only ([#2873](https://github.com/aws/aws-sdk-js-v3/issues/2873)) ([53b4243](https://github.com/aws/aws-sdk-js-v3/commit/53b4243b066f25ff2412d5f0dea1036054b2df32))





# [3.35.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.34.0...v3.35.0) (2021-10-04)

**Note:** Version bump only for package @aws-sdk/types





# [3.34.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.33.0...v3.34.0) (2021-09-24)


### Features

* **non-clients:** remove comments from transpiled JS files ([#2813](https://github.com/aws/aws-sdk-js-v3/issues/2813)) ([e6fc7f3](https://github.com/aws/aws-sdk-js-v3/commit/e6fc7f3e0fa74785590ac19e7ed143c916bb9b6e))





# [3.32.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.31.0...v3.32.0) (2021-09-17)

**Note:** Version bump only for package @aws-sdk/types





# [3.29.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.28.0...v3.29.0) (2021-09-02)

**Note:** Version bump only for package @aws-sdk/types





# [3.25.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.24.0...v3.25.0) (2021-08-05)


### Bug Fixes

* **packages:** use HashConstructor instead of { new: Hash } ([#2638](https://github.com/aws/aws-sdk-js-v3/issues/2638)) ([6890a47](https://github.com/aws/aws-sdk-js-v3/commit/6890a47322fa37efb7a5589ab57d3273da69ac67))





# [3.22.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.21.0...v3.22.0) (2021-07-16)


### Bug Fixes

* **clients:** prefix `dist/` for typesVersions TS<4 ([#2580](https://github.com/aws/aws-sdk-js-v3/issues/2580)) ([dff5cd4](https://github.com/aws/aws-sdk-js-v3/commit/dff5cd4b6fa00453e938ce8f238c1542ee7ba3d6))





# [3.20.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.19.0...v3.20.0) (2021-07-02)


### Bug Fixes

* replace prepublishOnly script with downlevel-dts ([#2537](https://github.com/aws/aws-sdk-js-v3/issues/2537)) ([63818a1](https://github.com/aws/aws-sdk-js-v3/commit/63818a1e47b08af56f092031a01bbbff0a9af590))





# [3.18.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.17.0...v3.18.0) (2021-06-04)

**Note:** Version bump only for package @aws-sdk/types





# [3.15.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.14.0...v3.15.0) (2021-05-10)


### Features

* **clients:** adding throwable waiters WaitUntil[operationState] ([#2302](https://github.com/aws/aws-sdk-js-v3/issues/2302)) ([f01d5ae](https://github.com/aws/aws-sdk-js-v3/commit/f01d5ae5e0e81ecc122dba2d2883352c1b86c3bb))





## [3.13.1](https://github.com/aws/aws-sdk-js-v3/compare/v3.13.0...v3.13.1) (2021-04-22)

**Note:** Version bump only for package @aws-sdk/types





# [3.12.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.11.0...v3.12.0) (2021-04-09)


### Bug Fixes

* run downlevel-dts in prepublishOnly ([#2218](https://github.com/aws/aws-sdk-js-v3/issues/2218)) ([0745502](https://github.com/aws/aws-sdk-js-v3/commit/0745502dcf819460ee1d81362470859674c757a7))





# [3.10.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.9.0...v3.10.0) (2021-03-26)


### Features

* use ts-jest for running jest tests ([#2088](https://github.com/aws/aws-sdk-js-v3/issues/2088)) ([456002c](https://github.com/aws/aws-sdk-js-v3/commit/456002cf7fa16864b72c3c279b094886a42abddb))





## [3.6.1](https://github.com/aws/aws-sdk-js-v3/compare/v3.6.0...v3.6.1) (2021-02-22)


### Bug Fixes

* update references of default branch from master to main ([#2057](https://github.com/aws/aws-sdk-js-v3/issues/2057)) ([59b8b58](https://github.com/aws/aws-sdk-js-v3/commit/59b8b58c3a8c057b36abfaa59bae3a6ffb068cf1))





## [3.4.1](https://github.com/aws/aws-sdk-js-v3/compare/v3.4.0...v3.4.1) (2021-01-29)


### Bug Fixes

* **clients:** use TS 3.4 compatible types for TS 3.9 ([#1978](https://github.com/aws/aws-sdk-js-v3/issues/1978)) ([8bced5c](https://github.com/aws/aws-sdk-js-v3/commit/8bced5c32b9dbc68f1065054d796cb0b8b87bcc4))





# [3.4.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.3.0...v3.4.0) (2021-01-28)


### Features

* **middleware-stack:** allow adding middleware to override an existing one ([#1964](https://github.com/aws/aws-sdk-js-v3/issues/1964)) ([9c21f14](https://github.com/aws/aws-sdk-js-v3/commit/9c21f14412f2b1f591422f3c67dedbe886db723b)), closes [#1883](https://github.com/aws/aws-sdk-js-v3/issues/1883)
* use downlevel-dts to generate TS 3.4 compatible types ([#1943](https://github.com/aws/aws-sdk-js-v3/issues/1943)) ([63ad215](https://github.com/aws/aws-sdk-js-v3/commit/63ad2151c8bb7be32ea8838a9b0974806ed3906b))





# [3.1.0](https://github.com/aws/aws-sdk-js-v3/compare/v3.0.0...v3.1.0) (2020-12-23)


### Features

* standardize user agent value ([#1775](https://github.com/aws/aws-sdk-js-v3/issues/1775)) ([388b180](https://github.com/aws/aws-sdk-js-v3/commit/388b18071146171b42d283a93f9590cb23956e1a))





# [3.0.0](https://github.com/aws/aws-sdk-js-v3/compare/v1.0.0-rc.10...v3.0.0) (2020-12-15)


### Features

* bump version to 3.0.0 ([#1793](https://github.com/aws/aws-sdk-js-v3/issues/1793)) ([d8475f8](https://github.com/aws/aws-sdk-js-v3/commit/d8475f8d972d28fbc15cd7e23abfe18f9eab0644))





# [1.0.0-rc.10](https://github.com/aws/aws-sdk-js-v3/compare/v1.0.0-rc.9...v1.0.0-rc.10) (2020-12-15)


### Features

* update clients as of 12/12/2020 with model fixes ([#1774](https://github.com/aws/aws-sdk-js-v3/issues/1774)) ([54e8715](https://github.com/aws/aws-sdk-js-v3/commit/54e87151877dd5cf9a5f256698c088cc7a856225))





# [1.0.0-rc.8](https://github.com/aws/aws-sdk-js-v3/compare/v1.0.0-rc.7...v1.0.0-rc.8) (2020-12-05)


### Bug Fixes

* **s3-request-presigner:** skip hoisting SSE headers ([#1701](https://github.com/aws/aws-sdk-js-v3/issues/1701)) ([1ec70ff](https://github.com/aws/aws-sdk-js-v3/commit/1ec70ff02de372e5de53e8a5c42ad55b41558502))





# [1.0.0-rc.7](https://github.com/aws/aws-sdk-js-v3/compare/v1.0.0-rc.6...v1.0.0-rc.7) (2020-11-20)


### Bug Fixes

* **abort-controller:** make AbortSignal WHATWG Spec compliant ([#1699](https://github.com/aws/aws-sdk-js-v3/issues/1699)) ([723ec4d](https://github.com/aws/aws-sdk-js-v3/commit/723ec4dffdc8b5956cc3d72c263abb4ff9770904))





# [1.0.0-rc.3](https://github.com/aws/aws-sdk-js-v3/compare/v1.0.0-rc.2...v1.0.0-rc.3) (2020-10-27)

**Note:** Version bump only for package @aws-sdk/types





# [1.0.0-rc.2](https://github.com/aws/aws-sdk-js-v3/compare/v1.0.0-rc.1...v1.0.0-rc.2) (2020-10-22)

**Note:** Version bump only for package @aws-sdk/types





# [1.0.0-rc.1](https://github.com/aws/aws-sdk-js-v3/compare/v1.0.0-gamma.11...v1.0.0-rc.1) (2020-10-19)


### Features

* ready for release candidate ([#1578](https://github.com/aws/aws-sdk-js-v3/issues/1578)) ([519f66c](https://github.com/aws/aws-sdk-js-v3/commit/519f66c6388b91d0bd750a511e6d1af56196835e))





# [1.0.0-gamma.7](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@1.0.0-gamma.6...@aws-sdk/types@1.0.0-gamma.7) (2020-10-07)

**Note:** Version bump only for package @aws-sdk/types





# [1.0.0-gamma.6](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@1.0.0-gamma.5...@aws-sdk/types@1.0.0-gamma.6) (2020-09-01)


### Features

* log metadata/input/output/request/response ([#1478](https://github.com/aws/aws-sdk-js-v3/issues/1478)) ([08f3c92](https://github.com/aws/aws-sdk-js-v3/commit/08f3c92baf6b2e9e04b622379598a14f4647dbe1))





# [1.0.0-gamma.5](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@1.0.0-gamma.4...@aws-sdk/types@1.0.0-gamma.5) (2020-08-25)


### Features

* **types:** update types to include pagination type.  ([#1451](https://github.com/aws/aws-sdk-js-v3/issues/1451)) ([8e34453](https://github.com/aws/aws-sdk-js-v3/commit/8e34453707b33e45208dbd43dacc10c10bb53c62))
* add pagination global types ([#1443](https://github.com/aws/aws-sdk-js-v3/issues/1443)) ([d12f9ba](https://github.com/aws/aws-sdk-js-v3/commit/d12f9ba008f694fc1dd4e7618de7b5e8b420f361))
* get partition of given region ([#1435](https://github.com/aws/aws-sdk-js-v3/issues/1435)) ([c18bfe4](https://github.com/aws/aws-sdk-js-v3/commit/c18bfe489db77d945d0bcc4ae7194ff46cd461a9))
* support per-request region and service override in signer ([#1444](https://github.com/aws/aws-sdk-js-v3/issues/1444)) ([a2635af](https://github.com/aws/aws-sdk-js-v3/commit/a2635af43f177d0ccc5d7e435e1e88c83b2b571d))


### Reverts

* Revert "feat: add pagination global types (#1443)" (#1450) ([0a97419](https://github.com/aws/aws-sdk-js-v3/commit/0a9741934b82808e25244d9eae8b32f62fd7cc70)), closes [#1443](https://github.com/aws/aws-sdk-js-v3/issues/1443) [#1450](https://github.com/aws/aws-sdk-js-v3/issues/1450)





# [1.0.0-gamma.4](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@1.0.0-gamma.3...@aws-sdk/types@1.0.0-gamma.4) (2020-08-04)


### Features

* build command ([#1407](https://github.com/aws/aws-sdk-js-v3/issues/1407)) ([81b2e87](https://github.com/aws/aws-sdk-js-v3/commit/81b2e87067642a8cea8649cbdb2c342ca9fb6ac6))
* refactor middleware stack ([#1398](https://github.com/aws/aws-sdk-js-v3/issues/1398)) ([9fedaa9](https://github.com/aws/aws-sdk-js-v3/commit/9fedaa9696ff1ecf5d1e92b28b34d573583a7842))


### BREAKING CHANGES

* addRelativeTo() now doesn't require step in options. The middleware will be injected to the same step as the toMiddleware





# [1.0.0-gamma.3](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@1.0.0-gamma.2...@aws-sdk/types@1.0.0-gamma.3) (2020-07-13)


### Features

* add code linting and prettify ([#1350](https://github.com/aws/aws-sdk-js-v3/issues/1350)) ([47770fa](https://github.com/aws/aws-sdk-js-v3/commit/47770fa493c3405f193069cd18319882529ff484))





# [1.0.0-gamma.2](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-gamma.2) (2020-07-08)


### Features

* add check for isTransientError ([#1222](https://github.com/aws/aws-sdk-js-v3/issues/1222)) ([f71c136](https://github.com/aws/aws-sdk-js-v3/commit/f71c13673044eaa547db3f411a72ce6d0c00e495))
* read maxAttempts value from retry-config ([#1286](https://github.com/aws/aws-sdk-js-v3/issues/1286)) ([8f3fdc0](https://github.com/aws/aws-sdk-js-v3/commit/8f3fdc0536ad2cb11a9f0ba0fc75c0554c3f1fb0))
* retry if retryable trait is set ([#1238](https://github.com/aws/aws-sdk-js-v3/issues/1238)) ([9d224e7](https://github.com/aws/aws-sdk-js-v3/commit/9d224e7d289b56c40b7c26f404c959aab5ea8e87))
* support bi-directional eventstream over H2 ([#1082](https://github.com/aws/aws-sdk-js-v3/issues/1082)) ([af41a53](https://github.com/aws/aws-sdk-js-v3/commit/af41a538f12314c696419f9e17942b7a8f7f22ed))
* use a common tsconfig for the monorepo ([#1297](https://github.com/aws/aws-sdk-js-v3/issues/1297)) ([16aea66](https://github.com/aws/aws-sdk-js-v3/commit/16aea66d1fc5386680d3e6da9b7dcde78e178bd3))



# 1.0.0-gamma.1 (2020-05-21)


### Features

* bump up to gamma version ([#1192](https://github.com/aws/aws-sdk-js-v3/issues/1192)) ([a609075](https://github.com/aws/aws-sdk-js-v3/commit/a6090754f2a6c21e5b70bf0c8782cc0fbe59ee12))



# 1.0.0-beta.4 (2020-04-25)


### Features

* add default destroy function to clients ([#1081](https://github.com/aws/aws-sdk-js-v3/issues/1081)) ([7eb0f0e](https://github.com/aws/aws-sdk-js-v3/commit/7eb0f0e5debfafe08c51dc4f99dcf29d79dea358))



# 1.0.0-beta.2 (2020-03-28)



# 1.0.0-beta.1 (2020-03-25)


### Features

* bump packages to beta ([#1050](https://github.com/aws/aws-sdk-js-v3/issues/1050)) ([40501d4](https://github.com/aws/aws-sdk-js-v3/commit/40501d4394d04bc1bc91c10136fa48b1d3a67d8f))



# 1.0.0-alpha.28 (2020-03-20)


### Features

* **signature-v4:** update EventSigner signature API to sign ([#1016](https://github.com/aws/aws-sdk-js-v3/issues/1016)) ([bce853a](https://github.com/aws/aws-sdk-js-v3/commit/bce853aa67f744b548198f9e20f7bfd3ad0bd894))



# 1.0.0-alpha.24 (2020-02-19)


### Features

* add event stream serde depedencies ([#824](https://github.com/aws/aws-sdk-js-v3/issues/824)) ([08f8213](https://github.com/aws/aws-sdk-js-v3/commit/08f821365c34010d1bed77b7c7e454e2f71c65fb))



# 1.0.0-alpha.13 (2020-01-24)



# 1.0.0-alpha.12 (2020-01-22)


### Features

* add support for browser streaming ([#721](https://github.com/aws/aws-sdk-js-v3/issues/721)) ([133430c](https://github.com/aws/aws-sdk-js-v3/commit/133430c53382999dcbf59e97e64252f5b404acb8))



# 0.9.0 (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d68423e46aa755d64809129447c4eef2b0d33))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde855fce0eb012f64a305fcc38c0d16011b9))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e1eb2370fb11b10b3d005369ec1a307e3a))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc33c584929f6357e0b442dd715172485657))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae7f2b0804cccc850dcdce1a239b73031e3))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fcc49251dc03c5d79a70eed0aefe2786731))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac71568bc3f08cf1d0d8b269074d3f8c588))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22c2a97a0dd3d27eee67e5e31fb32402a11))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad579698f5679a0cb120daad38d539e2944abed))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a7fa8e13b94dabb59647b78f263872c240))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5a61dcb4a4c5ef5e544c1964545d30e046))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250fde6f51418640ea897cc29359243257f1))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c6203ea427057281826071a704647bb815900))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a97cf7f256b35986a305b27180e933f459))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed45fd5580ef9633da78f13aaa6aa472805))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50cd2b4df5ffd532c4fc1159ef9a8bd1c4c))



# 0.2.0 (2019-07-12)


### Features

* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b992ba5a945ab06968936d475424d8e6de9c))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49e7ab4181bf42a6a84c05d2f8ef9bd850b))
* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10cb6b0ebc32004b797556bfc171c96bbf16))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2e411af302e920abc5fae008e4642597e9))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab4ac5343058eaf7d448a428d8c4b72c844))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99de2fa9abb7b1e2375e59462c2256a2e5c))





# [1.0.0-gamma.1](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-gamma.1) (2020-05-21)


### Features

* bump up to gamma version ([#1192](https://github.com/aws/aws-sdk-js-v3/issues/1192)) ([a609075](https://github.com/aws/aws-sdk-js-v3/commit/a6090754f2a6c21e5b70bf0c8782cc0fbe59ee12))



# 1.0.0-beta.4 (2020-04-25)


### Features

* add default destroy function to clients ([#1081](https://github.com/aws/aws-sdk-js-v3/issues/1081)) ([7eb0f0e](https://github.com/aws/aws-sdk-js-v3/commit/7eb0f0e5debfafe08c51dc4f99dcf29d79dea358))



# 1.0.0-beta.2 (2020-03-28)



# 1.0.0-beta.1 (2020-03-25)


### Features

* bump packages to beta ([#1050](https://github.com/aws/aws-sdk-js-v3/issues/1050)) ([40501d4](https://github.com/aws/aws-sdk-js-v3/commit/40501d4394d04bc1bc91c10136fa48b1d3a67d8f))



# 1.0.0-alpha.28 (2020-03-20)


### Features

* **signature-v4:** update EventSigner signature API to sign ([#1016](https://github.com/aws/aws-sdk-js-v3/issues/1016)) ([bce853a](https://github.com/aws/aws-sdk-js-v3/commit/bce853aa67f744b548198f9e20f7bfd3ad0bd894))



# 1.0.0-alpha.24 (2020-02-19)


### Features

* add event stream serde depedencies ([#824](https://github.com/aws/aws-sdk-js-v3/issues/824)) ([08f8213](https://github.com/aws/aws-sdk-js-v3/commit/08f821365c34010d1bed77b7c7e454e2f71c65fb))



# 1.0.0-alpha.13 (2020-01-24)



# 1.0.0-alpha.12 (2020-01-22)


### Features

* add support for browser streaming ([#721](https://github.com/aws/aws-sdk-js-v3/issues/721)) ([133430c](https://github.com/aws/aws-sdk-js-v3/commit/133430c53382999dcbf59e97e64252f5b404acb8))



# 0.9.0 (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d68423e46aa755d64809129447c4eef2b0d33))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde855fce0eb012f64a305fcc38c0d16011b9))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e1eb2370fb11b10b3d005369ec1a307e3a))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc33c584929f6357e0b442dd715172485657))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae7f2b0804cccc850dcdce1a239b73031e3))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fcc49251dc03c5d79a70eed0aefe2786731))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac71568bc3f08cf1d0d8b269074d3f8c588))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22c2a97a0dd3d27eee67e5e31fb32402a11))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad579698f5679a0cb120daad38d539e2944abed))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a7fa8e13b94dabb59647b78f263872c240))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5a61dcb4a4c5ef5e544c1964545d30e046))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250fde6f51418640ea897cc29359243257f1))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c6203ea427057281826071a704647bb815900))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a97cf7f256b35986a305b27180e933f459))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed45fd5580ef9633da78f13aaa6aa472805))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50cd2b4df5ffd532c4fc1159ef9a8bd1c4c))



# 0.2.0 (2019-07-12)


### Features

* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b992ba5a945ab06968936d475424d8e6de9c))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49e7ab4181bf42a6a84c05d2f8ef9bd850b))
* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10cb6b0ebc32004b797556bfc171c96bbf16))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2e411af302e920abc5fae008e4642597e9))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab4ac5343058eaf7d448a428d8c4b72c844))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99de2fa9abb7b1e2375e59462c2256a2e5c))





# [1.0.0-beta.4](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-beta.4) (2020-04-27)


### Features

* use exact @aws-sdk/* dependencies ([#1110](https://github.com/aws/aws-sdk-js-v3/issues/1110)) ([bcfd7a2](https://github.com/aws/aws-sdk-js-v3/commit/bcfd7a2faeca3a2605057fd4736d710aa4902b62))



# 1.0.0-beta.2 (2020-03-28)



# 1.0.0-beta.1 (2020-03-25)


### Features

* bump packages to beta ([#1050](https://github.com/aws/aws-sdk-js-v3/issues/1050)) ([40501d4](https://github.com/aws/aws-sdk-js-v3/commit/40501d4394d04bc1bc91c10136fa48b1d3a67d8f))



# 1.0.0-alpha.28 (2020-03-20)


### Features

* **signature-v4:** update EventSigner signature API to sign ([#1016](https://github.com/aws/aws-sdk-js-v3/issues/1016)) ([bce853a](https://github.com/aws/aws-sdk-js-v3/commit/bce853aa67f744b548198f9e20f7bfd3ad0bd894))



# 1.0.0-alpha.24 (2020-02-19)


### Features

* add event stream serde depedencies ([#824](https://github.com/aws/aws-sdk-js-v3/issues/824)) ([08f8213](https://github.com/aws/aws-sdk-js-v3/commit/08f821365c34010d1bed77b7c7e454e2f71c65fb))



# 1.0.0-alpha.13 (2020-01-24)



# 1.0.0-alpha.12 (2020-01-22)


### Features

* add support for browser streaming ([#721](https://github.com/aws/aws-sdk-js-v3/issues/721)) ([133430c](https://github.com/aws/aws-sdk-js-v3/commit/133430c53382999dcbf59e97e64252f5b404acb8))



# 0.9.0 (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d68423e46aa755d64809129447c4eef2b0d33))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde855fce0eb012f64a305fcc38c0d16011b9))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e1eb2370fb11b10b3d005369ec1a307e3a))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc33c584929f6357e0b442dd715172485657))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae7f2b0804cccc850dcdce1a239b73031e3))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fcc49251dc03c5d79a70eed0aefe2786731))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac71568bc3f08cf1d0d8b269074d3f8c588))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22c2a97a0dd3d27eee67e5e31fb32402a11))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad579698f5679a0cb120daad38d539e2944abed))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a7fa8e13b94dabb59647b78f263872c240))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5a61dcb4a4c5ef5e544c1964545d30e046))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250fde6f51418640ea897cc29359243257f1))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c6203ea427057281826071a704647bb815900))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a97cf7f256b35986a305b27180e933f459))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed45fd5580ef9633da78f13aaa6aa472805))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50cd2b4df5ffd532c4fc1159ef9a8bd1c4c))



# 0.2.0 (2019-07-12)


### Features

* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b992ba5a945ab06968936d475424d8e6de9c))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49e7ab4181bf42a6a84c05d2f8ef9bd850b))
* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10cb6b0ebc32004b797556bfc171c96bbf16))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2e411af302e920abc5fae008e4642597e9))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab4ac5343058eaf7d448a428d8c4b72c844))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99de2fa9abb7b1e2375e59462c2256a2e5c))





# [1.0.0-beta.3](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-beta.3) (2020-04-25)


### Features

* add default destroy function to clients ([#1081](https://github.com/aws/aws-sdk-js-v3/issues/1081)) ([7eb0f0e](https://github.com/aws/aws-sdk-js-v3/commit/7eb0f0e5debfafe08c51dc4f99dcf29d79dea358))



# 1.0.0-beta.2 (2020-03-28)



# 1.0.0-beta.1 (2020-03-25)


### Features

* bump packages to beta ([#1050](https://github.com/aws/aws-sdk-js-v3/issues/1050)) ([40501d4](https://github.com/aws/aws-sdk-js-v3/commit/40501d4394d04bc1bc91c10136fa48b1d3a67d8f))



# 1.0.0-alpha.28 (2020-03-20)


### Features

* **signature-v4:** update EventSigner signature API to sign ([#1016](https://github.com/aws/aws-sdk-js-v3/issues/1016)) ([bce853a](https://github.com/aws/aws-sdk-js-v3/commit/bce853aa67f744b548198f9e20f7bfd3ad0bd894))



# 1.0.0-alpha.24 (2020-02-19)


### Features

* add event stream serde depedencies ([#824](https://github.com/aws/aws-sdk-js-v3/issues/824)) ([08f8213](https://github.com/aws/aws-sdk-js-v3/commit/08f821365c34010d1bed77b7c7e454e2f71c65fb))



# 1.0.0-alpha.13 (2020-01-24)



# 1.0.0-alpha.12 (2020-01-22)


### Features

* add support for browser streaming ([#721](https://github.com/aws/aws-sdk-js-v3/issues/721)) ([133430c](https://github.com/aws/aws-sdk-js-v3/commit/133430c53382999dcbf59e97e64252f5b404acb8))



# 0.9.0 (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d68423e46aa755d64809129447c4eef2b0d33))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde855fce0eb012f64a305fcc38c0d16011b9))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e1eb2370fb11b10b3d005369ec1a307e3a))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc33c584929f6357e0b442dd715172485657))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae7f2b0804cccc850dcdce1a239b73031e3))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fcc49251dc03c5d79a70eed0aefe2786731))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac71568bc3f08cf1d0d8b269074d3f8c588))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22c2a97a0dd3d27eee67e5e31fb32402a11))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad579698f5679a0cb120daad38d539e2944abed))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a7fa8e13b94dabb59647b78f263872c240))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5a61dcb4a4c5ef5e544c1964545d30e046))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250fde6f51418640ea897cc29359243257f1))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c6203ea427057281826071a704647bb815900))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a97cf7f256b35986a305b27180e933f459))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed45fd5580ef9633da78f13aaa6aa472805))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50cd2b4df5ffd532c4fc1159ef9a8bd1c4c))



# 0.2.0 (2019-07-12)


### Features

* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b992ba5a945ab06968936d475424d8e6de9c))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49e7ab4181bf42a6a84c05d2f8ef9bd850b))
* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10cb6b0ebc32004b797556bfc171c96bbf16))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2e411af302e920abc5fae008e4642597e9))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab4ac5343058eaf7d448a428d8c4b72c844))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99de2fa9abb7b1e2375e59462c2256a2e5c))





# [1.0.0-beta.2](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-beta.2) (2020-03-28)



# 1.0.0-beta.1 (2020-03-25)


### Features

* bump packages to beta ([#1050](https://github.com/aws/aws-sdk-js-v3/issues/1050)) ([40501d4](https://github.com/aws/aws-sdk-js-v3/commit/40501d4394d04bc1bc91c10136fa48b1d3a67d8f))



# 1.0.0-alpha.28 (2020-03-20)


### Features

* **signature-v4:** update EventSigner signature API to sign ([#1016](https://github.com/aws/aws-sdk-js-v3/issues/1016)) ([bce853a](https://github.com/aws/aws-sdk-js-v3/commit/bce853aa67f744b548198f9e20f7bfd3ad0bd894))



# 1.0.0-alpha.24 (2020-02-19)


### Features

* add event stream serde depedencies ([#824](https://github.com/aws/aws-sdk-js-v3/issues/824)) ([08f8213](https://github.com/aws/aws-sdk-js-v3/commit/08f821365c34010d1bed77b7c7e454e2f71c65fb))



# 1.0.0-alpha.13 (2020-01-24)



# 1.0.0-alpha.12 (2020-01-22)


### Features

* add support for browser streaming ([#721](https://github.com/aws/aws-sdk-js-v3/issues/721)) ([133430c](https://github.com/aws/aws-sdk-js-v3/commit/133430c53382999dcbf59e97e64252f5b404acb8))



# 0.9.0 (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d68423e46aa755d64809129447c4eef2b0d33))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde855fce0eb012f64a305fcc38c0d16011b9))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e1eb2370fb11b10b3d005369ec1a307e3a))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc33c584929f6357e0b442dd715172485657))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae7f2b0804cccc850dcdce1a239b73031e3))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fcc49251dc03c5d79a70eed0aefe2786731))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac71568bc3f08cf1d0d8b269074d3f8c588))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22c2a97a0dd3d27eee67e5e31fb32402a11))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad579698f5679a0cb120daad38d539e2944abed))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a7fa8e13b94dabb59647b78f263872c240))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5a61dcb4a4c5ef5e544c1964545d30e046))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250fde6f51418640ea897cc29359243257f1))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c6203ea427057281826071a704647bb815900))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a97cf7f256b35986a305b27180e933f459))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed45fd5580ef9633da78f13aaa6aa472805))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50cd2b4df5ffd532c4fc1159ef9a8bd1c4c))



# 0.2.0 (2019-07-12)


### Features

* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b992ba5a945ab06968936d475424d8e6de9c))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49e7ab4181bf42a6a84c05d2f8ef9bd850b))
* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10cb6b0ebc32004b797556bfc171c96bbf16))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2e411af302e920abc5fae008e4642597e9))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab4ac5343058eaf7d448a428d8c4b72c844))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99de2fa9abb7b1e2375e59462c2256a2e5c))





# [1.0.0-beta.1](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-beta.1) (2020-03-25)


### Features

* bump packages to beta ([#1050](https://github.com/aws/aws-sdk-js-v3/issues/1050)) ([40501d4](https://github.com/aws/aws-sdk-js-v3/commit/40501d4394d04bc1bc91c10136fa48b1d3a67d8f))



# 1.0.0-alpha.28 (2020-03-20)


### Features

* **signature-v4:** update EventSigner signature API to sign ([#1016](https://github.com/aws/aws-sdk-js-v3/issues/1016)) ([bce853a](https://github.com/aws/aws-sdk-js-v3/commit/bce853aa67f744b548198f9e20f7bfd3ad0bd894))



# 1.0.0-alpha.24 (2020-02-19)


### Features

* add event stream serde depedencies ([#824](https://github.com/aws/aws-sdk-js-v3/issues/824)) ([08f8213](https://github.com/aws/aws-sdk-js-v3/commit/08f821365c34010d1bed77b7c7e454e2f71c65fb))



# 1.0.0-alpha.13 (2020-01-24)



# 1.0.0-alpha.12 (2020-01-22)


### Features

* add support for browser streaming ([#721](https://github.com/aws/aws-sdk-js-v3/issues/721)) ([133430c](https://github.com/aws/aws-sdk-js-v3/commit/133430c53382999dcbf59e97e64252f5b404acb8))



# 0.9.0 (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d68423e46aa755d64809129447c4eef2b0d33))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde855fce0eb012f64a305fcc38c0d16011b9))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e1eb2370fb11b10b3d005369ec1a307e3a))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc33c584929f6357e0b442dd715172485657))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae7f2b0804cccc850dcdce1a239b73031e3))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fcc49251dc03c5d79a70eed0aefe2786731))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac71568bc3f08cf1d0d8b269074d3f8c588))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22c2a97a0dd3d27eee67e5e31fb32402a11))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad579698f5679a0cb120daad38d539e2944abed))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a7fa8e13b94dabb59647b78f263872c240))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5a61dcb4a4c5ef5e544c1964545d30e046))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250fde6f51418640ea897cc29359243257f1))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c6203ea427057281826071a704647bb815900))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a97cf7f256b35986a305b27180e933f459))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed45fd5580ef9633da78f13aaa6aa472805))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50cd2b4df5ffd532c4fc1159ef9a8bd1c4c))



# 0.2.0 (2019-07-12)


### Features

* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b992ba5a945ab06968936d475424d8e6de9c))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49e7ab4181bf42a6a84c05d2f8ef9bd850b))
* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10cb6b0ebc32004b797556bfc171c96bbf16))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2e411af302e920abc5fae008e4642597e9))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab4ac5343058eaf7d448a428d8c4b72c844))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99de2fa9abb7b1e2375e59462c2256a2e5c))





# [1.0.0-alpha.6](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-alpha.6) (2020-03-20)


### Features

* **signature-v4:** update EventSigner signature API to sign ([#1016](https://github.com/aws/aws-sdk-js-v3/issues/1016)) ([bce853a](https://github.com/aws/aws-sdk-js-v3/commit/bce853aa67f744b548198f9e20f7bfd3ad0bd894))



# 1.0.0-alpha.24 (2020-02-19)


### Features

* add event stream serde depedencies ([#824](https://github.com/aws/aws-sdk-js-v3/issues/824)) ([08f8213](https://github.com/aws/aws-sdk-js-v3/commit/08f821365c34010d1bed77b7c7e454e2f71c65fb))



# 1.0.0-alpha.13 (2020-01-24)



# 1.0.0-alpha.12 (2020-01-22)


### Features

* add support for browser streaming ([#721](https://github.com/aws/aws-sdk-js-v3/issues/721)) ([133430c](https://github.com/aws/aws-sdk-js-v3/commit/133430c53382999dcbf59e97e64252f5b404acb8))



# 0.9.0 (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d68423e46aa755d64809129447c4eef2b0d33))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde855fce0eb012f64a305fcc38c0d16011b9))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e1eb2370fb11b10b3d005369ec1a307e3a))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc33c584929f6357e0b442dd715172485657))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae7f2b0804cccc850dcdce1a239b73031e3))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fcc49251dc03c5d79a70eed0aefe2786731))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac71568bc3f08cf1d0d8b269074d3f8c588))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22c2a97a0dd3d27eee67e5e31fb32402a11))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad579698f5679a0cb120daad38d539e2944abed))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a7fa8e13b94dabb59647b78f263872c240))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5a61dcb4a4c5ef5e544c1964545d30e046))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250fde6f51418640ea897cc29359243257f1))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c6203ea427057281826071a704647bb815900))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a97cf7f256b35986a305b27180e933f459))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed45fd5580ef9633da78f13aaa6aa472805))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50cd2b4df5ffd532c4fc1159ef9a8bd1c4c))



# 0.2.0 (2019-07-12)


### Features

* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b992ba5a945ab06968936d475424d8e6de9c))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49e7ab4181bf42a6a84c05d2f8ef9bd850b))
* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10cb6b0ebc32004b797556bfc171c96bbf16))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2e411af302e920abc5fae008e4642597e9))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab4ac5343058eaf7d448a428d8c4b72c844))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99de2fa9abb7b1e2375e59462c2256a2e5c))





# [1.0.0-alpha.5](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-alpha.5) (2020-02-19)


### Features

* add event stream serde depedencies ([#824](https://github.com/aws/aws-sdk-js-v3/issues/824)) ([08f8213](https://github.com/aws/aws-sdk-js-v3/commit/08f8213))



# 1.0.0-alpha.13 (2020-01-24)



# 1.0.0-alpha.12 (2020-01-22)


### Features

* add support for browser streaming ([#721](https://github.com/aws/aws-sdk-js-v3/issues/721)) ([133430c](https://github.com/aws/aws-sdk-js-v3/commit/133430c))



# 0.9.0 (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d684))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde8))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc3))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fc))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad5796))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c620))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50))



# 0.2.0 (2019-07-12)


### Features

* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b99))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49))
* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10c))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99))





# [1.0.0-alpha.4](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-alpha.4) (2020-01-24)



# 1.0.0-alpha.12 (2020-01-22)


### Features

* add support for browser streaming ([#721](https://github.com/aws/aws-sdk-js-v3/issues/721)) ([133430c](https://github.com/aws/aws-sdk-js-v3/commit/133430c))



# 0.9.0 (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d684))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde8))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc3))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fc))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad5796))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c620))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50))



# 0.2.0 (2019-07-12)


### Features

* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10c))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab))
* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b99))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99))





# [1.0.0-alpha.3](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-alpha.3) (2020-01-22)


### Features

* add support for browser streaming ([#721](https://github.com/aws/aws-sdk-js-v3/issues/721)) ([133430c](https://github.com/aws/aws-sdk-js-v3/commit/133430c))



# 0.9.0 (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d684))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde8))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc3))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fc))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad5796))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c620))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50))



# 0.2.0 (2019-07-12)


### Features

* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10c))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab))
* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b99))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99))





# [1.0.0-alpha.2](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-alpha.2) (2020-01-09)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d684))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde8))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc3))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fc))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad5796))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c620))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50))



# 0.2.0 (2019-07-12)


### Features

* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10c))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab))
* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b99))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99))





# [1.0.0-alpha.1](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@1.0.0-alpha.1) (2020-01-08)


### Bug Fixes

* remove duplicated declaration of endpoints ([#416](https://github.com/aws/aws-sdk-js-v3/issues/416)) ([1f1d684](https://github.com/aws/aws-sdk-js-v3/commit/1f1d684))
* support custom agent in node http handler ([#489](https://github.com/aws/aws-sdk-js-v3/issues/489)) ([9c6cde8](https://github.com/aws/aws-sdk-js-v3/commit/9c6cde8))
* update updated types ([#474](https://github.com/aws/aws-sdk-js-v3/issues/474)) ([9efac3e](https://github.com/aws/aws-sdk-js-v3/commit/9efac3e))


### Features

* [WIP] Node.js HTTP/2 Handler in smithy-codegen ([#414](https://github.com/aws/aws-sdk-js-v3/issues/414)) ([1493cc3](https://github.com/aws/aws-sdk-js-v3/commit/1493cc3))
* add a middleware inserting right host header ([#567](https://github.com/aws/aws-sdk-js-v3/issues/567)) ([82649ae](https://github.com/aws/aws-sdk-js-v3/commit/82649ae))
* add pluggable runtime specific config ([#404](https://github.com/aws/aws-sdk-js-v3/issues/404)) ([8be08fc](https://github.com/aws/aws-sdk-js-v3/commit/8be08fc))
* add RetryStrategy class and retryMiddleware implementation ([#389](https://github.com/aws/aws-sdk-js-v3/issues/389)) ([ff70fac](https://github.com/aws/aws-sdk-js-v3/commit/ff70fac))
* apply protocol and middleware update ([0de0a22](https://github.com/aws/aws-sdk-js-v3/commit/0de0a22))
* remove absolute priority numbers from middleware stack ([#434](https://github.com/aws/aws-sdk-js-v3/issues/434)) ([2ad5796](https://github.com/aws/aws-sdk-js-v3/commit/2ad5796))
* remove protocol rest json class ([#438](https://github.com/aws/aws-sdk-js-v3/issues/438)) ([7ec275a](https://github.com/aws/aws-sdk-js-v3/commit/7ec275a))
* standardize plugins ([#422](https://github.com/aws/aws-sdk-js-v3/issues/422)) ([09112e5](https://github.com/aws/aws-sdk-js-v3/commit/09112e5))
* start endpoint resolver generation ([#472](https://github.com/aws/aws-sdk-js-v3/issues/472)) ([d0f9250](https://github.com/aws/aws-sdk-js-v3/commit/d0f9250))
* update runtime plugin interface ([#400](https://github.com/aws/aws-sdk-js-v3/issues/400)) ([d75c620](https://github.com/aws/aws-sdk-js-v3/commit/d75c620))



# 0.6.0 (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50))



# 0.2.0 (2019-07-12)


### Features

* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10c))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab))
* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b99))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99))





# [0.1.0-preview.7](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@0.1.0-preview.7) (2019-10-30)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50))



# 0.2.0 (2019-07-12)


### Features

* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10c))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab))
* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b99))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99))





# [0.1.0-preview.6](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@0.1.0-preview.6) (2019-10-29)


### Features

* **signature-v4:** add support to override the set of unsignableHeaders ([#420](https://github.com/aws/aws-sdk-js-v3/issues/420)) ([8d6b27a](https://github.com/aws/aws-sdk-js-v3/commit/8d6b27a))



# 0.3.0 (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50))



# 0.2.0 (2019-07-12)


### Features

* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10c))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab))
* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b99))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99))





# [0.1.0-preview.5](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@0.1.0-preview.5) (2019-09-09)


### Features

* commit all clients ([#324](https://github.com/aws/aws-sdk-js-v3/issues/324)) ([cb268ed](https://github.com/aws/aws-sdk-js-v3/commit/cb268ed))
* node-http-handler set default keep-alive to true ([#307](https://github.com/aws/aws-sdk-js-v3/issues/307)) ([d709e50](https://github.com/aws/aws-sdk-js-v3/commit/d709e50))



# 0.2.0 (2019-07-12)


### Features

* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10c))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab))
* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b99))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99))





# [0.1.0-preview.4](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@0.1.0-preview.4) (2019-07-12)


### Features

* add npm badges for individual packages ([#251](https://github.com/aws/aws-sdk-js-v3/issues/251)) ([8adc10c](https://github.com/aws/aws-sdk-js-v3/commit/8adc10c))
* make operation model accessible from commands ([#242](https://github.com/aws/aws-sdk-js-v3/issues/242)) ([8bf91e2](https://github.com/aws/aws-sdk-js-v3/commit/8bf91e2))
* update jest v20 to v24 ([#243](https://github.com/aws/aws-sdk-js-v3/issues/243)) ([1e156ab](https://github.com/aws/aws-sdk-js-v3/commit/1e156ab))
* **s3-request-presigner:** provide a s3 request presigner ([#266](https://github.com/aws/aws-sdk-js-v3/issues/266)) ([3f00b99](https://github.com/aws/aws-sdk-js-v3/commit/3f00b99))
* **util-create-request:** create request package ([#257](https://github.com/aws/aws-sdk-js-v3/issues/257)) ([9855d49](https://github.com/aws/aws-sdk-js-v3/commit/9855d49))



# 0.1.0 (2019-04-19)


### Features

* timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99))





# [0.1.0-preview.3](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.2...@aws-sdk/types@0.1.0-preview.3) (2019-04-19)

### Features

- timestamp serializing and de-serializing ([#216](https://github.com/aws/aws-sdk-js-v3/issues/216)) ([0556c99](https://github.com/aws/aws-sdk-js-v3/commit/0556c99))

# [0.1.0-preview.2](https://github.com/aws/aws-sdk-js-v3/compare/@aws-sdk/types@0.1.0-preview.1...@aws-sdk/types@0.1.0-preview.2) (2019-03-27)

### Bug Fixes

- generate model metadata xmlNamespace properly ([#197](https://github.com/aws/aws-sdk-js-v3/issues/197)) ([f2aa325](https://github.com/aws/aws-sdk-js-v3/commit/f2aa325))
