<?php

use Phinx\Migration\AbstractMigration;

class CreatePermissionsTable extends AbstractMigration
{
    /**
     * Create Permissions Table
     */
    public function change()
    {
        $table = $this->table('directus_permissions', ['signed' => false]);

        $table->addColumn('collection', 'string', [
            'limit' => 64,
            'null' => false,
        ]);
        $table->addColumn('role', 'integer', [
            'signed' => false,
            'null' => false
        ]);
        $table->addColumn('status', 'string', [
            'length' => 64,
            'default' => null,
            'null' => true
        ]);
        $table->addColumn('create', 'string', [
            'signed' => false,
            'null' => true,
            'default' => 'none',
            'length' => 16,
        ]);
        $table->addColumn('read', 'string', [
            'signed' => false,
            'null' => true,
            'default' => 'none',
            'length' => 16,
        ]);
        $table->addColumn('update', 'string', [
            'signed' => false,
            'null' => true,
            'default' => 'none',
            'length' => 16,
        ]);
        $table->addColumn('delete', 'string', [
            'signed' => false,
            'null' => true,
            'default' => 'none',
            'length' => 16,
        ]);
        $table->addColumn('comment', 'string', [
            'limit' => 8,
            'null' => true,
            'default' => 'none'
        ]);
        $table->addColumn('explain', 'string', [
            'limit' => 8,
            'null' => true,
            'default' => 'none'
        ]);
        $table->addColumn('read_field_blacklist', 'string', [
            'limit' => 1000,
            'null' => true,
            'default' => null,
            'encoding' => 'utf8'
        ]);
        $table->addColumn('write_field_blacklist', 'string', [
            'limit' => 1000,
            'null' => true,
            'default' => NULL,
            'encoding' => 'utf8',
        ]);
        $table->addColumn('status_blacklist', 'string', [
            'length' => 1000,
            'default' => null,
            'null' => true
        ]);

        $table->create();
        $data = [
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

        ];

        foreach($data as $value){
            if(!$this->checkFieldExist($value['collection'], $value['field'])){
                $fileds = $this->table('directus_fields');
                $fileds->insert($value)->save();
            }
        }
    }

    public function checkFieldExist($collection,$field){
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }
}
