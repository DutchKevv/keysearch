import { init } from 'bscscan-api';
import { logger } from './log';
import axios from 'axios';

const config = require('../../../../config.json')

const BNBApi = init(config.apis.bnb.token);

export async function getBNBBalance(address: string): Promise<number> {
  try {
    const balance = await BNBApi.account.balance(address)

    if (balance > 0) {
      return parseFloat(balance.result) / 1e18; // Convert balance from wei to BNB
    }

    return 0
  } catch (error) {
    logger.error(error)
  }
}

export async function getBNBTransactions(address: string) {
  try {
    const apiKey = config.apis.bnb.token
    const { data } = await axios.get(`https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=0&offset=1&sort=asc&apikey=${apiKey}`)
    return data.result
  } catch (error) {
    console.error(error)
  }
}