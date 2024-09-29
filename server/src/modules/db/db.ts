import { join } from 'path'
import { DataSource } from 'typeorm'
import { WalletEntity } from '../wallet/wallet.entity'
import { FileEntity } from '../file/file.entity'

const DB_PATH = join(__dirname, '../../../../_data/data.db')

export class DB {

    connection: DataSource

    async init() {
        const myDataSource = new DataSource({
            type: "sqlite",
            database: DB_PATH,
            entities: [WalletEntity, FileEntity],
            logging: false,
            synchronize: true,
        })

        this.connection = await myDataSource.initialize()
    }
}

export const db = new DB()

