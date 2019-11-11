const superagent = require(`superagent`);
const log = require(`./logger`);

const throwLocal = function(localErr, message) {
    // eslint-disable-next-line no-param-reassign
    localErr.message = message;
    throw localErr;
};

superagent.Request.prototype.endOK = function endOK(callback) {
    const localErr = new Error();

    return this.end((err, res) => {
        if (!res) {
            log.error(err);
            throwLocal(localErr, err.message);
        }

        if (err) {
            log.error(`%s %s`, res.request.url, res.text);
            throwLocal(localErr, res.text);
        }

        if (!res.ok) {
            throwLocal(localErr, new Error(`[${res.status}] ${res.text}`));
        }

        callback(res);
    });
};

module.exports = {
    superagent,
};
