<?php

use Phinx\Migration\AbstractMigration;

class IncreaseUsersLastPageLength extends AbstractMigration
{
    public function up()
    {
        $table = $this->table('directus_users');

        $table->changeColumn('last_page', 'string', [
            'limit' => 192,
            'null' => true,
            'default' => null
        ]);

        $table->save();
    }
}
