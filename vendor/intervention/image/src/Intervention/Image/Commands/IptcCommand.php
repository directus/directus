<?php

namespace Intervention\Image\Commands;

use Intervention\Image\Exception\NotSupportedException;

class IptcCommand extends AbstractCommand
{
    /**
     * Read Iptc data from the given image
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        if ( ! function_exists('iptcparse')) {
            throw new NotSupportedException(
                "Reading Iptc data is not supported by this PHP installation."
            );
        }

        $key = $this->argument(0)->value();

        $info = [];
        @getimagesize($image->dirname .'/'. $image->basename, $info);

        $data = [];

        if (array_key_exists('APP13', $info)) {
            $iptc = iptcparse($info['APP13']);

            if (is_array($iptc)) {
                $data['DocumentTitle'] = isset($iptc["2#005"][0]) ? $iptc["2#005"][0] : null;
                $data['Urgency'] = isset($iptc["2#010"][0]) ? $iptc["2#010"][0] : null;
                $data['Category'] = isset($iptc["2#015"][0]) ? $iptc["2#015"][0] : null;
                $data['Subcategories'] = isset($iptc["2#020"][0]) ? $iptc["2#020"][0] : null;
                $data['Keywords'] = isset($iptc["2#025"][0]) ? $iptc["2#025"] : null;
                $data['SpecialInstructions'] = isset($iptc["2#040"][0]) ? $iptc["2#040"][0] : null;
                $data['CreationDate'] = isset($iptc["2#055"][0]) ? $iptc["2#055"][0] : null;
                $data['CreationTime'] = isset($iptc["2#060"][0]) ? $iptc["2#060"][0] : null;
                $data['AuthorByline'] = isset($iptc["2#080"][0]) ? $iptc["2#080"][0] : null;
                $data['AuthorTitle'] = isset($iptc["2#085"][0]) ? $iptc["2#085"][0] : null;
                $data['City'] = isset($iptc["2#090"][0]) ? $iptc["2#090"][0] : null;
                $data['SubLocation'] = isset($iptc["2#092"][0]) ? $iptc["2#092"][0] : null;
                $data['State'] = isset($iptc["2#095"][0]) ? $iptc["2#095"][0] : null;
                $data['Country'] = isset($iptc["2#101"][0]) ? $iptc["2#101"][0] : null;
                $data['OTR'] = isset($iptc["2#103"][0]) ? $iptc["2#103"][0] : null;
                $data['Headline'] = isset($iptc["2#105"][0]) ? $iptc["2#105"][0] : null;
                $data['Source'] = isset($iptc["2#110"][0]) ? $iptc["2#110"][0] : null;
                $data['PhotoSource'] = isset($iptc["2#115"][0]) ? $iptc["2#115"][0] : null;
                $data['Copyright'] = isset($iptc["2#116"][0]) ? $iptc["2#116"][0] : null;
                $data['Caption'] = isset($iptc["2#120"][0]) ? $iptc["2#120"][0] : null;
                $data['CaptionWriter'] = isset($iptc["2#122"][0]) ? $iptc["2#122"][0] : null;
            }
        }

        if (! is_null($key) && is_array($data)) {
            $data = array_key_exists($key, $data) ? $data[$key] : false;
        }

        $this->setOutput($data);

        return true;
    }
}
