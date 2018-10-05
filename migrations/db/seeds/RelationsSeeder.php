<?php

use Phinx\Seed\AbstractSeed;

class RelationsSeeder extends AbstractSeed
{
    /**
     * Run Method.
     *
     * Write your database seeder using this method.
     *
     * More information on writing seeders is available here:
     * http://docs.phinx.org/en/latest/seeding.html
     */
    public function run()
    {
        $data = [
            [
                'collection_many' => 'directus_activity',
                'field_many' => 'action_by',
                'collection_one' => 'directus_users'
            ],
            [
                'collection_many' => 'directus_activity_seen',
                'field_many' => 'user',
                'collection_one' => 'directus_users'
            ],
            [
                'collection_many' => 'directus_activity_seen',
                'field_many' => 'activity',
                'collection_one' => 'directus_activity'
            ],
            [
                'collection_many' => 'directus_collections_presets',
                'field_many' => 'user',
                'collection_one' => 'directus_users'
            ],
            [
                'collection_many' => 'directus_collections_presets',
                'field_many' => 'group',
                'collection_one' => 'directus_groups'
            ],
            [
                'collection_many' => 'directus_files',
                'field_many' => 'uploaded_by',
                'collection_one' => 'directus_users'
            ],
            [
                'collection_many' => 'directus_files',
                'field_many' => 'folder',
                'collection_one' => 'directus_folders'
            ],
            [
                'collection_many' => 'directus_folders',
                'field_many' => 'parent_folder',
                'collection_one' => 'directus_folders'
            ],
            [
                'collection_many' => 'directus_permissions',
                'field_many' => 'group',
                'collection_one' => 'directus_groups'
            ],
            [
                'collection_many' => 'directus_revisions',
                'field_many' => 'activity',
                'collection_one' => 'directus_activity'
            ],
            [
                'collection_many' => 'directus_user_roles',
                'field_many' => 'user',
                'collection_one' => 'directus_users',
                'field_one' => 'roles',
                'junction_field' => 'role',
            ],
            [
                'collection_many' => 'directus_user_roles',
                'field_many' => 'role',
                'collection_one' => 'directus_roles',
                'field_one' => 'users',
                'junction_field' => 'user',
            ],
            [
                'collection_many' => 'directus_users',
                'field_many' => 'avatar',
                'collection_one' => 'directus_files'
            ],
            [
                'collection_many' => 'directus_fields',
                'field_many' => 'collection',
                'collection_one' => 'directus_collections',
                'field_one' => 'fields'
            ]
        ];

        $files = $this->table('directus_relations');
        $files->insert($data)->save();
    }
}
