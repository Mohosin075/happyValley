import { Schema, model } from 'mongoose'
import { IService, ServiceModel } from './service.interface'

const serviceSchema = new Schema<IService, ServiceModel>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    description: { type: String, required: true },
    servicesProvided: { type: [String], required: true },
    occasions: { type: [String], required: true },
  },
  {
    timestamps: true,
  },
)

export const Service = model<IService, ServiceModel>('Service', serviceSchema)
