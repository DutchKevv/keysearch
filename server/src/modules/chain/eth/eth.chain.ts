import privateKeyToPublicKey from 'ethereum-private-key-to-public-key'
import publicKeyToAddress from 'ethereum-public-key-to-address'
import { init } from 'etherscan-api'
import { logger } from '../../../util/log'
import { Chain } from '../chain'

/**
 * used as base for chains like BNB, AVAX etc
 */
export class ETHChain extends Chain {
  name = 'eth'

  protected api: any

  async init() {
    this.api = init(this.app.config.apis.eth.token)
  }

  isValidPrivateKey(key: string): boolean {
    return key.length === 64
  }

  async getTransactions(address: string) {
    try {
      const { result } = await this.api.account.txlist(address, 0, 'latest', 0, 1, 'desc')
      return result
    } catch (error) {
      if (error.toString() !== 'No transactions found') {
        logger.error('getTransactions: ')
        logger.error(error)
      }

      return []
    }
  }

  async getBalance(address: string): Promise<BigInt> {
    try {
      const { result: balance } = await this.api.account.balance(address)
      return BigInt(balance)
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
}
