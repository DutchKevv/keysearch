import { App } from "../../../app"
import { Scraper } from "../scraper"
import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import { createTokenAuth } from "@octokit/auth-token";
import { logger } from "../../../util/log"
import { showProgressBar } from "../../../util/terminal"

const MyOctokit = Octokit.plugin(throttling);

export class GitScraper extends Scraper {

    octokit: Octokit

    private itemsPerPage = 100

    constructor(public app: App) {
        super(app)
    }

    async init() {
        // const auth = createTokenAuth(this.app.config.apis.git.token)
        // const { token } = await auth();

        this.octokit = new MyOctokit({
            auth: this.app.config.apis.git.token,
            userAgent: 'KeySearch v0.0.3',
            baseUrl: 'https://api.github.com',
            throttle: {
                onRateLimit: (retryAfter, options: any, octokit, retryCount) => {
                    logger.warn(
                        `Sleeping: Request quota exhausted for request ${options.method} ${options.url}`
                    );

                    if (retryCount < 5) {
                        showProgressBar(retryAfter, 'sleep', true)
                        return true;
                    }
                },
                onSecondaryRateLimit: (retryAfter, options: any, octokit) => {
                    // does not retry, only logs a warning
                    logger.warn(
                        `SecondaryRateLimit detected for request ${options.method} ${options.url}`
                    )
                }
            }
        })

        // await this.getRateLimit();
    }

    async searchRepositories(searchText: string, page = 1, order: 'desc' | 'asc' = 'asc') {
        logger.info(`Searching GIT repos: "${searchText}", order: ${order}, page: ${page}`)

        try {
            // call github API
            const { data } = await this.octokit.rest.search.repos({
                q: `${searchText}`
            })

            for (let i = 0, len = data.items.length; i < len; i++) {
                const item = data.items[i]
            }
        } catch (error) {
            console.error(error?.data?.message || error?.data || error)
            return null
        }
    }

    async searchCommits(searchText, owner: string, repo: string, page = 1, order: 'desc' | 'asc' = 'asc') {
        logger.info(`Searching GIT commits: "${owner}", repo: ${repo}, order: ${order}, page: ${page}`)

        try {
            // call github API
            const { data: commits } = await this.octokit.request(`GET /repos/{owner}/{repo}/commits`, { owner, repo })

            for (let i = 0, len = commits.length; i < len; i++) {
                const { commit } = commits[i]

                const { data } = await this.octokit.request(`GET ${commit.tree.url}`, { owner, repo })

                for (let k = 0, lenk = data.tree.length; k < lenk; k++) {
                    const treeItem = data.tree[k]

                    if (treeItem.type !== 'tree') {
                        await this.parseFromUrl(treeItem.url, treeItem.path)
                    }
                }
            }
        } catch (error) {
            console.error(error?.data?.message || error?.data || error)
            return null
        }
    }

    // recursive search loop
    async searchCode(searchText: string, fileExtension: string, page = 1, order: 'desc' | 'asc' = 'asc') {
        logger.info(`Searching GIT code: "${searchText}", extension: ${fileExtension}, order: ${order}, page: ${page}`)
        let counter = this.itemsPerPage * (page - 1)

        try {
            // call github API
            const { data } = await this.octokit.rest.search.code({
                q: `in:file+extension:${fileExtension}+${searchText}`,
                // q: `in:file+extension:${fileExtension}+${searchText}`,
                // q: `in:file+extension:${fileExtension}+${searchText}+pushed:>2012-01-01`,
                // q: `pushed:>2018-01-01&in:file+extension:${fileExtension}+${encodeURIComponent(searchText)}+pushed:>2012-01-01`,
                // q: `pushed:>2022-01-01&in:file+extension:${fileExtension}+${encodeURIComponent(searchText)}`,
                per_page: this.itemsPerPage,
                order,
                page
            })

            if (!data.items.length) {
                return
            }

            const progressBar = showProgressBar(data.items.length, 'files')

            // loop over each file
            for (let i = 0, len = data.items.length; i < len; i++) {
                ++counter

                const file = data.items[i]

                await this.parseFromUrl(file.git_url, file.name)

                try {
                    progressBar.tick()
                } catch (error) {
                    console.error(error)
                }

            }

            // keeop looping until last page
            if (data.total_count > counter) {
                page++

                await this.searchCode(searchText, fileExtension, page, order)
            }
        } catch (error) {
            console.error(error?.data?.message || error?.data || error)
            return null
        }
    }

    private async parseFromUrl(url: string, filename: string): Promise<void> {
        if (!this.hasAllowedFilename(filename)) {
            logger.debug(`skipping.. ${filename} contains excluded words`)
            return
        }

        const existing = await this.app.fileController.findByUrl(url)

        if (existing) {
            logger.debug(`skipping.. ${url} already parsed`)
            return
        }

        try {
            // load file content
            const fileContent = await this.loadFileByGitUrl(url)

            if (!fileContent) {
                logger.warn('error loading file from git: ', url)
            }

            // parse file content
            const keys = await this.app.fileParser.parse(fileContent)

            for (let i = 0, len = keys.private.length; i < len; i++) {
                const privateKey = keys.private[i]

                if (privateKey.chain === 'eth') {
                    await  this.app.walletController.addFromPrivateKeyEth(privateKey.value, url, filename)
                } else {
                    await  this.app.walletController.addFromPrivateKeySol(privateKey.value, url, filename)
                }
            }

            await this.app.fileController.add({
                name: filename,
                url,
                extension: 'test'
            })
        } catch (error) {
            console.error(555, error)
            console.error('GIT LOAD URL ERROR')
        }
    }

    private async loadFileByGitUrl(gitUrl: string): Promise<string | undefined> {
        try {
            const { data } = await this.octokit.request(`GET ${gitUrl}`)

            if (data) {
                const buff = Buffer.from(data.content, 'base64');
                const text = buff.toString('ascii');
                return text
            }
        } catch (error) {
            console.log(78787878)
            logger.error(error)
        }
    }

    private async getRateLimit() {
        const result = await this.octokit.request('GET /rate_limit')
        console.log(3333, result.data)
    }

    private hasAllowedFilename(filename: string): boolean {
        return !this.app.config.skipFilenames.some((word: string) => filename.toLowerCase().includes(word.toLowerCase()))
    }
}