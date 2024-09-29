import { App } from './app';
import { GitScraper } from './modules/scraper/git/git.scraper';
import { logger } from './util/log';

async function main() {
    const app = new App()
    await app.init()

    const gitScraper = app.scraperController.get(GitScraper)
    const searchArray = createRandomSearchArray()

    for (let i = 0, len = searchArray.length; i < len; i++) {
        const searchArrayItem = searchArray[i]

        // await gitScraper.searchRepositories(searchArrayItem[0], 1, searchArrayItem[2])
        await gitScraper.searchCode(searchArrayItem[0], searchArrayItem[1], 1, searchArrayItem[2])
    }
}

main()

function createRandomSearchArray() {
    const config = require('../../config.json')
    const searchArray = []

    config.words.forEach(word => {
        config.extensions.forEach(extension => {
            searchArray.push([word, extension, 'asc'])
            searchArray.push([word, extension, 'desc'])
        })
    })

    return searchArray.sort(() => Math.random() - 0.5)
}
