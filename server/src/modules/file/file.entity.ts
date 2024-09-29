import { Column, CreateDateColumn, Entity, EntitySchema, EntitySchemaOptions, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

export interface IFile {
    id?: number
    url?: string
    content?: string
    name?: string
    extension?: string
}

@Entity({name: 'files'})
export class FileEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ nullable: false })
    name: string

    @Column({ nullable: false })
    extension: string

    @Column({ nullable: false })
    url: string

    @CreateDateColumn()
    lastCheck: Date

    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
}
