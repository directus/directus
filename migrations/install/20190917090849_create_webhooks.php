<?php


use Phinx\Migration\AbstractMigration;

class CreateWebHooks extends AbstractMigration
{
    /**
     * Create Webhooks Table
     */
    public function change()
    {
        $table = $this->table('directus_webhooks', ['signed' => false]);

        $table->addColumn('status', 'string', [
            'limit' => 16,
            'default' => \Directus\Api\Routes\Webhook::STATUS_INACTIVE
        ]);


        $table->addColumn('http_action', 'string', [
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

        $table->create();

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
