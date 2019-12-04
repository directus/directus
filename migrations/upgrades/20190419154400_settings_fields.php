<?php

use Phinx\Migration\AbstractMigration;

class SettingsFields extends AbstractMigration
{
    public function up()
    {
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half-space',
              'note' => 'The URL where your app is hosted. The API will use this to direct your users to the correct login page.',
              'sort' => 4
            ],
            ['collection' => 'directus_settings', 'field' => 'app_url']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half',
              'note' => 'How many minutes before an idle user is signed out.',
              'sort' => 7
            ],
            ['collection' => 'directus_settings', 'field' => 'auto_sign_out']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half',
              'note' => 'How many minutes before an idle user is signed out.',
              'sort' => 2
            ],
            ['collection' => 'directus_settings', 'field' => 'color']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half',
              'note' => 'How many minutes before an idle user is signed out.',
              'sort' => 5
            ],
            ['collection' => 'directus_settings', 'field' => 'default_limit']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half',
              'note' => 'Your brand\'s logo.',
              'sort' => 3
            ],
            ['collection' => 'directus_settings', 'field' => 'logo']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half-space',
              'sort' => 1
            ],
            ['collection' => 'directus_settings', 'field' => 'project_name']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half-space',
              'note' => 'Put items with `null` for the value last when sorting.',
              'sort' => 6
            ],
            ['collection' => 'directus_settings', 'field' => 'sort_null_last']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half',
              'note' => 'Defines how the thumbnail will be generated based on the requested dimensions.',
              'sort' => 11
            ],
            ['collection' => 'directus_settings', 'field' => 'thumbnail_actions']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half',
              'note' => '`max-age` HTTP header of the thumbnail.',
              'sort' => 12
            ],
            ['collection' => 'directus_settings', 'field' => 'thumbnail_cache_ttl']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'full',
              'note' => 'Allowed dimensions for thumbnails.',
              'sort' => 9
            ],
            ['collection' => 'directus_settings', 'field' => 'thumbnail_dimensions']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half',
              'note' => 'This image will be used when trying to generate a thumbnail with invalid options or an error happens on the server when creating the image.',
              'sort' => 13
            ],
            ['collection' => 'directus_settings', 'field' => 'thumbnail_not_found_location']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half',
              'note' => 'Allowed quality for thumbnails.',
              'sort' => 10
            ],
            ['collection' => 'directus_settings', 'field' => 'thumbnail_quality_tags']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half',
              'note' => 'When provided, this allows more information to be collected for YouTube embeds.',
              'sort' => 8
            ],
            ['collection' => 'directus_settings', 'field' => 'youtube_api']
        ));
    }
}
