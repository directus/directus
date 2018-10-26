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

use Monolog\Formatter\FormatterInterface;
use Monolog\Logger;
use Monolog\Handler\Slack\SlackRecord;

/**
 * Sends notifications through Slack API
 *
 * @author Greg Kedzierski <greg@gregkedzierski.com>
 * @see    https://api.slack.com/
 */
class SlackHandler extends SocketHandler
{
    /**
     * Slack API token
     * @var string
     */
    private $token;

    /**
     * Instance of the SlackRecord util class preparing data for Slack API.
     * @var SlackRecord
     */
    private $slackRecord;

    /**
     * @param  string                    $token                  Slack API token
     * @param  string                    $channel                Slack channel (encoded ID or name)
     * @param  string|null               $username               Name of a bot
     * @param  bool                      $useAttachment          Whether the message should be added to Slack as attachment (plain text otherwise)
     * @param  string|null               $iconEmoji              The emoji name to use (or null)
     * @param  int                       $level                  The minimum logging level at which this handler will be triggered
     * @param  bool                      $bubble                 Whether the messages that are handled can bubble up the stack or not
     * @param  bool                      $useShortAttachment     Whether the the context/extra messages added to Slack as attachments are in a short style
     * @param  bool                      $includeContextAndExtra Whether the attachment should include context and extra data
     * @param  array                     $excludeFields          Dot separated list of fields to exclude from slack message. E.g. ['context.field1', 'extra.field2']
     * @throws MissingExtensionException If no OpenSSL PHP extension configured
     */
    public function __construct($token, $channel, $username = null, $useAttachment = true, $iconEmoji = null, $level = Logger::CRITICAL, $bubble = true, $useShortAttachment = false, $includeContextAndExtra = false, array $excludeFields = array())
    {
        if (!extension_loaded('openssl')) {
            throw new MissingExtensionException('The OpenSSL PHP extension is required to use the SlackHandler');
        }

        parent::__construct('ssl://slack.com:443', $level, $bubble);

        $this->slackRecord = new SlackRecord(
            $channel,
            $username,
            $useAttachment,
            $iconEmoji,
            $useShortAttachment,
            $includeContextAndExtra,
            $excludeFields,
            $this->formatter
        );

        $this->token = $token;
    }

    public function getSlackRecord()
    {
        return $this->slackRecord;
    }

    /**
     * {@inheritdoc}
     *
     * @param  array  $record
     * @return string
     */
    protected function generateDataStream($record)
    {
        $content = $this->buildContent($record);

        return $this->buildHeader($content) . $content;
    }

    /**
     * Builds the body of API call
     *
     * @param  array  $record
     * @return string
     */
    private function buildContent($record)
    {
        $dataArray = $this->prepareContentData($record);

        return http_build_query($dataArray);
    }

    /**
     * Prepares content data
     *
     * @param  array $record
     * @return array
     */
    protected function prepareContentData($record)
    {
        $dataArray = $this->slackRecord->getSlackData($record);
        $dataArray['token'] = $this->token;

        if (!empty($dataArray['attachments'])) {
            $dataArray['attachments'] = json_encode($dataArray['attachments']);
        }

        return $dataArray;
    }

    /**
     * Builds the header of the API Call
     *
     * @param  string $content
     * @return string
     */
    private function buildHeader($content)
    {
        $header = "POST /api/chat.postMessage HTTP/1.1\r\n";
        $header .= "Host: slack.com\r\n";
        $header .= "Content-Type: application/x-www-form-urlencoded\r\n";
        $header .= "Content-Length: " . strlen($content) . "\r\n";
        $header .= "\r\n";

        return $header;
    }

    /**
     * {@inheritdoc}
     *
     * @param array $record
     */
    protected function write(array $record)
    {
        parent::write($record);
        $this->finalizeWrite();
    }

    /**
     * Finalizes the request by reading some bytes and then closing the socket
     *
     * If we do not read some but close the socket too early, slack sometimes
     * drops the request entirely.
     */
    protected function finalizeWrite()
    {
        $res = $this->getResource();
        if (is_resource($res)) {
            @fread($res, 2048);
        }
        $this->closeSocket();
    }

    /**
     * Returned a Slack message attachment color associated with
     * provided level.
     *
     * @param  int    $level
     * @return string
     * @deprecated Use underlying SlackRecord instead
     */
    protected function getAttachmentColor($level)
    {
        trigger_error(
            'SlackHandler::getAttachmentColor() is deprecated. Use underlying SlackRecord instead.',
            E_USER_DEPRECATED
        );

        return $this->slackRecord->getAttachmentColor($level);
    }

    /**
     * Stringifies an array of key/value pairs to be used in attachment fields
     *
     * @param  array  $fields
     * @return string
     * @deprecated Use underlying SlackRecord instead
     */
    protected function stringify($fields)
    {
        trigger_error(
            'SlackHandler::stringify() is deprecated. Use underlying SlackRecord instead.',
            E_USER_DEPRECATED
        );

        return $this->slackRecord->stringify($fields);
    }

    public function setFormatter(FormatterInterface $formatter)
    {
        parent::setFormatter($formatter);
        $this->slackRecord->setFormatter($formatter);

        return $this;
    }

    public function getFormatter()
    {
        $formatter = parent::getFormatter();
        $this->slackRecord->setFormatter($formatter);

        return $formatter;
    }
}
