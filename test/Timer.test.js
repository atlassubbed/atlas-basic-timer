const { describe, it } = require("mocha")
const { expect } = require("chai")
const rewire = require("rewire")
const Cleaner = require("atlas-cleanup-tests")
const Timer = rewire("../src/Timer")

let revert;

const cleanup = Cleaner(() => revert && revert())

describe("Timer", function(){
  it("should return a timer", function(){
    expect(Timer({log: false})).to.be.a("function");
  })
  it("should throw error if given invalid number of iterations", function(){
    const invalidNs = [{}, () => {}, new Date(), null, true, "", /reg/, [], NaN, Infinity, -20, -Infinity];
    invalidNs.forEach(n => {
      expect(() => Timer({n})).to.throw("n must be non-zero, finite num")
    })
  })
  describe("timer", function(){
    describe("runs the given task", function(){
      it("should throw error if not given a valid task", function(){
        const timer = Timer({log: false});
        const invalidTasks = [{}, new Date(), 4, 5.6, null, undefined, true, "", /reg/, []];
        invalidTasks.forEach(task => {
          expect(() => timer(task)).to.throw("task must be fn")
        })
      })
      it("should run the task once if no number of iterations specified", function(){
        let calledTask = 0;
        Timer({log: false})(() => calledTask++)
        expect(calledTask).to.equal(1);
      })
      it("should run the task multiple times if number of iterations specified", function(){
        const n = 100;
        let calledTask = 0;
        Timer({n, log: false})(() => calledTask++)
        expect(calledTask).to.equal(n);
      })
      it.skip("should serially run async tasks", function(){

      })
    })
    describe("returns time stats for the given task", function(){
      describe.skip("async mode", function(){
        it("should return empty errors list and time diff", cleanup(function(){

        }))
        it("should return empty errors list and detailed stats in stat mode", cleanup(function(){

        }))
        it("should return any encountered errors in errors list", cleanup(function(){

        }))
      })
      describe("sync mode", function(){
        it("should return correct time diff", cleanup(function(){
          const t0 = 5, t1 = 10, n = 10;
          let calledTask = 0, calledTime = 0;
          revert = Timer.__set__({
            "hrtime": oldTime => {
              calledTime++;
              if (oldTime){
                expect(calledTime).to.equal(2*calledTask);
                return t1-oldTime;
              }
              expect(calledTime).to.equal(2*calledTask+1);
              return t0
            }
          })
          const deltaTime = Timer({n, log:false})(() => calledTask++);
          expect(deltaTime).to.equal(n*(t1-t0))
        }))
        it("should return the correct detailed stats in stat mode", cleanup(function(){
          const t0 = 5, t1 = 10, n = 10;
          let calledTask = 0, calledTime = 0;
          revert = Timer.__set__({
            "hrtime": oldTime => {
              calledTime++;
              if (oldTime){
                expect(calledTime).to.equal(2*calledTask);
                return t1-oldTime;
              }
              expect(calledTime).to.equal(2*calledTask+1);
              return t0
            }
          })
          const stats = Timer({n, log:false, stat:true})(() => calledTask++);
          expect(stats).to.deep.equal({
            n, 
            elapsed: n*(t1-t0), 
            mean: t1-t0, 
            stddev: 0,
            median: t1-t0,
            mad: 0
          })
        }))  
      })
    })
    describe("logs time stats for a given task", function(){
      it("should not log anything if logging disabled", cleanup(function(){
        let calledLog = false;
        revert = Timer.__set__("console.log", msg => {calledLog = true})
        Timer({log:false, n:10})(() => {})
        expect(calledLog).to.be.false;
      }))
      describe("stat mode", function(){
        it("should log detailed stats for a named task", cleanup(function(){
          const t0 = 5, t1 = 10, myTask = () => {};
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`myTask x 10 took 50.000ns (5.000ns +/- 0.000ns)`)
            },
            "hrtime": oldTime => oldTime ? (t1-oldTime) : t0
          })
          Timer({n:10, stat:true})(myTask)
          expect(calledLog).to.be.true;
        }))
        it("should log detailed stats for an anonymous task", cleanup(function(){
          const t0 = 5, t1 = 10;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task x 10 took 50.000ns (5.000ns +/- 0.000ns)`)
            },
            "hrtime": oldTime => oldTime ? (t1-oldTime) : t0
          })
          Timer({n:10, stat:true})(() => {})
          expect(calledLog).to.be.true;
        }))
        it("should log detailed stats in the specified precision", cleanup(function(){
          const t0 = 5, t1 = 10, myTask = () => {};
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`myTask x 10 took 50.000000ns (5.000000ns +/- 0.000000ns)`)
            },
            "hrtime": oldTime => oldTime ? (t1-oldTime) : t0
          })
          Timer({n:10, dec: 6, stat:true})(myTask)
          expect(calledLog).to.be.true;
        }))
      })
      describe("basic mode", function(){
        it("should log time diff for a named task", cleanup(function(){
          const t0 = 5, t1 = 10, myTask = () => {};
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`myTask x 10 took 50.000ns`)
            },
            "hrtime": oldTime => oldTime ? (t1-oldTime) : t0
          })
          Timer({n:10})(myTask)
          expect(calledLog).to.be.true;
        }))
        it("should log time diff for an anonymous task", cleanup(function(){
          const t0 = 5, t1 = 10;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task x 10 took 50.000ns`)
            },
            "hrtime": oldTime => oldTime ? (t1-oldTime) : t0
          })
          Timer({n:10})(() => {})
          expect(calledLog).to.be.true;
        }))
        it("should log time diff in the specified precision", cleanup(function(){
          const t0 = 5, t1 = 10;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task x 10 took 50.000000ns`)
            },
            "hrtime": oldTime => oldTime ? (t1-oldTime) : t0
          })
          Timer({n:10, dec: 6})(() => {})
          expect(calledLog).to.be.true;
        }))
      })
    })
  })
})
