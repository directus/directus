import { AbstractServiceOptions, Accountability, Collection } from '../types';
import { CollectionsService } from './collections'
import { FieldsService } from './fields'
import formatTitle from '@directus/format-title'
// @ts-ignore
import { version } from '../../package.json';

const internalCollections = [
    'directus_activity',
    'directus_presets',
    'directus_fields',
    'directus_files',
    'directus_folders',
    'directus_permissions',
    'directus_relations',
    'directus_revisions',
    'directus_roles',
    'directus_settings',
    'directus_users',
]

export class SpecificationService {
    accountability: Accountability | null;
    fieldsService: FieldsService | null;
    collectionsService: CollectionsService | null;

	constructor(options?: AbstractServiceOptions) {
        this.accountability = options?.accountability || null;
        this.fieldsService = new FieldsService(options)
        this.collectionsService = new CollectionsService(options)
    }
    
    async generateOAS() {
        let collections = await this.collectionsService?.readByQuery()
        if(collections === undefined) return {} // Should throw an error instead
        collections = collections.filter(collection => 
            collection.collection.startsWith('directus_') === false || internalCollections.includes(collection.collection)
        )

        const openapi = {
            openapi: '3.0.1',
            info: {
                title: 'Dynamic Api Specification',
                description: 'This is a dynamicly generated api specification for all endpoints existing on the api.',
                version: version,
                contact: {
                    name: 'Contact Directus',
                    url: 'https://directus.io/contact',
                    email: 'contact@directus.io'
                },
                license: {
                    name: 'GPL-3.0',
                    url: 'https://www.gnu.org/licenses/gpl-3.0.de.html'
                }
            },
            tags: await this.generateTags(collections),
            paths: await this.generatePaths(collections),
            components: {
                schemas: await this.generateSchemas(collections)
            }
        }

        return openapi
    }

    async generateTags(collections: Collection[]) {
        const tags: {name: string, description?: string}[] = []
        collections.forEach(collection => {
            if(collection.collection.startsWith('directus_')) return
            const name = formatTitle(collection.collection)
            tags.push({ name, description: collection.meta?.note || undefined })
        })
        return tags
    }

    async generatePaths(collections: Collection[]) {
        const paths: Record<string, object> = {}

        collections.forEach(collection => {
            const tagName = formatTitle(collection.collection)
            const name = tagName.replace(' ','')
            const path = "/items/" + collection.collection
            const objectRef = `#/components/schemas/${name}`

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
        })

        return paths
    }

    async generateSchemas(collections: Collection[]) {

    }
}
