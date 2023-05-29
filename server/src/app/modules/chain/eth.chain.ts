import axios from "axios"
import privateKeyToPublicKey from 'ethereum-private-key-to-public-key';
import publicKeyToAddress from 'ethereum-public-key-to-address';
import { formatEther } from "ethers"
import { App } from "../../app"
import { logger } from "../../util/log"
import { init } from 'etherscan-api'
import rateLimit from 'axios-rate-limit';

export const URLConfig = {
    headers: {
        Authorization: 'Bearer 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'
    }
};

const http = rateLimit(axios.create(URLConfig), { maxRequests: 10, perMilliseconds: 60000, maxRPS: 1 })

export class EthChain {

    private api: any

    constructor(public app: App) { }

    async init() {
        this.api = init(this.app.config.apis.eth.token)
    }

    isValidEthPrivateKey(key: string): boolean {
        if (key.length !== 64) {
            return false
        }

        return true

        // try {
        //     const isValid = isValidPrivate(Buffer.from(stringToArray(key)))
        //     return isValid
        // } catch (error) {
        //     return false
        // }
    }

    async getTransactions(address: string) {
        try {
            const apiKey = this.app.config.apis.eth.token
            const { data } = await http.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${apiKey}`)
            return data.result
        } catch (error) {
            console.error(error)
        }
    }

    async getBalance(address: string): Promise<number> {
        try {
            const { result: ethers } = await this.api.account.balance(address)
            const eth = parseFloat(formatEther(ethers))
            return eth
        } catch (error) {
            logger.error(error)
        }
    }

    getAddressFromPrivateKey(privateKey: string): string {
        try {
            const publicKey = privateKeyToPublicKey(privateKey)
            const address = publicKeyToAddress(publicKey)
            return address
        } catch (error) {
            return null
        }
    }

    getAddressFromPublicKey(publicKey: string) {
        const address = publicKeyToAddress(publicKey)
        return address
    }

    stringToArray(bufferString) {
        let uint8Array = new TextEncoder().encode(bufferString);
        return uint8Array;
    }
}