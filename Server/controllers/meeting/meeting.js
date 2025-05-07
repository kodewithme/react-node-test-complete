const MeetingHistory = require('../../model/schema/meeting')
const mongoose = require('mongoose');

const add = async (req, res) => {
    try {
        const { agenda, related, location, notes, dateTime, createBy } = req.body;
        const meetingData = { agenda, related, location, notes, dateTime, createBy };
        const result = new MeetingHistory(meetingData);
        await result.save();
        res.status(200).json(result);
    } catch (err) {
        console.error('Failed to create meeting:', err);
        res.status(400).json({ error: 'Failed to create meeting : ', err });
    }
}

const index = async (req, res) => {
    const query = req.query
    query.deleted = false;
    let result = await MeetingHistory.aggregate([
        { $match: query },
        {
            $lookup: {
                from: 'User',
                localField: 'createBy',
                foreignField: '_id',
                as: 'users'
            }
        },
        { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
            }
        },
    ])

    res.status(200).json(result);
}

const view = async (req, res) => {

    try {
        let response = await MeetingHistory.findOne({ _id: req.params.id })
        if (!response) return res.status(404).json({ message: "no Data Found." })
        let result = await MeetingHistory.aggregate([
            { $match: { _id: response._id } },
            {
                $lookup: {
                    from: 'User',
                    localField: 'createBy',
                    foreignField: '_id',
                    as: 'users'
                }
            },
            { $unwind: { path: '$users', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    createdByName: { $concat: ['$users.firstName', ' ', '$users.lastName'] },
                }
            },
            { $project: { contact: 0, users: 0, Lead: 0 } },
        ])
        res.status(200).json(result[0]);

    } catch (err) {
        console.log('Error:', err);
        res.status(400).json({ Error: err });
    }
}

const deleteData = async (req, res) => {
    try {
        const result = await MeetingHistory.findByIdAndUpdate(req.params.id, { deleted: true });
        res.status(200).json({ message: "done", result })
    } catch (err) {
        res.status(404).json({ message: "error", err })
    }
}

const deleteMany = async (req, res) => {
    try {
        const result = await MeetingHistory.updateMany({ _id: { $in: req.body } }, { $set: { deleted: true } });

        if (result?.matchedCount > 0 && result?.modifiedCount > 0) {
            return res.status(200).json({ message: "Meetings Removed successfully", result });
        }
        else {
            return res.status(404).json({ success: false, message: "Failed to remove meetings" })
        }

    } catch (err) {
        return res.status(404).json({ success: false, message: "error", err });
    }
}

module.exports = { add, index, view, deleteData, deleteMany }