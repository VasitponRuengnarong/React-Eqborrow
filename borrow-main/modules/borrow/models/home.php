<?php
/**
 * @filesource modules/borrow/models/home.php
 *
 * @copyright 2016 Goragod.com
 * @license https://www.kotchasan.com/license/
 *
 * @see https://www.kotchasan.com/
 */

namespace Borrow\Home;

use Gcms\Login;
use Kotchasan\Database\Sql;

/**
 * โมเดลสำหรับอ่านข้อมูลแสดงในหน้า  Home
 *
 * @author Goragod Wiriya <admin@goragod.com>
 *
 * @since 1.0
 */
class Model extends \Kotchasan\Model
{
    /**
     * อ่านรายการจองวันนี้.
     *
     * @return object
     */
    public static function get($login)
    {
        // รอตรวจสอบ
        $q0 = static::createQuery()
            ->select(Sql::COUNT())
            ->from('borrow W')
            ->join('borrow_items S', 'INNER', ['S.borrow_id', 'W.id'])
            ->where([
                ['W.borrower_id', $login['id']],
                ['S.status', 0]
            ]);
        // ครบกำหนดคืน
        $q1 = static::createQuery()
            ->select(Sql::COUNT())
            ->from('borrow W')
            ->join('borrow_items S', 'INNER', ['S.borrow_id', 'W.id'])
            ->where([
                ['W.borrower_id', $login['id']],
                ['S.status', 2],
                [Sql::DATEDIFF('W.return_date', date('Y-m-d')), '<=', 0]
            ]);
        // อนุมัติ/ใช้งานอยู่
        $q2 = static::createQuery()
            ->select(Sql::COUNT())
            ->from('borrow W')
            ->join('borrow_items S', 'INNER', ['S.borrow_id', 'W.id'])
            ->where([
                ['W.borrower_id', $login['id']],
                ['S.status', 2]
            ])
            ->andWhere([
                [Sql::DATEDIFF('W.return_date', date('Y-m-d')), '>', 0],
                Sql::ISNULL('W.return_date')
            ], 'OR');
        if (Login::checkPermission($login, 'can_approve_borrow')) {
            // รายการรอตรวจสอบทั้งหมด
            $q3 = static::createQuery()
                ->select(Sql::COUNT())
                ->from('borrow W')
                ->join('borrow_items S', 'INNER', ['S.borrow_id', 'W.id'])
                ->where(['S.status', 0]);

            return static::createQuery()->cacheOn()->first([$q0, 'pending'], [$q1, 'returned'], [$q2, 'confirmed'], [$q3, 'allpending']);
        } else {
            return static::createQuery()->cacheOn()->first([$q0, 'pending'], [$q1, 'returned'], [$q2, 'confirmed']);
        }
    }
}
