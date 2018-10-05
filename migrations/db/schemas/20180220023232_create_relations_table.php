<?php

use Phinx\Migration\AbstractMigration;

class CreateRelationsTable extends AbstractMigration
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
        $table = $this->table('directus_relations', ['signed' => false]);

        $table->addColumn('collection_many', 'string', [
            'limit' => 64,
            'null' => false
        ]);
        $table->addColumn('field_many', 'string', [
            'limit' => 45,
            'null' => false
        ]);
        $table->addColumn('collection_one', 'string', [
            'limit' => 64,
            'null' => true
        ]);
        $table->addColumn('field_one', 'string', [
            'limit' => 64,
            'null' => true
        ]);
        $table->addColumn('junction_field', 'string', [
            'limit' => 64,
            'null' => true
        ]);

        $table->create();
    }
}
