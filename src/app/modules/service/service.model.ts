import { Schema, model } from 'mongoose'
import { IService, ServiceModel } from './service.interface'

const serviceSchema = new Schema<IService, ServiceModel>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    staff: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    servicesProvided: { type: [String], required: true },
    occasions: { type: [String], default: [] },
    serviceType: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    fields: [
      {
        name: { type: String, required: true },
        type: { type: Schema.Types.Mixed, required: true }, // can store string, number, boolean
        label: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Indexes for faster search
serviceSchema.index({ name: 1 })
serviceSchema.index({ servicesProvided: 1 })
serviceSchema.index({ 'serviceType.title': 1 })
serviceSchema.index({ 'fields.name': 1 })

export const Service = model<IService, ServiceModel>('Service', serviceSchema)
