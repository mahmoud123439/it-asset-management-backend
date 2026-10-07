import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "IT Asset Management API",
      version: "1.0.0",
      description: "IT Asset Management System API"
    }
  },
  apis: []
};

export const swaggerSpec = swaggerJsdoc(options);
