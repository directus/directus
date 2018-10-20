<?php

namespace Directus\Mail\Transports;

class SendMailTransport extends AbstractTransport
{
    /**
     * @var \Swift_SendmailTransport
     */
    protected $sendmail;

    /**
     * @inheritdoc
     */
    public function send(\Swift_Mime_Message $message, &$failedRecipients = null)
    {
        return $this->getSendmail()->send($message, $failedRecipients);
    }

    /**
     * @return \Swift_SendmailTransport
     */
    protected function getSendmail()
    {
        if (!$this->sendmail) {
            $this->sendmail = \Swift_SendmailTransport::newInstance($this->config->get('sendmail'));
        }

        return $this->sendmail;
    }
}
