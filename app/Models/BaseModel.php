<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;

abstract class BaseModel
{
    protected static function db(string $profile = 'courante'): Database
    {
        return Database::getInstance($profile);
    }
}
