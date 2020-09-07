// Copyright (c) 2014-2018, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// Original Author: Lucas Jones
// Modified to remove jQuery dep and support modular inclusion of deps by Paul Shapiro (2016)
// Modified to add RingCT support by luigi1111 (2017)
//
// v--- These should maybe be injected into a context and supplied to currencyConfig for future platforms
const JSBigInt = require('../cryptonote_utils/biginteger').BigInteger
const nettype_utils = require('../cryptonote_utils/nettype')
const monero_config = require('./monero_config')
const monero_amount_format_utils = require('../cryptonote_utils/money_format_utils')(monero_config)

import { MyMoneroCoreBridgeRNBasic } from 'mymonero-core-js/monero_utils/MyMoneroCoreBridgeRNBasic'

const monero_keyImage_cache_utils = require('./monero_keyImage_cache_utils')

const MIXIN = 10

function ret_val_boolstring_to_bool(boolstring) {
    if (typeof boolstring !== 'string') {
        throw 'ret_val_boolstring_to_bool expected string input'
    }
    if (boolstring === 'true') {
        return true
    } else if (boolstring === 'false') {
        return false
    }
    throw 'ret_val_boolstring_to_bool given illegal input'
}

function api_safe_wordset_name(wordset_name) {
    // convert all lowercase, legacy values to core-cpp compatible
    if (wordset_name == 'english') {
        return 'English'
    } else if (wordset_name == 'spanish') {
        return 'Español'
    } else if (wordset_name == 'portuguese') {
        return 'Português'
    } else if (wordset_name == 'japanese') {
        return '日本語'
    }
    return wordset_name // must be a value returned by core-cpp
}

function bridge_sanitized__spendable_out(raw__out) {
    const sanitary__output =
        {
            amount: raw__out.amount.toString(),
            public_key: raw__out.public_key,
            global_index: '' + raw__out.global_index,
            index: '' + raw__out.index,
            tx_pub_key: raw__out.tx_pub_key
        }
    if (raw__out.rct && typeof raw__out.rct !== 'undefined') {
        sanitary__output.rct = raw__out.rct
    }
    return sanitary__output
}

class MyMoneroCoreBridgeRN {
    constructor() {
        this.Module = MyMoneroCoreBridgeRNBasic
    }

    async is_subaddress(addr, nettype) {
        const args =
            {
                address: addr,
                nettype_string: nettype_utils.nettype_to_API_string(nettype)
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.is_subaddress(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return ret_val_boolstring_to_bool(ret.retVal)
    }

    async is_integrated_address(addr, nettype) {
        const args =
            {
                address: addr,
                nettype_string: nettype_utils.nettype_to_API_string(nettype)
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.is_integrated_address(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return ret_val_boolstring_to_bool(ret.retVal)
    }

    async new_payment_id() {
        const args = {}
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.new_payment_id(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return ret.retVal
    }

    async new__int_addr_from_addr_and_short_pid(
        address,
        short_pid,
        nettype
    ) {
        if (!short_pid || short_pid.length != 16) {
            return { err_msg: 'expected valid short_pid' }
        }
        const args =
            {
                address: address,
                short_pid: short_pid,
                nettype_string: nettype_utils.nettype_to_API_string(nettype)
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.new_integrated_address(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return ret.retVal
    }

    async decode_address(address, nettype) {
        const args =
            {
                address: address,
                nettype_string: nettype_utils.nettype_to_API_string(nettype)
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.decode_address(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return {
            spend: ret.pub_spendKey_string,
            view: ret.pub_viewKey_string,
            intPaymentId: ret.paymentID_string, // may be undefined
            isSubaddress: ret_val_boolstring_to_bool(ret.isSubaddress)
        }
    }

    async newly_created_wallet(
        locale_language_code,
        nettype
    ) {
        const args =
            {
                locale_language_code: locale_language_code, // NOTE: this function takes the locale, not the wordset name
                nettype_string: nettype_utils.nettype_to_API_string(nettype)
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.newly_created_wallet(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return { // calling these out so as to provide a stable ret val interface
            mnemonic_string: ret.mnemonic_string,
            mnemonic_language: ret.mnemonic_language,
            sec_seed_string: ret.sec_seed_string,
            address_string: ret.address_string,
            pub_viewKey_string: ret.pub_viewKey_string,
            sec_viewKey_string: ret.sec_viewKey_string,
            pub_spendKey_string: ret.pub_spendKey_string,
            sec_spendKey_string: ret.sec_spendKey_string
        }
    }

    async are_equal_mnemonics(a, b) {
        const args =
            {
                a: a,
                b: b
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.are_equal_mnemonics(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return ret_val_boolstring_to_bool(ret.retVal)
    }

    async mnemonic_from_seed(
        seed_string,
        wordset_name
    ) {
        const args =
            {
                seed_string: seed_string,
                wordset_name: api_safe_wordset_name(wordset_name)
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.mnemonic_from_seed(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg } // TODO: maybe return this somehow
        }
        return ret.retVal
    }

    async seed_and_keys_from_mnemonic(
        mnemonic_string,
        nettype
    ) {
        const args =
            {
                mnemonic_string: mnemonic_string,
                nettype_string: nettype_utils.nettype_to_API_string(nettype)
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.seed_and_keys_from_mnemonic(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return { // calling these out so as to provide a stable ret val interface
            sec_seed_string: ret.sec_seed_string,
            mnemonic_language: ret.mnemonic_language,
            address_string: ret.address_string,
            pub_viewKey_string: ret.pub_viewKey_string,
            sec_viewKey_string: ret.sec_viewKey_string,
            pub_spendKey_string: ret.pub_spendKey_string,
            sec_spendKey_string: ret.sec_spendKey_string
        }
    }

    async validate_components_for_login(
        address_string,
        sec_viewKey_string,
        sec_spendKey_string,
        seed_string,
        nettype
    ) {
        const args =
            {
                address_string: address_string,
                sec_viewKey_string: sec_viewKey_string,
                sec_spendKey_string: sec_spendKey_string,
                seed_string: seed_string,
                nettype_string: nettype_utils.nettype_to_API_string(nettype)
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.validate_components_for_login(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return { // calling these out so as to provide a stable ret val interface
            isValid: ret_val_boolstring_to_bool(ret.isValid),
            isInViewOnlyMode: ret_val_boolstring_to_bool(ret.isInViewOnlyMode),
            pub_viewKey_string: ret.pub_viewKey_string,
            pub_spendKey_string: ret.pub_spendKey_string
        }
    }

    async address_and_keys_from_seed(
        seed_string,
        nettype
    ) {
        const args =
            {
                seed_string: seed_string,
                nettype_string: nettype_utils.nettype_to_API_string(nettype)
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.address_and_keys_from_seed(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return { // calling these out so as to provide a stable ret val interface
            address_string: ret.address_string,
            pub_viewKey_string: ret.pub_viewKey_string,
            sec_viewKey_string: ret.sec_viewKey_string,
            pub_spendKey_string: ret.pub_spendKey_string,
            sec_spendKey_string: ret.sec_spendKey_string
        }
    }

    async generate_key_image(
        tx_pub,
        view_sec,
        spend_pub,
        spend_sec,
        output_index
    ) {
        if (tx_pub.length !== 64) {
            return { err_msg: 'Invalid tx_pub length' }
        }
        if (view_sec.length !== 64) {
            return { err_msg: 'Invalid view_sec length' }
        }
        if (spend_pub.length !== 64) {
            return { err_msg: 'Invalid spend_pub length' }
        }
        if (spend_sec.length !== 64) {
            return { err_msg: 'Invalid spend_sec length' }
        }
        const args =
            {
                sec_viewKey_string: view_sec,
                sec_spendKey_string: spend_sec,
                pub_spendKey_string: spend_pub,
                tx_pub_key: tx_pub,
                out_index: '' + output_index
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.generate_key_image(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return ret.retVal
    }

    async generate_key_derivation(
        pub,
        sec
    ) {
        const args =
            {
                pub: pub,
                sec: sec
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.generate_key_derivation(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return ret.retVal
    }

    async derive_public_key(derivation, out_index, pub) {
        const args =
            {
                pub: pub,
                derivation: derivation,
                out_index: out_index
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.derive_public_key(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return ret.retVal
    }

    async derive_subaddress_public_key(
        output_key,
        derivation,
        out_index
    ) {
        const args =
            {
                output_key: output_key,
                derivation: derivation,
                out_index: '' + out_index // must be passed as string
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.derive_subaddress_public_key(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return ret.retVal
    }

    async decodeRct(rv, sk, i) {
        const ecdhInfo = [] // should obvs be plural but just keeping exact names in-tact
        for (var j = 0; j < rv.outPk.length; j++) {
            var this_ecdhInfo = rv.ecdhInfo[j]
            ecdhInfo.push({
                mask: this_ecdhInfo.mask,
                amount: this_ecdhInfo.amount
            })
        }
        const outPk = []
        for (var j = 0; j < rv.outPk.length; j++) {
            var this_outPk_mask = null
            var this_outPk = rv.outPk[j]
            if (typeof this_outPk === 'string') {
                this_outPk_mask = this_outPk
            } else if (typeof this_outPk === 'object') {
                this_outPk_mask = this_outPk.mask
            }
            if (this_outPk_mask == null) {
                return { err_msg: 'Couldn\'t locate outPk mask value' }
            }
            outPk.push({
                mask: this_outPk_mask
            })
        }
        const args =
            {
                i: '' + i,  // must be passed as string
                sk: sk,
                rv: {
                    type: '' + rv.type/*must be string*/, // e.g. 1, 3 ... corresponding to rct::RCTType* in rctSigs.cpp
                    ecdhInfo: ecdhInfo,
                    outPk: outPk
                }
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.decodeRct(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return { // calling these out so as to provide a stable ret val interface
            amount: ret.amount, // string
            mask: ret.mask
        }
    }

    async estimated_tx_network_fee(fee_per_kb__string, priority, optl__fee_per_b_string) // this is until we switch the server over to fee per b
    { // TODO update this API to take object rather than arg list
        const args =
            {
                fee_per_b: typeof optl__fee_per_b_string !== undefined && optl__fee_per_b_string != null
                    ? optl__fee_per_b_string
                    : (new JSBigInt(fee_per_kb__string)).divide(1024).toString()/*kib -> b*/,
                priority: '' + priority
            }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.estimated_tx_network_fee(args_str)
        const ret = JSON.parse(ret_string)
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg } // TODO: maybe return this somehow
        }
        return ret.retVal // this is a string - pass it to new JSBigInt(…)
    }

    async send_step1__prepare_params_for_get_decoys(
        is_sweeping,
        sending_amount, // this may be 0 if sweeping
        fee_per_b,
        fee_mask,
        priority,
        unspent_outputs,
        optl__payment_id_string, // this may be nil
        optl__passedIn_attemptAt_fee
    ) {
        var sanitary__unspent_outputs = []
        for (let i in unspent_outputs) {
            const sanitary__output = bridge_sanitized__spendable_out(unspent_outputs[i])
            sanitary__unspent_outputs.push(sanitary__output)
        }
        const args =
            {
                sending_amount: sending_amount.toString(),
                is_sweeping: '' + is_sweeping, // bool -> string
                priority: '' + priority,
                fee_per_b: fee_per_b.toString(),
                fee_mask: fee_mask.toString(),
                unspent_outs: sanitary__unspent_outputs // outs, not outputs
            }
        if (typeof optl__payment_id_string !== 'undefined' && optl__payment_id_string && optl__payment_id_string != '') {
            args.payment_id_string = optl__payment_id_string
        }
        if (typeof optl__passedIn_attemptAt_fee !== 'undefined' && optl__passedIn_attemptAt_fee && optl__passedIn_attemptAt_fee != '') {
            args.passedIn_attemptAt_fee = optl__passedIn_attemptAt_fee.toString() // ought to be a string but in case it's a JSBigInt…
        }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.send_step1__prepare_params_for_get_decoys(args_str)
        const ret = JSON.parse(ret_string)
        // special case: err_code of needMoreMoneyThanFound; rewrite err_msg
        if (ret.err_code == '90' || ret.err_code == 90) { // declared in mymonero-core-cpp/src/monero_transfer_utils.hpp
            return {
                required_balance: ret.required_balance,
                spendable_balance: ret.spendable_balance,
                err_msg: `Spendable balance too low. Have ${
                    monero_amount_format_utils.formatMoney(new JSBigInt(ret.spendable_balance))
                } ${monero_config.coinSymbol}; need ${
                    monero_amount_format_utils.formatMoney(new JSBigInt(ret.required_balance))
                } ${monero_config.coinSymbol}.`
            }
        }
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg }
        }
        return { // calling these out to set an interface
            mixin: parseInt(ret.mixin), // for the server API request to RandomOuts
            using_fee: ret.using_fee, // string; can be passed to step2
            change_amount: ret.change_amount, // string for step2
            using_outs: ret.using_outs, // this can be passed straight to step2
            final_total_wo_fee: ret.final_total_wo_fee // aka sending_amount for step2
        }
    }

    async send_step2__try_create_transaction( // send only IPC-safe vals - no JSBigInts
        from_address_string,
        sec_keys,
        to_address_string,
        using_outs,
        mix_outs,
        fake_outputs_count,
        final_total_wo_fee,
        change_amount,
        fee_amount,
        payment_id,
        priority,
        fee_per_b, // not kib - if fee_per_kb, /= 1024
        fee_mask,
        unlock_time,
        nettype
    ) {
        unlock_time = unlock_time || 0
        mix_outs = mix_outs || []
        // NOTE: we also do this check in the C++... may as well remove it from here
        if (mix_outs.length !== using_outs.length && fake_outputs_count !== 0) {
            return {
                err_msg: 'Wrong number of mix outs provided (' +
                    using_outs.length + ' using_outs, ' +
                    mix_outs.length + ' mix outs)'
            }
        }
        for (var i = 0; i < mix_outs.length; i++) {
            if ((mix_outs[i].outputs || []).length < fake_outputs_count) {
                return { err_msg: 'Not enough outputs to mix with' }
            }
        }
        //
        // Now we need to convert all non-JSON-serializable objects such as JSBigInts to strings etc - not that there should be any!
        // - and all numbers to strings - especially those which may be uint64_t on the receiving side
        var sanitary__using_outs = []
        for (let i in using_outs) {
            const sanitary__output = bridge_sanitized__spendable_out(using_outs[i])
            sanitary__using_outs.push(sanitary__output)
        }
        var sanitary__mix_outs = []
        for (let i in mix_outs) {
            const sanitary__mix_outs_and_amount =
                {
                    amount: mix_outs[i].amount.toString(), // it should be a string, but in case it's not
                    outputs: []
                }
            if (mix_outs[i].outputs && typeof mix_outs[i].outputs !== 'undefined') {
                for (let j in mix_outs[i].outputs) {
                    const sanitary__mix_out =
                        {
                            global_index: '' + mix_outs[i].outputs[j].global_index, // number to string
                            public_key: mix_outs[i].outputs[j].public_key
                        }
                    if (mix_outs[i].outputs[j].rct && typeof mix_outs[i].outputs[j].rct !== 'undefined') {
                        sanitary__mix_out.rct = mix_outs[i].outputs[j].rct
                    }
                    sanitary__mix_outs_and_amount.outputs.push(sanitary__mix_out)
                }
            }
            sanitary__mix_outs.push(sanitary__mix_outs_and_amount)
        }
        const args =
            {
                from_address_string: from_address_string,
                sec_viewKey_string: sec_keys.view,
                sec_spendKey_string: sec_keys.spend,
                to_address_string: to_address_string,
                final_total_wo_fee: final_total_wo_fee.toString(),
                change_amount: change_amount.toString(),
                fee_amount: fee_amount.toString(),
                priority: '' + priority,
                fee_per_b: fee_per_b.toString(),
                fee_mask: fee_mask.toString(),
                using_outs: sanitary__using_outs,
                mix_outs: sanitary__mix_outs,
                unlock_time: '' + unlock_time, // bridge is expecting a string
                nettype_string: nettype_utils.nettype_to_API_string(nettype)
            }
        if (typeof payment_id !== 'undefined' && payment_id) {
            args.payment_id_string = payment_id
        }
        const args_str = JSON.stringify(args)
        const ret_string = await this.Module.send_step2__try_create_transaction(args_str)
        const ret = JSON.parse(ret_string)
        //
        if (typeof ret.err_msg !== 'undefined' && ret.err_msg) {
            return { err_msg: ret.err_msg, tx_must_be_reconstructed: false }
        }
        if (ret.tx_must_be_reconstructed == 'true' || ret.tx_must_be_reconstructed == true) {
            if (typeof ret.fee_actually_needed == 'undefined' || !ret.fee_actually_needed) {
                throw 'tx_must_be_reconstructed; expected non-nil fee_actually_needed'
            }
            return {
                tx_must_be_reconstructed: ret.tx_must_be_reconstructed, // if true, re-do procedure from step1 except for requesting UnspentOuts (that can be done oncet)
                fee_actually_needed: ret.fee_actually_needed // can be passed back to step1
            }
        }
        return { // calling these out to set an interface
            tx_must_be_reconstructed: false, // in case caller is not checking for nil
            signed_serialized_tx: ret.serialized_signed_tx,
            tx_hash: ret.tx_hash,
            tx_key: ret.tx_key
        }
    }

	/**
     * added by Ksu to "almost" unify with wasm / asm
	 * @param params.is_sweeping,
	 * @param params.payment_id_string // may be nil or undefined
	 * @param params.sending_amount // sending amount
	 * @param params.from_address_string
	 * @param params.sec_viewKey_string
	 * @param params.sec_spendKey_string
	 * @param params.pub_spendKey_string
	 * @param params.to_address_string
	 * @param params.priority,
	 * @param params.unlock_time
	 * @param params.nettype
	 * @param params.get_unspent_outs_fn
	 * @param params.get_random_outs_fn
	 * @param params.submit_raw_tx_fn
	 * @param params.status_update_fn
	 * @param params.error_fn
	 * @param params.success_fn
	 */
	async async__send_funds(params) {

		let outputs = await params.get_unspent_outs_fn({
			address: params.from_address_string,
			amount: params.sending_amount,
			dust_threshold: '2000000000',
			mixin: MIXIN,
			use_dust: true,
			view_key: params.sec_viewKey_string
		})

        let decoy = await this.send_step1__prepare_params_for_get_decoys(
            params.is_sweeping,
            params.sending_amount, // this may be 0 if sweeping
            outputs.per_byte_fee,
            outputs.fee_mask,
            params.priority,
            outputs.outputs,
            null,
            null
        )
        if (typeof decoy.err_msg !== 'undefined') {
            throw new Error(decoy.err_msg)
        }

		const amounts = decoy.using_outs.map(o => (o.rct ? '0' : o.amount.toString()))
		const linkParams = {
			amounts,
			count: MIXIN + 1
		}

		let random = await params.get_random_outs_fn(linkParams)

        let tx = await this.send_step2__try_create_transaction(
            params.from_address_string,
            {view:params.sec_viewKey_string,spend:params.sec_spendKey_string},
            params.to_address_string,
            decoy.using_outs,
            random.amount_outs,
            decoy.mixin,
            decoy.final_total_wo_fee,
            decoy.change_amount,
            decoy.using_fee,
            params.payment_id,
            params.priority,
            outputs.per_byte_fee, // not kib - if fee_per_kb, /= 1024
            outputs.fee_mask,
            0,
            params.nettype
        )

        return {
            used_fee : decoy.using_fee,
            serialized_signed_tx : tx.signed_serialized_tx,
            tx_hash : tx.tx_hash
        }
	}

}

//
module.exports = { MyMoneroCoreBridgeRN }
