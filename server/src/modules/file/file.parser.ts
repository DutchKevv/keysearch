import { App } from '../../app'

export interface IFileParseResult {
  public: string[]
  private: {
    value: string
    chain: 'eth' | 'sol'
  }[]
}

export class FileParser {
  static VERSION = 0.1

  constructor(public app: App) {}

  async parse(fileContent: string, fileExtension?: string): Promise<IFileParseResult> {
    const keys: IFileParseResult = { private: [], public: [] }

    // format json file to make sure every line is separate
    if (fileExtension === 'json') {
      fileContent = this.formatJSON(fileContent)
    }

    // split file into lines
    const lines = fileContent.split(/\r?\n|\r|\n/g)

    // loop over each line
    for (let i = 0, len = lines.length; i < len; i++) {
      const line = lines[i]

      const privateKey = this.parseLine(line)

      // find the word private
      if (privateKey) {
        keys.private.push(privateKey)
      }
    }

    // remove duplicates
    keys.private = Array.from(new Set(keys.private))

    return keys
  }

  private parseLine(line: string): { value: string; chain: 'eth' | 'sol' } {
    // TODO - more ways a key could be written
    const splitValue = line.split('=')[1] || line.split(':')[1]

    if (!splitValue) {
      return null
    }

    return this.extractKeyFromString(splitValue)
  }

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
      return content
    }
  }
}
