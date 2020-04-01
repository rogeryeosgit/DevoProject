var axios = require('axios');

// ESV API
const BRUrl = 'https://api.esv.org/v3/passage/html/';
const header = {
    'Authorization': 'Token ' + '8eb188ee45d184cdcd17a8b09de3f0157c6e1546'
};

var BRService = {
    getPassage: async function (passage) {
        try {
            const returnedData = await axios.get(BRUrl, {
                headers: header,
                params: {
                    'q': passage
                }
            })
            return returnedData.data.passages[0];
        } catch (err) {
            return next(err);
        }
    }
};

module.exports = BRService;