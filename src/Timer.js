const hrtime = require("atlas-hrtime")();
const fmt = require("atlas-pretty-hrtime");
const Dataset = require("atlas-dataset");
const { isPos, isFn, msg } = require("./util")

module.exports = ({log = true, stat = false, dec = 3, n = 1}={}) => {
  if (!isPos(n)) throw new Error("n must be non-zero, finite num")
  return task => {
    if (!isFn(task)) 
      throw new Error("task must be fn");
    let data = new Dataset([]);
    for (let i = n; i--;) {
      const t0 = hrtime();
      task();
      data.add(hrtime(t0))
    }
    if (log){
      const name = task.name || "task";
      let msg = `${name} x ${n} took ${fmt(data.sum(), dec)}`;
      if (stat) msg += ` (${fmt(data.median(), dec)} +/- ${fmt(data.mad(), dec)})`;
      console.log(msg)
    }
    return stat ? {
      n: data.size(),
      elapsed: data.sum(), 
      mean: data.mean(),
      stddev: data.stddev(),
      median: data.median(),
      mad: data.mad()
    } : data.sum()
  }
}
