const {superagent} = require(`./ExtSuperagent`);
const api = require(`./api-v1`);
const {DropActions} = require(`./actions/DropActions`);
const {InfoActions} = require(`./actions/InfoActions`);
const {DashboardActions} = require(`./actions/DashboardActions`);
const {UserActions} = require(`./actions/UserActions`);
const {SpaceActions} = require(`./actions/SpaceActions`);
const {SourceActions} = require(`./actions/SourceActions`);
const {EntityLinkActions} = require(`./actions/EntityLinkActions`);

class Actions {
    constructor(agent, serverUrl) {
        const apiInstance = api(agent, serverUrl);
        this.agent = agent;
        this.user = new UserActions(agent, serverUrl);
        this.space = new SpaceActions(agent, serverUrl);
        this.dashboard = new DashboardActions(agent, serverUrl);
        this.source = new SourceActions(agent, serverUrl);
        this.drop = new DropActions(agent, serverUrl);
        this.info = new InfoActions(agent, serverUrl);
        this.entityLink = new EntityLinkActions({api: apiInstance});
    }

    by(agent, serverUrl) {
        return new Actions(agent, serverUrl);
    }
}

module.exports = {
    by(agent, serverUrl) {
        return new Actions(agent, serverUrl);
    },
    createActions(serverUrl) {
        return new Actions(superagent, serverUrl);
    },
};
