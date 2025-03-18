# Task Management System

A robust and scalable REST API for managing tasks with priority-based scheduling, built with Node.js, Express, and MongoDB.

## Live Demo

The API is deployed and accessible at: [https://task-management-system-mc8v.onrender.com](https://task-management-system-mc8v.onrender.com)

## Features

- **User Authentication**: Secure JWT-based authentication system
- **Task Management**: Complete CRUD operations for tasks
- **Priority Queue**: Efficient task scheduling using priority queue data structure
- **Filtering & Pagination**: Filter tasks by priority, status with paginated results
- **Caching**: Redis-powered caching for improved performance
- **RESTful API**: Well-structured API endpoints following REST principles

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: Redis
- **Data Structures**: Priority Queue for task scheduling
- **Deployment**: Render

## API Endpoints

### Authentication

- `POST /user/signup` - Register a new user
- `POST /user/login` - Login and get JWT token

### Task Management

- `GET /task/get-all` - Get all tasks (with pagination and filtering)
- `GET /get-task/:id` - Get a specific task by ID
- `POST /task/create` - Create a new task
- `PUT /task/update/:id` - Update an existing task
- `DELETE /task/delete/:id` - Delete a task

## Task Scheduling Algorithm

The system implements an efficient scheduling algorithm using a priority queue data structure. Tasks are ordered based on:

1. **Priority Level**: High > Medium > Low
2. **Creation Date**: Newer tasks are prioritized within the same priority level

This ensures that high-priority tasks are always processed first, while also maintaining fairness for newer tasks.

## Data Models

### User Model

```javascript
{
  name: String,
  email: String,
  password: String (hashed),
  tasks: [TaskIDs]
}
```

### Task Model

```javascript
{
  title: String,
  description: String,
  status: String (pending/completed),
  priority: String (low/medium/high),
  createdBy: UserID
}
```

## Performance Optimizations

- **Redis Caching**: Tasks are cached to minimize database queries
- **Priority Queue**: Efficient O(log n) operations for task scheduling

## Architecture

The application follows a modular architecture:

- **Routes**: Define API endpoints
- **Controllers**: Handle business logic
- **Models**: Define data structure
- **Middleware**: Handle authentication and request processing
- **Utils**: Contains priority queue implementation and helper functions
