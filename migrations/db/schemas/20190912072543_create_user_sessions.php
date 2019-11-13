<?php


use Phinx\Migration\AbstractMigration;

class CreateUserSessions extends AbstractMigration
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
