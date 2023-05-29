import { Repository } from "typeorm";
import { db } from "../../db";
import { IWallet, WalletEntity } from "./wallet.entity";
import { logger } from "../../util/log";
import { FileParser } from "../file/file.parser";
import { getBNBBalance, getBNBTransactions } from "../../util/bnb.util";
import { App } from "../../app";

export class WalletController {

    wallets: IWallet[]
    repository: Repository<WalletEntity>

    constructor(public app: App) {}

    async init(): Promise<void> {
        this.repository = db.connection.getRepository(WalletEntity)
    }

    async add(wallet: IWallet): Promise<void> {
        await this.repository.insert(wallet)

        console.info(wallet)
    }

    async addFromPrivateKey(privateKey: string, gitUrl: string, filename: string): Promise<IWallet> {
        const address = this.app.chains.eth.getAddressFromPrivateKey(privateKey)

        if (!address) {
            return null
        }

        const existing = await this.findByAddress(address)

        if (existing) {
            return
        }

        const wallet: IWallet = {
            gitUrl,
            filename,
            address,
            privateKey, 
            version: FileParser.VERSION,
            balanceETH: await this.app.chains.eth.getBalance(address),
            balanceBNB: await getBNBBalance(address),
        }

        const [transactionsBNB, transactionsEth] = await Promise.all([
            getBNBTransactions(address),
            this.app.chains.eth.getTransactions(address)
        ])

        // skip wallets with no transactions
        if (!transactionsBNB.length && !transactionsEth.length) {
            logger.debug('Skipping wallet, no transactions')
            return;
        }

        if (transactionsBNB.length) {
            wallet.lastTransaction = new Date(parseInt(transactionsBNB[transactionsBNB.length - 1].timeStamp, 10) * 1000)
            console.log(454545, wallet.lastTransaction, transactionsBNB[transactionsBNB.length - 1] )
        }

        if (transactionsEth.length) {
            const date = new Date(parseInt(transactionsEth[transactionsEth.length - 1].timeStamp, 10) * 1000)
            if (!wallet.lastTransaction || date > wallet.lastTransaction) {
                wallet.lastTransaction = date
            }
        }

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
        return this.repository.findOne({ 
            where: { address }, 
            select: ['id', 'lastTransaction', 'privateKey', 'address', 'gitUrl', 'filename', 'balanceETH', 'balanceBNB']
        })
    }

    find(): Promise<IWallet[]> {
        return this.repository.find({ 
            select: ['id', 'lastTransaction', 'privateKey', 'address', 'gitUrl', 'filename', 'balanceETH', 'balanceBNB']
        })
    }
}