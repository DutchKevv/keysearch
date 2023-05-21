const axios = require('axios')

const URLConfig = {
    headers: {
        Authorization: 'Bearer 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'
    }
};

(async () => {
    try {
        const URL = 'https://api.github.com/search/code?q=' + encodeURIComponent('METAMASK_PRIVATE_KEY');

        // Make a request for a user with a given ID
        const { data } = await axios.get(URL, URLConfig)
        const items = data.items

        for (let i = 0, len = items.length; i < len; i++) {
            const item = items[i]
            const file = await getFileFromGitUrl(item.git_url)
        }
        console.log(data)
    } catch (error) {
        console.error(error?.reponse || error)
    }
})()

async function getFileFromGitUrl(gitUrl) {
    try {
        const { data } = await axios.get(gitUrl)

        if (data) {
            let buff = new Buffer(data.content, 'base64');
            let text = buff.toString('ascii');
            console.log(text)
            return text
        }
    } catch (error) {
        console.error(error)
    }
}