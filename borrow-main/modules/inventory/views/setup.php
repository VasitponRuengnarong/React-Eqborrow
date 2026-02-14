<?php
/**
 * @filesource modules/inventory/views/setup.php
 *
 * @copyright 2016 Goragod.com
 * @license https://www.kotchasan.com/license/
 *
 * @see https://www.kotchasan.com/
 */

namespace Inventory\Setup;

use Kotchasan\DataTable;
use Kotchasan\Http\Request;
use Kotchasan\Language;

/**
 * module=inventory-setup
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
     * @var array
     */
    private $inventory_status;

    /**
     * ตาราง Inventory
     *
     * @param Request $request
     *
     * @return string
     */
    public function render(Request $request)
    {
        $this->inventory_status = Language::get('INVENTORY_STATUS');
        $filters = [];
        $params = [];
        $this->category = \Inventory\Category\Model::init(false, true, false);
        foreach ($this->category->items() as $key => $label) {
            if ($key != 'unit') {
                $params[$key] = $request->request($key)->topic();
                $filters[] = [
                    'name' => $key,
                    'text' => $label,
                    'options' => [0 => '{LNG_all items}'] + $this->category->toSelect($key),
                    'value' => $params[$key]
                ];
            }
        }
        // URL สำหรับส่งให้ตาราง
        $uri = $request->createUriWithGlobals(WEB_URL.'index.php');
        // ตาราง
        $table = new DataTable([
            /* Uri */
            'uri' => $uri,
            /* Model */
            'model' => \Inventory\Setup\Model::toDataTable($params),
            /* รายการต่อหน้า */
            'perPage' => $request->cookie('inventorySetup_perPage', 30)->toInt(),
            /* เรียงลำดับ */
            'sort' => $request->cookie('inventorySetup_sort', 'id desc')->toString(),
            /* ฟังก์ชั่นจัดรูปแบบการแสดงผลแถวของตาราง */
            'onRow' => [$this, 'onRow'],
            /* คอลัมน์ที่ไม่ต้องแสดงผล */
            'hideColumns' => ['unit'],
            /* คอลัมน์ที่สามารถค้นหาได้ */
            'searchColumns' => ['topic', 'product_no'],
            /* ตั้งค่าการกระทำของของตัวเลือกต่างๆ ด้านล่างตาราง ซึ่งจะใช้ร่วมกับการขีดถูกเลือกแถว */
            'action' => 'index.php/inventory/model/setup/action',
            'actionCallback' => 'dataTableActionCallback',
            'actions' => [
                [
                    'id' => 'action',
                    'class' => 'ok',
                    'text' => '{LNG_With selected}',
                    'options' => [
                        'delete' => '{LNG_Delete}'
                    ]
                ]
            ],
            /* ตัวเลือกด้านบนของตาราง ใช้จำกัดผลลัพท์การ query */
            'filters' => $filters,
            /* ส่วนหัวของตาราง และการเรียงลำดับ (thead) */
            'headers' => [
                'id' => [
                    'text' => '{LNG_Image}',
                    'sort' => 'id'
                ],
                'topic' => [
                    'text' => '{LNG_Equipment}',
                    'sort' => 'topic'
                ],
                'product_no' => [
                    'text' => '{LNG_Serial/Registration No.}',
                    'sort' => 'product_no'
                ],
                'stock' => [
                    'text' => '{LNG_Stock}',
                    'class' => 'center',
                    'sort' => 'stock'
                ],
                'inuse' => [
                    'text' => '',
                    'class' => 'center notext',
                    'sort' => 'inuse'
                ]
            ],
            /* รูปแบบการแสดงผลของคอลัมน์ (tbody) */
            'cols' => [
                'topic' => [
                    'class' => 'topic'
                ],
                'product_no' => [
                    'class' => 'nowrap'
                ],
                'stock' => [
                    'class' => 'center nowrap'
                ],
                'inuse' => [
                    'class' => 'center'
                ]
            ],
            /* ปุ่มแสดงในแต่ละแถว */
            'buttons' => [
                [
                    'class' => 'icon-edit button green',
                    'href' => $uri->createBackUri(['module' => 'inventory-write', 'tab' => 'product', 'id' => ':id']),
                    'text' => '{LNG_Edit}'
                ]
            ],
            /* ปุ่มเพิ่ม */
            'addNew' => [
                'class' => 'float_button icon-new',
                'href' => $uri->createBackUri(['module' => 'inventory-write', 'id' => 0]),
                'title' => '{LNG_Add} {LNG_Equipment}'
            ]
        ]);
        // save cookie
        setcookie('inventorySetup_perPage', $table->perPage, time() + 2592000, '/', HOST, HTTPS, true);
        setcookie('inventorySetup_sort', $table->sort, time() + 2592000, '/', HOST, HTTPS, true);
        // คืนค่า HTML
        return $table->render();
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
        $item['product_no'] = '<img style="max-width:none" src="data:image/png;base64,'.base64_encode(\Kotchasan\Barcode::create($item['product_no'], 50, 9)->toPng()).'">';
        $item['topic'] = '<span class=two_lines title="'.$item['topic'].'">'.$item['topic'].'</span>';
        foreach ($this->category->items() as $key => $label) {
            if (isset($item[$label])) {
                $item[$label] = $this->category->get($key, $item[$label]);
            }
        }
        $item['inuse'] = '<a id=inuse_'.$item['id'].' class="icon-valid '.($item['inuse'] == 0 ? 'disabled' : 'access').'" title="'.$this->inventory_status[$item['inuse']].'"></a>';
        $thumb = is_file(ROOT_PATH.DATA_FOLDER.'inventory/'.$item['id'].self::$cfg->stored_img_type) ? WEB_URL.DATA_FOLDER.'inventory/'.$item['id'].self::$cfg->stored_img_type : WEB_URL.'skin/img/noicon.png';
        $item['stock'] .= ' '.$item['unit'];
        $item['id'] = '<img src="'.$thumb.'" style="max-height:50px;max-width:50px" alt=thumbnail>';
        return $item;
    }
}
