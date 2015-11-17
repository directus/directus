<?php
/*
 * ntlm_sasl_client.php
 *
 * @(#) $Id: ntlm_sasl_client.php,v 1.3 2004/11/17 08:00:37 mlemos Exp $
 *
 */

define("SASL_NTLM_STATE_START", 0);
define("SASL_NTLM_STATE_IDENTIFY_DOMAIN", 1);
define("SASL_NTLM_STATE_RESPOND_CHALLENGE", 2);
define("SASL_NTLM_STATE_DONE", 3);
define("SASL_FAIL", -1);
define("SASL_CONTINUE", 1);

class ntlm_sasl_client_class
{
    public $credentials = array();
    public $state = SASL_NTLM_STATE_START;

    public function initialize(&$client)
    {
        if (!function_exists($function = "mcrypt_encrypt")
            || !function_exists($function = "mhash")
        ) {
            $extensions = array(
                "mcrypt_encrypt" => "mcrypt",
                "mhash" => "mhash"
            );
            $client->error = "the extension " . $extensions[$function] .
                " required by the NTLM SASL client class is not available in this PHP configuration";
            return (0);
        }
        return (1);
    }

    public function ASCIIToUnicode($ascii)
    {
        for ($unicode = "", $a = 0; $a < strlen($ascii); $a++) {
            $unicode .= substr($ascii, $a, 1) . chr(0);
        }
        return ($unicode);
    }

    public function typeMsg1($domain, $workstation)
    {
        $domain_length = strlen($domain);
        $workstation_length = strlen($workstation);
        $workstation_offset = 32;
        $domain_offset = $workstation_offset + $workstation_length;
        return (
            "NTLMSSP\0" .
            "\x01\x00\x00\x00" .
            "\x07\x32\x00\x00" .
            pack("v", $domain_length) .
            pack("v", $domain_length) .
            pack("V", $domain_offset) .
            pack("v", $workstation_length) .
            pack("v", $workstation_length) .
            pack("V", $workstation_offset) .
            $workstation .
            $domain
        );
    }

    public function NTLMResponse($challenge, $password)
    {
        $unicode = $this->ASCIIToUnicode($password);
        $md4 = mhash(MHASH_MD4, $unicode);
        $padded = $md4 . str_repeat(chr(0), 21 - strlen($md4));
        $iv_size = mcrypt_get_iv_size(MCRYPT_DES, MCRYPT_MODE_ECB);
        $iv = mcrypt_create_iv($iv_size, MCRYPT_RAND);
        for ($response = "", $third = 0; $third < 21; $third += 7) {
            for ($packed = "", $p = $third; $p < $third + 7; $p++) {
                $packed .= str_pad(decbin(ord(substr($padded, $p, 1))), 8, "0", STR_PAD_LEFT);
            }
            for ($key = "", $p = 0; $p < strlen($packed); $p += 7) {
                $s = substr($packed, $p, 7);
                $b = $s . ((substr_count($s, "1") % 2) ? "0" : "1");
                $key .= chr(bindec($b));
            }
            $ciphertext = mcrypt_encrypt(MCRYPT_DES, $key, $challenge, MCRYPT_MODE_ECB, $iv);
            $response .= $ciphertext;
        }
        return $response;
    }

    public function typeMsg3($ntlm_response, $user, $domain, $workstation)
    {
        $domain_unicode = $this->ASCIIToUnicode($domain);
        $domain_length = strlen($domain_unicode);
        $domain_offset = 64;
        $user_unicode = $this->ASCIIToUnicode($user);
        $user_length = strlen($user_unicode);
        $user_offset = $domain_offset + $domain_length;
        $workstation_unicode = $this->ASCIIToUnicode($workstation);
        $workstation_length = strlen($workstation_unicode);
        $workstation_offset = $user_offset + $user_length;
        $lm = "";
        $lm_length = strlen($lm);
        $lm_offset = $workstation_offset + $workstation_length;
        $ntlm = $ntlm_response;
        $ntlm_length = strlen($ntlm);
        $ntlm_offset = $lm_offset + $lm_length;
        $session = "";
        $session_length = strlen($session);
        $session_offset = $ntlm_offset + $ntlm_length;
        return (
            "NTLMSSP\0" .
            "\x03\x00\x00\x00" .
            pack("v", $lm_length) .
            pack("v", $lm_length) .
            pack("V", $lm_offset) .
            pack("v", $ntlm_length) .
            pack("v", $ntlm_length) .
            pack("V", $ntlm_offset) .
            pack("v", $domain_length) .
            pack("v", $domain_length) .
            pack("V", $domain_offset) .
            pack("v", $user_length) .
            pack("v", $user_length) .
            pack("V", $user_offset) .
            pack("v", $workstation_length) .
            pack("v", $workstation_length) .
            pack("V", $workstation_offset) .
            pack("v", $session_length) .
            pack("v", $session_length) .
            pack("V", $session_offset) .
            "\x01\x02\x00\x00" .
            $domain_unicode .
            $user_unicode .
            $workstation_unicode .
            $lm .
            $ntlm
        );
    }

    public function start(&$client, &$message, &$interactions)
    {
        if ($this->state != SASL_NTLM_STATE_START) {
            $client->error = "NTLM authentication state is not at the start";
            return (SASL_FAIL);
        }
        $this->credentials = array(
            "user" => "",
            "password" => "",
            "realm" => "",
            "workstation" => ""
        );
        $defaults = array();
        $status = $client->GetCredentials($this->credentials, $defaults, $interactions);
        if ($status == SASL_CONTINUE) {
            $this->state = SASL_NTLM_STATE_IDENTIFY_DOMAIN;
        }
        unset($message);
        return ($status);
    }

    public function step(&$client, $response, &$message, &$interactions)
    {
        switch ($this->state) {
            case SASL_NTLM_STATE_IDENTIFY_DOMAIN:
                $message = $this->TypeMsg1($this->credentials["realm"], $this->credentials["workstation"]);
                $this->state = SASL_NTLM_STATE_RESPOND_CHALLENGE;
                break;
            case SASL_NTLM_STATE_RESPOND_CHALLENGE:
                $ntlm_response = $this->NTLMResponse(substr($response, 24, 8), $this->credentials["password"]);
                $message = $this->TypeMsg3(
                    $ntlm_response,
                    $this->credentials["user"],
                    $this->credentials["realm"],
                    $this->credentials["workstation"]
                );
                $this->state = SASL_NTLM_STATE_DONE;
                break;
            case SASL_NTLM_STATE_DONE:
                $client->error = "NTLM authentication was finished without success";
                return (SASL_FAIL);
            default:
                $client->error = "invalid NTLM authentication step state";
                return (SASL_FAIL);
        }
        return (SASL_CONTINUE);
    }
}
