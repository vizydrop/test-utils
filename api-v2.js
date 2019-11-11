const {Api} = require(`./base-api`);

class ApiV2 extends Api {
    // eslint-disable-next-line no-underscore-dangle
    _url(args) {
        return `${this.serverUrl}/api/v2/${args.join(`/`)}`;
    }
}

module.exports = (agent, serverUrl) => new ApiV2(agent, serverUrl);
