<?php

namespace Directus\Mail;

use Clousure;
use Directus\Bootstrap;
use Directus\Util\ArrayUtils;
use InvalidArgumentException;
use Swift_Message;

class Mail
{
    protected $mailer = null;
    protected $settings = [];

    public function __construct($mailer, $settings = [])
    {
        $this->mailer = $mailer;
        $this->settings = $settings;
    }

    public function sendMessage($message)
    {
        $this->mailer->send($message);
    }

    public function getViewContent($viewPath, $data)
    {
        $app = Bootstrap::get('app');

        ob_start();
        $data = array_merge(['settings' => $this->settings], $data);
        $app->render($viewPath, $data);

        return ob_get_clean();
    }

    public static function send($viewPath, $data, $callback)
    {
        $config = Bootstrap::get('config');
        $mailer = Bootstrap::get('mailer');
        if (!$mailer) {
            throw new InvalidArgumentException(__t('mail_configuration_no_defined'));
        }

        $DirectusSettingsTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_settings', Bootstrap::get('zendDb'));
        $rowSet = $DirectusSettingsTableGateway->select();

        $settings = [];
        foreach ($rowSet as $setting) {
            $settings[$setting['collection']][$setting['name']] = $setting['value'];
        }

        $instance = new static($mailer, $settings);

        $message = Swift_Message::newInstance();

        // default mail from address
        $mailConfig = $config['mail'];
        $message->setFrom($mailConfig['from']);

        $bcc = ArrayUtils::get($mailConfig, 'bcc', null);
        if ($bcc !== null) {
            $message->setBcc($bcc);
        }

        $cc =  ArrayUtils::get($mailConfig, 'cc', null);
        if ($cc !== null) {
            $message->setCc($cc);
        }

        call_user_func($callback, $message);

        if ($message->getBody() == null) {
            // Slim Extras View twig act weird on this version
            $viewContent = $instance->getViewContent($viewPath, $data);
            $message->setBody($viewContent, 'text/html');
        }

        file_put_contents('email-' . time() . '.html', $message->getBody());

        $instance->sendMessage($message);
    }
}
