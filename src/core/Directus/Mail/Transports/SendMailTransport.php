<?php

namespace Directus\Mail\Transports;

use Directus\Collection\Collection;

class SendMailTransport extends AbstractTransport
{
    /**
     * @var \Swift_SendmailTransport
     */
    protected $sendmail;

    public function __construct(array $config = [])
    {
        $this->config = new Collection($config);

        $this->sendmail = \Swift_SendmailTransport::newInstance($this->config->get('sendmail'));
    }

    /**
     * @inheritdoc
     */
    public function send(\Swift_Mime_Message $message, &$failedRecipients = null)
    {
        return $this->sendmail->send($message, &$failedRecipients);
    }
}
