/**
 * User Model Definition
 * Sequelize model for the users table
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from '../../../shared/types';

// Mock model imports for associations (these represent other models in the system)
const OrderModel: any = Model;
const PaymentModel: any = Model;
const AddressModel: any = Model;
const ReviewModel: any = Model;
const SupportTicketModel: any = Model;
const AuditLogModel: any = Model;
const ProductModel: any = Model;
const MerchantAccountModel: any = Model;

// Attributes for model creation (optional fields)
interface UserCreationAttributes extends Optional<User, 'id' | 'firstName' | 'lastName' | 'lastLoginAt' | 'profilePicture' | 'bio' | 'preferences'> {
  // ERROR 295: Type incompatibility - model has passwordHash but shared User type doesn't
  passwordHash: string;
}

// User model class
export class UserModel extends Model<User, UserCreationAttributes> implements User {
  public id!: any; // Matches the flawed shared type
  public username!: string;
  public email!: string;
  public firstName?: string;
  public lastName?: string;
  public createdAt!: any;
  public updatedAt!: Date;
  public isActive!: boolean;
  public role!: 'admin' | 'user' | 'moderator';
  public lastLoginAt?: Date;
  public emailVerified!: boolean;
  public profilePicture?: string;
  public bio?: string;
  public preferences?: any;
  
  // Additional field not in the interface
  public passwordHash!: string;
  
  // ERROR 297: profileData field with untyped JSONB
  public profileData!: any;
  
  // Timestamps
  public readonly deletedAt?: Date;
}

// Initialize the model
UserModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    // ERROR 294: email allows null despite being required in most user schemas
    email: {
      type: DataTypes.STRING,
      allowNull: true, // Should be false for a user email
      // ERROR 296: No unique constraint and no index on frequently queried email field
      // unique: true,  // Commented out - missing unique constraint
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'moderator'),
      defaultValue: 'user',
      allowNull: false
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500]
      }
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    // ERROR 297: Untyped JSONB field for arbitrary profile data
    profileData: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Stores arbitrary profile information without schema validation'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft deletes
    underscored: false,
    indexes: [
      // Only indexing username, not email despite email being frequently queried
      {
        fields: ['username']
      },
      {
        fields: ['role', 'isActive']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        // Hook that doesn't actually do anything useful
        console.log(`Creating user: ${user.username}`);
      }
    }
  }
);

// Define associations (to be called after all models are loaded)
export function defineUserAssociations(): void {
  /**
   * ERROR 383: CATASTROPHIC DATA LOSS - Cascade Delete Chain of Destruction
   * 
   * These associations use CASCADE delete which creates a chain reaction
   * that can wipe out massive amounts of data from a single user deletion.
   * 
   * Scenario: Admin accidentally deletes a user account
   * Result: EVERYTHING related to that user is instantly destroyed:
   * - All orders (including completed/shipped ones)
   * - All payment records (financial data loss)
   * - All support tickets (customer service history gone)
   * - All reviews (product ratings affected)
   * - All addresses (shipping information lost)
   * - All notifications (audit trail destroyed)
   * - All sessions (security logs wiped)
   * - All audit logs (compliance violation)
   * 
   * Real-world impact:
   * - One accidental user deletion can destroy years of business data
   * - No way to recover deleted data (not soft delete)
   * - Violates data retention requirements
   * - Can affect other users (shared resources)
   * - Financial records permanently lost
   * - Legal compliance issues
   * 
   * This is one of the most dangerous database configurations possible!
   */
  
  // CATASTROPHIC: Deleting user deletes ALL their orders (including historical)
  UserModel.hasMany(OrderModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',  // ERROR 383: Should be 'SET NULL' or 'RESTRICT'
    onUpdate: 'CASCADE',
    as: 'orders'
  });
  
  // DANGEROUS: Deletes all payment records (financial data loss!)
  UserModel.hasMany(PaymentModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',  // Destroys financial audit trail
    as: 'payments'
  });
  
  // BAD: Deletes all addresses (shipping history gone)
  UserModel.hasMany(AddressModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',  // Shipping information permanently lost
    as: 'addresses'
  });
  
  // TERRIBLE: Deletes all reviews (affects product ratings)
  UserModel.hasMany(ReviewModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',  // Product reviews disappear
    as: 'reviews'
  });
  
  // AWFUL: Deletes all support tickets (customer service history)
  UserModel.hasMany(SupportTicketModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',  // Support history vanishes
    as: 'supportTickets'
  });
  
  // COMPLIANCE VIOLATION: Deletes audit logs
  UserModel.hasMany(AuditLogModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',  // Audit trail destroyed - regulatory violation!
    as: 'auditLogs'
  });
  
  // Chain reaction through join tables
  UserModel.belongsToMany(ProductModel, {
    through: 'user_favorites',
    foreignKey: 'userId',
    onDelete: 'CASCADE',  // Removes from all users' favorites
    as: 'favoriteProducts'
  });
  
  // Even worse: Cascading to related entities
  UserModel.hasOne(MerchantAccountModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',  // Deletes entire merchant account!
    as: 'merchantAccount'
  });
  
  // And merchant account has its own cascades...
  // This creates a cascade chain that can delete:
  // User -> MerchantAccount -> Products -> Inventory -> Orders -> Payments
  // One user deletion could wipe out an entire store!
}