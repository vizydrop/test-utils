const api = require(`../api-v1`);

class InfoActions {
    constructor(agent, serverUrl) {
        this.agent = agent;
        this.serverUrl = serverUrl;
    }

    get(usecdn) {
        return api(this.agent, this.serverUrl)
            .get(usecdn == null ? `info` : `info?usecdn=${usecdn}`)
            .then((res) => res.body);
    }

    status() {
        return this.agent
            .get(`${this.serverUrl}/status/`)
            .then((res) => res.body);
    }
}

module.exports = {
    InfoActions,
};
