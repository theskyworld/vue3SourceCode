// 使用有限状态机的思想实现正则的字符串匹配
// 例如实现正则 /abc/.test("abc")中的test函数

export function myTest(str) {
    function waitForA(char) {
        if (char === 'a') {
            return waitForB;
        }

        return waitForA;
    }

    function waitForB(char) {
        if (char === 'b') {
            return waitForC;
        }

        return waitForB;
    }

    function waitForC(char) {
        if (char === 'c') {
            return end;
        }

        return waitForA;
    }

    function end() {
        return end;
    }

    let currentState = waitForA;

    for (let i = 0; i < str.length; i++) {
        let nextState = currentState(str[i]);
        currentState = nextState;
    }

    if (currentState === end) {
        return true;
    }

    return false;
}

console.log(myTest('abc'))