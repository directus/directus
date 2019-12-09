<?php

use Phinx\Migration\AbstractMigration;

class AddProjectPublicNote extends AbstractMigration
{
  public function change() {
    // -------------------------------------------------------------------------
    // Add project_public_note settings
    // -------------------------------------------------------------------------
    $fieldsTable = $this->table('directus_fields');
    $settingsTable = $this->table('directus_settings');

    $exists = $this->fetchRow('SELECT `key` FROM directus_settings WHERE `key` = "project_public_note";');

    if ($exists !== false) return;

    $settingsTable->insert([
        'key' => 'project_public_note',
        'value' => ''
    ]);

    $fieldsTable->insert([
        'collection' => 'directus_settings',
        'field' => 'project_public_note',
        'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
        'interface' => 'markdown',
        'locked' => 1,
        'width' => 'full',
        'note' => 'This value will be shown on the public pages of the app',
        'sort' => 7
    ]);

    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        [
          'sort' => 8
        ],
        ['collection' => 'directus_settings', 'field' => 'default_locale']
    ));

    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        [
          'sort' => 9
        ],
        ['collection' => 'directus_settings', 'field' => 'telemetry']
    ));

    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        [
          'sort' => 10
        ],
        ['collection' => 'directus_settings', 'field' => 'data_divider']
    ));

    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        [
          'sort' => 11
        ],
        ['collection' => 'directus_settings', 'field' => 'default_limit']
    ));

    $this->execute(\Directus\phinx_update(
        $this->getAdapter(),
        'directus_fields',
        [
          'sort' => 12
        ],
        ['collection' => 'directus_settings', 'field' => 'sort_null_last']
    ));

    $fieldsTable->save();
    $settingsTable->save();
  }
}
