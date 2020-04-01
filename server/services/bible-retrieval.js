var axios = require('axios');

// ESV API
const BRUrl = 'https://api.esv.org/v3/passage/text/';
const header = {
    'Authorization': 'Token ' + '8eb188ee45d184cdcd17a8b09de3f0157c6e1546'
};

var BRService = {
    getPassage: async function (passage) {
        try {
            const returnedData = await axios.get(BRUrl, {
                headers: header,
                params: {
                    'q': passage,
                    'include-passage-references': false,
                    'include-footnotes': false
                }
            })
            return returnedData.data;
        } catch (err) {
            return next(err);
        }
    }
};

module.exports = BRService;