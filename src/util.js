const fmt = require("atlas-pretty-hrtime");

const isNum = n => typeof n === "number";

const isPos = n => isNum(n) && n > 0 && isFinite(n);

const isFn = fn => fn && typeof fn === "function";

const pretty = (data, dec=3) => {
  if (isNum(data)) return fmt(data, dec);
  let msg = fmt(data.total, dec);
  if (data.size > 1){
    let med = fmt(data.median, dec),
      mad = fmt(data.mad, dec);
    msg += ` (${med} +/- ${mad})`
  }
  return msg;
}

module.exports = { isPos, isFn, pretty }
