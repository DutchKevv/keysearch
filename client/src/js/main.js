window.App = {
    async loadWallets() {
        const wallets = await $.get('/api/wallets?sortBy=balanceETH&dir=ASC')
        const $tableWallets = $('#table-wallets tbody')

        wallets.forEach(wallet => {
            
            wallet.balanceETH = ethers.formatEther(wallet.balanceETH)
            wallet.balanceBNB = ethers.formatEther(wallet.balanceBNB)
            wallet.balanceAVAX = ethers.formatEther(wallet.balanceAVAX)
            // wallet.balanceSOL = ethers.formatEther(wallet.balanceSOL)

            if (wallet.lastTransaction) {
                wallet.lastTransaction = this.formatDateTime(new Date(wallet.lastTransaction))
            } else {
                wallet.lastTransaction = ''
            }

            if (wallet.lastCheck) {
                wallet.lastCheck = this.formatDateTime(new Date(wallet.lastCheck))
            } else {
                wallet.lastCheck = ''
            }

            $tableWallets.append(`
                <tr>
                    <td>${wallet.id}</td>
                    <td>${wallet.chain}</td>
                    <td>${wallet.balanceSOL / 1e9}</td>
                    <td>${wallet.balanceETH}</td>
                    <td>${wallet.balanceBNB}</td>
                    <td>${wallet.balanceAVAX}</td>
                    <td>${wallet.lastTransaction}</td>
                    <td>${wallet.address}</td>
                    <td>${wallet.privateKey}</td>
                    <td>${wallet.lastCheck}</td>
                </tr>
            `)
        })
    },

    formatDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
      
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
}

window.App.loadWallets()
