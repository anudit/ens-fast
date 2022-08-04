"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_fastify = __toESM(require("fastify"));
var import_helmet = __toESM(require("@fastify/helmet"));
var import_compress = __toESM(require("@fastify/compress"));
var import_cors = __toESM(require("@fastify/cors"));
var import_caching = __toESM(require("@fastify/caching"));
var import_fs = require("fs");
var import_path = __toESM(require("path"));
"strict";
var server = (0, import_fastify.default)({ logger: false });
var bfj = require("bfj");
var MegaHash = require("megahash");
server.register(import_helmet.default, { global: true }).register(import_compress.default, { global: true }).register(import_cors.default, { origin: "*" }).register(
  import_caching.default,
  { privacy: import_caching.default.privacy.PUBLIC }
);
var hashTable = new MegaHash();
var hashTableCompiled = false;
server.get("/resolve/ens/:ensName", async (req, reply) => {
  const { ensName } = req.params;
  const resp = hashTable.get(ensName);
  if (!resp) {
    return reply.send({
      success: false
    });
  } else {
    return reply.send({
      address: resp
    });
  }
});
server.get("/", async (req, reply) => {
  return reply.send({ ...hashTable.stats(), hashTableCompiled });
});
async function erecto() {
  server.listen({ port: parseInt(process.env.PORT) || 3002, host: "0.0.0.0" }, (err, address) => {
    if (!err)
      console.log("\u{1F680} Server is listening on", address);
    else
      throw err;
  });
  console.time("Compiled HashTable");
  console.log("Compiling HashTable");
  const emitter = bfj.walk((0, import_fs.createReadStream)(import_path.default.join(__dirname, "../data/ensToAdd.json")), { encoding: "utf8", flag: "r" });
  let lastEnsName = "";
  emitter.on(bfj.events.property, (name) => {
    lastEnsName = name;
  });
  emitter.on(bfj.events.string, (value) => {
    hashTable.set(lastEnsName, value);
  });
  emitter.on(bfj.events.end, () => {
    console.timeEnd("Compiled HashTable");
    hashTableCompiled = true;
    console.log(hashTable.stats());
  });
}
__name(erecto, "erecto");
erecto();
