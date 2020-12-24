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
    {name: 'node', alias: 'n', type: String},
    {name: 'host', alias: 'h', type: String},
    {name: 'port', alias: 'p', type: Number},
    {name: 'connections', alias: 'c', type: Number, defaultValue: 1},
    {name: 'sendContinually', alias: 's', type: Boolean, defaultValue: false},
];
var args = commandLineArgs(optionDefinitions);


var numMessagesSent = 0;
var numMessagesReceived = 0;
var openConnections = new Set();
var numErrors = 0;


setInterval(() => {
    console.log("Messages sent: " + numMessagesSent + " messages received: " + numMessagesReceived + " connections: " + openConnections.size + " errors: " + numErrors)
}, 10000);

console.log('starting connections: ' + args.connections);

function createSendReceiverWorker() {
    console.log('createSendReceiverWorker');
    if (openConnections.size >= (args.connections -1)) {
        return
    }

    var ctn = container.create_container();
    ctn.connect({
        port: args.port,
        host: args.host,
        rejectUnauthorized: false,
        username: 'guest',
        password: 'guest',
        transport: 'tls'
    });

    ctn.on('connection_open', function (context) {
        context.connection.open_receiver(args.node);
        context.connection.open_sender(args.node);
        openConnections.add(context.connection)
        createSendReceiverWorker();
    });

    // ctn.on('connection_close', function (context) {
    //     console.log("connection_close")
    //     numConnections -= 1;
    //     createSendReceiverWorker();
    // });

    ctn.on('disconnected', function (context) {
        console.log("disconnected : " + context.reconnecting)
        if (!context.reconnecting) {
            openConnections.delete(context.connection)
            createSendReceiverWorker();
        }
    });

    ctn.on('message', function (context) {
        //console.log(context.message);
        numMessagesReceived += 1;
    });

    ctn.on('error', function (error) {
        console.log(error);
        numErrors += 1;
    });

    ctn.on('sendable', function (context) {
        if (args.sendContinually) {
            while (context.sender.sendable()) {
                context.sender.send({
                    message_id: ctn.generate_uuid()
                });
                numMessagesSent += 1;
            }
        }
    });

    ctn.on('sender_open', function (context) {
        if (!args.sendContinually) {
            setInterval(() => {
                if (context.sender.sendable()) {
                    context.sender.send({
                        message_id: ctn.generate_uuid()
                    });
                    numMessagesSent += 1;
                }
            }, 10000);
        }
    });
    return ctn;
}

createSendReceiverWorker();

