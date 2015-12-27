'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let RegistrySchema = new Schema({
  name: {
    type: String,
    trim: true,
    unique: 'The registry name has to be unique',
    required: 'The registry name is required',
    default: '',
  },
  url: {
    type: String,
    trim: true,
    unique: 'The registry URL has to be unique',
    required: 'The registry URL is required',
    default: '',
  },
  token: {
    type: String,
    trim: true,
    default: ''
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  ownerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
});

RegistrySchema.set('toJSON', {
  transform(doc, ret, options) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = function(connection) {
  return connection.model('Registry', RegistrySchema);
};
