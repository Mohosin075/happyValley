import { Model, Types } from 'mongoose';

export interface IReferralFilterables {
  searchTerm?: string;
  yourName?: string;
  referralName?: string;
  referralEmail?: string;
  referralPhone?: string;
  notes?: string;
}

export interface IReferral {
  _id: Types.ObjectId;
  yourName: string;
  referralName: string;
  referralEmail?: string;
  referralPhone?: string;
  notes?: string;
  referredBy: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
}

export type ReferralModel = Model<IReferral, {}, {}>;
