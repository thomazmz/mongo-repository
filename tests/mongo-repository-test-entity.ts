export type MongoTestEntity = {
  readonly id: string,
  readonly createdAt: Date,
  readonly updatedAt: Date,
  readonly dateProperty: Date,
  readonly numberProperty: number,
  readonly stringProperty: string,
  readonly booleanProperty: boolean,
  readonly optionalDateProperty?: Date,
  readonly optionalNumberProperty?: number,
  readonly optionalStringProperty?: string,
  readonly optionalBooleanProperty?: boolean,
}