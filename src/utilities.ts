export function interpolate(chunk:TemplateStringsArray, args:any[]):string{
  let R = "";

  for(let i = 0; i < chunk.length; i++){
    R += chunk[i];
    if(args[i]) R += args[i];
  }
  return R;
}