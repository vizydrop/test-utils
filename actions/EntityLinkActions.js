class EntityLinkActions {
    constructor({api}) {
        this.api = api;
    }

    createEntityLink({containerPath, entityPath, entityType, entityId}) {
        return this.api.post(`entity-link`).send({
            containerPath,
            entityPath,
            entityType,
            entityId,
        });
    }
}

module.exports = {
    EntityLinkActions,
};
