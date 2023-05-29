import { App } from "../../app";

export abstract class Scraper {

    constructor(public app: App) {}

    async init() {}
}