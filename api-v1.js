const {Api} = require(`./base-api`);

class ApiV1 extends Api {
    // eslint-disable-next-line no-underscore-dangle
    _url(args) {
        return `${this.serverUrl}/api/v1/${args.join(`/`)}`;
    }
}

module.exports = (agent, serverUrl) => new ApiV1(agent, serverUrl);
