import { getAddressFromPrivateKey, getAddressFromPublicKey, getPublicKeyFromPrivateKey } from "../util/eth";
import db from "./db";
import { getEthBalance } from "./etherscan";

export interface IPair {
    address: string
    privateKey: string
    publicKey: string
}

const publicKeyRegex = /\b(?:0x)?[0-9a-f]{130}\b/i;
const privateKeyRegex = /\b[0-9a-f]{64}\b/i;

export default class FileParser {

    static VERSION = 0.1

    async parse(text: string, filename: string, gitUrl: string): Promise<IPair[]> {
        const lines = text.split(/\r?\n|\r|\n/g);
        const results: IPair[] = []
        const chain = 'ETH'

        for (let i = 0, len = lines.length; i < len; i++) {
            const line = lines[i]
            if (line.toUpperCase().includes('PRIVATE')) {
            // if (privateKeyRegex.test(line)) {
                const privateKey = this.getKeyFromLine(line)

                if (!privateKey) {
                    continue
                }

                const publicKey = getPublicKeyFromPrivateKey(privateKey)

                if (!publicKey) {
                    continue
                }

                const publicKeyString = publicKey.toString('hex')

                const address = getAddressFromPublicKey(publicKey)

                if (!address) {
                    continue
                }

                results.push({
                    privateKey,
                    publicKey: publicKeyString,
                    address
                })

                const balance = await getEthBalance(address)

                if (balance > 0) {
                    console.log('ETH HIGHER THEN 0', address, privateKey)
                    throw `error ${address}, ${privateKey}`
                }
                               
                const existing = await db.db.all(`SELECT id FROM pairs WHERE gitUrl=? AND address=?`, [gitUrl, address])

                if (!existing?.length) {
                    await db.db.run(`
                        INSERT INTO pairs (
                            filename, gitUrl, chain, address, publicKey, privateKey, fileContent, version
                            ) 
                            VALUES (?,?,?,?,?,?,?,?)
                            `, 
                            [filename, gitUrl, chain, address, publicKeyString, privateKey, text, FileParser.VERSION])
                }
            }
        }

        return results
    }

    getKeyFromLine(line: string): string {
        if (line.includes('00000000000000')) {
            return null
        }

        const value = line.split('=')[1] || line.split(':')[1]
        return value?.trim().replaceAll('"', '').replaceAll("'", '').replaceAll(';', '')
    }
}