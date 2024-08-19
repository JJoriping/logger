import type { DeepPartial } from "./types.js";

export function getTerminalLength(value:string):number{
  return value.replace(/\x1B\[.+?m/g, "").length;
}
export function isTemplateStringsArray(target:unknown):target is TemplateStringsArray{
  return Object.isFrozen(target) && Array.isArray(target) && 'raw' in target && Array.isArray(target.raw);
}
export function deepAssign<T extends object>(from:T, to:DeepPartial<T>):T{
  for(const v of Object.keys(to) as Array<keyof T&keyof DeepPartial<T>>){
    if(!(v in from)){
      Object.assign(from, { [v]: to[v] });
      continue;
    }
    if(typeof to[v] === "object"){
      deepAssign(from[v] as any, to[v]);
    }else{
      Object.assign(from, { [v]: to[v] });
    }
  }
  return from;
}