import { Model, Types } from 'mongoose'

export interface IServiceFilterables {
  searchTerm?: string
  name?: string
  description?: string
}

export interface IService {
  _id: Types.ObjectId
  createdBy: Types.ObjectId
  name: string
  description?: string
  servicesProvided: string[]
  occasions?: string[]
}

export type ServiceModel = Model<IService, {}, {}>
