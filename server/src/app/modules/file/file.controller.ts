import { In, Repository } from "typeorm";
import { db } from "../db/db";
import { FileEntity, IFile } from "./file.entity";
import { App } from "../../app";

export class FileController {

    repository: Repository<FileEntity>

    constructor(public app: App) {}

    async init(): Promise<void> {
        this.repository = db.connection.getRepository(FileEntity)
    }

    async add(file: IFile): Promise<void> {
        const existing = await this.findByUrl(file.url)

        if (!existing) {
            await this.repository.insert(file)
        }
    }

    findByUrl(url: string): Promise<IFile> {
        return this.repository.findOne({ 
            where: { url }, 
            select: ['id', 'url', 'lastCheck']
        })
    }

    find(): Promise<IFile[]> {
        return this.repository.find({ 
            select: ['id', 'url', 'lastCheck']
        })
    }

    async filterMissingUrls(urls: string[]): Promise<string[]> {
        const files = await this.repository.find({where: { url: In(urls) }})

        return urls.filter(url => !files.some(file => file.url === url))
    }
}