const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log(`Conectado com sucesso ao MongoDb: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`Erro de conexão ao MongoDb: ${error.message}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT
const SESSION_SECRET = process.env.SESSION_SECRET
const MONGO_URL = process.env.MONGO_URL

module.exports = {
  connection,
  PORT,
  SESSION_SECRET,
  MONGO_URL
};