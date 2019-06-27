<?php

use Phinx\Seed\AbstractSeed;

class FieldsSeeder extends AbstractSeed
{
    /**
     * Run Method.
     *
     * Write your database seeder using this method.
     *
     * More information on writing seeders is available here:
     * http://docs.phinx.org/en/latest/seeding.html
     */
    public function run()
    {
        $data = [

            // Activity
            // -----------------------------------------------------------------
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
                'interface' => 'activity-icon',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 1
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'collection',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'collections',
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
                    'showRelative' => true
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
                    'showRelative' => true
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
                    'showRelative' => true
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
                'sort' => 10
            ],


            // Collection Presets
            // -----------------------------------------------------------------
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

            // Collections
            // -----------------------------------------------------------------
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
                'interface' => 'toggle',
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
                'interface' => 'toggle',
                'locked' => 1,
                'sort' => 5,
                'width' => 'half',
                'note' => '[Learn More](https://docs.directus.io/guides/collections.html#hidden).'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'single',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'toggle',
                'locked' => 1,
                'sort' => 6,
                'width' => 'half',
                'note' => '[Learn More](https://docs.directus.io/guides/collections.html#single).'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'translation',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1,
                'sort' => 7,
                'hidden_detail' => 1
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


            // Fields
            // -----------------------------------------------------------------
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
                'interface' => 'toggle',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'translation',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'readonly',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'toggle',
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
                'interface' => 'toggle',
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
                'interface' => 'toggle',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'hidden_browse',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'toggle',
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


            // Files
            // -----------------------------------------------------------------
            [
                'collection' => 'directus_files',
                'field' => 'data',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'file',
                'locked' => 1,
                'hidden_detail' => 1,
                'sort' => 0
            ],
            [
                'collection' => 'directus_files',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1,
                'sort' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'preview',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'file-preview',
                'locked' => 1,
                'sort' => 2
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
                'sort' => 3,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'filename',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'placeholder' => 'Enter a unique file name...',
                    'iconRight' => 'insert_drive_file'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 4,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'tags',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'sort' => 5,
                'width' => 'half'
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
                'sort' => 6,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'description',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'wysiwyg',
                'options' => json_encode([
                    'placeholder' => 'Enter a caption or description...'
                ]),
                'sort' => 7
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
                'sort' => 10,
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
                'sort' => 11,
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
                'sort' => 12,
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
                'sort' => 13,
                'width' => 'half'
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
                'sort' => 8,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'uploaded_by',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'user',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 9,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'metadata',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1,
                'sort' => 14
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
            [
                'collection' => 'directus_files',
                'field' => 'checksum',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1
            ],


            // Folders
            // -----------------------------------------------------------------
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


            // Permissions
            // -----------------------------------------------------------------
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


            // Relations
            // -----------------------------------------------------------------
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


            // Revisions
            // -----------------------------------------------------------------
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
                'interface' => 'toggle',
                'locked' => 1
            ],


            // Roles
            // -----------------------------------------------------------------
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
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'textarea',
                'locked' => 1
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'nav_blacklist',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'textarea',
                'locked' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'users',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_O2M,
                'interface' => 'many-to-many',
                'locked' => 1,
                'options' => json_encode([
                    'fields' => "first_name,last_name"
                ])
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'nav_override',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1,
                'options' => '[
                    {
                        "title": "$t:collections",
                        "include": "collections"
                    },
                    {
                        "title": "$t:bookmarks",
                        "include": "bookmarks"
                    },
                    {
                        "title": "$t:extensions",
                        "include": "extensions"
                    },
                    {
                        "title": "Custom Links",
                        "links": [
                            {
                                "name": "RANGER Studio",
                                "path": "https://rangerstudio.com",
                                "icon": "star"
                            },
                            {
                                "name": "Movies",
                                "path": "/collections/movies"
                            }
                        ]
                    }
                ]'
            ],

            // Settings
            // -----------------------------------------------------------------
            [
                'collection' => 'directus_settings',
                'field' => 'project_name',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'required' => 1,
                'width' => 'half-space',
                'sort' => 1
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'color',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'color-palette',
                'locked' => 1,
                'width' => 'half',
                'note' => 'The color that best fits your brand.',
                'sort' => 2
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'logo',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Your brand\'s logo.',
                'sort' => 3
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'app_url',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'required' => 1,
                'width' => 'half-space',
                'note' => 'The URL where your app is hosted. The API will use this to direct your users to the correct login page.',
                'sort' => 4
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'default_limit',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'locked' => 1,
                'required' => 1,
                'width' => 'half',
                'note' => 'Default max amount of items that\'s returned at a time in the API.',
                'sort' => 5
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'sort_null_last',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'toggle',
                'locked' => 1,
                'note' => 'Will sort values with null at the end of the result',
                'width' => 'half',
                'note' => 'Put items with `null` for the value last when sorting.',
                'sort' => 6
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'auto_sign_out',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'locked' => 1,
                'required' => 1,
                'width' => 'half',
                'note' => 'How many minutes before an idle user is signed out.',
                'sort' => 7
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'youtube_api',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'width' => 'half',
                'note' => 'When provided, this allows more information to be collected for YouTube embeds.',
                'sort' => 8
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'thumbnail_dimensions',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'locked' => 1,
                'note' => 'Allowed dimensions for thumbnails.',
                'sort' => 9
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'thumbnail_quality_tags',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Allowed quality for thumbnails.',
                'sort' => 10
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'thumbnail_actions',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Defines how the thumbnail will be generated based on the requested dimensions.',
                'sort' => 11
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'thumbnail_cache_ttl',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'locked' => 1,
                'width' => 'half',
                'required' => 1,
                'note' => '`max-age` HTTP header of the thumbnail.',
                'sort' => 12
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'thumbnail_not_found_location',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'width' => 'half',
                'note' => 'This image will be used when trying to generate a thumbnail with invalid options or an error happens on the server when creating the image.',
                'sort' => 13
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'file_naming',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'locked' => 1,
                'width' => 'full',
                'note' => 'The file-system naming convention for uploads.',
                'sort' => 14,
                'options' => json_encode([
                    'choices' => [
                        'uuid' => 'File Hash (Obfuscated)',
                        'file_name' => 'File Name (Readable)'
                    ]
                ])
            ],


            // Users
            // -----------------------------------------------------------------
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
                    'placeholder' => 'Enter your give name...'
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
                    'placeholder' => 'Enter your surname...'
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
                    'placeholder' => 'Enter your email address...'
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
                'interface' => 'toggle',
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
                'field' => 'roles',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_O2M,
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
                    'placeholder' => 'Enter your company or organization name...'
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
                    'placeholder' => 'Enter your title or role...'
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
                'required' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'locale_options',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'locked' => 1,
                'hidden_browse' => 1,
                'hidden_detail' => 1,
                'sort' => 13
            ],
            [
                'collection' => 'directus_users',
                'field' => 'token',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1,
                'sort' => 14
            ],
            [
                'collection' => 'directus_users',
                'field' => 'last_login',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 15,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'last_access_on',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'sort' => 16,
                'width' => 'half'
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
                'sort' => 17,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_users',
                'field' => 'avatar',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'sort' => 18
            ],
            [
                'collection' => 'directus_users',
                'field' => 'invite_token',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'invite_accepted',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'toggle',
                'locked' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'last_ip',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_users',
                'field' => 'external_id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1
            ],

            // User Roles Junction
            // -----------------------------------------------------------------
            [
                'collection' => 'directus_user_roles',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_user_roles',
                'field' => 'user',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],
            [
                'collection' => 'directus_user_roles',
                'field' => 'role',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ]
        ];

        $files = $this->table('directus_fields');
        $files->insert($data)->save();
    }
}
