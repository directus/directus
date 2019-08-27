<?php

namespace PragmaRX\Google2FA\Support;

trait QRCode
{
    /**
     * Creates a QR code url.
     *
     * @param $company
     * @param $holder
     * @param $secret
     *
     * @return string
     */
    public function getQRCodeUrl($company, $holder, $secret)
    {
        return 'otpauth://totp/' .
            rawurlencode($company) .
            ':' .
            rawurlencode($holder) .
            '?secret=' .
            $secret .
            '&issuer=' .
            rawurlencode($company) .
            '';
    }
}
