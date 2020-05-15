<?php

use Phinx\Migration\AbstractMigration;

class AddUserSessions extends AbstractMigration
{
  public function change() {
    if ($this->hasTable('directus_user_sessions')) {
        // Don't do anything if the table already exists
        return;
    }

    $table = $this->table('directus_user_sessions', ['signed' => false]);

    $table->addColumn('user', 'integer', [
        'signed' => false,
        'null' => true,
        'default' => null
    ]);

    $table->addColumn('token_type', 'string', [
        'null' => true,
        'default' => null
    ]);

    $table->addColumn('token', 'string', [
        'limit' => 520,
        'encoding' => 'utf8',
        'null' => true,
        'default' => null
    ]);

    $table->addColumn('ip_address', 'string', [
        'limit' => 255,
        'encoding' => 'utf8',
        'null' => true,
        'default' => null
    ]);

    $table->addColumn('user_agent', 'text', [
        'default' => null,
        'null' => true,
        'default' => null
    ]);

    $table->addColumn('created_on', 'datetime', [
        'null' => true,
        'default' => null
    ]);

    $table->addColumn('token_expired_at', 'datetime', [
        'null' => true,
        'default' => null
    ]);

    $table->create();
  }
}
