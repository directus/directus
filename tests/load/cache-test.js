import http from "k6/http";
import { check, sleep } from "k6";
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

const URL_PATH = "http://localhost:8055"
const TOKEN = "admin"

function getURL(path) {
    const url = new URL(path, URL_PATH)
    url.searchParams.set('access_token', TOKEN)
    return url.toString()
}

const params = {
    headers: {
        "Content-Type": "application/json",
    }
}

/*

What we want to improve:
1. Caching of the schema in general
    a. Caching of each collection in a separate key
    b. Caching each field in a hash
    c. Possibly dynamic refreshing from db
2. Caching of the incoming requests
    a. When changing an item, only clear the cache for that item
    b. When changing fields of a collection, only clear the cache for that collection

The Plan:

Create 10 collections called "test_1" through "test_10"
For each collection, create 25 fields called "field_1" through "field_25"
Create relations between each collection with the following pattern: test_1 | test_2 <- test_3 | test_4 <- test_5 <- test_6 | test_7 <- test_8 <- test_9 <- test_10 | ...
For each collection, create 100 items with random values for each field
*/

const COLLECTION_COUNT = 10;
const FIELD_COUNT = 25;
const ITEM_COUNT = 100;
const relation = (collectionNr) => {
    collectionNr -= 1;
    let i = 0
    while (collectionNr > f(i)) i++

    return collectionNr !== f(i)

    function f(x) {
        return x * (x + 1) / 2
    }
};

export function setup() {
    for(let i = 1; i <= COLLECTION_COUNT; i++) {
        const collectionName = `test_${i}`

        const fields = [{
            field: `field-0`,
            type: 'integer',
            interface: 'input',
            meta: {
                interface: 'input',
                readonly: true
            },
            schema: {
                is_primary_key: true,
                has_auto_increment: true,
            },
        }]

        for(let j = 1; j <= FIELD_COUNT; j++) {
            fields.push({
                field: `field-${j}`,
                type: 'string',
                meta: {},
                schema: {},
            })
        }

        if(relation(i)) {
            fields.push({
                field: `relation`,
                type: 'integer',
                interface: 'select-dropdown-m2o',
                meta: {
                    interface: 'input',
                    readonly: true
                },
                schema: {
                    is_primary_key: true,
                    has_auto_increment: true,
                },
            })

            http.post(getURL('/relations'), JSON.stringify({
                collection: collectionName,
                field: 'relation',
                related_collection: `test_${i - 1}`,
                meta: {},
                schema: {
                    on_delete: 'SET NULL',
                },
            }))
        }


        const resp = http.post(getURL('/collections'), JSON.stringify({
            collection: collectionName,
            meta: {
                icon: 'tag',
            },
            schema: {},
            fields
        }), params)
    }
}

export default function() {
    let response = http.get(getURL('/collections/test_1'), params);


}

export function teardown() {
    for (let i = COLLECTION_COUNT; i > 0; i++) {
        http.del(getURL(`/collections/${`test_${i}`}`), params)
    }
}