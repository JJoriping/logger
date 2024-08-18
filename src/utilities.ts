export function getTerminalLength(value:string):number{
  return value.replace(/\x1B\[.+?m/g, "").length;
}
export function isTemplateStringsArray(target:unknown):target is TemplateStringsArray{
  return Object.isFrozen(target) && Array.isArray(target) && 'raw' in target && Array.isArray(target.raw);
}