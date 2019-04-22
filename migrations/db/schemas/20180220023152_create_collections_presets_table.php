<?php

use Phinx\Migration\AbstractMigration;

class CreateCollectionsPresetsTable extends AbstractMigration
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
        $table = $this->table('directus_collection_presets', ['signed' => false]);

        $table->addColumn('title', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null,
            'encoding' => 'utf8mb4'
        ]);
        $table->addColumn('user', 'integer', [
            'signed' => false,
            'null' => true
        ]);
        $table->addColumn('role', 'integer', [
            'signed' => false,
            'null' => true
        ]);
        $table->addColumn('collection', 'string', [
            'limit' => 64,
            'null' => false
        ]);
        $table->addColumn('search_query', 'string', [
            'limit' => 100,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('filters', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('view_type', 'string', [
            'limit' => 100,
            'null' => false,
            'default' => 'tabular'
        ]);
        $table->addColumn('view_query', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('view_options', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('translation', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addIndex(['user', 'collection', 'title'], [
            'unique' => true,
            'name' => 'idx_user_collection_title'
        ]);

        $table->create();
    }
}
