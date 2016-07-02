<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Pdo\Feature;

use Zend\Db\Adapter\Driver\Feature\AbstractFeature;
use Zend\Db\Adapter\Driver\Pdo;

/**
 * SqliteRowCounter
 */
class SqliteRowCounter extends AbstractFeature
{

    /**
     * @return string
     */
    public function getName()
    {
        return 'SqliteRowCounter';
    }

    /**
     * @param \Zend\Db\Adapter\Driver\Pdo\Statement $statement
     * @return int
     */
    public function getCountForStatement(Pdo\Statement $statement)
    {
        $countStmt = clone $statement;
        $sql = $statement->getSql();
        if ($sql == '' || stripos($sql, 'select') === false) {
            return null;
        }
        $countSql = 'SELECT COUNT(*) as "count" FROM (' . $sql . ')';
        $countStmt->prepare($countSql);
        $result = $countStmt->execute();
        $countRow = $result->getResource()->fetch(\PDO::FETCH_ASSOC);
        unset($statement, $result);
        return $countRow['count'];
    }

    /**
     * @param $sql
     * @return null|int
     */
    public function getCountForSql($sql)
    {
        if (!stripos($sql, 'select')) {
            return null;
        }
        $countSql = 'SELECT COUNT(*) as count FROM (' . $sql . ')';
        /** @var $pdo \PDO */
        $pdo = $this->pdoDriver->getConnection()->getResource();
        $result = $pdo->query($countSql);
        $countRow = $result->fetch(\PDO::FETCH_ASSOC);
        return $countRow['count'];
    }

    /**
     * @param $context
     * @return closure
     */
    public function getRowCountClosure($context)
    {
        $sqliteRowCounter = $this;
        return function () use ($sqliteRowCounter, $context) {
            /** @var $sqliteRowCounter SqliteRowCounter */
            return ($context instanceof Pdo\Statement)
                ? $sqliteRowCounter->getCountForStatement($context)
                : $sqliteRowCounter->getCountForSql($context);
        };
    }
}
