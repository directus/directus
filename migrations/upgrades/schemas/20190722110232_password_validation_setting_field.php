<?php


use Phinx\Migration\AbstractMigration;

class PasswordValidationSettingField extends AbstractMigration
{
    public function up()
    {
          $conn = $this->getAdapter()->getConnection();

          $fieldObject = [
            'field' => 'password_policy',
            'type' => 'string',
            'note' => 'Weak : Minimum length 8; Strong :  1 small-case letter, 1 capital letter, 1 digit, 1 special character and the length should be minimum 8',
            'interface' => 'dropdown',
            'options'   => ['choices' => ['' => 'None', '/^.{8,}$/' => 'Weak', '/(?=^.{8,}$)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{\';\'?>.<,])(?!.*\s).*$/' => 'Strong']]
          ];  
          $collection = 'directus_settings';
          $checkSql = sprintf('SELECT 1 FROM `directus_fields` WHERE `collection` = "%s" AND `field` = "%s";', $collection, $fieldObject['field']);
          $result = $this->query($checkSql)->fetch();
          if (!$result) {
            $insertSqlFormat = "INSERT INTO `directus_fields` (`collection`, `field`, `type`, `interface`, `options`, `note`) VALUES ('%s', '%s', '%s', '%s' , %s, '%s');";
            $insertSql = sprintf($insertSqlFormat, $collection, $fieldObject['field'], $fieldObject['type'], $fieldObject['interface'], $conn->quote(json_encode($fieldObject['options'])) , $fieldObject['note']);
            $this->execute($insertSql);
          }

    }
}
