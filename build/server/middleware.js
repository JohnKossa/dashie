"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function mw(func) {
    return (target, key, descriptor) => {
        if (!descriptor.value.mw)
            descriptor.value.mw = [];
        descriptor.value.mw.push(func);
    };
}
exports.mw = mw;
