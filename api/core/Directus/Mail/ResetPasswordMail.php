<?php

namespace Directus\Mail;

use Directus\Bootstrap;
use Directus\Mail\MailTypeInterface;

class ResetPasswordMail implements MailTypeInterface
{
    /**
     * @var String
     */
    private $emailAddress;

    /**
     * @var String
     */
    private $newPassword;

    /**
     * Custom email Headers
     *
     * @var Array
     */
    private $headers = array();

    /**
     * @var String
     */
    private $subject = 'You Reset Your Directus Password';

    public function __construct($emailAddress, $resetToken)
    {
        // @todo: move this. global config object
        $DirectusSettingsTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_settings', Bootstrap::get('zendDb'));
        $rowSet = $DirectusSettingsTableGateway->select();
        foreach ($rowSet as $setting) {
            $this->settings[$setting['collection']][$setting['name']] = $setting['value'];
        }

        $this->emailAddress = $emailAddress;
        $this->resetToken = $resetToken;
    }

    public function getEmailAddress()
    {
        return $this->emailAddress;
    }

    public function getHeaders()
    {
        return $this->headers;
    }

    public function getSubject()
    {
        return $this->subject;
    }

    public function getBody()
    {
        $resetURL = $this->settings["global"]["project_url"].'api/1/auth/reset-password/'.$this->resetToken;
        $body = <<<EMAILBODY
Hey there,

You requested to reset your password, here is your reset password link:

<a href="{$resetURL}">{$resetURL}</a>

Thanks!
Directus
EMAILBODY;

        return nl2br($body);
    }
}