<?php

namespace Directus\Mail\Transports;

use Directus\Collection\Collection;
use Swift_Mime_Message;

class SimpleFileTransport extends AbstractTransport
{
    /**
     * @var Collection
     */
    protected $config;

    public function __construct(array $config = [])
    {
        $this->config = new Collection($config);
    }

    /**
     * @inheritdoc
     */
    public function send(Swift_Mime_Message $message, &$failedRecipients = null)
    {
        $path = rtrim($this->config->get('path', ''), '/') . '/' . time() . '.txt';
        $message = [
            implode(', ', array_keys($message->getTo())),
            $message->getSubject(),
            $message->getBody()
        ];

        file_put_contents($path, implode("\n", $message));
    }
}
