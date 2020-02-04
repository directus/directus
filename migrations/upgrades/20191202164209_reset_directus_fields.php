<?php

use Phinx\Migration\AbstractMigration;

// -------------------------------------------------------------------------
// NOTE:
//
// This is a one-of meant to ensure that everybody is on the same fresh
// datastructure when upgrading to or install v8. There have been quite a
// lot of migrations in v7 that may or may not have caused the database to be
// out of sync with fresh installations.
// -------------------------------------------------------------------------

class ResetDirectusFields extends AbstractMigration
{
    public function change()
    {
        $fieldsTable = $this->table('directus_fields');

        // -------------------------------------------------------------------------
        // Delete all rows that apply to directus_* collections from fields
        // -------------------------------------------------------------------------
        $this->execute('DELETE FROM directus_fields WHERE collection LIKE "directus\_%"');

        // -------------------------------------------------------------------------
        // Add v8.0.0 data
        // -------------------------------------------------------------------------
        $data = [
            // ---------------------------------------------------------------------
            // directus_fields
            [
                'collection' => 'directus_fields',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'collection',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'field',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'type',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'primary-key',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'interface',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'primary-key',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'options',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'locked',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'translation',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'repeater',
                'locked' => 1,
                'options' => '{
                "fields": [
                    {
                        "field": "locale",
                        "type": "string",
                        "interface": "language",
                        "options": {
                            "limit": true
                        },
                        "width": "half"
                    },
                    {
                        "field": "translation",
                        "type": "string",
                        "interface": "text-input",
                        "width": "half"
                    }
                ]
            }'
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'readonly',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'validation',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'required',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'sort',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_SORT,
                'interface' => 'sort',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'note',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'hidden_detail',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'hidden_browse',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'width',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'group',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],

            // ---------------------------------------------------------------------
            // directus_activity
            [
                'collection' => 'directus_activity',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'readonly' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'action',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'change_history'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 1,
                'width' => 'full'
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'collection',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'collections',
                'options' => json_encode([
                    'iconRight' => 'list_alt',
                    'include_system' => true
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 2,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'item',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'link'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 3,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'action_by',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'user',
                'options' => json_encode([
                    'iconRight' => 'account_circle'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 4,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'action_on',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'options' => json_encode([
                    'showRelative' => true,
                    'iconRight' => 'calendar_today'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 5,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'edited_on',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'options' => json_encode([
                    'showRelative' => true,
                    'iconRight' => 'edit'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 6,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'comment_deleted_on',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'options' => json_encode([
                    'showRelative' => true,
                    'iconRight' => 'delete_outline'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 7,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'ip',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'my_location'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 8,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'user_agent',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'devices_other'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 9,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'comment',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'textarea',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 10,
                'width' => 'full'
            ],

            // ---------------------------------------------------------------------
            // directus_collections_presets
            [
                'collection' => 'directus_collection_presets',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1
            ],
            [
                'collection' => 'directus_collection_presets',
                'field' => 'title',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_collection_presets',
                'field' => 'user',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'user',
                'locked' => 1
            ],
            [
                'collection' => 'directus_collection_presets',
                'field' => 'role',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],
            [
                'collection' => 'directus_collection_presets',
                'field' => 'collection',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],
            [
                'collection' => 'directus_collection_presets',
                'field' => 'search_query',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_collection_presets',
                'field' => 'filters',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1
            ],
            [
                'collection' => 'directus_collection_presets',
                'field' => 'view_options',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1
            ],
            [
                'collection' => 'directus_collection_presets',
                'field' => 'view_type',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_collection_presets',
                'field' => 'view_query',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1
            ],

            // ---------------------------------------------------------------------
            // directus_collections
            [
                'collection' => 'directus_collections',
                'field' => 'fields',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_O2M,
                'interface' => 'one-to-many',
                'locked' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1,
                'sort' => 1
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'collection',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'primary-key',
                'locked' => 1,
                'readonly' => 1,
                'required' => 1,
                'sort' => 2,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'note',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'sort' => 3,
                'width' => 'half',
                'note' => 'An internal description.'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'managed',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'sort' => 4,
                'width' => 'half',
                'hidden_detail' => 1,
                'note' => '[Learn More](https://docs.directus.io/guides/collections.html#managing-collections).'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'hidden',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'sort' => 5,
                'width' => 'half',
                'note' => '[Learn More](https://docs.directus.io/guides/collections.html#hidden).'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'single',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'sort' => 6,
                'width' => 'half',
                'note' => '[Learn More](https://docs.directus.io/guides/collections.html#single).'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'translation',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'repeater',
                'locked' => 1,
                'sort' => 7,
                'hidden_detail' => 0,
                'options' => '{
                "fields": [
                    {
                        "field": "locale",
                        "type": "string",
                        "interface": "language",
                        "options": {
                            "limit": true
                        },
                        "width": "half"
                    },
                    {
                        "field": "translation",
                        "type": "string",
                        "interface": "text-input",
                        "width": "half"
                    }
                ]
            }'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'icon',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'icon',
                'locked' => 1,
                'sort' => 8,
                'note' => 'The icon shown in the App\'s navigation sidebar.'
            ],

            // ---------------------------------------------------------------------
            // directus_files
            [
                'collection' => 'directus_files',
                'field' => 'preview',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'file-preview',
                'locked' => 1,
                'sort' => 1,
                'width' => 'full'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'title',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'placeholder' => 'Enter a descriptive title...',
                    'iconRight' => 'title'
                ]),
                'locked' => 1,
                'sort' => 2,
                'width' => 'full'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'tags',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'options' => json_encode([
                    'placeholder' => 'Enter a keyword then hit enter...'
                ]),
                'sort' => 3,
                'width' => 'half',
                'locked' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'location',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'placeholder' => 'Enter a location...',
                    'iconRight' => 'place'
                ]),
                'sort' => 4,
                'width' => 'half',
                'locked' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'description',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'wysiwyg',
                'options' => json_encode([
                    'toolbar' => ['bold', 'italic', 'underline', 'link', 'code']
                ]),
                'sort' => 5,
                'width' => 'full',
                'locked' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'filename_download',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'options' => json_encode([
                    'monospace' => true,
                    'iconRight' => 'get_app'
                ]),
                'sort' => 6,
                'width' => 'full'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'filename_disk',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'placeholder' => 'Enter a unique file name...',
                    'iconRight' => 'insert_drive_file'
                ]),
                'locked' => 1,
                'sort' => 7,
                'width' => 'full'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'private_hash',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'slug',
                'width' => 'half',
                'locked' => 1,
                'sort' => 8,
                'options' => json_encode([
                    'iconRight' => 'lock'
                ])
            ],
            [
                'collection' => 'directus_files',
                'field' => 'checksum',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 9,
                'width' => 'half',
                'options' => json_encode([
                    'iconRight' => 'check',
                    'monospace' => true
                ])
            ],
            [
                'collection' => 'directus_files',
                'field' => 'uploaded_on',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'options' => json_encode([
                    'iconRight' => 'today'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 10,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'uploaded_by',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_OWNER,
                'interface' => 'user-created',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 11,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'width',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'straighten'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 12,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'height',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'straighten'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 13,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'duration',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'timer'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 14,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'filesize',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'file-size',
                'options' => json_encode([
                    'iconRight' => 'storage'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 15,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'metadata',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'key-value',
                'locked' => 1,
                'sort' => 15,
                'width' => 'full',
                'options' => json_encode([
                    'keyInterface' => 'text-input',
                    'keyDataType' => 'string',
                    'keyOptions' => [
                        'monospace' => true,
                        'placeholder' => 'Key'
                    ],
                    'valueInterface' => 'text-input',
                    'valueDataType' => 'string',
                    'valueOptions' => [
                        'monospace' => true,
                        'placeholder' => 'Value'
                    ]
                ])
            ],
            [
                'collection' => 'directus_files',
                'field' => 'data',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'file',
                'locked' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'type',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'charset',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'embed',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'folder',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'storage',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1
            ],

            // ---------------------------------------------------------------------
            // directus_folders
            [
                'collection' => 'directus_folders',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_folders',
                'field' => 'name',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_folders',
                'field' => 'parent_folder',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],

            // ---------------------------------------------------------------------
            // directus_roles
            [
                'collection' => 'directus_roles',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'external_id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'name',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'sort' => 1,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'description',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'sort' => 2,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'ip_whitelist',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'options' => json_encode([
                    '' => 'Add an IP address...'
                ]),
                'locked' => 1
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'enforce_2fa',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'users',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_O2M,
                'interface' => 'one-to-many',
                'locked' => 1,
                'options' => json_encode([
                    'fields' => "first_name,last_name"
                ])
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'module_listing',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'repeater',
                'locked' => 1,
                'options' => '{
                "fields": [
                    {
                        "field": "name",
                        "interface": "text-input",
                        "type": "string",
                        "width": "half"
                    },
                    {
                        "field": "link",
                        "interface": "text-input",
                        "type": "string",
                        "width": "half"
                    },
                    {
                        "field": "icon",
                        "interface": "icon",
                        "type": "string",
                        "width": "full"
                    }
                ]
            }'
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'collection_listing',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'repeater',
                'locked' => 1,
                'options' => '{
                "fields": [
                    {
                        "field": "groups",
                        "width": "full",
                        "interface": "repeater",
                        "type": "JSON",
                        "options": {
                            "template": "{{ label }}",
                            "fields": [
                                {
                                    "field": "label",
                                    "interface": "text-input",
                                    "type": "string"
                                },
                                {
                                    "field": "value",
                                    "interface": "text-input",
                                    "type": "string"
                                },
                                {
                                    "field": "icon",
                                    "width": "full",
                                    "interface": "icon",
                                    "type": "string"
                                }
                            ]
                        }
                    }
                ]
            }'
            ],

            // ---------------------------------------------------------------------
            // directus_permissions
            [
                'collection' => 'directus_permissions',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'collection',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'role',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'status',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'create',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'read',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'update',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'delete',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'primary-key',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'comment',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'explain',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'status_blacklist',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'read_field_blacklist',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'locked' => 1
            ],
            [
                'collection' => 'directus_permissions',
                'field' => 'write_field_blacklist',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'locked' => 1
            ],

            // ---------------------------------------------------------------------
            // directus_relations
            [
                'collection' => 'directus_relations',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1
            ],
            [
                'collection' => 'directus_relations',
                'field' => 'collection_many',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'collections',
                'locked' => 1
            ],
            [
                'collection' => 'directus_relations',
                'field' => 'field_many',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_relations',
                'field' => 'collection_one',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'collections',
                'locked' => 1
            ],
            [
                'collection' => 'directus_relations',
                'field' => 'field_one',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_relations',
                'field' => 'junction_field',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],

            // ---------------------------------------------------------------------
            // directus_revisions
            [
                'collection' => 'directus_revisions',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1
            ],
            [
                'collection' => 'directus_revisions',
                'field' => 'activity',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],
            [
                'collection' => 'directus_revisions',
                'field' => 'collection',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],
            [
                'collection' => 'directus_revisions',
                'field' => 'item',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_revisions',
                'field' => 'data',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1
            ],
            [
                'collection' => 'directus_revisions',
                'field' => 'delta',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1
            ],
            [
                'collection' => 'directus_revisions',
                'field' => 'parent_item',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1
            ],
            [
                'collection' => 'directus_revisions',
                'field' => 'parent_collection',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'collections',
                'locked' => 1
            ],
            [
                'collection' => 'directus_revisions',
                'field' => 'parent_changed',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1
            ],

            // ---------------------------------------------------------------------
            // directus_revisions
            [
                'collection' => 'directus_settings',
                'field' => 'project_name',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'title'
                ]),
                'locked' => 1,
                'required' => 1,
                'width' => 'half',
                'note' => 'Logo in the top-left of the App (40x40)',
                'sort' => 1
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_url',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'link'
                ]),
                'locked' => 1,
                'width' => 'half',
                'note' => 'External link for the App\'s top-left logo',
                'sort' => 2
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_logo',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'width' => 'half',
                'note' => 'A 40x40 brand logo, ideally a white SVG/PNG',
                'sort' => 3
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_color',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'color',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Color for login background and App\'s logo',
                'sort' => 4
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_foreground',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Centered image (eg: logo) for the login page',
                'sort' => 5
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_background',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Full-screen background for the login page',
                'sort' => 6
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'default_locale',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'language',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Default locale for Directus Users',
                'sort' => 7,
                'options' => json_encode([
                    'limit' => true
                ])
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'telemetry',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'width' => 'half',
                'note' => '<a href="https://docs.directus.io/getting-started/concepts.html#telemetry" target="_blank">Learn More</a>',
                'sort' => 8
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'data_divider',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'divider',
                'options' => json_encode([
                    'style' => 'large',
                    'title' => 'Data',
                    'hr' => true
                ]),
                'locked' => 1,
                'width' => 'full',
                'hidden_browse' => 1,
                'sort' => 10
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'default_limit',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'keyboard_tab'
                ]),
                'locked' => 1,
                'required' => 1,
                'width' => 'half',
                'note' => 'Default item count in API and App responses',
                'sort' => 11
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'sort_null_last',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'note' => 'NULL values are sorted last',
                'width' => 'half',
                'sort' => 12
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'security_divider',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'divider',
                'options' => json_encode([
                    'style' => 'large',
                    'title' => 'Security',
                    'hr' => true
                ]),
                'locked' => 1,
                'hidden_browse' => 1,
                'width' => 'full',
                'sort' => 20
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'auto_sign_out',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'timer'
                ]),
                'locked' => 1,
                'required' => 1,
                'width' => 'half',
                'note' => 'Minutes before idle users are signed out',
                'sort' => 22
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'login_attempts_allowed',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'lock'
                ]),
                'locked' => 1,
                'width' => 'half',
                'note' => 'Failed login attempts before suspending users',
                'sort' => 23
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'password_policy',
                'type' => 'string',
                'note' => 'Weak: Minimum length 8; Strong: 1 small-case letter, 1 capital letter, 1 digit, 1 special character and the length should be minimum 8',
                'interface' => 'dropdown',
                'options' => json_encode([
                    'choices' => [
                        '' => 'None',
                        '/^.{8,}$/' => 'Weak',
                        '/(?=^.{8,}$)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{\';\'?>.<,])(?!.*\s).*$/' => 'Strong'
                    ]
                ]),
                'sort' => 24,
                'locked' => 1,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'files_divider',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'divider',
                'options' => json_encode([
                    'style' => 'large',
                    'title' => 'Files & Thumbnails',
                    'hr' => true
                ]),
                'locked' => 1,
                'hidden_browse' => 1,
                'width' => 'full',
                'sort' => 30
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'file_naming',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'locked' => 1,
                'width' => 'half',
                'note' => 'File-system naming convention for uploads',
                'sort' => 31,
                'options' => json_encode([
                    'choices' => [
                        'uuid' => 'UUID (Obfuscated)',
                        'file_name' => 'File Name (Readable)'
                    ]
                ])
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'file_mimetype_whitelist',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'options' => json_encode([
                    'placeholder' => 'Enter a file mimetype then hit enter (eg: image/jpeg)'
                ]),
                'locked' => 1,
                'width' => 'full',
                'sort' => 33
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'asset_whitelist',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'repeater',
                'width' => 'full',
                'note' => 'Defines how the thumbnail will be generated based on the requested params.',
                'sort' => 34,
                'options' => json_encode([
                    'template' => '{{key}}',
                    'fields' => [
                        [
                            'field' => 'key',
                            'interface' => 'slug',
                            'width' => 'half',
                            'type' => 'string',
                            'required' => true
                        ],
                        [
                            'field' => 'fit',
                            'interface' => 'dropdown',
                            'width' => 'half',
                            'type' => 'string',
                            'options' => [
                                'choices' => [
                                    'crop' => 'Crop (forces exact size)',
                                    'contain' => 'Contain (preserve aspect ratio)'
                                ]
                            ],
                            'required' => true
                        ],
                        [
                            'field' => 'width',
                            'interface' => 'numeric',
                            'width' => 'half',
                            'type' => 'integer',
                            'required' => true
                        ],
                        [
                            'field' => 'height',
                            'interface' => 'numeric',
                            'width' => 'half',
                            'type' => 'integer',
                            'required' => true
                        ],
                        [
                            'field' => 'quality',
                            'interface' => 'slider',
                            'width' => 'full',
                            'type' => 'integer',
                            'default' => 80,
                            'options' => [
                                'min' => 0,
                                'max' => 100,
                                'step' => 1
                            ],
                            'required' => true
                        ]
                    ]
                ])
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'asset_whitelist_system',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'readonly' => 1,
                'width' => 'half',
                'hidden_browse' => 1,
                'hidden_detail' => 1,
                'sort' => 35
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'youtube_api_key',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'videocam'
                ]),
                'locked' => 1,
                'width' => 'full',
                'note' => 'Allows fetching more YouTube Embed info',
                'sort' => 36
            ],

            // ---------------------------------------------------------------------
            // directus_users
            [
                'collection' => 'directus_users',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1,
                'sort' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'status',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STATUS,
                'interface' => 'status',
                'options' => json_encode([
                    'status_mapping' => [
                        'draft' => [
                            'name' => 'Draft',
                            'text_color' => 'white',
                            'background_color' => 'light-gray',
                            'listing_subdued' => false,
                            'listing_badge' => true,
                            'soft_delete' => false,
                        ],
                        'invited' => [
                            'name' => 'Invited',
                            'text_color' => 'white',
                            'background_color' => 'light-gray',
                            'listing_subdued' => false,
                            'listing_badge' => true,
                            'soft_delete' => false,
                        ],
                        'active' => [
                            'name' => 'Active',
                            'text_color' => 'white',
                            'background_color' => 'success',
                            'listing_subdued' => false,
                            'listing_badge' => false,
                            'soft_delete' => false,
                        ],
                        'suspended' => [
                            'name' => 'Suspended',
                            'text_color' => 'white',
                            'background_color' => 'light-gray',
                            'listing_subdued' => false,
                            'listing_badge' => true,
                            'soft_delete' => false,
                        ],
                        'deleted' => [
                            'name' => 'Deleted',
                            'text_color' => 'white',
                            'background_color' => 'danger',
                            'listing_subdued' => false,
                            'listing_badge' => true,
                            'soft_delete' => true,
                        ]
                    ]
                ]),
                'locked' => 1,
                'sort' => 2,
                'required' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'first_name',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'account_circle'
                ]),
                'locked' => 1,
                'required' => 1,
                'sort' => 3,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'last_name',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'account_circle'
                ]),
                'locked' => 1,
                'required' => 1,
                'sort' => 4,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'email',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'alternate_email'
                ]),
                'locked' => 1,
                'validation' => '$email',
                'required' => 1,
                'sort' => 5,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'email_notifications',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'sort' => 6,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'password',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_HASH,
                'interface' => 'password',
                'locked' => 1,
                'required' => 1,
                'sort' => 7,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'role',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'user-roles',
                'locked' => 1,
                'sort' => 8,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'company',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'location_city'
                ]),
                'sort' => 9,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'title',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'text_fields'
                ]),
                'sort' => 10,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'timezone',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'options' => json_encode([
                    'choices' => [
                        'Pacific/Midway' => '(UTC-11:00) Midway Island',
                        'Pacific/Samoa' => '(UTC-11:00) Samoa',
                        'Pacific/Honolulu' => '(UTC-10:00) Hawaii',
                        'US/Alaska' => '(UTC-09:00) Alaska',
                        'America/Los_Angeles' => '(UTC-08:00) Pacific Time (US & Canada)',
                        'America/Tijuana' => '(UTC-08:00) Tijuana',
                        'US/Arizona' => '(UTC-07:00) Arizona',
                        'America/Chihuahua' => '(UTC-07:00) Chihuahua',
                        'America/Mexico/La_Paz' => '(UTC-07:00) La Paz',
                        'America/Mazatlan' => '(UTC-07:00) Mazatlan',
                        'US/Mountain' => '(UTC-07:00) Mountain Time (US & Canada)',
                        'America/Managua' => '(UTC-06:00) Central America',
                        'US/Central' => '(UTC-06:00) Central Time (US & Canada)',
                        'America/Guadalajara' => '(UTC-06:00) Guadalajara',
                        'America/Mexico_City' => '(UTC-06:00) Mexico City',
                        'America/Monterrey' => '(UTC-06:00) Monterrey',
                        'Canada/Saskatchewan' => '(UTC-06:00) Saskatchewan',
                        'America/Bogota' => '(UTC-05:00) Bogota',
                        'US/Eastern' => '(UTC-05:00) Eastern Time (US & Canada)',
                        'US/East-Indiana' => '(UTC-05:00) Indiana (East)',
                        'America/Lima' => '(UTC-05:00) Lima',
                        'America/Quito' => '(UTC-05:00) Quito',
                        'Canada/Atlantic' => '(UTC-04:00) Atlantic Time (Canada)',
                        'America/New_York' => '(UTC-04:00) New York',
                        'America/Caracas' => '(UTC-04:30) Caracas',
                        'America/La_Paz' => '(UTC-04:00) La Paz',
                        'America/Santiago' => '(UTC-04:00) Santiago',
                        'America/Santo_Domingo' => '(UTC-04:00) Santo Domingo',
                        'Canada/Newfoundland' => '(UTC-03:30) Newfoundland',
                        'America/Sao_Paulo' => '(UTC-03:00) Brasilia',
                        'America/Argentina/Buenos_Aires' => '(UTC-03:00) Buenos Aires',
                        'America/Argentina/GeorgeTown' => '(UTC-03:00) Georgetown',
                        'America/Godthab' => '(UTC-03:00) Greenland',
                        'America/Noronha' => '(UTC-02:00) Mid-Atlantic',
                        'Atlantic/Azores' => '(UTC-01:00) Azores',
                        'Atlantic/Cape_Verde' => '(UTC-01:00) Cape Verde Is.',
                        'Africa/Casablanca' => '(UTC+00:00) Casablanca',
                        'Europe/Edinburgh' => '(UTC+00:00) Edinburgh',
                        'Etc/Greenwich' => '(UTC+00:00) Greenwich Mean Time : Dublin',
                        'Europe/Lisbon' => '(UTC+00:00) Lisbon',
                        'Europe/London' => '(UTC+00:00) London',
                        'Africa/Monrovia' => '(UTC+00:00) Monrovia',
                        'UTC' => '(UTC+00:00) UTC',
                        'Europe/Amsterdam' => '(UTC+01:00) Amsterdam',
                        'Europe/Belgrade' => '(UTC+01:00) Belgrade',
                        'Europe/Berlin' => '(UTC+01:00) Berlin',
                        'Europe/Bern' => '(UTC+01:00) Bern',
                        'Europe/Bratislava' => '(UTC+01:00) Bratislava',
                        'Europe/Brussels' => '(UTC+01:00) Brussels',
                        'Europe/Budapest' => '(UTC+01:00) Budapest',
                        'Europe/Copenhagen' => '(UTC+01:00) Copenhagen',
                        'Europe/Ljubljana' => '(UTC+01:00) Ljubljana',
                        'Europe/Madrid' => '(UTC+01:00) Madrid',
                        'Europe/Paris' => '(UTC+01:00) Paris',
                        'Europe/Prague' => '(UTC+01:00) Prague',
                        'Europe/Rome' => '(UTC+01:00) Rome',
                        'Europe/Sarajevo' => '(UTC+01:00) Sarajevo',
                        'Europe/Skopje' => '(UTC+01:00) Skopje',
                        'Europe/Stockholm' => '(UTC+01:00) Stockholm',
                        'Europe/Vienna' => '(UTC+01:00) Vienna',
                        'Europe/Warsaw' => '(UTC+01:00) Warsaw',
                        'Africa/Lagos' => '(UTC+01:00) West Central Africa',
                        'Europe/Zagreb' => '(UTC+01:00) Zagreb',
                        'Europe/Athens' => '(UTC+02:00) Athens',
                        'Europe/Bucharest' => '(UTC+02:00) Bucharest',
                        'Africa/Cairo' => '(UTC+02:00) Cairo',
                        'Africa/Harare' => '(UTC+02:00) Harare',
                        'Europe/Helsinki' => '(UTC+02:00) Helsinki',
                        'Europe/Istanbul' => '(UTC+02:00) Istanbul',
                        'Asia/Jerusalem' => '(UTC+02:00) Jerusalem',
                        'Europe/Kyiv' => '(UTC+02:00) Kyiv',
                        'Africa/Johannesburg' => '(UTC+02:00) Pretoria',
                        'Europe/Riga' => '(UTC+02:00) Riga',
                        'Europe/Sofia' => '(UTC+02:00) Sofia',
                        'Europe/Tallinn' => '(UTC+02:00) Tallinn',
                        'Europe/Vilnius' => '(UTC+02:00) Vilnius',
                        'Asia/Baghdad' => '(UTC+03:00) Baghdad',
                        'Asia/Kuwait' => '(UTC+03:00) Kuwait',
                        'Europe/Minsk' => '(UTC+03:00) Minsk',
                        'Africa/Nairobi' => '(UTC+03:00) Nairobi',
                        'Asia/Riyadh' => '(UTC+03:00) Riyadh',
                        'Europe/Volgograd' => '(UTC+03:00) Volgograd',
                        'Asia/Tehran' => '(UTC+03:30) Tehran',
                        'Asia/Abu_Dhabi' => '(UTC+04:00) Abu Dhabi',
                        'Asia/Baku' => '(UTC+04:00) Baku',
                        'Europe/Moscow' => '(UTC+04:00) Moscow',
                        'Asia/Muscat' => '(UTC+04:00) Muscat',
                        'Europe/St_Petersburg' => '(UTC+04:00) St. Petersburg',
                        'Asia/Tbilisi' => '(UTC+04:00) Tbilisi',
                        'Asia/Yerevan' => '(UTC+04:00) Yerevan',
                        'Asia/Kabul' => '(UTC+04:30) Kabul',
                        'Asia/Islamabad' => '(UTC+05:00) Islamabad',
                        'Asia/Karachi' => '(UTC+05:00) Karachi',
                        'Asia/Tashkent' => '(UTC+05:00) Tashkent',
                        'Asia/Calcutta' => '(UTC+05:30) Chennai',
                        'Asia/Kolkata' => '(UTC+05:30) Kolkata',
                        'Asia/Mumbai' => '(UTC+05:30) Mumbai',
                        'Asia/New_Delhi' => '(UTC+05:30) New Delhi',
                        'Asia/Sri_Jayawardenepura' => '(UTC+05:30) Sri Jayawardenepura',
                        'Asia/Katmandu' => '(UTC+05:45) Kathmandu',
                        'Asia/Almaty' => '(UTC+06:00) Almaty',
                        'Asia/Astana' => '(UTC+06:00) Astana',
                        'Asia/Dhaka' => '(UTC+06:00) Dhaka',
                        'Asia/Yekaterinburg' => '(UTC+06:00) Ekaterinburg',
                        'Asia/Rangoon' => '(UTC+06:30) Rangoon',
                        'Asia/Bangkok' => '(UTC+07:00) Bangkok',
                        'Asia/Hanoi' => '(UTC+07:00) Hanoi',
                        'Asia/Jakarta' => '(UTC+07:00) Jakarta',
                        'Asia/Novosibirsk' => '(UTC+07:00) Novosibirsk',
                        'Asia/Beijing' => '(UTC+08:00) Beijing',
                        'Asia/Chongqing' => '(UTC+08:00) Chongqing',
                        'Asia/Hong_Kong' => '(UTC+08:00) Hong Kong',
                        'Asia/Krasnoyarsk' => '(UTC+08:00) Krasnoyarsk',
                        'Asia/Kuala_Lumpur' => '(UTC+08:00) Kuala Lumpur',
                        'Australia/Perth' => '(UTC+08:00) Perth',
                        'Asia/Singapore' => '(UTC+08:00) Singapore',
                        'Asia/Taipei' => '(UTC+08:00) Taipei',
                        'Asia/Ulan_Bator' => '(UTC+08:00) Ulaan Bataar',
                        'Asia/Urumqi' => '(UTC+08:00) Urumqi',
                        'Asia/Irkutsk' => '(UTC+09:00) Irkutsk',
                        'Asia/Osaka' => '(UTC+09:00) Osaka',
                        'Asia/Sapporo' => '(UTC+09:00) Sapporo',
                        'Asia/Seoul' => '(UTC+09:00) Seoul',
                        'Asia/Tokyo' => '(UTC+09:00) Tokyo',
                        'Australia/Adelaide' => '(UTC+09:30) Adelaide',
                        'Australia/Darwin' => '(UTC+09:30) Darwin',
                        'Australia/Brisbane' => '(UTC+10:00) Brisbane',
                        'Australia/Canberra' => '(UTC+10:00) Canberra',
                        'Pacific/Guam' => '(UTC+10:00) Guam',
                        'Australia/Hobart' => '(UTC+10:00) Hobart',
                        'Australia/Melbourne' => '(UTC+10:00) Melbourne',
                        'Pacific/Port_Moresby' => '(UTC+10:00) Port Moresby',
                        'Australia/Sydney' => '(UTC+10:00) Sydney',
                        'Asia/Yakutsk' => '(UTC+10:00) Yakutsk',
                        'Asia/Vladivostok' => '(UTC+11:00) Vladivostok',
                        'Pacific/Auckland' => '(UTC+12:00) Auckland',
                        'Pacific/Fiji' => '(UTC+12:00) Fiji',
                        'Pacific/Kwajalein' => '(UTC+12:00) International Date Line West',
                        'Asia/Kamchatka' => '(UTC+12:00) Kamchatka',
                        'Asia/Magadan' => '(UTC+12:00) Magadan',
                        'Pacific/Marshall_Is' => '(UTC+12:00) Marshall Is.',
                        'Asia/New_Caledonia' => '(UTC+12:00) New Caledonia',
                        'Asia/Solomon_Is' => '(UTC+12:00) Solomon Is.',
                        'Pacific/Wellington' => '(UTC+12:00) Wellington',
                        'Pacific/Tongatapu' => '(UTC+13:00) Nuku\'alofa'
                    ],
                    'placeholder' => 'Choose a timezone...'
                ]),
                'locked' => 1,
                'sort' => 11,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'locale',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'language',
                'options' => json_encode([
                    'limit' => true
                ]),
                'locked' => 1,
                'sort' => 12,
                'width' => 'half',
                'required' => 0
            ],
            [
                'collection' => 'directus_users',
                'field' => 'avatar',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'sort' => 13
            ],
            [
                'collection' => 'directus_users',
                'field' => 'theme',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'radio-buttons',
                'options' => json_encode([
                    'format' => true,
                    'choices' => [
                        'auto' => 'Auto',
                        'light' => 'Light',
                        'dark' => 'Dark'
                    ]
                ]),
                'locked' => 1,
                'readonly' => 0,
                'sort' => 14
            ],
            [
                'collection' => 'directus_users',
                'field' => '2fa_secret',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => '2fa-secret',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 15
            ],
            [
                'collection' => 'directus_users',
                'field' => 'locale_options',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1,
                'hidden_browse' => 1,
                'hidden_detail' => 1,
                'sort' => 16
            ],
            [
                'collection' => 'directus_users',
                'field' => 'token',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1,
                'sort' => 17
            ],
            [
                'collection' => 'directus_users',
                'field' => 'last_access_on',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'sort' => 18
            ],
            [
                'collection' => 'directus_users',
                'field' => 'last_page',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1,
                'sort' => 19
            ],
            [
                'collection' => 'directus_users',
                'field' => 'external_id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 20
            ],

            // ---------------------------------------------------------------------
            // directus_user_sessions
            [
                'collection' => 'directus_user_sessions',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_user_sessions',
                'field' => 'user',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_USER,
                'required' => 1,
                'interface' => 'user'
            ],
            [
                'collection' => 'directus_user_sessions',
                'field' => 'token_type',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input'
            ],
            [
                'collection' => 'directus_user_sessions',
                'field' => 'token',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input'
            ],
            [
                'collection' => 'directus_user_sessions',
                'field' => 'ip_address',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input'
            ],
            [
                'collection' => 'directus_user_sessions',
                'field' => 'user_agent',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input'
            ],
            [
                'collection' => 'directus_user_sessions',
                'field' => 'created_on',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime'
            ],
            [
                'collection' => 'directus_user_sessions',
                'field' => 'token_expired_at',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime'
            ],

            // ---------------------------------------------------------------------
            // directus_webhooks
            [
                'collection' => 'directus_webhooks',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_webhooks',
                'field' => 'status',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STATUS,
                'interface' => 'status',
                'options' => json_encode([
                    'status_mapping' => [
                        'active' => [
                            'name' => 'Active',
                            'value' => 'active',
                            'text_color' => 'white',
                            'background_color' => 'green',
                            'browse_subdued' => false,
                            'browse_badge' => true,
                            'soft_delete' => false,
                            'published' => true,
                        ],
                        'inactive' => [
                            'name' => 'Inactive',
                            'value' => 'inactive',
                            'text_color' => 'white',
                            'background_color' => 'blue-grey',
                            'browse_subdued' => true,
                            'browse_badge' => true,
                            'soft_delete' => false,
                            'published' => false,
                        ]
                    ]
                ]),
                'locked' => 1,
                'width' => 'full',
                'sort' => 1
            ],
            [
                'collection' => 'directus_webhooks',
                'field' => 'http_action',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'required' => 1,
                'options' => json_encode([
                    'choices' => [
                        'get' => 'GET',
                        'post' => 'POST'
                    ]
                ]),
                'locked' => 1,
                'width' => 'half-space',
                'sort' => 2
            ],
            [
                'collection' => 'directus_webhooks',
                'field' => 'url',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'placeholder' => 'https://example.com',
                    'iconRight' => 'link'
                ]),
                'required' => 1,
                'locked' => 1,
                'width' => 'full',
                'note' => '',
                'sort' => 3
            ],
            [
                'collection' => 'directus_webhooks',
                'field' => 'collection',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'collections',
                'required' => 1,
                'locked' => 1,
                'width' => 'half',
                'note' => '',
                'sort' => 4
            ],
            [
                'collection' => 'directus_webhooks',
                'field' => 'directus_action',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'required' => 1,
                'options' => json_encode([
                    'choices' => [
                        'item.create:after' => 'Create',
                        'item.update:after' => 'Update',
                        'item.delete:after' => 'Delete',
                    ]
                ]),
                'locked' => 1,
                'width' => 'half',
                'note' => '',
                'sort' => 5
            ],
            [
                'collection' => 'directus_webhooks',
                'field' => 'info',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'divider',
                'options' => json_encode([
                    'style' => 'medium',
                    'title' => 'How Webhooks Work',
                    'hr' => true,
                    'margin' => false,
                    'description' => 'When the selected action occurs for the selected collection, Directus will send an HTTP request to the above URL.'
                ]),
                'locked' => 1,
                'width' => 'full',
                'hidden_browse' => 1,
                'sort' => 6
            ],
        ];

        // -------------------------------------------------------------------------
        // Add the data to the table
        // -------------------------------------------------------------------------
        $fieldsTable->insert($data);

        // -------------------------------------------------------------------------
        // Save changes to table
        // -------------------------------------------------------------------------
        $fieldsTable->save();
    }
}
