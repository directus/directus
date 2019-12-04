<?php

use Phinx\Migration\AbstractMigration;

class UseJson extends AbstractMigration
{
    public function up()
    {
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_activity', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_activity_seen', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_collection_presets', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_collections', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_fields', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_files', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_folders', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_migrations', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_permissions', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_relations', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_revisions', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_roles', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_settings', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_user_roles', 'interface' => 'code']
        ));

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'interface' => 'json'
            ],
            ['collection' => 'directus_users', 'interface' => 'code']
        ));
    }
}
