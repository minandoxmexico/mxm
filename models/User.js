var Document = require('camo').Document;
// var md5 = require("blueimp-md5")
// var uuid = require('node-uuid')
// var slug = require('slug')

Workshift = require('./Workshift.js')
class User extends Document {
  constructor() {
      super();

      this.username = {
        type: String,
        required: false,
        unique: false
      }

      this.totalTime = {
        type: Number,
        required: true,
        default: 0
      }

      this.totalHashes = {
        type: Number,
        required: true,
        default: 0
      }

      this.maxSessionTime = {
        type: Number,
        required: true,
        default: 0
      }

      this.maxSessionHashes = {
        type: Number,
        required: true,
        default: 0
      }

      this.maxHashesPerSecond = {
        type: Number,
        required: true,
        default: 0
      }

    // static collectionName() {
    //     return 'users';
    // }
  }


  // preValidate (){
  //   if(!this.username){
  //     this.username = this._id
  //   }
  // }
}
module.exports = User

