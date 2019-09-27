<?php

/*
 * This file is part of the Monolog package.
 *
 * (c) Jordi Boggiano <j.boggiano@seld.be>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Monolog\Handler;

use Monolog\Logger;

/**
 * Sends notifications through Slack's Slackbot
 *
 * @author     Haralan Dobrev <hkdobrev@gmail.com>
 * @see        https://slack.com/apps/A0F81R8ET-slackbot
 * @deprecated According to Slack the API used on this handler it is deprecated.
 *             Therefore this handler will be removed on 2.x
 *             Slack suggests to use webhooks instead. Please contact slack for more information.
 */
class SlackbotHandler extends AbstractProcessingHandler
{
    /**
     * The slug of the Slack team
     * @var string
     */
    private $slackTeam;

    /**
     * Slackbot token
     * @var string
     */
    private $token;

    /**
     * Slack channel name
     * @var string
     */
    private $channel;

    /**
     * @param  string $slackTeam Slack team slug
     * @param  string $token     Slackbot token
     * @param  string $channel   Slack channel (encoded ID or name)
     * @param  int    $level     The minimum logging level at which this handler will be triggered
     * @param  bool   $bubble    Whether the messages that are handled can bubble up the stack or not
     */
    public function __construct($slackTeam, $token, $channel, $level = Logger::CRITICAL, $bubble = true)
    {
        @trigger_error('SlackbotHandler is deprecated and will be removed on 2.x', E_USER_DEPRECATED);
        parent::__construct($level, $bubble);

        $this->slackTeam = $slackTeam;
        $this->token = $token;
        $this->channel = $channel;
    }

    /**
     * {@inheritdoc}
     *
     * @param array $record
     */
    protected function write(array $record)
    {
        $slackbotUrl = sprintf(
            'https://%s.slack.com/services/hooks/slackbot?token=%s&channel=%s',
            $this->slackTeam,
            $this->token,
            $this->channel
        );

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $slackbotUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $record['message']);

        Curl\Util::execute($ch);
    }
}
