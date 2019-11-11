const logger = require(`@vizydrop/logger`);

module.exports = logger.createLogger({
    correlationId: {
        enabled: false,
        getCorrelationId() {},
        emptyValue: `nocorrelation`,
    },
    mode: process.env.NODE_ENV,
    level: process.env.LOG_LEVEL,
});
