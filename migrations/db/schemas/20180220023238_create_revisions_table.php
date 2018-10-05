<?php

use Phinx\Migration\AbstractMigration;

class CreateRevisionsTable extends AbstractMigration
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
        $table = $this->table('directus_revisions', ['signed' => false]);

        $table->addColumn('activity', 'integer', [
            'null' => false,
            'signed' => false
        ]);
        $table->addColumn('collection', 'string', [
            'limit' => 64,
            'null' => false
        ]);
        $table->addColumn('item', 'string', [
            'limit' => 255
        ]);
        $table->addColumn('data', 'text', [
            'limit' => 4294967295
        ]);
        $table->addColumn('delta', 'text', [
            'limit' => 4294967295,
            'null' => true
        ]);
        $table->addColumn('parent_collection', 'string', [
            'limit' => 64,
            'null' => true
        ]);
        $table->addColumn('parent_item', 'string', [
            'limit' => 255,
            'null' => true
        ]);
        $table->addColumn('parent_changed', 'boolean', [
            'signed' => false,
            'default' => false,
            'null' => true
        ]);

        $table->create();
    }
}
