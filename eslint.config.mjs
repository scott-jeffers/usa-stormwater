import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["data/**", "out/**", ".next/**"],
  },
];

export default eslintConfig;
