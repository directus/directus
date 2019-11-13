<?php
use Phinx\Migration\AbstractMigration;
class AddLocaleAndTelemetryToSettingsTable extends AbstractMigration
{
    public function up()
    {
        $settings = [
            'default_locale' => [
                'type' => 'string',
                'interface' => 'language'
            ],
            'telemetry' => [
                'type' => 'boolean',
                'interface' => 'toggle'
            ]
        ];
        foreach ($settings as $field => $options) {
            $this->addField($field, $options['type'], $options['interface']);
        }
    }
    protected function addField($field, $type, $interface)
    {
        $collection = 'directus_settings';
        $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $field);
        $result = $this->query($checkSql)->fetch();
        if (!$result) {
            $insertSqlFormat = 'INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`) VALUES ("%s", "%s", "%s", "%s");';
            $insertSql = sprintf($insertSqlFormat, $collection, $field, $type, $interface);
            $this->execute($insertSql);
        }
    }
}