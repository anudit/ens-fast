'strict'

import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
const server: FastifyInstance = fastify({ logger: false })

import helmet from '@fastify/helmet'
import compress from '@fastify/compress'
import cors from '@fastify/cors'
import fastifyCaching from '@fastify/caching'

import { readFileSync, createReadStream } from 'fs';
import path from 'path';
import { Dictionary } from "./types";
const bfj =  require('bfj');
const MegaHash = require('megahash');

// import {  } from './types';

server.register(helmet, { global: true })
    .register(compress, { global: true })
    .register(cors, { origin: "*" })
    .register(
        fastifyCaching,
        {privacy: fastifyCaching.privacy.PUBLIC}
    )

const hashTable = new MegaHash();

server.get('/resolve/ens/:ensName', async (req: FastifyRequest, reply: FastifyReply) => {
    const {ensName} = req.params as {ensName: string};
    const resp = hashTable.get(ensName);
    if (!resp){
        return reply.send({
            success: false,
        })
    }
    else {
        return reply.send({
            address: resp
        })
    }
})

server.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    return reply.send({'hello': 'world'});
})

async function erecto(){

    console.time('Compiled HashTable');
    console.log('Compiling HashTable');

    const emitter = bfj.walk(createReadStream(path.join(__dirname, '../../data/ensToAdd.json')), {encoding:'utf8', flag:'r'});

    let lastEnsName = '';
    emitter.on(bfj.events.property, (name: string) => {
        lastEnsName = name;
    });
    emitter.on(bfj.events.string, (value: string) => {
        hashTable.set(lastEnsName, value);
    });
    emitter.on(bfj.events.end, () => {
        console.timeEnd('Compiled HashTable');
        console.log(hashTable.stats());
        console.log('Starting Server');
        server.listen({ port: parseInt(process.env.PORT as string) || 3002, host: "0.0.0.0" }, (err, address)=>{
            if (!err) console.log('🚀 Server is listening on', address);
            else throw err;
        });
    });

}

erecto();
