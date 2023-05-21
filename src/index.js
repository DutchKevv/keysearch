const axios = require('axios')

const URLConfig = {
    headers: {
        Authorization: 'Bearer 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'
    }
};

(async () => {
    try {
        const URL = 'https://api.github.com/search/code?q=' + encodeURIComponent('METAMASK_KEY=0x');

        // Make a request for a user with a given ID
        const { data } = await axios.get(URL, URLConfig)

        console.log(data)
    } catch (error) {
        console.error(error?.reponse || error)
    }
})()