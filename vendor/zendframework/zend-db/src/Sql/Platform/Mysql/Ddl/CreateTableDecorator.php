<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Platform\Mysql\Ddl;

use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\Sql\Ddl\CreateTable;
use Zend\Db\Sql\Platform\PlatformDecoratorInterface;

class CreateTableDecorator extends CreateTable implements PlatformDecoratorInterface
{
    /**
     * @var CreateTable
     */
    protected $createTable;

    /**
     * @param CreateTable $subject
     */
    public function setSubject($subject)
    {
        $this->createTable = $subject;
    }

    /**
     * @param  null|PlatformInterface $platform
     * @return string
     */
    public function getSqlString(PlatformInterface $platform = null)
    {
        // localize variables
        foreach (get_object_vars($this->createTable) as $name => $value) {
            $this->{$name} = $value;
        }
        return parent::getSqlString($platform);
    }

    protected function processColumns(PlatformInterface $platform = null)
    {
        $sqls = array();
        foreach ($this->columns as $i => $column) {
            $stmtContainer = $this->processExpression($column, $platform);
            $sql           = $stmtContainer->getSql();
            $columnOptions = $column->getOptions();

            foreach ($columnOptions as $coName => $coValue) {
                switch (strtolower(str_replace(array('-', '_', ' '), '', $coName))) {
                    case 'identity':
                    case 'serial':
                    case 'autoincrement':
                        $sql .= ' AUTO_INCREMENT';
                        break;
                    /*
                    case 'primary':
                    case 'primarykey':
                        $sql .= ' PRIMARY KEY';
                        break;
                    case 'unique':
                    case 'uniquekey':
                        $sql .= ' UNIQUE KEY';
                        break;
                    */
                    case 'comment':
                        $sql .= ' COMMENT \'' . $coValue . '\'';
                        break;
                    case 'columnformat':
                    case 'format':
                        $sql .= ' COLUMN_FORMAT ' . strtoupper($coValue);
                        break;
                    case 'storage':
                        $sql .= ' STORAGE ' . strtoupper($coValue);
                        break;
                }
            }
            $stmtContainer->setSql($sql);
            $sqls[$i] = $stmtContainer;
        }
        return array($sqls);
    }
}
