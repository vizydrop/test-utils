/* eslint-disable no-param-reassign */
const qs = require(`querystring`);
const _ = require(`lodash/fp`);
const {v4} = require(`uuid`);
const api = require(`../api-v1`);

class UserActions {
    constructor(agent, serverUrl) {
        this.agent = agent;
        this.serverUrl = serverUrl;
    }

    me() {
        const serverUrl = this.serverUrl;
        return () => api(this.agent, serverUrl).get(`user/me/`);
    }

    async getDefaultSpaceName() {
        const space = await this.getDefaultSpace();
        return space.name;
    }

    async getDefaultSpace() {
        const meResponse = await this.me()();
        return meResponse.body.spaces[0];
    }

    defaultLogin(token, companies) {
        return this.loginWithService({
            service: `fakeauth`,
            auth: `token`,
            token: token || v4(),
            companies,
        })();
    }

    reauth() {
        return this.agent
            .post(`${this.serverUrl}/api/v1/user/me/reauth`)
            .send()
            .then((res) => res.body);
    }

    mySpaces() {
        return this.agent
            .get(`${this.serverUrl}/api/v1/user/me/spaces`)
            .send()
            .then((res) => res.body);
    }

    loginWithService(config, store = {}) {
        const serverUrl = this.serverUrl;
        return () =>
            this.agent
                .post(
                    `${this.serverUrl}/api/v1/login/${config.service}/${config.auth}`,
                )
                .send(config)
                .then(() => api(this.agent, serverUrl).get(`user/me/`))
                .then((res) => {
                    Object.assign(store, res.body, {
                        space: res.body.spaces[0].path,
                        company: res.body.companies[0],
                    });
                    return store;
                });
    }

    loginWithServiceViaQsAndHeader(config, store = {}) {
        return () =>
            this.agent
                .get(
                    `${this.serverUrl}/api/v1/user/me?${qs.stringify(
                        _.omit(`token`, config),
                    )}`,
                )
                .set(`token`, config.token)
                .then((res) => {
                    store.space = res.body.spaces[0].path;
                    store.company = res.body.companies[0];
                    store.name = res.body.name;
                    store.email = res.body.email;
                    return store;
                });
    }

    logout() {
        return (done) => {
            this.agent
                .post(`${this.serverUrl}/logout/`)
                .endOK(done.bind(this, null));
        };
    }
}

module.exports = {
    UserActions,
};
