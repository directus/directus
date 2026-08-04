# @directus/specs

OpenAPI Specification of the Directus API.

## Description

This package contains the **static** OpenAPI (OAS 3.0) definition for the Directus API.

It is bundled into a single document that Directus uses as the template for dynamically generating an OpenAPI
specification based on the instance schema and the current user's permissions.

For API documentation, see https://directus.com/docs/api.

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

- `x-action`: `create` | `read` | `update` | `delete`; overrides the RBAC action an operation with an `x-collection`
  override is checked against, for the (uncommon) case where the operation's HTTP method doesn't match what it actually
  does - e.g. a `POST` that only reads and archives existing items shouldn't be gated on `create` access. Defaults to
  the action implied by the HTTP method (`post` → `create`, `get` → `read`, `patch` → `update`, `delete` → `delete`);
  only set this when that default is wrong for the specific operation.
- `x-authentication`: `admin` | `user` on a tag; `admin` | `user` | `self` on an operation. On a tag, restricts the
  system collection (and its paths) to being included in the generated spec only when the requesting accountability
  meets that level. On an operation, gates that specific operation the same way, for the (uncommon) case where its
  authorization check is enforced in the service layer independent of collection RBAC. `admin` and `self` are a full
  bypass; only `accountability.admin`/`accountability.user` matters (e.g. `POST /collections`, `GET /users/me`). `user`
  requires `accountability.user` in addition to the caller's own RBAC permission, since the hardcoded check some
  services add on top of RBAC (e.g. `CommentsService`) doesn't replace it. An operation-level `x-authentication` also
  keeps the dynamic generator's public-access stamp (see Security below) from ever applying to that operation,
  regardless of what the public role's own permissions say.
- `x-collection`: links a tag (and its associated schema component) to the system collection it documents (e.g.
  `directus_presets`). Used to resolve permissions/field-filtering per collection at generation time. Can also be set on
  a single operation to override the tag's collection (or supply one, if the tag has none) for that operation's own RBAC
  check, for a tag whose operations don't all share one collection.
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

- **Always public, no auth accepted or required (`security: []`)**: required for endpoints that run with no
  accountability at all (e.g. `/auth/login`, `/server/ping`, `/users/register/verify-email`) - the dynamic generator
  never overwrites this override with the public-access stamp, unlike the others below.
- **Restricted to admin/user/self (`x-authentication`)**: `admin` | `user` | `self`. Set on a tag for system collections
  that should only appear in the generated spec at all when the requester meets that authentication level, e.g.
  `x-authentication: admin` on the `Schema` tag. Also settable on an individual operation whose authorization check is
  hardcoded in the service layer independent of RBAC, e.g. `x-authentication: admin` on `POST /collections`,
  `x-authentication: user` on `POST /comments`, `x-authentication: self` on `GET /users/me`. This gates whether the path
  is included, not which security schemes it lists, and an operation-level override also stops the public-access stamp
  below from ever applying to it.
- **Optionally authenticated, response may differ (`security: [{}, {Auth: []}, {KeyAuth: []}, {CookieAuth: []}]`)**: for
  endpoints the public role can reach but that return more/different data to an authenticated caller (e.g. a
  publicly-readable collection). Usually the dynamic generator stamps this onto generated operations via
  `OPTIONAL_AUTH_SECURITY` when it determines the public role has read access to the underlying collection - but declare
  it statically instead, like `/server/info` and `/assets/{id}` do, for an endpoint that's always reachable one way or
  another regardless of RBAC (e.g. `/assets/{id}` always serves the four branding files referenced by
  `directus_settings` to anyone, on top of whatever `directus_files` read access allows).

## Development

```
pnpm --filter @directus/specs dev       # watches src/**/*.yaml and rebuilds dist/openapi.json on change
pnpm --filter @directus/specs build     # one-off bundle
pnpm --filter @directus/specs validate  # swagger-cli validate against src/openapi.yaml
```

## License

See the [LICENSE](https://github.com/directus/directus/blob/main/packages/specs/license) file for more information.

## Additional Resources

- [Directus Website](https://directus.com)
- [Directus GitHub Repository](https://github.com/directus/directus)
