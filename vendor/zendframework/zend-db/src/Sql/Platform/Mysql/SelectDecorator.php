<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Platform\Mysql;

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

    protected function localizeVariables()
    {
        parent::localizeVariables();
        if ($this->limit === null && $this->offset !== null) {
            $this->specifications[self::LIMIT] = 'LIMIT 18446744073709551615';
        }
    }

    protected function processLimit(
        PlatformInterface $platform,
        DriverInterface $driver = null,
        ParameterContainer $parameterContainer = null
    ) {
        if ($this->limit === null && $this->offset !== null) {
            return [''];
        }
        if ($this->limit === null) {
            return;
        }
        if ($parameterContainer) {
            $parameterContainer->offsetSet('limit', $this->limit, ParameterContainer::TYPE_INTEGER);
            return [$driver->formatParameterName('limit')];
        }

        return [$this->limit];
    }

    protected function processOffset(
        PlatformInterface $platform,
        DriverInterface $driver = null,
        ParameterContainer $parameterContainer = null
    ) {
        if ($this->offset === null) {
            return;
        }
        if ($parameterContainer) {
            $parameterContainer->offsetSet('offset', $this->offset, ParameterContainer::TYPE_INTEGER);
            return [$driver->formatParameterName('offset')];
        }

        return [$this->offset];
    }
}
