/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var commandLineArgs = require('command-line-args')
var container = require('rhea');


const optionDefinitions = [
  { name: 'node', alias: 'n', type: String },
  { name: 'host', alias: 'h', type: String },
  { name: 'port', alias: 'p', type: Number },
  { name: 'connections', alias: 'c', type: Number, defaultOption: 1},
];
var args = commandLineArgs(optionDefinitions);

container.on('connection_open', function (context) {
    context.connection.open_receiver(args.node);
    context.connection.open_sender(args.node);
});

container.on('message', function (context) {
    console.log(context.message);
});


container.on('sendable', function (context) {
    while (context.sender.sendable()) {
        context.sender.send({
            message_id: container.generate_uuid()});
    }
});

console.log('starting connections: ' + args.connections);
for (var i = 0; i < args.connections; i++) {
    container.connect({port: args.port, host: args.host, rejectUnauthorized: false, username: 'guest', password: 'guest', transport:'tls'});
}

