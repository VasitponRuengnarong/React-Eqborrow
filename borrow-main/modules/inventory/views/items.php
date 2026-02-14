<?php
/**
 * @filesource modules/inventory/views/items.php
 *
 * @copyright 2016 Goragod.com
 * @license https://www.kotchasan.com/license/
 *
 * @see https://www.kotchasan.com/
 */

namespace Inventory\Items;

use Kotchasan\DataTable;
use Kotchasan\Form;
use Kotchasan\Html;
use Kotchasan\Http\Request;

/**
 * module=inventory-write&tab=items
 *
 * @author Goragod Wiriya <admin@goragod.com>
 *
 * @since 1.0
 */
class View extends \Gcms\View
{
    /**
     * @var object
     */
    private $category;

    /**
     * ฟอร์มเพิ่ม/แก้ไข Inventory
     *
     * @param Request $request
     * @param object $product
     *
     * @return string
     */
    public function render(Request $request, $product)
    {
        $this->category = \Inventory\Category\Model::init();
        $form = Html::create('form', [
            'id' => 'setup_frm',
            'class' => 'setup_frm',
            'autocomplete' => 'off',
            'action' => 'index.php/inventory/model/items/submit',
            'onsubmit' => 'doFormSubmit',
            'ajax' => true,
            'token' => true
        ]);
        $fieldset = $form->add('fieldset', [
            'titleClass' => 'icon-barcode',
            'title' => '{LNG_Serial/Registration No.} '.$product->topic
        ]);
        // ตาราง
        $table = new DataTable([
            /* Data */
            'datas' => \Inventory\Items\Model::toDataTable($product),
            /* แสดงเส้นกรอบ */
            'border' => true,
            /* แสดงตารางแบบ Responsive */
            'responsive' => true,
            /* ไม่ต้องแสดง caption */
            'showCaption' => false,
            /* แสดงปุ่ม บวก-ลบ ในแถว */
            'pmButton' => true,
            /* ฟังก์ชั่นจัดรูปแบบการแสดงผลแถวของตาราง */
            'onRow' => [$this, 'onRow'],
            /* เมื่อมีการสร้างแถว */
            'onInitRow' => 'initInventoryItems',
            /* ส่วนหัวของตาราง และการเรียงลำดับ (thead) */
            'headers' => [
                'barcode' => [
                    'text' => '{LNG_Serial/Registration No.}',
                    'colspan' => 2
                ],
                'stock' => [
                    'text' => '{LNG_Stock}',
                    'class' => 'center'
                ],
                'unit' => [
                    'text' => '{LNG_Unit}',
                    'class' => 'center'
                ]
            ]
        ]);
        $fieldset->add('div', [
            'class' => 'item',
            'innerHTML' => $table->render()
        ]);
        // fieldset
        $fieldset = $form->add('fieldset', [
            'class' => 'submit'
        ]);
        // submit
        $fieldset->add('submit', [
            'class' => 'button save large icon-save',
            'value' => '{LNG_Save}'
        ]);
        // inventory_id
        $fieldset->add('hidden', [
            'id' => 'inventory_id',
            'value' => $product->id
        ]);
        // คืนค่า HTML
        return $form->render();
    }

    /**
     * จัดรูปแบบการแสดงผลในแต่ละแถว
     *
     * @param array  $item ข้อมูลแถว
     * @param int    $o    ID ของข้อมูล
     * @param object $prop กำหนด properties ของ TR
     *
     * @return array คืนค่า $item กลับไป
     */
    public function onRow($item, $o, $prop)
    {
        $item['barcode'] = '<img style="max-width:none" src="data:image/png;base64,'.base64_encode(\Kotchasan\Barcode::create($item['barcode'], 34, 9)->toPng()).'">';
        $item['product_no'] = Form::text([
            'name' => 'product_no[]',
            'labelClass' => 'g-input',
            'value' => $item['product_no']
        ])->render();
        $item['stock'] = Form::text([
            'name' => 'stock[]',
            'labelClass' => 'g-input',
            'size' => 1,
            'value' => $item['stock']
        ])->render();
        $item['unit'] = Form::select([
            'name' => 'unit[]',
            'labelClass' => 'g-input',
            'options' => $this->category->toSelect('unit', false),
            'value' => $item['unit']
        ])->render();
        return $item;
    }
}
