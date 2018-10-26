<?php

use Phinx\Migration\AbstractMigration;

class CreatePermissionsTable extends AbstractMigration
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
        $table = $this->table('directus_permissions', ['signed' => false]);

        $table->addColumn('collection', 'string', [
            'limit' => 64,
            'null' => false,
        ]);
        $table->addColumn('role', 'integer', [
            'signed' => false,
            'null' => false
        ]);
        $table->addColumn('status', 'string', [
            'length' => 64,
            'default' => null,
            'null' => true
        ]);
        $table->addColumn('create', 'string', [
            'signed' => false,
            'null' => true,
            'default' => 'none',
            'length' => 16,
        ]);
        $table->addColumn('read', 'string', [
            'signed' => false,
            'null' => true,
            'default' => 'none',
            'length' => 16,
        ]);
        $table->addColumn('update', 'string', [
            'signed' => false,
            'null' => true,
            'default' => 'none',
            'length' => 16,
        ]);
        $table->addColumn('delete', 'string', [
            'signed' => false,
            'null' => true,
            'default' => 'none',
            'length' => 16,
        ]);
        $table->addColumn('comment', 'string', [
            'limit' => 8,
            'null' => true,
            'default' => 'none'
        ]);
        $table->addColumn('explain', 'string', [
            'limit' => 8,
            'null' => true,
            'default' => 'none'
        ]);
        $table->addColumn('read_field_blacklist', 'string', [
            'limit' => 1000,
            'null' => true,
            'default' => null,
            'encoding' => 'utf8'
        ]);
        $table->addColumn('write_field_blacklist', 'string', [
            'limit' => 1000,
            'null' => true,
            'default' => NULL,
            'encoding' => 'utf8',
        ]);
        $table->addColumn('status_blacklist', 'string', [
            'length' => 1000,
            'default' => null,
            'null' => true
        ]);

        $table->create();
    }
}
