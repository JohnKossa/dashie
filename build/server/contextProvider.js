"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ContextProvider {
    constructor(type) {
        this.type = "ctx";
        this.contexts = {
            "default": null
        };
        this.type = type;
    }
    withDb(connectionName) {
        const myConnection = connectionName || "default";
        return (target, key, descriptor) => {
            return {
                value: (...args) => {
                    args[0][this.type] = this.contexts[myConnection || "default"];
                    return descriptor.value.apply(this, args);
                }
            };
        };
    }
    register(dbInstance, dbName) {
        this.contexts[dbName || "default"] = dbInstance;
    }
}
exports.ContextProvider = ContextProvider;
