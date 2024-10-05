import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export interface IWallet {
  id?: number
  address: string
  filename: string
  gitUrl?: string
  chain?: string
  privateKey: string
  fileContent?: string
  balanceBNB?: BigInt
  balanceETH?: BigInt
  balanceSOL?: BigInt
  balanceAVAX?: BigInt
  lastTransaction?: Date
  lastCheck?: Date
  version: number
}

export class ColumnNumberTransformer {
  public to(data: BigInt): string {
    return data.toString()
  }

  public from(data: string): BigInt {
      return BigInt(data)
  }
}

@Entity({ name: 'wallets' })
export class WalletEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ nullable: false })
  address: string

  @Column({ nullable: false })
  filename: string

  @Column()
  gitUrl: string

  @Column({ default: null })
  chain: string

  @Column({ nullable: false })
  privateKey: string

  @Column({ nullable: true })
  fileContent: string

  @Column()
  version: number

  @Column({ default: null })
  lastTransaction: Date

  @Column({ transformer: new ColumnNumberTransformer()})
  balanceETH: string

  @Column({ transformer: new ColumnNumberTransformer()})
  balanceBNB: string

  @Column({ transformer: new ColumnNumberTransformer() })
  balanceSOL: string

  @Column({ transformer: new ColumnNumberTransformer() })
  balanceAVAX: string

  @Column({ nullable: false})
  lastCheck: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
