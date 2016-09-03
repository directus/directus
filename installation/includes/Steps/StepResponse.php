<?php

namespace Directus\Installation\Steps;

class StepResponse
{
    /**
     * @var bool
     */
    protected $success = false;

    /**
     * @var array
     */
    protected $data = [];

    /**
     * @var array
     */
    protected $errors = [];

    /**
     * @var array
     */
    protected $warnings = [];

    /**
     * StepResponse constructor.
     * @param $data
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Check if response is successful
     * @return bool
     */
    public function isSuccessful()
    {
        return !$this->errors;
    }

    public function setData($key, $value)
    {
        $this->data[$key] = $value;
    }

    /**
     * Add an error message
     * @param $messages
     */
    public function addError($messages)
    {
        $this->addMessage('errors', $messages);
    }

    /**
     * Add a warning message
     * @param array|string $messages
     */
    public function addWarning($messages)
    {
        $this->addMessage('warnings', $messages);
    }

    /**
     * Get all errors messages
     * @param $raw - if not true it will convert special chars into html entities
     * @return array
     */
    public function getErrors($raw = false)
    {
        return $this->getMessages($this->errors, $raw);
    }

    /**
     * Get all warning messages
     * @param $raw - if not true it will convert special chars into html entities
     * @return array
     */
    public function getWarnings($raw = false)
    {
        return $this->getMessages($this->warnings, $raw);
    }


    /**
     * Deletes all error messages
     */
    public function clearErrors()
    {
        $this->errors = [];
    }

    /**
     * Deletes all warning messages
     */
    public function clearWarnings()
    {
        $this->warnings = [];
    }

    /**
     * Deletes all warning and errors messages
     */
    public function clearAll()
    {
        $this->clearErrors();
        $this->clearWarnings();
    }

    protected function addMessage($name, $messages)
    {
        if (!property_exists($this, $name)) {
            throw new \BadMethodCallException("Property '$name' does not exists in " . __CLASS__);
        }

        if (!is_array($messages)) {
            $messages = (array)$messages;
        }

        foreach ($messages as $message) {
            array_push($this->{$name}, $message);
        }
    }

    /**
     * Returns all values from a given array.
     * It converts all the value to html entities is $raw is false.
     * @param $messages
     * @param bool $raw
     * @return mixed
     */
    protected function getMessages($messages, $raw = false)
    {
        if ($raw !== true) {
            foreach ($messages as &$message) {
                $message = htmlentities($message, ENT_QUOTES);
            }
        }

        return $messages;
    }

    public function getData($key = null)
    {
        if ($key != null) {
            return array_key_exists($key, $this->data) ? $this->data[$key] : null;
        }

        return $this->data;
    }
}
