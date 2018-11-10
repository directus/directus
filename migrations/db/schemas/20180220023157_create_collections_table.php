<?php

use Phinx\Migration\AbstractMigration;

class CreateCollectionsTable extends AbstractMigration
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
        $table = $this->table('directus_collections', [
            'id' => false,
            'primary_key' => 'collection'
        ]);

        $table->addColumn('collection', 'string', [
            'limit' => 64,
            'null' => false
        ]);
        $table->addColumn('managed', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => true
        ]);
        $table->addColumn('hidden', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => false
        ]);
        $table->addColumn('single', 'boolean', [
            'signed' => false,
            'null' => false,
            'default' => false
        ]);
        $table->addColumn('icon', 'string', [
            'limit' => 30,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('note', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('translation', 'text', [
            'null' => true,
            'default' => null
        ]);

        $table->create();
    }
}
