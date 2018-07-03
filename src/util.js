const isPos = n => typeof n === "number" && n > 0 && isFinite(n);

const isFn = fn => fn && typeof fn === "function";

module.exports = { isPos, isFn }
