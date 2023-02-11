const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
	email: {
		type: String,
		required: [true, 'Please provide your email'],
		unique: true,
		lowercase: true,
		validate: [validator.isEmail, 'Please enter a valid email address'],
	},
	photo: String,
	role: {
		type: String,
		enum: {
			values: ['user', 'admin'],
			message: 'Enter a valid user role (user,admin)',
		},
		default: 'user',
	},
	password: {
		type: String,
		required: [true, 'Please provide a password'],
		minLength: 8,
		select: false,
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
		validate: {
			// this only works on save
			validator: function (el) {
				return el === this.password;
			},
			message: 'The passwords do not match!!',
		},
	},
	passwordChangedAt: Date,
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false,
	},
});

userSchema.pre('save', async function (next) {
	// only run this function if the password is modified
	if (!this.isModified('password')) return next();

	// encrypt the password save to the db
	this.password = await bcrypt.hash(this.password, 12);

	// delete the password confirm field
	this.passwordConfirm = undefined;

	next();
});

userSchema.pre(/^find/, async function (next) {
	this.find({ active: { $ne: false } });
	next();
});

userSchema.pre('save', async function (next) {
	if (!this.isModified('password') || this.isNew) return next();

	this.passwordChangedAt = Date.now() - 1000;

	next();
});

// An instance method that can be called on other files
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
	if (this.passwordChangedAt) {
		const changedTimestamp = parseInt(
			this.passwordChangedAt.getTime() / 1000,
			10
		);

		return JWTTimestamp < changedTimestamp;
	}
	// false means not changed
	return false;
};

// An instance method that can be called on other files
userSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto
		.createHash('sha256')
		.update(resetToken)
		.digest('hex');

	console.log({ resetToken }, this.passwordResetToken);

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

	return resetToken;
};

userSchema.methods.decomissionPasswordResetToken = function () {
	this.passwordResetToken = undefined;
	this.passwordResetExpires = undefined;
};

// userSchema.post(/^find/, function name(next) {
// 	this.password:{
// 		select:false;
// 	}
// });

const User = mongoose.model('User', userSchema);

module.exports = User;
