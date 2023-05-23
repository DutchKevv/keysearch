import { logger } from "../util/log";
import { init as EthInit} from 'etherscan-api'

const api = EthInit('HK6YW5ECMU76VX26RXWDZQWJC4A7KAIZT3');

export async function getEthBalance(address: string): Promise<number> {
    const balance = await api.account.balance(address);
    const value = parseFloat(balance.result)

    logger.info('ETH balance: ' + value)

    return value
}
