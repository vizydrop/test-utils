const {RestClient} = require(`./RestClient`);
const {by, createActions} = require(`./actions`);
const apiV1 = require(`./api-v1`);
const apiV2 = require(`./api-v2`);
const {superagent} = require(`./ExtSuperagent`);

module.exports = {
    RestClient,
    actions: {
        by,
        createActions,
        api: apiV1,
        apiV1,
        apiV2,
        superagent,
        request: superagent,
    },
};
