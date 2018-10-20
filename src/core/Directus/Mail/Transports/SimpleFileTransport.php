<?php

namespace Directus\Mail\Transports;

use Swift_Mime_Message;

class SimpleFileTransport extends AbstractTransport
{
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
