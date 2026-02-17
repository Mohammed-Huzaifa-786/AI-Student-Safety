import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    try {
      const db = mongoose.connection.db;
      const coll = db.collection('users');
      const indexes = await coll.indexes();
      const userIdIndex = indexes.find(i => i.key && i.key.userId);
      if (userIdIndex) {
        console.log('Found legacy userId index, attempting to drop:', userIdIndex.name);
        try {
          await coll.dropIndex(userIdIndex.name);
          console.log('Dropped legacy userId index');
        } catch (dropErr) {
          console.warn('Could not drop userId index:', dropErr?.message || dropErr);
        }
      }
    } catch (idxErr) {
      console.warn('Index cleanup skipped or failed:', idxErr?.message || idxErr);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
