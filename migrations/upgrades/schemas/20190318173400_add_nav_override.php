<?php


use Phinx\Migration\AbstractMigration;

class AddNavOverride extends AbstractMigration
{
    public function up()
    {
        $table = $this->table('directus_roles');
        if (!$table->hasColumn('nav_override')) {
            $table->addColumn('nav_override', 'text', [
                'null' => true
            ]);

            $table->save();
        }

        $checkSql = 'SELECT 1 FROM `directus_fields` WHERE `field` = "nav_override" AND `collection` = "directus_roles";';
        $result = $this->query($checkSql)->fetch();

        if (!$result) {
            $insertSql = 'INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`, `options`, `locked`) VALUES ("directus_roles", "nav_override", "json", "code", "{\"template\":[{\"title\":\"$t:collections\",\"include\":\"collections\"},{\"title\":\"$t:bookmarks\",\"include\":\"bookmarks\"},{\"title\":\"$t:extensions\",\"include\":\"extensions\"},{\"title\":\"Custom Links\",\"links\":[{\"name\":\"RANGER Studio\",\"path\":\"https:\/\/rangerstudio.com\",\"icon\":\"star\"},{\"name\":\"Movies\",\"path\":\"\/collections\/movies\"}]}]}", 1);';
            $this->execute($insertSql);
        }
    }
}
