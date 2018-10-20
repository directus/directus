<?php

namespace Directus\Mail\Transports;

class SmtpTransport extends AbstractTransport
{
    /**
     * @var \Swift_SmtpTransport
     */
    protected $smtp;

    /**
     * @inheritdoc
     */
    public function send(\Swift_Mime_Message $message, &$failedRecipients = null)
    {
        return $this->getSmtp()->send($message, $failedRecipients);
    }

    /**
     * @return \Swift_SmtpTransport
     */
    public function getSmtp()
    {
        if (!$this->smtp) {
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

        return $this->smtp;
    }
}
