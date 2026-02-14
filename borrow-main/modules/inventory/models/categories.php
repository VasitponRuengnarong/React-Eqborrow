<?php
/**
 * @filesource modules/inventory/models/categories.php
 *
 * @copyright 2016 Goragod.com
 * @license https://www.kotchasan.com/license/
 *
 * @see https://www.kotchasan.com/
 */

namespace Inventory\Categories;

/**
 * คลาส Model สำหรับจัดการเกี่ยวกับหมวดหมู่
 * ใช้เป็นต้นแบบสำหรับหมวดหมู่อื่นๆ รองรับหมวดหมู่หลายภาษา
 * และให้ฟังก์ชันในการอ่านหมวดหมู่เข้าไปใน DataTable และบันทึกข้อมูลหมวดหมู่จากการป้อนข้อมูลของผู้ใช้
 */
class Model extends \Index\Categories\Model
{

    /**
     * เมธอดเมื่อมีการบันทึกข้อมูลเรียบร้อยแล้ว
     *
     * @param string $type
     * @param array $login
     */
    protected function onSaved($type, $login)
    {
        // หมวดหมู่
        $category = \Inventory\Category\Model::create();
        // บันทึกการดำเนินการบันทึกหมวดหมู่
        \Index\Log\Model::add(0, 'inventory', 'Save', '{LNG_Save} '.$category->name($type), $login['id']);
    }
}
