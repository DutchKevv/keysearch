import express from 'express'
import { join } from 'path'
import { BNBChain } from './modules/chain/eth/bnb.chain'
import { ETHChain } from './modules/chain/eth/eth.chain'
import { SOLChain } from './modules/chain/sol/sol.chain'
import { db } from './modules/db/db'
import { FileController } from './modules/file/file.controller'
import { FileParser } from './modules/file/file.parser'
import { ScraperController } from './modules/scraper/scraper.controller'
import { WalletController } from './modules/wallet/wallet.controller'
import { logger } from './util/log'
import { AVAXChain } from './modules/chain/eth/avax.chain'

process.env.TZ = 'Etc/Universal' // UTC +00:00

const PORT = 4444
const PATH_PUBLIC = join(__dirname, '../../client/src')

export class App {
  config = require('../../config.json')

  chains = {
    eth: new ETHChain(this),
    bnb: new BNBChain(this),
    sol: new SOLChain(this),
    avax: new AVAXChain(this)
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

    // init all chains
    await Promise.all(Object.values(this.chains).map(chain => chain.init()))

    // public API's (browser etc)
    await this.initClientApi()
  }

  private async initClientApi() {
    const app = express()
    app.use(express.static(PATH_PUBLIC))

    // Wallets API
    app.get('/api/wallets', async (req, res) => {
      const wallets = await this.walletController.getAll()

      // convert BigInt to string
      for (const wallet of wallets) {
        for (const key in wallet) {
          if (typeof wallet[key] === 'bigint') {
            wallet[key] = wallet[key].toString()
          }
        }
      }

      res.send(wallets)
    })

    app.listen(PORT, () => {
      logger.info(`App listening on port http://localhost:${PORT}`)
    })
  }
}
