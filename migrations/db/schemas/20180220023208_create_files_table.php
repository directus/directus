<?php

use Phinx\Migration\AbstractMigration;

class CreateFilesTable extends AbstractMigration
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
        $table = $this->table('directus_files', ['signed' => false]);

        $table->addColumn('storage', 'string', [
            'limit' => 50,
            'null' => false,
            'default' => 'local'
        ]);
        $table->addColumn('filename', 'string', [
            'limit' => 255,
            'null' => false,
            'default' => null
        ]);
        $table->addColumn('title', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('type', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null // unknown type?
        ]);
        $table->addColumn('uploaded_by', 'integer', [
            'signed' => false,
            'null' => false
        ]);
        // TODO: Make directus set this value to whatever default is on the server (UTC)
        // In MySQL 5.5 and below doesn't support CURRENT TIMESTAMP on datetime as default
        $table->addColumn('uploaded_on', 'datetime', [
            'null' => false
        ]);
        $table->addColumn('charset', 'string', [
            'limit' => 50,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('filesize', 'integer', [
            'signed' => false,
            'default' => 0
        ]);
        $table->addColumn('width', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('height', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('duration', 'integer', [
            'signed' => true,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('embed', 'string', [
            'limit' => 200,
            'null' => true,
            'default' => NULL
        ]);
        $table->addColumn('folder', 'integer', [
            'signed' => false,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('description', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('location', 'string', [
            'limit' => 200,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('tags', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('checksum', 'string', [
            'limit' => 32,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('metadata', 'text', [
            'null' => true,
            'default' => null
        ]);

        $table->create();
    }
}
