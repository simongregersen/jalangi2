/*
 * Copyright 2013 Samsung Information Systems America, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Koushik Sen

// do not remove the following comment
// JALANGI DO NOT INSTRUMENT

/*jslint node: true browser: true */
/*global astUtil acorn esotope J$ */

//var StatCollector = require('../utils/StatCollector');
if (typeof J$ === 'undefined') {
    Object.defineProperty(/*global*/ typeof window === 'undefined' ? global : window, 'J$', { // J$ = {}
        configurable: false,
        enumerable: false,
        value: {}
    });
}


(function (sandbox) {
    if (typeof sandbox.instrumentCode !== 'undefined') {
        return;
    }

    var global = this;
    var JSON = {parse: global.JSON.parse, stringify: global.JSON.stringify};

    var astUtil = sandbox.astUtil;

    var Config = sandbox.Config;
    var Constants = sandbox.Constants;

    var JALANGI_VAR = Constants.JALANGI_VAR;
    var RP = JALANGI_VAR + "_";

//    var N_LOG_LOAD = 0,
//    var N_LOG_FUN_CALL = 1,
//        N_LOG_METHOD_CALL = 2,
    var N_LOG_FUNCTION_ENTER = 4,
//        N_LOG_FUNCTION_RETURN = 5,
        N_LOG_SCRIPT_ENTER = 6,
//        N_LOG_SCRIPT_EXIT = 7,
        N_LOG_GETFIELD = 8,
//        N_LOG_GLOBAL = 9,
        N_LOG_ARRAY_LIT = 10,
        N_LOG_OBJECT_LIT = 11,
        N_LOG_FUNCTION_LIT = 12,
        N_LOG_RETURN = 13,
        N_LOG_REGEXP_LIT = 14,
//        N_LOG_LOCAL = 15,
//        N_LOG_OBJECT_NEW = 16,
        N_LOG_READ = 17,
//        N_LOG_FUNCTION_ENTER_NORMAL = 18,
        N_LOG_HASH = 19,
        N_LOG_SPECIAL = 20,
        N_LOG_STRING_LIT = 21,
        N_LOG_NUMBER_LIT = 22,
        N_LOG_BOOLEAN_LIT = 23,
        N_LOG_UNDEFINED_LIT = 24,
        N_LOG_NULL_LIT = 25;

    var logFunctionEnterFunName = JALANGI_VAR + ".Fe";
    var logFunctionReturnFunName = JALANGI_VAR + ".Fr";
    var logFunCallFunName = JALANGI_VAR + ".F";
    var logMethodCallFunName = JALANGI_VAR + ".M";
    var logAssignFunName = JALANGI_VAR + ".A";
    var logPutFieldFunName = JALANGI_VAR + ".P";
    var logGetFieldFunName = JALANGI_VAR + ".G";
    var logScriptEntryFunName = JALANGI_VAR + ".Se";
    var logScriptExitFunName = JALANGI_VAR + ".Sr";
    var logReadFunName = JALANGI_VAR + ".R";
    var logWriteFunName = JALANGI_VAR + ".W";
    var logIFunName = JALANGI_VAR + ".I";
    var logHashFunName = JALANGI_VAR + ".H";
    var logLitFunName = JALANGI_VAR + ".T";
    var logInitFunName = JALANGI_VAR + ".N";
    var logReturnFunName = JALANGI_VAR + ".Rt";
    var logSequenceExpressionFunName = JALANGI_VAR + ".Sx";
    var logThrowFunName = JALANGI_VAR + ".Th";
    var logReturnAggrFunName = JALANGI_VAR + ".Ra";
    var logUncaughtExceptionFunName = JALANGI_VAR + ".Ex";
    var logLastComputedFunName = JALANGI_VAR + ".L";
    var logTmpVarName = JALANGI_VAR + "._tm_p";
    var logSampleFunName = JALANGI_VAR + ".S";

    var logLoopEnterFunName = JALANGI_VAR + ".Le";
    var logLoopExitFunName = JALANGI_VAR + ".Lr";
    var logForInBodyEnterFunName = JALANGI_VAR + ".Be";
    var logLoopBodyExitFunName = JALANGI_VAR + ".Br";

    var logTryEnterFunName = JALANGI_VAR + ".Te";
    var logTryExitFunName = JALANGI_VAR + ".Tr";
    var logCatchEnterFunName = JALANGI_VAR + ".Ce";
    var logCatchExitFunName = JALANGI_VAR + ".Cr";
    var logFinallyEnterFunName = JALANGI_VAR + ".Ae";
    var logFinallyExitFunName = JALANGI_VAR + ".Ar";
    var logTryCatchFinallyExceptionFunName = JALANGI_VAR + ".TCAx";

    var logWithFunName = JALANGI_VAR + ".Wi";
    var logWithExitFunName = JALANGI_VAR + ".Wr";
    var logBinaryOpFunName = JALANGI_VAR + ".B";
    var logUnaryOpFunName = JALANGI_VAR + ".U";
    var logConditionalFunName = JALANGI_VAR + ".C";
    var logConditionalExitFunName = JALANGI_VAR + ".Cx";
    var logSwitchLeftFunName = JALANGI_VAR + ".C1";
    var logSwitchRightFunName = JALANGI_VAR + ".C2";
    var logLastFunName = JALANGI_VAR + "._";
    var logX1FunName = JALANGI_VAR + ".X1";

    var logTaintFunName = JALANGI_VAR + ".Taint";
    var logSinkFunName = JALANGI_VAR + ".Sink";

    var instrumentCodeFunName = JALANGI_VAR + ".instrumentEvalCode";

    function createBitPattern() {
        var ret = 0;
        var i;
        for (i =0; i< arguments.length; i++) {
            ret = (ret << 1)+(arguments[i]?1:0);
        }
        return ret;
    }

    function HOP(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }


    function isArr(val) {
        return Object.prototype.toString.call(val) === '[object Array]';
    }

    function MAP(arr, fun) {
        var len = arr.length;
        if (!isArr(arr)) {
            throw new TypeError();
        }
        if (typeof fun !== "function") {
            throw new TypeError();
        }

        var res = new Array(len);
        for (var i = 0; i < len; i++) {
            if (i in arr) {
                res[i] = fun(arr[i]);
            }
        }
        return res;
    }

    function regex_escape(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }


    // name of the file containing the instrumented code

    var IID_INC_STEP = 8;
    // current static identifier for each conditional expression
    var condIid;
    var memIid;
    var opIid;
    var hasInitializedIIDs = false;
    var origCodeFileName;
    var instCodeFileName;
    var iidSourceInfo;
    var nxtFreshVar = 1;

    // mkFreshVar does not check for whether the generated variable already exists;
    // this is "fixed" by using this random number.
    var rand = Math.round(Math.random() * 10000000000);

    function mkFreshVar(scope) {
        var name = "J$__v" + rand + "_" + nxtFreshVar++;
        if (scope) {
            scope.addVar(name, "tmp");
        }
        return name;
    }

    function getIid() {
        var tmpIid = memIid;
        memIid = memIid + IID_INC_STEP;
        return createLiteralAst(tmpIid);
    }

    function getPrevIidNoInc() {
        return createLiteralAst(memIid - IID_INC_STEP);
    }

    function getCondIid() {
        var tmpIid = condIid;
        condIid = condIid + IID_INC_STEP;
        return createLiteralAst(tmpIid);
    }

    function getOpIid() {
        var tmpIid = opIid;
        opIid = opIid + IID_INC_STEP;
        return createLiteralAst(tmpIid);
    }


    function printLineInfoAux(i, ast) {
        if (ast && ast.loc) {
            iidSourceInfo[i] = [ast.loc.start.line, ast.loc.start.column + 1, ast.loc.end.line, ast.loc.end.column + 1];

            /*if (ast.type === 'FunctionExpression' || ast.type === 'FunctionDeclaration') {
                testFunctionIid(iidSourceInfo[i]);
            }*/
        }
    }

    // iid+2 is usually unallocated
    // we are using iid+2 for the sub-getField operation of a method call
    // see analysis.M
    function printSpecialIidToLoc(ast0) {
        printLineInfoAux(memIid + 2, ast0);
    }

    function printIidToLoc(ast0) {
        printLineInfoAux(memIid, ast0);
    }

    function printModIidToLoc(ast0) {
        printLineInfoAux(memIid, ast0);
        printLineInfoAux(memIid+2, ast0);
    }

    function printOpIidToLoc(ast0) {
        printLineInfoAux(opIid, ast0);
    }

    function printCondIidToLoc(ast0) {
        printLineInfoAux(condIid, ast0);
    }

// J$_i in expression context will replace it by an AST
// {J$_i} will replace the body of the block statement with an array of statements passed as argument

    function replaceInStatement(code) {
        var asts = arguments;
        var visitorReplaceInExpr = {
            'Identifier': function (node) {
                if (node.name.indexOf(RP) === 0) {
                    var remaining = node.name.substring(RP.length);
                    if (!isNaN(remaining)) {
                        var i = parseInt(node.name.substring(RP.length));
                        return asts[i];
                    }
                }
                return node;
            },
            'BlockStatement': function (node) {
                if (node.body[0].type === 'ExpressionStatement' && isArr(node.body[0].expression)) {
                    node.body = node.body[0].expression;
                }
                return node;
            }
        };
//        StatCollector.resumeTimer("internalParse");
        var ast = acorn.parse(code);
//        StatCollector.suspendTimer("internalParse");
//        StatCollector.resumeTimer("replace");
        var newAst = astUtil.transformAst(ast, visitorReplaceInExpr, undefined, undefined, true);
        //console.log(newAst);
//        StatCollector.suspendTimer("replace");
        return newAst.body;
    }

    function replaceInExpr(code) {
        var ret = replaceInStatement.apply(this, arguments);
        return ret[0].expression;
    }

    function createLiteralAst(name) {
        return {type: "Literal", value: name};
    }

    function createIdentifierAst(name) {
        return {type: "Identifier", name: name};
    }

    function transferLoc(toNode, fromNode) {
        if (fromNode.loc)
            toNode.loc = fromNode.loc;
        if (fromNode.raw)
            toNode.raw = fromNode.loc;
    }

    function wrapPutField(node, base, offset, rvalue, isComputed) {
        if (!Config.INSTR_PUTFIELD || Config.INSTR_PUTFIELD(isComputed ? null : offset.value, node)) {
            printIidToLoc(node);
            var ret = replaceInExpr(
                logPutFieldFunName +
                "(" + RP + "1, " + RP + "2, " + RP + "3, " + RP + "4, " + (createBitPattern(isComputed, false)) + ")",
                getIid(),
                base,
                offset,
                rvalue
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapModAssign(node, base, offset, op, rvalue, isComputed) {
        if (!Config.INSTR_PROPERTY_BINARY_ASSIGNMENT || Config.INSTR_PROPERTY_BINARY_ASSIGNMENT(op, node.computed ? null : offset.value, node)) {
            printModIidToLoc(node);
            var ret = replaceInExpr(
                logAssignFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + RP + "4, " + (createBitPattern(isComputed)) + ")(" + RP + "5)",
                getIid(),
                base,
                offset,
                createLiteralAst(op),
                rvalue
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapMethodCall(node, base, offset, isCtor, isComputed) {
        printIidToLoc(node);
        printSpecialIidToLoc(node.callee);
        var ret = replaceInExpr(
            logMethodCallFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + (createBitPattern(isCtor, isComputed)) + ")",
            getIid(),
            base,
            offset
        );
        transferLoc(ret, node.callee);
        return ret;
    }

    function wrapFunCall(node, ast, isCtor) {
        printIidToLoc(node);
        var ret = replaceInExpr(
            logFunCallFunName + "(" + RP + "1, " + RP + "2, " + (createBitPattern(isCtor)) + ")",
            getIid(),
            ast
        );
        transferLoc(ret, node.callee);
        return ret;
    }

    function wrapGetField(node, base, offset, isComputed) {
        if (!Config.INSTR_GETFIELD || Config.INSTR_GETFIELD(node.computed ? null : offset.value, node)) {
            printIidToLoc(node);
            var ret = replaceInExpr(
                logGetFieldFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + (createBitPattern(isComputed,false, false)) + ")",
                getIid(),
                base,
                offset
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapRead(node, name, val, isReUseIid, isGlobal, isScriptLocal) {
        if (!Config.INSTR_READ || Config.INSTR_READ(name, node)) {
            printIidToLoc(node);
            var ret = replaceInExpr(
                logReadFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + (createBitPattern(isGlobal,isScriptLocal)) + ")",
                isReUseIid ? getPrevIidNoInc() : getIid(),
                name,
                val
            );
            transferLoc(ret, node);
            return ret;
        }
        return val;
    }

//    function wrapReadWithUndefinedCheck(node, name) {
//        var ret = replaceInExpr(
//            "("+logIFunName+"(typeof ("+name+") === 'undefined'? "+RP+"2 : "+RP+"3))",
//            createIdentifierAst(name),
//            wrapRead(node, createLiteralAst(name),createIdentifierAst("undefined")),
//            wrapRead(node, createLiteralAst(name),createIdentifierAst(name), true)
//        );
//        transferLoc(ret, node);
//        return ret;
//    }

    function wrapReadWithUndefinedCheck(node, name) {
        var ret;

        //if (name !== 'location') {
        //    ret = replaceInExpr(
        //        "(" + logIFunName + "(typeof (" + name + ") === 'undefined'? (" + name + "=" + RP + "2) : (" + name + "=" + RP + "3)))",
        //        createIdentifierAst(name),
        //        wrapRead(node, createLiteralAst(name), createIdentifierAst("undefined"), false, true, true),
        //        wrapRead(node, createLiteralAst(name), createIdentifierAst(name), true, true, true)
        //    );
        //} else {
            ret = replaceInExpr(
                "(" + logIFunName + "(typeof (" + name + ") === 'undefined'? (" + RP + "1) : (" + RP + "2)))",
                wrapRead(node, createLiteralAst(name), acorn.parse("J$.undef").body[0].expression, false, true, false),
                wrapRead(node, createLiteralAst(name), createIdentifierAst(name), true, true, false)
            );
//        }
        transferLoc(ret, node);
        return ret;
    }

    function wrapWrite(node, name, val, lhs, isGlobal, isScriptLocal, isDeclaration) {
        if (!Config.INSTR_WRITE || Config.INSTR_WRITE(name, node)) {
            printIidToLoc(node);
            var ret = replaceInExpr(
                logWriteFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + RP + "4, " + (createBitPattern(isGlobal,isScriptLocal,isDeclaration)) + ")",
                getIid(),
                name,
                val,
                lhs
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return val;
        }
    }

    function wrapWriteWithUndefinedCheck(node, name, val, lhs) {
        if (!Config.INSTR_WRITE || Config.INSTR_WRITE(name, node)) {
            printIidToLoc(node);
//        var ret2 = replaceInExpr(
//            "("+logIFunName+"(typeof ("+name+") === 'undefined'? "+RP+"2 : "+RP+"3))",
//            createIdentifierAst(name),
//            wrapRead(node, createLiteralAst(name),createIdentifierAst("undefined")),
//            wrapRead(node, createLiteralAst(name),createIdentifierAst(name), true)
//        );
            var ret = replaceInExpr(
                logWriteFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + logIFunName + "(typeof(" + lhs.name + ")==='undefined'?undefined:" + lhs.name + ")," + createBitPattern(true, false, false) +")",
                getIid(),
                name,
                val
            );
            transferLoc(ret, node);
            return ret;
        } else {
            return val;
        }
    }

    function wrapRHSOfModStore(node, left, right, op) {
        var ret = replaceInExpr(RP + "1 " + op + " " + RP + "2",
            left, right);
        transferLoc(ret, node);
        return ret;
    }

    function makeNumber(node, left) {
        var ret = replaceInExpr(" + " + RP + "1 ", left);
        transferLoc(ret, node);
        return ret;
    }

    function wrapLHSOfModStore(node, left, right) {
        var ret = replaceInExpr(RP + "1 = " + RP + "2",
            left, right);
        transferLoc(ret, node);
        return ret;
    }

    function ifObjectExpressionHasGetterSetter(node) {
        if (node.type === "ObjectExpression") {
            var kind, len = node.properties.length;
            for (var i = 0; i < len; i++) {
                if ((kind = node.properties[i].kind) === 'get' || kind === 'set') {
                    return true;
                }
            }
        }
        return false;
    }

    var dummyFun = function () {
    };
    var dummyObject = {};
    var dummyArray = [];

    function getLiteralValue(funId, node) {
        if (node.name === "undefined") {
            return undefined;
        } else if (node.name === "NaN") {
            return NaN;
        } else if (node.name === "Infinity") {
            return Infinity;
        }
        switch (funId) {
            case N_LOG_NUMBER_LIT:
            case N_LOG_STRING_LIT:
            case N_LOG_NULL_LIT:
            case N_LOG_REGEXP_LIT:
            case N_LOG_BOOLEAN_LIT:
                return node.value;
            case N_LOG_ARRAY_LIT:
                return dummyArray;
            case N_LOG_FUNCTION_LIT:
                return dummyFun;
            case N_LOG_OBJECT_LIT:
                return dummyObject;
        }
        throw new Error(funId + " not known");
    }

    function getFnIdFromAst(ast) {
        var entryExpr = ast.body.body[0];
        if (entryExpr.type === 'VariableDeclaration' && entryExpr.declarations[0].init.type === 'CallExpression') {
            entryExpr = entryExpr.declarations[0].init;
        } else {
            if (entryExpr.type != 'ExpressionStatement') {
                console.log(JSON.stringify(entryExpr));
                throw new Error("IllegalStateException");
            }
            entryExpr = entryExpr.expression;
        }
        if (entryExpr.type != 'CallExpression') {
            throw new Error("IllegalStateException");
        }
        if (entryExpr.callee.type != 'MemberExpression') {
            throw new Error("IllegalStateException");
        }
        if (entryExpr.callee.object.name != JALANGI_VAR) {
            throw new Error("IllegalStateException");
        }
        if (entryExpr.callee.property.name != 'Fe') {
            throw new Error("IllegalStateException");
        }
        return entryExpr['arguments'][0].value;
    }

    function wrapLiteral(node, ast, funId) {
        if (!Config.INSTR_LITERAL || Config.INSTR_LITERAL(getLiteralValue(funId, node), node)) {
            printIidToLoc(node);

            var hasGetterSetter = ifObjectExpressionHasGetterSetter(node);

            var ret;
            if (funId == N_LOG_FUNCTION_LIT) {
                var decl = node;
                if (node.type !== 'FunctionExpression') {
                    if (node.type != 'Identifier') {
                        throw new Error("IllegalStateException");
                    }
                    decl = scope.funNodes[node.name];
                }

                var internalFunId = getFnIdFromAst(decl);
                ret = replaceInExpr(
                    logLitFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + hasGetterSetter + ", null, " + internalFunId + ", " + createBitPattern(decl.scope.strictMode) + ")",
                    getIid(),
                    ast,
                    createLiteralAst(funId),
                    internalFunId
                );
            } else if (funId === N_LOG_OBJECT_LIT) {
                var objectKeys = [];
                var operations = [];
                var properties = node.properties.filter(function (property) {
                    if (property.kind === 'init') {
                        var key = property.key.type === 'Literal' ? property.key.raw : JSON.stringify(property.key.name);
                        objectKeys.push('{ name: ' + key + ', kind: ' + JSON.stringify(property.kind) + '}');
                    } else if (property.kind === 'get' || property.kind === 'set') {
                        var method = property.kind === "get" ? "dG" : "dS";
                        operations.push(replaceInExpr(
                            "J$." + method + "(" + node.reference + ", " + JSON.stringify(property.key.name) + ", " + RP + "1)",
                            property.value));
                        return false;
                    }
                    return true;
                });
                if (operations.length) {
                    ast = {
                        type: 'SequenceExpression',
                        expressions: [
                            replaceInExpr(node.reference + " = " + RP + "1", {
                                type: 'ObjectExpression',
                                properties: properties
                            })
                        ]
                    };
                    Array.prototype.push.apply(ast.expressions, operations);
                    ast.expressions.push({ type: 'Identifier', name: node.reference });
                }
                ret = replaceInExpr(
                    logLitFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + hasGetterSetter + ", [" + objectKeys.join(', ') + "])",
                    getIid(),
                    ast,
                    createLiteralAst(funId)
                );
            } else {
                ret = replaceInExpr(
                    logLitFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + hasGetterSetter + ")",
                    getIid(),
                    ast,
                    createLiteralAst(funId)
                );
            }
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapReturn(node, expr) {
        var lid = (expr === null) ? node : expr;
        printIidToLoc(lid);
        var ret = replaceInExpr(
            logReturnFunName + "(" + RP + "1, " + RP + "2, " + createBitPattern(expr === null) + ")",
            getIid(),
            expr || createIdentifierAst("undefined")
        );
        transferLoc(ret, lid);
        return ret;
    }

    function wrapSequenceExpression(node) {
        printIidToLoc(node);
        var ret = replaceInExpr(
            logSequenceExpressionFunName + "(" + RP + "1, " + RP + "2, " + node.expressions.length + ")",
            getIid(), node);
        transferLoc(ret, node);
        return ret;
    }

    function wrapThrow(node, expr) {
        printIidToLoc(expr);
        var ret = replaceInExpr(
            logThrowFunName + "(" + RP + "1, " + RP + "2)",
            getIid(),
            expr
        );
        transferLoc(ret, expr);
        return ret;
    }

    function instrumentLoopBodyEnterExit(node, bodyStmts, isFirstDoWhileIteration) {
        printIidToLoc(node);

        var iid = getIid();
        var loopBodyExitCall = replaceInStatement(
            logLoopBodyExitFunName + "(" + RP + "1, " + RP + "2, " + createBitPattern(isFirstDoWhileIteration) + ")",
            iid,
            createLiteralAst(node.type));
        transferLoc(loopBodyExitCall[0].expression, node);

        if (node.type === 'ForInStatement') {
            var forInBodyEnterCall = replaceInStatement(
                logForInBodyEnterFunName + "(" + RP + "1, " + logTmpVarName + ")",
                iid);
            transferLoc(forInBodyEnterCall[0].expression, node);

            bodyStmts = forInBodyEnterCall.concat(bodyStmts);
        }
        return replaceInStatement("try { " + RP + "1 } finally { " + RP + "2 }",
            bodyStmts, loopBodyExitCall);
    }

    function instrumentTryEnterExit(node, ast) {
        printIidToLoc(node);

        var iid = getIid();
        var enterCall = replaceInStatement(
            logTryEnterFunName + "(" + RP + "1, " + createBitPattern(node.handler !== null, node.finalizer !== null) + ")",
            iid);
        transferLoc(enterCall[0].expression, node);

        var tryExceptionCall = replaceInStatement(
            logTryCatchFinallyExceptionFunName + "(e)");
        transferLoc(tryExceptionCall[0].expression, node);

        var exitCall = replaceInStatement(
            logTryExitFunName + "(" + RP + "1, " + createBitPattern(node.handler !== null, node.finalizer !== null) + ")",
            iid);
        transferLoc(exitCall[0].expression, node);

        return replaceInStatement(
            "try { " + RP + "1 } catch (e) { " + RP + "2 } finally { " + RP + "3 }",
            enterCall.concat(ast),
            tryExceptionCall,
            exitCall);
    }

    function instrumentCatchFinallyEnterExit(node, ast, enterFunName, exitFunName) {
        printIidToLoc(node);

        var iid = getIid();
        var enterCall;
        if (enterFunName === logCatchEnterFunName) {
            enterCall = replaceInStatement(
                enterFunName + "(" + RP + "1, " + RP + "2)",
                iid,
                createLiteralAst(node.param.name)
            );
        } else {
            enterCall = replaceInStatement(
                enterFunName + "(" + RP + "1)",
                iid
            );
        }
        transferLoc(enterCall[0].expression, node);

        var exitCall = replaceInStatement(
            exitFunName + "(" + RP + "1)",
            iid
        );
        transferLoc(exitCall[0].expression, node);

        var tryEnterBody = enterCall.concat(ast);
        var tryEnterExitBody = replaceInStatement(
            "try { " + RP + "1 } finally { " + RP + "2 }",
            tryEnterBody,
            exitCall
        );

        return tryEnterExitBody;
    }

    function wrapWithX1(node, ast) {
        if (!Config.INSTR_END_EXPRESSION || Config.INSTR_END_EXPRESSION(node)) {

            if (!ast || ast.type.indexOf("Expression") <= 0) return ast;
            printIidToLoc(node);
            var ret = replaceInExpr(
                logX1FunName + "(" + RP + "1, " + RP + "2)", getIid(), ast);
            transferLoc(ret, node);
            return ret;
        } else {
            return ast;
        }
    }

    function wrapHash(node, ast) {
        printIidToLoc(node);
        var ret = replaceInExpr(
            logHashFunName + "(" + RP + "1, " + RP + "2)",
            getIid(),
            ast
        );
        transferLoc(ret, node);
        return ret;
    }

    function wrapEvalArg(ast) {
        printIidToLoc(ast);
        var ret = replaceInExpr(
            instrumentCodeFunName + "(" + RP + "1, " + RP + "2, true)",
            ast,
            getIid()
        );
        transferLoc(ret, ast);
        return ret;
    }

    function wrapUnaryOp(node, argument, operator) {
        if (!Config.INSTR_UNARY || Config.INSTR_UNARY(operator, node)) {
            printOpIidToLoc(node);
            var ret = replaceInExpr(
                logUnaryOpFunName + "(" + RP + "1, " + RP + "2, " + RP + "3)",
                getOpIid(),
                createLiteralAst(operator),
                argument
            );
            transferLoc(ret, node);
            return ret;
        }
        if (node.operator === "void") {
            return argument;
        }
        return node;
    }

    function wrapBinaryOp(node, left, right, operator, isComputed) {
        if (!Config.INSTR_BINARY || Config.INSTR_BINARY(operator, operator)) {
            printOpIidToLoc(node);
            var ret = replaceInExpr(
                logBinaryOpFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + RP + "4, " + (createBitPattern(isComputed, false, false)) + ")",
                getOpIid(),
                createLiteralAst(operator),
                left,
                right
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapLogicalAnd(node, left, right) {
        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("&&", node)) {
            printCondIidToLoc(node);
            var condIid = getCondIid();
            var ret = replaceInExpr(logConditionalExitFunName + "(" + RP + "1, " + JSON.stringify("LogicalAnd") + ", " +
                logConditionalFunName + "(" + RP + "2, " + RP + "3, " + JSON.stringify("LogicalAnd") + ")?" + RP + "4:" + logLastFunName + "())",
                condIid,
                condIid,
                left,
                right
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapLogicalOr(node, left, right) {
        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("||", node)) {
            printCondIidToLoc(node);
            var condIid = getCondIid();
            var ret = replaceInExpr(logConditionalExitFunName + "(" + RP + "1, " + JSON.stringify("LogicalOr") + ", " +
                logConditionalFunName + "(" + RP + "2, " + RP + "3, " + JSON.stringify("LogicalOr") + ")?" + logLastFunName + "():" + RP + "4" + ")",
                condIid,
                condIid,
                left,
                right
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapSwitchDiscriminant(node, discriminant) {
        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("switch", node)) {
            printCondIidToLoc(node);
            var ret = replaceInExpr(
                logSwitchLeftFunName + "(" + RP + "1, " + RP + "2)",
                getCondIid(),
                discriminant
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapSwitchTest(node, test) {
        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("switch", node)) {
            printCondIidToLoc(node);
            var ret = replaceInExpr(
                logSwitchRightFunName + "(" + RP + "1, " + RP + "2)",
                getCondIid(),
                test
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapWith(node) {
        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("with", node)) {
            printIidToLoc(node);
            var ret = replaceInExpr(
                logWithFunName + "(" + RP + "1, " + RP + "2)",
                getIid(),
                node
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapConditional(node, type) {
        if (node === null) {
            return node;
        } // to handle for(;;) ;

        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("other", node)) {
            printCondIidToLoc(node);
            var ret = replaceInExpr(logConditionalFunName + "(" + RP + "1, " + RP + "2, " + JSON.stringify(type) + ")",
                getCondIid(),
                node
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

    function wrapConditionalOuter(node) {
        if (!Config.INSTR_CONDITIONAL || Config.INSTR_CONDITIONAL("other", node)) {
            printCondIidToLoc(node);
            var ret = replaceInExpr(logConditionalExitFunName + "(" + RP + "1, " + JSON.stringify(node.type) + ", " + RP + "2)",
                getCondIid(),
                node
            );
            transferLoc(ret, node);
            return ret;
        }
        return node;
    }

//    function createCallWriteAsStatement(node, name, val) {
//        printIidToLoc(node);
//        var ret = replaceInStatement(
//            logWriteFunName + "(" + RP + "1, " + RP + "2, " + RP + "3)",
//            getIid(),
//            name,
//            val
//        );
//        transferLoc(ret[0].expression, node);
//        return ret;
//    }

    function createExpressionStatement(lhs, node) {
        var ret;
        ret = replaceInStatement(
            RP + "1 = " + RP + "2", lhs, node
        );
        transferLoc(ret[0].expression, node);
        return ret;
    }

    function createCallInitAsStatement(node, name, val, isArgumentSync, lhs, isCatchParam, isAssign, isVariableDecl, isEnclosingFunctionName) {
        printIidToLoc(node);
        var ret;

        if (isAssign)
            ret = replaceInStatement(
                RP + "1 = " + logInitFunName + "(" + RP + "2, " + RP + "3, " + RP + "4, " + createBitPattern(isArgumentSync, false, isCatchParam, isVariableDecl, isEnclosingFunctionName) + ")",
                lhs,
                getIid(),
                name,
                val
            );
        else
            ret = replaceInStatement(
                logInitFunName + "(" + RP + "1, " + RP + "2, " + RP + "3, " + createBitPattern(isArgumentSync, false, isCatchParam, isVariableDecl, isEnclosingFunctionName) + ")",
                getIid(),
                name,
                val
            );

        transferLoc(ret[0].expression, node);
        return ret;
    }

    function createCallAsFunEnterStatement(node) {
        printIidToLoc(node);

        node.currentFunctionVar = mkFreshVar();

        var callee;
        if (node.scope.vars[node.id.name] === 'arg' || node.scope.vars[node.id.name] === 'var') {
            callee = node.reference = mkFreshVar();
        } else {
            callee = node.id.name;
        }

        var ret = replaceInStatement(
            "var " + node.currentFunctionVar + " = " + logFunctionEnterFunName + "(" + RP + "1, " + callee + ", this, arguments)",
            getIid(node)
        );
        transferLoc(ret[0].declarations[0].init, node);
        return ret;
    }

    function createCallAsScriptEnterStatement(node) {
        printIidToLoc(node);
        var ret = replaceInStatement(logScriptEntryFunName + "(" + RP + "1, " + RP + "2, " + RP + "3)",
            getIid(),
            createLiteralAst(instCodeFileName), createLiteralAst(origCodeFileName));
        transferLoc(ret[0].expression, node);
        return ret;
    }

    var labelCounter = 0;

    function wrapForIn(node, left, right, body) {
        printIidToLoc(node);
        var tmp, extra, isDeclaration = left.type === 'VariableDeclaration';
        if (isDeclaration) {
            var name = node.left.declarations[0].id.name;
            tmp = replaceInExpr(name + " = " + logTmpVarName);
        } else {
            tmp = replaceInExpr(RP + "1 = " + logTmpVarName, left);
        }
        transferLoc(tmp, node);
        extra = instrumentStore(tmp, isDeclaration);

        var ret;

        if (body.type === 'BlockExpression') {
            body = body.body;
        } else {
            body = [body];
        }
        if (isDeclaration) {
            ret = replaceInStatement(
                "function n() {  for(" + logTmpVarName + " in " + RP + "1) {var " + name + " = " + RP + "2;\n {" + RP + "3}}}",
                right, wrapWithX1(node, extra.right), body);
        } else {
            ret = replaceInStatement(
                "function n() {  for(" + logTmpVarName + " in " + RP + "1) {" + RP + "2;\n {" + RP + "3}}}",
                right, wrapWithX1(node, extra), body);
        }
        ret = ret[0].body.body[0];
        transferLoc(ret, node);

        ret.body.body = instrumentLoopBodyEnterExit(ret, ret.body.body, false);

        var iid = getIid();
        var loopExitCall = replaceInStatement(
            logLoopExitFunName + "(" + RP + "1, " + RP + "2)",
            iid,
            createLiteralAst(node.type));
        transferLoc(loopExitCall[0].expression, node);

        var result = {
            type: "BlockStatement",
            body: replaceInStatement("try { " + RP + "1 } finally { " + RP + "2 }",
                [ret], loopExitCall)
        };

        if (node.label) {
            var loop = result.body[0].block.body[0];
            result.body[0].block.body[0] = {
                type: 'LabeledStatement',
                label: {
                    type: 'Identifier',
                    name: node.label
                },
                body: loop
            };
        }

        return result;
    }

    function wrapCatchClause(node, body, name) {
        var ret;
        if (!Config.INSTR_INIT || Config.INSTR_INIT(node)) {
            body.unshift(createCallInitAsStatement(node,
                createLiteralAst(name),
                createIdentifierAst(name),
                false, createIdentifierAst(name), true, true, true, false)[0]);
        }
    }

    function wrapScriptBodyWithTryCatch(node, body) {
        if (!Config.INSTR_TRY_CATCH_ARGUMENTS || Config.INSTR_TRY_CATCH_ARGUMENTS(node)) {
            printIidToLoc(node);
            var iid1 = getIid();
            printIidToLoc(node);
            var l = labelCounter++;
            var ret = replaceInStatement(
                "function n() { jalangiLabel" + l + ": while(true) { try {" + RP + "1} catch(" + JALANGI_VAR +
                "e) { //console.log(" + JALANGI_VAR + "e); console.log(" +
                JALANGI_VAR + "e.stack);\n  " + logUncaughtExceptionFunName + "(" + RP + "2, " + JALANGI_VAR +
                "e); } finally { if (" + logScriptExitFunName + "(" +
                RP + "3)) { " + logLastComputedFunName + "(); continue jalangiLabel" + l + ";\n } else {\n  " + logLastComputedFunName + "(); break jalangiLabel" + l + ";\n }}\n }}", body,
                iid1,
                getIid()
            );
            //console.log(JSON.stringify(ret));

            ret = ret[0].body.body;
            transferLoc(ret[0], node);
            return ret;
        } else {
            return body;
        }
    }

    function wrapFunBodyWithTryCatch(node, body) {
        if (!Config.INSTR_TRY_CATCH_ARGUMENTS || Config.INSTR_TRY_CATCH_ARGUMENTS(node)) {
            printIidToLoc(node);
            var iid1 = getIid();
            printIidToLoc(node);
            var l = labelCounter++;
            var ret = replaceInStatement(
                "function n() { jalangiLabel" + l + ": while(true) { try {" + RP + "1} catch(" + JALANGI_VAR +
                "e) { //console.log(" + JALANGI_VAR + "e); console.log(" +
                JALANGI_VAR + "e.stack);\n " + logUncaughtExceptionFunName + "(" + RP + "2, " + JALANGI_VAR +
                "e); } finally { if (" + logFunctionReturnFunName + "(" +
                RP + "3, " + node.currentFunctionVar + ")) continue jalangiLabel" + l + ";\n else \n  return " + logReturnAggrFunName + "();\n }\n }}", body,
                iid1,
                getIid()
            );
            //console.log(JSON.stringify(ret));

            ret = ret[0].body.body;
            transferLoc(ret[0], node);
            return ret;
        } else {
            return body;
        }
    }

    function wrapWithTaint(node, name, init) {
        printIidToLoc(node);
        var ret = replaceInExpr(
            logTaintFunName + "(" + RP + "1," + RP + "2," + RP + "3)",
            getIid(),
            createLiteralAst(name),
            init
        );
        transferLoc(ret, node);
        return ret;
    }

    function wrapWithSink(node, name, init) {
        printIidToLoc(node);
        var ret = replaceInExpr(
            logSinkFunName + "(" + RP + "1," + RP + "2," + RP + "3)",
            getIid(),
            createLiteralAst(name),
            init
        );
        transferLoc(ret, node);
        return ret;
    }

    function syncDefuns(node, scope, isScript) {
        var ret = [], ident;
        if (!isScript) {
            if (!Config.INSTR_TRY_CATCH_ARGUMENTS || Config.INSTR_TRY_CATCH_ARGUMENTS(node)) {
                if (!Config.INSTR_INIT || Config.INSTR_INIT(node)) {
                    ident = createIdentifierAst("arguments");
                    ret = ret.concat(createCallInitAsStatement(node,
                        createLiteralAst("arguments"),
                        ident,
                        true, ident, false, false, true, false));
                }
            }
        }
        if (scope) {
                for (var name in scope.vars) {
                    if (HOP(scope.vars, name)) {
                        if (scope.vars[name] === "defun") {
                            if (!Config.INSTR_INIT || Config.INSTR_INIT(node)) {
                                ident = createIdentifierAst(name);
                                ident.loc = scope.funLocs[name];
                                ret = ret.concat(createCallInitAsStatement(node,
                                    createLiteralAst(name),
                                    wrapLiteral(ident, ident, N_LOG_FUNCTION_LIT),
                                    false, ident, false, true, false, false));
                            } else {
                                ident = createIdentifierAst(name);
                                ident.loc = scope.funLocs[name];
                                ret = ret.concat(
                                    createExpressionStatement(ident,
                                        wrapLiteral(ident, ident, N_LOG_FUNCTION_LIT)));
                            }
                        }
                        if (scope.vars[name] === "lambda") {
                            if (!Config.INSTR_INIT || Config.INSTR_INIT(node)) {
                                ident = createIdentifierAst(name);
                                ident.loc = scope.funLocs[name];
                                ret = ret.concat(createCallInitAsStatement(node,
                                    createLiteralAst(name), ident,
                                    false, ident, false, false, true, true));
                            }
                        }
                        if (scope.vars[name] === "arg") {
                            if (!Config.INSTR_INIT || Config.INSTR_INIT(node)) {
                                ident = createIdentifierAst(name);
                                ret = ret.concat(createCallInitAsStatement(node,
                                    createLiteralAst(name),
                                    ident,
                                    true,
                                    ident, false, true, true, false));
                            }
                        }
                        if (scope.vars[name] === "var") {
                            if (!Config.INSTR_INIT || Config.INSTR_INIT(node)) {
                                ret = ret.concat(createCallInitAsStatement(node,
                                    createLiteralAst(name),
                                    createIdentifierAst(name),
                                    false, undefined, false, false, true, false));
                            }
                        }
                        if (scope.vars[name] === "tmp") {
                            ret.push({
                                type: 'VariableDeclaration',
                                kind: 'var',
                                declarations: [{
                                    type: 'VariableDeclarator',
                                    id: { type: 'Identifier', name: name },
                                    init: null
                                }]
                            });
                        }
                    }
                }
        }
        return ret;
    }

    var scope;

    function instrumentFunctionEntryExit(node, ast) {
        var body;
        if (!Config.INSTR_TRY_CATCH_ARGUMENTS || Config.INSTR_TRY_CATCH_ARGUMENTS(node)) {
            body = createCallAsFunEnterStatement(node);
        } else {
            body = [];
        }
        return body.concat(syncDefuns(node, scope, false)).concat(ast);
    }

    /**
     * instruments entry of a script.  Adds the script entry (J$.Se) callback,
     * and the J$.N init callbacks for locals.
     *
     */
    function instrumentScriptEntryExit(node, body0) {
        var body;
        if (!Config.INSTR_TRY_CATCH_ARGUMENTS || Config.INSTR_TRY_CATCH_ARGUMENTS(node)) {
            body = createCallAsScriptEnterStatement(node)
        } else {
            body = [];
        }
        body = body.concat(syncDefuns(node, scope, true)).
            concat(body0);
        return body;
    }


    function getPropertyAsAst(ast) {
        return ast.computed ? ast.property : createLiteralAst(ast.property.name);
    }

    function instrumentCall(callAst, isCtor) {
        var ast = callAst.callee;
        var ret;
        if (ast.type === 'MemberExpression') {
            ret = wrapMethodCall(callAst, ast.object,
                getPropertyAsAst(ast),
                isCtor, ast.computed);
            return ret;
        } else if (ast.type === 'Identifier' && ast.name === "eval") {
            return ast;
        } else {
            ret = wrapFunCall(callAst, ast, isCtor);
            return ret;
        }
    }

    function instrumentStore(node, isDeclaration) {
        var ret;
        if (node.left.type === 'Identifier') {
            if (scope.hasVar(node.left.name)) {
                ret = wrapWrite(node.right, createLiteralAst(node.left.name), node.right, node.left, false, scope.isGlobal(node.left.name), isDeclaration);
            } else {
                ret = wrapWriteWithUndefinedCheck(node.right, createLiteralAst(node.left.name), node.right, node.left);

            }
            node.right = ret;
            return node;
        } else {
            ret = wrapPutField(node, node.left.object, getPropertyAsAst(node.left), node.right, node.left.computed);
            return ret;
        }
    }

    function instrumentLoad(ast, isTypeof) {
        var ret;
        if (ast.type === 'Identifier') {
            if (ast.name === "undefined") {
                ret = wrapLiteral(ast, ast, N_LOG_UNDEFINED_LIT);
                return ret;
            } else if (ast.name === "NaN" || ast.name === "Infinity") {
                ret = wrapLiteral(ast, ast, N_LOG_NUMBER_LIT);
                return ret;
            }
            if (ast.name === JALANGI_VAR) {
                return ast;
            } else if (scope.hasVar(ast.name)) {
                ret = wrapRead(ast, createLiteralAst(ast.name), ast, false, false, scope.isGlobal(ast.name));
                return ret;
            } else if (isTypeof) {
                ret = wrapReadWithUndefinedCheck(ast, ast.name);
                return ret;
            } else {
                ret = wrapRead(ast, createLiteralAst(ast.name), ast, false, true, false)
                return ret;
            }

        } else if (ast.type === 'MemberExpression') {
            return wrapGetField(ast, ast.object, getPropertyAsAst(ast), ast.computed);
        } else {
            return ast;
        }
    }

    function instrumentLoadModStore(node, isNumber) {
        if (node.left.type === 'Identifier') {
            var tmp0 = instrumentLoad(node.left, false);
            if (isNumber) {
                tmp0 = makeNumber(node, instrumentLoad(tmp0, false));
            }
            var tmp1 = wrapRHSOfModStore(node.right, tmp0, node.right, node.operator.substring(0, node.operator.length - 1));

            var tmp2;
            if (scope.hasVar(node.left.name)) {
                tmp2 = wrapWrite(node.right, createLiteralAst(node.left.name), tmp1, node.left, false, scope.isGlobal(node.left.name), false);
            } else {
                tmp2 = wrapWriteWithUndefinedCheck(node.right, createLiteralAst(node.left.name), tmp1, node.left);

            }
            tmp2 = wrapLHSOfModStore(node, node.left, tmp2);
            return tmp2;
        } else {
            var ret = wrapModAssign(node, node.left.object,
                getPropertyAsAst(node.left),
                node.operator.substring(0, node.operator.length - 1),
                node.right, node.left.computed);
            return ret;
        }
    }

    function instrumentPreIncDec(node) {
        var right = createLiteralAst(1);
        right = wrapLiteral(right, right, N_LOG_NUMBER_LIT);
        var ret = wrapRHSOfModStore(node, node.argument, right, node.operator.substring(0, 1) + "=");
        return instrumentLoadModStore(ret, true);
    }

    function adjustIncDec(op, ast) {
        if (op === '++') {
            op = '-';
        } else {
            op = '+';
        }
        var right = createLiteralAst(1);
        right = wrapLiteral(right, right, N_LOG_NUMBER_LIT);
        var ret = wrapRHSOfModStore(ast, ast, right, op);
        return ret;
    }


    // Should 'Program' nodes in the AST be wrapped with prefix code to load libraries,
    // code to indicate script entry and exit, etc.?
    // we need this flag since when we're instrumenting eval'd code, the code is parsed
    // as a top-level 'Program', but the wrapping code may not be syntactically valid in
    // the surrounding context, e.g.:
    //    var y = eval("x + 1");

    function setScope(node) {
        scope = node.scope;
    }

    function mergeBodies(node) {
        printIidToLoc(node);
        var ret = replaceInStatement(
            "function n() { if (!" + logSampleFunName + "(" + RP + "1, arguments.callee)){" + RP + "2} else {" + RP + "3}}",
            getIid(),
            node.bodyOrig.body,
            node.body.body
        );

        node.body.body = ret[0].body.body;
        delete node.bodyOrig;
        return node;
    }

    function regExpToJSON() {
        var str = this.source;
        var glb = this.global;
        var ignoreCase = this.ignoreCase;
        var multiline = this.multiline;
        var obj = {
            type: 'J$.AST.REGEXP',
            value: str,
            glb: glb,
            ignoreCase: ignoreCase,
            multiline: multiline
        }
        return obj;
    }

    function JSONStringifyHandler(key, value) {
        if (key === 'scope') {
            return undefined;
        } if (value instanceof RegExp) {
            return regExpToJSON.call(value);
        } else {
            return value;
        }
    }

    function JSONParseHandler(key, value) {
        var ret = value, flags = '';
        if (typeof value === 'object' && value && value.type === 'J$.AST.REGEXP') {
            if (value.glb)
                flags += 'g';
            if (value.ignoreCase)
                flags += 'i';
            if (value.multiline)
                flags += 'm';
            ret = RegExp(value.value, flags);
        }
        return ret;
    }

    function clone(src) {
        return JSON.parse(JSON.stringify(src, JSONStringifyHandler), JSONParseHandler);
    }

    /*
     function constructEmptyObject(o) {
     function F() {}
     F.prototype = o;
     return new F();
     }

     function clone(src) { // from http://davidwalsh.name/javascript-clone
     function mixin(dest, source, copyFunc) {
     var name, s, i, empty = {};
     for(name in source){
     // the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
     // inherited from Object.prototype.     For example, if dest has a custom toString() method,
     // don't overwrite it with the toString() method that source inherited from Object.prototype
     s = source[name];
     if(!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))){
     dest[name] = copyFunc ? copyFunc(s) : s;
     }
     }
     return dest;
     }

     if(!src || typeof src != "object" || Object.prototype.toString.call(src) === "[object Function]"){
     // null, undefined, any non-object, or function
     return src;    // anything
     }
     if(src.nodeType && "cloneNode" in src){
     // DOM Node
     return src.cloneNode(true); // Node
     }
     if(src instanceof Date){
     // Date
     return new Date(src.getTime());    // Date
     }
     if(src instanceof RegExp){
     // RegExp
     return new RegExp(src);   // RegExp
     }
     var r, i, l;
     if(src instanceof Array){
     // array
     r = [];
     for(i = 0, l = src.length; i < l; ++i){
     if(i in src){
     r.push(clone(src[i]));
     }
     }
     // we don't clone functions for performance reasons
     //     }else if(d.isFunction(src)){
     //         // function
     //         r = function(){ return src.apply(this, arguments); };
     }else{
     // generic objects
     try {
     r = constructEmptyObject(src);
     //                r = src.constructor ? new src.constructor() : {};
     } catch (e) {
     console.log(src);
     throw e;
     }
     }
     return mixin(r, src, clone);

     }
     */
    var visitorCloneBodyPre = {
        "FunctionExpression": function (node) {
            node.bodyOrig = clone(node.body);
            return node;
        },
        "FunctionDeclaration": function (node) {
            node.bodyOrig = clone(node.body);
            return node;
        }
    };

    var visitorMergeBodyPre = {
        "FunctionExpression": mergeBodies,
        "FunctionDeclaration": mergeBodies
    };

    var visitorRRPre = {
        'Program': setScope,
        'FunctionDeclaration': setScope,
        'FunctionExpression': setScope,
        'CatchClause': setScope,
        "ArrayExpression": function (node) {
            node.elements = node.elements.map(function (element) {
                if (element === null) {
                    return { type: "Identifier", name: "undefined" };
                }
                return element;
            });
            return node;
        },
        "LabeledStatement": function (node) {
            if (node.body.type === 'ForInStatement') {
                node.body.label = node.label.name;
                node.remove = true;
            }
        }
    };

    var visitorRRPost = {
        'Literal': function (node, context) {
            if (context === astUtil.CONTEXT.RHS) {

                var litType;
                switch (typeof node.value) {
                    case 'number':
                        litType = N_LOG_NUMBER_LIT;
                        break;
                    case 'string':
                        litType = N_LOG_STRING_LIT;
                        break;
                    case 'object': // for null
                        if (node.value === null)
                            litType = N_LOG_NULL_LIT;
                        else
                            litType = N_LOG_REGEXP_LIT;
                        break;
                    case 'boolean':
                        litType = N_LOG_BOOLEAN_LIT;
                        break;
                }
                var ret1 = wrapLiteral(node, node, litType);
                return ret1;
            } else {
                return node;
            }
        },
        "Program": function (node) {
            var ret = instrumentScriptEntryExit(node, node.body);
            node.body = ret;

            scope = scope.parent;
            return node;
        },
        "VariableDeclaration": function (node) {
            var declarations = MAP(node.declarations, function (def) {
                if (def.init !== null) {
                    var init = wrapWrite(def.init, createLiteralAst(def.id.name), def.init, def.id, false, scope.isGlobal(def.id.name), true);
                    init = wrapWithX1(def.init, init);
                    if (def.id.trailingComments) {
                      if (def.id.trailingComments[0].value.trim() === "@taint") {
                        init = wrapWithTaint(def.init, def.id.name, init);
                      } else if (def.id.trailingComments[0].value.trim() === "@sink") {
                        init = wrapWithSink(def.init, def.id.name, init);
                      }
                    }
                    def.init = init;
                }
                return def;
            });
            node.declarations = declarations;
            return node;
        },
        "NewExpression": function (node) {
            var ret = {
                type: 'CallExpression',
                callee: instrumentCall(node, true),
                'arguments': node.arguments
            };
            transferLoc(ret, node);
            return ret;
//            var ret1 = wrapLiteral(node, ret, N_LOG_OBJECT_LIT);
//            return ret1;
        },
        "CallExpression": function (node) {
            var isEval = node.callee.type === 'Identifier' && node.callee.name === "eval";
            var callee = instrumentCall(node, false);
            node.callee = callee;
            if (isEval) {
                node.arguments = MAP(node.arguments, wrapEvalArg);
            }
            return node;
        },
        "AssignmentExpression": function (node) {
            var ret1;
            if (node.operator === "=") {
                ret1 = instrumentStore(node, false);
            } else {
                ret1 = instrumentLoadModStore(node);
            }
            return ret1;
        },
        "UpdateExpression": function (node) {
            var ret1;
            ret1 = instrumentPreIncDec(node);
            if (!node.prefix) {
                ret1 = adjustIncDec(node.operator, ret1);
            }
            return ret1;
        },
        "FunctionExpression": function (node, context) {
            if (!node.id || node.scope.vars[node.id.name] === 'var') {
                node.id = { type: 'Literal', name: mkFreshVar(), isSynthetic: true };
            }
            node.body.body = instrumentFunctionEntryExit(node, node.body.body);
            var ret1;
            if (context === astUtil.CONTEXT.GETTER || context === astUtil.CONTEXT.SETTER) {
                ret1 = node;
            } else {
                ret1 = wrapLiteral(node, node, N_LOG_FUNCTION_LIT);
            }
            scope = scope.parent;
            return ret1;
        },
        "FunctionDeclaration": function (node) {
            node.body.body = instrumentFunctionEntryExit(node, node.body.body);
            scope = scope.parent;
            return node;
        },
        "ObjectExpression": function (node) {
            return wrapLiteral(node, node, N_LOG_OBJECT_LIT);
        },
        "ArrayExpression": function (node) {
            return wrapLiteral(node, node, N_LOG_ARRAY_LIT);
        },
        'ThisExpression': function (node) {
            return wrapRead(node, createLiteralAst('this'), node, false, false, false);
        },
        'Identifier': function (node, context) {
            if (context === astUtil.CONTEXT.RHS) {
                return instrumentLoad(node, false);
            } else if (context === astUtil.CONTEXT.TYPEOF) {
                return instrumentLoad(node, true);
            }
            return node;
        },
        'MemberExpression': function (node, context) {
            if (context === astUtil.CONTEXT.RHS) {
                return instrumentLoad(node, false);
            }
            return node;
        },
        "SequenceExpression": function (node) {
            var i = 0, len = node.expressions.length;
            for (i = 0; i < len - 1 /* the last expression is the result, do not wrap that */; i++) {
                node.expressions[i] = wrapWithX1(node.expressions[i], node.expressions[i]);
            }
            return wrapSequenceExpression(node);
        },
        "ForInStatement": function (node) {
            node.right = wrapHash(node.right, node.right);
            return wrapForIn(node, node.left, node.right, node.body)
        },
        "LabeledStatement": function (node) {
            if (node.remove) {
                return node.body;
            }
            return node;
        },
        "TryStatement": function (node) {
            node.block.body = instrumentTryEnterExit(node, node.block.body);
            if (node.finalizer) {
                node.finalizer.body = instrumentCatchFinallyEnterExit(node, node.finalizer.body, logFinallyEnterFunName, logFinallyExitFunName);
            }

            return node;
        },
        "CatchClause": function (node) {
            var name;
            name = node.param.name;
            wrapCatchClause(node, node.body.body, name);
            node.body.body = instrumentCatchFinallyEnterExit(node, node.body.body, logCatchEnterFunName, logCatchExitFunName);
            scope = scope.parent;
            return node;
        },
        "ReturnStatement": function (node) {
            var ret = wrapReturn(node, node.argument);
            node.argument = wrapWithX1(node, ret);
            return node;
        },
        "ThrowStatement": function (node) {
            var ret = wrapThrow(node, node.argument);
            node.argument = wrapWithX1(node, ret);
            return node;
        },
        "ExpressionStatement": function (node) {
            node.expression = wrapWithX1(node, node.expression);
            return node;
        }
    };

    var visitorRRPostNoScriptWrapping = {
        Program: function (node) {
            scope = scope.parent;
            return node;
        }
    };
    for (var visitor in visitorRRPost) {
        if (visitor !== 'Program') {
            visitorRRPostNoScriptWrapping[visitor] = visitorRRPost[visitor];
        }
    }

    function funCond(node) {
        if (!node.test) {
            // If test is omitted (e.g., for(;;)) then change it to the literal true
            // such that the Jalangi conditional hook will be invoked.
            var literal = { type: 'Literal', value: true, raw: 'true' };
            node.test = wrapLiteral(literal, literal, N_LOG_BOOLEAN_LIT);
        }

        node.test = wrapConditional(node.test, node.type);
        node.test = wrapWithX1(node, node.test);
        node.init = wrapWithX1(node, node.init);
        node.update = wrapWithX1(node, node.update);
        if (node.body) {
            var bodyStmts;
            if (node.body.type === "BlockStatement") {
                bodyStmts = node.body.body;
            } else {
                bodyStmts = [node.body];
            }
            node.body = {
                type: "BlockStatement",
                body: instrumentLoopBodyEnterExit(node, bodyStmts, false)
            };
        }
        if (node.type === 'ConditionalExpression') {
            return wrapConditionalOuter(node);
        }
        return node;
    }

    var visitorOps = {
        "Program": function (node) {
            var body = wrapScriptBodyWithTryCatch(node, node.body);
//                var ret = prependScriptBody(node, body);
            node.body = body;

            return node;
        },
        'BinaryExpression': function (node) {
            var ret = wrapBinaryOp(node, node.left, node.right, node.operator);
            return ret;
        },
        'LogicalExpression': function (node) {
            var ret;
            if (node.operator === "&&") {
                ret = wrapLogicalAnd(node, node.left, node.right);
            } else if (node.operator === "||") {
                ret = wrapLogicalOr(node, node.left, node.right);
            }
            return ret;
        },
        'UnaryExpression': function (node) {
            var ret;
            if (node.operator === "void") {
                node.argument = wrapUnaryOp(node, node.argument, node.operator);
                return node;
            } else if (node.operator === "delete") {
                if (node.argument.object) {
                    ret = wrapBinaryOp(node, node.argument.object, getPropertyAsAst(node.argument), node.operator, node.argument.computed);
                } else {
                    return node;
                }
            } else {
                ret = wrapUnaryOp(node, node.argument, node.operator);
            }
            return ret;
        },
        "SwitchStatement": function (node) {
            var dis = wrapSwitchDiscriminant(node.discriminant, node.discriminant);
            dis = wrapWithX1(node.discriminant, dis);
            var cases = MAP(node.cases, function (acase) {
                var test;
                if (acase.test) {
                    test = wrapSwitchTest(acase.test, acase.test);
                    acase.test = wrapWithX1(acase.test, test);
                }
                return acase;
            });
            node.discriminant = dis;
            node.cases = cases;
            return node;
        },
        "FunctionExpression": function (node) {
            node.body.body = wrapFunBodyWithTryCatch(node, node.body.body);
            if (node.scope.strictMode) {
                node.body.body.unshift({
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'Literal',
                        value: 'use strict'
                    }
                });
            }
            return node;
        },
        "FunctionDeclaration": function (node) {
            node.body.body = wrapFunBodyWithTryCatch(node, node.body.body);
            if (node.scope.strictMode) {
                node.body.body.unshift({
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'Literal',
                        value: 'use strict'
                    }
                });
            }
            return node;
        },
        "WithStatement": function (node) {
            node.object = wrapWith(node.object);
            var result = replaceInStatement(
                "try { " + RP + "1 } finally { " + logWithExitFunName + "(); }",
                [node]
            );
            return result[0];
        },
        "ConditionalExpression": funCond,
        "IfStatement": funCond,
        "WhileStatement": funCond,
        "DoWhileStatement": funCond,
        "ForStatement": funCond
    };

    var visitorOpsNoScriptWrapping = {
        Program: function (node) {
            return node;
        }
    };
    for (var visitor in visitorOps) {
        if (visitor !== 'Program') {
            visitorOpsNoScriptWrapping[visitor] = visitorOps[visitor];
        }
    }

    function addScopes(ast) {
        function Scope(parent, isCatch) {
            this.vars = {};
            this.funLocs = {};
            this.funNodes = {};
            this.hasEval = false;
            this.hasArguments = false;
            this.parent = parent;
            this.isCatch = isCatch;
            this.strictMode = parent !== null && parent.strictMode;
        }

        Scope.prototype.addVar = function (name, type, loc, node) {
            var tmpScope = this;
            if (this.isCatch && type !== 'catch') {
                tmpScope = this.parent;
            }
            if (tmpScope.vars[name] !== 'arg') {
                tmpScope.vars[name] = type;
            }
            if (type === 'defun') {
                tmpScope.funLocs[name] = loc;
                tmpScope.funNodes[name] = node;
            }
        };

        Scope.prototype.hasOwnVar = function (name) {
            var s = this;
            if (s && HOP(s.vars, name))
                return s.vars[name];
            return null;
        };

        Scope.prototype.hasVar = function (name) {
            var s = this;
            while (s !== null) {
                if (HOP(s.vars, name))
                    return s.vars[name];
                s = s.parent;
            }
            return null;
        };

        Scope.prototype.isGlobal = function (name) {
            var s = this;
            while (s !== null) {
                if (HOP(s.vars, name) && s.parent !== null) {
                    return false;
                }
                s = s.parent;
            }
            return true;
        };

        Scope.prototype.addEval = function () {
            var s = this;
            while (s !== null) {
                s.hasEval = true;
                s = s.parent;
            }
        };

        Scope.prototype.addArguments = function () {
            var s = this;
            while (s !== null) {
                s.hasArguments = true;
                s = s.parent;
            }
        };

        Scope.prototype.usesEval = function () {
            return this.hasEval;
        };

        Scope.prototype.usesArguments = function () {
            return this.hasArguments;
        };


        var currentScope = null;

        // rename arguments to J$_arguments
        var fromName = 'arguments';
        var toName = JALANGI_VAR + "_arguments";

        function handleFun(node) {
            var oldScope = currentScope;
            currentScope = new Scope(currentScope);
            node.scope = currentScope;

            if (node.type === 'FunctionDeclaration') {
                var body = node.body.body;
                if (body.length > 0 && body[0].type === 'ExpressionStatement' &&
                        body[0].expression.type === 'Literal' &&
                        typeof body[0].expression.value === 'string' &&
                        body[0].expression.value.toLowerCase() === 'use strict') {
                    currentScope.strictMode = true;
                }
                oldScope.addVar(node.id.name, "defun", node.loc, node);
                MAP(node.params, function (param) {
                    if (param.name === fromName) {         // rename arguments to J$_arguments
                        param.name = toName;
                    }
                    currentScope.addVar(param.name, "arg");
                });
            } else if (node.type === 'FunctionExpression') {
                var body = node.body.body;
                if (body.length > 0 && body[0].type === 'ExpressionStatement' &&
                        body[0].expression.type === 'Literal' &&
                        typeof body[0].expression.value === 'string' &&
                        body[0].expression.value.toLowerCase() === 'use strict') {
                    currentScope.strictMode = true;
                }
                if (node.id !== null && !node.id.isSynthetic) {
                    currentScope.addVar(node.id.name, "lambda");
                }
                MAP(node.params, function (param) {
                    if (param.name === fromName) {         // rename arguments to J$_arguments
                        param.name = toName;
                    }
                    currentScope.addVar(param.name, "arg");
                });
            }
        }

        function handleVar(node) {
            currentScope.addVar(node.id.name, "var");
        }

        function handleCatch(node) {
            var oldScope = currentScope;
            currentScope = new Scope(currentScope, true);
            node.scope = currentScope;
            currentScope.addVar(node.param.name, "catch");
        }

        function popScope(node) {
            currentScope = currentScope.parent;
            return node;
        }

        var visitorPre = {
            'Program': handleFun,
            'FunctionDeclaration': handleFun,
            'FunctionExpression': handleFun,
            'ObjectExpression': function (node) {
                node.properties.some(function (property) {
                    if (property.kind === 'get' || property.kind === 'set') {
                        // We need a local variable for the object to call __defineGetter__/__defineSetter__
                        node.reference = mkFreshVar(currentScope);
                        return true;
                    }
                });
            },
            'VariableDeclarator': handleVar,
            'CatchClause': handleCatch
        };

        var visitorPost = {
            'Program': popScope,
            'FunctionDeclaration': popScope,
            'FunctionExpression': popScope,
            'CatchClause': popScope,
            'Identifier': function (node, context) {         // rename arguments to J$_arguments
                if (context === astUtil.CONTEXT.RHS && node.name === fromName && currentScope.hasOwnVar(toName)) {
                    node.name = toName;
                }
                return node;
            },
            "UpdateExpression": function (node) {         // rename arguments to J$_arguments
                if (node.argument.type === 'Identifier' && node.argument.name === fromName && currentScope.hasOwnVar(toName)) {
                    node.argument.name = toName;
                }
                return node;
            },
            "AssignmentExpression": function (node) {         // rename arguments to J$_arguments
                if (node.left.type === 'Identifier' && node.left.name === fromName && currentScope.hasOwnVar(toName)) {
                    node.left.name = toName;
                }
                return node;
            }

        };
        astUtil.transformAst(ast, visitorPost, visitorPre);
    }

    // START of Liang Gong's AST post-processor
    function hoistFunctionDeclaration(ast, hoisteredFunctions) {
        var key, child, startIndex = 0;
        if (ast.body) {
            var newBody = [];
            if (ast.body.length > 0) { // do not hoister function declaration before J$.Fe or J$.Se
                if (ast.body[0].type === 'ExpressionStatement') {
                    if (ast.body[0].expression.type === 'CallExpression') {
                        if (ast.body[0].expression.callee.object &&
                            ast.body[0].expression.callee.object.name === 'J$'
                            && ast.body[0].expression.callee.property
                            &&
                            (ast.body[0].expression.callee.property.name === 'Se' || ast.body[0].
                                expression.callee.property.name === 'Fe')) {

                            newBody.push(ast.body[0]);
                            startIndex = 1;
                        }
                    }
                }
            }
            for (var i = startIndex; i < ast.body.length; i++) {
                if (ast.body[i].type === 'FunctionDeclaration') {
                    var name = ast.body[i].id.name;
                    var params = ast.body[i].params.map(function (param) { return param.name; }).join(', ');
                    var assignStmt;
                    if (ast.body[i].body === null) {
                        assignStmt = acorn.parse(
                            "var " + name + " = function " + (ast.body[i].reference || name) + "(" + params + ") {}").body;
                    } else {
                        assignStmt = replaceInStatement(
                            "var " + name + " = function " + (ast.body[i].reference || name) + "(" + params + ") { " + RP + "1 }",
                            ast.body[i].body.body);
                    }
                    newBody.push(assignStmt[0]);
                    if (newBody.length !== i + 1) {
                        hoisteredFunctions.push(ast.body[i].id.name);
                    }
                }
            }
            for (var i = startIndex; i < ast.body.length; i++) {
                if (ast.body[i].type !== 'FunctionDeclaration') {
                    newBody.push(ast.body[i]);
                }
            }
            while (ast.body.length > 0) {
                ast.body.pop();
            }
            Array.prototype.push.apply(ast.body, newBody);
        }
        for (key in ast) {
            if (ast.hasOwnProperty(key)) {
                child = ast[key];
                if (typeof child === 'object' && child !== null && key !== "scope") {
                    hoistFunctionDeclaration(child, hoisteredFunctions);
                }

            }
        }

        return ast;
    }

    // END of Liang Gong's AST post-processor

    function transformString(code, visitorsPost, visitorsPre) {
//         StatCollector.resumeTimer("parse");
//        console.time("parse")
      //        var newAst = esprima.parse(code, {loc:true, range:true});
      // var comments = [], tokens = [];
      // var newAst = acorn.parse(code, { allowReturnOutsideFunction: true, locations: true, ranges: true,
      //                                  onComments: comments, onToken: tokens, ecmaVersion: 6 });
        var estraverse = require('estraverse');
        var comments = [], tokens = [];
        var newAst = acorn.parse(code, {locations: true, ranges: true, onComment: comments, onToken: tokens, ecmaVersion: 6 });
        estraverse.attachComments(newAst, comments, tokens);

//        console.timeEnd("parse")
//        StatCollector.suspendTimer("parse");
//        StatCollector.resumeTimer("transform");
//        console.time("transform")
        addScopes(newAst);
        var len = visitorsPost.length;
        for (var i = 0; i < len; i++) {
            newAst = astUtil.transformAst(newAst, visitorsPost[i], visitorsPre[i], astUtil.CONTEXT.RHS);
        }
//        console.timeEnd("transform")
//        StatCollector.suspendTimer("transform");
//        console.log(JSON.stringify(newAst,null,"  "));
        return newAst;
    }

    // if this string is discovered inside code passed to instrumentCode(),
    // the code will not be instrumented
    var noInstr = "// JALANGI DO NOT INSTRUMENT";

    function initializeIIDCounters(forEval) {
        var adj = forEval ? IID_INC_STEP / 2 : 0;
        condIid = IID_INC_STEP + adj + 0;
        memIid = IID_INC_STEP + adj + 1;
        opIid = IID_INC_STEP + adj + 2;
    }


    function instrumentEvalCode(code, iid, isDirect) {
        var iids = sandbox.smap[sandbox.sid];
        return instrumentCode({
            code: code,
            thisIid: iid,
            isEval: true,
            inlineSourceMap: true,
            inlineSource: true,
            isDirect: isDirect,
            instCodeFileName: iids.instrumentedCodeFileName,
            origCodeFileName: iids.originalCodeFileName
        }).code;
    }

    function removeShebang(code) {
        if (code.indexOf("#!") == 0) {
            return code.substring(code.indexOf("\n") + 1);
        }
        return code;
    }

    /**
     * Instruments the provided code.
     *
     * @param {{isEval: boolean, code: string, thisIid: int, origCodeFileName: string, instCodeFileName: string, inlineSourceMap: boolean, inlineSource: boolean, url: string, isDirect: boolean }} options
     * @return {{code:string, instAST: object, sourceMapObject: object, sourceMapString: string}}
     *
     */
    function instrumentCode(options) {
        var aret, skip = false;
        var isEval = options.isEval,
            code = options.code, thisIid = options.thisIid, inlineSource = options.inlineSource, url = options.url;

        iidSourceInfo = { /*code: options.code*/ };
        initializeIIDCounters(isEval);

        if (options.isEval) {
            instCodeFileName = (options.isDirect ? "eval": "evalIndirect") + "(" + options.instCodeFileName + ")";
            origCodeFileName = (options.isDirect ? "eval": "evalIndirect") + "(" + options.origCodeFileName + ")";
        } else {
            instCodeFileName = options.instCodeFileName ? options.instCodeFileName : (options.isDirect?"eval":"evalIndirect");
            origCodeFileName = options.origCodeFileName ? options.origCodeFileName : (options.isDirect?"eval":"evalIndirect");
        }

        if (sandbox.analysis && sandbox.analysis.instrumentCodePre) {
            aret = sandbox.analysis.instrumentCodePre(thisIid, code, options.isDirect);
            if (aret) {
                code = aret.code;
                skip = aret.skip;
            }
        }

        if (!skip && typeof code === 'string' && code.indexOf(noInstr) < 0) {
            try {
                code = removeShebang(code);
                iidSourceInfo = { /*code: options.code*/ };
                var newAst;
                if (Config.ENABLE_SAMPLING) {
                    newAst = transformString(code, [visitorCloneBodyPre, visitorRRPost, visitorOps, visitorMergeBodyPre], [undefined, visitorRRPre, undefined, undefined]);
                } else if (options.skipWrappingOfScript) {
                    newAst = transformString(code, [visitorRRPostNoScriptWrapping, visitorOpsNoScriptWrapping], [visitorRRPre, undefined]);
                } else {
                    newAst = transformString(code, [visitorRRPost, visitorOps], [visitorRRPre, undefined]);
                }
                // post-process AST to hoist function declarations (required for Firefox)
                var hoistedFcts = [];
                newAst = hoistFunctionDeclaration(newAst, hoistedFcts);
                var newCode = esotope.generate(newAst, {comment: true});
                code = newCode + "\n" + noInstr + "\n";
            } catch(ex) {
                console.log("Failed to instrument", code);
                throw ex;
            }
        }

        var tmp = {};

        tmp.nBranches = iidSourceInfo.nBranches = (condIid / IID_INC_STEP - 1) * 2;
        tmp.originalCodeFileName = iidSourceInfo.originalCodeFileName = origCodeFileName;
        tmp.instrumentedCodeFileName = iidSourceInfo.instrumentedCodeFileName = instCodeFileName;
        if (url) {
            tmp.url = iidSourceInfo.url = url;
        }
        if (isEval) {
            tmp.evalSid = iidSourceInfo.evalSid = sandbox.sid;
            tmp.evalIid = iidSourceInfo.evalIid = thisIid;
        }
        if (inlineSource) {
            tmp.code = iidSourceInfo.code = options.code;
        }

        var prepend = JSON.stringify(iidSourceInfo);
        var instCode;
        if (options.inlineSourceMap) {
            instCode = JALANGI_VAR + ".iids = " + prepend + ";\n" + code;
        } else {
            instCode = JALANGI_VAR + ".iids = " + JSON.stringify(tmp) + ";\n" + code;
        }

        if (isEval && sandbox.analysis && sandbox.analysis.instrumentCode) {
            aret = sandbox.analysis.instrumentCode(thisIid, instCode, newAst, options.isDirect);
            if (aret) {
                instCode = aret.result;
            }
        }

        return {code: instCode, instAST: newAst, sourceMapObject: iidSourceInfo, sourceMapString: prepend};

    }

    /*
    function testFunctionIid(loc) {
        extractFunctionBodyFromSource(iidSourceInfo.code, {
            col: { start: loc[1]-1, end: loc[3]-1 },
            line: { start: loc[0]-1, end: loc[2]-1 }
        });
    }

    function extractFunctionBodyFromSource(source, loc) {
        var startOffset = nthIndex(source, "\n", loc.line.start) + loc.col.start;
        var endOffset = nthIndex(source, "\n", loc.line.end) + loc.col.end;

        var code = source.substring(startOffset, endOffset + 1); // +1 because offset is exclusive

        var bodyStart = code.indexOf("{") + 1;
        var bodyEnd = code.lastIndexOf("}");

        var result = code.substring(bodyStart, bodyEnd);

        try {
            acorn.parse(result, { allowReturnOutsideFunction: true });
        } catch (e) {
            console.log('Incorrect IID for function literal', code);
        }
    }

    function getStackTrace() {
        var obj = {};
        Error.captureStackTrace(obj, getStackTrace);
        return obj.stack;
    }

    function nthIndex(str, pat, n){
        var L= str.length, i= -1;
        while(n-- && i++<L){
            i= str.indexOf(pat, i);
            if (i < 0) break;
        }
        return i;
    }
    */

    sandbox.instrumentCode = instrumentCode;
    sandbox.instrumentEvalCode = instrumentEvalCode;

}(J$));


// exports J$.instrumentCode
// exports J$.instrumentEvalCode
// depends on acorn
// depends on esotope
// depends on J$.Constants
// depends on J$.Config
// depends on J$.astUtil
