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
                'width' => 2
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'item',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 3,
                'width' => 2
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'action_by',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'user',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 4,
                'width' => 2
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
                'width' => 2
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
                'width' => 2
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
                'width' => 2
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'ip',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 8,
                'width' => 2
            ],
            [
                'collection' => 'directus_activity',
                'field' => 'user_agent',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 9,
                'width' => 2
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
                'interface' => 'code',
                'locked' => 1
            ],
            [
                'collection' => 'directus_collection_presets',
                'field' => 'view_options',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'code',
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
                'interface' => 'code',
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
                'width' => 2
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'note',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'sort' => 3,
                'width' => 2
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'managed',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'toggle',
                'locked' => 1,
                'sort' => 4,
                'width' => 1
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'hidden',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'toggle',
                'locked' => 1,
                'sort' => 5,
                'width' => 1
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'single',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'toggle',
                'locked' => 1,
                'sort' => 6,
                'width' => 1
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'translation',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'code',
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
                'sort' => 8
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
                'interface' => 'code',
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
                'interface' => 'code',
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
                'width' => 2
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
                'width' => 2
            ],
            [
                'collection' => 'directus_files',
                'field' => 'tags',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'sort' => 5,
                'width' => 2
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
                'width' => 2
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
                'sort' => 8,
                'width' => 1
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
                'sort' => 9,
                'width' => 1
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
                'sort' => 10,
                'width' => 1
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
                'sort' => 11,
                'width' => 1
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
                'sort' => 12,
                'width' => 2
            ],
            [
                'collection' => 'directus_files',
                'field' => 'uploaded_by',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'user',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 13,
                'width' => 2
            ],
            [
                'collection' => 'directus_files',
                'field' => 'metadata',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'code',
                'locked' => 1,
                'sort' => 14,
                'width' => 4
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
                'interface' => 'code',
                'locked' => 1
            ],
            [
                'collection' => 'directus_revisions',
                'field' => 'delta',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'code',
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
                'width' => 2
            ],
            [
                'collection' => 'directus_roles',
                'field' => 'description',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'sort' => 2,
                'width' => 2
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


            // Settings
            // -----------------------------------------------------------------
            [
                'collection' => 'directus_settings',
                'field' => 'auto_sign_out',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'locked' => 1
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'logo',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'single_file',
                'locked' => 1
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'color',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'color-palette',
                'locked' => 1
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
                'width' => 2
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
                'width' => 2
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
                'required' => 1,
                'sort' => 5,
                'width' => 2
            ],
            [
                'collection' => 'directus_users',
                'field' => 'email_notifications',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'toggle',
                'locked' => 1,
                'sort' => 6,
                'width' => 2
            ],
            [
                'collection' => 'directus_users',
                'field' => 'password',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'password',
                'locked' => 1,
                'required' => 1,
                'sort' => 7
            ],
            [
                'collection' => 'directus_users',
                'field' => 'company',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'placeholder' => 'Enter your company or organization name...'
                ]),
                'sort' => 8,
                'width' => 2
            ],
            [
                'collection' => 'directus_users',
                'field' => 'title',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'placeholder' => 'Enter your title or role...'
                ]),
                'sort' => 9,
                'width' => 2
            ],
            [
                'collection' => 'directus_users',
                'field' => 'timezone',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'options' => json_encode([
                    'choices' => [
                        'America/Puerto_Rico' => 'Puerto Rico (Atlantic)',
                        'America/New_York' => 'New York (Eastern)',
                        'America/Chicago' => 'Chicago (Central)',
                        'America/Denver' => 'Denver (Mountain)',
                        'America/Phoenix' => 'Phoenix (MST)',
                        'America/Los_Angeles' => 'Los Angeles (Pacific)',
                        'America/Anchorage' => 'Anchorage (Alaska)',
                        'Pacific/Honolulu' => 'Honolulu (Hawaii)'
                    ],
                    'placeholder' => 'Choose a timezone...'
                ]),
                'locked' => 1,
                'sort' => 10,
                'width' => 2
            ],
            [
                'collection' => 'directus_users',
                'field' => 'locale',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'options' => json_encode([
                    'choices' => [
                        'en-US' => 'English (US)',
                        'nl-NL' => 'Dutch (Nederlands)',
                        'de-DE' => 'German (Deutsche)'
                    ],
                    'placeholder' => 'Choose a language...'
                ]),
                'locked' => 1,
                'sort' => 11,
                'width' => 2
            ],
            [
                'collection' => 'directus_users',
                'field' => 'locale_options',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'code',
                'locked' => 1,
                'hidden_browse' => 1,
                'hidden_detail' => 1,
                'sort' => 12
            ],
            [
                'collection' => 'directus_users',
                'field' => 'token',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1,
                'sort' => 13
            ],
            [
                'collection' => 'directus_users',
                'field' => 'last_login',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 14,
                'width' => 2
            ],
            [
                'collection' => 'directus_users',
                'field' => 'last_access_on',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'sort' => 15,
                'width' => 2
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
                'sort' => 16,
                'width' => 2
            ],
            [
                'collection' => 'directus_users',
                'field' => 'avatar',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'sort' => 17
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
                'field' => 'roles',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_O2M,
                'interface' => 'user-roles',
                'locked' => 1
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
                'field' => 'user_id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ],
            [
                'collection' => 'directus_user_roles',
                'field' => 'role_id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1
            ]
        ];

        $files = $this->table('directus_fields');
        $files->insert($data)->save();
    }
}
