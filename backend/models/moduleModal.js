const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    active: {
      type: Boolean,
      default: true
    },
    image: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Module', moduleSchema);
