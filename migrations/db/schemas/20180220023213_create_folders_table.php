<?php

use Phinx\Migration\AbstractMigration;

class CreateFoldersTable extends AbstractMigration
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
        $table = $this->table('directus_folders', ['signed' => false]);

        $table->addColumn('name', 'string', [
            'limit' => 191,
            'null' => false,
            'encoding' => 'utf8mb4'
        ]);
        $table->addColumn('parent_folder', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);

        $table->addIndex(['name', 'parent_folder'], [
            'unique' => true,
            'name' => 'idx_name_parent_folder'
        ]);

        $table->create();
    }
}
