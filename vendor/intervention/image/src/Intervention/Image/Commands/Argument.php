<?php

namespace Intervention\Image\Commands;

class Argument
{
    /**
     * Command with arguments
     *
     * @var AbstractCommand
     */
    public $command;

    /**
     * Key of argument in array
     *
     * @var int
     */
    public $key;

    /**
     * Creates new instance from given command and key
     *
     * @param AbstractCommand $command
     * @param int             $key
     */
    public function __construct(AbstractCommand $command, $key = 0)
    {
        $this->command = $command;
        $this->key = $key;
    }

    /**
     * Returns name of current arguments command
     *
     * @return string
     */
    public function getCommandName()
    {
        preg_match("/\\\\([\w]+)Command$/", get_class($this->command), $matches);
        return isset($matches[1]) ? lcfirst($matches[1]).'()' : 'Method';
    }

    /**
     * Returns value of current argument
     *
     * @param  mixed $default
     * @return mixed
     */
    public function value($default = null)
    {
        $arguments = $this->command->arguments;

        if (is_array($arguments)) {
            return isset($arguments[$this->key]) ? $arguments[$this->key] : $default;
        }

        return $default;
    }

    /**
     * Defines current argument as required
     *
     * @return \Intervention\Image\Commands\Argument
     */
    public function required()
    {
        if ( ! array_key_exists($this->key, $this->command->arguments)) {
            throw new \Intervention\Image\Exception\InvalidArgumentException(
                sprintf("Missing argument %d for %s", $this->key + 1, $this->getCommandName())
            );
        }

        return $this;
    }

    /**
     * Determines that current argument must be of given type
     *
     * @return \Intervention\Image\Commands\Argument
     */
    public function type($type)
    {
        $fail = false;

        $value = $this->value();

        if (is_null($value)) {
            return $this;
        }

        switch (strtolower($type)) {

            case 'bool':
            case 'boolean':
                $fail =  ! is_bool($value);
                $message = sprintf('%s accepts only boolean values as argument %d.', $this->getCommandName(), $this->key + 1);
                break;

            case 'int':
            case 'integer':
                $fail =  ! is_integer($value);
                $message = sprintf('%s accepts only integer values as argument %d.', $this->getCommandName(), $this->key + 1);
                break;

            case 'num':
            case 'numeric':
                $fail =  ! is_numeric($value);
                $message = sprintf('%s accepts only numeric values as argument %d.', $this->getCommandName(), $this->key + 1);
                break;

            case 'str':
            case 'string':
                $fail =  ! is_string($value);
                $message = sprintf('%s accepts only string values as argument %d.', $this->getCommandName(), $this->key + 1);
                break;

            case 'array':
                $fail =  ! is_array($value);
                $message = sprintf('%s accepts only array as argument %d.', $this->getCommandName(), $this->key + 1);
                break;

            case 'closure':
                $fail =  ! is_a($value, '\Closure');
                $message = sprintf('%s accepts only Closure as argument %d.', $this->getCommandName(), $this->key + 1);
                break;

            case 'digit':
                $fail = ! $this->isDigit($value);
                $message = sprintf('%s accepts only integer values as argument %d.', $this->getCommandName(), $this->key + 1);
                break;
        }

        if ($fail) {

            $message = isset($message) ? $message : sprintf("Missing argument for %d.", $this->key);

            throw new \Intervention\Image\Exception\InvalidArgumentException(
                $message
            );
        }

        return $this;
    }

    /**
     * Determines that current argument value must be numeric between given values
     *
     * @return \Intervention\Image\Commands\Argument
     */
    public function between($x, $y)
    {
        $value = $this->type('numeric')->value();

        if (is_null($value)) {
            return $this;
        }

        $alpha = min($x, $y);
        $omega = max($x, $y);

        if ($value < $alpha || $value > $omega) {
            throw new \Intervention\Image\Exception\InvalidArgumentException(
                sprintf('Argument %d must be between %s and %s.', $this->key, $x, $y)
            );
        }

        return $this;
    }

    /**
     * Determines that current argument must be over a minimum value
     *
     * @return \Intervention\Image\Commands\Argument
     */
    public function min($value)
    {
        $v = $this->type('numeric')->value();

        if (is_null($v)) {
            return $this;
        }

        if ($v < $value) {
            throw new \Intervention\Image\Exception\InvalidArgumentException(
                sprintf('Argument %d must be at least %s.', $this->key, $value)
            );
        }

        return $this;
    }

    /**
     * Determines that current argument must be under a maxiumum value
     *
     * @return \Intervention\Image\Commands\Argument
     */
    public function max($value)
    {
        $v = $this->type('numeric')->value();

        if (is_null($v)) {
            return $this;
        }

        if ($v > $value) {
            throw new \Intervention\Image\Exception\InvalidArgumentException(
                sprintf('Argument %d may not be greater than %s.', $this->key, $value)
            );
        }

        return $this;
    }

    /**
     * Checks if value is "PHP" integer (120 but also 120.0)
     *
     * @param  mixed $value
     * @return boolean
     */
    private function isDigit($value)
    {
        return is_numeric($value) ? intval($value) == $value : false;
    }
}
