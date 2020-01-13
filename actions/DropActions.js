const _ = require(`lodash/fp`);
const path = require(`path`);
const apiV2 = require(`../api-v2`);
const api = require(`../api-v1`);

// eslint-disable-next-line no-undef
const getFilePath = (fileName) => path.resolve(__dirname, `../data`, fileName);
const isNotifiableResponse = (res) => res.body.result && res.body.notifications;
const save = (store = {}, done, keys = [`id`, `_id`]) => (res) => {
    const body = isNotifiableResponse(res) ? res.body.result : res.body;
    Object.assign(store, _.pick(keys, body));
    done();
};

class DropActions {
    constructor(agent, serverUrl) {
        this.agent = agent;
        this.serverUrl = serverUrl;
    }

    createTableFromFile(store, tableConfig, fileName, space) {
        return (done) => {
            api(this.agent, this.serverUrl)
                .post(`spaces/${space}/sources/files/upload`)
                .attach(`file`, getFilePath(fileName))
                .endOK((uploadResponse) => {
                    const fileInfo = uploadResponse.body;
                    apiV2(this.agent, this.serverUrl)
                        .post(`drops`)
                        .send({
                            __type: `TableDrop`,
                            accessLevel: null,
                            container: `space`,
                            containerKey: space,
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
                            ...tableConfig,
                        })
                        .endOK((response) => {
                            const result = response.body.result;
                            Object.assign(store, {
                                drop: result,
                                source: result.source,
                            });

                            done();
                        });
                });
        };
    }

    addGroups(dropId, params) {
        return () =>
            apiV2(this.agent, this.serverUrl)
                .post(`drops`, dropId, `groups/`)
                .send(params);
    }

    deleteGroups(dropId, params) {
        return () =>
            apiV2(this.agent, this.serverUrl)
                .del(`drops`, dropId, `groups/`)
                .send(params);
    }

    resolve(dropId, params, authQuery) {
        return () =>
            api(this.agent, this.serverUrl)
                .post(`drops`, dropId, `resolve`)
                .query(authQuery)
                .send(params || {});
    }

    update(dropId, params) {
        return () =>
            apiV2(this.agent, this.serverUrl)
                .put(`drops`, dropId)
                .send(params || {});
    }

    linkWithExternalService(dropId, params) {
        return () =>
            apiV2(this.agent, this.serverUrl)
                .post(`drops`, dropId, `linkWithExternalService/`)
                .send(params);
    }

    getDrop(dropId) {
        return () => apiV2(this.agent, this.serverUrl).get(`drops`, dropId, ``);
    }

    getDropByLink({spacePath, dropPath}, params = {}) {
        return api(this.agent, this.serverUrl)
            .post(`spaces`, spacePath, `entity`, dropPath)
            .send(params);
    }

    getSourceFilterByDropLink({spacePath, dropPath}) {
        return api(this.agent, this.serverUrl).get(
            `spaces`,
            spacePath,
            `entity`,
            dropPath,
            `source-filter`,
        );
    }

    getAccessByDropLink({spacePath, dropPath}) {
        return api(this.agent, this.serverUrl).get(
            `spaces`,
            spacePath,
            `entity`,
            dropPath,
            `access`,
        );
    }

    getTemplate(dropId) {
        return () =>
            apiV2(this.agent, this.serverUrl).get(`drops`, dropId, `template`);
    }

    getDropData(dropId) {
        return () =>
            apiV2(this.agent, this.serverUrl).get(
                `drops`,
                dropId,
                `sourceData`,
            );
    }

    version(dropId) {
        return () =>
            apiV2(this.agent, this.serverUrl).get(
                `drops`,
                dropId,
                `compiled`,
                `version`,
            );
    }

    getSharedDrop({id: dropId, sharingKey}) {
        if (!sharingKey) {
            throw new Error(`Please provide sharingKey`);
        }
        return apiV2(this.agent, this.serverUrl).get(
            `drops`,
            dropId,
            `?authkey=${sharingKey}`,
        );
    }

    deleteDrop(dropId) {
        return () => apiV2(this.agent, this.serverUrl).del(`drops`, dropId, ``);
    }

    async createReportFromFile(
        {space, fileName = `vizydrop.csv`},
        dropConfig,
        queryParams,
    ) {
        const uploadResponse = await api(this.agent, this.serverUrl)
            .post(`spaces/${space.space || space}/sources/files/upload`)
            .attach(`file`, getFilePath(fileName));
        return this.createReport(
            {
                ...dropConfig,
                data: {
                    app: `fileapp`,
                    source: `file`,
                    filters: {file: uploadResponse.body},
                },
            },
            queryParams,
        );
    }

    createReport(dropConfig, queryParams) {
        return apiV2(this.agent, this.serverUrl)
            .post(`drops`)
            .query(queryParams)
            .send({
                ...dropConfig,
                schema: dropConfig.schema || {},
                spec: dropConfig.spec || {},
                title: dropConfig.title || ``,
                permissionGroups: dropConfig.permissionGroups || [],
                __type: dropConfig.__type || `ChartDrop`,
            })
            .then((res) => res.body.result);
    }

    createV2(config) {
        return apiV2(this.agent, this.serverUrl)
            .post(`drops`)
            .send({
                schema: {},
                spec: {},
                title: `title`,
                ...config,
            })
            .then((response) => response.body.result);
    }

    share(drop) {
        return apiV2(this.agent, this.serverUrl)
            .post(`drops/${drop.id}/sharing/`)
            .then((res) => {
                save(drop, () => {}, [`id`, `sharingKey`])(res);
                return res.body;
            });
    }

    stopShare(drop) {
        return apiV2(this.agent, this.serverUrl).del(
            `drops/${drop.id}/sharing/`,
        );
    }

    getDropUserFilters(dropId) {
        return api(this.agent, this.serverUrl).get(`dropUserFilter/${dropId}`);
    }

    setDropUserFilter(dropId, content) {
        return api(this.agent, this.serverUrl)
            .put(`dropUserFilter/${dropId}`)
            .send(content);
    }

    get(dropId) {
        return this.getDrop(dropId);
    }
}

module.exports = {
    DropActions,
};
