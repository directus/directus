<?php

use Phinx\Migration\AbstractMigration;

class SetWidth extends AbstractMigration
{
    public function up()
    {
      $table = $this->table('directus_fields');

      $table->changeColumn('width', 'string', [
          'limit' => 30,
          'null' => true,
          'default' => null,
      ]);

      $this->execute("UPDATE directus_fields SET width = 'half' WHERE width = '1';");
      $this->execute("UPDATE directus_fields SET width = 'half' WHERE width = '2';");
      $this->execute("UPDATE directus_fields SET width = 'full' WHERE width = '3';");
      $this->execute("UPDATE directus_fields SET width = 'full' WHERE width = '4';");

      $table->save();
    }
}
