<?php

use Phinx\Migration\AbstractMigration;

class SetNullableValueFieldSettingsTable extends AbstractMigration
{
    public function up()
    {
        $table = $this->table('directus_settings');

        $table->changeColumn('value', 'text', [
            'null' => true
        ]);

        $table->save();
    }
}
