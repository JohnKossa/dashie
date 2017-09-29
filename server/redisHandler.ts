class RedisHandler{
    private redisConnections = {
        default: null
    };
    public withRedis(connection?: string){
        const myConnection = connection || "default";
        return (target: any, key: string, descriptor: TypedPropertyDescriptor<any>)=>{
            return {
                value: (...args: any[])=>{
                    if(args.length === 3){
                        args[0].redis = this.redisConnections[myConnection || "default"];
                    }
                    var result = descriptor.value.apply(this, args);
                    return result;
                }
            }
        }
    }

    public registerConnection(connectionInstance: any, connectionName?: string): void{
        this.redisConnections[connectionName || "default"] = connectionInstance;
    }
}
export {RedisHandler};
