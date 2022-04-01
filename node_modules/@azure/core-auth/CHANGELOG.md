# Release History

## 1.3.2 (2021-07-01)

- Added `tenantId` optional property to the `GetTokenOptions` interface. If `tenantId` is set, credentials will be able to use multi-tenant authentication, in the cases when it's enabled.

## 1.3.0 (2021-03-30)

- Adds the `AzureNamedKeyCredential` class which supports credential rotation and a corresponding `NamedKeyCredential` interface to support the use of static string-based names and keys in Azure clients.
- Adds the `isNamedKeyCredential` and `isSASCredential` typeguard functions similar to the existing `isTokenCredential`.

## 1.2.0 (2021-02-08)

- Add `AzureSASCredential` and `SASCredential` for use by service clients which allow authenticiation using a shared access signature.

## 1.1.4 (2021-01-07)

- Removed direct dependency on `@opentelemetry/api` and `@azure/core-tracing`.

## 1.1.3 (2020-06-30)

- Fix this library to be compatible with ES5 ([#8975](https://github.com/Azure/azure-sdk-for-js/pull/8975))

## 1.1.2 (2020-04-28)

- Remove the below interfaces from the public API of this package as they are defined elsewhere.
  Fixes [bug 8301](https://github.com/Azure/azure-sdk-for-js/issues/8301).
  - OperationOptions
  - OperationRequestOptions
  - OperationTracingOptions
  - AbortSignalLike

## 1.1.1 (2020-04-01)

- Provided down-leveled type declaration files for users of older TypeScript versions between 3.1 and 3.6.

## 1.1.0 (2020-03-31)

- Added an `AzureKeyCredential` class that supports credential rotation and a corresponding `KeyCredential` interface to support the use of static string-based keys in Azure clients.

## 1.0.2 (2019-12-03)

- Updated to use OpenTelemetry 0.2 via `@azure/core-tracing`

## 1.0.0 (2019-10-29)

This release marks the general availability of the `@azure/core-auth` package.

- Standardizes API to be more consistent with other SDK packages.
  ([PR #5899](https://github.com/Azure/azure-sdk-for-js/pull/5899))
- Removed the browser bundle. A browser-compatible library can still be created through the use of a bundler such as Rollup, Webpack, or Parcel.
  ([#5860](https://github.com/Azure/azure-sdk-for-js/pull/5860))

## 1.0.0-preview.4 (2019-10-22)

- Removed the `SimpleTokenCredential` implementation since it is not useful outside of test scenarios
- Updated to use the latest version of `@azure/core-tracing` package

## 1.0.0-preview.3 (2019-09-09)

- Fixed a ping timeout issue. The timeout is now configurable. ([PR #4941](https://github.com/Azure/azure-sdk-for-js/pull/4941))
