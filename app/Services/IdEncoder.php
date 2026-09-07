<?php

namespace App\Services;

class IdEncoder
{
    /**
     * Encode numeric database ID to URL-safe obfuscated string.
     */
    public static function encode($id): string
    {
        if (empty($id) || !is_numeric($id)) {
            return (string) $id;
        }

        $id = (int) $id;
        $appKey = config('app.key', 'kameti-secret-key-2026');
        $salt = crc32($appKey);

        // XOR obfuscation with salt
        $obfuscated = (($id * 2654435761) ^ $salt) & 0xFFFFFFFF;
        $packed = pack('NN', $id ^ 0x5A5A5A5A, $obfuscated);
        return rtrim(strtr(base64_encode($packed), '+/', '-_'), '=');
    }

    /**
     * Decode URL-safe obfuscated string back to integer database ID.
     */
    public static function decode($hash): int|string
    {
        if (empty($hash)) {
            return $hash;
        }

        if (is_numeric($hash)) {
            return (int) $hash;
        }

        try {
            $base64 = strtr($hash, '-_', '+/');
            $mod = strlen($base64) % 4;
            if ($mod !== 0) {
                $base64 .= str_repeat('=', 4 - $mod);
            }
            $decoded = base64_decode($base64);
            if ($decoded && strlen($decoded) === 8) {
                $unpacked = unpack('Nraw/Nobf', $decoded);
                if ($unpacked && isset($unpacked['raw'])) {
                    $realId = $unpacked['raw'] ^ 0x5A5A5A5A;
                    if ($realId > 0 && $realId < 2147483647) {
                        return $realId;
                    }
                }
            }
        } catch (\Throwable $e) {
            // fallback to original if decoding fails
        }

        return $hash;
    }
}
