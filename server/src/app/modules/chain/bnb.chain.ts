import privateKeyToPublicKey from 'ethereum-private-key-to-public-key';
import publicKeyToAddress from 'ethereum-public-key-to-address';
import { App } from "../../app"
import { logger } from "../../util/log"
import { init } from 'etherscan-api'

export class BNBChain {

    private api: any

    constructor(public app: App) { }

    async init() {
        this.api = init(this.app.config.apis.bnb.token);
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
            return await this.api.account.txlist(address, 1, 'latest', 1, 1000, 'desc')
        } catch (error) {
            if (error.toString() !== 'No transactions found') {
                logger.error('getTransactions: ')
                logger.error(error)
            }

            return []
        }
    }

    async getBalance(address: string): Promise<number> {
        try {
            const { result: balance } = await this.api.account.balance(address)
            if (balance > 0) {
              return parseFloat(balance.result) / 1e18; // Convert balance from wei to BNB
            }

            return balance
        } catch (error) {
            logger.error('getBalance')
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
        return publicKeyToAddress(publicKey)
    }

    stringToArray(bufferString) {
        return new TextEncoder().encode(bufferString);
    }
}
