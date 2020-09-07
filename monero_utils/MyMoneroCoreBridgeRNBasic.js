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

// Original Author: Paul Puey
//
// v--- These should maybe be injected into a context and supplied to currencyConfig for future platforms
import { NativeModules } from 'react-native'

const { RNFastCrypto } = NativeModules

async function methodByString(method, jsonParams) {
    const result = await RNFastCrypto.moneroCore(method, jsonParams)
    return result
}


const MyMoneroCoreBridgeRNBasic = {
    async is_subaddress(argStr) {
        const out = await methodByString('is_subaddress', argStr)
        return out
    },
    async is_integrated_address(argStr) {
        const out = await methodByString('is_integrated_address', argStr)
        return out
    },
    async new_payment_id(argStr) {
        const out = await methodByString('new_payment_id', argStr)
        return out
    },
    async decode_address(argStr) {
        const out = await methodByString('decode_address', argStr)
        return out
    },
    async newly_created_wallet(argStr) {
        const out = await methodByString('newly_created_wallet', argStr)
        return out
    },
    async are_equal_mnemonics(argStr) {
        const out = await methodByString('are_equal_mnemonics', argStr)
        return out
    },
    async mnemonic_from_seed(argStr) {
        const out = await methodByString('mnemonic_from_seed', argStr)
        return out
    },
    async seed_and_keys_from_mnemonic(argStr) {
        const out = await methodByString('seed_and_keys_from_mnemonic', argStr)
        return out
    },
    async validate_components_for_login(argStr) {
        const out = await methodByString('validate_components_for_login', argStr)
        return out
    },
    async address_and_keys_from_seed(argStr) {
        const out = await methodByString('address_and_keys_from_seed', argStr)
        return out
    },
    async generate_key_image(argStr) {
        const out = await methodByString('generate_key_image', argStr)
        return out
    },
    async generate_key_derivation(argStr) {
        const out = await methodByString('generate_key_derivation', argStr)
        return out
    },
    async derive_public_key(argStr) {
        const out = await methodByString('derive_public_key', argStr)
        return out
    },
    async derive_subaddress_public_key(argStr) {
        const out = await methodByString('derive_subaddress_public_key', argStr)
        return out
    },
    async decodeRct(argStr) {
        const out = await methodByString('decodeRct', argStr)
        return out
    },
    async estimated_tx_network_fee(argStr) {
        const out = await methodByString('estimated_tx_network_fee', argStr)
        return out
    },
    async send_step1__prepare_params_for_get_decoys(argStr) {
        const out = await methodByString('send_step1__prepare_params_for_get_decoys', argStr)
        return out
    },
    async send_step2__try_create_transaction(argStr) {
        const out = await methodByString('send_step2__try_create_transaction', argStr)
        return out
    }
}

module.exports = { MyMoneroCoreBridgeRNBasic }
