import { App } from "../../app";
import { GitScraper } from "./git/git.scraper";
import { Scraper } from "./scraper";

export class ScraperController {
    
    scrapers: any[] = []
    // scrapers: Scraper<typeof Scraper>[] = []

    constructor(public app: App) {}

    async init() {
       await this.add(GitScraper)
    }

    get<T extends Scraper>(ScraperClass: new (app: App) => T): T {
        return this.scrapers.find(scraper => scraper instanceof ScraperClass)
    }

    async add<T extends Scraper>(ScraperClass: new (app: App) => T): Promise<T> {
        const scraper = new ScraperClass(this.app)
        await scraper.init()
        this.scrapers.push(scraper)
        return scraper
    }
}