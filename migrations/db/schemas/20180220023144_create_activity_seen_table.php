<?php

use Phinx\Migration\AbstractMigration;

class CreateActivitySeenTable extends AbstractMigration
{
    /**
     * Change Method.
     *
     * Write your reversible migrations using this method.
     *
     * More information on writing migrations is available here:
     * http://docs.phinx.org/en/latest/migrations.html#the-abstractmigration-class
     *
     * The following commands can be used in this method and Phinx will
     * automatically reverse them when rolling back:
     *
     *    createTable
     *    renameTable
     *    addColumn
     *    renameColumn
     *    addIndex
     *    addForeignKey
     *
     * Remember to call "create()" or "update()" and NOT "save()" when working
     * with the Table class.
     */
    public function change()
    {
        $table = $this->table('directus_activity_seen', ['signed' => false]);

        $table->addColumn('activity', 'integer', [
            'null' => false,
            'signed' => false
        ]);

        $table->addColumn('user', 'integer', [
            'signed' => false,
            'null' => false,
            'default' => 0
        ]);

        $table->addColumn('seen_on', 'datetime', [
            'null' => true,
            'default' => null
        ]);

        $table->addColumn('archived', 'boolean', [
            'signed' => false,
            'default' => false
        ]);

        $table->create();
    }
}
