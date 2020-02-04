<?php

use Phinx\Migration\AbstractMigration;

class CreateCollectionsTable extends AbstractMigration
{
    /**
     * Create Collections Table
     */
    public function change()
    {
        $table = $this->table('directus_collections', [
            'id' => false,
            'primary_key' => 'collection'
        ]);

        $table->addColumn('collection', 'string', [
            'limit' => 64,
            'null' => false
        ]);
        $table->addColumn('managed', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => true
        ]);
        $table->addColumn('hidden', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => false
        ]);
        $table->addColumn('single', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => false
        ]);
        $table->addColumn('icon', 'string', [
            'limit' => 30,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('note', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('translation', 'text', [
            'null' => true,
            'default' => null
        ]);

        $table->create();
        $data = [
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
                'width' => 'half'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'note',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'sort' => 3,
                'width' => 'half',
                'note' => 'An internal description.'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'managed',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'sort' => 4,
                'width' => 'half',
                'hidden_detail' => 1,
                'note' => '[Learn More](https://docs.directus.io/guides/collections.html#managing-collections).'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'hidden',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'sort' => 5,
                'width' => 'half',
                'note' => '[Learn More](https://docs.directus.io/guides/collections.html#hidden).'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'single',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'sort' => 6,
                'width' => 'half',
                'note' => '[Learn More](https://docs.directus.io/guides/collections.html#single).'
            ],
            [
                'collection' => 'directus_collections',
                'field' => 'translation',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'repeater',
                'locked' => 1,
                'sort' => 7,
                'hidden_detail' => 0,
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
                'collection' => 'directus_collections',
                'field' => 'icon',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'icon',
                'locked' => 1,
                'sort' => 8,
                'note' => 'The icon shown in the App\'s navigation sidebar.'
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
