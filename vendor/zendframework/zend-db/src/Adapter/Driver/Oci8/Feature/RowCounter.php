<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Oci8\Feature;

use Zend\Db\Adapter\Driver\Feature\AbstractFeature;
use Zend\Db\Adapter\Driver\Oci8\Statement;

/**
 * Class for count of results of a select
 */
class RowCounter extends AbstractFeature
{
    /**
     * @return string
     */
    public function getName()
    {
        return 'RowCounter';
    }

    /**
     * @param Statement $statement
     * @return null|int
     */
    public function getCountForStatement(Statement $statement)
    {
        $countStmt = clone $statement;
        $sql = $statement->getSql();
        if ($sql == '' || stripos(strtolower($sql), 'select') === false) {
            return;
        }
        $countSql = 'SELECT COUNT(*) as "count" FROM (' . $sql . ')';
        $countStmt->prepare($countSql);
        $result = $countStmt->execute();
        $countRow = $result->current();
        return $countRow['count'];
    }

    /**
     * @param string $sql
     * @return null|int
     */
    public function getCountForSql($sql)
    {
        if (stripos(strtolower($sql), 'select') === false) {
            return;
        }
        $countSql = 'SELECT COUNT(*) as "count" FROM (' . $sql . ')';
        $result = $this->driver->getConnection()->execute($countSql);
        $countRow = $result->current();
        return $countRow['count'];
    }

    /**
     * @param \Zend\Db\Adapter\Driver\Oci8\Statement|string $context
     * @return callable
     */
    public function getRowCountClosure($context)
    {
        $rowCounter = $this;
        return function () use ($rowCounter, $context) {
            /** @var $rowCounter RowCounter */
            return ($context instanceof Statement)
                ? $rowCounter->getCountForStatement($context)
                : $rowCounter->getCountForSql($context);
        };
    }
}
