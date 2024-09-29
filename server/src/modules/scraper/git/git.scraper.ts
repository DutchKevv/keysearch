import { throttling } from '@octokit/plugin-throttling'
import { Octokit } from '@octokit/rest'
import { App } from '../../../app'
import { sleep } from '../../../util/common.util'
import { logger } from '../../../util/log'
import { showProgressBar } from '../../../util/terminal'
import { Scraper } from '../scraper'

const MyOctokit = Octokit.plugin(throttling)

export class GitScraper extends Scraper {
  octokit: Octokit

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
          logger.warn(`Sleeping: Request quota exhausted for request ${options.method} ${options.url}`)

          if (retryCount < 5) {
            showProgressBar(retryAfter, 'sleep', true)
            return true
          }
        },
        onSecondaryRateLimit: (retryAfter, options: any, octokit) => {
          // does not retry, only logs a warning
          logger.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`)
        },
      },
    })
    this.octokit.rest.users.getAuthenticated()

    // await this.getRateLimit();
  }

  async searchRepositories(searchText: string, page = 1, order: 'desc' | 'asc' = 'asc') {
    logger.info(`Searching GIT repos: "${searchText}", order: ${order}, page: ${page}`)

    try {
      // call github API
      const { data } = await this.octokit.rest.search.repos({
        q: `${searchText}`,
      })

      for (let i = 0, len = data.items.length; i < len; i++) {
        const item = data.items[i]
      }
    } catch (error) {
      logger.error(error?.data?.message || error?.data || error)
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
      logger.error(error?.data?.message || error?.data || error)
      return null
    }
  }

  // recursive search loop
  async searchCode(searchText: string, fileExtension: string, page = 1, order: 'desc' | 'asc' = 'asc') {
    try {
      await sleep(1000)

      logger.info(`Searching GIT code: "${searchText}", extension: ${fileExtension}, order: ${order}, page: ${page}`)

      const itemsPerPage = 100 // max per page
      let counter = itemsPerPage * (page - 1)

      // call github API
      const { data } = await this.octokit.rest.search.code({
        // q: `${searchText} in:file filename:.${fileExtension}`,
        q: `${searchText} in:file extension:${fileExtension}`,
        // q: `"${searchText}" AND "KEY" in:file extension:${fileExtension}`,
        // q: `${searchText} in:file extension:${fileExtension}`,
        // q: `${searchText} in:file language:${'shell'}`,
        // q: `in:file+extension:${fileExtension}+${searchText}`,
        // q: `example+in:file+language:javascript+pushed:>=2023-01-01`,
        // q: `in:file+extension:${fileExtension}+${searchText}`,
        // q: `in:file+extension:${fileExtension}+${searchText}+pushed:>2012-01-01`,
        // q: `pushed:>2018-01-01&in:file+extension:${fileExtension}+${encodeURIComponent(searchText)}+pushed:>2012-01-01`,
        // q: `pushed:>2022-01-01&in:file+extension:${fileExtension}+${encodeURIComponent(searchText)}`,
        per_page: itemsPerPage, // max = 100
        order,
        page,
      })

      if (!data.items.length) {
        return
      }

      const progressBar = showProgressBar(data.items.length, 'files')

      // loop over each file
      for (const file of data.items) {
        await this.parseFromUrl(file.git_url, file.name)
        progressBar.tick()
      }

      // keep looping until last page
      if (data.total_count > (counter += data.items.length)) {
        await this.searchCode(searchText, fileExtension, ++page, order)
      }
    } catch (error) {
      logger.error(error?.data?.message || error?.data || error)
      return null
    }
  }

  private async parseFromUrl(url: string, filename: string): Promise<void> {
    try {
      if (!this.hasAllowedFilename(filename)) {
        logger.info(`skipping.. ${filename} contains excluded words`)
        return
      }

      // already parsed
      if (await this.app.fileController.findByUrl(url)) {
        logger.debug({ url, filename }, `skipping.. file already parsed`)
        return
      }

      // load file content
      const fileContent = await this.loadFileByGitUrl(url)

      // parse file content
      const keys = this.app.fileParser.parse(fileContent, null, filename)

      for (const key of keys) {
        switch (key.chain) {
          case 'eth':
            await this.app.walletController.addFromPrivateKeyEth(key.value, url, filename)
            break
          case 'sol':
            await this.app.walletController.addFromPrivateKeySol(key.value, url, filename)
            break
          default:
            throw new Error('Unkown chain: ' + key.chain)
        }
      }

      await this.app.fileController.add({
        name: filename,
        url,
        extension: '.env',
      })
    } catch (error) {
      logger.error('GIT LOAD URL ERROR')
    }
  }

  private async loadFileByGitUrl(gitUrl: string): Promise<string | undefined> {
    try {
      const { data } = await this.octokit.request(`GET ${gitUrl}`)

      if (data) {
        const buff = Buffer.from(data.content, 'base64')
        const text = buff.toString('ascii')
        return text
      }
    } catch (error) {
      logger.error(error)
      return ''
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
