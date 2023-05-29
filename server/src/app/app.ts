import express from 'express'
import { db } from './db'
import { logger } from './util/log';
import { WalletController } from './modules/wallet/wallet.controller';
import { ScraperController } from './modules/scraper/scraper.controller';
import { FileParser } from './modules/file/file.parser';
import { join } from 'path';
import { FileController } from './modules/file/file.controller';
import { EthChain } from './modules/chain/eth.chain';

process.env.TZ = 'Etc/Universal'; // UTC +00:00

const PORT = 4444
const PATH_PUBLIC = join(__dirname, '../../../client/src')

export class App {

  config = require('../../../config.json')
 
  chains = {
    eth: new EthChain(this),
    bnb: null
  }

  walletController = new WalletController(this)
  scraperController = new ScraperController(this)
  fileController = new FileController(this)
  fileParser =  new FileParser(this)

  async init() {
    await db.init()
    await this.walletController.init()
    await this.scraperController.init()
    await this.fileController.init()
    await this.chains.eth.init()

    await this.initApi()
  }

  private async initApi() {
    const app = express()

    app.get('/api/wallets', async (req, res) => {
      const query = req.query
      const wallets = await this.walletController.find()
      res.send(wallets)
    })

    app.use(express.static(PATH_PUBLIC))

    return new Promise(resolve => {
      app.listen(PORT, () => {
        logger.info(`App listening on port ${PORT}`)
        resolve(null)
      })
    })
  }
}