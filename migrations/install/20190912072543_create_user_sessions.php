<?php


use Phinx\Migration\AbstractMigration;

class CreateUserSessions extends AbstractMigration
{
    /**
     * Create User Sessions Table
     */
    public function change()
    {
        $table = $this->table('directus_user_sessions', ['signed' => false]);

        $table->addColumn('user', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('token_type', 'string', [
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('token', 'string', [
            'limit' => 520,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('ip_address', 'string', [
            'limit' => 255,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('user_agent', 'text', [
            'default' => null,
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('created_on', 'datetime', [
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('token_expired_at', 'datetime', [
            'null' => true,
            'default' => null
        ]);

        $table->create();

        $data = [
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
