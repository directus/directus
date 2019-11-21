<?php


use Phinx\Migration\AbstractMigration;

class UpdateUserRoleType extends AbstractMigration
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

        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'interface' => 'one-to-many'
            ],
            ['collection' => 'directus_roles', 'field' => 'users']
        ));
        
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
                'field' => 'role',
                'type' => 'm2o'
            ],
            ['collection' => 'directus_users', 'field' => 'roles']
        ));

        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_user_roles";')->fetch();

        if ($result) {
            $this->execute('DELETE FROM `directus_fields` where `collection` = "directus_user_roles";');
        }

        $config = \Directus\Application\Application::getInstance()->getContainer()->get('config');
        $dbName = $config->get('database.name');


        $result = $this->query('SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = "'.$dbName.'" AND TABLE_NAME = "directus_users" AND COLUMN_NAME = "role"')->fetch();
        
        if(!$result){
            $this->execute('ALTER TABLE `directus_users` ADD COLUMN `role` INT;');
        }

        $result = $this->query('SELECT 1 FROM `directus_relations` WHERE `collection_many` = "directus_user_roles";')->fetch();

        if ($result) {
            $this->execute('DELETE FROM `directus_relations` where `collection_many` = "directus_user_roles";');
        }

        $this->execute("INSERT INTO `directus_relations` (`collection_many`, `field_many`, `collection_one`, `field_one`) VALUES ('directus_users', 'role','directus_roles','users');");  
       
        $tableExist = $this->query('SELECT TABLE_NAME  FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = "'.$dbName.'" AND TABLE_NAME = "directus_user_roles"')->fetch();

        if($tableExist){
            $stmt = $this->query("SELECT * FROM `directus_user_roles`");
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)){
                $this->execute('UPDATE `directus_users` SET `role` = '.$row['role'].' where id = '.$row['user'].';');
            }
        }

        $this->execute('DROP TABLE IF EXISTS directus_user_roles');
    }
}
