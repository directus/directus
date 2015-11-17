<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\Hydrator\Aggregate;


use Zend\EventManager\Event;

/**
 * Event triggered when the {@see \Zend\Stdlib\Hydrator\Aggregate\AggregateHydrator} extracts
 * data from an object
 */
class ExtractEvent extends Event
{
    const EVENT_EXTRACT = 'extract';

    /**
     * {@inheritDoc}
     */
    protected $name = self::EVENT_EXTRACT;

    /**
     * @var object
     */
    protected $extractionObject;

    /**
     * @var array
     */
    protected $extractedData = array();

    /**
     * @param object $target
     * @param object $extractionObject
     */
    public function __construct($target, $extractionObject)
    {
        $this->target           = $target;
        $this->extractionObject = $extractionObject;
    }

    /**
     * Retrieves the object from which data is extracted
     *
     * @return object
     */
    public function getExtractionObject()
    {
        return $this->extractionObject;
    }

    /**
     * @param object $extractionObject
     *
     * @return void
     */
    public function setExtractionObject($extractionObject)
    {
        $this->extractionObject = $extractionObject;
    }

    /**
     * Retrieves the data that has been extracted
     *
     * @return array
     */
    public function getExtractedData()
    {
        return $this->extractedData;
    }

    /**
     * @param array $extractedData
     *
     * @return void
     */
    public function setExtractedData(array $extractedData)
    {
        $this->extractedData = $extractedData;
    }

    /**
     * Merge provided data with the extracted data
     *
     * @param array $additionalData
     *
     * @return void
     */
    public function mergeExtractedData(array $additionalData)
    {
        $this->extractedData = array_merge($this->extractedData, $additionalData);
    }
}
