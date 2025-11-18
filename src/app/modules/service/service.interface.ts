import { Model, Types } from 'mongoose'

export interface IServiceFilterables {
  searchTerm?: string
  name?: string
  description?: string
}

export interface IService {
  _id: Types.ObjectId
  createdBy: Types.ObjectId
  staff: Types.ObjectId[]
  name: string
  description?: string
  servicesProvided: string[]
  occasions?: string[]
  serviceType: [
    {
      title: string 
      description: string
    },
  ]
  fields: [ 
    {
      name: string
      type: string | number | boolean
      label: string  
    },
  ]
}

export type ServiceModel = Model<IService, {}, {}>
