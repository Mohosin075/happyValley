import { Model, Types } from 'mongoose';
import { SUPPORT_STATUS } from '../../../enum/support';

export interface ISupportFilterables {
  searchTerm?: string;
  subject?: string;
  message?: string;
}

export interface ISupport {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  bookingId?: Types.ObjectId;
  subject?: string;
  message: string;
  status: SUPPORT_STATUS;
  priority?: 'low' | 'medium' | 'high';
  attachments?: string[];
}

export type SupportModel = Model<ISupport, {}, {}>;
