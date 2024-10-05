import { init } from 'bscscan-api'
import { ETHChain } from './eth.chain'

export class BNBChain extends ETHChain {
  name = 'bnb'

  async init() {
    this.api = init(this.app.config.apis.bnb.token)
  }
}
