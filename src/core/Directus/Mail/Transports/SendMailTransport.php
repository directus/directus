<?php

namespace Directus\Mail\Transports;

class SendMailTransport extends AbstractTransport
{
    /**
     * @var \Swift_SendmailTransport
     */
    protected $sendmail;

    /**
     * @return \Swift_SendmailTransport
     */
    public function getSwiftTransport()
    {
        if (!$this->sendmail) {
            $command = $this->config->get('sendmail');

            if ($command) {
                $this->sendmail = \Swift_SendmailTransport::newInstance($command);
            } else {
                $this->sendmail = \Swift_SendmailTransport::newInstance();
            }
        }

        return $this->sendmail;
    }
}
