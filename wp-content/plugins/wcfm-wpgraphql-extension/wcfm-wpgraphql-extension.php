<?php
/**
 * Plugin Name: WCFM WPGraphQL Extension
 * Description: Exposes WCFM vendor data via WPGraphQL.
 * Version: 0.1.0
 * Author: OpenAI ChatGPT
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'graphql_register_types', function() {
    if ( ! function_exists( 'register_graphql_object_type' ) ) {
        return;
    }

    register_graphql_object_type( 'VendorStore', [
        'fields' => [
            'id'   => [ 'type' => 'Int' ],
            'name' => [ 'type' => 'String' ],
        ],
    ] );

    register_graphql_object_type( 'VendorOrder', [
        'fields' => [
            'id'     => [ 'type' => 'Int' ],
            'status' => [ 'type' => 'String' ],
            'total'  => [ 'type' => 'String' ],
        ],
    ] );

    register_graphql_object_type( 'Vendor', [
        'fields' => [
            'id'   => [ 'type' => 'Int' ],
            'name' => [ 'type' => 'String' ],
            'store' => [ 'type' => 'VendorStore' ],
            'orders' => [ 'type' => [ 'list_of' => 'VendorOrder' ] ],
            'products' => [ 'type' => [ 'list_of' => 'JSON' ] ],
        ],
    ] );

    register_graphql_field( 'RootQuery', 'vendor', [
        'type'    => 'Vendor',
        'args'    => [ 'id' => [ 'type' => 'Int' ] ],
        'resolve' => function( $root, $args ) {
            $vendor_id = absint( $args['id'] );
            if ( ! current_user_can( 'manage_options' ) && get_current_user_id() !== $vendor_id ) {
                return null;
            }
            $response = wp_remote_get( rest_url( 'wcfmmp/v1/vendors/' . $vendor_id ) );
            if ( is_wp_error( $response ) ) {
                return null;
            }
            $data = json_decode( wp_remote_retrieve_body( $response ), true );
            return [
                'id'   => $data['id'] ?? $vendor_id,
                'name' => $data['vendor_shop_name'] ?? '',
            ];
        },
    ] );

    register_graphql_field( 'Vendor', 'store', [
        'type'    => 'VendorStore',
        'resolve' => function( $vendor ) {
            $vendor_id = absint( $vendor['id'] );
            if ( ! current_user_can( 'manage_options' ) && get_current_user_id() !== $vendor_id ) {
                return null;
            }
            $response = wp_remote_get( rest_url( 'wcfmmp/v1/stores/' . $vendor_id ) );
            if ( is_wp_error( $response ) ) {
                return null;
            }
            $data = json_decode( wp_remote_retrieve_body( $response ), true );
            return [
                'id'   => $data['id'] ?? $vendor_id,
                'name' => $data['store_name'] ?? '',
            ];
        },
    ] );

    register_graphql_field( 'Vendor', 'products', [
        'type'    => [ 'list_of' => 'JSON' ],
        'resolve' => function( $vendor ) {
            $vendor_id = absint( $vendor['id'] );
            if ( ! current_user_can( 'manage_options' ) && get_current_user_id() !== $vendor_id ) {
                return null;
            }
            $response = wp_remote_get( rest_url( sprintf( 'wcfmmp/v1/products?vendor_id=%d', $vendor_id ) ) );
            if ( is_wp_error( $response ) ) {
                return null;
            }
            return json_decode( wp_remote_retrieve_body( $response ), true );
        },
    ] );

    register_graphql_field( 'Vendor', 'orders', [
        'type'    => [ 'list_of' => 'VendorOrder' ],
        'resolve' => function( $vendor ) {
            $vendor_id = absint( $vendor['id'] );
            if ( ! current_user_can( 'manage_options' ) && get_current_user_id() !== $vendor_id ) {
                return null;
            }
            $response = wp_remote_get( rest_url( sprintf( 'wcfmmp/v1/orders?vendor_id=%d', $vendor_id ) ) );
            if ( is_wp_error( $response ) ) {
                return null;
            }
            $orders = json_decode( wp_remote_retrieve_body( $response ), true );
            return array_map( function( $order ) {
                return [
                    'id'     => $order['id'] ?? 0,
                    'status' => $order['status'] ?? '',
                    'total'  => $order['total'] ?? '',
                ];
            }, $orders );
        },
    ] );
});

