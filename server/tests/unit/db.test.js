/** config/db.js — connection helper (previously 0% coverage). */
jest.mock('mongoose', () => ({
  set: jest.fn(),
  connect: jest.fn().mockResolvedValue(),
  connection: { name: 'mock-connection' }
}));

const mongoose = require('mongoose');
const connectDb = require('../../src/config/db');

describe('connectDb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('refuses to start without MONGO_URI', async () => {
    await expect(connectDb(undefined)).rejects.toThrow('MONGO_URI is not set');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('connects with strictQuery on and returns the connection', async () => {
    const conn = await connectDb('mongodb://localhost:27017/booknest');
    expect(mongoose.set).toHaveBeenCalledWith('strictQuery', true);
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/booknest');
    expect(conn).toEqual({ name: 'mock-connection' });
  });

  it('propagates a connection failure', async () => {
    mongoose.connect.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(connectDb('mongodb://bad')).rejects.toThrow('ECONNREFUSED');
  });
});
