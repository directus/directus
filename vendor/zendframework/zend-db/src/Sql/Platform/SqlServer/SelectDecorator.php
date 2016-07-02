<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Platform\SqlServer;

use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\Adapter\StatementContainerInterface;
use Zend\Db\Sql\Platform\PlatformDecoratorInterface;
use Zend\Db\Sql\Select;

class SelectDecorator extends Select implements PlatformDecoratorInterface
{
    /**
     * @var Select
     */
    protected $select = null;

    /**
     * @param Select $select
     */
    public function setSubject($select)
    {
        $this->select = $select;
    }

    /**
     * @param AdapterInterface $adapter
     * @param StatementContainerInterface $statementContainer
     */
    public function prepareStatement(AdapterInterface $adapter, StatementContainerInterface $statementContainer)
    {
        // localize variables
        foreach (get_object_vars($this->select) as $name => $value) {
            $this->{$name} = $value;
        }

        // set specifications
        unset($this->specifications[self::LIMIT]);
        unset($this->specifications[self::OFFSET]);

        $this->specifications['LIMITOFFSET'] = null;
        parent::prepareStatement($adapter, $statementContainer);
    }

    /**
     * @param PlatformInterface $platform
     * @return string
     */
    public function getSqlString(PlatformInterface $platform = null)
    {
        // localize variables
        foreach (get_object_vars($this->select) as $name => $value) {
            $this->{$name} = $value;
        }

        // set specifications
        unset($this->specifications[self::LIMIT]);
        unset($this->specifications[self::OFFSET]);

        $this->specifications['LIMITOFFSET'] = null;
        return parent::getSqlString($platform);
    }

    /**
     * @param PlatformInterface $platform
     * @param DriverInterface $driver
     * @param ParameterContainer $parameterContainer
     * @param $sqls
     * @param $parameters
     * @return null
     */
    protected function processLimitOffset(PlatformInterface $platform, DriverInterface $driver = null, ParameterContainer $parameterContainer = null, &$sqls, &$parameters)
    {
        if ($this->limit === null && $this->offset === null) {
            return null;
        }

        $selectParameters = $parameters[self::SELECT];

        $starSuffix = $platform->getIdentifierSeparator() . self::SQL_STAR;
        foreach ($selectParameters[0] as $i => $columnParameters) {
            if ($columnParameters[0] == self::SQL_STAR || (isset($columnParameters[1]) && $columnParameters[1] == self::SQL_STAR) || strpos($columnParameters[0], $starSuffix)) {
                $selectParameters[0] = array(array(self::SQL_STAR));
                break;
            }
            if (isset($columnParameters[1])) {
                array_shift($columnParameters);
                $selectParameters[0][$i] = $columnParameters;
            }
        }

        // first, produce column list without compound names (using the AS portion only)
        array_unshift($sqls, $this->createSqlFromSpecificationAndParameters(
            array('SELECT %1$s FROM (' => current($this->specifications[self::SELECT])),
            $selectParameters
        ));

        if ($parameterContainer) {
            // create bottom part of query, with offset and limit using row_number
            array_push($sqls, ') AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?');
            $parameterContainer->offsetSet('offset', $this->offset);
            $parameterContainer->offsetSet('limit', $this->limit);
            $parameterContainer->offsetSetReference('offsetForSum', 'offset');
        } else {
            array_push($sqls, ') AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN '
                . (int) $this->offset . '+1 AND '
                . (int) $this->limit . '+' . (int) $this->offset
            );
        }

        if (isset($sqls[self::ORDER])) {
            $orderBy = $sqls[self::ORDER];
            unset($sqls[self::ORDER]);
        } else {
            $orderBy = 'ORDER BY (SELECT 1)';
        }

        // add a column for row_number() using the order specification
        $parameters[self::SELECT][0][] = array('ROW_NUMBER() OVER (' . $orderBy . ')', '[__ZEND_ROW_NUMBER]');

        $sqls[self::SELECT] = $this->createSqlFromSpecificationAndParameters(
            $this->specifications[self::SELECT],
            $parameters[self::SELECT]
        );

    }
}
