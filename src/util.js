const fmt = require("atlas-pretty-hrtime");

const isPos = n => typeof n === "number" && n > 0 && isFinite(n);

const isFn = fn => fn && typeof fn === "function";

const pretty = (data, dec=3) => {
  let msg = fmt(data.sum(), dec);
  if (data.size() > 1){
    let med = fmt(data.median(), dec),
      mad = fmt(data.mad(), dec);
    msg += ` (${med} +/- ${mad})`
  }
  return msg;
}

module.exports = { isPos, isFn, pretty }
