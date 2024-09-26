import { Column, CreateDateColumn, Entity, EntitySchema, EntitySchemaOptions, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export interface IWallet {
    id?: number
    address: string
    filename: string
    gitUrl?: string
    chain?: string
    privateKey: string
    fileContent?: string
    balanceBNB?: number
    balanceETH?: number
    balanceSOL?: number
    lastTransaction?: Date
    lastCheck?: Date
    version: number
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

    @Column({default: null})
    chain: string
    
    @Column({ nullable: false })
    privateKey: string

    @Column({ nullable: true })
    fileContent: string

    @Column()
    version: number

    @Column({ default: null })
    lastTransaction: Date

    @Column({ default: 0 })
    balanceETH: number

    @Column({ default: 0 })
    balanceBNB: number

    @CreateDateColumn()
    lastCheck: Date

    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
}
