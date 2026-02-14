<?php
/**
 * @filesource modules/borrow/views/orderstatus.php
 *
 * @copyright 2016 Goragod.com
 * @license https://www.kotchasan.com/license/
 *
 * @see https://www.kotchasan.com/
 */

namespace Borrow\Orderstatus;

use Kotchasan\Html;
use Kotchasan\Language;

/**
 * module=borrow-order
 *
 * @author Goragod Wiriya <admin@goragod.com>
 *
 * @since 1.0
 */
class View extends \Gcms\View
{
    /**
     * ฟอร์มปรับสถานะการ ยืม - คืน
     *
     * @param object $index
     *
     * @return string
     */
    public static function render($index, $action)
    {
        $actions = [
            'delivery' => '{LNG_Delivery}',
            'return' => '{LNG_Return}',
            'status' => '{LNG_Status update}'
        ];
        $icons = [
            'delivery' => 'icon-outbox',
            'return' => 'icon-inbox',
            'status' => 'icon-star0'
        ];
        $form = Html::create('form', [
            'id' => 'status_frm',
            'class' => 'setup_frm',
            'autocomplete' => 'off',
            'action' => 'index.php/borrow/model/orderstatus/submit',
            'onsubmit' => 'doFormSubmit',
            'ajax' => true,
            'token' => true
        ]);
        $form->add('header', [
            'innerHTML' => '<h3 class='.$icons[$action].'>'.$actions[$action].'</h3>'
        ]);
        $fieldset = $form->add('fieldset');
        $fieldset->add('div', [
            'class' => 'item',
            'innerHTML' => $index->topic
        ]);
        if ($action !== 'status') {
            // amount
            $fieldset->add('number', [
                'id' => 'amount',
                'labelClass' => 'g-input icon-number',
                'itemClass' => 'item',
                'label' => '{LNG_Quantity}'
            ]);
        }
        // status
        $fieldset->add('select', [
            'id' => 'status',
            'labelClass' => 'g-input icon-star0',
            'itemClass' => 'item',
            'label' => '{LNG_Status}',
            'options' => Language::get('BORROW_STATUS'),
            'value' => $index->status
        ]);
        $fieldset = $form->add('fieldset', [
            'class' => 'submit right'
        ]);
        // submit
        $fieldset->add('submit', [
            'class' => 'button ok large',
            'id' => 'order_submit',
            'value' => '{LNG_Save}'
        ]);
        // borrow_id
        $fieldset->add('hidden', [
            'id' => 'borrow_id',
            'value' => $index->borrow_id
        ]);
        // id
        $fieldset->add('hidden', [
            'id' => 'id',
            'value' => $index->id
        ]);
        // action
        $fieldset->add('hidden', [
            'id' => 'action',
            'value' => $action
        ]);
        // คืนค่า HTML
        return Language::trans($form->render());
    }
}
