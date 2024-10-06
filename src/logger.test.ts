import test from "node:test";
import assert, { AssertionError } from "node:assert";
import Logger from "./logger.js";
import col from "./colog.js";

const buffer:string[] = [];
const logger = new Logger();
logger.addSubscriber((_, value) => {
  buffer.push(value);
}, { colored: true });

test("Logger", () => {
  logger.log();
  assertAndFlush(`· ${col.lBlack`(empty)`}`);

  logger.log()['Next'](1);
  assertAndFlush(
    `· ${col.lBlack`(empty)`}`,
    col.lBlack`⤷ ` + col.bold`Next` + col.lBlack`: ` + col.yellow`1`
  );

  logger.setOptions({ headerFormat: col.magenta`test` + " $H " });
  logger.log("Hello")['Next'](undefined);
  assertAndFlush(
    col.magenta`test` + " · Hello",
    col.lBlack`⤷ ` + col.bold`Next` + col.lBlack`: ` + col.lBlack`undefined`
  );
});
function assertAndFlush(...values:string[]):void{
  try{
    assert.deepStrictEqual(buffer, values);
  }catch(error){
    if(error instanceof AssertionError){
      console.error(values.join('\n'));
      throw error;
    }
  }
  buffer.splice(0, buffer.length);
}