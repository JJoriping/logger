import col from "./colog.js";
import type { LoggerOptions } from "./types.js";

export type CologContext = {
  'circularMap': Map<object, string>,
  'stack': object[],
  'promiseMap': Map<Promise<unknown>, string>,
  'styles': LoggerOptions['styles']
};
export default function toCologString(
  object:any,
  context:CologContext
):string{
  const stackIndex = context.stack.indexOf(object);
  if(stackIndex !== -1){
    const label = context.circularMap.get(object) || `(#${context.circularMap.size + 1})`;

    context.circularMap.set(object, label);
    return col.bold.lMagenta`→${label}`;
  }
  const { functionBodyMaxLength, inlineArrayMaxLength, inlineObjectMaxLength, arrayMaxItemCount, objectMaxItemCount, stringMaxLength, arrayBufferMaxLength, stringTailLength, arrayBufferTailLength, maxDepth } = context.styles;
  const stackOverflowed = context.stack.length >= maxDepth;
  let isObject = false;

  switch(typeof object){
    case "string": {
      let clippedObject:string;

      if(object.length > stringMaxLength){
        const omitted = object.length - stringMaxLength + stringTailLength;
        clippedObject = object.slice(0, stringMaxLength - stringTailLength) + col.lBlack`…${omitted.toLocaleString()} more characters…` + object.slice(object.length - stringTailLength);
      }else{
        clippedObject = object;
      }
      if(context.stack.length){
        return col.green`'${clippedObject.replace(/'/g, "\\'").replace(/\n/g, col.lBlack`\\n`)}'`;
      }
      return clippedObject;
    }
    case "number":
    case "boolean":
      return col.yellow`${object}`;
    case "bigint":
      return col.yellow`${object}n`;
    case "symbol": return col.green`Symbol(${object.description ?? ""})`;
    case "function": {
      let name = (object as Function).name ?? "";
      const string = (object as Function).toString();
      let type:string;
      let chunk:RegExpMatchArray|null;
      let args:string|undefined;
      let body:string|undefined;
      let R:string;

      if(chunk = string.match(/^function[\S\s]*?\((.*?)\)\s*{([\S\s]+)}$/)){
        type = "normal";
        args = chunk[1];
        body = chunk[2];
      }else if(chunk = string.match(/^\(?(.*?)\)?\s*=>\s*([\S\s]+)$/)){
        type = "arrow";
        args = chunk[1];
        body = chunk[2];
      }else if(chunk = string.match(/^class[\S\s]+?{([\S\s]+)}$/)){
        type = "class";
        body = chunk[1];
      }else{
        type = "unknown";
      }
      args = args?.replace(/^\s+|[\n\r]|\s+$/g, "").replace(/\s{2,}/g, " ");
      body = body?.replace(/^\s+|[\n\r]|\s+$/g, "").replace(/\s{2,}/g, " ");

      switch(type){
        case "normal":
          if(name === "bound "){
            name = `bound ${col.lBlack`<anonymous>`}`;
          }
          R = col.cyan`function ${name}(${args})`;
          break;
        case "arrow": R = col.cyan`(${args}) => `; break;
        case "class": R = col.cyan`class ${name}`; break;
        default: R = col.cyan`(unknown function)`; break;
      }
      if(body){
        if(body.length > functionBodyMaxLength) body = body.slice(0, functionBodyMaxLength) + "…";
        if(type === "arrow" && !body.startsWith("{")){
          R += col.lBlack`${body}`;
        }else{
          R += col.lBlack`{ ${body} }`;
        }
      }
      return R;
    }
    case "undefined": return col.lBlack`undefined`;
    case "object": isObject = true; break;
  }
  if(object === null) return col.bold`null`;
  if(object instanceof RegExp) return col.red`/${object.source}/${object.flags}`;
  if(object instanceof Date) return col.magenta`${object.toJSON()}`;
  if(object instanceof Error){
    let R = `${col.bgRed`${object.name}`} ${object.message}`;
    if(object.stack){
      for(const v of object.stack.split('\n').slice(1)){
        R += "\n" + v.replace(/^\s*at\b|\(node:.+\)|\(.+?\bnode_modules\b.+?\)/g, col.lBlack`$&`);
      }
      if(typeof process !== "undefined"){
        R = R.replaceAll(process.cwd(), col.cyan`<cwd>`);
      }
    }
    return R;
  }
  if(typeof Buffer !== "undefined" && Buffer.isBuffer(object)){
    let R = col.lCyan`Buffer` + col.lBlack` (${object.byteLength.toLocaleString()} bytes)\n`;

    if(object.byteLength > arrayBufferMaxLength){
      const omitted = object.byteLength - arrayBufferMaxLength + arrayBufferTailLength;
      R += bufferToString(object.buffer.slice(0, arrayBufferMaxLength - arrayBufferTailLength));
      R += "\n" + col.lBlack`…${omitted.toLocaleString()} more bytes…` + "\n";
      R += bufferToString(object.buffer.slice(object.byteLength - arrayBufferTailLength, object.byteLength));
    }else{
      R += bufferToString(object);
    }
    return R;
  }
  if(ArrayBuffer.isView(object)){
    let R = "";

    if(object.byteLength > arrayBufferMaxLength){
      const omitted = object.byteLength - arrayBufferMaxLength + arrayBufferTailLength;
      R += bufferToString(object.buffer.slice(0, arrayBufferMaxLength - arrayBufferTailLength));
      R += "\n" + col.lBlack`…${omitted.toLocaleString()} more bytes…` + "\n";
      R += bufferToString(object.buffer.slice(object.byteLength - arrayBufferTailLength));
    }else{
      R += bufferToString(object.buffer);
    }
    if(Symbol.toStringTag in object){
      R = col.lCyan`${object[Symbol.toStringTag]}` + col.lBlack` (${object.byteLength.toLocaleString()} bytes)\n` + R;
    }
    return R;
  }
  if(Array.isArray(object) || object instanceof Set){
    let prefix = "";
    let actualObject:any[];
    if(object instanceof Set){
      prefix = col.lCyan`Set `;
      actualObject = Array.from(object);
    }else{
      actualObject = object;
    }
    if(!actualObject.length) return "[]";
    if(stackOverflowed){
      return prefix + `[ ${col.lBlack`...${actualObject.length.toLocaleString()} items`} ]`;
    }
    const nextContext = getNextContext(object);
    const items = actualObject.slice(0, arrayMaxItemCount).map(v => toCologString(v, nextContext));
    let body = prefix + `[ ${items.reduce((pv, v, i) => {
      let R = pv + v;
      if(i + 1 < actualObject.length) R += ", ";
      return R;
    }, "")} ]`;
    let circularLabel:string|undefined;

    if(body.length > inlineArrayMaxLength){
      const omitted = actualObject.length - items.length;

      body = prefix + `[\n${items.reduce((pv, v, i) => {
        let R = pv + "  " + v.replace(/\n/g, "\n  ");
        if(i + 1 < items.length) R += ",\n";
        return R;
      }, "")}`;
      if(omitted){
        body += ",\n  " + col.lBlack`...${omitted.toLocaleString()} more items`;
      }
      body += "\n]";
    }
    if(circularLabel = context.circularMap.get(object)){
      body = col.bold.lMagenta`${circularLabel}` + body;
    }
    return body;
  }
  if(object instanceof Promise){
    const promiseLabel = `\x1B[${context.promiseMap.size}p`;
    context.promiseMap.set(object, promiseLabel);
    return col.lCyan`Promise ` + promiseLabel;
  }
  if(isObject){
    let actualObject:Map<any, any>;
    let body:string;
    let circularLabel:string|undefined;
    if(object instanceof Map){
      actualObject = object;
    }else{
      actualObject = new Map(Reflect.ownKeys(object).map(v => [ v, object[v] ]));
    }
    if(!actualObject.size){
      body = "{}";
    }else if(stackOverflowed){
      body = `{ ${col.lBlack`...${actualObject.size.toLocaleString()} items`} }`;
    }else{
      const nextContext = getNextContext(object);
      const entries = Array.from(actualObject.entries()).slice(0, objectMaxItemCount);
      const items = entries.map(([ k, v ]) => {
        let keyPart:string;

        if(typeof k === "symbol") keyPart = `[${toCologString(k, nextContext)}]`;
        else if(typeof k === "string" && /^\w+$/.test(k)) keyPart = k;
        else keyPart = toCologString(k, nextContext);

        return `${keyPart}: ${toCologString(v, nextContext)}`;
      });
      body = `{ ${items.reduce((pv, v, i) => {
        let R = pv + v;
        if(i + 1 < entries.length) R += ", ";
        return R;
      }, "")} }`;

      if(body.length > inlineObjectMaxLength){
        const omitted = actualObject.size - entries.length;

        body = `{\n${items.reduce((pv, v, i) => {
          let R = pv + "  " + v.replace(/\n/g, "\n  ");
          if(i + 1 < entries.length) R += ",\n";
          return R;
        }, "")}`;
        if(omitted){
          body += ",\n  " + col.lBlack`...${omitted.toLocaleString()} more items`;
        }
        body += "\n}";
      }
    }
    if(Symbol.toStringTag in object){
      body = col.lCyan`${object[Symbol.toStringTag]} ` + body;
    }
    if(circularLabel = context.circularMap.get(object)){
      body = col.bold.lMagenta`${circularLabel}` + body;
    }
    return body;
  }
  return object;

  function getNextContext(target:object):CologContext{
    return {
      circularMap: context.circularMap,
      stack: [ ...context.stack, target ],
      promiseMap: context.promiseMap,
      styles: context.styles
    };
  }
}
function bufferToString(buffer:ArrayBuffer):string{
  const uint8Array = new Uint8Array(buffer);
  let r = "";

  for(let i = 0; i < uint8Array.byteLength; i++){
    if(!(i % 16)) r += "\n";
    r += uint8Array[i].toString(16).toUpperCase().padStart(2, "0") + " ";
  }
  return r.trim();
}