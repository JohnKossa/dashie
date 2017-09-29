class DBHandler{
    private dbConnections = {
        "default": null
    };

    public withDb(connectionName?: string){
        const myConnection = connectionName || "default";
        return (target: any, key: string, descriptor: TypedPropertyDescriptor<any>)=>{
            return {
                value: (...args: any[])=>{
                    args[0].db = this.dbConnections[myConnection || "default"];
                    return descriptor.value.apply(this, args);
                }
            }
        }
    }

    public registerDB(dbInstance:any, dbName?: string): void{
        this.dbConnections[dbName || "default"] = dbInstance;
    }
}
export {DBHandler};
