import { myTest } from "../src/finiteStateMachine" 
describe("myTest", () => {
    it("input 'abc' should return true else return false", () => {
        expect(myTest('abc')).toBe(true);
    })
})