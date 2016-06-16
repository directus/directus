<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Ddl\Column;

class Boolean extends Column
{
    /**
     * @var string specification
     */
    protected $specification = '%s TINYINT NOT NULL';

    /**
     * @param string $name
     */
    public function __construct($name)
    {
        $this->name = $name;
    }

    /**
     * @return array
     */
    public function getExpressionData()
    {
        $spec   = $this->specification;
        $params = array($this->name);
        $types  = array(self::TYPE_IDENTIFIER);

        return array(array(
            $spec,
            $params,
            $types,
        ));
    }
}
