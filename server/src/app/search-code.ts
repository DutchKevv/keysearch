import { logger } from "../util/log";
import FileParser from "./file-parser";
import http, { URLConfig } from "./http";

export class SearchCode {

    page = 1
    results = {}

    private baseUrl = 'https://api.github.com/search/code'
    private fileParser = new FileParser
    private itemsPerPage = 100

    constructor(public searchText: string, public fileExtension: string) {}

    async search() {
       await this.searchLoop()
       return this.results
    }

    async getFileFromGitUrl(gitUrl: string): Promise<string | undefined> {
        try {
            const { data } = await http.get(gitUrl, URLConfig)
            
            if (data) {
                const buff = Buffer.from(data.content, 'base64');
                const text = buff.toString('ascii');
                return text
            }
        } catch (error) {
            logger.error(error)
        }
    }

    private async searchLoop() {
        try {
            const URL = this.constructUrl()
    
            // Make a request for a user with a given ID
            const { data } = await http.get(URL, URLConfig)
            const items = data.items

            let counter = this.page * this.itemsPerPage - this.itemsPerPage
            logger.info(`${data.total_count} results, retrieved ${items.length} items. incomplete: ${data.incomplete_results}. Page: ${this.page}`)
    
            for (let i = 0, len = items.length; i < len; i++) {
                logger.info(`scanning file ${counter++} of ${data.total_count}`)
                
                const item = items[i]
                const filename = item.name
                const hasAllowedFilename = this.hasAllowedFilename(filename)

                if (!hasAllowedFilename) {
                    logger.warn('skipping.. filename not allowed: ' + filename)
                    continue
                }

                const fileText = await this.getFileFromGitUrl(item.git_url)
                const keys = await this.fileParser.parse(fileText, filename, item.git_url)
                
                if (keys.length) {
                    this.results[item.git_url] = keys
                    console.info(keys)
                }
            }

            if (data.total_count > (this.page * this.itemsPerPage)) {
                this.page++
                await this.searchLoop()
            }
        } catch (error: any) {
            logger.error(error?.reponse || error)
        }
    }

    private hasAllowedFilename(filename: string): boolean {
        const notAllowed = [
            'example',
            'local',
            'test',
            'demo'
        ]

        return !notAllowed.some(word => filename.includes(word))
    }

    private constructUrl(): string {
        return `${this.baseUrl}?per_page=100&page=${this.page}&q=in:file+extension:${this.fileExtension}+${encodeURIComponent(this.searchText)}`
    }
}