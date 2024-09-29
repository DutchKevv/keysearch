import { Repository } from 'typeorm'
import { App } from '../../app'
import { sleep } from '../../util/common.util'
import { db } from '../db/db'
import { FileParser } from '../file/file.parser'
import { IWallet, WalletEntity } from './wallet.entity'

export class WalletController {
  private repository: Repository<WalletEntity>

  constructor(public app: App) {}

  async init(): Promise<void> {
    this.repository = db.connection.getRepository(WalletEntity)
  }

  async add(wallet: IWallet): Promise<void> {
    await this.repository.insert(wallet)
  }

  async addFromPrivateKeySol(privateKey: string, gitUrl: string, filename: string): Promise<IWallet> {
    const address = this.app.chains.sol.getAddressFromPrivateKey(privateKey)

    if (!address) {
      return null
    }

    const existing = await this.findByAddress(address)

    if (existing) {
      return
    }

    const wallet: IWallet = {
      chain: 'sol',
      gitUrl,
      filename,
      address,
      privateKey,
      version: FileParser.VERSION,
      balanceETH: 0,
      balanceBNB: 0,
      balanceSOL: 0,
    }

    const transactions = await this.app.chains.sol.getTransactions(address)
    wallet.balanceSOL = await this.app.chains.sol.getBalance(address)

    if (transactions.length) {
      wallet.lastTransaction = new Date(parseInt(transactions.at(0).timeStamp, 10) * 1000)
    }

    if (wallet.balanceSOL) {
      console.log(wallet)
    }

    await this.add(wallet)

    return wallet
  }

  async addFromPrivateKeyEth(privateKey: string, gitUrl: string, filename: string): Promise<IWallet> {
    const address = this.app.chains.eth.getAddressFromPrivateKey(privateKey)

    if (!address) {
      return null
    }

    const existing = await this.findByAddress(address)

    if (existing) {
      return
    }

    await sleep(1000)

    const wallet: IWallet = {
      chain: 'eth',
      gitUrl,
      filename,
      address,
      privateKey,
      version: FileParser.VERSION,
      balanceETH: 0,
      balanceBNB: 0,
      balanceSOL: 0,
    }

    const [transactionsBNB, transactionsEth] = await Promise.all([
      this.app.chains.bnb.getTransactions(address),
      this.app.chains.eth.getTransactions(address),
    ])

    if (transactionsBNB.length) {
      wallet.balanceBNB = await this.app.chains.bnb.getBalance(address)
      wallet.lastTransaction = new Date(parseInt(transactionsBNB.at(0).timeStamp, 10) * 1000)
    }

    if (transactionsEth.length) {
      wallet.balanceETH = await this.app.chains.eth.getBalance(address)
      wallet.lastTransaction = new Date(parseInt(transactionsEth.at(0).timeStamp, 10) * 1000)
    }

    // if (wallet.balanceETH > 0) {
    //     logger.warn(`ETH HIGHER THEN 0, address: ${address}, privateKey: ${privateKey}, value: ${wallet.balanceETH}`)
    // }

    // if (wallet.balanceBNB > 0) {
    //     logger.warn(`BNB HIGHER THEN 0, address: ${address}, privateKey: ${privateKey}, value: ${wallet.balanceBNB}`)
    // }

    await this.add(wallet)

    return wallet
  }

  findByAddress(address: string): Promise<IWallet> {
    return this.repository.findOne({ where: { address } })
  }

  getAll(): Promise<IWallet[]> {
    return this.repository.find()
  }
}
