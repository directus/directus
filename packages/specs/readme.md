# @directus/specs

OpenAPI Specification of the Directus API.

## Description

This package contains the **static** OpenAPI (OAS 3.0) definition for the Directus API, split across per-path,
per-component, per-parameter, and per-response YAML files under `src/`. It's bundled into a single document
(`dist/openapi.json`) that is consumed by `api/src/services/specifications.ts` to dynamically generate a per-project,
per-role spec reflecting the connected database's actual collections, fields, and permissions. Because the real
input/output shape depends on your specific schema and configured permissions, this static spec should be read as the
generic template rather than ground truth for any one project; for conceptual/reference documentation of the API, see
[directus.com/docs/api](https://directus.com/docs/api). To see the accurate, project-specific spec, request
`GET /server/specs/oas` from a running instance.

## Directory Structure

```
src/
  openapi.yaml       # Entry point; top-level info, servers, global `security`, tags, and path/component $refs
  paths/              # One file per path (or per path + method group), organized by resource, e.g. paths/items/
  components/         # Reusable schema objects (per system collection)
  parameters/         # Reusable query/path parameters
  responses/           # Reusable response objects (e.g. error responses)
  definitions/         # Reusable definitions (e.g. Query)
```

## Custom (`x-*`) Extension Fields

- `x-authentication`: `admin` | `user`; restricts a system tag (and its paths) to being included in the generated spec
  only when the requesting accountability meets that level.
- `x-collection`: links a tag (and its associated schema component) to the system collection it documents (e.g.
  `directus_presets`). Used to resolve permissions/field-filtering per collection at generation time.
- `x-enabled-env`: TODO (in progress on `feat/specs-env-gated-27766`) - set on a tag to name the env var that must be
  truthy for that tag's paths to appear in the generated spec, e.g. `Metrics`' `x-enabled-env: METRICS_ENABLED`. Add
  this to your tag if the feature it documents can be disabled entirely. Document the finalized mechanism here once that
  branch merges.
- `x-schemas`: extra `components.schemas` names a tag's operations `$ref` but that aren't picked up automatically (only
  collection-backed tags get their schema included by default). Add the schema name here if your tag's operations
  reference a schema that isn't its own `x-collection`, e.g. `Utilities`' `x-schemas: [Files, Folders, Users, Roles]`
  for utility endpoints that return data shaped like those collection without being their tag.

## Security

By default, a path/operation needs no `security:` declaration at all: the document-level default declared at the top of
`openapi.yaml` is inherited by every operation that doesn't declare its own, per the
[OAS3 operation object](https://spec.openapis.org/oas/v3.0.3#operation-object). Most paths should rely on this
inheritance rather than restating the default explicitly. Only add an operation-level `security` override when the
operation's actual requirement differs from that default. The cases where it differs:

- **Always public, no auth accepted or required (`security: []`)**: for endpoints that are genuinely public with no
  authenticated variant, e.g. `/auth/login`, `/server/ping`, `/users/invite/accept`.
- **Restricted to admin/user (`x-authentication`)**: `admin` | `user`. Set on the tag for system collections that should
  only appear in the generated spec at all when the requester meets that authentication level, e.g.
  `x-authentication: admin` on the `Schema` tag. This gates whether the path is included, not which security schemes it
  lists.
  - TODO (WIP, tracked in #27916): also usable on individual operations, for hard authentication requirements that RBAC
    permissions can't express, e.g. `PATCH`/`DELETE` on collections/fields/relations always requiring admin, or comment
    mutations always requiring an authenticated user, regardless of what permissions are actually granted.
- **Optionally authenticated, response may differ (`security: [{}, {Auth: []}, {KeyAuth: []}, {CookieAuth: []}]`)**: for
  endpoints the public role can reach but that return more/different data to an authenticated caller (e.g. a
  publicly-readable collection). The dynamic generator stamps this onto generated operations via
  `OPTIONAL_AUTH_SECURITY` when it determines the public role has read access to the underlying collection.

## `_Public` Schema Variants

TODO (follow-up PR, in progress on `fix/oas-dynamic-spec-security-public-schemas`): for any collection the public role
can read, the dynamic generator builds a second, reduced `<Name>_Public` schema component
(`additionalProperties: false`) containing only the fields the public role actually has access to. Operations reachable
by the public role document their response as `oneOf: [<Name>, <Name>_Public]`, since a given caller may be anonymous or
authenticated with broader access to the same collection. If `<Name>_Public` turns out to be an exact match for `<Name>`
(the public role has the same field access as the requester), the `_Public` variant is suppressed and the response
documents just `<Name>`. Document the finalized mechanism here once that branch merges.

## Development

```
pnpm --filter @directus/specs dev       # watches src/**/*.yaml and rebuilds dist/openapi.json on change
pnpm --filter @directus/specs build     # one-off bundle
pnpm --filter @directus/specs validate  # swagger-cli validate against src/openapi.yaml
```

TODO: note the known/pre-existing baseline validation warnings (if still true) and how to tell a pre-existing warning
from one introduced by a change (e.g. diffing `validate` output against `main`).

## License

See the [LICENSE](https://github.com/directus/directus/blob/main/packages/specs/license) file for more information.

## Additional Resources

- [Directus Website](https://directus.com)
- [Directus GitHub Repository](https://github.com/directus/directus)
