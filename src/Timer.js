const hrtime = require("atlas-hrtime")();
const pretty = require("atlas-pretty-hrtime");
const { isPos, isFn } = require("./util")

module.exports = ({log = true, dec = 3, n = 1}={}) => {
  if (!isPos(n)) throw new Error("n must be non-zero, finite num")
  return task => {
    if (!isFn(task)) 
      throw new Error("task must be fn");
    const t0 = hrtime();
    for (let i = n; i--;) task();
    const dt = hrtime(t0);
    if (log){
      const name = task.name || "task";
      const time = pretty(dt, dec);
      console.log(`${name} x ${n} took ${time}`)
    }
    return dt;
  }
}
