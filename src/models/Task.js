import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
    {
        sno: {
            type: Number,
            unique: true,
        },
        task: {
            type: String,
            required: [true, 'Task description is required'],
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        createdByEmail: {
            type: String,
            required: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        assignedToName: {
            type: String,
            required: true,
        },
        assignedToEmail: {
            type: String,
            required: true,
        },
        priority: {
            type: String,
            enum: ['High', 'Medium', 'Low'],
            default: 'Medium',
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Completed'],
            default: 'Pending',
        },
        dueDate: {
            type: Date,
            required: true,
        },
        notes: {
            type: String,
            default: '',
        },
        approvalStatus: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        approvedAt: {
            type: Date,
        },
        approvalComments: {
            type: String,
            default: '',
        },
        isSelfTask: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-increment sno
taskSchema.pre('save', async function (next) {
    if (!this.isNew) {
        return next();
    }

    try {
        const lastTask = await this.constructor.findOne().sort({ sno: -1 });
        this.sno = lastTask ? lastTask.sno + 1 : 1;
        next();
    } catch (error) {
        next(error);
    }
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
