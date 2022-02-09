const mongoose = require('mongoose');
const log4js = require('log4js');
const logger = log4js.getLogger();

var db = {
  init() {
    // connect to MongoDB
    mongoose.connect(process.env.MONGODB_ACCESS, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    //handle mongo error
    mongoose.connection.on('error', function () {
      logger.error("DB Connector: Connection Error");
    });
    mongoose.connection.once('open', function () {
      logger.info("DB Connector: *--- Connected to Data Store ---* ");
    });

    process.on('SIGINT', function () {
      mongoose.connection.close(function () {
        logger.info("DB Connector: Mongoose default connection is disconnected due to node termination");
        process.exit(0)
      });
    });
  }
}

module.exports = db;