import Constants from 'expo-constants';

const ENV = {
  development: {
    apiUrl: 'https://pleasing-determination-production.up.railway.app',
    apiBaseUrl: 'https://pleasing-determination-production.up.railway.app/api',
    debug: true,
  },
  staging: {
    apiUrl: 'https://staging.yourbackend.com',
    apiBaseUrl: 'https://staging.yourbackend.com/api',
    debug: true,
  },
  production: {
    apiUrl: 'https://your-production-backend.com',
    apiBaseUrl: 'https://your-production-backend.com/api',
    debug: false,
  }
};

const getEnvVars = (env = Constants.expoConfig?.releaseChannel) => {
  if (__DEV__) {
    return ENV.development;
  }
  
  if (env === 'staging') {
    return ENV.staging;
  }
  
  return ENV.production;
};

export default getEnvVars();
