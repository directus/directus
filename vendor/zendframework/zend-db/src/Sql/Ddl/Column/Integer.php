<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Ddl\Column;

class Integer extends Column
{
    /**
     * @var int
     */
    protected $length;

    /**
     * @param null|string     $name
     * @param bool            $nullable
     * @param null|string|int $default
     * @param array           $options
     */
    public function __construct($name, $nullable = false, $default = null, array $options = array())
    {
        $this->setName($name);
        $this->setNullable($nullable);
        $this->setDefault($default);
        $this->setOptions($options);
    }
}
