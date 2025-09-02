[**@directus/sandbox**](../README.md)

***

[@directus/sandbox](../globals.md) / Options

# Type Alias: Options

> **Options** = `object`

Defined in: [tests/sandbox/src/sandbox.ts:20](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L20)

## Properties

### build

> **build**: `boolean`

Defined in: [tests/sandbox/src/sandbox.ts:22](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L22)

Rebuild directus from source

***

### dev

> **dev**: `boolean`

Defined in: [tests/sandbox/src/sandbox.ts:24](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L24)

Start directus in developer mode. Not compatible with build

***

### docker

> **docker**: `object`

Defined in: [tests/sandbox/src/sandbox.ts:30](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L30)

Configure the behavior of the spun up docker container

#### basePort

> **basePort**: `string`

Minimum port number to use for docker containers

#### keep

> **keep**: `boolean`

Keep containers running when stopping the sandbox

#### name

> **name**: `string` \| `undefined`

Overwrite the name of the docker project

***

### env

> **env**: `Record`\<`string`, `string`\>

Defined in: [tests/sandbox/src/sandbox.ts:41](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L41)

Add environment variables that the api should start with

***

### export

> **export**: `boolean`

Defined in: [tests/sandbox/src/sandbox.ts:45](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L45)

Exports a snapshot and type definition every 2 seconds

***

### extras

> **extras**: `object`

Defined in: [tests/sandbox/src/sandbox.ts:53](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L53)

Enable redis,maildev,saml or other extras

#### maildev

> **maildev**: `boolean`

Email server

#### minio

> **minio**: `boolean`

Storage provider

#### redis

> **redis**: `boolean`

Used for caching, forced to true if instances > 1

#### saml

> **saml**: `boolean`

Auth provider

***

### inspect

> **inspect**: `boolean`

Defined in: [tests/sandbox/src/sandbox.ts:49](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L49)

Start the api with debugger

***

### instances

> **instances**: `string`

Defined in: [tests/sandbox/src/sandbox.ts:39](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L39)

Horizontally scale the api to a given number of instances

***

### killPorts

> **killPorts**: `boolean`

Defined in: [tests/sandbox/src/sandbox.ts:51](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L51)

Forcefully kills all processes that occupy ports that the api would use

***

### port

> **port**: `string`

Defined in: [tests/sandbox/src/sandbox.ts:28](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L28)

Port to start the api on

***

### prefix

> **prefix**: `string` \| `undefined`

Defined in: [tests/sandbox/src/sandbox.ts:43](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L43)

Prefix the logs, useful when starting multiple sandboxes

***

### schema

> **schema**: `string` \| `undefined`

Defined in: [tests/sandbox/src/sandbox.ts:47](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L47)

Load an additional schema snapshot on startup

***

### watch

> **watch**: `boolean`

Defined in: [tests/sandbox/src/sandbox.ts:26](https://github.com/directus/directus/blob/be7bd2f6c7ad4fe1677be3eefcabacd0f25edd47/tests/sandbox/src/sandbox.ts#L26)

Restart the api when changes are made
