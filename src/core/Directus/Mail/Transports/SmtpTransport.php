<?php

namespace Directus\Mail\Transports;

class SmtpTransport extends AbstractTransport
{
    /**
     * @var \Swift_SmtpTransport
     */
    protected $smtp;

    /**
     * @return \Swift_SmtpTransport
     */
    public function getSwiftTransport()
    {
        if (!$this->smtp) {
            $transport = \Swift_SmtpTransport::newInstance(
                $this->config->get('host', 'localhost'),
                $this->config->get('port', 25)
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
