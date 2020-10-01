import { AbstractServiceOptions, Accountability, Collection, Field, Relation } from '../types';
import { CollectionsService } from './collections'
import { FieldsService } from './fields'
import formatTitle from '@directus/format-title'
import {performance} from 'perf_hooks'
import { merge } from 'lodash'
// @ts-ignore
import { version } from '../../package.json';
// @ts-ignore
import openapi from '../../openapi.json'
import { RelationsService } from './relations';

const internalCollections = [
    'directus_activity',
    //'directus_collections' // Is this possible with meta and schema?
    'directus_presets',
    //'directus_fields', // Is this possible with meta and schema?
    'directus_files',
    'directus_folders',
    'directus_permissions',
    'directus_relations',
    'directus_revisions',
    'directus_roles',
    'directus_settings',
    'directus_users',
]

const fieldTypes = {
    bigInteger: {
        type: 'integer',
        format: 'int64'
    },
    boolean: {
        type: 'boolean'
    },
    date: {
        type: 'string',
        format: 'date'
    },
    dateTime: {
        type: 'string',
        format: 'date-time'
    },
    decimal: {
        type: 'number'
    },
    float: {
        type: 'number',
        format: 'float'
    },
    integer: {
        type: 'integer'
    },
    json: {
        type: 'array',
        items: {
            type: 'string'
        }
    },
    string: {
        type: 'string'
    },
    text: {
        type: 'string'
    },
    time: {
        type: 'string',
        format: 'time'
    },
    timestamp: {
        type: 'string',
        format: 'timestamp'
    },
    binary: {
        type: 'string',
        format: 'binary'
    },
    uuid: {
        type: 'string',
        format: 'uuid'
    },
    csv: {
        type: 'array',
        items: {
            type: 'string'
        }
    }
}

type RelationTree = Record<string, Record<string, Relation[]>>

export class SpecificationService {
    accountability: Accountability | null;
    fieldsService: FieldsService | null;
    collectionsService: CollectionsService | null;
    relationsService: RelationsService | null

	constructor(options?: AbstractServiceOptions) {
        this.accountability = options?.accountability || null;
        this.fieldsService = new FieldsService(options)
        this.collectionsService = new CollectionsService(options)
        this.relationsService = new RelationsService(options)
    }
    
    async generateOAS() {
        let collections = await this.collectionsService?.readByQuery()
        if(collections === undefined) return {} // Should throw an error instead
        collections = collections.filter(collection => 
            collection.collection.startsWith('directus_') === false || internalCollections.includes(collection.collection)
        )
        
        const allFields = await this.fieldsService?.readAll()
        const fields: Record<string, Field[]> = {}
        if(allFields === undefined) return {}
        allFields.forEach(field => {
            if(field.collection.startsWith('directus_') === false || internalCollections.includes(field.collection)) {
                if(field.collection in fields) {
                    fields[field.collection].push(field)
                } else {
                    fields[field.collection] = [field]
                }
            }
        })

        let relations = await this.relationsService?.readByQuery({})
        if(relations === undefined || relations === null) return {}
        if(Array.isArray(relations) === false) relations = [relations]

        let relationsTree: RelationTree = {};
        (relations as Relation[]).forEach((relation: Relation) => {
            if(relation.many_collection in relationsTree === false) relationsTree[relation.many_collection] = {};
            if(relation.one_collection in relationsTree === false) relationsTree[relation.one_collection] = {};

            if(relation.many_field in relationsTree[relation.many_collection] === false) relationsTree[relation.many_collection][relation.many_field] = []
            if(relation.one_field in relationsTree[relation.one_collection] === false) relationsTree[relation.one_collection][relation.one_field] = []

            relationsTree[relation.many_collection][relation.many_field].push(relation)
            relationsTree[relation.one_collection][relation.one_field].push(relation)
        })
        

        const dynOpenapi = {
            openapi: '3.0.1',
            info: {
                title: 'Dynamic Api Specification',
                description: 'This is a dynamicly generated api specification for all endpoints existing on the api.',
                version: version
            },
            tags: this.generateTags(collections),
            paths: this.generatePaths(collections),
            components: {
                schemas: this.generateSchemas(collections, fields, relationsTree)
            }
        }

        return merge(openapi, dynOpenapi)
    }

    generateTags(collections: Collection[]) {
        const tags: {name: string, description?: string}[] = []

        for(const collection of collections) {
            if(collection.collection.startsWith('directus_')) continue
            const name = formatTitle(collection.collection)
            tags.push({ name, description: collection.meta?.note || undefined })
        }

        return tags
    }

    generatePaths(collections: Collection[]) {
        const paths: Record<string, object> = {}

        for (const collection of collections) {
            if(collection.collection.startsWith('directus_')) continue
            const tagName = formatTitle(collection.collection)
            const name = tagName.replace(' ','')
            const path = "/items/" + collection.collection
            const objectRef = `#/components/schemas/${name}Item`

            const objectSingle = {
                content: {
                    'application/json': {
                        schema: {
                            $ref: objectRef
                        }
                    }
                }
            }
            
            paths[path] = {
                get: {
                    operationId: `get${name}Items`,
                    description: `List all items from the ${tagName} collection`,
                    tags: [tagName],
                    parameters: [
                        { "$ref": "#/components/parameters/Fields" },
                        { "$ref": "#/components/parameters/Limit" },
                        { "$ref": "#/components/parameters/Meta" },
                        { "$ref": "#/components/parameters/Offset" },
                        { "$ref": "#/components/parameters/Single" },
                        { "$ref": "#/components/parameters/Sort" },
                        { "$ref": "#/components/parameters/Filter" },
                        { "$ref": "#/components/parameters/q" }
                    ],
                    responses: {
                        '200': {
                            description: 'Successful request',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'array',
                                                items: {
                                                    $ref: objectRef
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            $ref: '#/components/responses/UnauthorizedError'
                        }
                    }
                },
                post: {
                    operationId: `create${name}Item`,
                    description: `Create a new item in the ${tagName} collection`,
                    tags: [tagName],
                    parameter: [{"$ref": "#/components/parameters/Meta"}],
                    requestBody: objectSingle,
                    response: {
                        '200': objectSingle,
                        '401': {
                            $ref: '#/components/responses/UnauthorizedError'
                        }
                    }
                }
            },
            paths[path + '/{id}'] = {
                parameters: [ { $ref: '#/components/parameters/Id' } ],
                get: {
                    operationId: `get${name}Item`,
                    description: `Get a singe item from the ${tagName} collection`,
                    tags: [tagName],
                    parameters: [
                        { "$ref": "#/components/parameters/Fields" },
                        { "$ref": "#/components/parameters/Meta" },
                    ],
                    response: {
                        '200': objectSingle,
                        '401': {
                            $ref: '#/components/responses/UnauthorizedError'
                        },
                        '404': {
                            $ref: '#/components/responses/NotFoundError'
                        }
                    }
                },
                patch: {
                    operationId: `update${name}Item`,
                    description: `Update an item from the ${tagName} collection`,
                    tags: [tagName],
                    parameters: [
                        { "$ref": "#/components/parameters/Fields" },
                        { "$ref": "#/components/parameters/Meta" },
                    ],
                    requestBody: objectSingle,
                    response: {
                        '200': objectSingle,
                        '401': {
                            $ref: '#/components/responses/UnauthorizedError'
                        },
                        '404': {
                            $ref: '#/components/responses/NotFoundError'
                        }
                    }
                },
                delete: {
                    operationId: `delete${name}Item`,
                    description: `Delete an item from the ${tagName} collection`,
                    tags: [tagName],
                    response: {
                        '200': {
                            description: 'Successful request'
                        },
                        '401': {
                            $ref: '#/components/responses/UnauthorizedError'
                        },
                        '404': {
                            $ref: '#/components/responses/NotFoundError'
                        }
                    }
                }
            }
        }

        return paths
    }

    generateSchemas(collections: Collection[], fields: Record<string, Field[]>, relations: RelationTree) {
        const schemas: Record<string, any> = {}

        const getSchemaName = function(collection: string) {
            const name = collection.startsWith('directus_') ? collection.replace('directus_','').replace(/s$/,'') : collection+"Item"
            return formatTitle(name).replace(/ /g,'')
        }

        for(const collection of collections) {
            let name = getSchemaName(collection.collection)
            const tag = formatTitle(collection.collection.replace('directus_',''))

            if(fields === undefined) return

            schemas[name] = {
                type: 'object',
                'x-tag': tag,
                properties: {}
            }

            for(const field of fields[collection.collection]) {
                const fieldRelations = field.collection in relations && field.field in relations[field.collection] ? relations[field.collection][field.field] : []

                if(fieldRelations.length !== 0) {
                    const relation = fieldRelations[0]
                    const isManySide = relation.many_collection === field.collection

                    let relatedCollection = isManySide ? relation.one_collection : relation.many_collection
                    const relatedPrimaryField = fields[relatedCollection].find(field => field.schema?.is_primary_key)

                    if(relatedPrimaryField?.type === undefined) return;

                    const relatedType = fieldTypes[relatedPrimaryField?.type]
            
                    const relatedSchema = getSchemaName(relatedCollection)

                    const type = isManySide ? {
                        oneOf: [{
                            ...relatedType,
                            nullable: field.schema?.is_nullable === true,
                        }, {$ref: `#/components/schemas/${relatedSchema}`}]
                    } : {
                        type: 'array',
                        items: {$ref: `#/components/schemas/${relatedSchema}`},
                        nullable: field.schema?.is_nullable === true
                    }

                    schemas[name].properties[field.field] = {
                        ...type,
                        description: field.meta?.note || undefined
    
                    }


                } else {
                    schemas[name].properties[field.field] = {
                        ...fieldTypes[field.type],
                        nullable: field.schema?.is_nullable === true,
                        description: field.meta?.note || undefined
                    }
                }
            }
        }
        return schemas
    }
}
