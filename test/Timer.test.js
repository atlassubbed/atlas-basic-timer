const { describe, it } = require("mocha")
const { expect } = require("chai")
const rewire = require("rewire")
const Cleaner = require("atlas-cleanup-tests")
const Timer = rewire("../src/Timer")
const { makeAsyncJob } = require("./util")

let revert;

const cleanup = Cleaner(() => revert && revert())

describe("Timer", function(){

  beforeEach(function(){
    revert && revert();
  })

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
      it("should serially run async tasks and call the done callback when done", function(testDone){
        const n = 10, task = makeAsyncJob(20)
        let calledTask = 0, numRunning = 0;
        Timer({n, log: false})(done => {
          calledTask++
          expect(++numRunning).to.equal(1)
          task(() => {
            expect(--numRunning).to.equal(0)
            done()
          })
        }, () => {
          expect(calledTask).to.equal(10);
          testDone();
        })
      })
    })
    describe("returns time stats for the given task", function(){
      describe("async mode", function(){
        it("should return correct time diff in the done callback", function(testDone){
          const n = 10, t0 = 5, t1 = 10, task = makeAsyncJob(20);
          let calledTask = 0, calledTime = 0;
          revert = Timer.__set__({
            hrtime: oldTime => {
              if(++calledTime){
                expect(oldTime).to.equal(t0)
                expect(calledTask).to.equal(n)
                return t1-oldTime;
              }
              expect(oldTime).to.be.undefined;
              expect(calledTask).to.equal(0)
              return t0;
            }
          })
          Timer({n, log:false})(done => {
            calledTask++;
            task(done)
          }, (errs, elapsed) => {
            expect(errs).to.be.an("array").with.lengthOf(0);
            expect(calledTask).to.equal(n)
            expect(elapsed).to.equal(t1-t0)
            testDone();
          })
        })
        it("should return correct stats in the done callback if multiple samples", function(testDone){
          const n = 10, t0 = 5, t1 = 10, task = makeAsyncJob(20), s = 3
          let calledTask = 0, calledTime = 0;
          revert = Timer.__set__({
            hrtime: oldTime => {
              calledTime++;
              if (!(calledTime % 2)){
                expect(oldTime).to.equal(t0)
                expect(calledTask).to.equal(calledTime*n/2);
                return t1-oldTime;
              }
              expect(oldTime).to.be.undefined
              expect(calledTask).to.equal((calledTime-1)*n/2);
              return t0
            }
          })
          Timer({n, log:false})(s, done => {
            calledTask++;
            task(done)
          }, (errs, stats) => {
            expect(errs).to.be.an("array").with.lengthOf(0);
            expect(calledTask).to.equal(n*s)
            expect(stats).to.deep.equal({
              size: s, 
              total: s*(t1-t0), 
              mean: t1-t0, 
              stddev: 0,
              median: t1-t0,
              mad: 0
            })
            testDone();
          })
        })
        it("should return encountered errors in the done callback", function(testDone){
          const n = 10, task = makeAsyncJob(20);
          let calledTask = 0;
          Timer({n, log:false})(done => {
            const id = calledTask++;
            task(() => done(id%2 ? new Error(id) : null))
          }, errs => {
            expect(errs).to.be.an("array").with.lengthOf(5);
            errs.forEach((err,i) => {
              expect(err).to.be.an("error")
              expect(err.message).to.equal(""+(2*i+1))
            })
            testDone();
          })
        })
      })
      describe("sync mode", function(){
        it("should return correct time diff", cleanup(function(){
          const t0 = 5, t1 = 10, n = 10;
          let calledTask = 0, calledTime = 0;
          revert = Timer.__set__({
            "hrtime": oldTime => {
              if(++calledTime){
                expect(oldTime).to.equal(t0)
                expect(calledTask).to.equal(n)
                return t1-oldTime;
              }
              expect(oldTime).to.be.undefined;
              expect(calledTask).to.equal(0)
              return t0;
            }
          })
          const deltaTime = Timer({n, log:false})(() => calledTask++);
          expect(deltaTime).to.equal(t1-t0)
        }))
        it("should return the correct stats if multiple samples", cleanup(function(){
          const t0 = 5, t1 = 10, n = 10, s = 3
          let calledTask = 0, calledTime = 0;
          revert = Timer.__set__({
            "hrtime": oldTime => {
              calledTime++;
              if (!(calledTime % 2)){
                expect(oldTime).to.equal(t0)
                expect(calledTask).to.equal(calledTime*n/2);
                return t1-oldTime;
              }
              expect(oldTime).to.be.undefined
              expect(calledTask).to.equal((calledTime-1)*n/2);
              return t0
            }
          })
          const stats = Timer({n, log:false})(s, () => calledTask++);
          expect(stats).to.deep.equal({
            size: s, 
            total: s*(t1-t0), 
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
      describe("with multiple samples", function(){
        it("should log stats for a named task", cleanup(function(){
          const dt = 5, myTask = () => {}, s = 3, n = 10;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`myTask x ${n} (x ${s}) took ${s*dt}.000ns (${dt}.000ns +/- 0.000ns)`)
            },
            "hrtime": () => dt
          })
          Timer({n})(s, myTask)
          expect(calledLog).to.be.true;
        }))
        it("should log stats for an anonymous task", cleanup(function(){
          const dt = 5, s = 3, n = 10;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task x ${n} (x ${s}) took ${s*dt}.000ns (${dt}.000ns +/- 0.000ns)`)
            },
            "hrtime": () => dt
          })
          Timer({n})(s, () => {})
          expect(calledLog).to.be.true;
        }))
        it("should log stats in the specified precision", cleanup(function(){
          const dt = 5, n = 5, s = 10;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task x ${n} (x ${s}) took ${s*dt}.000000ns (${dt}.000000ns +/- 0.000000ns)`)
            },
            "hrtime": () => dt
          })
          Timer({n, dec: 6})(s, () => {})
          expect(calledLog).to.be.true;
        }))
      })
      describe("with a single sample", function(){
        it("should log time diff for a named task", cleanup(function(){
          const dt = 5, myTask = () => {}, n = 10;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`myTask x ${10} took ${dt}.000ns`)
            },
            "hrtime": () => dt
          })
          Timer({n})(myTask)
          expect(calledLog).to.be.true;
        }))
        it("should log time diff for an anonymous task", cleanup(function(){
          const dt = 5, n = 10;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task x ${n} took ${dt}.000ns`)
            },
            "hrtime": () => dt
          })
          Timer({n})(() => {})
          expect(calledLog).to.be.true;
        }))
        it("should log time diff in the specified precision", cleanup(function(){
          const dt = 5, n = 10;
          let calledLog = false;
          revert = Timer.__set__({
            "console.log": msg => {
              calledLog = true;
              expect(msg).to.equal(`task x ${n} took ${dt}.000000ns`)
            },
            "hrtime": () => dt
          })
          Timer({n, dec: 6})(() => {})
          expect(calledLog).to.be.true;
        }))
      })
    })
  })
})
