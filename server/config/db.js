import mongoose from 'mongoose';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if unable to set servers
}

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/pos';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
