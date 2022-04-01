# crypto-sha256-js

A pure JS implementation SHA256.

## Usage

```
import {Sha256} from '@aws-crypto/sha256-js';

const hash = new Sha256();
hash.update('some data');
const result = await hash.digest();

```

## Test

`npm test`
