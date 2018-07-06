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
    it("should return the how long the task took in nanoseconds", cleanup(function(){
      const firstTime = 5, secondTime = 10, n = 10;
      let calledTask = 0;
      revert = Timer.__set__({
        "hrtime": oldTime => {
          if (!oldTime) {
            expect(calledTask).to.equal(0);
            return firstTime
          }
          expect(calledTask).to.equal(n);
          return secondTime - oldTime
        }
      })
      const deltaTime = Timer({n, log:false})(() => calledTask++);
      expect(deltaTime).to.equal(secondTime - firstTime)
    }))
    it("should not log anything", cleanup(function(){
      let calledLog = false;
      revert = Timer.__set__("console.log", msg => {calledLog = true})
      Timer({log:false, n:10})(() => {})
      expect(calledLog).to.be.false;
    }))
    describe("default logging mode", function(){
      it("should log correct stats for a named task", cleanup(function(){
        const firstTime = 5, secondTime = 10, myTask = () => {};
        let calledLog = false;
        revert = Timer.__set__({
          "console.log": msg => {
            calledLog = true;
            expect(msg).to.equal(`myTask x 10 took 5.000ns`)
          },
          "hrtime": oldTime => oldTime ? (secondTime-oldTime) : firstTime
        })
        Timer({n:10})(myTask)
        expect(calledLog).to.be.true;
      }))
      it("should log correct stats for an anonymous task", cleanup(function(){
        const firstTime = 5, secondTime = 10;
        let calledLog = false;
        revert = Timer.__set__({
          "console.log": msg => {
            calledLog = true;
            expect(msg).to.equal(`task x 10 took 5.000ns`)
          },
          "hrtime": oldTime => oldTime ? (secondTime-oldTime) : firstTime
        })
        Timer({n:10})(() => {})
        expect(calledLog).to.be.true;
      }))
      it("should log the time diff in the specified precision", cleanup(function(){
        const firstTime = 5, secondTime = 10;
        let calledLog = false;
        revert = Timer.__set__({
          "console.log": msg => {
            calledLog = true;
            expect(msg).to.equal(`task x 10 took 5.000000ns`)
          },
          "hrtime": oldTime => oldTime ? (secondTime-oldTime) : firstTime
        })
        Timer({n:10, dec: 6})(() => {})
        expect(calledLog).to.be.true;
      }))
    })
  })
})
