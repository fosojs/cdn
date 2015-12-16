'use strict';

module.exports = function(stream) {
  return new Promise(function(resolve, reject) {
    stream.setEncoding('utf8');
    let file = '';
    stream.on('data', chunk => file += chunk);
    stream.on('end', () => resolve(file));
    stream.on('error', reject);
  });
};
