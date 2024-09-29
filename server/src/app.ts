import express from 'express'
import { join } from 'path'
import { BNBChain } from './modules/chain/bnb.chain'
import { EthChain } from './modules/chain/eth.chain'
import { SOLChain } from './modules/chain/sol.chain'
import { db } from './modules/db/db'
import { FileController } from './modules/file/file.controller'
import { FileParser } from './modules/file/file.parser'
import { ScraperController } from './modules/scraper/scraper.controller'
import { WalletController } from './modules/wallet/wallet.controller'
import { logger } from './util/log'

process.env.TZ = 'Etc/Universal' // UTC +00:00

const PORT = 4444
const PATH_PUBLIC = join(__dirname, '../../client/src')

export class App {
  config = require('../../config.json')

  chains = {
    eth: new EthChain(this),
    bnb: new BNBChain(this),
    sol: new SOLChain(this),
  }

  walletController = new WalletController(this)
  scraperController = new ScraperController(this)
  fileController = new FileController(this)
  fileParser = new FileParser(this)

  async init() {
    await db.init()
    await this.walletController.init()
    await this.scraperController.init()
    await this.fileController.init()

    // init chains
    await Promise.all([this.chains.eth.init(), this.chains.bnb.init(), this.chains.sol.init()])

    // public API's (browser etc)
    await this.initClientApi()
  }

  private async initClientApi() {
    const app = express()
    app.use(express.static(PATH_PUBLIC))

    // Wallets API
    app.get('/api/wallets', async (req, res) => {
      const query = req.query
      const wallets = await this.walletController.getAll()
      res.send(wallets)
    })

    app.listen(PORT, () => {
      logger.info(`App listening on port http://localhost:${PORT}`)
    })
  }
}
