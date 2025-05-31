export default (sequelize, DataTypes) => {
  return sequelize.define("User", {
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    deviceToken: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Firebase device token for push notifications'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    refreshTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });
};
