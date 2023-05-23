import privateKeyToPublicKey from 'ethereum-private-key-to-public-key';
import publicKeyToAddress from 'ethereum-public-key-to-address';

export function getPublicKeyFromPrivateKey(privateKey: string) {
    try {
        const publicKey = privateKeyToPublicKey(privateKey)
        return publicKey
    } catch (error) {
        return null
    }
}

export function getAddressFromPublicKey(publicKey: string) {
    const address = publicKeyToAddress(publicKey)
    return address
}

export function getAddressFromPrivateKey(privateKey: string) {
    const publicKey = getPublicKeyFromPrivateKey(privateKey)
    const address = publicKeyToAddress(publicKey)
    return address
}