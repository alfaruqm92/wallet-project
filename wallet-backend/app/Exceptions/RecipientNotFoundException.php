<?php

namespace App\Exceptions;

use Exception;

class RecipientNotFoundException extends Exception
{
    protected $message = 'Penerima tidak ditemukan.';
}
