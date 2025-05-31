
export default {
    development: {
      username:'bin_db_user',
      password: 'RwbUlinnUeT7Ki2drtMqTRWzEFRnq65a',
      database: 'bin_db',
      host: 'dpg-d0rmkqruibrs73a275s0-a.oregon-postgres.render.com',
      port: 5432,
      dialect: 'postgres',
      jwt: {
        secret: 'your-super-secret-key-here', // You should change this to a secure random string
        expiresIn: '3m'// 3 minutes
      }
    }
  };