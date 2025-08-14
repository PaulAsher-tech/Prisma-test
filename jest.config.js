module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', 'src/__tests__/api/'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react-jsx',
      },
    },
  },
};
