[**@directus/sandbox**](../README.md)

***

[@directus/sandbox](../globals.md) / sandbox

# Function: sandbox()

> **sandbox**(`database`, `options?`): `Promise`\<[`Sandbox`](../type-aliases/Sandbox.md)\>

Defined in: [tests/sandbox/src/sandbox.ts:199](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L199)

## Parameters

### database

[`Database`](../type-aliases/Database.md)

### options?

#### build?

`boolean`

Rebuild directus from source

#### dev?

`boolean`

Start directus in developer mode. Not compatible with build

#### docker?

\{ `basePort?`: `string`; `keep?`: `boolean`; `name?`: `string`; \}

Configure the behavior of the spun up docker container

#### docker.basePort?

`string`

Minimum port number to use for docker containers

#### docker.keep?

`boolean`

Keep containers running when stopping the sandbox

#### docker.name?

`string`

Overwrite the name of the docker project

#### env?

\{\[`key`: `string`\]: `undefined` \| `string`; \}

Add environment variables that the api should start with

#### export?

`boolean`

Exports a snapshot and type definition every 2 seconds

#### extras?

\{ `maildev?`: `boolean`; `minio?`: `boolean`; `redis?`: `boolean`; `saml?`: `boolean`; \}

Enable redis,maildev,saml or other extras

#### extras.maildev?

`boolean`

Email server

#### extras.minio?

`boolean`

Storage provider

#### extras.redis?

`boolean`

Used for caching, forced to true if instances > 1

#### extras.saml?

`boolean`

Auth provider

#### inspect?

`boolean`

Start the api with debugger

#### instances?

`string`

Horizontally scale the api to a given number of instances

#### killPorts?

`boolean`

Forcefully kills all processes that occupy ports that the api would use

#### port?

`string`

Port to start the api on

#### prefix?

`string`

Prefix the logs, useful when starting multiple sandboxes

#### schema?

`string`

Load an additional schema snapshot on startup

#### watch?

`boolean`

Restart the api when changes are made

## Returns

`Promise`\<[`Sandbox`](../type-aliases/Sandbox.md)\>
