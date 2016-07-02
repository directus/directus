<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Ddl\Column;

class Blob extends Column
{
    /**
     * @var int
     */
    protected $length;

    /**
     * @var string Change type to blob
     */
    protected $type = 'BLOB';

    /**
     * @param null  $name
     * @param int   $length
     * @param bool  $nullable
     * @param null  $default
     * @param array $options
     */
    public function __construct($name, $length, $nullable = false, $default = null, array $options = array())
    {
        $this->setName($name);
        $this->setLength($length);
        $this->setNullable($nullable);
        $this->setDefault($default);
        $this->setOptions($options);
    }

    /**
     * @param  int $length
     * @return self
     */
    public function setLength($length)
    {
        $this->length = $length;
        return $this;
    }

    /**
     * @return int
     */
    public function getLength()
    {
        return $this->length;
    }

    /**
     * @return array
     */
    public function getExpressionData()
    {
        $spec = $this->specification;

        $params   = array();
        $params[] = $this->name;
        $params[] = $this->type;

        if ($this->length) {
            $params[1] .= ' ' . $this->length;
        }

        $types = array(self::TYPE_IDENTIFIER, self::TYPE_LITERAL);

        if (!$this->isNullable) {
            $params[1] .= ' NOT NULL';
        }

        if ($this->default !== null) {
            $spec    .= ' DEFAULT %s';
            $params[] = $this->default;
            $types[]  = self::TYPE_VALUE;
        }

        return array(array(
            $spec,
            $params,
            $types,
        ));
    }
}
