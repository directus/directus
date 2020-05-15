<?php

namespace Directus\Mail;

use Directus\Collection\Collection;
use function Directus\get_api_project_from_request;

class Mailer
{
    /**
     * @var TransportManager
     */
    protected $transports;

    /**
     * @var \Swift_Mailer[]
     */
    protected $mailers = [];

    public function __construct(TransportManager $transportManager)
    {
        $this->transports = $transportManager;
    }

    /**
     * Creates a new message instance
     *
     * @return Message
     */
    public function createMessage()
    {
        return new Message();
    }

    public function sendWithTemplate($view, array $data, \Closure $callback = null)
    {
        $content = \Directus\parse_twig($view, array_merge(
            $data,
            ['api' => ['project' => get_api_project_from_request()]]
        ));

        $this->sendWithContent($content, 'text/html', $callback);
    }

    public function sendWithContent($content, $contentType = 'text/html', \Closure $callback = null)
    {
        $transport = $this->transports->getDefault();
        $message = $this->createMessage();

        // Get global information
        $config = new Collection($this->transports->getDefaultConfig());
        if ($config->has('from')) {
            $message->setFrom($config->get('from'));
        }

        if ($config->has('bcc')) {
            $message->setBcc($config->get('bcc'));
        }

        if ($config->has('cc')) {
            $message->setCc($config->get('cc'));
        }

        $message->setBody($content, $contentType);

        if ($callback) {
            call_user_func($callback, $message);
        }

        $transportId = get_class($transport);
        if (!array_key_exists($transportId, $this->mailers)) {
            $this->mailers[$transportId] = new \Swift_Mailer($transport->getSwiftTransport());
        }

        $swiftMailer = $this->mailers[$transportId];
        $swiftMailer->send($message);
    }
}
