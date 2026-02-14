<?php
/* settings/database.php */

return [
    'mysql' => [
        'dbdriver' => 'mysql',
        'username' => 'root',
        'password' => '',
        'dbname' => 'borrow',
        'prefix' => 'app'
    ],
    'tables' => [
        'category' => 'category',
        'language' => 'language',
        'number' => 'number',
        'borrow' => 'borrow',
        'borrow_items' => 'borrow_items',
        'inventory' => 'inventory',
        'inventory_meta' => 'inventory_meta',
        'inventory_items' => 'inventory_items',
        'user' => 'user'
    ]
];
