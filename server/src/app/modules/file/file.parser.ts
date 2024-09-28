import { Keypair, PublicKey } from "@solana/web3.js";
import { App } from "../../app";
import bs58 from "bs58";

const publicKeyRegex = /\b(?:0x)?[0-9a-f]{130}\b/i;
const privateKeyRegex = /\b[0-9a-f]{64}\b/i;

function isValidSOLAddress(address: string) {
    try {
        const keypair = Keypair.fromSecretKey(
            bs58.decode(address),
            // bs58.decode('AYPujHVSp7HrY8MDsRUJzNcNDTrWtDDzsoMuvFeLYkz5LtSJmKxMYedYyogVu7kdqMpTxkJaqbGFTPrWX9EYf3A'),
        );
        console.log(`\nPublic key: ${keypair.publicKey.toBase58()}`)
        const secretKeyString = Buffer.from(keypair.secretKey).toString('base64');

        console.log(`Private" key: ${secretKeyString}\n`)
        return true
    } catch (error) {
        // console.log(error)
        return false
    }
}

export interface IFileParseResult {
    public: string[]
    private: {
        value: string
        chain: 'eth' | 'sol'
    }[]
}

export class FileParser {

    static VERSION = 0.1

    constructor(public app: App) { }

    async parse(fileContent: string, fileExtension?: string): Promise<IFileParseResult> {
        const keys: IFileParseResult = { private: [], public: [] }

        // format json file to make sure every line is separate
        if (fileExtension === 'json') {
            fileContent = this.formatJSON(fileContent)
        }

        // split file into lines
        const lines = fileContent.split(/\r?\n|\r|\n/g)

        // loop over each line
        for (let i = 0, len = lines.length; i < len; i++) {
            const line = lines[i]

            const privateKey = this.parseLine(line)

            // find the word private
            if (privateKey) {
                keys.private.push(privateKey)
            }
        }

        // remove duplicates
        keys.private = Array.from(new Set(keys.private))

        return keys
    }

    parseLine(line: string): { value: string, chain: 'eth' | 'sol' } {
        if (line.match(/phrase/i)) {
            // console.error('HPRASSE P', line)
        }

        // find the word private
        // if (line.match(/PRIVATE/i) || line.match(/KEY/i) || line.match(/SECRET/i) || line.match(/WALLET/i) || line.match(/ADDRESS/i)) {
            return this.extractKeyFromString(line)
        // }
    }

    extractKeyFromString(line: string): { value: string, chain: 'eth' | 'sol' } {
        const value = line.split('=')[1] || line.split(':')[1]

        if (!value) {
            return null
        }

        let cleanValue = value.replace(/[^A-Za-z0-9]/g, "")

        if (cleanValue.startsWith('0x')) {
            cleanValue = cleanValue.replace('0x', '')
        }

        const isValidETHAddress = this.app.chains.eth.isValidEthPrivateKey(cleanValue);
        const _isValidSOLAddress = isValidSOLAddress(cleanValue)

        if (!_isValidSOLAddress && !isValidETHAddress) {
            return null
        }

        // if (!this.app.chains.eth.isValidEthPrivateKey(cleanValue)) {
        //     return null
        // }

        // console.log(345345, cleanValue)
        return {
            value: cleanValue,
            chain: isValidETHAddress ? 'eth' : 'sol'
        }
    }

    private formatJSON(content: string): string {
        try {
            return JSON.stringify(JSON.parse(content), null, 2)
        } catch (error) {
           return content
        }
    }
}