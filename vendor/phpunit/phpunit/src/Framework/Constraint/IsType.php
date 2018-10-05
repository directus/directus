<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Constraint that asserts that the value it is evaluated for is of a
 * specified type.
 *
 * The expected value is passed in the constructor.
 */
class PHPUnit_Framework_Constraint_IsType extends PHPUnit_Framework_Constraint
{
    const TYPE_ARRAY    = 'array';
    const TYPE_BOOL     = 'bool';
    const TYPE_FLOAT    = 'float';
    const TYPE_INT      = 'int';
    const TYPE_NULL     = 'null';
    const TYPE_NUMERIC  = 'numeric';
    const TYPE_OBJECT   = 'object';
    const TYPE_RESOURCE = 'resource';
    const TYPE_STRING   = 'string';
    const TYPE_SCALAR   = 'scalar';
    const TYPE_CALLABLE = 'callable';

    /**
     * @var array
     */
    protected $types = [
        'array'    => true,
        'boolean'  => true,
        'bool'     => true,
        'double'   => true,
        'float'    => true,
        'integer'  => true,
        'int'      => true,
        'null'     => true,
        'numeric'  => true,
        'object'   => true,
        'real'     => true,
        'resource' => true,
        'string'   => true,
        'scalar'   => true,
        'callable' => true
    ];

    /**
     * @var string
     */
    protected $type;

    /**
     * @param string $type
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function __construct($type)
    {
        parent::__construct();

        if (!isset($this->types[$type])) {
            throw new PHPUnit_Framework_Exception(
                sprintf(
                    'Type specified for PHPUnit_Framework_Constraint_IsType <%s> ' .
                    'is not a valid type.',
                    $type
                )
            );
        }

        $this->type = $type;
    }

    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * @param mixed $other Value or object to evaluate.
     *
     * @return bool
     */
    protected function matches($other)
    {
        switch ($this->type) {
            case 'numeric':
                return is_numeric($other);

            case 'integer':
            case 'int':
                return is_int($other);

            case 'double':
            case 'float':
            case 'real':
                return is_float($other);

            case 'string':
                return is_string($other);

            case 'boolean':
            case 'bool':
                return is_bool($other);

            case 'null':
                return is_null($other);

            case 'array':
                return is_array($other);

            case 'object':
                return is_object($other);

            case 'resource':
                return is_resource($other) || is_string(@get_resource_type($other));

            case 'scalar':
                return is_scalar($other);

            case 'callable':
                return is_callable($other);
        }
    }

    /**
     * Returns a string representation of the constraint.
     *
     * @return string
     */
    public function toString()
    {
        return sprintf(
            'is of type "%s"',
            $this->type
        );
    }
}
