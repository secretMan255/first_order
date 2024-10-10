export var STATUS;
(function (STATUS) {
    STATUS[STATUS["GOOD"] = 1] = "GOOD";
    STATUS[STATUS["FAIL"] = 0] = "FAIL";
})(STATUS || (STATUS = {}));
export var ECODE;
(function (ECODE) {
    ECODE[ECODE["GOOD"] = 200] = "GOOD";
    ECODE[ECODE["ERROR"] = 404] = "ERROR";
})(ECODE || (ECODE = {}));
