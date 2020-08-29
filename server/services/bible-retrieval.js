var axios = require('axios');
var log4js = require('log4js');

// ESV API
const BRUrl = 'https://api.esv.org/v3/passage/text/';
const header = {
    'Authorization': 'Token ' + process.env.ESVAPI_KEY
};

var BRService = {
    getPassage: async function (passage) {
        var logger = log4js.getLogger();
        try {
            const returnedData = await axios.get(BRUrl, {
                headers: header,
                params: {
                    'q': passage,
                    'include-passage-references': false,
                    'include-footnotes': false,
                    'include-headings': false,
                }
            })
            return returnedData.data;
        } catch (err) {
            logger.error("BRService Error : " + err);
            throw(err);
        }
    }
};

module.exports = BRService;