<?php

use Phinx\Migration\AbstractMigration;

class CreateSettingsTable extends AbstractMigration
{
    /**
     * Create Settings Table
     */
    public function change()
    {
        $table = $this->table('directus_settings', ['signed' => false]);

        $table->addColumn('key', 'string', [
            'limit' => 64,
            'null' => false
        ]);

        $table->addColumn('value', 'text', [
            'default' => null,
            'null' => true
        ]);

        $table->addIndex(['key'], [
            'unique' => true,
            'name' => 'idx_key'
        ]);

        $table->create();

        $data = [
            [
                'collection' => 'directus_settings',
                'field' => 'project_name',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'title'
                ]),
                'locked' => 1,
                'required' => 1,
                'width' => 'half',
                'note' => 'Logo in the top-left of the App (40x40)',
                'sort' => 1
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_url',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'link'
                ]),
                'locked' => 1,
                'width' => 'half',
                'note' => 'External link for the App\'s top-left logo',
                'sort' => 2
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_logo',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'width' => 'half',
                'note' => 'A 40x40 brand logo, ideally a white SVG/PNG',
                'sort' => 3
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_color',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'color',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Color for login background and App\'s logo',
                'sort' => 4
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_foreground',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Centered image (eg: logo) for the login page',
                'sort' => 5
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_background',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
                'interface' => 'file',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Full-screen background for the login page',
                'sort' => 6
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'project_public_note',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'markdown',
                'locked' => 1,
                'width' => 'full',
                'note' => 'This value will be shown on the public pages of the app',
                'sort' => 7
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'default_locale',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'language',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Default locale for Directus Users',
                'sort' => 8,
                'options' => json_encode([
                    'limit' => true
                ])
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'telemetry',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'width' => 'half',
                'note' => '<a href="https://docs.directus.io/getting-started/concepts.html#telemetry" target="_blank">Learn More</a>',
                'sort' => 9
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'data_divider',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'divider',
                'options' => json_encode([
                    'style' => 'large',
                    'title' => 'Data',
                    'hr' => true
                ]),
                'locked' => 1,
                'width' => 'full',
                'hidden_browse' => 1,
                'sort' => 11
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'default_limit',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'keyboard_tab'
                ]),
                'locked' => 1,
                'required' => 1,
                'width' => 'half',
                'note' => 'Default item count in API and App responses',
                'sort' => 12
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'sort_null_last',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_BOOLEAN,
                'interface' => 'switch',
                'locked' => 1,
                'note' => 'NULL values are sorted last',
                'width' => 'half',
                'sort' => 13
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'security_divider',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'divider',
                'options' => json_encode([
                    'style' => 'large',
                    'title' => 'Security',
                    'hr' => true
                ]),
                'locked' => 1,
                'hidden_browse' => 1,
                'width' => 'full',
                'sort' => 20
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'auto_sign_out',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'timer'
                ]),
                'locked' => 1,
                'required' => 1,
                'width' => 'half',
                'note' => 'Minutes before idle users are signed out',
                'sort' => 22
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'login_attempts_allowed',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_INTEGER,
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'lock'
                ]),
                'locked' => 1,
                'width' => 'half',
                'note' => 'Failed login attempts before suspending users',
                'sort' => 23
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'password_policy',
                'type' => 'string',
                'note' => 'Weak: Minimum length 8; Strong: 1 small-case letter, 1 capital letter, 1 digit, 1 special character and the length should be minimum 8',
                'interface' => 'dropdown',
                'options' => json_encode([
                    'choices' => [
                        '' => 'None',
                        '/^.{8,}$/' => 'Weak',
                        '/(?=^.{8,}$)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{\';\'?>.<,])(?!.*\s).*$/' => 'Strong'
                    ]
                ]),
                'sort' => 24,
                'locked' => 1,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'auth_token_ttl',
                'type' => 'integer',
                'note' => 'Minutes the API authorization token will last',
                'interface' => 'numeric',
                'options' => json_encode([
                    'iconRight' => 'timer'
                ]),
                'sort' => 25,
                'locked' => 1,
                'width' => 'half'
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'files_divider',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ALIAS,
                'interface' => 'divider',
                'options' => json_encode([
                    'style' => 'large',
                    'title' => 'Files & Thumbnails',
                    'hr' => true
                ]),
                'locked' => 1,
                'hidden_browse' => 1,
                'width' => 'full',
                'sort' => 30
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'file_naming',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'locked' => 1,
                'width' => 'half',
                'note' => 'File-system naming convention for uploads',
                'sort' => 31,
                'options' => json_encode([
                    'choices' => [
                        'uuid' => 'UUID (Obfuscated)',
                        'file_name' => 'File Name (Readable)'
                    ]
                ])
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'asset_url_naming',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'dropdown',
                'locked' => 1,
                'width' => 'half',
                'note' => 'Thumbnail URL convention',
                'sort' => 32,
                'options' => json_encode([
                    'choices' => [
                        'private_hash' => 'Private Hash (Obfuscated)',
                        'filename_download' => 'File Name (Readable)'
                    ]
                ])
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'file_mimetype_whitelist',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_ARRAY,
                'interface' => 'tags',
                'options' => json_encode([
                    'placeholder' => 'Enter a file mimetype then hit enter (eg: image/jpeg)'
                ]),
                'note' => 'Enter a file mimetype then hit enter (eg: image/jpeg)',
                'locked' => 1,
                'width' => 'half',
                'sort' => 33
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'asset_whitelist',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'repeater',
                'width' => 'full',
                'note' => 'Defines how the thumbnail will be generated based on the requested params.',
                'sort' => 34,
                'options' => json_encode([
                    'template' => '{{key}}',
                    'fields' => [
                        [
                            'field' => 'key',
                            'interface' => 'slug',
                            'width' => 'half',
                            'type' => 'string',
                            'required' => true,
                            'options' => [
                                'onlyOnCreate' => false
                            ]
                        ],
                        [
                            'field' => 'fit',
                            'interface' => 'dropdown',
                            'width' => 'half',
                            'type' => 'string',
                            'options' => [
                                'choices' => [
                                    'crop' => 'Crop (forces exact size)',
                                    'contain' => 'Contain (preserve aspect ratio)'
                                ]
                            ],
                            'required' => true
                        ],
                        [
                            'field' => 'width',
                            'interface' => 'numeric',
                            'width' => 'half',
                            'type' => 'integer',
                            'required' => true
                        ],
                        [
                            'field' => 'height',
                            'interface' => 'numeric',
                            'width' => 'half',
                            'type' => 'integer',
                            'required' => true
                        ],
                        [
                            'field' => 'quality',
                            'interface' => 'slider',
                            'width' => 'full',
                            'type' => 'integer',
                            'default' => 80,
                            'options' => [
                                'min' => 0,
                                'max' => 100,
                                'step' => 1
                            ],
                            'required' => true
                        ]
                    ]
                ])
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'asset_whitelist_system',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_JSON,
                'interface' => 'json',
                'readonly' => 1,
                'width' => 'half',
                'hidden_browse' => 1,
                'hidden_detail' => 1,
                'sort' => 35
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'youtube_api_key',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'interface' => 'text-input',
                'options' => json_encode([
                    'iconRight' => 'videocam'
                ]),
                'locked' => 1,
                'width' => 'full',
                'note' => 'Allows fetching more YouTube Embed info',
                'sort' => 36
            ],
        ];

        foreach ($data as $value) {
            if (!$this->checkFieldExist($value['collection'], $value['field'])) {
                $fileds = $this->table('directus_fields');
                $fileds->insert($value)->save();
            }
        }

        // Insert into settings table
        $data = [
            [
                'key' => 'project_url',
                'value' => ''
            ],
            [
                'key' => 'project_logo',
                'value' => ''
            ],
            [
                'key' => 'project_color',
                'value' => '#263238',
            ],
            [
                'key' => 'project_foreground',
                'value' => '',
            ],
            [
                'key' => 'project_background',
                'value' => '',
            ],
            [
                'key' => 'project_public_note',
                'value' => '',
            ],
            [
                'key' => 'default_locale',
                'value' => NULL,
            ],
            [
                'key' => 'telemetry',
                'value' => '1',
            ],
            [
                'key' => 'default_limit',
                'value' => '200'
            ],
            [
                'key' => 'sort_null_last',
                'value' => '1'
            ],
            [
                'key' => 'password_policy',
                'value' => ''
            ],
            [
                'key' => 'auto_sign_out',
                'value' => '10080'
            ],
            [
                'key' => 'login_attempts_allowed',
                'value' => '25'
            ],
            [
                'key' => 'auth_token_ttl',
                'value' => '20'
            ],
            [
                'key' => 'trusted_proxies',
                'value' => ''
            ],
            [
                'key' => 'file_mimetype_whitelist',
                'value' => ''
            ],
            [
                'key' => 'file_naming',
                'value' => 'uuid'
            ],
            [
                'key' => 'asset_url_naming',
                'value' => 'private_hash'
            ],
            [
                'key' => 'youtube_api_key',
                'value' => ''
            ],
            [
                'key' => 'asset_whitelist',
                'value' => json_encode([
                    [
                        "key" => "thumbnail",
                        "width" => 200,
                        "height" => 200,
                        "fit" => "contain",
                        "quality" => 80
                    ]
                ])
            ],
            [
                'key' => 'asset_whitelist_system',
                'value' => json_encode([
                    [
                        'key' => 'directus-small-crop',
                        'width' => 64,
                        'height' => 64,
                        'fit' => 'crop',
                        'quality' => 80
                    ],
                    [
                        'key' => 'directus-small-contain',
                        'width' => 64,
                        'height' => 64,
                        'fit' => 'contain',
                        'quality' => 80
                    ],
                    [
                        'key' => 'directus-medium-crop',
                        'width' => 300,
                        'height' => 300,
                        'fit' => 'crop',
                        'quality' => 80
                    ],
                    [
                        'key' => 'directus-medium-contain',
                        'width' => 300,
                        'height' => 300,
                        'fit' => 'contain',
                        'quality' => 80
                    ],
                    [
                        'key' => 'directus-large-crop',
                        'width' => 800,
                        'height' => 600,
                        'fit' => 'crop',
                        'quality' => 80
                    ],
                    [
                        'key' => 'directus-large-contain',
                        'width' => 800,
                        'height' => 600,
                        'fit' => 'contain',
                        'quality' => 80
                    ]
                ])
            ]
        ];

        $groups = $this->table('directus_settings');
        $groups->insert($data)->save();
    }

    public function checkFieldExist($collection, $field)
    {
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        return $this->query($checkSql)->fetch();
    }
}
