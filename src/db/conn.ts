import config from '../config/default';
import mongoose from 'mongoose';

const connectToDb = async (): Promise<void> => {
  const dbUri = config.mongodb_uri;
  try {
    await mongoose.connect(dbUri);
  } catch (error) {
    process.exit(1);
  }
};

export default connectToDb;
