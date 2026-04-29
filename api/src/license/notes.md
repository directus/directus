# Manager Initialization

## Expanded version

| envKey | envToken | dbKey | dbToken | diff | Outcome                                      |
| :----: | :------: | :---: | :-----: | :--: | -------------------------------------------- |
|   ✓    |    ✓     |   ✓   |    ✓    |  ✓   | **Error** — both env vars set, process exits |
|   ✓    |    ✓     |   ✓   |    ✓    |  -   | **Error** — both env vars set, process exits |
|   ✓    |    ✓     |   ✓   |    -    |  ✓   | **Error** — both env vars set, process exits |
|   ✓    |    ✓     |   ✓   |    -    |  -   | **Error** — both env vars set, process exits |
|   ✓    |    ✓     |   -   |    ✓    |  ✓   | impossible                                   |
|   ✓    |    ✓     |   -   |    ✓    |  -   | **Error** — both env vars set, process exits |
|   ✓    |    ✓     |   -   |    -    |  ✓   | impossible                                   |
|   ✓    |    ✓     |   -   |    -    |  -   | **Error** — both env vars set, process exits |
|   ✓    |    -     |   ✓   |    ✓    |  ✓   | Key changed → update                         |
|   ✓    |    -     |   ✓   |    ✓    |  -   | Key unchanged → verify, refresh              |
|   ✓    |    -     |   ✓   |    -    |  ✓   | Key changed → update                         |
|   ✓    |    -     |   ✓   |    -    |  -   | Key unchanged → verify, refresh              |
|   ✓    |    -     |   -   |    ✓    |  ✓   | impossible                                   |
|   ✓    |    -     |   -   |    ✓    |  -   | activate                                     |
|   ✓    |    -     |   -   |    -    |  ✓   | impossible                                   |
|   ✓    |    -     |   -   |    -    |  -   | activate                                     |
|   -    |    ✓     |   ✓   |    ✓    |  ✓   | impossible                                   |
|   -    |    ✓     |   ✓   |    ✓    |  -   | verify offline token, cleanup DB             |
|   -    |    ✓     |   ✓   |    -    |  ✓   | impossible                                   |
|   -    |    ✓     |   ✓   |    -    |  -   | verify offline token, cleanup DB             |
|   -    |    ✓     |   -   |    ✓    |  ✓   | impossible                                   |
|   -    |    ✓     |   -   |    ✓    |  -   | verify offline token, cleanup DB             |
|   -    |    ✓     |   -   |    -    |  ✓   | impossible                                   |
|   -    |    ✓     |   -   |    -    |  -   | verify offline token, cleanup DB             |
|   -    |    -     |   ✓   |    ✓    |  ✓   | impossible                                   |
|   -    |    -     |   ✓   |    ✓    |  -   | verify token + refresh                       |
|   -    |    -     |   ✓   |    -    |  ✓   | impossible                                   |
|   -    |    -     |   ✓   |    -    |  -   | activate → persist token                     |
|   -    |    -     |   -   |    ✓    |  ✓   | impossible                                   |
|   -    |    -     |   -   |    ✓    |  -   | cleanup and CORE_LICENSE                     |
|   -    |    -     |   -   |    -    |  ✓   | impossible                                   |
|   -    |    -     |   -   |    -    |  -   | No license → CORE_LICENSE                    |

## Simplified Version

| envKey | envToken | dbKey | dbToken | diff | Outcome                                      |
| :----: | :------: | :---: | :-----: | :--: | -------------------------------------------- |
|   ✓    |    ✓     |  \*   |   \*    |  \*  | **Error** — both env vars set, process exits |
|   ✓    |    -     |   ✓   |   \*    |  ✓   | Key changed → update                         |
|   ✓    |    -     |   ✓   |   \*    |  -   | Key unchanged → verify, refresh              |
|   ✓    |    -     |   -   |   \*    |  -   | activate                                     |
|   -    |    ✓     |  \*   |   \*    |  -   | verify offline token, cleanup DB             |
|   -    |    -     |   ✓   |    ✓    |  -   | verify token + refresh                       |
|   -    |    -     |   ✓   |    -    |  -   | activate → persist token                     |
|   -    |    -     |   -   |    ✓    |  -   | cleanup and CORE_LICENSE                     |
|   -    |    -     |   -   |    -    |  -   | No license → CORE_LICENSE                    |

## Functions

Activate (license_key): call License API and store key and token in DB (can return new project_id)

Verify: online mode: check jwt against License API jwk offline mode: just check jwt against local jwk error if not
offline

Refresh (license_key): (if online) returns new jwt and store it to db and cache

Update (old_lk, new_lk): call to License API to update from old to new. Persist new in db and cache
