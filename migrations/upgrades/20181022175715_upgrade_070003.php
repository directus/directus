<?php

use Phinx\Migration\AbstractMigration;

class Upgrade070003 extends AbstractMigration
{
    public function up()
    {
        // ----------------------------------------------------------------------------
        // Fix directus_users.timezone placeholder text
        // ----------------------------------------------------------------------------
        $options = json_encode([
            'choices' => [
                'America/Puerto_Rico' => 'Puerto Rico (Atlantic)',
                'America/New_York' => 'New York (Eastern)',
                'America/Chicago' => 'Chicago (Central)',
                'America/Denver' => 'Denver (Mountain)',
                'America/Phoenix' => 'Phoenix (MST)',
                'America/Los_Angeles' => 'Los Angeles (Pacific)',
                'America/Anchorage' => 'Anchorage (Alaska)',
                'Pacific/Honolulu' => 'Honolulu (Hawaii)'
            ],
            'placeholder' => 'Choose a timezone...'
        ]);

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            ['options' => $options],
            ['collection' => 'directus_users', 'field' => 'timezone']
        ));

        // ----------------------------------------------------------------------------
        // Update directus_users.roles interface from "many-to-many" to "user-roles"
        // Set directus_users.roles hidden_detail and hidden_browse attribute to "false"
        // Update directus_users.roles width to 2
        // Update directus_users.roes sort to 8
        // ----------------------------------------------------------------------------
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'interface' => 'user-roles',
                'hidden_detail' => 0,
                'hidden_browse' => 0,
                'width' => 2,
                'sort' => 8,
            ],
            [
                'collection' => 'directus_users',
                'field' => 'roles'
            ]
        ));

        // ----------------------------------------------------------------------------
        // Update directus_users.locale_options hidden_detail attribute to "true"
        // ----------------------------------------------------------------------------
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'hidden_detail' => 1,
            ],
            [
                'collection' => 'directus_users',
                'field' => 'locale_options'
            ]
        ));

        // ----------------------------------------------------------------------------
        // Update directus_settings "logo" interface from "single_file" to "file"
        // ----------------------------------------------------------------------------
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'interface' => 'file',
            ],
            [
                'collection' => 'directus_settings',
                'field' => 'logo'
            ]
        ));

        // ----------------------------------------------------------------------------
        // Update directus_user_roles user_id field to user in directus_fields
        // ----------------------------------------------------------------------------
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'field' => 'user',
            ],
            [
                'collection' => 'directus_user_roles',
                'field' => 'user_id'
            ]
        ));

        // ----------------------------------------------------------------------------
        // Update directus_user_roles role_id field to role in directus_fields
        // ----------------------------------------------------------------------------
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'field' => 'role',
            ],
            [
                'collection' => 'directus_user_roles',
                'field' => 'role_id'
            ]
        ));

        // ----------------------------------------------------------------------------
        // Update directus_users.password width attribute to 2
        // ----------------------------------------------------------------------------
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'width' => 2,
            ],
            [
                'collection' => 'directus_users',
                'field' => 'password'
            ]
        ));

        // ----------------------------------------------------------------------------
        // Update directus_users fields sort value
        // ----------------------------------------------------------------------------
        $fields = [
            'company' => 9,
            'title' => 10,
            'timezone' => 11,
            'locale' => 12,
            'locale_options' => 13,
            'token' => 14,
            'last_login' => 15,
            'last_access_on' => 16,
            'avatar' => 18,
        ];

        foreach ($fields as $field => $sort) {
            $this->execute(\Directus\phinx_update(
                $this->getAdapter(),
                'directus_fields',
                [
                    'sort' => $sort,
                ],
                [
                    'collection' => 'directus_users',
                    'field' => $field
                ]
            ));
        }
    }
}
