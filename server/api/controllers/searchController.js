const TextModel = require('../models/textModel');

const searchRecords = async (req, res) => {
  try {
    const { startDate, endDate, keywords } = req.body;
    const records = await TextModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
      keywords: { $in: keywords },
    });

    res.status(200).json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching for records.' });
  }
};

module.exports = { searchRecords };
