import col from "./colog";

const functionBodyMaxLength = 50;
const inlineArrayMaxLength = 50;
const inlineObjectMaxLength = 50;
const arrayMaxItemCount = 100;
const objectMaxItemCount = 100;
const maxDepth = 3;

type CologContext = {
  'circularMap': Map<object, string>,
  'stack': object[]
};

export function interpolate(chunk:TemplateStringsArray, args:any[]):string{
  let R = "";

  for(let i = 0; i < chunk.length; i++){
    if(i in chunk) R += chunk[i];
    if(i in args) R += toCologString(args[i]);
  }
  return R;
}
export function getTerminalLength(value:string):number{
  return value.replace(/\x1B\[.+?m/g, "").length;
}
export function isTemplateStringsArray(target:unknown):target is TemplateStringsArray{
  return Object.isFrozen(target) && Array.isArray(target) && 'raw' in target && Array.isArray(target.raw);
}
export function toCologString(
  object:any,
  context:CologContext = { circularMap: new Map(), stack: [] }
):string{
  const stackIndex = context.stack.indexOf(object);
  if(stackIndex !== -1){
    const label = `(#${context.circularMap.size + 1})`;

    context.circularMap.set(object, label);
    return col.bold.lMagenta`→${label}`;
  }
  const stackOverflowed = context.stack.length >= maxDepth;
  let isObject = false;

  switch(typeof object){
    case "string":
      if(context.stack.length){
        return col.green`'${object.replace(/'/g, "\\'").replace(/\n/g, col.lBlack`\\n`)}'`;
      }
      return object;
    case "number":
    case "boolean":
      return col.yellow`${object.toString()}`;
    case "bigint":
      return col.yellow`${object.toString()}n`;
    case "symbol": return col.green`Symbol(${object.description ?? ""})`;
    case "function": {
      const name = (object as Function).name ?? "";
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
      }else if(chunk = string.match(/^\((.*?)\)\s*=>\s*([\S\s]+)$/)){
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
        case "normal": R = col.cyan`function ${name}(${args})`; break;
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
  if(Array.isArray(object)){
    if(stackOverflowed){
      return `[ ${col.lBlack`...${object.length.toLocaleString()} items`} ]`;
    }
    if(!object.length) return "[]";
    const nextContext = getNextContext(object);
    const items = object.slice(0, arrayMaxItemCount).map(v => toCologString(v, nextContext));
    let body = `[ ${items.reduce((pv, v, i) => {
      let R = pv + v;
      if(i + 1 < object.length) R += ", ";
      return R;
    }, "")} ]`;
    let circularLabel:string|undefined;

    if(body.length > inlineArrayMaxLength){
      const omitted = object.length - items.length;

      body = `[\n${items.reduce((pv, v, i) => {
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
  if(isObject){
    const allEntries = Reflect.ownKeys(object);
    if(stackOverflowed){
      return `{ ${col.lBlack`...${allEntries.length.toLocaleString()} items`} }`;
    }
    if(!allEntries.length) return "{}";
    const nextContext = getNextContext(object);
    const entries = allEntries.slice(0, objectMaxItemCount);
    const items = entries.map(v => {
      let keyPart:string;

      if(typeof v === "symbol") keyPart = `[${toCologString(v, nextContext)}]`;
      else if(/^\w+$/.test(v)) keyPart = v;
      else keyPart = toCologString(v, nextContext);

      return `${keyPart}: ${toCologString(object[v], nextContext)}`;
    });
    let body = `{ ${items.reduce((pv, v, i) => {
      let R = pv + v;
      if(i + 1 < entries.length) R += ", ";
      return R;
    }, "")} }`;
    let circularLabel:string|undefined;

    if(body.length > inlineObjectMaxLength){
      const omitted = allEntries.length - entries.length;

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
    if(circularLabel = context.circularMap.get(object)){
      body = col.bold.lMagenta`${circularLabel}` + body;
    }
    return body;
  }
  return object;

  function getNextContext(target:object):CologContext{
    return {
      circularMap: context.circularMap,
      stack: [ ...context.stack, target ]
    };
  }
}