<?php

namespace Directus\Debug\Log;

use Directus\Exception\Exception;
use Slim\Extras\Log\DateTimeFileWriter;

class Writer extends DateTimeFileWriter
{
    protected $failed = false;

    /**
     * @inheritdoc
     */
    public function write($object, $level)
    {
        // Determine label
        $label = $this->getLabel($level, 'DEBUG');

        // Get formatted log message
        $message = $this->createMessage($label, (string)$object);

        // Open resource handle to log file
        $resource = $this->getResource();

        // Output to resource
        if ($resource) {
            fwrite($resource, $message . PHP_EOL);
        }
    }

    protected function getLabel($level, $default = 'DEBUG')
    {
        switch ($level) {
            case \Slim\Log::FATAL:
                $label = 'FATAL';
                break;
            case \Slim\Log::ERROR:
                $label = 'ERROR';
                break;
            case \Slim\Log::WARN:
                $label = 'WARN';
                break;
            case \Slim\Log::INFO:
                $label = 'INFO';
                break;
            default:
                $label = $default;
        }

        return $label;
    }

    /**
     * Gets the file resource pointer
     *
     * @return resource
     *
     * @throws Exception
     */
    protected function getResource()
    {
        if (!$this->resource && !$this->failed) {
            $filename = date($this->settings['name_format']);

            if (!empty($this->settings['extension'])) {
                $filename .= '.' . $this->settings['extension'];
            }

            $filePath = $this->settings['path'] . DIRECTORY_SEPARATOR . $filename;
            $this->resource = @fopen($filePath, 'a');

            if (!$this->resource) {
                $this->failed = true;
                throw new Exception('Failed to write to ' . $filePath);
            }
        }

        return $this->resource;
    }

    /**
     * Creates a log with given label and message
     *
     * @param string $label
     * @param string $message
     *
     * @return string
     */
    protected function createMessage($label, $message)
    {
        $search = ['%label%', '%date%', '%message%'];
        $replace = [$label, date('c'), $message];

        return str_replace($search, $replace, $this->settings['message_format']);
    }
}
