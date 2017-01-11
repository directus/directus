<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Platform\Oracle;

use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\Sql\Platform\PlatformDecoratorInterface;
use Zend\Db\Sql\Select;

class SelectDecorator extends Select implements PlatformDecoratorInterface
{
    /**
     * @var Select
     */
    protected $subject = null;

    /**
     * @param Select $select
     */
    public function setSubject($select)
    {
        $this->subject = $select;
    }

    /**
     * @see \Zend\Db\Sql\Select::renderTable
     */
    protected function renderTable($table, $alias = null)
    {
        return $table . ($alias ? ' ' . $alias : '');
    }

    protected function localizeVariables()
    {
        parent::localizeVariables();
        unset($this->specifications[self::LIMIT]);
        unset($this->specifications[self::OFFSET]);

        $this->specifications['LIMITOFFSET'] = null;
    }

    /**
     * @param PlatformInterface $platform
     * @param DriverInterface $driver
     * @param ParameterContainer $parameterContainer
     * @param array $sqls
     * @param array $parameters
     * @return null
     */
    protected function processLimitOffset(
        PlatformInterface $platform,
        DriverInterface $driver = null,
        ParameterContainer $parameterContainer = null,
        &$sqls = [],
        &$parameters = []
    ) {
        if ($this->limit === null && $this->offset === null) {
            return;
        }

        $selectParameters = $parameters[self::SELECT];
        $starSuffix = $platform->getIdentifierSeparator() . self::SQL_STAR;

        foreach ($selectParameters[0] as $i => $columnParameters) {
            if ($columnParameters[0] == self::SQL_STAR
                || (isset($columnParameters[1]) && $columnParameters[1] == self::SQL_STAR)
                || strpos($columnParameters[0], $starSuffix)
            ) {
                $selectParameters[0] = [[self::SQL_STAR]];
                break;
            }

            if (isset($columnParameters[1])) {
                array_shift($columnParameters);
                $selectParameters[0][$i] = $columnParameters;
            }
        }

        if ($this->offset === null) {
            $this->offset = 0;
        }

        // first, produce column list without compound names (using the AS portion only)
        array_unshift($sqls, $this->createSqlFromSpecificationAndParameters([
            'SELECT %1$s FROM (SELECT b.%1$s, rownum b_rownum FROM (' => current($this->specifications[self::SELECT]),
        ], $selectParameters));

        if ($parameterContainer) {
            $number = $this->processInfo['subselectCount'] ? $this->processInfo['subselectCount'] : '';

            if ($this->limit === null) {
                array_push(
                    $sqls,
                    ') b ) WHERE b_rownum > (:offset' . $number . ')'
                );
                $parameterContainer->offsetSet(
                    'offset' . $number,
                    $this->offset,
                    $parameterContainer::TYPE_INTEGER
                );
            } else {
                // create bottom part of query, with offset and limit using row_number
                array_push(
                    $sqls,
                    ') b WHERE rownum <= (:offset'
                    . $number
                    . '+:limit'
                    . $number
                    . ')) WHERE b_rownum >= (:offset'
                    . $number
                    . ' + 1)'
                );
                $parameterContainer->offsetSet(
                    'offset' . $number,
                    $this->offset,
                    $parameterContainer::TYPE_INTEGER
                );
                $parameterContainer->offsetSet(
                    'limit' . $number,
                    $this->limit,
                    $parameterContainer::TYPE_INTEGER
                );
            }
            $this->processInfo['subselectCount']++;
        } else {
            if ($this->limit === null) {
                array_push($sqls, ') b ) WHERE b_rownum > (' . (int) $this->offset . ')');
            } else {
                array_push(
                    $sqls,
                    ') b WHERE rownum <= ('
                    . (int) $this->offset
                    . '+'
                    . (int) $this->limit
                    . ')) WHERE b_rownum >= ('
                    . (int) $this->offset
                    . ' + 1)'
                );
            }
        }

        $sqls[self::SELECT] = $this->createSqlFromSpecificationAndParameters(
            $this->specifications[self::SELECT],
            $parameters[self::SELECT]
        );
    }
}
