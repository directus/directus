<?php


use Phinx\Migration\AbstractMigration;

class RemoveScope extends AbstractMigration
{
    public function up()
    {
        $table = $this->table('directus_settings');
        $table->removeColumn('scope')
              ->save();
    }
}
