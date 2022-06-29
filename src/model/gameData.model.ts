import { getModelForClass, prop } from '@typegoose/typegoose';

export class GameData {
  @prop({ required: true, unique: true })
  appid: number;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  image: string;

  @prop({ required: true })
  reviews: number;
}

const GameDataModel = getModelForClass(GameData);

export default GameDataModel;
