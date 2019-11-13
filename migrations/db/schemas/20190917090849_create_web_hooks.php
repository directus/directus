<?php


use Phinx\Migration\AbstractMigration;

class CreateWebHooks extends AbstractMigration
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
