var EmbeddedDocument = require('camo').EmbeddedDocument;

class Workshift extends EmbeddedDocument {
  constructor() {
    super();

    this.maxHashesPerSecond = {
        type: Number,
        default: 0
    };


    this.totalHashes = {
        type: Number,
        default: 0
    };
  }
}
module.exports = Workshift
