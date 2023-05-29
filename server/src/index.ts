import { App } from './app/app';
import { GitScraper } from './app/modules/scraper/git/git.scraper';
import { logger } from './app/util/log';

(async () => {
 
    const app = new App()
    await app.init()

    const gitScraper = app.scraperController.get(GitScraper)
    const searchArray = createRandomSearchArray()
    
    for (let i = 0, len = searchArray.length; i < len; i++) {
        const searchArrayItem = searchArray[i]
        
        await gitScraper.searchCode(searchArrayItem[0], searchArrayItem[1], 1, searchArrayItem[2])
    }
})();


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