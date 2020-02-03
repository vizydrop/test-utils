const _ = require(`lodash/fp`);
const path = require(`path`);
const api = require(`../api-v1`);
const apiV2 = require(`../api-v2`);

const getFilePath = (fileName) => path.resolve(__dirname, `../data`, fileName);
const isNotifiableResponse = (res) => res.body.result && res.body.notifications;
const save = (store = {}, done, keys = [`id`, `_id`]) => (res) => {
    const body = isNotifiableResponse(res) ? res.body.result : res.body;
    Object.assign(store, _.pick(keys, body));
    done();
};

class SourceActions {
    constructor(agent, serverUrl) {
        this.agent = agent;
        this.serverUrl = serverUrl;
    }

    create(store, space) {
        return this.createFromFile(store, `vizydrop.csv`, space.space || space);
    }

    createFromFile(store, fileName, space) {
        return (done) => {
            api(this.agent, this.serverUrl)
                .post(`spaces/${space.space || space}/sources/files/upload`)
                .attach(`file`, getFilePath(fileName))
                .endOK((uploadResponse) => {
                    const fileInfo = uploadResponse.body;
                    apiV2(this.agent, this.serverUrl)
                        .post(`drops`)
                        .send({
                            container: `space`,
                            containerKey: space.space || space,
                            accessLevel: null,
                            data: {
                                filters: {
                                    file: fileInfo,
                                },
                                source: `file`,
                                app: `fileapp`,
                            },
                            description: ``,
                            isEmpty: true,
                            schema: {},
                            title: `New Drop`,
                            spec: {
                                type: `scatterplot`,
                            },
                        })
                        .endOK((response) => {
                            const error = response.body.error;
                            if (error) {
                                return done(error);
                            }
                            Object.assign(store, response.body.result.source);
                            return done();
                        });
                });
        };
    }

    createForApp(appSource, store, space) {
        const {app, account, source, filters} = appSource;
        return (done) => {
            api(this.agent, this.serverUrl)
                .post(
                    `spaces/${space || store.space}/sources/apps/${app}/${
                        account.id
                    }/${source}/notify`,
                )
                .send({
                    values: filters,
                })
                .endOK(save(store, done, [`id`, `_id`, `original`]));
        };
    }

    updateFilter(sourceId, filter) {
        return () =>
            api(this.agent, this.serverUrl)
                .put(`sources`, sourceId, `filter`)
                .send(filter || {});
    }

    addFormula(sourceId, formula) {
        return () =>
            api(this.agent, this.serverUrl)
                .put(`sources`, sourceId, `formula`)
                .send(formula || {});
    }

    deleteField(sourceId, field) {
        return () =>
            api(this.agent, this.serverUrl).del(
                `sources`,
                sourceId,
                `field`,
                field,
            );
    }

    updateSchema(sourceId, schema) {
        return () =>
            api(this.agent, this.serverUrl)
                .put(`sources`, sourceId, `schema`)
                .send(schema || {});
    }

    updateWithNotify(sourceId) {
        return () =>
            api(this.agent, this.serverUrl).get(
                `sources`,
                sourceId,
                `update/notify`,
            );
    }

    getSchema(sourceId) {
        return () =>
            api(this.agent, this.serverUrl).get(`sources`, sourceId, `schema`);
    }

    getSchemaDirty(sourceId) {
        return () =>
            api(this.agent, this.serverUrl).get(
                `sources`,
                sourceId,
                `schema/dirty`,
            );
    }

    getAppFilter(sourceId) {
        return () =>
            api(this.agent, this.serverUrl).get(`sources`, sourceId, `filter`);
    }

    getSourceData(sourceId) {
        return () => api(this.agent, this.serverUrl).get(`sources/${sourceId}`);
    }

    getSuggestedDrops(sourceId) {
        return (done) => {
            api(this.agent, this.serverUrl)
                .get(`sources`, sourceId, `auto/`)
                .end((err, res) => {
                    if (res && res.ok) {
                        return done(null, res);
                    }
                    return done(
                        err ||
                            new Error(
                                `Troubles with suggestions loading:${res.text}`,
                            ),
                    );
                });
        };
    }

    addDropView(sourceId, dropViewConfig, queryParams) {
        return () =>
            api(this.agent, this.serverUrl)
                .post(`sources/${sourceId}/drops`)
                .query(queryParams)
                .send(dropViewConfig);
    }

    getDrops(sourceId) {
        return () =>
            api(this.agent, this.serverUrl).get(`sources/${sourceId}/drops`);
    }

    changeTitle(sourceId, title) {
        return () =>
            api(this.agent, this.serverUrl)
                .put(`sources/${sourceId}/title`)
                .send({title});
    }

    changeViewOrder(sourceId, dropId, to) {
        return () =>
            api(this.agent, this.serverUrl)
                .post(`sources/${sourceId}/drops/${dropId}/order`)
                .send({to});
    }

    changeUpdateInterval(sourceId, updateInterval, query) {
        return api(this.agent, this.serverUrl)
            .put(`sources/${sourceId}/updateInterval`)
            .send({updateInterval})
            .query(query);
    }
}

module.exports = {
    SourceActions,
};
