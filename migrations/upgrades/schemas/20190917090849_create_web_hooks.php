
<?php


use Phinx\Migration\AbstractMigration;

class CreateWebHooks extends AbstractMigration
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
        $table = $this->table('directus_webhooks', ['signed' => false]);

        $table->addColumn('status', 'string', [
            'limit' => 16,
            'default' => \Directus\Api\Routes\Webhook::STATUS_INACTIVE
        ]);

        $table->addColumn('collection', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('directus_action', 'string', [
            'limit' => 255,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('url', 'string', [
            'limit' => 510,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('http_action', 'string', [
            'limit' => 255,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);



        $table->create();

        // Insert Into Directus Fields
        $data = [
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
                        'published' => [
                            'name' => 'Published',
                            'value' => 'published',
                            'text_color' => 'white',
                            'background_color' => 'accent',
                            'browse_subdued' => false,
                            'browse_badge' => true,
                            'soft_delete' => false,
                            'published' => true,
                        ],
                        'draft' => [
                            'name' => 'Draft',
                            'value' => 'draft',
                            'text_color' => 'white',
                            'background_color' => 'blue-grey-100',
                            'browse_subdued' => true,
                            'browse_badge' => true,
                            'soft_delete' => false,
                            'published' => false,
                        ],
                        'deleted' => [
                            'name' => 'Deleted',
                            'value' => 'deleted',
                            'text_color' => 'white',
                            'background_color' => 'red',
                            'browse_subdued' => true,
                            'browse_badge' => true,
                            'soft_delete' => true,
                            'published' => false,
                        ]
                    ]
                ]),
                'required' => 1
            ],
            [
                'collection' => 'directus_webhooks',
                'field' => 'http_action',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'required' => 1,
                'options' => json_encode([
                    'choices' => [
                        'get' => 'Get',
                        'post' => 'Post'
                    ]
                ])
            ],
            [
                'collection' => 'directus_webhooks',
                'field' => 'collection',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'collections',
                'required' => 1
            ],
            [
                'collection' => 'directus_webhooks',
                'field' => 'directus_action',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'required' => 1,
                'options' => json_encode([
                    'choices' => [
                        'item.create:before' => 'item.create:before',
                        'item.create:after' => 'item.create:after',
                        'item.update:before' => 'item.update:before',
                        'item.update:after' => 'item.update:after',
                        'item.delete:before' => 'item.delete:before',
                        'item.delete:after' => 'item.delete:after',
                    ]
                ])
            ],
            [
                'collection' => 'directus_webhooks',
                'field' => 'url',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'required' => 1
            ]

        ];

        foreach($data as $value){
            if(!$this->checkFieldExist($value['collection'], $value['field'])){
                $insertSqlFormat = "INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`, `hidden_detail`, `required`, `locked`, `options`) VALUES ('%s', '%s', '%s', '%s', '%s', '%s','%s' , '%s');";

                $insertSql = sprintf($insertSqlFormat,$value['collection'], $value['field'], $value['type'], $value['interface'], isset($value['hidden_detail']) ? $value['hidden_detail'] : 0, $value['required'], isset($value['locked']) ? $value['locked'] : 0, isset($value['options']) ? $value['options'] : null);
                $this->execute($insertSql);
            }
        }
    }

    public function checkFieldExist($collection,$field){
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }
}
