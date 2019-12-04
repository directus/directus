<?php

use Phinx\Migration\AbstractMigration;

// -------------------------------------------------------------------------
// NOTE:
//
// This is a one-of meant to ensure that everybody is on the same fresh
// datastructure when upgrading to or install v8. There have been quite a
// lot of migrations in v7 that may or may not have caused the database to be
// out of sync with fresh installations.
// -------------------------------------------------------------------------

class ResetDirectusRelations extends AbstractMigration
{
  public function change() {
    $relationsTable = $this->table('directus_relations');

    // -------------------------------------------------------------------------
    // Delete all system relations from directus_relations
    // This will not delete rows that were added by the user
    // -------------------------------------------------------------------------
    $this->execute('DELETE FROM directus_relations WHERE collection_many LIKE "directus\_%" AND collection_one LIKE "directus\_%"');

    // -------------------------------------------------------------------------
    // Add v8.0.0 data
    // -------------------------------------------------------------------------
    $data = [
        [
            'collection_many' => 'directus_activity',
            'field_many' => 'action_by',
            'collection_one' => 'directus_users'
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
            'collection_many' => 'directus_fields',
            'field_many' => 'collection',
            'collection_one' => 'directus_collections',
            'field_one' => 'fields'
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
            'collection_many' => 'directus_users',
            'field_many' => 'role',
            'collection_one' => 'directus_roles',
            'field_one' => 'users'
        ],
        [
            'collection_many' => 'directus_users',
            'field_many' => 'avatar',
            'collection_one' => 'directus_files'
        ]
    ];

    // -------------------------------------------------------------------------
    // Add the data to the table
    // -------------------------------------------------------------------------
    $relationsTable->insert($data);

    // -------------------------------------------------------------------------
    // Save changes to table
    // -------------------------------------------------------------------------
    $relationsTable->save();
  }
}
