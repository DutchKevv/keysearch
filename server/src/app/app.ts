import express from 'express'
import DB from './db'
import { SearchCode } from './search-code';
import { logger } from '../util/log';

export class App {

    async init() {
        await DB.init()

        this.initApi()
    }

    async startSearch(searchText: string, fileExtension: string) {
        const searchCode = new SearchCode(searchText, fileExtension);
        await searchCode.search()
    }
    
    private initApi() {
        const app = express()
        const port = 4444
        
        app.use(express.static('public'))
        
        app.get('/', (req, res) => {
          res.send('Hello World!')
        })

        app.get('/api/pairs', async (req, res) => {
          const rows = await DB.db.all(`SELECT privateKey,publicKey,address,gitUrl,filename FROM pairs`)
          res.send(rows)
        })
        
        app.listen(port, () => {
          logger.info(`Example app listening on port ${port}`)
        })
        
    }
}