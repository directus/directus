<?php

namespace Intervention\Image\Commands;

abstract class AbstractCommand
{
    /**
     * Arguments of command
     *
     * @var array
     */
    public $arguments;

    /**
     * Output of command
     *
     * @var mixed
     */
    protected $output;

    /**
     * Executes current command on given image
     *
     * @param  \Intervention\Image\Image $image
     * @return mixed
     */
    abstract public function execute($image);

    /**
     * Creates new command instance
     *
     * @param array $arguments
     */
    public function __construct($arguments)
    {
        $this->arguments = $arguments;
    }

    /**
     * Creates new argument instance from given argument key
     *
     * @param  int $key
     * @return \Intervention\Image\Commands\Argument
     */
    public function argument($key)
    {
        return new \Intervention\Image\Commands\Argument($this, $key);
    }

    /**
     * Returns output data of current command
     *
     * @return mixed
     */
    public function getOutput()
    {
        return $this->output ? $this->output : null;
    }

    /**
     * Determines if current instance has output data
     *
     * @return boolean
     */
    public function hasOutput()
    {
        return ! is_null($this->output);
    }

    /**
     * Sets output data of current command
     *
     * @param mixed $value
     */
    public function setOutput($value)
    {
        $this->output = $value;
    }
}
