<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Platform\SqlServer\Ddl;

use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\Sql\Ddl\CreateTable;
use Zend\Db\Sql\Platform\PlatformDecoratorInterface;

class CreateTableDecorator extends CreateTable implements PlatformDecoratorInterface
{
    /**
     * @var CreateTable
     */
    protected $subject;

    /**
     * @param CreateTable $subject
     * @return self Provides a fluent interface
     */
    public function setSubject($subject)
    {
        $this->subject = $subject;
        return $this;
    }

    /**
     * @param PlatformInterface $adapterPlatform
     * @return array
     */
    protected function processTable(PlatformInterface $adapterPlatform = null)
    {
        $table = ($this->isTemporary ? '#' : '') . ltrim($this->table, '#');
        return [
            '',
            $adapterPlatform->quoteIdentifier($table),
        ];
    }
}
