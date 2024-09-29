
window.App = {
    async loadWallets() {
        const wallets = await $.get('/api/wallets?sortBy=balanceETH&dir=ASC')
        const $tableWallets = $('#table-wallets tbody')

        wallets.forEach(wallet => {

            $tableWallets.append(`
                <tr>
                    <td>${wallet.id}</td>
                    <td>${wallet.chain}</td>
                    <td>${wallet.balanceSOL / 1e9}</td>
                    <td>${wallet.balanceETH / 1e18}</td>
                    <td>${wallet.balanceBNB / 1e18}</td>
                    <td>${wallet.lastTransaction}</td>
                    <td>${wallet.address}</td>
                    <td>${wallet.privateKey}</td>
                </tr>
            `)
        })
    }
}

window.App.loadWallets()
