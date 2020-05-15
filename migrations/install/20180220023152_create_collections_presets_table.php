<?php

use Phinx\Migration\AbstractMigration;

class CreateCollectionsPresetsTable extends AbstractMigration
{
    /**
     * Create Collection Presets Table
     */
    public function change()
    {
        $table = $this->table('directus_collection_presets', ['signed' => false]);

        $table->addColumn('title', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null,
            'encoding' => 'utf8mb4'
        ]);
        $table->addColumn('user', 'integer', [
            'signed' => false,
            'null' => true
        ]);
        $table->addColumn('role', 'integer', [
            'signed' => false,
            'null' => true
        ]);
        $table->addColumn('collection', 'string', [
            'limit' => 64,
            'null' => false
        ]);
        $table->addColumn('search_query', 'string', [
            'limit' => 100,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('filters', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('view_type', 'string', [
            'limit' => 100,
            'null' => false,
            'default' => 'tabular'
        ]);
        $table->addColumn('view_query', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('view_options', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('translation', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addIndex(['user', 'collection', 'title'], [
            'unique' => true,
            'name' => 'idx_user_collection_title'
        ]);

        $table->create();

        $data = [
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
        ];

        foreach($data as $value){
            if(!$this->checkFieldExist($value['collection'], $value['field'])){
                $fileds = $this->table('directus_fields');
                $fileds->insert($value)->save();
            }
        }

        $result = [
            [
                'collection' => 'directus_activity',
                'view_type' => 'timeline',
                'view_query' => json_encode([
                    'timeline' => [
                      'sort' => '-action_on'
                    ]
                ]),
                'view_options' => json_encode([
                    'timeline' => [
                        'date' => 'action_on',
                        'title' => '{{ action }} by {{ action_by.first_name }} {{ action_by.last_name }} (#{{ item }})',
                        'content' => 'collection',
                        'color' => 'action'
                    ]
                ])
            ],
            [
                'collection' => 'directus_files',
                'view_type' => 'cards',
                'view_options' => json_encode([
                    'cards' => [
                        'title' => 'title',
                        'subtitle' => 'type',
                        'content' => 'description',
                        'src' => 'data'
                    ]
                ])
            ],
            [
                'collection' => 'directus_users',
                'view_type' => 'cards',
                'view_options' => json_encode([
                    'cards' => [
                        'title' => 'first_name',
                        'subtitle' => 'last_name',
                        'content' => 'title',
                        'src' => 'avatar',
                        'icon' => 'person'
                    ]
                ])
            ],
            [
                'collection' => 'directus_webhooks',
                'view_type' => 'tabular',
                'view_query' => json_encode([
                    'tabular' => [
                      'fields' => 'status,http_action,url,collection,directus_action'
                    ]
                ]),
                'view_options' => json_encode([
                    'tabular' => [
                        'widths' => [
                            'status' => 32,
                            'http_action' => 72,
                            'url' => 200,
                            'collection' => 200,
                            'directus_action' => 200
                        ]
                    ]
                ])
            ]
        ];

        $files = $this->table('directus_collection_presets');
        $files->insert($result)->save();
    }

    public function checkFieldExist($collection,$field){
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }
}
