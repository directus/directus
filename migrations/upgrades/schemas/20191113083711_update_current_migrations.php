<?php


use Phinx\Migration\AbstractMigration;

class UpdateCurrentMigrations extends AbstractMigration
{
    public function change()
    {
        $config = \Directus\Application\Application::getInstance()->getContainer()->get('config');
        $dbName = $config->get('database.name');
        
        
        // Fields Table
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'options' => json_encode([
                    'iconRight' => 'change_history'
                ]),
                'width' => 'full'
            ],
            ['collection' => 'directus_activity', 'field' => 'action']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'options' => json_encode([
                    'iconRight' => 'list_alt'
                ])
            ],
            ['collection' => 'directus_activity', 'field' => 'collection']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'options' => json_encode([
                    'iconRight' => 'link'
                ])
            ],
            ['collection' => 'directus_activity', 'field' => 'item']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'options' => json_encode([
                    'iconRight' => 'account_circle'
                ])
            ],
            ['collection' => 'directus_activity', 'field' => 'action_by']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'options' => json_encode([
                    'showRelative' => true,
                    'iconRight' => 'calendar_today'
                ])
            ],
            ['collection' => 'directus_activity', 'field' => 'action_on']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'options' => json_encode([
                    'showRelative' => true,
                    'iconRight' => 'edit'
                ])
            ],
            ['collection' => 'directus_activity', 'field' => 'edited_on']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'options' => json_encode([
                    'showRelative' => true,
                    'iconRight' => 'delete_outline'
                ])
            ],
            ['collection' => 'directus_activity', 'field' => 'comment_deleted_on']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'options' => json_encode([
                    'iconRight' => 'my_location'
                ])
            ],
            ['collection' => 'directus_activity', 'field' => 'ip']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'options' => json_encode([
                    'iconRight' => 'devices_other'
                ]),
                'width' => 'full'
            ],
            ['collection' => 'directus_activity', 'field' => 'user_agent']
        ));
        

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'placeholder' => 'Enter a keyword then hit enter...'
                ]),
            ],
            ['collection' => 'directus_files', 'field' => 'tags']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'toolbar' => ['bold','italic','underline','link','code']
                ]),
            ],
            ['collection' => 'directus_files', 'field' => 'description']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'width' => 'full'
            ],
            ['collection' => 'directus_files', 'field' => 'metadata']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'iconRight' => 'title'
                ]),
                'width' => 'half',
                'note' => 'Logo in the top-left of the App (40x40)',
            ],
            ['collection' => 'directus_settings', 'field' => 'project_name']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'note' => 'A 40x40 brand logo, ideally a white SVG/PNG',
            ],
            ['collection' => 'directus_settings', 'field' => 'project_logo']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'iconRight' => 'keyboard_tab'
                ]),
                'note' => 'Default item count in API and App responses',
                'sort' => 11
            ],
            ['collection' => 'directus_settings', 'field' => 'default_limit']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'note' => 'NULL values are sorted last',
            ],
            ['collection' => 'directus_settings', 'field' => 'sort_null_last']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'iconRight' => 'timer'
                ]),
                'note' => 'Minutes before idle users are signed out',
                'sort' => 22
            ],
            ['collection' => 'directus_settings', 'field' => 'auto_sign_out']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'placeholder' => 'Allowed dimensions for thumbnails (eg: 200x200)'
                ]),
                'width' => 'full',
                'sort' => 34
            ],
            ['collection' => 'directus_settings', 'field' => 'thumbnail_dimensions']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'note' => 'Allowed qualities for thumbnails',
                'sort' => 35
            ],
            ['collection' => 'directus_settings', 'field' => 'thumbnail_quality_tags']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'note' => 'Defines how the thumbnail will be generated based on the requested dimensions',
                'sort' => 36
            ],
            ['collection' => 'directus_settings', 'field' => 'thumbnail_actions']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'iconRight' => 'broken_image'                    
                ]),
                'locked' => 1,
                'width' => 'full',
                'note' => 'A fallback image used when thumbnail generation fails',
                'sort' => 37
            ],
            ['collection' => 'directus_settings', 'field' => 'thumbnail_not_found_location']
        ));
        
        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_settings" and `field` = "thumbnail_cache_ttl";')->fetch();
        
        if ($result) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'options' => json_encode([
                        'iconRight' => 'cached'
                    ]),
                    'required' => 1,
                    'note' => 'Seconds before browsers re-fetch thumbnails',
                    'sort' => 38
                ],
                ['collection' => 'directus_settings', 'field' => 'thumbnail_cache_ttl']
            ));
        }
        
        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_settings" and `field` = "youtube_api";')->fetch();
        
        if ($result) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'options' => json_encode([
                        'iconRight' => 'videocam'
                    ]),
                    'width' => 'half',
                    'note' => 'Allows fetching more YouTube Embed info',
                    'sort' => 39
                ],
                ['collection' => 'directus_settings', 'field' => 'youtube_api']
            ));
        }

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'required' => 0
            ],
            ['collection' => 'directus_users', 'field' => 'locale']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'iconRight' => 'account_circle'           
                ]),
            ],
            ['collection' => 'directus_users', 'field' => 'first_name']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'iconRight' => 'account_circle'           
                ]),
            ],
            ['collection' => 'directus_users', 'field' => 'last_name']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'iconRight' => 'alternate_email'           
                ]),
            ],
            ['collection' => 'directus_users', 'field' => 'email']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'iconRight' => 'location_city'           
                ]),
            ],
            ['collection' => 'directus_users', 'field' => 'company']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'iconRight' => 'text_fields'           
                ]),
            ],
            ['collection' => 'directus_users', 'field' => 'title']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'sort' => 15
            ],
            ['collection' => 'directus_users', 'field' => 'locale_options']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'sort' => 16
            ],
            ['collection' => 'directus_users', 'field' => 'token']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'sort' => 17
            ],
            ['collection' => 'directus_users', 'field' => 'last_access_on']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'sort' => 18
            ],
            ['collection' => 'directus_users', 'field' => 'last_page']
        ));


        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_users" and `field` = "last_login";')->fetch();
        
        if ($result) {
            $this->execute('DELETE FROM `directus_fields` where `collection` = "directus_users" and  `field` = "last_login";');
        }
        
        $result = $this->query('SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = "'.$dbName.'" AND TABLE_NAME = "directus_users" AND COLUMN_NAME = "last_login"')->fetch();
        
        if ($result) {
            $this->execute('ALTER TABLE `directus_users` DROP last_login;');
        }

        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_users" and `field` = "invite_token";')->fetch();

        if ($result) {
            $this->execute('DELETE FROM `directus_fields` where `collection` = "directus_users" and  `field` = "invite_token";');
        }

        $result = $this->query('SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = "'.$dbName.'" AND TABLE_NAME = "directus_users" AND COLUMN_NAME = "invite_token"')->fetch();
        
        if ($result) {
            $this->execute('ALTER TABLE `directus_users` DROP invite_token;');
        }


        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_users" and `field` = "invite_accepted";')->fetch();

        if ($result) {
            $this->execute('DELETE FROM `directus_fields` where `collection` = "directus_users" and  `field` = "invite_accepted";');
        }

        $result = $this->query('SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = "'.$dbName.'" AND TABLE_NAME = "directus_users" AND COLUMN_NAME = "invite_accepted"')->fetch();
        
        if ($result) {
            $this->execute('ALTER TABLE `directus_users` DROP invite_accepted;');
        }


        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_users" and `field` = "last_ip";')->fetch();

        if ($result) {
            $this->execute('DELETE FROM `directus_fields` where `collection` = "directus_users" and  `field` = "last_ip";');
        }
        
        $result = $this->query('SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = "'.$dbName.'" AND TABLE_NAME = "directus_users" AND COLUMN_NAME = "last_ip"')->fetch();
        
        if ($result) {
            $this->execute('ALTER TABLE `directus_users` DROP last_ip;');
        }

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'limit' => true
                ]),
                'width' => 'half',
                'note' => 'Default locale for Directus Users',
                'sort' => 7
            ],
            ['collection' => 'directus_settings', 'field' => 'default_locale']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'hidden_browse' => 1,
            ],
            ['collection' => 'directus_settings', 'field' => 'data_divider']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'hidden_browse' => 1,
            ],
            ['collection' => 'directus_settings', 'field' => 'security_divider']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'hidden_browse' => 1,
            ],
            ['collection' => 'directus_settings', 'field' => 'files_divider']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'hidden_browse' => 1,
            ],
            ['collection' => 'directus_webhooks', 'field' => 'info']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'width' => 'half',
                'note' => '<a href="https://docs.directus.io/getting-started/concepts.html#telemetry" target="_blank">Learn More</a>',
                'sort' => 8
            ],
            ['collection' => 'directus_settings', 'field' => 'telemetry']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'locked' => 1,
                'width' => 'full',
                'sort' => 1
            ],
            ['collection' => 'directus_webhooks', 'field' => 'status']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'locked' => 1,
                'width' => 'half-space',
                'sort' => 2
            ],
            ['collection' => 'directus_webhooks', 'field' => 'http_action']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'placeholder' => 'https://example.com',
                    'iconRight' => 'link'
                ]),
                'locked' => 1,
                'width' => 'full',
                'note' => '',
                'sort' => 3
            ],
            ['collection' => 'directus_webhooks', 'field' => 'url']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'interface' => 'collections',
                'locked' => 1,
                'width' => 'half',
                'note' => '',
                'sort' => 4
            ],
            ['collection' => 'directus_webhooks', 'field' => 'collection']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'locked' => 1,
                'width' => 'half',
                'note' => '',
                'sort' => 5
            ],
            ['collection' => 'directus_webhooks', 'field' => 'directus_action']
        ));

        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_webhooks" and `field` = "info";')->fetch();
        
        if (!$result) {
            $options =  json_encode([
                'style' => 'medium',
                'title' => 'How Webhooks Work',
                'hr' => true,
                'margin' => false,
                'description' => 'When the selected action occurs for the selected collection, Directus will send an HTTP request to the above URL.'
            ]);
            
            $this->execute("INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`,`options`, `locked`, `width`, `sort`) VALUES ('directus_webhooks', 'info', '".\Directus\Database\Schema\DataTypes::TYPE_ALIAS."', 'divider', '".$options."', '1', 'full', '6');");
        }

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
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
            ],
            ['collection' => 'directus_webhooks', 'field' => 'status']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'choices' => [
                        'get' => 'GET',
                        'post' => 'POST'
                    ]
                ]),
            ],
            ['collection' => 'directus_webhooks', 'field' => 'http_action']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'options' => json_encode([
                    'choices' => [
                        'item.create:after' => 'Create',
                        'item.update:after' => 'Update',
                        'item.delete:after' => 'Delete',
                    ]
                ]),
            ],
            ['collection' => 'directus_webhooks', 'field' => 'directus_action']
        ));


        // Role table
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_roles',
            [
                'description' => 'Controls what API data is publicly available without authenticating'
            ],
            ['name' => 'public']
        ));

        // Settings Table
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_settings',
            [
                'value' => '10080'
            ],
            ['key' => 'auto_sign_out']
        ));
       

    }
}
