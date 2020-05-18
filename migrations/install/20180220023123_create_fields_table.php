<?php

use Phinx\Migration\AbstractMigration;

class CreateFieldsTable extends AbstractMigration
{
    /**
     * Create Fields Table
     */
    public function change()
    {
        $table = $this->table('directus_fields', ['signed' => false]);

        $table->addColumn('collection', 'string', [
            'limit' => 64,
            'null' => false
        ]);
        $table->addColumn('field', 'string', [
            'limit' => 64,
            'null' => false
        ]);
        $table->addColumn('type', 'string', [
            'limit' => 64,
            'null' => false
        ]);
        $table->addColumn('interface', 'string', [
            'limit' => 64,
            'null' => true,
            'default' => null,
        ]);
        $table->addColumn('options', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('locked', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => false
        ]);
        $table->addColumn('validation', 'string', [
            'limit' => 500,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('required', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => false
        ]);
        $table->addColumn('readonly', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => false
        ]);
        $table->addColumn('hidden_detail', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => 0
        ]);
        $table->addColumn('hidden_browse', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => 0
        ]);
        $table->addColumn('sort', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('width', 'string', [
            'limit' => 50,
            'null' => true,
            'default' => 'full'
        ]);
        $table->addColumn('group', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('note', 'string', [
            'limit' => 1024,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('translation', 'text', [
            'null' => true,
            'default' => null
        ]);

        $table->addIndex(['collection', 'field'], [
            'unique' => true,
            'name' => 'idx_collection_field'
        ]);

        $table->create();

        $data = [
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
                'interface' => 'switch',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'translation',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'repeater',
                'locked' => 1,
                'options' => '{
                    "fields": [
                        {
                            "field": "locale",
                            "type": "string",
                            "interface": "language",
                            "options": {
                                "limit": true
                            },
                            "width": "half"
                        },
                        {
                            "field": "translation",
                            "type": "string",
                            "interface": "text-input",
                            "width": "half"
                        }
                    ]
                }'
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'readonly',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
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
                'interface' => 'switch',
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
                'interface' => 'switch',
                'locked' => 1
            ],
            [
                'collection' => 'directus_fields',
                'field' => 'hidden_browse',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
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
            [
                'collection' => 'directus_fields',
                'field' => 'auth_token_ttl',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'locked' => 1
            ]
        ];

        foreach ($data as $value) {
            if (!$this->checkFieldExist($value['collection'], $value['field'])) {
                $fileds = $this->table('directus_fields');
                $fileds->insert($value)->save();
            }
        }
    }

    public function checkFieldExist($collection, $field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }
}
