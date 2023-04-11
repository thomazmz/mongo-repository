import { Entity } from "@thomazmz/core-context";

export type MongoTestEntity = Entity & {
  dateProperty: Date,
  numberProperty: number,
  stringProperty: string,
  booleanProperty: boolean,
}