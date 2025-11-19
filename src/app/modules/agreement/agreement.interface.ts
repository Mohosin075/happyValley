import { Model, Types } from 'mongoose';

export interface IAgreementFilterables {
  searchTerm?: string;
  clientName?: string;
  signatureUrl?: string;
  propertyAddress?: string;
}

export interface IAgreement {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;
  clientName: string;
  date: Date;
  signatureUrl: string;
  propertyAddress: string;
  status: string;
}

export type AgreementModel = Model<IAgreement, {}, {}>;
