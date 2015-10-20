<?php

namespace Directus\Mail;

use Directus\Mail\MailTypeInterface;

class NotificationMail implements MailTypeInterface
{
    /**
     * @var String
     */
    private $emailAddress;

    /**
     * @var String
     */
    private $message;

    /**
     * Custom email Headers
     * 
     * @var Array
     */
    private $headers = array();

    /**
     * @var String
     */
    private $subject;

    /**
     * Notification type
     * 
     * @var Integer
     */
    const TYPE_MESSAGE = 1;
    const TYPE_COMMENT = 2;

    public function __construct($emailAddress, $subject, $message, $type = 0)
    {
        $this->emailAddress = $emailAddress;
        $this->subject = $subject;
        $this->message = $message;
    }

    public function getBody()
    {
        // @todo: message should not be the exact message
        // it should say something letting the user know there was a new notification
        return $this->message;
    }

    public function getSubject()
    {
        return $this->subject;
    }

    public function getHeaders()
    {
        return $this->headers;
    }

    public function getEmailAddress()
    {
        return $this->emailAddress;
    }
}