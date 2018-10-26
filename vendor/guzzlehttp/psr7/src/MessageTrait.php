<?php
namespace GuzzleHttp\Psr7;

use Psr\Http\Message\StreamInterface;

/**
 * Trait implementing functionality common to requests and responses.
 */
trait MessageTrait
{
    /** @var array Map of all registered headers, as original name => array of values */
    private $headers = [];

    /** @var array Map of lowercase header name => original name at registration */
    private $headerNames  = [];

    /** @var string */
    private $protocol = '1.1';

    /** @var StreamInterface */
    private $stream;

    public function getProtocolVersion()
    {
        return $this->protocol;
    }

    public function withProtocolVersion($version)
    {
        if ($this->protocol === $version) {
            return $this;
        }

        $new = clone $this;
        $new->protocol = $version;
        return $new;
    }

    public function getHeaders()
    {
        return $this->headers;
    }

    public function hasHeader($header)
    {
        return isset($this->headerNames[strtolower($header)]);
    }

    public function getHeader($header)
    {
        $header = strtolower($header);

        if (!isset($this->headerNames[$header])) {
            return [];
        }

        $header = $this->headerNames[$header];

        return $this->headers[$header];
    }

    public function getHeaderLine($header)
    {
        return implode(', ', $this->getHeader($header));
    }

    public function withHeader($header, $value)
    {
        if (!is_array($value)) {
            $value = [$value];
        }

        $value = $this->trimHeaderValues($value);
        $normalized = strtolower($header);

        $new = clone $this;
        if (isset($new->headerNames[$normalized])) {
            unset($new->headers[$new->headerNames[$normalized]]);
        }
        $new->headerNames[$normalized] = $header;
        $new->headers[$header] = $value;

        return $new;
    }

    public function withAddedHeader($header, $value)
    {
        if (!is_array($value)) {
            $value = [$value];
        }

        $value = $this->trimHeaderValues($value);
        $normalized = strtolower($header);

        $new = clone $this;
        if (isset($new->headerNames[$normalized])) {
            $header = $this->headerNames[$normalized];
            $new->headers[$header] = array_merge($this->headers[$header], $value);
        } else {
            $new->headerNames[$normalized] = $header;
            $new->headers[$header] = $value;
        }

        return $new;
    }

    public function withoutHeader($header)
    {
        $normalized = strtolower($header);

        if (!isset($this->headerNames[$normalized])) {
            return $this;
        }

        $header = $this->headerNames[$normalized];

        $new = clone $this;
        unset($new->headers[$header], $new->headerNames[$normalized]);

        return $new;
    }

    public function getBody()
    {
        if (!$this->stream) {
            $this->stream = stream_for('');
        }

        return $this->stream;
    }

    public function withBody(StreamInterface $body)
    {
        if ($body === $this->stream) {
            return $this;
        }

        $new = clone $this;
        $new->stream = $body;
        return $new;
    }

    private function setHeaders(array $headers)
    {
        $this->headerNames = $this->headers = [];
        foreach ($headers as $header => $value) {
            if (!is_array($value)) {
                $value = [$value];
            }

            $value = $this->trimHeaderValues($value);
            $normalized = strtolower($header);
            if (isset($this->headerNames[$normalized])) {
                $header = $this->headerNames[$normalized];
                $this->headers[$header] = array_merge($this->headers[$header], $value);
            } else {
                $this->headerNames[$normalized] = $header;
                $this->headers[$header] = $value;
            }
        }
    }

    /**
     * Trims whitespace from the header values.
     *
     * Spaces and tabs ought to be excluded by parsers when extracting the field value from a header field.
     *
     * header-field = field-name ":" OWS field-value OWS
     * OWS          = *( SP / HTAB )
     *
     * @param string[] $values Header values
     *
     * @return string[] Trimmed header values
     *
     * @see https://tools.ietf.org/html/rfc7230#section-3.2.4
     */
    private function trimHeaderValues(array $values)
    {
        return array_map(function ($value) {
            return trim($value, " \t");
        }, $values);
    }
}
