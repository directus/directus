<?php

namespace Directus\Mail\Transports;

use Directus\Collection\Collection;

class SmtpTransport extends AbstractTransport
{
    /**
     * @var \Swift_SmtpTransport
     */
    protected $smtp;

    public function __construct(array $config = [])
    {
        $this->config = new Collection($config);
        $transport = \Swift_SmtpTransport::newInstance(
            $this->config->get('host'),
            $this->config->get('port')
        );

        if ($this->config->has('username')) {
            $transport->setUsername($this->config->get('username'));
        }

        if ($this->config->has('password')) {
            $transport->setPassword($this->config->get('password'));
        }

        if ($this->config->has('encryption')) {
            $transport->setEncryption($this->config->get('encryption'));
        }

        $this->smtp = $transport;
    }

    /**
     * @inheritdoc
     */
    public function send(\Swift_Mime_Message $message, &$failedRecipients = null)
    {
        return $this->smtp->send($message, &$failedRecipients);
    }
}
