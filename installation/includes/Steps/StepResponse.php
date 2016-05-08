<?php

namespace Directus\Installation\Steps;

class StepResponse
{
    protected $success = false;
    protected $data = [];

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function isSuccessful()
    {
        return !isset($this->data['error']);
    }

    public function setData($key, $value)
    {
        $this->data[$key] = $value;
    }

    public function setError($value)
    {
        $this->setData('error', $value);
    }

    public function getError()
    {
        return array_key_exists('error', $this->data) ? $this->data['error'] : null;
    }

    public function getErrorMessage()
    {
        $error = $this->getError();

        if (!$error) {
            return false;
        }

        return array_key_exists('message', $error) ? $error['message'] : '';
    }

    public function getData($key = null)
    {
        if ($key != null) {
            return array_key_exists($key, $this->data) ? $this->data[$key] : null;
        }

        return $this->data;
    }
}
