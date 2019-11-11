const _ = require(`lodash/fp`);
const api = require(`../api-v1`);

const isNotifiableResponse = (res) => res.body.result && res.body.notifications;
const extractId = (obj) => (_.isObject(obj) ? obj.id : obj);
const save = (store = {}, done, keys = [`id`, `_id`]) => (res) => {
    const body = isNotifiableResponse(res) ? res.body.result : res.body;
    Object.assign(store, _.pick(keys, body));
    done();
};

class DashboardActions {
    constructor(agent, serverUrl) {
        this.agent = agent;
        this.serverUrl = serverUrl;
    }

    create(store, space, name, permissionGroups) {
        // TODO: make store optional
        const agent = this.agent;

        return (done) => {
            api(agent, this.serverUrl)
                .post(`spaces`, space.space || space, `dashboards`)
                .send({name, permissionGroups})
                .endOK(save(store, done));
        };
    }

    delete(dashboard) {
        return (done) => {
            api(this.agent, this.serverUrl)
                .del(`dashboards`, dashboard.id)
                .endOK(done.bind(this, null));
        };
    }

    changeDropsOrder(dashboard, id, to) {
        return (done) => {
            api(this.agent, this.serverUrl)
                .post(`dashboards`, extractId(dashboard), `drops/order/`)
                .send({id, to})
                .endOK(done.bind(this, null));
        };
    }

    share(dashboard) {
        return api(this.agent, this.serverUrl)
            .post(`dashboards/${dashboard.id}/sharing/`)
            .then((res) => {
                save(dashboard, () => {}, [`id`, `sharingKey`])(res);
                return res.body;
            });
    }

    setGroups(dashboard, groups) {
        return api(this.agent, this.serverUrl)
            .post(`dashboards/${dashboard.id}/groups/`)
            .send({groups});
    }
}

module.exports = {
    DashboardActions,
};
