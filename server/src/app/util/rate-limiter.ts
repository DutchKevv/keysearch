import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import { createTokenAuth } from "@octokit/auth-token";
import { logger } from "./log"
import { showProgressBar } from "./terminal"

const config = require('../../../../../../config.json')

const MyOctokit = Octokit.plugin(throttling);

export class GitRateLimiter {
    resetTime = Date.now()
    remaining = 10000000

    private queue: { weight: number, method: () => Promise<any> }[] = []
    private interval: NodeJS.Timer
    private waiting = false
    octokit: Octokit

    constructor() {
        this.interval = setInterval(() => this.tick(), 500)
    }

    async init() {
        const auth = createTokenAuth(config.apis.git.token)
        const { token } = await auth();

        this.octokit = new MyOctokit({
            auth: token,
            throttle: {
                onRateLimit: (retryAfter, options: any, octokit, retryCount) => {
                  logger.warn(
                    `Request quota exhausted for request ${options.method} ${options.url}`
                  );
            
                  if (retryCount < 5) {
                    // only retries once
                    octokit.log.info(`Retrying after ${retryAfter} seconds!`);
                    return true;
                  }
                },
                onSecondaryRateLimit: (retryAfter, options: any, octokit) => {
                  // does not retry, only logs a warning
                  logger.warn(
                    `SecondaryRateLimit detected for request ${options.method} ${options.url}`
                  );
                },
              },
        })

        const user = await this.octokit.auth()

        await this.getRateLimit()
    }

    async getRateLimit() {
        const result = await this.octokit.request('GET /rate_limit')
        // console.log(3333, result.data)
    }

    async add(method: any, weight: number): Promise<any> {
        const wrapper = new Promise(async (resolve, reject) => {
            this.queue.push({
                weight,
                method: async () => {
                    try {
                        const result = await method()
                        const headers = result.headers
                        const weightUsed = headers['x-ratelimit-used']
                        this.remaining = parseFloat(headers['x-ratelimit-remaining'])
                        this.resetTime = (parseInt(headers['x-ratelimit-reset'], 10) * 1000) + 2000
                        resolve(result)
                    } catch (error) {
                        console.error(3434344, error.status)
                        reject(error)
                    }
                }
            })
        })

        return wrapper
    }

    private async tick() {
        if (!this.queue.length) {
            return
        }

        // const requiredWeight = this.queue[0].weight

        if (this.queue[0].weight && (this.remaining < 2 && Date.now() < this.resetTime)) {
            if (this.waiting) {
                return
            }

            this.waiting = true

            const totalWaitTime = Math.ceil((this.resetTime - Date.now()) / 1000)

            showProgressBar(totalWaitTime, 'GitHub API')

            return
        }

        this.waiting = false

        const queueItem = this.queue.shift()

        await queueItem.method()
    }
}