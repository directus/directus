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
const FIELD_COUNT = 10;
const ITEM_COUNT = 100;
const EDIT_CHANCE = 0.2;
const COLLECTION_CHANCE = 0.5;
const FIELD_CHANCE = 0.5;
const ADD_FIELD_CHANCE = 0.2;

const relation = (collectionNr) => {
    collectionNr -= 1;
    let i = 0
    while (collectionNr > f(i)) i++

    return collectionNr !== f(i)

    function f(x) {
        return x * (x + 1) / 2
    }
};

function getRandomString(length) {
    var result = ' ';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for ( var i = 0; i < length; i++ ) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
   }
   return result;
}

function getRandomCollection() {
    return `test_${Math.ceil(Math.random() * COLLECTION_COUNT)}`
}

function getRandomField() {
    return `field_${Math.ceil(Math.random() * FIELD_COUNT)}`
}

function getRandomItem() {
    return Math.ceil(Math.random() * ITEM_COUNT)
}

export function setup() {
    for(let i = 1; i <= COLLECTION_COUNT; i++) {
        const collectionName = `test_${i}`

        const fields = [{
            field: `primary_key`,
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

        const hasRelation = relation(i)

        if(hasRelation) {
            fields.push({
                field: `relation`,
                type: 'integer',
                interface: 'select-dropdown-m2o',
                meta: {
                    interface: 'select-dropdown-m2o',
                    options: {
                        template: '{{primary_key}} - {{field-1}}',
                    },
                    special: ['m2o']
                },
                schema: {},
            })
        }

        http.post(getURL('/collections'), JSON.stringify({
            collection: collectionName,
            meta: {
                icon: 'tag',
            },
            schema: {},
            fields
        }), params)

        if(hasRelation) {
            http.post(getURL('/relations'), JSON.stringify({
                collection: collectionName,
                field: 'relation',
                related_collection: `test_${i - 1}`,
                meta: {},
                schema: {
                    on_delete: 'SET NULL',
                },
            }), params)
        }

        const items = []

        for(let i = 1; i <= ITEM_COUNT; i++) {
            const item = {}

            fields.slice(1).forEach(field => {
                if(field.type === 'string') {
                    item[field.field] = getRandomString(10)
                }
                if(field.type === 'integer') {
                    item[field.field] = getRandomItem()
                }
            })

            items.push(item)
        }
        
        http.post(getURL(`/items/${collectionName}`), JSON.stringify(items), params)
    }
}

export default function() {
    let response = http.get(getURL(`/items/${getRandomCollection()}`), params);

    if(Math.random() < EDIT_CHANCE) {
        const items = JSON.parse(response.body).data
        const item = items[Math.floor(Math.random() * items.length)]

        item[getRandomField()] = 'edited'

        http.patch(getURL(`/items/${getRandomCollection()}/${item.primary_key}`), JSON.stringify(item), params)
    }

    if(Math.random() < COLLECTION_CHANCE) {
        http.get(getURL(`/collections`), params)
    }

    if(Math.random() < FIELD_CHANCE) {
        http.get(getURL(`/fields`), params)
    }

    if(Math.random() < ADD_FIELD_CHANCE) {
        const collectionName = getRandomCollection()

        http.post(getURL(`/fields/${collectionName}`), JSON.stringify({
            field: `new_field_${Math.floor(Math.random() * 1000)}`,
            type: 'string',
            meta: {},
            schema: {},
        }), params)
    }
    
}

export function teardown() {
    for (let i = COLLECTION_COUNT; i > 0; i--) {
        http.del(getURL(`/collections/${`test_${i}`}`), params)
    }
}