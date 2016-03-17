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

/*jslint node: true browser: true */
/*global astUtil acorn esotope J$ */

//var StatCollector = require('../utils/StatCollector');
if (typeof J$ === 'undefined') {
    J$ = {};
}


(function (sandbox) {
    acorn = require("acorn");
    esotope = require("esotope");
    require('../headers').headerSources.forEach(function (header) {
        require("./../../../" + header);
    });

    var proxy = require("rewriting-proxy");
    var instUtil = require("../instrument/instUtil");
    instUtil.setHeaders();
    var fs = require('fs');
    var path = require('path');
    var md5 = require('./md5');

    var instrumentCode = sandbox.instrumentCode;
    var FILESUFFIX1 = "_jalangi_";
    var EXTRA_SCRIPTS_DIR = "__jalangi_extra";
    var outDir, inlineIID, inlineSource, url;


    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };

    //***************************
    // Node.js specific stuff
    //***************************

    function sanitizePath(path) {
        if (typeof process !== 'undefined' && process.platform === "win32") {
            return path.split("\\").join("\\\\");
        }
        return path;
    }

    function makeInstCodeFileName(name) {
        return name.replace(/.js$/, FILESUFFIX1 + ".js").replace(/.html$/, FILESUFFIX1 + ".html");
    }

    function makeSMapFileName(name) {
        return name.replace(/.js$/, ".json");
    }


    function createOrigScriptFilename(name) {
        return name.replace(new RegExp(".js$"), "_orig_.js");
    }



    function rewriteInlineScript(astHandler) {
        return function (src, metadata) {
            //var instname = instUtil.createFilenameForScript(metadata.url);
            //var origname = createOrigScriptFilename(instname);

            var origname = md5(src)+".js";
            var instname = makeInstCodeFileName(origname), instCodeAndData;

            try {
                // If the rewriting-proxy module provides location info for the inline script,
                // then include it at runtime (by default disabled, but can be enabled by the
                // nodeVisitorModule, by setting exports.locationInfo = true).
                var sourceInfoExtension = null;
                if (metadata && metadata.node && metadata.node.__location) {
                    var location = metadata.node.__location;
                    sourceInfoExtension = { location: { line: location.line, col: location.col } };
                }
                instCodeAndData = instrumentCode(
                    {
                        applyASTHandler: function (instCodeAndData) {
                            instUtil.applyASTHandler(instCodeAndData, astHandler, sandbox, metadata);
                        },
                        code: src,
                        isEval: false,
                        origCodeFileName: sanitizePath(origname),
                        instCodeFileName: sanitizePath(instname),
                        inlineSourceMap: inlineIID,
                        inlineSource: inlineSource,
                        sourceInfoExtension: sourceInfoExtension,
                        url: url
                    });
            } catch (e) {
                console.error('Failure during inline script instrumentation:', e.message + ' (' + e.name + ').');
                console.error('Source:', src);
                console.error('Metadata:', metadata);
                throw e;
            }
            fs.writeFileSync(path.join(outDir, origname), src, "utf8");
            fs.writeFileSync(makeSMapFileName(path.join(outDir, instname)), instCodeAndData.sourceMapString, "utf8");
            fs.writeFileSync(path.join(outDir, instname), instCodeAndData.code, "utf8");
            return instCodeAndData.code;
        }
    }

    function getJalangiRoot() {
        return path.join(__dirname, '../../..');
    }

    function instrumentFile() {
        var argparse = require('argparse');
        var parser = new argparse.ArgumentParser({
            addHelp: true,
            description: "Command-line utility to perform instrumentation"
        });
        parser.addArgument(['--inlineIID'], {help: "Inline IID to (beginLineNo, beginColNo, endLineNo, endColNo) in J$.iids in the instrumented file", action: 'storeTrue'});
        parser.addArgument(['--inlineSource'], {help: "Inline original source as string in J$.iids.code in the instrumented file", action: 'storeTrue'});
        parser.addArgument(['--initParam'], { help: "initialization parameter for analysis, specified as key:value", action:'append'});
        parser.addArgument(['--noResultsGUI'], { help: "disable insertion of results GUI code in HTML", action:'storeTrue'});
        parser.addArgument(['--cdn'], {help: "CDN URL from which to serve analysis (rather than inlining)"});
        parser.addArgument(['--astHandlerModule'], {help: "Path to a node module that exports a function to be used for additional AST handling after instrumentation"});
        parser.addArgument(['--nodeVisitorModule'], {help: "Path to a node module that exports a function to be used for additional HTML node handling after instrumentation"});
        parser.addArgument(['--outDir'], {
            help: "Directory containing scripts inlined in html",
            defaultValue: process.cwd()
        });
        parser.addArgument(['--out'], {
            help: "Instrumented file name (with path).  The default is to append _jalangi_ to the original JS file name",
            defaultValue: undefined
        });
        parser.addArgument(['--url'], {
            help: "URL of the file to be instrumented.  The URL is stored as metadata in the source map and is not used for retrieving the file.",
            defaultValue: undefined
        });
        parser.addArgument(['--extra_app_scripts'], {help: "list of extra application scripts to be injected and instrumented, separated by path.delimiter"});
        parser.addArgument(['--analysis'], {
            help: "Analysis script.",
            action: "append"
        });

        parser.addArgument(['file'], {
            help: "file to instrument",
            nargs: 1
        });
        var args = parser.parseArgs();

        var cdn = null;
        if (args.cdn) {
            cdn = args.cdn;
            if (cdn[cdn.length-1] === '/') {
                cdn = cdn.substring(0, cdn.length-1);
            }
        }
        var astHandler = null;
        if (args.astHandlerModule) {
            astHandler = require(args.astHandlerModule);
        }
        var nodeVisitor = {};
        if (args.nodeVisitorModule) {
            nodeVisitor = require(args.nodeVisitorModule);
        }

        var initParams = args.initParam;
        inlineIID = args.inlineIID;
        inlineSource = args.inlineSource;
        outDir = args.outDir;
        url = args.url;

        var analyses = args.analysis;
        var extraAppScripts = [];
        if (args.extra_app_scripts) {
            extraAppScripts = args.extra_app_scripts.split(path.delimiter);
        }

        if (args.file.length === 0) {
            console.error("must provide file to instrument");
            process.exit(1);
        }

        var fileName = args.file[0];
        var instFileName = args.out ? args.out : makeInstCodeFileName(fileName);

        var origCode = fs.readFileSync(fileName, "utf8");
        var instCodeAndData, instCode;

        var inlineRewriter = rewriteInlineScript(astHandler);
        if (fileName.endsWith(".js")) {
            var metadata = {
                type: 'script',
                inline: false,
                url: fileName
            };

            try {
                instCodeAndData = instrumentCode(
                    {
                        applyASTHandler: function (instCodeAndData) {
                            instUtil.applyASTHandler(instCodeAndData, astHandler, sandbox, metadata);
                        },
                        code: origCode,
                        isEval: false,
                        origCodeFileName: sanitizePath(fileName),
                        instCodeFileName: sanitizePath(instFileName),
                        inlineSourceMap: inlineIID,
                        inlineSource: inlineSource,
                        url: url
                    });
                fs.writeFileSync(makeSMapFileName(instFileName), instCodeAndData.sourceMapString, "utf8");
                fs.writeFileSync(instFileName, instCodeAndData.code, "utf8");
            } catch (e) {
                if (e.name === 'SyntaxError') {
                    console.error('SyntaxError:', fileName);
                    fs.writeFileSync(instFileName, origCode, "utf8");
                } else {
                    console.error('Failure during external script instrumentation:', e.message + ' (' + e.name + ').');
                    console.error('Source:', origCode);
                    console.error('Metadata:', metadata);
                    throw e;
                }
            }
        } else {
            // HTML will never be instrumented online, so it is safe to use require here!
            var parse5 = require('parse5');

            try {
                var jalangiRoot = getJalangiRoot();
                var options = {
                    onNodeVisited: function (node) {
                        var newNode;

                        if (nodeVisitor.visitor) {
                            nodeVisitor.visitor(node);
                        }

                        switch (node.tagName) {
                            case 'head':
                                var fragment = parse5.parseFragment(
                                    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
                                    instUtil.getInlinedScripts(analyses, initParams, extraAppScripts, EXTRA_SCRIPTS_DIR, jalangiRoot, cdn)
                                );
                                Array.prototype.unshift.apply(node.childNodes, fragment.childNodes);
                                break;

                            case 'body':
                                if (!args.noResultsGUI) {
                                    var fragment = parse5.parseFragment(instUtil.getFooterString(jalangiRoot));
                                    Array.prototype.push.apply(node.childNodes, fragment.childNodes);
                                }
                                break;
                        }
                    },
                    locationInfo: nodeVisitor.locationInfo
                };

                instCode = proxy.rewriteHTML(origCode, "http://foo.com", inlineRewriter, null, null, options);
                fs.writeFileSync(instFileName, instCode, "utf8");
            } catch (e) {
                console.error('Failure during HTML instrumentation:', e.message + ' (' + e.name + ').');
                console.error('Source:', origCode);
                throw e;
            }
        }
    }


    if (typeof window === 'undefined' && (typeof require !== "undefined") && require.main === module) {
        instrumentFile();
    }
}(J$));


// depends on J$.instrumentCode

