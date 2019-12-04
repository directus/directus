<?php

use Phinx\Migration\AbstractMigration;

class CreateRelationsTable extends AbstractMigration
{
    /**
     * Create Relations Table
     */
    public function change()
    {
        $table = $this->table('directus_relations', ['signed' => false]);

        $table->addColumn('collection_many', 'string', [
            'limit' => 64,
            'null' => false
        ]);
        $table->addColumn('field_many', 'string', [
            'limit' => 45,
            'null' => false
        ]);
        $table->addColumn('collection_one', 'string', [
            'limit' => 64,
            'null' => true
        ]);
        $table->addColumn('field_one', 'string', [
            'limit' => 64,
            'null' => true
        ]);
        $table->addColumn('junction_field', 'string', [
            'limit' => 64,
            'null' => true
        ]);

        $table->create();

        $data = [
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
        ];

        foreach($data as $value){
            if(!$this->checkFieldExist($value['collection'], $value['field'])){
                $fileds = $this->table('directus_fields');
                $fileds->insert($value)->save();
            }
        }

        //Insert into relations table
        $relationsData = [
            [
                'collection_many' => 'directus_activity',
                'field_many' => 'action_by',
                'collection_one' => 'directus_users'
            ],
            [
                'collection_many' => 'directus_collections_presets',
                'field_many' => 'user',
                'collection_one' => 'directus_users'
            ],
            [
                'collection_many' => 'directus_collections_presets',
                'field_many' => 'group',
                'collection_one' => 'directus_groups'
            ],
            [
                'collection_many' => 'directus_fields',
                'field_many' => 'collection',
                'collection_one' => 'directus_collections',
                'field_one' => 'fields'
            ],
            [
                'collection_many' => 'directus_files',
                'field_many' => 'uploaded_by',
                'collection_one' => 'directus_users'
            ],
            [
                'collection_many' => 'directus_files',
                'field_many' => 'folder',
                'collection_one' => 'directus_folders'
            ],
            [
                'collection_many' => 'directus_folders',
                'field_many' => 'parent_folder',
                'collection_one' => 'directus_folders'
            ],
            [
                'collection_many' => 'directus_permissions',
                'field_many' => 'group',
                'collection_one' => 'directus_groups'
            ],
            [
                'collection_many' => 'directus_revisions',
                'field_many' => 'activity',
                'collection_one' => 'directus_activity'
            ],
            [
                'collection_many' => 'directus_users',
                'field_many' => 'role',
                'collection_one' => 'directus_roles',
                'field_one' => 'users'
            ],
            [
                'collection_many' => 'directus_users',
                'field_many' => 'avatar',
                'collection_one' => 'directus_files'
            ]
        ];

        $files = $this->table('directus_relations');
        $files->insert($relationsData)->save();
    }

    public function checkFieldExist($collection,$field){
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }
}
