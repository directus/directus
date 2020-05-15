<?php


use Phinx\Migration\AbstractMigration;

class AddEnforce2FARoleField extends AbstractMigration
{
    public function up()
    {
        $this->addSetting();
        $this->addField();
    }

    protected function addSetting()
    {
        $table = $this->table('directus_roles');
        if (!$table->hasColumn('enforce_2fa')) {
            $table->addColumn('enforce_2fa', 'boolean', [
                'null' => true,
                'default' => null
            ]);

            $table->save();
        }
    }

    protected function addField()
    {
        $collection = 'directus_roles';
        $field = 'enforce_2fa';
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        $result = $this->query($checkSql)->fetch();

        if (!$result) {
            $insertSqlFormat = 'INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`) VALUES ("%s", "%s", "%s", "%s");';
            $insertSql = sprintf($insertSqlFormat, $collection, $field, 'boolean', 'switch');
            $this->execute($insertSql);
        }
    }
}
