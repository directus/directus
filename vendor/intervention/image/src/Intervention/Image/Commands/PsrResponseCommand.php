<?php

namespace Intervention\Image\Commands;

use GuzzleHttp\Psr7\Response;

class PsrResponseCommand extends AbstractCommand
{
    /**
     * Builds PSR7 compatible response. May replace "response" command in
     * some future.
     *
     * Method will generate binary stream and put it inside PSR-7
     * ResponseInterface. Following code can be optimized using native php
     * streams and more "clean" streaming, however drivers has to be updated
     * first.
     *
     * @param  \Intervention\Image\Image $image
     * @return boolean
     */
    public function execute($image)
    {
        $format = $this->argument(0)->value();
        $quality = $this->argument(1)->between(0, 100)->value();

        //Encoded property will be populated at this moment
        $stream = $image->stream($format, $quality);

        $mimetype = finfo_buffer(
            finfo_open(FILEINFO_MIME_TYPE),
            $image->getEncoded()
        );

        $this->setOutput(new Response(
            200,
            array(
                'Content-Type'   => $mimetype,
                'Content-Length' => strlen($image->getEncoded())
            ),
            $stream
        ));

        return true;
    }
}