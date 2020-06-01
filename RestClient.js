const {Agent} = require(`http`);
const querystring = require(`querystring`);
const {v4} = require(`uuid`);
const superagent = require(`superagent`);

function createQueryString(query = {}) {
    return Object.keys(query).length ? `?${querystring.stringify(query)}` : ``;
}

const defaultLoginUrl = `api/v1/login/fakeauth/token`;

const publicPermissionGroups = {
    view: [``],
    edit: [`collaborator`],
};

const replaceAccessLevel = (data) => {
    const {accessLevel, ...rest} = data;

    if (!accessLevel) {
        return data;
    }

    return {
        ...rest,
        permissionGroups:
            accessLevel === `public` ? publicPermissionGroups : null,
    };
};

class RestClient {
    constructor({host, credential, loginUrl}) {
        this.credential = credential;
        this.loginUrl = loginUrl;

        this.host = host;
        this.apiUrl = `${this.host}/api/v1/`;
        this.apiV2Url = `${this.host}/api/v2/`;
        this.agent = superagent.agent(new Agent({maxSockets: Infinity}));
        this.user = null;

        this.integrationSolutions = {
            getList: () => this.get(() => `integration-solutions/`),
            getById: (id) => this.get(() => `integration-solutions/${id}`),
            register: ({url, host: integrationsHost}) =>
                this.post(() => `integration-solutions/`, {
                    url,
                    host: integrationsHost,
                }),
            addCustomApp: ({url, integrationSolutionId}) =>
                this.post(
                    () =>
                        `integration-solutions/${integrationSolutionId}/customApps`,
                    {url},
                ),
            updateCustomApp: ({url, integrationSolutionId, customAppId}) =>
                this.put(
                    () =>
                        `integration-solutions/${integrationSolutionId}/customApps/${customAppId}`,
                    {url},
                ),
            deleteCustomApp: ({customAppId, integrationSolutionId}) =>
                this.delete(
                    () =>
                        `integration-solutions/${integrationSolutionId}/customApps/${customAppId}`,
                ),
            getDataAppLogo: ({integrationSolutionId, dataAppId}) =>
                this.login().then(() =>
                    this.agent.get(
                        `${this.apiUrl}integration-solutions/${integrationSolutionId}/dataApps/${dataAppId}/logo`,
                    ),
                ),
            getDataApps: ({integrationSolutionId}) =>
                this.get(
                    () =>
                        `integration-solutions/${integrationSolutionId}/dataApps`,
                ),
            enableDataApp: ({integrationSolutionId, dataAppId}) =>
                this.put(
                    () =>
                        `integration-solutions/${integrationSolutionId}/dataApps/${dataAppId}`,
                ),
            disableDataApp: ({integrationSolutionId, dataAppId}) =>
                this.delete(
                    () =>
                        `integration-solutions/${integrationSolutionId}/dataApps/${dataAppId}`,
                ),
            allowAddCustomApps: ({integrationSolutionId}) =>
                this.put(
                    () =>
                        `integration-solutions/${integrationSolutionId}/usersApps`,
                ),
            disallowAddCustomApps: ({integrationSolutionId}) =>
                this.delete(
                    () =>
                        `integration-solutions/${integrationSolutionId}/usersApps`,
                ),
        };
    }

    login() {
        if (this.user) {
            return Promise.resolve(this.user);
        }
        return this.agent
            .post(`${this.host}/${this.loginUrl}`)
            .redirects(0)
            .ok((res) => res.status < 400)
            .send(this.credential)
            .then(() => this.agent.get(`${this.apiUrl}user/me`))
            .then(({body}) => body)
            .then((user) => {
                this.user = user;
                this.spacePath = user.spaces[0].name;
                return user;
            });
    }

    getCurrentSpace() {
        return this.get(() => `spaces/${this.spacePath}`);
    }

    getApps() {
        return this.get(() => `spaces/${this.spacePath}/apps/`);
    }

    getApp(appId) {
        return this.get(() => `spaces/${this.spacePath}/apps/${appId}`);
    }

    addApp(url) {
        return this.post(() => `spaces/${this.spacePath}/apps/`, {url});
    }

    removeApp(appId) {
        return this.delete(() => `spaces/${this.spacePath}/apps/${appId}`);
    }

    updateApp({appId, url}) {
        return this.put(() => `spaces/${this.spacePath}/apps/${appId}`, {url});
    }

    createAccount(appId, auth = {auth: `none`}) {
        return this.post(
            () => `spaces/${this.spacePath}/apps/${appId}/connect/`,
            auth,
        );
    }

    createSource({app, id}, appSourceType, filter) {
        return this.post(
            () =>
                `spaces/${this.spacePath}/sources/apps/${app}/${id}/${appSourceType}/notify`,
            filter,
        ).then((response) => {
            if (response.error) {
                const error = new Error();
                error.response = {
                    status: response.error.status,
                    body: response.error,
                };
                throw error;
            } else {
                return response.result;
            }
        });
    }

    autoCreateAccounts() {
        return this.post(() => `spaces/${this.spacePath}/accounts/auto-create`);
    }

    getSourceFieldData(sourceId, fieldName) {
        return this.get(() => `sources/${sourceId}/fields/${fieldName}/data`);
    }

    getSourceCloneTemplate(sourceId, queryParams) {
        return this.get(
            () =>
                `sources/${sourceId}/clone/template${createQueryString(
                    queryParams,
                )}`,
        );
    }

    getDropTemplate(dropId) {
        return this.getV2(() => `drops/${dropId}/template`);
    }

    getDropCloneTemplate(dropId) {
        return this.getV2(() => `drops/${dropId}/clone/template`);
    }

    updateSource(id) {
        return this.get(() => `sources/${id}/update`);
    }

    updateSourceOwner(sourceId, appAccountId) {
        return this.put(() => `sources/${sourceId}/owner`, {appAccountId});
    }

    updateSourceWithNotify(id, {dropId} = {}) {
        return this.post(
            () => `sources/${id}/update/notify`,
            dropId ? {dropId} : {},
        );
    }

    getSource(id) {
        return this.get(() => `sources/${id}`);
    }

    getSourceFilter(id) {
        return this.get(() => `sources/${id}/filter`);
    }

    updateFilter(id, newFilter) {
        return this.put(() => `sources/${id}/filter`, newFilter);
    }

    sourceAccessFails() {
        return this.get(() => `spaces/${this.spacePath}/sourceAccessFails`);
    }

    sourceAccessFailsFixes(fixes) {
        return this.post(
            () => `spaces/${this.spacePath}/sourceAccessFails/fixes`,
            fixes,
        );
    }

    createSourceWithNotification({app, id}, appSourceType, filter) {
        return this.post(
            () =>
                `spaces/${this.spacePath}/sources/apps/${app}/${id}/${appSourceType}/notify`,
            filter,
        );
    }

    createDropWithNotification(body) {
        return this.postV2(() => `drops`, {
            container: `space`,
            containerKey: this.spacePath,
            ...replaceAccessLevel(body),
        });
    }

    createDropTableNotification(body) {
        return this.postV2(() => `drops`, {
            container: `space`,
            containerKey: this.spacePath,
            ...replaceAccessLevel(body),
        });
    }

    deleteDrop(dropId) {
        return this.delete(() => `drops/${dropId}`);
    }

    uploadFile(filepath) {
        return this.postWithFile(
            () => `spaces/${this.spacePath}/sources/files/upload`,
            filepath,
        );
    }

    getAccounts() {
        return this.get(() => `spaces/${this.spacePath}/accounts`);
    }

    createDropFromFile({fileInfo, accessLevel}) {
        return this.createDropWithNotification({
            accessLevel,
            data: {
                filters: {file: fileInfo},
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
        });
    }

    clearSource(id) {
        return this.post(() => `sources/${id}/clear`, {});
    }

    getSchema(id) {
        return this.get(() => `sources/${id}/schema`);
    }

    createDropToSpaceV2(config, queryParams) {
        return this.postV2(() => `drops/${createQueryString(queryParams)}`, {
            container: `space`,
            containerKey: this.spacePath,
            schema: {},
            spec: {},
            title: `New Drop`,
            ...config,
        });
    }

    updateDrop(dropId, config, queryParams) {
        return this.putV2(
            () => `drops/${dropId}/${createQueryString(queryParams)}`,
            config,
        );
    }

    createMultiViewsSource(config, queryParams) {
        return this.post(() => `sources/${createQueryString(queryParams)}`, {
            container: `space`,
            containerKey: this.spacePath,
            ...config,
        });
    }

    moveDropView(sourceId, dropId, to) {
        return this.post(() => `sources/${sourceId}/drops/${dropId}/order`, {
            to,
        });
    }

    addDropToSource(sourceId, config) {
        return this.post(() => `sources/${sourceId}/drops`, config);
    }

    getSourceDrops(sourceId) {
        return this.get(() => `sources/${sourceId}/drops`);
    }

    ignoreSchemaField(sourceId, fieldId) {
        return this.delete(() => `sources/${sourceId}/field/${fieldId}`);
    }

    addSchemaField(sourceId, fieldId) {
        return this.put(() => `sources/${sourceId}/formula`, {id: fieldId});
    }

    getSpaceDrops(query) {
        return this.get(() => `spaces/${this.spacePath}/drops`, query);
    }

    getDashboardDrops(dashboardId) {
        return this.get(() => `dashboards/${dashboardId}/drops`);
    }

    createDashboard(body) {
        return this.post(
            () => `spaces/${this.spacePath}/dashboards/`,
            replaceAccessLevel(body),
        );
    }

    getDrop(id) {
        return this.getV2(() => `drops/${id}`);
    }

    getCompiledDrop(id, queryParams) {
        return this.get(() => `drops/${id}/compiled`, queryParams);
    }

    getCompiledDropV2(dropId, queryParams) {
        return this.getV2(() => `drops/${dropId}/compiled`, queryParams);
    }

    getTableTotal(dropId, queryParams) {
        return this.getV2(() => `drops/table/${dropId}/total`, queryParams);
    }

    getTableCount(dropId, queryParams) {
        return this.getV2(() => `drops/table/${dropId}/count`, queryParams);
    }

    createDropUserFilter(dropId, body) {
        return this.put(() => `dropUserFilter/${dropId}`, body);
    }

    applyDropUserFilter(dropId) {
        return this.post(() => `dropUserFilter/${dropId}/apply`);
    }

    getDropUserFilter(dropId) {
        return this.get(() => `dropUserFilter/${dropId}`);
    }

    getAllDropUserFilters() {
        return this.get(() => `dropUserFilter`);
    }

    getDropPage(id) {
        return this.agent
            .get(`${this.host}/drop/${id}/page`)
            .send(this.credential);
    }

    removeDropGroups({id, groups, service}) {
        return this.delete(() => `drops/${id}/groups/?service=${service}`, {
            groups,
        });
    }

    setDropGroups({id, groups, service}) {
        return this.post(() => `drops/${id}/groups/?service=${service}`, {
            groups,
        });
    }

    removeDashboardGroups({id, groups, service}) {
        return this.delete(
            () => `dashboards/${id}/groups/?service=${service}`,
            {groups},
        );
    }

    setDashboardGroups({id, groups, service}) {
        return this.post(() => `dashboards/${id}/groups/?service=${service}`, {
            groups,
        });
    }

    getAccountTemplates(id, appSourceTypes, templatesSource) {
        return this.get(
            () =>
                `spaces/${this.spacePath}/apps/account/${id}/templates/${templatesSource}`,
            {appSourceTypes},
        );
    }

    getPlansAvailableForSpace(space) {
        return this.get(() => `spaces/${space}/license-info/plans`);
    }

    getSpacePlan(space) {
        return this.get(() => `spaces/${space}/license-info/plan`);
    }

    getTemplatePreview(previewUri) {
        return this.login().then(() =>
            this.agent
                .get(`${this.host}${previewUri}`)
                .responseType(`blob`)
                .then((res) => res),
        );
    }

    deleteUserData(payload) {
        return this.post(() => `user/me/delete`, payload);
    }

    getUserSpaces() {
        return this.get(() => `user/me/spaces`);
    }

    getDashboardById(dashboardId) {
        return this.get(() => `dashboards/${dashboardId}`);
    }

    post(relativeUrl, body) {
        return this.login().then(() =>
            this.agent
                .post(`${this.apiUrl}${relativeUrl()}`)
                .send(body)
                .then(({body: responseBody}) => responseBody),
        );
    }

    postV2(relativeUrl, body) {
        return this.login().then(() =>
            this.agent
                .post(`${this.apiV2Url}${relativeUrl()}`)
                .send(body)
                .then(({body: responseBody}) => responseBody),
        );
    }

    putV2(relativeUrl, body) {
        return this.login().then(() =>
            this.agent
                .put(`${this.apiV2Url}${relativeUrl()}`)
                .send(body)
                .then(({body: responseBody}) => responseBody),
        );
    }

    postWithFile(relativeUrl, filepath) {
        return this.login().then(() =>
            this.agent
                .post(`${this.apiUrl}${relativeUrl()}`)
                .attach(`file`, filepath)
                .then(({body}) => body),
        );
    }

    getAccountById(accountId) {
        return this.get(() => `accounts/${accountId}`);
    }

    removeAccountById(accountId) {
        return this.delete(() => `accounts/${accountId}`);
    }

    countDrops() {
        return this.get(() => `spaces/${this.spacePath}/drops/count`);
    }

    countSourceDrops(sourceId) {
        return this.get(() => `sources/${sourceId}/drops/count`);
    }

    moveDrop({dropId, from, to}) {
        return this.post(() => `spaces/${this.spacePath}/move-drop`, {
            from,
            to,
            dropId,
        });
    }

    setDropAccessLevel(dropId, accessLevel) {
        if (accessLevel === `private`) {
            return this.removeDropGroups({
                id: dropId,
                groups: publicPermissionGroups,
            });
        }

        return this.setDropGroups({id: dropId, groups: publicPermissionGroups});
    }

    setDashboardAccessLevel(dashboardId, accessLevel) {
        if (accessLevel === `private`) {
            return this.removeDashboardGroups({
                id: dashboardId,
                groups: publicPermissionGroups,
            });
        }

        return this.setDashboardGroups({
            id: dashboardId,
            groups: publicPermissionGroups,
        });
    }

    resolveDropTemplate(data, query = ``) {
        return this.postV2(
            () => `drops/resolveTemplate${query}`,
            replaceAccessLevel(data),
        );
    }

    calculateResolveDropTemplateOperation(data) {
        return this.postV2(
            () => `drops/resolveTemplate/operation`,
            replaceAccessLevel(data),
        );
    }

    put(relativeUrl, body) {
        return this.login().then(() =>
            this.agent
                .put(`${this.apiUrl}${relativeUrl()}`)
                .send(body)
                .then(({body: responseBody}) => responseBody),
        );
    }

    get(relativeUrl, query) {
        return this.login().then(() =>
            this.agent
                .get(
                    `${this.apiUrl}${relativeUrl()}${createQueryString(query)}`,
                )
                .then(({body}) => body),
        );
    }

    getV2(relativeUrl, query) {
        return this.login().then(() =>
            this.agent
                .get(
                    `${this.apiV2Url}${relativeUrl()}${createQueryString(
                        query,
                    )}`,
                )
                .then(({body}) => body),
        );
    }

    delete(relativeUrl, body) {
        return this.login().then(() =>
            this.agent.delete(`${this.apiUrl}${relativeUrl()}`).send(body),
        );
    }

    deleteV2(relativeUrl, body) {
        return this.login().then(() =>
            this.agent.delete(`${this.apiV2Url}${relativeUrl()}`).send(body),
        );
    }

    shareDrop(dropId) {
        return this.postV2(() => `drops/${dropId}/sharing`);
    }

    stopShareDrop(dropId) {
        return this.deleteV2(() => `drops/${dropId}/sharing`);
    }

    stopShareDashboard(id) {
        return this.delete(() => `dashboards/${id}/sharing`);
    }

    updateSourceInterval({id, interval}) {
        return this.put(() => `sources/${id}/updateInterval`, {
            updateInterval: interval,
        });
    }

    getDropSourceData(dropId) {
        return this.getV2(() => `drops/${dropId}/sourceData`);
    }

    getDropSourceDataCount(dropId) {
        return this.getV2(() => `drops/${dropId}/sourceData/count`);
    }

    getDropSourceDataCsv(dropId) {
        return this.login().then(() =>
            this.agent.get(`${this.apiV2Url}drops/${dropId}/sourceData/csv`),
        );
    }

    getDropDataJson(dropId) {
        return this.login().then(() =>
            this.agent.get(`${this.apiV2Url}drops/${dropId}/reportData/json`),
        );
    }

    getDropDataCsv(dropId) {
        return this.login().then(() =>
            this.agent.get(`${this.apiV2Url}drops/${dropId}/reportData/csv`),
        );
    }

    static createDefaultClient(
        host,
        {token, companies, loginUrl = defaultLoginUrl, app} = {
            loginUrl: defaultLoginUrl,
        },
    ) {
        return new RestClient({
            host,
            credential: {token: token || v4(), companies},
            loginUrl: app ? `api/v1/login/${app}/token` : loginUrl,
        });
    }
}

module.exports = {
    RestClient,
};
