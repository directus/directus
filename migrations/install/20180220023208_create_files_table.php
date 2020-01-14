<?php

use Phinx\Migration\AbstractMigration;

class CreateFilesTable extends AbstractMigration
{
    /**
     * Create Files Table
     */
    public function change()
    {
        $table = $this->table('directus_files', ['signed' => false]);

        $table->addColumn('storage', 'string', [
            'limit' => 50,
            'null' => false,
            'default' => 'local'
        ]);
        $table->addColumn('private_hash', 'string', [
            'limit' => 16,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('filename_disk', 'string', [
            'limit' => 255,
            'null' => false
        ]);
        $table->addColumn('filename_download', 'string', [
            'limit' => 255,
            'null' => false
        ]);
        $table->addColumn('title', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('type', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null // unknown type?
        ]);
        $table->addColumn('uploaded_by', 'integer', [
            'signed' => false,
            'null' => false
        ]);
        // TODO: Make directus set this value to whatever default is on the server (UTC)
        // In MySQL 5.5 and below doesn't support CURRENT TIMESTAMP on datetime as default
        $table->addColumn('uploaded_on', 'datetime', [
            'null' => false
        ]);
        $table->addColumn('charset', 'string', [
            'limit' => 50,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('filesize', 'integer', [
            'signed' => false,
            'default' => 0
        ]);
        $table->addColumn('width', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('height', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('duration', 'integer', [
            'signed' => true,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('embed', 'string', [
            'limit' => 200,
            'null' => true,
            'default' => NULL
        ]);
        $table->addColumn('folder', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('description', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('location', 'string', [
            'limit' => 200,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('tags', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('checksum', 'string', [
            'limit' => 32,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('metadata', 'text', [
            'null' => true,
            'default' => null
        ]);

        $table->create();

        $data = [
            [
                'collection' => 'directus_files',
                'field' => 'preview',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'file-preview',
                'locked' => 1,
                'sort' => 1,
                'width' => 'full'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'title',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'placeholder' => 'Enter a descriptive title...',
                    'iconRight' => 'title'
                ]),
                'locked' => 1,
                'sort' => 2,
                'width' => 'full'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'tags',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'options' => json_encode([
                    'placeholder' => 'Enter a keyword then hit enter...'
                ]),
                'sort' => 3,
                'width' => 'half',
                'locked' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'location',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'placeholder' => 'Enter a location...',
                    'iconRight' => 'place'
                ]),
                'sort' => 4,
                'width' => 'half',
                'locked' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'description',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'wysiwyg',
                'options' => json_encode([
                    'toolbar' => ['bold', 'italic', 'underline', 'link', 'code']
                ]),
                'sort' => 5,
                'width' => 'full',
                'locked' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'filename_download',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'options' => json_encode([
                    'monospace' => true,
                    'iconRight' => 'get_app'
                ]),
                'sort' => 6,
                'width' => 'full'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'filename_disk',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'placeholder' => 'Enter a unique file name...',
                    'iconRight' => 'insert_drive_file'
                ]),
                'locked' => 1,
                'sort' => 7,
                'width' => 'full'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'private_hash',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'slug',
                'width' => 'half',
                'locked' => 1,
                'sort' => 8,
                'options' => json_encode([
                    'iconRight' => 'lock'
                ])
            ],
            [
                'collection' => 'directus_files',
                'field' => 'checksum',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 9,
                'width' => 'half',
                'options' => json_encode([
                    'iconRight' => 'check',
                    'monospace' => true
                ])
            ],
            [
                'collection' => 'directus_files',
                'field' => 'uploaded_on',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_DATETIME,
                'interface' => 'datetime',
                'options' => json_encode([
                    'iconRight' => 'today'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 10,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'uploaded_by',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_OWNER,
                'interface' => 'owner',
                'locked' => 1,
                'readonly' => 1,
                'sort' => 11,
                'width' => 'half',
                'required' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'width',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'straighten'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 12,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'height',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'straighten'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 13,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'duration',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'timer'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 14,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'filesize',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'file-size',
                'options' => json_encode([
                    'iconRight' => 'storage'
                ]),
                'locked' => 1,
                'readonly' => 1,
                'sort' => 15,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_files',
                'field' => 'metadata',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'key-value',
                'locked' => 1,
                'sort' => 15,
                'width' => 'full',
                'options' => json_encode([
                    'keyInterface' => 'text-input',
                    'keyDataType' => 'string',
                    'keyOptions' => [
                        'monospace' => true,
                        'placeholder' => 'Key'
                    ],
                    'valueInterface' => 'text-input',
                    'valueDataType' => 'string',
                    'valueOptions' => [
                        'monospace' => true,
                        'placeholder' => 'Value'
                    ]
                ])
            ],
            [
                'collection' => 'directus_files',
                'field' => 'data',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'file',
                'locked' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'id',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'primary-key',
                'locked' => 1,
                'required' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'type',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'charset',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'embed',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'readonly' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'folder',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_M2O,
                'interface' => 'many-to-one',
                'locked' => 1,
                'hidden_detail' => 1
            ],
            [
                'collection' => 'directus_files',
                'field' => 'storage',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'locked' => 1,
                'hidden_detail' => 1,
                'hidden_browse' => 1
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
