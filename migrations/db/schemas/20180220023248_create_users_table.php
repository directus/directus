<?php

use Phinx\Migration\AbstractMigration;

class CreateUsersTable extends AbstractMigration
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
        $table = $this->table('directus_users', ['signed' => false]);

        $table->addColumn('status', 'string', [
            'limit' => 16,
            'default' => \Directus\Database\TableGateway\DirectusUsersTableGateway::STATUS_DRAFT
        ]);
        $table->addColumn('first_name', 'string', [
            'limit' => 50,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('last_name', 'string', [
            'limit' => 50,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('email', 'string', [
            'limit' => 128,
            'null' => false
        ]);
        $table->addColumn('password', 'string', [
            'limit' => 255,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('token', 'string', [
            'limit' => 255,
            'encoding' => 'utf8',
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('timezone', 'string', [
            'limit' => 32,
            'default' => date_default_timezone_get(),
        ]);
        $table->addColumn('locale', 'string', [
            'limit' => 8,
            'null' => true,
            'default' => 'en-US'
        ]);
        $table->addColumn('locale_options', 'text', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('avatar', 'integer', [
            'signed' => false,
            'limit' => 11,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('company', 'string', [
            'limit' => 191,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('title', 'string', [
            'limit' => 191,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('email_notifications', 'integer', [
            'limit' => 1,
            'default' => 1
        ]);
        $table->addColumn('last_access_on', 'datetime', [
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('last_page', 'string', [
            'limit' => 192,
            'null' => true,
            'default' => null
        ]);
        $table->addColumn('external_id', 'string', [
            'limit' => 255,
            'null' => true,
            'default' => null
        ]);

        $table->addIndex('email', [
            'unique' => true,
            'name' => 'idx_users_email'
        ]);

        $table->addIndex('token', [
            'unique' => true,
            'name' => 'idx_users_token'
        ]);

        $table->addIndex('external_id', [
            'unique' => true,
            'name' => 'idx_users_external_id'
        ]);

        $table->create();
    }
}
