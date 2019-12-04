<?php

use Phinx\Migration\AbstractMigration;

class AddWebhooks extends AbstractMigration
{
  public function change() {
    if ($this->hasTable('directus_webhooks')) {
        // Don't do anything if the table already exists
        return;
    }

    $table = $this->table('directus_webhooks', ['signed' => false]);

    $table->addColumn('status', 'string', [
        'limit' => 16,
        'default' => \Directus\Api\Routes\Webhook::STATUS_INACTIVE
    ]);


    $table->addColumn('http_action', 'string', [
        'limit' => 255,
        'encoding' => 'utf8',
        'null' => true,
        'default' => null
    ]);

    $table->addColumn('url', 'string', [
        'limit' => 510,
        'encoding' => 'utf8',
        'null' => true,
        'default' => null
    ]);

    $table->addColumn('collection', 'string', [
        'limit' => 255,
        'null' => true,
        'default' => null
    ]);

    $table->addColumn('directus_action', 'string', [
        'limit' => 255,
        'encoding' => 'utf8',
        'null' => true,
        'default' => null
    ]);

    $table->create();
  }
}
