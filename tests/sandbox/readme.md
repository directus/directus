# Directus Api Sandbox 🛠️

Utility functions for quickly spinning up and down instances of directus for usage such as testing or development.

## Usage

The package offers two ways of interacting, either through calling JS functions or through accessing the command line
interface.

### CLI

```
Usage: sandbox [options] <database>

CLI for spinning up directus sandboxes for testing and development purposes

Arguments:
  database                     What database to start the api with (choices: "maria", "cockroachdb", "mssql", "mysql", "oracle", "postgres", "sqlite")

Options:
  -V, --version                output the version number
  -b, --build                  Rebuild directus from source
  -d, --dev                    Start directus in developer mode. Not compatible with build
  -w, --watch                  Restart the api when changes are made
  -p, --port <port>            Port to start the api on
  -a, --app [port]             Spin up the app in dev mode
  --inspect                    Start the api with debugger (default: true)
  -i, --instances <instances>  Horizontally scale directus to a given number of instances (default: "1")
  --db-version <version>       Which version of the database to use
  --docker.port <port>         Minimum port number to use for docker containers
  --docker.keep                Keep containers running when stopping the sandbox
  --docker.name <name>         Overwrite the name of the docker project
  --docker.suffix <suffix>     Adds a suffix to the docker project. Can be used to ensure uniqueness
  --env <env...>               Add environment variables that the api should start with. Format: KEY=VALUE (default: {})
  --cache                      Enable or disable caching
  --prefix <prefix>            Prefix the logs, useful when starting multiple sandboxes
  -x, --export                 Export the schema to a file every 2 seconds
  -s, --schema [schema]        Load an additional schema snapshot on startup
  -e, --extras <extras>        Enable redis,maildev,saml or other extras
  --silent                     Silence all logs except for errors
  -h, --help                   display help for command
```

### API

The api is accessed through the following two functions:

- [sandbox](docs/functions/sandbox.md)
- [sandboxes](docs/functions/sandboxes.md)

#### Example

```ts
import { sandbox } from '@directus/sandbox';

const sb = await sandbox('postgres', { dev: true });

// Interact via Rest, GQL or WebSockets
const result = await fetch(`http://localhost:${sb.apis[0].port}/items/articles`);

console.log(await result.json());

await sb.close();
```

## Inner workings

Depending on what is set in the configuration, some of these steps might be skipped:

1. **Building of the api**: If enabled, the api is freshly build each time the sandbox is started. Use the `watch`
   option to quickly iterate on changes.
2. **Starting of the docker containers**: All required docker containers like databases or extras like redis are spun up
   and awaited until healthy. If the docker containers are still running, they will be reused instead of starting up new
   ones.
3. **Bootstrapping of the database**: If not already bootstrapped, the sandbox will make sure that all necessary
   database tables are created.
4. **Loading of a schema snapshot**: In case the `schema` option is set, the database will also the snapshot applied
   before starting directus.
5. **Starting of the api**: Finally, the api(s) are spun up with the right environment variables configured.
6. **Starting of the app**: If enabled, the app is also started in development mode and connected to the api.
