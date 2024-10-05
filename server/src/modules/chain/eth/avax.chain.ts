import { ethers } from 'ethers'
import { logger } from '../../../util/log'
import { ETHChain } from './eth.chain'

export class AVAXChain extends ETHChain {
  name = 'avax'

  async init() {
    this.api = new ethers.JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc')
  }

  async getTransactions(address: string) {
    try {
      const txCount = await this.api.getTransactionCount(address)
      return new Array(txCount).map(() => {})
      // const { result } = await this.api.account.txlist(address, 0, 'latest', 0, 1, 'desc')
      // return result
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
      const balance = await this.api.getBalance(address)
      return BigInt(balance)
    } catch (error) {
      logger.error('getBalance')
      logger.error(error)
    }
  }
}
