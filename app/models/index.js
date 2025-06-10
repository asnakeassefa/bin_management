import { Sequelize } from "sequelize";
import config from "../config/config.js";
import userModel from "./user_model.js";
import binTypeModel from "./bin_type_model.js";
import userBinModel from "./user_bin_model.js";
import countryModel from "./country_model.js";
import holidayModel from "./holiday_model.js";
import otpModel from "./otp_model.js";

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging ? console.log : false,
    pool: config.database.pool,
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
db.Country = countryModel(sequelize, Sequelize);
db.Holiday = holidayModel(sequelize, Sequelize);
db.OTP = otpModel(sequelize, Sequelize);

// Define associations
db.User.hasMany(db.UserBin, { foreignKey: "userId" });
db.UserBin.belongsTo(db.User, { foreignKey: "userId" });

// db.Country.hasMany(db.Holiday, { foreignKey: "countryCode" });
// db.Holiday.belongsTo(db.Country, { foreignKey: "countryCode" });

// db.User.belongsTo(db.Country, { foreignKey: "country", targetKey: "code" });
// db.Country.hasMany(db.User, { foreignKey: "country", sourceKey: "code" });

db.User.hasMany(db.OTP, { foreignKey: "userId" });
db.OTP.belongsTo(db.User, { foreignKey: "userId" });
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
export const { User, BinType, UserBin, Country, Holiday, OTP } = db;
