<?php


use Phinx\Migration\AbstractMigration;

class AddThemeFieldForUser extends AbstractMigration
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
        $table = $this->table('directus_users');
        if (!$table->hasColumn('theme')) {
            $table->addColumn('theme', 'string', [
                'limit' => 255,
                'null' => true,
                'default' => null
            ]);

            $table->save();
        }

        $result = $this->query('SELECT 1 FROM `directus_fields` WHERE `collection` = "directus_users" AND `field` = "theme"')->fetch();

        if (!$result) {
            $options =  json_encode([
                'format' => true,
                'choices' => [
                    'auto' => 'Auto',
                    'light' => 'Light',
                    'dark' => 'Dark'
                ]
            ]);
              $this->execute("INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`, `options`, `locked`, `readonly`, `sort`) VALUES ('directus_users', 'theme', 'string', 'radio-buttons', '".$options."', 1,0 , 14);");
        }
    }
}
