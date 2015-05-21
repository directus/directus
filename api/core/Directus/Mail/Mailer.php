<?php

namespace Directus\Mail;

use Directus\Bootstrap;

class Mailer extends \PHPMailer
{
    /**
     * Mail headers
     *
     * @var array
     */
    private $headers = array();

    /**
     * Directus settings
     *
     * @var array
     */
    private $settings = array();

    public function __construct(MailTypeInterface $mail = null)
    {
        parent::__construct(false);

        // @todo: global config object
        $DirectusSettingsTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_settings', Bootstrap::get('zendDb'));
        $rowSet = $DirectusSettingsTableGateway->select();
        foreach ($rowSet as $setting) {
            $this->settings[$setting['collection']][$setting['name']] = $setting['value'];
        }

        if ($mail !== null) {
            $this->parseMailObject($mail);
        }

        $this->setFrom('noreply@getdirectus.com', 'Directus');
        $this->addReplyTo('noreply@getdirectus.com', 'No Reply');

        $this->headers[] = 'X-Mailer: PHP/' . phpversion();
        $this->headers[] = 'MIME-Version: 1.0';
        $this->headers[] = 'Content-type: text/html; charset=utf8';
    }

    public function setSubject($subject)
    {
        $this->Subject = $subject;
    }

    public function setBody($body)
    {
        $body = $this->getBodyHeader() . $body . $this->getBodyFooter();
        $this->msgHTML($body);
        $this->AltBody = $body;
    }

    public function setHeaders($headers = array())
    {
        $headers = array_merge($headers, $this->headers);
        foreach($headers as $header) {
            $this->addCustomHeader($header);
        }
    }

    public function setEmailAddress($emailAddress)
    {
        if (is_string($emailAddress)) {
            $emailAddress = array($emailAddress);
        }

        foreach($emailAddress as $email) {
            $this->addAddress($email);
        }
    }

    private function parseMailObject($mailObject)
    {
        $this->setSubject($mailObject->getSubject());
        $this->setBody($mailObject->getBody());
        $this->setHeaders($mailObject->getHeaders());
        $this->setEmailAddress($mailObject->getEmailAddress());
    }

    private function getBodyHeader()
    {
        $header = "";

        return nl2br($header);
    }

    private function getBodyFooter()
    {
        $loginUrl = DIRECTUS_PATH . 'login.php';
        $projectTitle = $this->settings['global']['site_name'];
        $projectUrl = $this->settings['global']['site_url'];

        $footer = "\n
            --- \n
            This email was sent by Directus – <a href=\"{$projectUrl}\">{$projectTitle}</a> \n
            <a href=\"{$loginUrl}\">Log in</a> to manage your email preferences \n";
    
        return nl2br($footer);
    }
}