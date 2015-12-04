<?php

namespace Directus\Mail;

use Directus\Mail\MailTypeInterface;

class ForgotPasswordMail implements MailTypeInterface
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
    private $subject = 'Your new Directus password';

    public function __construct($emailAddress, $newPassword)
    {
        $this->emailAddress = $emailAddress;
        $this->newPassword = $newPassword;
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
        $body = <<<EMAILBODY
Hey there,

Here is a temporary password to access Directus:

{$this->newPassword}

Once you log in, you can change your password via the User Settings menu.

Thanks!
Directus
EMAILBODY;

        return nl2br($body);
    }
}