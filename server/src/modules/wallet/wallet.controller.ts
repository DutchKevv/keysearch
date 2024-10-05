import { Repository } from 'typeorm'
import { App } from '../../app'
import { sleep } from '../../util/common.util'
import { db } from '../db/db'
import { FileParser } from '../file/file.parser'
import { IWallet, WalletEntity } from './wallet.entity'

export class WalletController {
  private repository: Repository<WalletEntity>

  constructor(public app: App) {}

  async init() {
    this.repository = db.connection.getRepository(WalletEntity)
  }

  findByPrivateKey(privateKey: string): Promise<IWallet> {
    return this.repository.findOne({ where: { privateKey } }) as unknown as Promise<IWallet>
  }

  getAll(): Promise<IWallet[]> {
    return this.repository.find() as unknown as Promise<IWallet[]>
  }

  async add(wallet: IWallet) {
    await this.repository.insert(wallet as any)
  }

  async addFromPrivateKey(privateKey: string, gitUrl: string, filename: string, chain: 'eth' | 'sol') {
    const existing = await this.findByPrivateKey(privateKey)

    if (existing) {
      return
    }

    const wallet: IWallet = {
      chain,
      gitUrl,
      filename,
      address: null,
      privateKey,
      version: FileParser.VERSION,
      balanceETH: BigInt(0),
      balanceBNB: BigInt(0),
      balanceSOL: BigInt(0),
      balanceAVAX: BigInt(0),
      lastCheck: new Date
    }

    switch (chain) {
      case 'eth':
        await this.addFromPrivateKeyETH(wallet)
        break;
      case 'sol':
        await this.addFromPrivateKeySOL(wallet)
        break;
      default:
        throw new Error('Uknown chain: ' + chain)
    }

    // save to DB
    if (wallet.address) {
      console.log(wallet)
      await this.add(wallet)
    }
  }

  private async addFromPrivateKeyETH(wallet: IWallet): Promise<IWallet> {
    const address = this.app.chains.eth.getAddressFromPrivateKey(wallet.privateKey)

    if (!address) {
      return
    }

    wallet.address = address

    await sleep(1000)

    const [transactionsBNB, transactionsETH, transactionsAVAX] = await Promise.all([
      this.app.chains.bnb.getTransactions(address),
      this.app.chains.eth.getTransactions(address),
      this.app.chains.avax.getTransactions(address),
    ])

    if (transactionsBNB.length) {
      wallet.balanceBNB = await this.app.chains.bnb.getBalance(address)
      wallet.lastTransaction = new Date(parseInt(transactionsBNB.at(0).timeStamp, 10) * 1000)
    }

    if (transactionsETH.length) {
      wallet.balanceETH = await this.app.chains.eth.getBalance(address)
      wallet.lastTransaction = new Date(parseInt(transactionsETH.at(0).timeStamp, 10) * 1000)
    }

    if (transactionsAVAX.length) {
      wallet.balanceAVAX = await this.app.chains.avax.getBalance(address)
      console.log(wallet.balanceAVAX)
      // wallet.lastTransaction = new Date(parseInt(transactionsAVAX.at(0).timeStamp, 10) * 1000)
    }

    return wallet
  }

  private async addFromPrivateKeySOL(wallet: IWallet): Promise<IWallet> {
    const address = this.app.chains.sol.getAddressFromPrivateKey(wallet.privateKey)
    wallet.address = address

    const transactions = await this.app.chains.sol.getTransactions(address)
    wallet.balanceSOL = await this.app.chains.sol.getBalance(address)

    if (transactions.length) {
      wallet.lastTransaction = new Date(parseInt(transactions.at(0).timeStamp, 10) * 1000)
    }

    return wallet
  }
}
