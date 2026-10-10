# IT Asset Management System

## Project Overview

## Features

## Tech Stack

## Architecture

## ERD Diagram

## Installation

## Environment Variables

## Authentication Flow

## Role Authorization

## API Endpoints

## Project Structure

## Deployment Guide

## Security Features

## Logging

## Project Status

IT Asset Management System is a backend application designed to track and manage IT assets, users, assignments, and asset lifecycle operations.

The system provides:

- Secure authentication
- Role-based authorization
- Asset tracking
- Assignment history
- Dashboard statistics
- Request validation
- API documentation
- Logging and monitoring

### Features

#### Authentication

- User Registration
- User Login
- JWT Authentication
- Protected Routes

#### Authorization

Supported Roles:

- ADMIN
- IT_ENGINEER
- IT_SUPPORT
- EMPLOYEE

#### Asset Management

- Create Asset
- Read Asset
- Update Asset
- Delete Asset

#### Assignment Management

- Assign Asset
- Return Asset
- Assignment History

#### Dashboard

- Total Users
- Total Assets
- Available Assets
- Assigned Assets

### Tech Stack

Backend:

- Node.js
- Express.js
- TypeScript

Database:

- PostgreSQL
- Prisma ORM

Security:

- JWT
- bcryptjs
- Helmet
- Express Rate Limit

Validation:

- Zod

Documentation:

- Swagger UI
- Swagger JSDoc

## Architecture Diagram

Client
   |
   v
Express API
   |
   v
Controllers
   |
   v
Prisma ORM
   |
   v
PostgreSQL


## Database ERD

Department (1)
      |
      |----< User (*)

User (1)
      |
      |----< AssetAssignment (*)

Asset (1)
      |
      |----< AssetAssignment (*)


## Docker Deployment Diagram

Docker Desktop
      |
      |
Backend Container
(Node.js + Express)
      |
      |
PostgreSQL Container


## Authentication Flow

Register
   |
Hash Password
   |
Store User

Login
   |
Verify Password
   |
Generate JWT
   |
Access Protected Routes

