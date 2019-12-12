<?php

use Phinx\Migration\AbstractMigration;

class AllowNullInSettings extends AbstractMigration
{
  public function change() {
    $settingsTable = $this->table('directus_settings');
    $settingsTable->changeColumn('value', 'text', [
        'null' => true
    ]);
    $settingsTable->save();
  }
}
