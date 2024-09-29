import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { Connection, Keypair, ParsedInstruction, PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'
import { App } from '../../app'
import { logger } from '../../util/log'

const RPC_HTTP = 'https://mainnet.helius-rpc.com/?api-key=5304e9c1-1453-483b-a656-2c7fd42bd92e'

export class SOLChain {
  private connection: Connection

  private usdcMint: PublicKey = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  private usdtMint: PublicKey = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')
  private mainCoinScanResultsPerPage = 1

  constructor(public app: App) {}

  async init() {
    this.connection = new Connection(RPC_HTTP)
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
      const address = keypair.publicKey.toBase58()
      return address
    } catch (error) {
      return null
    }
  }

  async getTransactions(address: string) {
    try {
      logger.debug({ address }, 'Fetching solana signatures')

      const usdcTokenAccount = getAssociatedTokenAddressSync(this.usdcMint, new PublicKey(address))
      const usdtTokenAccount = getAssociatedTokenAddressSync(this.usdtMint, new PublicKey(address))

      // TODO - stable coins should not be needed, but missing if not given
      const [signaturesUSDC, signaturesUSDT, signaturesTokens] = await Promise.all([
        this.connection.getSignaturesForAddress(usdcTokenAccount, {
          limit: this.mainCoinScanResultsPerPage,
        }),
        this.connection.getSignaturesForAddress(usdtTokenAccount, {
          limit: this.mainCoinScanResultsPerPage,
        }),
        this.connection.getSignaturesForAddress(new PublicKey(address), {
          limit: this.mainCoinScanResultsPerPage,
        }),
      ])

      // merge and map signatures
      const signatures = [...signaturesUSDC, ...signaturesUSDT, ...signaturesTokens].map(signature => signature.signature)

      // load transactions
      const parsedTransactions = await this.connection.getParsedTransactions(signatures, {
        maxSupportedTransactionVersion: 0,
      })

      logger.debug(`Fetched ${parsedTransactions.length} transactions for Solana address...`)

      const normalizedTxs: any[] = parsedTransactions

        // only without error and with instructions
        // TODO - needed??
        .filter(tx => tx?.meta?.err === null && tx.transaction.message?.instructions?.length)

        // group transactions
        .map(tx =>
          (tx.transaction.message.instructions as ParsedInstruction[])
            // .filter(
            //   instruction =>
            //     // only SOL & token transactions
            //     // ['transfer'].includes(instruction.parsed?.type)
            //     instruction ===
            //       tx.transaction.message.instructions.findLast(
            //         (_instruction: ParsedInstruction) =>
            //           _instruction.parsed?.type === 'transfer' && _instruction.parsed?.info.lamports
            //       ) ||
            //     instruction ===
            //       tx.transaction.message.instructions.findLast(
            //         (_instruction: ParsedInstruction) => _instruction.parsed?.type === 'transferChecked'
            //       ) ||
            //     instruction ===
            //       tx.transaction.message.instructions.findLast(
            //         (_instruction: ParsedInstruction) =>
            //           _instruction.program === 'spl-token' && _instruction.parsed?.info?.tokenAmount
            //       )
            //   // && instruction.parsed?.info.lamports
            // )
            .map(instruction => ({
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

        // multi deps array -> flat array
        .flat()

        // reverse
        .reverse()

      return normalizedTxs
    } catch (error) {
      console.error('Error fetching Solana transactions:', error)
      return []
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(new PublicKey(address))
      return balance
    } catch (error) {
      logger.error('getBalance')
      logger.error(error)
      return 0
    }
  }
}
