<?php

use Phinx\Migration\AbstractMigration;

class RemoveActivitySeen extends AbstractMigration
{
  public function change() {
    // -------------------------------------------------------------------------
    // Remove directus_activity_seen table
    // -------------------------------------------------------------------------
    if ($this->hasTable('directus_activity_seen')) {
      $this->table('directus_activity_seen')->drop();
    }
  }
}
