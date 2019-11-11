/* eslint-disable no-underscore-dangle */
const debug = require(`debug`)(`vizydrop:test:api`);

function checkServerUrl() {
    throw new Error(`Please specify server url`);
}

class Api {
    constructor(agent, serverUrl = checkServerUrl()) {
        this.agent = agent;
        this.serverUrl = serverUrl;
    }

    _url(args) {
        return `${this.serverUrl}/api/v1/${args.join(`/`)}`;
    }

    _call(method, url) {
        debug(`${method.toUpperCase()} ${url}`);
        return this.agent[method](url);
    }

    get(...args) {
        return this._call(`get`, this._url(args));
    }

    post(...args) {
        return this._call(`post`, this._url(args));
    }

    put(...args) {
        return this._call(`put`, this._url(args));
    }

    del(...args) {
        return this._call(`del`, this._url(args));
    }
}

module.exports = {Api};
