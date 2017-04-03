function InvalidRoleError (code, error) {
  Error.call(this, error.message);
  Error.captureStackTrace(this, this.constructor);
  this.name = "InvalidRoleError";
  this.message = error.message;
  this.code = code;
  this.status = 400;
  this.inner = error;
}

InvalidRoleError.prototype = Object.create(Error.prototype);
InvalidRoleError.prototype.constructor = InvalidRoleError;

module.exports = {
  "InvalidRoleError": InvalidRoleError
};