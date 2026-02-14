<?php
/**
 * @filesource modules/borrow/views/order.php
 *
 * @copyright 2016 Goragod.com
 * @license https://www.kotchasan.com/license/
 *
 * @see https://www.kotchasan.com/
 */

namespace Borrow\Order;

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
     * ฟอร์ม รายละเอียดการยืมพัสดุ
     *
     * @param object $index
     *
     * @return string
     */
    public function render($index)
    {
        $form = Html::create('form', [
            'id' => 'order_frm',
            'class' => 'setup_frm',
            'autocomplete' => 'off',
            'action' => 'index.php/borrow/model/order/submit',
            'onsubmit' => 'doFormSubmit',
            'ajax' => true,
            'token' => true
        ]);
        $fieldset = $form->add('fieldset', [
            'title' => '{LNG_Details of} {LNG_Borrower}',
            'titleClass' => 'icon-profile'
        ]);
        // borrower
        $fieldset->add('text', [
            'id' => 'borrower',
            'labelClass' => 'g-input icon-customer',
            'itemClass' => 'item',
            'label' => '{LNG_Borrower}',
            'placeholder' => Language::replace('Fill some of the :name to find', [':name' => '{LNG_Name}, {LNG_Email}, {LNG_Phone}']),
            'title' => '{LNG_Borrower}',
            'value' => $index->borrower,
            'autofocus' => true
        ]);
        // borrower_id
        $fieldset->add('hidden', [
            'id' => 'borrower_id',
            'value' => $index->borrower_id
        ]);
        $fieldset = $form->add('fieldset', [
            'title' => '{LNG_Transaction details}',
            'titleClass' => 'icon-cart'
        ]);
        $groups = $fieldset->add('groups');
        // borrow_no
        $groups->add('text', [
            'id' => 'borrow_no',
            'labelClass' => 'g-input icon-number',
            'itemClass' => 'width50',
            'label' => '{LNG_Transaction No.}',
            'placeholder' => '{LNG_Leave empty for generate auto}',
            'value' => $index->borrow_no
        ]);
        // transaction_date
        $groups->add('date', [
            'id' => 'transaction_date',
            'labelClass' => 'g-input icon-calendar',
            'itemClass' => 'width50',
            'label' => '{LNG_Transaction date}',
            'value' => $index->transaction_date
        ]);
        $groups = $fieldset->add('groups');
        // borrow_date
        $groups->add('date', [
            'id' => 'borrow_date',
            'labelClass' => 'g-input icon-calendar',
            'itemClass' => 'width50',
            'label' => '{LNG_Borrowed date}',
            'value' => $index->borrow_date
        ]);
        // return_date
        $groups->add('date', [
            'id' => 'return_date',
            'labelClass' => 'g-input icon-calendar',
            'itemClass' => 'width50',
            'label' => '{LNG_Date of return}',
            'value' => $index->return_date
        ]);
        $borrow_status = Language::get('BORROW_STATUS');
        $table = '<table class="fullwidth data border"><thead><tr>';
        $table .= '<th>{LNG_Detail}</th>';
        $table .= '<th>{LNG_Quantity}</th>';
        $table .= '<th>{LNG_Delivery}</th>';
        $table .= '<th>{LNG_Status}</th>';
        $table .= '<th colspan="3"></th>';
        $table .= '</tr></thead><tbody id=tb_products>';
        foreach (\Borrow\Order\Model::items($index->id) as $item) {
            $table .= '<tr>';
            $table .= '<td><a id="product_no_'.$item['product_no'].'">'.$item['topic'].' ('.$item['product_no'].')</a></td>';
            $table .= '<td class="center">'.$item['num_requests'].'</td>';
            $table .= '<td class="center" id="amount_'.$item['id'].'">'.$item['amount'].'</td>';
            $table .= '<td class="center"><span class="term'.$item['status'].'" id="status_'.$item['id'].'">'.$borrow_status[$item['status']].'</span></td>';
            $table .= '<td class="center"><a id=delivery_'.$item['borrow_id'].'_'.$item['id'].' class="button icon-outbox green">{LNG_Delivery}</a></td>';
            $table .= '<td class="center"><a id=return_'.$item['borrow_id'].'_'.$item['id'].' class="button icon-inbox blue">{LNG_Return}</a></td>';
            $table .= '<td class="center"><a id=status_'.$item['borrow_id'].'_'.$item['id'].' class="button icon-star0 red">{LNG_Status update}</a></td>';
            $table .= '</tr>';
        }
        $table .= '</tbody>';
        $table .= '</table>';
        $fieldset->add('div', [
            'class' => 'item',
            'innerHTML' => $table
        ]);
        $fieldset = $form->add('fieldset', [
            'class' => 'submit right'
        ]);
        if (self::$cfg->noreply_email != '') {
            $fieldset->add('checkbox', [
                'id' => 'send_mail',
                'labelClass' => 'inline-block middle',
                'label' => '&nbsp;{LNG_Email the relevant person}',
                'value' => 1
            ]);
        }
        // submit
        $fieldset->add('submit', [
            'class' => 'button ok large',
            'id' => 'order_submit',
            'value' => '{LNG_Save}'
        ]);
        // borrow_id
        $fieldset->add('hidden', [
            'id' => 'borrow_id',
            'value' => $index->id
        ]);
        // Javascript
        $form->script('initBorrowOrder();');
        // คืนค่า HTML
        return $form->render();
    }
}
