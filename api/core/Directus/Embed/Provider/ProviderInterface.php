<?php

namespace Directus\Embed\Provider;

interface ProviderInterface
{
    /**
     * Check whether the given URL is supported
     *
     * @param $url
     *
     * @return bool
     */
    public function validateURL($url);

    /**
     * Parse a given url
     *
     * @param $url
     *
     * @return array
     */
    public function parse($url);

    /**
     * Parse a given embed id
     *
     * @param $embedID
     *
     * @return array
     */
    public function parseID($embedID);

    /**
     * Get the provider name
     *
     * @return string
     */
    public function getName();

    /**
     * Get the provider type
     *
     * @return string
     */
    public function getProviderType();

    /**
     * Get the embed type
     *
     * @return string
     */
    public function getType();

    /**
     * Get the embed html code
     *
     * @param $data
     *
     * @return string
     */
    public function getCode($data);

    /**
     * Get the embed url
     *
     * @param $data
     *
     * @return string
     */
    public function getUrl($data);

    /**
     * Gets the embed url format
     *
     * @return string
     */
    public function getFormatUrl();
}
