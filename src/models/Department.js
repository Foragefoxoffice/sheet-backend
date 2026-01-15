import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Department name is required'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const Department = mongoose.model('Department', departmentSchema);

export default Department;
