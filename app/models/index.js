import { Sequelize } from "sequelize";
import config from "../../config/config.js";
import userModel from "./user_model.js";
import binTypeModel from "./bin_type_model.js";
import userBinModel from "./user_bin_model.js";

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    dialect: config.development.dialect,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Initialize models
db.User = userModel(sequelize, Sequelize);
db.BinType = binTypeModel(sequelize, Sequelize);
db.UserBin = userBinModel(sequelize, Sequelize);

// Define associations
db.User.hasMany(db.UserBin, { foreignKey: "userId" });
db.UserBin.belongsTo(db.User, { foreignKey: "userId" });


// Test database connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection success");
  })
  .catch((err) => {
    console.error("Connection failed:", err);
  });

// Sync all models with database
sequelize
  .sync() // Set to true to drop tables on each sync
  .then(() => {
    console.log("Database & tables created!");
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });

export default db;
export const { User, BinType, UserBin } = db;
