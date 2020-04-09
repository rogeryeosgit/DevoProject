var axios = require('axios');
var log4js = require('log4js');

// ESV API
const BRUrl = 'https://api.esv.org/v3/passage/text/';
const header = {
    'Authorization': 'Token ' + '8eb188ee45d184cdcd17a8b09de3f0157c6e1546' /* TODO: To be removed on deploy */
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
                    'include-footnotes': false
                }
            })
            return returnedData.data;
        } catch (err) {
            logger.error("BRService Error : " + err);
        }
    }
};

module.exports = BRService;