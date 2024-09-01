Assignment 1 - Web Server - Response to Criteria
================================================

Overview
------------------------------------------------

- **Name:** Keisuke Tarusawa
- **Student number:** n11373466
- **Application name:** Video Transcoder
- **Two line description:**  Convert your mp4s to any format of your choice!


Core criteria
------------------------------------------------

### Docker image

- **ECR Repository name:** n11373466-tut2
- **Video timestamp:** 00:18
- **Relevant files:**
    - /Dockerfile

### Docker image running on EC2

- **EC2 instance ID:** i-0899bd134bef1d8b8
- **Video timestamp:** 00:50

### User login functionality

- **One line description:** User management systems with Register function. Using JWTs for sessions.
- **Video timestamp:** 01:34
- **Relevant files:**
    - /authMiddleware.js
    - /authRoutes.js

### User dependent functionality

- **One line description:** Video metadata are owned by a user. They can read and download past converted videos they own.
- **Video timestamp:** 02:30
- **Relevant files:**
    - /apiRoutes.js 135, 145

### Web client

- **One line description:** Single page application using React
- **Video timestamp:** 01:25
- **Relevant files:**
    - /client/src

### REST API

- **One line description:** REST API with endpoints (register, login, logout, convert, history, download, reconvert) and HTTP methods (GET, POST), and appropriate status codes
- **Video timestamp:** 03:00
- **Relevant files:**
    - /authRoutes
    - /apiRoutes

### Two kinds of data

#### First kind

- **One line description:** Video files
- **Type:** Unstructured
- **Rationale:** Videos are too large for database.  No need for additional functionality.
- **Video timestamp:** 03:33
- **Relevant files:**
    - /apiRoutes 51, 145, 170

#### Second kind

- **One line description:** File metadata, user ownership of videos
- **Type:** Structured, no ACID requirements
- **Rationale:** Need to be able to query for user and video data.  Low chance of multiple writes to single file or user data.
- **Video timestamp:** 03:33
- **Relevant files:**
  - /apiRoutes 51, 135, 145, 170

### CPU intensive task

- **One line description:** Uses ffmpeg to convert mp4s to different formats.
- **Video timestamp:** 01:46
- **Relevant files:**
    - /apiRoutes 51, 170

### CPU load testing method

- **One line description:** Node script to continuously generate requests to reconvert endpoint
- **Video timestamp:** 04:10
- **Relevant files:** /generate_load.js
    - 

Additional criteria
------------------------------------------------

### Extensive REST API features

- **One line description:** Use of middleware for advanced HTTP headers
- **Video timestamp:**
- **Relevant files:**
    - 


### Use of external API(s)

- **One line description:** Not attempted
- **Video timestamp:** 01:35
- **Relevant files:**
    - /authMiddleware.js


### Extensive web client features

- **One line description:** Single page application
- **Video timestamp:** 01:25
- **Relevant files:**
    - /client/src


### Sophisticated data visualisations

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 


### Additional kinds of data

- **One line description:** Support 3 convert output format "avi, mov, webm"
- **Video timestamp:** 03:55
- **Relevant files:**
    - /apiRoutes 51, 170


### Significant custom processing

- **One line description:** Not attempted
- **Video timestamp:**
- **Relevant files:**
    - 


### Live progress indication

- **One line description:** Live Indication bar to show the progress of video convertion
- **Video timestamp:** 02:08
- **Relevant files:**
    - /client/src/pages/VideoTranscodingPage.jsx 22
    - /index.js 25


### Infrastructure as code

- **One line description:** Using Docker compose for application and Mongo containers.
- **Video timestamp:** 00:35
- **Relevant files:**
    - /docker-compose.yml


### Other

- **One line description:** Not attempted
- **Video timestamp:** 
- **Relevant files:**
    - 
