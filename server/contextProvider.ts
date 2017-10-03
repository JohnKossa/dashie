class ContextProvider{
    private type = "ctx";
    constructor(type){
        this.type = type
    }
    private contexts = {
        "default": null
    };

    public using(connectionName?: string){
        const myConnection = connectionName || "default";
        return (target: any, key: string, descriptor: TypedPropertyDescriptor<any>)=>{
            return {
                value: (...args: any[])=>{
                    args[0][this.type] = this.contexts[myConnection || "default"];
                    return descriptor.value.apply(this, args);
                }
            }
        }
    }

    public register(dbInstance:any, dbName?: string): void{
        this.contexts[dbName || "default"] = dbInstance;
    }
}
export {ContextProvider};
