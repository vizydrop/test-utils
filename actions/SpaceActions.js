const api = require(`../api-v1`);
const apiV2 = require(`../api-v2`);

class SpaceActions {
    constructor(agent, serverUrl) {
        this.agent = agent;
        this.serverUrl = serverUrl;
    }

    autoCreateAccounts(space) {
        return this.agent
            .post(
                `${this.serverUrl}/api/v1/spaces/${space}/accounts/auto-create`,
            )
            .send()
            .then((res) => res.body);
    }

    addAccount(space, appId) {
        return this.agent
            .post(
                `${this.serverUrl}/api/v1/spaces/${space}/apps/${appId}/connect`,
            )
            .send({auth: `none`})
            .then((res) => res.body);
    }

    addApp(space, url) {
        return this.agent
            .post(`${this.serverUrl}/api/v1/spaces/${space}/apps`)
            .send({url})
            .then((res) => res.body);
    }

    getApps(space, host) {
        return this.agent
            .get(`${this.serverUrl}/api/v1/spaces/${space}/apps?host=${host}`)
            .then((res) => res.body);
    }

    getSpace(space) {
        return this.agent
            .get(`${this.serverUrl}/api/v1/spaces/${space}`)
            .send()
            .then((res) => res.body);
    }

    getDashboards(space) {
        return (done) => {
            api(this.agent, this.serverUrl)
                .get(`spaces`, space, `dashboards`)
                .endOK(done.bind(this, null));
        };
    }

    changeDashboardsOrder(space, id, to) {
        return (done) => {
            api(this.agent, this.serverUrl)
                .post(`spaces`, space, `dashboards/order`)
                .send({id, to})
                .endOK(done.bind(this, null));
        };
    }

    getDrops(space) {
        return (done) => {
            api(this.agent, this.serverUrl)
                .get(`spaces`, space, `drops`)
                .endOK(done.bind(this, null));
        };
    }

    changeDropsOrder(space, id, to) {
        return (done) => {
            api(this.agent, this.serverUrl)
                .post(`spaces`, space, `drops/order`)
                .send({id, to})
                .endOK(done.bind(this, null));
        };
    }

    importDropWithNotify(space, body) {
        return apiV2(this.agent, this.serverUrl)
            .post(`drops`)
            .send({containerKey: space, container: `space`, ...body});
    }

    moveDrop(space, from, to, dropId) {
        return api(this.agent, this.serverUrl)
            .post(`spaces`, space, `move-drop/`)
            .send({
                from,
                to,
                dropId,
            });
    }
}

module.exports = {
    SpaceActions,
};
