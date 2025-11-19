import { Schema, model } from 'mongoose'
import { IAgreement, AgreementModel } from './agreement.interface'

const agreementSchema = new Schema<IAgreement, AgreementModel>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String },
    date: { type: Date },
    signatureUrl: { type: String },
    propertyAddress: { type: String },
    status: { type: String },
  },
  {
    timestamps: true,
  },
)

export const Agreement = model<IAgreement, AgreementModel>(
  'Agreement',
  agreementSchema,
)
