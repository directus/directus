<?php

namespace Directus;

if (!function_exists('request_get_contents')) {
    /**
     * Get content from an URL
     *
     * @param $url
     * @param $headers
     *
     * @return mixed
     */
    function request_get_contents($url, array $headers = [])
    {
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_URL, $url);

        if ($headers) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }

        $result = curl_exec($ch);
        curl_close($ch);

        return $result;
    }
}

if (!function_exists('request_get_json')) {
    /**
     * Get json from an url
     *
     * @param $url
     * @param array $headers
     *
     * @return mixed
     */
    function request_get_json($url, array $headers = [])
    {
        $content = request_get_contents($url, array_merge(['Content-Type: application/json'], $headers));

        return json_decode($content, true);
    }
}

if (!function_exists('request_send')) {
    /**
     * Make a request
     *
     * @param string $method
     * @param string $url
     * @param mixed $body
     * @param array $params
     * @param array $headers
     *
     * @return mixed
     */
    function request_send($method, $url, $body, array $params = [], array $headers = [])
    {
        $ch = curl_init();

        if ($params) {
            $url .= '?' . http_build_query($params);
        }

        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);

        if ($headers) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }

        $result = curl_exec($ch);
        curl_close($ch);

        return $result;
    }
}

if (!function_exists('request_send_json')) {
    /**
     * Make a request with a json body
     *
     * @param string $method
     * @param string $url
     * @param mixed $body
     * @param array $params
     * @param array $headers
     *
     * @return mixed
     */
    function request_send_json($method, $url, $body, array $params = [], array $headers = [])
    {
        $headers = array_merge($headers, ['Content-Type: application/json']);

        if (!is_string($body)) {
            $body = json_encode($body);
        }

        return request_send($method, $url, $body, $params, $headers);
    }
}
