import WAValidator from "multicoin-address-validator";
import { App } from "../../app";

export abstract class Chain {

    abstract name: string

    constructor(public app: App) { }

    isValidPublicKey(address: string): boolean {
        return WAValidator.validate(address, this.name);
    }

    abstract isValidPrivateKey(key: string): boolean
    abstract getAddressFromPrivateKey(key: string): string
    abstract getTransactions(address: string): Promise<any[]>
    abstract getBalance(address: string): Promise<BigInt>
}