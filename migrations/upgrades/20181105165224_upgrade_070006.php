<?php

use Phinx\Migration\AbstractMigration;

class Upgrade070006 extends AbstractMigration
{
    public function up()
    {
        $table = $this->table('directus_collections');

        $table->changeColumn('icon', 'string', [
            'limit' => 30,
            'null' => true,
            'default' => null,
        ]);

        $table->save();
    }
}
