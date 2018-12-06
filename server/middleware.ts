function mw(func: any){
    return (target: any, key: string, descriptor: TypedPropertyDescriptor<any>) => {
        if(!descriptor.value.mw)
            descriptor.value.mw = [];
        descriptor.value.mw.push(func);
    }
}

export {mw}