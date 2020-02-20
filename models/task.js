const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Task', taskSchema, 'tasks');