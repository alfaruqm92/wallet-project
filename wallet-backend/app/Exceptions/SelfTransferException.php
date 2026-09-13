<?php

namespace App\Exceptions;

use Exception;

class SelfTransferException extends Exception
{
    protected $message = 'Tidak bisa transfer ke akun sendiri.';
}
