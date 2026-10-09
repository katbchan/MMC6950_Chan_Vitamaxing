
import { Schema, model, models } from 'mongoose'
import bcrypt from 'bcrypt'

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 200
  },
  supplements: {
    type: [{
      dsldId: { type: String, required: true },
      fullName: { type: String, required: true },
      brandName: { type: String, default: '' },
      form: { type: String, default: '' },
      servingSize: { type: String, default: '' },
      ingredients: [{
        name: { type: String, required: true },
        ingredientId: { type: String, default: '' },
        quantity: { type: Number, default: null },
        unit: { type: String, default: '' }
      }],
      otherIngredients: [{ type: String }]
    }],
    default: []
  }
})

// Hash the password before it's stored in MongoDB.
UserSchema.pre('save', async function(next) {
  if (this.isNew)
    this.password = await bcrypt.hash(this.password, 10)
  next()
})

export default models.User || model('User', UserSchema)
