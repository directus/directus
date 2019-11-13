<?php


use Phinx\Migration\AbstractMigration;

class AddProjectSettings extends AbstractMigration
{

    public function change()
    {
        // Update width of file nameing option
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half'
            ],
            ['collection' => 'directus_settings', 'field' => 'file_naming']
        ));

        // Update width of file nameing option
        $this->execute(\Directus\phinx_update(
            $this->getAdapter(),
            'directus_fields',
            [
              'width' => 'half'
            ],
            ['collection' => 'directus_settings', 'field' => 'login_attempts_allowed']
        ));


        $settings = [
            'project_icon' => [
                'interface' => 'icon',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_STRING,
                'width' => 'half',
            ],
            'project_image' => [
                'interface' => 'file',
                'width' => 'half',
                'type' => \Directus\Database\Schema\DataTypes::TYPE_FILE,
            ]
        ];
        foreach ($settings as $field => $options) {
            $this->addField($field, $options);
        }
    }

    protected function addField($field, $options)
    {
        $collection = 'directus_settings';
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        $result = $this->query($checkSql)->fetch();

        if (!$result) {
            $insertSqlFormat = 'INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`,`width`) VALUES ("%s", "%s", "%s", "%s", "%s");';
            $insertSql = sprintf($insertSqlFormat, $collection, $field, $options['type'], $options['interface'], $options['width']);
            $this->execute($insertSql);
        }
    }
}
