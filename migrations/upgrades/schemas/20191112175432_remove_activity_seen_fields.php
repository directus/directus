<?php


use Phinx\Migration\AbstractMigration;

class RemoveActivitySeenFields extends AbstractMigration
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

        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_activity_seen"')->fetch();

        if ($result) {
            $this->execute('DELETE FROM `directus_fields` WHERE `collection` = "directus_activity_seen"');
        }

        $result = $this->query('SELECT 1 FROM `directus_relations` WHERE `collection_many` = "directus_activity_seen"')->fetch();

        if ($result) {
            $this->execute('DELETE FROM `directus_relations` WHERE `collection_many` = "directus_activity_seen"');
        }
   
        
        $this->execute('DROP TABLE IF EXISTS directus_activity_seen');

    }
}
