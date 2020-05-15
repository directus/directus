<?php

namespace Directus\Database\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Column;

abstract class CollectionLength extends Column
{
    /**
     * @var string|array
     */
    protected $length;

    /**
     * {@inheritDoc}
     *
     * @param int $length
     */
    public function __construct($name, $length = null, $nullable = false, $default = null, array $options = [])
    {
        $this->setLength($length);

        parent::__construct($name, $nullable, $default, $options);
    }

    /**
     * @param  int $length
     * @return self Provides a fluent interface
     */
    public function setLength($length)
    {
        $values = $length;
        if (!is_array($length)) {
            $values = explode(',', $values);
        }

        $length = implode(',', array_map(function ($value) {
            return sprintf('"%s"', $value);
        }, $values));

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
     * @return string
     */
    protected function getLengthExpression()
    {
        return (string) $this->length;
    }

    /**
     * @return array
     */
    public function getExpressionData()
    {
        $data = parent::getExpressionData();

        if ($this->getLengthExpression()) {
            $data[0][1][1] .= '(' . $this->getLengthExpression() . ')';
        }

        return $data;
    }
}
