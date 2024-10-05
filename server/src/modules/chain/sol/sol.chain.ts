import { Connection, Keypair, ParsedInstruction, PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'
import { App } from '../../../app'
import { logger } from '../../../util/log'
import { Chain } from '../chain'

export class SOLChain extends Chain  {

  name: 'sol'

  private connection: Connection

  async init() {
    this.connection = new Connection(this.app.config.apis.solana.rpc, 'confirmed')
  }

  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address)
      return true
    } catch (error) {
      return false
    }
  }

  isValidPrivateKey(privateKey: string): boolean {
    try {
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKey))
      return !!keypair.publicKey
    } catch (error) {
      return false
    }
  }

  getAddressFromPrivateKey(privateKey: string): string {
    try {
      const keypair = Keypair.fromSecretKey(bs58.decode(privateKey))
      return keypair.publicKey.toBase58()
    } catch (error) {
      return null
    }
  }

  async getTransactions(address: string) {
    try {
      const addressKey = new PublicKey(address)

      // load signatures
      const signatures = await this.connection.getSignaturesForAddress(addressKey, { limit: 1 })

      // load transactions
      const parsedTransactions = await this.connection.getParsedTransactions(
        signatures.map(signature => signature.signature),
        { maxSupportedTransactionVersion: 0 }
      )

      logger.debug(`Fetched ${parsedTransactions.length} transactions for Solana address...`)

      const normalizedTxs: any[] = parsedTransactions
        // only without error
        // TODO - needed??
        .filter(tx => tx?.meta?.err === null)

        // group transactions
        .map(tx =>
          (tx.transaction.message.instructions as ParsedInstruction[]).map(instruction => ({
            hash: tx.transaction.signatures[0] || '',
            decimals: instruction.parsed?.info?.tokenAmount?.decimals || 9,
            value: instruction.parsed?.info?.lamports || instruction.parsed?.info?.tokenAmount?.amount,
            timeStamp: tx.blockTime || 0,
            from: instruction.parsed?.info?.source,
            to: instruction.parsed?.info?.destination,
            contractAddress: new PublicKey(instruction.parsed?.info?.mint || 0),
            tokenSymbol: instruction.parsed?.type === 'transfer' ? 'SOL' : '',
            programId: instruction.programId,
          }))
        )

        // multi level array -> flat array
        .flat()

        // reverse
        .reverse()

      return normalizedTxs
    } catch (error) {
      console.error('Error fetching Solana transactions:', error)
      return []
    }
  }

  async getBalance(address: string): Promise<BigInt> {
    try {
      const balance = await this.connection.getBalance(new PublicKey(address))
      return BigInt(balance)
    } catch (error) {
      logger.error('getBalance')
      logger.error(error)
      return BigInt(0)
    }
  }
}
