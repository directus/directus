<?php

use Phinx\Migration\AbstractMigration;

class UpdateDirectusUsers extends AbstractMigration
{
  public function change() {
    $usersTable = $this->table('directus_users');

    // -------------------------------------------------------------------------
    // Add theme column
    // -------------------------------------------------------------------------
    if ($usersTable->hasColumn('theme') == false) {
        $usersTable->addColumn('theme', 'string', [
            'limit' => 100,
            'encoding' => 'utf8',
            'null' => true,
            'default' => 'auto'
        ]);
    }

    // -------------------------------------------------------------------------
    // Add theme column
    // -------------------------------------------------------------------------
    if ($usersTable->hasColumn('2fa_secret') == false) {
        $usersTable->addColumn('2fa_secret', 'string', [
            'limit' => 100,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);
    }

    // -------------------------------------------------------------------------
    // Save changes to table
    // -------------------------------------------------------------------------
    $usersTable->save();
  }
}
