import { Model, Types } from 'mongoose'
import { SERVICE_STATUS } from '../../../enum/service'

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
  image?: string
  servicesProvided: string[]
  occasions?: string[]
  status?: SERVICE_STATUS
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
