/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

"use strict";
/**
 * Proxy to call services using an asynchronous JSON-RPC transport.
 *
 * @name caf_jsonrpc/proxy_jsonrpc
 * @namespace
 * @augments gen_proxy
 *
 */


var caf = require('caf_core');
var genProxy = caf.gen_proxy;
var json_rpc = caf.json_rpc;
var request = require('request');


/**
 * Factory method to create a proxy to call services using an asynchronous
 *  JSON-RPC transport.
 *
 *
 * @see sup_main
 */
exports.newInstance = function(context, spec, secrets, cb) {

    var that = genProxy.constructor(spec, secrets);

    var services = (spec && spec.env) || {};

    var proxy =  (spec && spec.env && spec.env.proxy);

    /**
     * Invokes a service using an asynchronous JSON-RPC transport.
     *
     * @param {string} serviceName The name of the service.
     * @param {string} method The name of the method.
     * @param {Array.<Object>} args An array of JSON serializable arguments.
     * @param {caf.cb} cb The callback to return service call results/errors.
     *
     * @name caf_jsonrpc/proxy_jsonrpc#invoke
     * @function
     *
     */
    that.invoke = function(serviceName, method, args, cb) {
        var req = {
            'jsonrpc': '2.0',
            'method' : method,
            'params' : args,
            'id': json_rpc.randomId()
        };
        var url = services[serviceName] && services[serviceName].url;

        if (!url) {
            cb("Cannot find the service " + serviceName);
        } else {
            var config = {url: url,
                          json: true,
                          body: JSON.stringify(req),
                          method: 'POST'
                         };
            if (proxy) {
                config.proxy = proxy;
            }
            request(config,
                    function(error, response, body) {
                        if (error) {
                            cb(error);
                        } else {
                            // body is JSON-parsed response
                            if ((body.jsonrpc === '2.0') &&
                                (body.id === req.id)) {
                                if (body.error) {
                                    // TODO: separate system vs app error
                                    cb(body.error);
                                } else {
                                    cb(null, body.result);
                                }

                            } else {
                                cb("Invalid response " + response);
                            }
                        }
                    });
        }
    };


    Object.freeze(that);
    cb(null, that);
};
