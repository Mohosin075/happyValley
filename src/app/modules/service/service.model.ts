import { Schema, model } from 'mongoose';
import { IService, ServiceModel } from './service.interface'; 

const serviceSchema = new Schema<IService, ServiceModel>({
  name: { type: String , required: true}, 
  description: { type: String },
  servicesProvided: { type: [String] },
  occasions: { type: [String] },
}, {
  timestamps: true
});

export const Service = model<IService, ServiceModel>('Service', serviceSchema);
