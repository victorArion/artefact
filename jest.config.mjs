import nextJest from "next/jest.js";

export default nextJest({ dir: "./" })({
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
});
