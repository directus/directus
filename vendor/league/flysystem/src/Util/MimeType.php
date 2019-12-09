<?php

namespace League\Flysystem\Util;

use ErrorException;
use finfo;

/**
 * @internal
 */
class MimeType
{
    protected static $extensionToMimeTypeMap = [
        'hqx' => 'application/mac-binhex40',
        'cpt' => 'application/mac-compactpro',
        'csv' => 'text/csv',
        'bin' => 'application/octet-stream',
        'dms' => 'application/octet-stream',
        'lha' => 'application/octet-stream',
        'lzh' => 'application/octet-stream',
        'exe' => 'application/octet-stream',
        'class' => 'application/octet-stream',
        'psd' => 'application/x-photoshop',
        'so' => 'application/octet-stream',
        'sea' => 'application/octet-stream',
        'dll' => 'application/octet-stream',
        'oda' => 'application/oda',
        'pdf' => 'application/pdf',
        'ai' => 'application/pdf',
        'eps' => 'application/postscript',
        'epub' => 'application/epub+zip',
        'ps' => 'application/postscript',
        'smi' => 'application/smil',
        'smil' => 'application/smil',
        'mif' => 'application/vnd.mif',
        'xls' => 'application/vnd.ms-excel',
        'xlt' => 'application/vnd.ms-excel',
        'xla' => 'application/vnd.ms-excel',
        'ppt' => 'application/powerpoint',
        'pot' => 'application/vnd.ms-powerpoint',
        'pps' => 'application/vnd.ms-powerpoint',
        'ppa' => 'application/vnd.ms-powerpoint',
        'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'potx' => 'application/vnd.openxmlformats-officedocument.presentationml.template',
        'ppsx' => 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
        'ppam' => 'application/vnd.ms-powerpoint.addin.macroEnabled.12',
        'pptm' => 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
        'potm' => 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
        'ppsm' => 'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
        'wbxml' => 'application/wbxml',
        'wmlc' => 'application/wmlc',
        'dcr' => 'application/x-director',
        'dir' => 'application/x-director',
        'dxr' => 'application/x-director',
        'dvi' => 'application/x-dvi',
        'gtar' => 'application/x-gtar',
        'gz' => 'application/x-gzip',
        'gzip' => 'application/x-gzip',
        'php' => 'application/x-httpd-php',
        'php4' => 'application/x-httpd-php',
        'php3' => 'application/x-httpd-php',
        'phtml' => 'application/x-httpd-php',
        'phps' => 'application/x-httpd-php-source',
        'js' => 'application/javascript',
        'swf' => 'application/x-shockwave-flash',
        'sit' => 'application/x-stuffit',
        'tar' => 'application/x-tar',
        'tgz' => 'application/x-tar',
        'z' => 'application/x-compress',
        'xhtml' => 'application/xhtml+xml',
        'xht' => 'application/xhtml+xml',
        'rdf' => 'application/rdf+xml',
        'zip' => 'application/x-zip',
        'rar' => 'application/x-rar',
        'mid' => 'audio/midi',
        'midi' => 'audio/midi',
        'mpga' => 'audio/mpeg',
        'mp2' => 'audio/mpeg',
        'mp3' => 'audio/mpeg',
        'aif' => 'audio/x-aiff',
        'aiff' => 'audio/x-aiff',
        'aifc' => 'audio/x-aiff',
        'ram' => 'audio/x-pn-realaudio',
        'rm' => 'audio/x-pn-realaudio',
        'rpm' => 'audio/x-pn-realaudio-plugin',
        'ra' => 'audio/x-realaudio',
        'rv' => 'video/vnd.rn-realvideo',
        'wav' => 'audio/x-wav',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'jpe' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'bmp' => 'image/bmp',
        'tiff' => 'image/tiff',
        'tif' => 'image/tiff',
        'svg' => 'image/svg+xml',
        'css' => 'text/css',
        'html' => 'text/html',
        'htm' => 'text/html',
        'shtml' => 'text/html',
        'txt' => 'text/plain',
        'text' => 'text/plain',
        'log' => 'text/plain',
        'rtx' => 'text/richtext',
        'rtf' => 'text/rtf',
        'xml' => 'application/xml',
        'xsl' => 'application/xml',
        'dmn' => 'application/octet-stream',
        'bpmn' => 'application/octet-stream',
        'mpeg' => 'video/mpeg',
        'mpg' => 'video/mpeg',
        'mpe' => 'video/mpeg',
        'qt' => 'video/quicktime',
        'mov' => 'video/quicktime',
        'avi' => 'video/x-msvideo',
        'movie' => 'video/x-sgi-movie',
        'doc' => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'docm' => 'application/vnd.ms-word.template.macroEnabled.12',
        'dotm' => 'application/vnd.ms-word.template.macroEnabled.12',
        'dot' => 'application/msword',
        'dotx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
        'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'xltx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
        'xlsm' => 'application/vnd.ms-excel.sheet.macroEnabled.12',
        'xltm' => 'application/vnd.ms-excel.template.macroEnabled.12',
        'xlam' => 'application/vnd.ms-excel.addin.macroEnabled.12',
        'xlsb' => 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
        'word' => 'application/msword',
        'xl' => 'application/excel',
        'eml' => 'message/rfc822',
        'json' => 'application/json',
        'pem' => 'application/x-x509-user-cert',
        'p10' => 'application/x-pkcs10',
        'p12' => 'application/x-pkcs12',
        'p7a' => 'application/x-pkcs7-signature',
        'p7c' => 'application/pkcs7-mime',
        'p7m' => 'application/pkcs7-mime',
        'p7r' => 'application/x-pkcs7-certreqresp',
        'p7s' => 'application/pkcs7-signature',
        'crt' => 'application/x-x509-ca-cert',
        'crl' => 'application/pkix-crl',
        'der' => 'application/x-x509-ca-cert',
        'kdb' => 'application/octet-stream',
        'pgp' => 'application/pgp',
        'gpg' => 'application/gpg-keys',
        'sst' => 'application/octet-stream',
        'csr' => 'application/octet-stream',
        'rsa' => 'application/x-pkcs7',
        'cer' => 'application/pkix-cert',
        '3g2' => 'video/3gpp2',
        '3gp' => 'video/3gp',
        'mp4' => 'video/mp4',
        'm4a' => 'audio/x-m4a',
        'f4v' => 'video/mp4',
        'webm' => 'video/webm',
        'aac' => 'audio/x-acc',
        'm4u' => 'application/vnd.mpegurl',
        'm3u' => 'text/plain',
        'xspf' => 'application/xspf+xml',
        'vlc' => 'application/videolan',
        'wmv' => 'video/x-ms-wmv',
        'au' => 'audio/x-au',
        'ac3' => 'audio/ac3',
        'flac' => 'audio/x-flac',
        'ogg' => 'audio/ogg',
        'kmz' => 'application/vnd.google-earth.kmz',
        'kml' => 'application/vnd.google-earth.kml+xml',
        'ics' => 'text/calendar',
        'zsh' => 'text/x-scriptzsh',
        '7zip' => 'application/x-7z-compressed',
        'cdr' => 'application/cdr',
        'wma' => 'audio/x-ms-wma',
        'jar' => 'application/java-archive',
        'tex' => 'application/x-tex',
        'latex' => 'application/x-latex',
        'odt' => 'application/vnd.oasis.opendocument.text',
        'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
        'odp' => 'application/vnd.oasis.opendocument.presentation',
        'odg' => 'application/vnd.oasis.opendocument.graphics',
        'odc' => 'application/vnd.oasis.opendocument.chart',
        'odf' => 'application/vnd.oasis.opendocument.formula',
        'odi' => 'application/vnd.oasis.opendocument.image',
        'odm' => 'application/vnd.oasis.opendocument.text-master',
        'odb' => 'application/vnd.oasis.opendocument.database',
        'ott' => 'application/vnd.oasis.opendocument.text-template',
    ];

    /**
     * Detects MIME Type based on given content.
     *
     * @param mixed $content
     *
     * @return string|null MIME Type or NULL if no mime type detected
     */
    public static function detectByContent($content)
    {
        if ( ! class_exists('finfo') || ! is_string($content)) {
            return null;
        }
        try {
            $finfo = new finfo(FILEINFO_MIME_TYPE);

            return $finfo->buffer($content) ?: null;
            // @codeCoverageIgnoreStart
        } catch (ErrorException $e) {
            // This is caused by an array to string conversion error.
        }
    } // @codeCoverageIgnoreEnd

    /**
     * Detects MIME Type based on file extension.
     *
     * @param string $extension
     *
     * @return string|null MIME Type or NULL if no extension detected
     */
    public static function detectByFileExtension($extension)
    {
        return isset(static::$extensionToMimeTypeMap[$extension])
            ? static::$extensionToMimeTypeMap[$extension]
            : 'text/plain';
    }

    /**
     * @param string $filename
     *
     * @return string|null MIME Type or NULL if no extension detected
     */
    public static function detectByFilename($filename)
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        return empty($extension) ? 'text/plain' : static::detectByFileExtension($extension);
    }

    /**
     * @return array Map of file extension to MIME Type
     */
    public static function getExtensionToMimeTypeMap()
    {
        return static::$extensionToMimeTypeMap;
    }
}
