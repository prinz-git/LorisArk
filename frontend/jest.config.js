const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^.+\\.(css|scss|sass)$": "identity-obj-proxy",
  },
  testMatch: ["<rootDir>/tests/**/*.(test|spec).(js|jsx|ts|tsx)"],
};

module.exports = createJestConfig(customJestConfig);
