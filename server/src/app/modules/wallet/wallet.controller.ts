import { Repository } from "typeorm";
import { db } from "../db/db";
import { IWallet, WalletEntity } from "./wallet.entity";
import { logger } from "../../util/log";
import { FileParser } from "../file/file.parser";
import { App } from "../../app";
import { sleep } from "../../util/common.util";

export class WalletController {

    repository: Repository<WalletEntity>

    constructor(public app: App) {}

    async init(): Promise<void> {
        this.repository = db.connection.getRepository(WalletEntity)
    }

    async add(wallet: IWallet): Promise<void> {
        await this.repository.insert(wallet)

        console.info(wallet)
    }

    async addFromPrivateKeySol(privateKey: string, gitUrl: string, filename: string): Promise<IWallet> {
        return
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

        console.log('ETH TICK', new Date)

        const [transactionsBNB, transactionsEth] = await Promise.all([
            this.app.chains.bnb.getTransactions(address),
            this.app.chains.eth.getTransactions(address)
        ])

        // skip wallets with no transactions
        if (!transactionsBNB.length && !transactionsEth.length) {
            logger.info('Skipping wallet, no transactions')
            return;
        }

        if (transactionsBNB.length) {
            wallet.balanceBNB = await this.app.chains.bnb.getBalance(address)
            wallet.lastTransaction = new Date(parseInt(transactionsBNB.at(0).timeStamp, 10) * 1000)
            console.log('\n', 454545, wallet.lastTransaction, transactionsBNB.at(-1))
            console.log(transactionsBNB)
        }

        if (transactionsEth.length) {
            wallet.balanceETH = await this.app.chains.eth.getBalance(address)
            const date = new Date(parseInt(transactionsEth.at(0).timeStamp, 10) * 1000)
            if (!wallet.lastTransaction || date > wallet.lastTransaction) {
                wallet.lastTransaction = date
            }
        }

        console.log(2323)

        if (wallet.balanceETH > 0) {
            logger.warn(`ETH HIGHER THEN 0, address: ${address}, privateKey: ${privateKey}, value: ${wallet.balanceETH}`)
        }

        if (wallet.balanceBNB > 0) {
            logger.warn(`BNB HIGHER THEN 0, address: ${address}, privateKey: ${privateKey}, value: ${wallet.balanceBNB}`)
        }

        await this.add(wallet)

        return wallet
    }

    findByAddress(address: string): Promise<IWallet> {
        return this.repository.findOne({where: { address }})
    }

    getAll(): Promise<IWallet[]> {
        return this.repository.find()
    }
}
