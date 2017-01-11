<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql\Ddl\Column;

use Zend\Db\Sql\Ddl\Constraint\ConstraintInterface;

class Column implements ColumnInterface
{
    /**
     * @var null|string|int
     */
    protected $default;

    /**
     * @var bool
     */
    protected $isNullable = false;

    /**
     * @var string
     */
    protected $name = '';

    /**
     * @var array
     */
    protected $options = [];

    /**
     * @var ConstraintInterface[]
     */
    protected $constraints = [];

    /**
     * @var string
     */
    protected $specification = '%s %s';

    /**
     * @var string
     */
    protected $type = 'INTEGER';

    /**
     * @param null|string $name
     * @param bool        $nullable
     * @param mixed|null  $default
     * @param mixed[]     $options
     */
    public function __construct($name = null, $nullable = false, $default = null, array $options = [])
    {
        $this->setName($name);
        $this->setNullable($nullable);
        $this->setDefault($default);
        $this->setOptions($options);
    }

    /**
     * @param  string $name
     * @return self
     */
    public function setName($name)
    {
        $this->name = (string) $name;
        return $this;
    }

    /**
     * @return null|string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @param  bool $nullable
     * @return self
     */
    public function setNullable($nullable)
    {
        $this->isNullable = (bool) $nullable;
        return $this;
    }

    /**
     * @return bool
     */
    public function isNullable()
    {
        return $this->isNullable;
    }

    /**
     * @param  null|string|int $default
     * @return self
     */
    public function setDefault($default)
    {
        $this->default = $default;
        return $this;
    }

    /**
     * @return null|string|int
     */
    public function getDefault()
    {
        return $this->default;
    }

    /**
     * @param  array $options
     * @return self
     */
    public function setOptions(array $options)
    {
        $this->options = $options;
        return $this;
    }

    /**
     * @param  string $name
     * @param  string $value
     * @return self
     */
    public function setOption($name, $value)
    {
        $this->options[$name] = $value;
        return $this;
    }

    /**
     * @return array
     */
    public function getOptions()
    {
        return $this->options;
    }

    /**
     * @param ConstraintInterface $constraint
     *
     * @return self
     */
    public function addConstraint(ConstraintInterface $constraint)
    {
        $this->constraints[] = $constraint;

        return $this;
    }

    /**
     * @return array
     */
    public function getExpressionData()
    {
        $spec = $this->specification;

        $params   = [];
        $params[] = $this->name;
        $params[] = $this->type;

        $types = [self::TYPE_IDENTIFIER, self::TYPE_LITERAL];

        if (!$this->isNullable) {
            $spec .= ' NOT NULL';
        }

        if ($this->default !== null) {
            $spec    .= ' DEFAULT %s';
            $params[] = $this->default;
            $types[]  = self::TYPE_VALUE;
        }

        $data = [[
            $spec,
            $params,
            $types,
        ]];

        foreach ($this->constraints as $constraint) {
            $data[] = ' ';
            $data = array_merge($data, $constraint->getExpressionData());
        }

        return $data;
    }
}
