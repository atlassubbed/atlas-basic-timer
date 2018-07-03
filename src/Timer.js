const hrtime = require("atlas-hrtime")();
const pretty = require("atlas-pretty-hrtime");
const { isPos, isFn } = require("./util")

module.exports = shouldLog => {
  return (task, n=1) => {
    if (!isFn(task)) 
      throw new Error("task must be fn");
    if (!isPos(n)) 
      throw new Error("iterations must be non-zero finite num");
    const t0 = hrtime();
    for (let i = n; i--;){
      task()
    }
    const dt = hrtime(t0);
    if (shouldLog){
      const msg = `${task.name || "task"} x ${n} took ${pretty(dt)}`;
      console.log(msg);
    }
    return dt;
  }
}
