<?php


use Phinx\Migration\AbstractMigration;

class CreateUserSessions extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        $table = $this->table('directus_user_sessions', ['signed' => false]);

        $table->addColumn('user', 'integer', [
            'signed' => false,
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
        
        $table->create();

        // Insert Into Directus Fields
        $data = [
            // User Session
            // -----------------------------------------------------------------
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
                $insertSqlFormat = "INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`, `hidden_detail`, `required`, `locked`, `options`) VALUES ('%s', '%s', '%s', '%s', '%s', '%s','%s' , '%s');";
                $insertSql = sprintf($insertSqlFormat,$value['collection'], $value['field'], $value['type'], $value['interface'], isset($value['hidden_detail']) ? $value['hidden_detail'] : 0, isset($value['required']) ? $value['required'] : 0, isset($value['locked']) ? $value['locked'] : 0, isset($value['options']) ? $value['options'] : null);
                $this->execute($insertSql);
            }
        }
    }
    public function checkFieldExist($collection,$field){
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }

}
