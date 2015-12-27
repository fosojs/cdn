'use strict';

const util = require('util');
const fs = require('fs');
const yamlOrJSON = require('yaml-or-json');
const convict = require('convict');

let config = convict({
  env: {
    doc: 'The applicaton environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  host: {
    doc: 'The host name of the cdn server',
    format: String,
    default: '',
    env: 'CDN_HOST'
  },
  port: {
    doc: 'The port to bind',
    format: 'port',
    default: 9595,
    env: 'PORT'
  },
  ip: {
    doc: 'The IP address to bind.',
    format: '*',
    default: '127.0.0.1',
    env: 'IP'
  },
  storagePath: {
    doc: 'The path to the cache folder.',
    format: String,
    default: './.cdn-cache',
    env: 'STORAGE_PATH'
  },
  registry: {
    url: {
      default: 'http://registry.npmjs.org/',
    },
  },
  mongodb: {
    address: {
      doc: 'MongoDB address.',
      default: 'localhost',
      env: 'MONGO_PORT_27017_TCP_ADDR'
    },
    port: {
      doc: 'MongoDB port.',
      format: 'port',
      default: '27017',
      env: 'MONGO_PORT_27017_TCP_PORT'
    },
    name: {
      doc: 'MongoDB DB name.',
      default: 'sitegate-registry-dev'
    }
  },
});

let env = config.get('env');
let filePath = __dirname + '/env/' + env;
let configFile;
try {
  configFile = yamlOrJSON(filePath) || {};
} catch (err) {
  configFile = {};
}

config.load(configFile);

// Adding the calculated values
config.load({
  mongodbUrl: util.format(
    'mongodb://%s:%s/%s',
    config.get('mongodb.address'),
    config.get('mongodb.port'),
    config.get('mongodb.name')
  ),
});

config.validate();

module.exports = config;
