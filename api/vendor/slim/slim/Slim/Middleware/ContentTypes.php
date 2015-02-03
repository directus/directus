<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.2.0
 * @package     Slim
 *
 * MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
namespace Slim\Middleware;

 /**
  * Content Types
  *
  * This is middleware for a Slim application that intercepts
  * the HTTP request body and parses it into the appropriate
  * PHP data structure if possible; else it returns the HTTP
  * request body unchanged. This is particularly useful
  * for preparing the HTTP request body for an XML or JSON API.
  *
  * @package    Slim
  * @author     Josh Lockhart
  * @since      1.6.0
  */
class ContentTypes extends \Slim\Middleware
{
    /**
     * @var array
     */
    protected $contentTypes;

    /**
     * Constructor
     * @param array $settings
     */
    public function __construct($settings = array())
    {
        $this->contentTypes = array_merge(array(
            'application/json' => array($this, 'parseJson'),
            'application/xml' => array($this, 'parseXml'),
            'text/xml' => array($this, 'parseXml'),
            'text/csv' => array($this, 'parseCsv')
        ), $settings);
    }

    /**
     * Call
     */
    public function call()
    {
        $mediaType = $this->app->request()->getMediaType();
        if ($mediaType) {
            $env = $this->app->environment();
            $env['slim.input_original'] = $env['slim.input'];
            $env['slim.input'] = $this->parse($env['slim.input'], $mediaType);
        }
        $this->next->call();
    }

    /**
     * Parse input
     *
     * This method will attempt to parse the request body
     * based on its content type if available.
     *
     * @param  string $input
     * @param  string $contentType
     * @return mixed
     */
    protected function parse ($input, $contentType)
    {
        if (isset($this->contentTypes[$contentType]) && is_callable($this->contentTypes[$contentType])) {
            $result = call_user_func($this->contentTypes[$contentType], $input);
            if ($result) {
                return $result;
            }
        }

        return $input;
    }

    /**
     * Parse JSON
     *
     * This method converts the raw JSON input
     * into an associative array.
     *
     * @param  string       $input
     * @return array|string
     */
    protected function parseJson($input)
    {
        if (function_exists('json_decode')) {
            $result = json_decode($input, true);
            if ($result) {
                return $result;
            }
        }
    }

    /**
     * Parse XML
     *
     * This method creates a SimpleXMLElement
     * based upon the XML input. If the SimpleXML
     * extension is not available, the raw input
     * will be returned unchanged.
     *
     * @param  string                  $input
     * @return \SimpleXMLElement|string
     */
    protected function parseXml($input)
    {
        if (class_exists('SimpleXMLElement')) {
            try {
                return new \SimpleXMLElement($input);
            } catch (\Exception $e) {
                // Do nothing
            }
        }

        return $input;
    }

    /**
     * Parse CSV
     *
     * This method parses CSV content into a numeric array
     * containing an array of data for each CSV line.
     *
     * @param  string $input
     * @return array
     */
    protected function parseCsv($input)
    {
        $temp = fopen('php://memory', 'rw');
        fwrite($temp, $input);
        fseek($temp, 0);
        $res = array();
        while (($data = fgetcsv($temp)) !== false) {
            $res[] = $data;
        }
        fclose($temp);

        return $res;
    }
}
