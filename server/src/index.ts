import { App } from './app/app';
import { logger } from './util/log';

(async () => {
 
    const app = new App()
    await app.init()

    const searchArray = createRandomSearchArray()

    for (let i = 0, len = searchArray.length; i < len; i++) {
        const searchArrayItem = searchArray[i]

        logger.info(`Searching on text: ${searchArrayItem[0]}, extension: ${searchArrayItem[1]}`)
        
        await app.startSearch(searchArrayItem[0], searchArrayItem[1])
    }
})();


function createRandomSearchArray() {
    const config = require('../../config.json')
    const searchArray = []

    config.words.forEach(word => {
        config.extensions.forEach(extension => {
            searchArray.push([word, extension])
        })
    })

    return searchArray.sort((a, b) => 0.5 - Math.random());
}