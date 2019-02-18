<?php

namespace Directus\Embed\Provider;

use Directus\Util\StringUtils;

abstract class AbstractProvider implements ProviderInterface
{
    /**
     * Embed Service name
     * @var string
     */
    protected $name = 'unknown';

    /**
     * Files Config
     * @var array
     */
    protected $config = [];

    /**
     * AbstractProvider constructor.
     * @param array $config
     */
    public function __construct(array $config = [])
    {
        $this->config = $config;
    }

    /**
     * Parse a given URL
     * @param $url
     * @return mixed
     */
    public function parse($url)
    {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new \InvalidArgumentException('Invalid or unsupported URL');
        }

        if (!$this->validateURL($url)) {
            throw new \InvalidArgumentException(
                sprintf('URL: "%s" cannot be parsed by "%s"', $url, get_class($this))
            );
        }

        $embedID = $this->parseURL($url);

        return $this->parseID($embedID);
    }

    /**
     * Get the embed provider name
     * @return string
     */
    public function getName()
    {
        return strtolower($this->name);
    }

    /**
     * Get the embed type
     * @return string
     */
    public function getType()
    {
        return 'embed/' . $this->getName();
    }

    /**
     * @inheritDoc
     */
    public function getCode($data)
    {
        return StringUtils::replacePlaceholder($this->getFormatTemplate(), $data);
    }

    /**
     * @inheritdoc
     */
    public function getUrl($data)
    {
        return StringUtils::replacePlaceholder($this->getFormatUrl(), $data);
    }

    /**
     * Get the HTML embed format template
     * @return mixed
     */
    protected function getFormatTemplate()
    {
        return '';
    }

    /**
     * Parse an embed ID
     * @param $embedID
     * @return array
     */
    public function parseID($embedID)
    {
        $defaultInfo = [
            'embed' => $embedID,
            'filesize' => 0,
            'filename' => $this->getName() . '_' . $embedID . '.jpg',
            'type' => $this->getType()
        ];

        $info = array_merge($defaultInfo, $this->fetchInfo($embedID));
        $info['html'] = $this->getCode($info);

        return $info;
    }

    /**
     * Returns the default embed title
     *
     * @param mixed $id
     *
     * @return string
     */
    protected function getDefaultTitle($id)
    {
        return sprintf('%s - %s', $this->name, $id);
    }

    /**
     * Get the provider type
     * @return mixed
     */
    abstract public function getProviderType();

    /**
     * Parsing the url and returning the provider ID
     * This is a method use for the extended class
     * @param $url
     * @return string
     * @throws \Exception
     */
    abstract protected function parseURL($url);

    /**
     * Fetch the embed information
     * @param $embedID
     * @return array
     */
    abstract protected function fetchInfo($embedID);
}
