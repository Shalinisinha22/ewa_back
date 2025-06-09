const mongoose = require('mongoose');

const productTypeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

const ProductType = mongoose.model('ProductType', productTypeSchema);

module.exports = ProductType;