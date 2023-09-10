import { model, Schema } from 'mongoose';

const name = 'Shop';
export default model(name, new Schema({}), name);
