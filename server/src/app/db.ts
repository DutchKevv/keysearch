import { join } from 'path'
import { AsyncDatabase } from 'promised-sqlite3'

const DB_PATH = join(__dirname, '../../data/data.db')

export default {

    db: null,

    async init() {
        this.db = await AsyncDatabase.open(DB_PATH)
        await this.createTables()
    },

    async createTables() {
        await this.db.run(`
            CREATE TABLE IF NOT EXISTS pairs (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                filename TEXT, 
                gitUrl TEXT,
                chain TEXT,
                address TEXT,
                publicKey TEXT DEFAULT "", 
                privateKey TEXT DEFAULT "",
                fileContent TEXT,
                version INTEGER
            )`);    
    }
}
