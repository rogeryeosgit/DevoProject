var axios = require('axios');
var log4js = require('log4js');

// Node-Cache Stuff
const NodeCache = require("node-cache");
const ESVCache = new NodeCache();

// ESV API
const BRUrl = 'https://api.esv.org/v3/passage/text/';
const header = {
    'Authorization': 'Token ' + process.env.ESVAPI_KEY
};

// Test counter
var counter = 0;

var BRService = {
    getPassage: async function (passage) {

        var logger = log4js.getLogger();

        // Check local cache first
        var cacheData = ESVCache.get(passage);
        if (cacheData != undefined) {
            logger.info(passage + " found in cache");
            return cacheData;
        }

        try {
            logger.info("BRService : ESVAPI Access Count : " + counter++);
            const returnedData = await axios.get(BRUrl, {
                headers: header,
                params: {
                    'q': passage,
                    'include-passage-references': false,
                    'include-footnotes': false,
                    'include-headings': false,
                }
            });

            ESVCache.set(passage, returnedData.data, parseInt(process.env.CACHE_TTL));
            return returnedData.data;
        } catch (err) {
            logger.error("BRService Error : " + err);
            throw (err);
        }
    }
};

module.exports = BRService;