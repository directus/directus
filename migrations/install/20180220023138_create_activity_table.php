<?php

use Phinx\Migration\AbstractMigration;

class CreateActivityTable extends AbstractMigration
{
    /**
     * Create activity table
     */
    public function change()
    {
        $table = $this->table('directus_activity', ['signed' => false]);

        $table->addColumn('action', 'string', [
            'limit' => 45,
            'null' => false
        ]);

        $table->addColumn('action_by', 'integer', [
            'signed' => false,
            'null' => false,
            'default' => 0
        ]);

        $table->addColumn('action_on', 'datetime', [
            'default' => null
        ]);

        $table->addColumn('ip', 'string', [
            'limit' => 50,
            'default' => null
        ]);

        $table->addColumn('user_agent', 'string', [
            'limit' => 255
        ]);

        $table->addColumn('collection', 'string', [
            'limit' => 64,
            'null' => false
        ]);

        $table->addColumn('item', 'string',[
            'limit' => 255
        ]);

        $table->addColumn('edited_on', 'datetime', [
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('comment', 'text', [
            'null' => true,
            'encoding' => 'utf8mb4'
        ]);

        $table->addColumn('comment_deleted_on', 'datetime', [
            'null' => true,
            'default' => null
        ]);

        $table->create();

        $data = [
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
