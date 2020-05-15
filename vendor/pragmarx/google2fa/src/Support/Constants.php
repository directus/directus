<?php

namespace PragmaRX\Google2FA\Support;

class Constants
{
    /**
     * Characters valid for Base 32.
     */
    const VALID_FOR_B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Characters valid for Base 32, scrambled.
     */
    const VALID_FOR_B32_SCRAMBLED = '234567QWERTYUIOPASDFGHJKLZXCVBNM';

    /**
     * Argument not set constant.
     */
    const ARGUMENT_NOT_SET = '__not_set__';
}
