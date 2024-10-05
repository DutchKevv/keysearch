import { App } from '../../app'
import { logger } from '../../util/log'

export interface IFileParseResult {
  value: string
  chain: 'eth' | 'sol'
}

export class FileParser {
  static VERSION = 0.1

  constructor(public app: App) {}

  parse(fileContent: string, fileExtension?: string, filename?: string): IFileParseResult[] {
    let keys: IFileParseResult[] = []

    // format *.json file to make sure every line is separate
    if (fileExtension === 'json') {
      fileContent = this.formatJSON(fileContent)

      if (!fileContent) {
        return
      }
    }

    // split file into lines
    const lines = fileContent.split(/\r?\n|\r|\n/g).filter(line => line.trim().length)

    // do some logging
    if (this.app.config.settings?.logFile) {
      logger.info('\n')
      logger.info({ file: filename }, JSON.stringify(lines, null, 2).green)
    }

    // loop over each line
    for (const line of lines) {
      const key = this.parseLine(line)

      // make sure its unique
      if (key && !keys.some(_key => _key.value === key.value)) {
        keys.push(key)
      }
    }

    return keys
  }

  private parseLine(line: string): IFileParseResult {
    // TODO - more ways a key could be written
    const splitValue = line.split('=')[1] || line.split(':')[1]

    if (!splitValue) {
      return null
    }

    return this.extractKeyFromString(splitValue)
  }

  /**
   * TODO - cleanup
   */
  private extractKeyFromString(lineValue: string): { value: string; chain: 'eth' | 'sol' } {
    let keyValue = lineValue.replace(/[^A-Za-z0-9]/g, '')

    // TODO - ETH only
    if (keyValue.startsWith('0x')) {
      keyValue = keyValue.replace('0x', '')
    }

    const isValidETHAddress = this.app.chains.eth.isValidPrivateKey(keyValue)
    const _isValidSOLAddress = this.app.chains.sol.isValidPrivateKey(keyValue)

    if (!_isValidSOLAddress && !isValidETHAddress) {
      return null
    }

    return {
      value: keyValue,
      chain: isValidETHAddress ? 'eth' : 'sol',
    }
  }

  private formatJSON(content: string): string {
    try {
      return JSON.stringify(JSON.parse(content), null, 2)
    } catch (error) {
      return null
    }
  }
}
