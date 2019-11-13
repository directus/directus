<?php


use Phinx\Migration\AbstractMigration;

class UpdateDirectusUserSessions extends AbstractMigration
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
        $table = $this->table('directus_user_sessions');
        if (!$table->hasColumn('token_type')) {
            $table->addColumn('token_type', 'string', [
                'null' => true,
                'default' => null
            ]);
        }
        
        if (!$table->hasColumn('token_expired_at')) {
            $table->addColumn('token_expired_at', 'datetime', [
                'null' => true,
                'default' => null
            ]);
        }
        
        $table->save();
    }
}
